"""Contact sheet of a waiter capture run.  python _sheet.py <tag> [cols] [step] [labels] [scale]"""
import json, sys
from PIL import Image, ImageDraw

tag = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4
step = int(sys.argv[3]) if len(sys.argv) > 3 else 1
labels = sys.argv[4].split(',') if len(sys.argv) > 4 and sys.argv[4] else None
sc = float(sys.argv[5]) if len(sys.argv) > 5 else 0.6
ts = json.load(open('captures/waiters/%s.json' % tag))
idx = list(range(0, len(ts), step))
ims = [Image.open('captures/waiters/%s-%d.png' % (tag, i)).convert('RGB') for i in idx]
w, h = ims[0].size
box = (135, 14, w - 135, 232)          # the two big avatars and the small ones
cw, chh = box[2] - box[0], box[3] - box[1]
tw, th = int(cw * sc), int(chh * sc)
rows = (len(idx) + cols - 1) // cols
S = Image.new('RGB', (cols * tw, rows * (th + 16)), ims[0].getpixel((40, 40)))
d = ImageDraw.Draw(S)
for n, (i, im) in enumerate(zip(idx, ims)):
    x, y = (n % cols) * tw, (n // cols) * (th + 16)
    S.paste(im.crop(box).resize((tw, th), Image.LANCZOS), (x, y + 14))
    d.text((x + 6, y + 1), labels[n] if labels else '%d ms' % ts[i], fill='#8A8AA0')
S.save('captures/waiters/%s-sheet.png' % tag)
print(tag, len(idx), 'cells', S.size)
