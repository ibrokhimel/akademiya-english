"""Montages of the check captures.  python _montage.py [suffix]"""
import sys
from PIL import Image
suf = sys.argv[1] if len(sys.argv) > 1 else ''
GROUPS = {
    'm1': ['main-0-grey', 'main-1-shine', 'main-2-pressed', 'family'],
    'm2': ['dAnswer-1-picked', 'dAnswer-2-right', 'dAnswer-3-wrong'],
    'm3': ['dPicture-1-picked', 'dPicture-2-right', 'dPicture-3-wrong'],
    'm4': ['builder-1-flying', 'builder-2-placed', 'builder-3-wave', 'builder-4-right'],
    'm5': ['mistake-1-picked', 'mistake-2-strike', 'mistake-3-fixed', 'gap-0-start', 'gap-1-picked', 'gap-2-right'],
    'm6': ['bar-1-growing', 'bar-2-gold', 'sheet-1-rising', 'sheet-2-ok', 'sheet-3-answer', 'toast'],
    'm7': ['mic-0-idle', 'mic-1-listening', 'mic-2-thinking', 'mic-3-heard-draw', 'mic-4-heard', 'audio-playing'],
    'm8': ['phone-0', 'phone-1-right', 'phone-2-sheet', 'phone-3-combo', 'phone-3-sliding', 'phone-4-wrong'],
}
for g, names in GROUPS.items():
    ims = [Image.open('captures/%s%s.png' % (n, suf)).convert('RGB') for n in names]
    cols = 3 if len(ims) > 4 else len(ims)
    if g == 'm8': cols = 6; ims = [i.crop((i.width // 2 - 170, 60, i.width // 2 + 170, i.height)) for i in ims]
    w = max(i.width for i in ims); h = max(i.height for i in ims); rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * (w + 8), rows * (h + 8)), '#777777')
    for k, im in enumerate(ims): S.paste(im, ((k % cols) * (w + 8), (k // cols) * (h + 8)))
    if S.width > 1500: S = S.resize((1500, int(S.height * 1500 / S.width)), Image.LANCZOS)
    S.save('captures/_%s%s.png' % (g, suf)); print(g, S.size)
