"""Guide-character candidates v2: simple GrokBot-like AI (giant eyes, one shape). Run: python build_bots.py"""
from pathlib import Path
from build_icons import rounded_poly
def rr(x, y, w, h, r, c): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"/>'
def ci(x, y, r, c): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def tri(pts, r, c): return f'<path d="{rounded_poly(pts, r)}" fill="{c}"/>'
V, VE, VL, INK = "#7B5CFF", "#5A3FD9", "#9F86FF", "#2B2B3C"

def eyes_sq(cx, cy, w, h, gap, col=INK, shine=True, look=4):
    out = []
    for s in (-1, 1):
        x = cx + s * (gap / 2 + w / 2) - w / 2 + look
        out.append(rr(x, cy - h / 2, w, h, min(w, h) * .38, col))
        if shine:
            out += [rr(x + w * .18, cy - h / 2 + h * .14, w * .26, h * .3, w * .13, "#FFFFFF"), ci(x + w * .72, cy + h * .28, w * .07, "#FFFFFF")]
    return out

def orb():      # A: violet rounded square, giant dark rounded-square eyes (closest to GrokBot)
    return [rr(30, 30, 140, 140, 52, V), rr(44, 40, 46, 16, 8, VL)] + eyes_sq(100, 104, 46, 62, 16)
def drop():     # B: violet circle orb + tiny antenna dot, tall pill eyes
    return [ci(100, 26, 9, "#FFC93C"), rr(97, 30, 6, 22, 3, VE), ci(100, 112, 72, V), ci(70, 80, 12, VL)] + eyes_sq(100, 114, 40, 66, 18)
def screen():   # C: AI "screen" — dark rounded display in a violet shell, glowing eyes
    return [rr(26, 40, 148, 124, 46, V), rr(42, 56, 116, 92, 32, INK)] + eyes_sq(100, 102, 30, 44, 22, col="#B9A6FF", shine=False, look=0) + [rr(84, 132, 32, 6, 3, "#B9A6FF")]
def bubble():   # D: speech-bubble body (the "things I can say" icon) with giant eyes
    return [tri([(54, 140), (88, 150), (44, 178)], 7, V), rr(26, 34, 148, 124, 50, V), rr(42, 44, 44, 15, 7.5, VL)] + eyes_sq(100, 98, 44, 60, 16)

def orb_happy():  # A happy: ∩∩ squint arcs + U smile (dark shape, body-colour shape cut out of it)
    o = [rr(30, 30, 140, 140, 52, V), rr(44, 40, 46, 16, 8, VL)]
    for x in (56, 104):
        o += [rr(x, 80, 40, 52, 20, INK), rr(x + 9, 92, 22, 52, 11, V), rr(x - 4, 116, 48, 30, 0, V)]
    return o + [rr(84, 128, 32, 22, 11, INK), rr(84, 124, 32, 14, 0, V)]
def orb_listen():  # A listening: wide eyes looking up + sound bars
    return [rr(30, 30, 140, 140, 52, V), rr(44, 40, 46, 16, 8, VL)] + eyes_sq(100, 98, 50, 68, 12, look=0) + [rr(78 + i * 10, 146 - h / 2, 6, h, 3, "#FFFFFF") for i, h in enumerate([8, 16, 22, 16, 8])]

out = Path(__file__).parent / "characters-bot"
for name, fn in {"a-orb": orb, "b-drop": drop, "c-screen": screen, "d-bubble": bubble, "a2-orb-happy": orb_happy, "a3-orb-listening": orb_listen}.items():
    (out / f"{name}.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  '
                                     + "\n  ".join(fn()) + "\n</svg>\n", encoding="utf-8")
print("ok")
