"""Reads one recording made by check-sync.js: the level bar in the corner tells what was sounding in each frame.
Prints the level and how much the picture moved, frame by frame, and saves the frames as one strip to look at."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

job = json.load(open(sys.argv[1], encoding='utf-8')); W, H, FPS = 1240, 800, 25
raw = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', job['video'], '-vf', 'fps=%d' % FPS, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, stdin=subprocess.DEVNULL).stdout
f = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W, 3)
row = f[:, 8, :256].astype(int); bar = ((row[:, :, 0] > 150) & (row[:, :, 1] < 110) & (row[:, :, 2] > 150)).sum(axis=1)      # 4 px per dB, full = 0 dB
has = (f[:, 8, 100].astype(int).sum(axis=1) < 60) | (bar > 0); lamp = f[:, 8, 276, 1] > 150                                    # the meter is on screen · something is sounding
db = bar / 4.0 - 64
b = job['box']; x0, y0 = max(0, int(b['x'])), max(18, int(b['y'])); x1, y1 = min(W, int(b['x'] + b['width'])), min(H, int(b['y'] + b['height']))
crop = f[:, y0:y1, x0:x1].astype(np.int16); move = np.concatenate([[0], np.abs(crop[1:] - crop[:-1]).mean(axis=(1, 2, 3))])
on = np.flatnonzero(lamp & has)
if not len(on): print('%s: no sound was seen in the recording' % job['name']); sys.exit()
z = on[0]; last = min(len(f) - 1, on[-1] + 4); t = lambda i: (i - z) * 1000 // FPS
played = [e for e in job['log'] if not e.get('skipped')]; t0 = played[0]['t'] if played else 0
print('\n== %s ==  sounds: %s' % (job['name'], ' · '.join('%s at %d ms%s' % (e['name'], e['t'] - t0, (' (loud moment +%d)' % e['hit']) if e['hit'] else '') for e in played)))
print('   ms  level  moved')
for i in range(max(0, z - 3), last + 1):
    print('%5d  %5s  %5.1f  %s' % (t(i), ('%.0f' % db[i]) if bar[i] else '  -', move[i], '#' * int(max(0, db[i] + 48) / 2) if bar[i] else ''))
# the strip: 30 frames from just before the first sound, small, with time and level written on each (SYNC_FROM=ms and SYNC_N=frames choose another part)
a = z + int(os.environ.get('SYNC_FROM', -80)) * FPS // 1000; idx = list(range(max(0, a), min(len(f) - 1, a + int(os.environ.get('SYNC_N', 30)) - 1) + 1));
k = min(1.0, 230.0 / (x1 - x0)); cw, ch = int((x1 - x0) * k), int((y1 - y0) * k); cols = 10; rows = (len(idx) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (cw + 4), rows * (ch + 18)), (30, 30, 30)); d = ImageDraw.Draw(sheet)
for n, i in enumerate(idx):
    x, y = (n % cols) * (cw + 4), (n // cols) * (ch + 18)
    sheet.paste(Image.fromarray(f[i, y0:y1, x0:x1]).resize((cw, ch), Image.LANCZOS), (x, y + 16))
    d.text((x + 2, y + 2), '%d ms  %s' % (t(i), ('%.0f dB' % db[i]) if bar[i] else 'silent'), fill=(255, 0, 255) if bar[i] else (170, 170, 170))
sheet.save(job['out']); print('strip:', job['out'])
