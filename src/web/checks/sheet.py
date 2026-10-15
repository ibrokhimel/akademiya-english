"""Joins the step pictures of play.js into sheets to look at.  python sheet.py <prefix> [per row] [width]"""
import sys, glob, os
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__)); pre = sys.argv[1]; per = int(sys.argv[2]) if len(sys.argv) > 2 else 7; w = int(sys.argv[3]) if len(sys.argv) > 3 else 270
files = sorted(glob.glob(os.path.join(here, 'shots', pre + '*.png'))); ims = [Image.open(f).convert('RGB') for f in files]
ims = [i.resize((w, round(i.height * w / i.width))) for i in ims]; h = max(i.height for i in ims); rows = (len(ims) + per - 1) // per
for r in range(rows):
    part = ims[r * per:(r + 1) * per]; sheet = Image.new('RGB', (len(part) * (w + 6), h), '#888')
    for k, i in enumerate(part): sheet.paste(i, (k * (w + 6), 0))
    out = os.path.join(here, 'shots', 'sheet-%s-%d.png' % (pre.strip('-'), r + 1)); sheet.save(out); print(out, [os.path.basename(f)[len(pre):-4] for f in files[r * per:(r + 1) * per]])
