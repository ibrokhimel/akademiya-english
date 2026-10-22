"""Build a local, navigable visual comparison from actual browser/device captures."""
import html
import json
import pathlib
import sys
from PIL import Image, ImageChops, ImageEnhance, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / '.expo/visual-parity'
CASES = json.loads((ROOT / 'src/audit/cases.json').read_text(encoding='utf-8'))
PHASE = sys.argv[1] if len(sys.argv) > 1 else 'before'
if PHASE == 'after':
    CASES += [{'id': name, 'group': 'completed answers', 'title': title, 'extendedCheck': True} for name, title in [
        ('speech-result-right', 'Spoken answer: correct'), ('speech-result-wrong', 'Spoken answer: correction'),
        ('exercise-heard-checked-right', 'Conversation transcript'), ('exercise-fix-checked-right', 'Corrected word'),
        ('exercise-gap-checked-right', 'Filled gap')]]

base = OUT / PHASE
notes_path = ROOT / ('scripts/visual-audit/results.json' if PHASE == 'after' else 'scripts/visual-audit/findings.json')
notes = json.loads(notes_path.read_text(encoding='utf-8')) if notes_path.exists() else {}
records = []
for dark in (False, True):
    theme = 'dark' if dark else 'light'
    for case in CASES:
        name = case['id'] + '-' + theme
        row = {**case, 'theme': theme, 'name': name, 'notes': notes.get(case['id'], [])}
        images = []
        for platform in ('browser', 'android'):
            source = base / platform / (name + '.png')
            target = base / 'normalized' / platform / (name + '.png')
            target.parent.mkdir(parents=True, exist_ok=True)
            row[platform] = source.exists()
            if not source.exists():
                images.append(None)
                continue
            im = Image.open(source).convert('RGB')
            if platform == 'android':
                # Redmi A5: 720x1640, status bar 68px, navigation bar 96px.
                im = im.crop((0, 68, 720, 1544)).resize((390, 800), Image.Resampling.LANCZOS)
            elif im.size == (390, 844):
                # The desktop prototype includes a blank 44px status-bar slot.
                # The Android system status bar is compared separately.
                im = im.crop((0, 44, 390, 844))
            else:
                row['viewportMismatch'] = True
            im.save(target)
            images.append(im)
        if all(images) and images[0].size == images[1].size:
            overlay = Image.blend(*images, .5)
            target = base / 'overlay' / (name + '.png')
            target.parent.mkdir(parents=True, exist_ok=True)
            overlay.save(target)
            diff = ImageEnhance.Contrast(ImageChops.difference(*images)).enhance(3)
            target = base / 'difference' / (name + '.png')
            target.parent.mkdir(parents=True, exist_ok=True)
            diff.save(target)
        records.append(row)

# A compact contact sheet is for coverage/visual review, never a substitute for
# the full-resolution image and individual component measurements.
for theme in ('light', 'dark'):
    rows = [r for r in records if r['theme'] == theme]
    folder = base / 'sheets'
    folder.mkdir(exist_ok=True)
    for start in range(0, len(rows), 9):
        chunk = rows[start:start+9]
        board = Image.new('RGB', (1002, 1101), '#e6e6eb')
        draw = ImageDraw.Draw(board)
        for i, r in enumerate(chunk):
            x, y = (i % 3) * 334, (i // 3) * 367
            draw.text((x+4, y+3), r['id'] + ' | browser / Android', fill='#111111')
            for col, platform in enumerate(('browser', 'android')):
                p = base / 'normalized' / platform / (r['name'] + '.png')
                if p.exists():
                    im = Image.open(p).convert('RGB')
                    im.thumbnail((160, 340))
                    board.paste(im, (x+4+col*164, y+23))
        board.save(folder / (theme + '-' + str(start//9+1).zfill(2) + '.jpg'), quality=92)

doc = '''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Akademiya visual parity</title>
<style>*{box-sizing:border-box}body{margin:0;font:15px system-ui;background:#f2f2f5;color:#20202a}header{position:sticky;top:0;z-index:2;padding:12px 20px;background:#fff;border-bottom:1px solid #ddd;display:flex;gap:16px;align-items:center;flex-wrap:wrap}h1{font-size:18px;margin:0}select,input,button{font:inherit;padding:7px}main{max-width:1400px;margin:auto;padding:20px}.case{margin:0 0 40px;background:white;padding:16px;border-radius:12px}.case h2{font-size:17px;margin:0 0 8px}.images{display:flex;gap:12px;align-items:start;overflow-x:auto}.images figure{margin:0;flex:0 0 32%;min-width:260px}.images img{width:100%;display:block;border:1px solid #ddd}figcaption{padding:6px 0;font-weight:650}p{line-height:1.5}.missing{color:#b32030}li{margin-bottom:5px}[hidden]{display:none!important}</style>
<header><h1>Akademiya · visual comparison</h1><select id="theme"><option>light</option><option>dark</option></select><input id="query" placeholder="Filter a screen or component"><select id="mode"><option value="overlay">50% overlay</option><option value="difference">Pixel difference ×3</option></select><span id="count"></span></header><main>
<p>Every image comes from the browser implementation or the connected Android device. Comparisons use a common 390-unit width. Android system bars and the browser’s synthetic status-bar slot are excluded. Moving Rive frames and text antialiasing still create pixel differences; an image difference is not a pass/fail test.</p>'''
if PHASE == 'after':
    doc += '<p><a href="../before/index.html">Original build comparison (224 pairs)</a> &middot; Current comparison includes 224 main states and 10 completed-answer checks. Native sign-in, Android permission wording, the approved cylinder picker and Save and leave copy are intentional differences.</p>'
for r in records:
    name = r['name']
    doc += '<article class="case" data-theme="'+r['theme']+'" id="'+name+'"><h2>'+html.escape(r['id']+' · '+r['theme'])+'</h2>'
    if r['notes']:
        doc += '<ul>' + ''.join('<li>'+html.escape(n)+'</li>' for n in r['notes']) + '</ul>'
    doc += '<div class="images">'
    for platform, label in (('browser','Browser reference'), ('android','Android device')):
        doc += '<figure><figcaption>'+label+'</figcaption>'
        if r[platform]:
            src = 'normalized/'+platform+'/'+name+'.png'
            doc += '<a href="'+src+'"><img loading="lazy" src="'+src+'"></a>'
        else:
            doc += '<p class="missing">Capture missing</p>'
        doc += '</figure>'
    if (base/'overlay'/(name+'.png')).exists():
        doc += '<figure><figcaption class="mix-label">50% overlay</figcaption><a class="mix-link" href="overlay/'+name+'.png"><img class="mix" loading="lazy" data-name="'+name+'" src="overlay/'+name+'.png"></a></figure>'
    doc += '</div></article>'
doc += '''</main><script>const q=document.querySelector('#query'),t=document.querySelector('#theme'),m=document.querySelector('#mode');function filter(){let n=0;document.querySelectorAll('.case').forEach(c=>{c.hidden=c.dataset.theme!==t.value||!c.textContent.toLowerCase().includes(q.value.toLowerCase());if(!c.hidden)n++});document.querySelector('#count').textContent=n+' screens';}q.oninput=t.onchange=filter;m.onchange=()=>document.querySelectorAll('.mix').forEach(i=>{i.src=m.value+'/'+i.dataset.name+'.png';i.parentElement.href=i.src;i.closest('figure').querySelector('figcaption').textContent=m.selectedOptions[0].textContent});filter();</script>'''
(base/'index.html').write_text(doc, encoding='utf-8', newline='\n')
(base/'coverage.json').write_text(json.dumps(records, indent=2), encoding='utf-8', newline='\n')
print(json.dumps({'phase': PHASE, 'cases': len(records), 'browser': sum(r['browser'] for r in records), 'android': sum(r['android'] for r in records), 'viewportMismatches': sum(r.get('viewportMismatch', False) for r in records)}))
