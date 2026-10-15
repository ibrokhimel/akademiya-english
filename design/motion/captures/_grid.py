"""Montage of captures by prefix.  python _grid.py <prefix> <cols> [suffix] [maxw]"""
import sys, glob, os
from PIL import Image
prefix, cols = sys.argv[1], int(sys.argv[2]); suf = sys.argv[3] if len(sys.argv) > 3 else ''; maxw = int(sys.argv[4]) if len(sys.argv) > 4 else 1500
files = sorted(glob.glob('captures/%s-*.png' % prefix), key=os.path.getmtime)
files = [f for f in files if f.endswith('-dark.png') == (suf == '-dark')]
ims = [Image.open(f).convert('RGB') for f in files]
w = max(i.width for i in ims); h = max(i.height for i in ims); rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * (w + 6), rows * (h + 6)), '#777777')
for k, im in enumerate(ims): S.paste(im, ((k % cols) * (w + 6), (k // cols) * (h + 6)))
if S.width > maxw: S = S.resize((maxw, int(S.height * maxw / S.width)), Image.LANCZOS)
S.save('captures/_%s%s.png' % (prefix, suf)); print(len(ims), S.size)
