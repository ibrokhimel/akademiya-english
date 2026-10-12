import json, sys
from PIL import Image, ImageDraw
tag = sys.argv[1]; a = int(sys.argv[2]) if len(sys.argv) > 2 else 0; b = int(sys.argv[3]) if len(sys.argv) > 3 else 999
s = json.load(open('captures/%s.json' % tag))[a:b]
im0 = Image.open(s[0][0]); sc = 0.42; w, h = int(im0.width * sc), int(im0.height * sc); cols = 8; rows = (len(s) + cols - 1) // cols
S = Image.new('RGB', (cols * (w + 6), rows * (h + 18)), '#F7F5FF'); d = ImageDraw.Draw(S)
for i, (f, l) in enumerate(s):
    im = Image.open(f).convert('RGB').resize((w, h)); x = (i % cols) * (w + 6); y = (i // cols) * (h + 18); S.paste(im, (x, y)); d.text((x + 3, y + h + 3), l[:30], fill='#2B2B3C')
S.save('captures/%s-sheet-%d.png' % (tag, a)); print(S.size)
