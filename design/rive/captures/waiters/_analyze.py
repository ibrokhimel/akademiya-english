"""Measure the waiters' eyes in a capture run: eye height (blink) and eye centre y (breath ride)."""
import json, sys
from PIL import Image
tag = sys.argv[1]
ts = json.load(open('captures/waiters/%s.json' % tag))
CX = {'A': 153, 'B': 434, 'C': 715}
if len(sys.argv) > 2:
    CX = dict(zip('ABC', map(int, sys.argv[2].split(','))))
rows = []
for i, t in enumerate(ts):
    im = Image.open('captures/waiters/%s-%d.png' % (tag, i)).convert('RGB')
    px = im.load()
    row = [t]
    for k in 'ABC':
        left, top = CX[k] - 100, 25
        ys = []
        for y in range(top + 68, top + 94):
            for x in range(left + 75, left + 126):
                r, g, b = px[x, y]
                if abs(r - 75) < 7 and abs(g - 75) < 7 and abs(b - 75) < 7:
                    ys.append(y)
        row += [(max(ys) - min(ys) + 1) if ys else 0, round(sum(ys) / len(ys), 2) if ys else 0]
    rows.append(row)
json.dump(rows, open('captures/waiters/%s-metrics.json' % tag, 'w'))
for k, j in zip('ABC', (1, 3, 5)):
    hs = [r[j] for r in rows if r[j]]
    full = max(hs)
    blinks = []
    inb = False
    for r in rows:
        if r[j] and r[j] < full * 0.6 and not inb: blinks.append(r[0]); inb = True
        if r[j] >= full * 0.9: inb = False
    cy = [r[j + 1] for r in rows if r[j] >= full * 0.9]
    print(k, 'eye h full', full, 'min', min(hs), 'blink starts(ms)', blinks, 'eye-centre y range %.2f..%.2f' % (min(cy), max(cy)))
