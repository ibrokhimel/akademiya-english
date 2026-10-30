import pathlib,subprocess,time,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'.expo/visual-parity/checks/android';OUT.mkdir(parents=True,exist_ok=True)
ADB=r'C:/Users/User/AppData/Local/Android/Sdk/platform-tools/adb.exe';PKG='ai.akademiya.english'
def adb(*args):return subprocess.check_output([ADB,*args],timeout=35)
for dark in (False,True):
 for kind in ('speech-right','speech-wrong','heard-right','fix-right','gap-right'):
  if len(sys.argv)>1 and kind not in sys.argv[1:]:continue
  speech=kind.startswith('speech');ex='meet' if speech else kind.split('-')[0]
  name=('speech-result-'+kind.split('-')[1] if speech else 'exercise-'+ex+'-checked-right')+('-dark' if dark else '-light')
  adb('shell','am','force-stop',PKG)
  uri="'akademiya:///visual-audit?id="+('feedback-right' if speech else 'exercise-'+ex)+'&dark='+('1' if dark else '0')+('&speech='+kind.split('-')[1] if speech else '&verdict=right')+"'"
  adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d',uri,PKG);time.sleep(7 if ex=='heard' else 5)
  (OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'));print('ANDROID CHECK '+name,flush=True)
