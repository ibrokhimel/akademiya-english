import io, json, os, pathlib, re, subprocess, sys, time, xml.etree.ElementTree as ET
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
ADB = r'C:/Users/User/AppData/Local/Android/Sdk/platform-tools/adb.exe'
PACKAGE = 'ai.akademiya.english'
PHASE = os.environ.get('AUDIT_PHASE', 'before')
OUT = ROOT / '.expo' / 'visual-parity' / PHASE / 'android'
OUT.mkdir(parents=True, exist_ok=True)
CASES = json.loads((ROOT / 'src/audit/cases.json').read_text(encoding='utf-8'))
SELECTED = set(sys.argv[1:])
if PHASE != 'before' and os.environ.get('AUDIT_PRIORITY') == '1':
    priority = ['exercise-meet','exercise-heard','feedback-wrong','moment-result','checkpoint-result-0','moment-streak','moment-level','calendar-full','settings','recordings-full','feedback-form-empty','confidence-improved','problem-mic-blocked','problem-error']
    CASES.sort(key=lambda entry: priority.index(entry['id']) if entry['id'] in priority else len(priority))


def adb(*args):
    return subprocess.check_output([ADB, *args], text=True, encoding='utf-8', errors='replace', timeout=35)

def tap_xy(x, y):
    adb('shell', 'input', 'tap', str(int(x)), str(int(y)))
    time.sleep(.15)

def hierarchy(name):
    remote = '/data/local/tmp/akademiya-audit-' + name + '.xml'
    result = adb('shell', 'uiautomator', 'dump', remote)
    if 'ERROR' in result: raise RuntimeError(result)
    return ET.fromstring(adb('exec-out', 'cat', remote))

def tap(label, name, by_id=False, scroll=False):
    # Read measured native button bounds first. Unlike UIAutomator's idle wait,
    # this works while microphone halos or the current-lesson ring are moving.
    key=re.sub(r'-(second|check)$','',name)
    measured=OUT/(key+'.layout.json')
    for _ in range(30 if by_id else 1):
        if measured.exists() and not scroll:
            entries=json.loads(measured.read_text(encoding='utf-8')).get('entries',[])
            for e in sorted(entries,key=lambda e:e.get('kind')!='button'):
                if ((e.get('id')==label) if by_id else e.get('text')==label) and not e.get('disabled'):
                    if 34 <= e.get('y',-1) < 765:
                        tap_xy((e['x']+e['width']/2)*2,(e['y']+e['height']/2)*2)
                        return
        if by_id: time.sleep(.1)
    for attempt in range(3 if scroll else 1):
        tree = hierarchy(name + '-' + str(attempt))
        parents = {c:p for p in tree.iter() for c in p}
        for el in tree.iter('node'):
            matches = el.get('resource-id','').endswith(label) if by_id else label in (el.get('text'), el.get('content-desc'))
            if matches and el.get('enabled')=='true':
                while el.get('clickable')!='true' and el in parents: el=parents[el]
                if el.get('clickable')!='true': continue
                box=list(map(int,re.findall(r'\d+',el.get('bounds',''))))
                if len(box)==4:
                    tap_xy((box[0]+box[2])/2,(box[1]+box[3])/2)
                    return
        if scroll:
            adb('shell','input','swipe','360','1250','360','650','350');time.sleep(.25)
    raise RuntimeError('Missing control '+label)

def state(entry, name):
    c=entry['native']; action=c.get('action'); kind=c['kind']
    if c.get('scroll') and os.environ.get('AUDIT_AUTOSCROLL')!='1':
        for _ in range(5 if c['scroll']=='bottom' else 1):
            adb('shell','input','swipe','360','1250','360','550','350')
        time.sleep(.3)
    if kind=='settings' and action=='logout':tap('Chiqish',name,scroll=True)
    if kind=='settings' and action=='delete' or c.get('control')=='dialog':tap("Hisobni o'chirish",name,scroll=True)
    if action=='previous':tap('Oldingi oy',name)
    if kind=='recordings' and action=='delete-one':tap("O'chirish",name)
    if kind=='recordings' and action=='delete-all':tap("BARCHA YOZUVLARNI O'CHIRISH" if PHASE != "before" else "HAMMA YOZUVLARNI O'CHIRISH",name)
    if kind=='feedback' and action=='filled':
        if PHASE != 'before':tap('Javob xato',name)
        tap('Fikringiz',name);adb('shell','input','text','Visual%saudit%stest%sdraft');adb('shell','input','keyevent','4');time.sleep(.3)
    if kind=='exercise':
        if action=='tiles-selected':
            tap('bank-0',name,True);tap('bank-1',name+'-second',True)
        if action=='fix-selected':tap('word-0',name,True)
        if action=='gap-selected':tap('gap-0',name,True)
        if action=='heard-selected':tap('heard-0',name,True)
    if PHASE=='before' and kind=='account' and action=='provider':tap('GOOGLE ORQALI',name)
    if PHASE=='before' and kind=='problem' and entry['id'] in ('problem-mic-blocked','problem-speech-unavailable'):
        tap('speak',name,True);time.sleep(.4)
    if PHASE=='before' and kind=='problem' and entry['id']=='problem-not-ready':tap("DO'ST QO'SHISH",name)

def dismiss_dialog(name):
    # RN Alert is non-cancelable by default: Back can leave it above the next
    # screen. Select only explicit safe/cancel buttons, never a destructive one.
    tree = hierarchy(name + '-dismiss')
    safe = ('BEKOR QILISH', 'OK', 'YANA URINISH', "SO'ZLARNI TANLASH")
    buttons = [n for n in tree.iter('node') if n.get('class') == 'android.widget.Button']
    for label in safe:
        for button in buttons:
            if button.get('text') == label:
                box=list(map(int,re.findall(r'\d+',button.get('bounds',''))))
                tap_xy((box[0]+box[2])/2,(box[1]+box[3])/2)
                time.sleep(.25)
                return
    # After the native dialogs are replaced with custom dialogs, Back closes
    # the app's sheet/dialog without confirming its destructive action.
    adb('shell','input','keyevent','4')
    time.sleep(.25)

log_path=OUT/'capture-log.json'
results=json.loads(log_path.read_text(encoding='utf-8')) if log_path.exists() else []
adb('reverse','tcp:8792','tcp:8792')
adb('shell','am','force-stop',PACKAGE)
for dark in (False,True):
    for entry in CASES:
        if SELECTED and entry['id'] not in SELECTED:continue
        name=entry['id']+('-dark' if dark else '-light')
        if (OUT/(name+'.png')).exists() and os.environ.get('AUDIT_RECAPTURE')!='1':continue
        row={'id':entry['id'],'dark':dark,'dialog':entry['id'] in ('settings-logout','settings-delete','recordings-delete-one','recordings-delete-all','login-no-account','control-dialog','problem-mic-blocked','problem-speech-unavailable','problem-not-ready')}
        try:
            if os.environ.get('AUDIT_COLD')=='1': adb('shell','am','force-stop',PACKAGE)
            uri="'akademiya:///visual-audit?id="+entry['id']+'&dark='+('1' if dark else '0')
            if entry['native'].get('mode'):uri+='&mode='+entry['native']['mode']
            uri+="'"
            adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d',uri,PACKAGE)
            time.sleep(max(float(os.environ.get('AUDIT_SETTLE','2')),6 if entry['native'].get('exercise')=='heard' else 3 if entry['native']['kind']=='moment' else 2))
            state(entry,name)
            time.sleep(1.2 if row.get("dialog") else .4)
            focus=adb('shell','dumpsys','window')
            if not re.search(r'mCurrentFocus=Window\{[^\r\n]*'+re.escape(PACKAGE)+'/',focus):raise RuntimeError('App is not foreground')
            png=subprocess.check_output([ADB,'exec-out','screencap','-p'],timeout=20)
            image=Image.open(io.BytesIO(png));assert image.size==(720,1640),image.size
            (OUT/(name+'.png')).write_bytes(png)
            row['status']='captured'
            row['layoutCaptured']=(OUT/(name+'.layout.json')).exists()
            row['dialog']=entry['id'] in ('settings-logout','settings-delete','recordings-delete-one','recordings-delete-all','login-no-account','control-dialog','problem-mic-blocked','problem-speech-unavailable','problem-not-ready')
            if PHASE=='before' and entry['native']['kind']=='problem' and entry['id'] in ('problem-offline','problem-not-found','problem-error'):
                row['missingScreen']=True
                row['note']='This custom problem screen is absent in the current Android implementation; captured its current owning screen.'
            print('ANDROID '+name+' captured'+(' (screen missing)' if row.get('missingScreen') else ''),flush=True)
        except Exception as e:
            row['status']='failed';row['error']=str(e)
            try:
                (OUT/(name+'.error.png')).write_bytes(subprocess.check_output([ADB,'exec-out','screencap','-p'],timeout=8))
            except Exception: pass
            print('ANDROID '+name+' FAILED '+str(e)[:180],flush=True)
        results=[previous for previous in results if (previous['id'],previous['dark']) != (row['id'],row['dark'])]
        results.append(row)
        log_path.write_text(json.dumps(results,indent=2),encoding='utf-8')
        if row.get('dialog') and os.environ.get('AUDIT_COLD')!='1':
            try: dismiss_dialog(name)
            except Exception as e:
                print('Could not dismiss '+name+': '+str(e)[:120],flush=True)
                # Restarting the capture process drops a stuck Android dialog
                # and its temporary fixture, preserving the user's real data.
                adb('shell','am','force-stop',PACKAGE)
print('Android pass complete: '+str(sum(r['status']=='captured' for r in results))+' captured, '+str(sum(r['status']=='failed' for r in results))+' failed',flush=True)
