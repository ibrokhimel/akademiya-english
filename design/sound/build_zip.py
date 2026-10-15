"""Pack the listening page and every sound into one zip that works with no server.  python -I build_zip.py

akademiya-sounds.zip
  index.html            open this (Chrome, Edge or Firefox)
  candidates/<sound>/   all the options the page plays
  chosen/               the picked set as the app will use it, with sounds.json (levels, sources, credits)
"""
import os, json, zipfile, subprocess

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'akademiya-sounds.zip'); TOP = 'akademiya-sounds/'
read = lambda *p: open(os.path.join(HERE, *p), encoding='utf-8').read()
man = json.loads(read('manifest.json')); picks = json.loads(read('picks.json')) if os.path.exists(os.path.join(HERE, 'picks.json')) else {}
html = read('index.html')
for a, b in [('../motion/tokens.css', 'tokens.css'), ('<script src="audition.js"></script>', '<script src="manifest.js"></script>\n<script src="audition.js"></script>')]:
    assert html.count(a) == 1, a; html = html.replace(a, b)
README = """Akademiya English: sounds

Open index.html in Chrome, Edge or Firefox. Press a card to hear it, press the heart to like it.
Likes and notes are kept in that browser only.

candidates/   every option, one folder per sound
chosen/       the picked set as the app will use it; sounds.json lists level, source, licence and credit for each

The sounds come from several makers under different licences (shown on each card: CC0, free, credit).
This pack is for choosing sounds inside the team. Do not publish it or pass the files on as a sound pack.
"""
# A browser's audio element cannot read some very short .ogg files (the page with a server decodes it another way),
# so everything under a quarter of a second goes into the zip as .wav.
items = [it for s in man['slots'] for it in s['items']]
for it in items:
    if it['ms'] < 250: it['url'] = it['url'][:-4] + '.wav'
wav = lambda src: subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', os.path.join(HERE, src), '-f', 'wav', '-'], capture_output=True, stdin=subprocess.DEVNULL, check=True).stdout
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr(TOP + 'index.html', html); z.writestr(TOP + 'README.txt', README)
    z.writestr(TOP + 'manifest.js', 'window.MANIFEST = %s;\nwindow.PICKS = %s;\n' % (json.dumps(man, ensure_ascii=False), json.dumps(picks, ensure_ascii=False)))
    for f in ('audition.js', 'audition.css'): z.write(os.path.join(HERE, f), TOP + f)
    z.write(os.path.join(HERE, '..', 'motion', 'tokens.css'), TOP + 'tokens.css')
    for it in items:
        if it['url'].endswith('.wav'): z.writestr(TOP + it['url'], wav(it['url'][:-4] + '.ogg'))
        else: z.write(os.path.join(HERE, it['url']), TOP + it['url'], zipfile.ZIP_STORED)                                   # already compressed
    final = sorted(os.listdir(os.path.join(HERE, 'final')))
    for f in final: z.write(os.path.join(HERE, 'final', f), TOP + 'chosen/' + f)
print('%s  %.1f MB  -  %d options (%d as .wav), %d chosen files' % (OUT, os.path.getsize(OUT) / 1e6, len(items), sum(i['url'].endswith('.wav') for i in items), len(final) - 1))
