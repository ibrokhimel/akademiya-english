"""96 guide-pet ideas: 12 body shapes x 8 face styles, mixed colours. Run: python build_blob_grid.py"""
from pathlib import Path

from build_icons import rounded_poly

PAL = ["#FFB86B", "#5ED6B4", "#6EC3FF", "#FF7F6E", "#FFD84D", "#B79CFF",
       "#FF9CC8", "#2EC4C4", "#FFE6B8", "#A6E35A", "#FF9F45", "#8FA8FF"]
INK, W = "#2B2B3C", "#FFFFFF"
C = PAL[0]  # body colour of the cell being drawn (set per cell)


def rr(x, y, w, h, r, c): return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{c}"/>'
def ci(x, y, r, c): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}"/>'
def tri(pts, r, c): return f'<path d="{rounded_poly(pts, r)}" fill="{c}"/>'


# ---- bodies: return (shapes, face centre x, face centre y, face scale)
def b_squircle(): return [rr(30, 34, 140, 136, 52, C)], 100, 100, 1
def b_circle():   return [ci(100, 104, 70, C)], 100, 104, 1
def b_egg():      return [rr(46, 26, 108, 150, 54, C)], 100, 104, .9
def b_mochi():    return [rr(22, 64, 156, 108, 52, C)], 100, 116, .95
def b_drop():     return [tri([(100, 18), (146, 96), (54, 96)], 18, C), ci(100, 118, 54, C)], 100, 118, .85
def b_ghost():    return [rr(42, 30, 116, 130, 58, C)] + [ci(58 + i * 28, 156, 16, C) for i in range(4)], 100, 92, .9
def b_bubble():   return [tri([(52, 132), (86, 146), (40, 176)], 7, C), rr(26, 36, 148, 120, 50, C)], 100, 96, 1
def b_cloud():    return [ci(64, 116, 40, C), ci(136, 116, 40, C), ci(100, 90, 50, C), rr(28, 112, 144, 50, 25, C)], 100, 112, .9
def b_bean():     return [rr(20, 72, 160, 92, 46, C)], 100, 118, .9
def b_ears():     return [ci(58, 50, 20, C), ci(142, 50, 20, C), rr(32, 42, 136, 128, 54, C)], 100, 104, 1
def b_sprout():   return [rr(97, 18, 6, 30, 3, "#5FC27A"), tri([(100, 30), (126, 14), (122, 38)], 5, "#5FC27A"), ci(100, 112, 66, C)], 100, 112, .95
def b_slime():    return [rr(30, 50, 140, 120, 60, C), rr(30, 120, 140, 50, 12, C), rr(44, 160, 18, 22, 9, C), rr(130, 160, 18, 28, 9, C)], 100, 108, 1


BODIES = [b_squircle, b_circle, b_egg, b_mochi, b_drop, b_ghost, b_bubble, b_cloud, b_bean, b_ears, b_sprout, b_slime]
BN = ["squircle", "circle", "egg", "mochi", "drop", "ghost", "bubble", "cloud", "bean", "ears", "sprout", "slime"]


# ---- faces at (x, y, scale); cut-out shapes use the body colour C
def f_grok(x, y, s):
    o = []
    for d in (-1, 1):
        ex = x + d * 27 * s
        o += [rr(ex - 21 * s, y - 28 * s, 42 * s, 56 * s, 15 * s, INK), rr(ex - 13 * s, y - 20 * s, 11 * s, 16 * s, 5.5 * s, W), ci(ex + 9 * s, y + 15 * s, 3.2 * s, W)]
    return o


def f_dots(x, y, s):
    return [ci(x - 22 * s, y, 6 * s, INK), ci(x + 22 * s, y, 6 * s, INK), ci(x - 40 * s, y + 14 * s, 9 * s, "#FF8FA3"),
            ci(x + 40 * s, y + 14 * s, 9 * s, "#FF8FA3"), rr(x - 6 * s, y + 12 * s, 12 * s, 6 * s, 3 * s, INK)]


def f_pills(x, y, s):
    return [rr(x - 26 * s, y - 22 * s, 14 * s, 34 * s, 7 * s, INK), rr(x + 12 * s, y - 22 * s, 14 * s, 34 * s, 7 * s, INK),
            rr(x - 12 * s, y + 18 * s, 24 * s, 12 * s, 6 * s, INK), rr(x - 12 * s, y + 14 * s, 24 * s, 8 * s, 0, C)]


def f_happy(x, y, s):
    o = []
    for d in (-1, 1):
        ex = x + d * 26 * s
        o += [rr(ex - 17 * s, y - 20 * s, 34 * s, 40 * s, 17 * s, INK), rr(ex - 9 * s, y - 11 * s, 18 * s, 40 * s, 9 * s, C), rr(ex - 20 * s, y + 4 * s, 40 * s, 20 * s, 0, C)]
    return o + [rr(x - 15 * s, y + 14 * s, 30 * s, 22 * s, 11 * s, "#AD3B3B"), rr(x - 15 * s, y + 10 * s, 30 * s, 10 * s, 0, C), rr(x - 8 * s, y + 26 * s, 16 * s, 8 * s, 4 * s, "#F05656")]


def f_cyclops(x, y, s):
    return [ci(x, y - 4 * s, 30 * s, W), ci(x + 4 * s, y - 2 * s, 17 * s, INK), ci(x - 3 * s, y - 9 * s, 6 * s, W), rr(x - 10 * s, y + 34 * s, 20 * s, 6 * s, 3 * s, INK)]


def f_visor(x, y, s):
    return [rr(x - 52 * s, y - 24 * s, 104 * s, 48 * s, 24 * s, INK), rr(x - 32 * s, y - 13 * s, 18 * s, 26 * s, 9 * s, "#7FF0FF"), rr(x + 14 * s, y - 13 * s, 18 * s, 26 * s, 9 * s, "#7FF0FF")]


def f_wide(x, y, s):
    return [ci(x - 36 * s, y - 8 * s, 7 * s, INK), ci(x + 36 * s, y - 8 * s, 7 * s, INK), rr(x - 26 * s, y + 4 * s, 52 * s, 28 * s, 14 * s, "#AD3B3B"),
            rr(x - 26 * s, y + 2 * s, 52 * s, 10 * s, 0, C), rr(x - 16 * s, y + 12 * s, 32 * s, 6 * s, 3 * s, W)]


def f_sleepy(x, y, s):
    o = []
    for d in (-1, 1):
        ex = x + d * 25 * s
        o += [rr(ex - 15 * s, y - 16 * s, 30 * s, 36 * s, 13 * s, INK), rr(ex - 18 * s, y - 20 * s, 36 * s, 20 * s, 0, C), ci(ex + 4 * s, y + 6 * s, 3 * s, W)]
    return o + [rr(x - 5 * s, y + 26 * s, 10 * s, 5 * s, 2.5 * s, INK)]


FACES = [f_grok, f_dots, f_pills, f_happy, f_cyclops, f_visor, f_wide, f_sleepy]
FN = ["giant eyes", "dots+cheeks", "pills", "happy", "one eye", "visor", "grin", "calm"]


def main():
    global C
    cell, top, left = 150, 34, 96
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{left + 8 * cell}" height="{top + 12 * cell}" '
           f'viewBox="0 0 {left + 8 * cell} {top + 12 * cell}"><rect width="100%" height="100%" fill="#FFFFFF"/>']
    for j, n in enumerate(FN):
        out.append(f'<text x="{left + j * cell + cell / 2}" y="22" font-family="Nunito,Arial" font-weight="800" font-size="14" fill="#6E6E82" text-anchor="middle">{chr(65 + j)} · {n}</text>')
    for i, body in enumerate(BODIES):
        out.append(f'<text x="8" y="{top + i * cell + cell / 2 + 5}" font-family="Nunito,Arial" font-weight="800" font-size="14" fill="#6E6E82">{i + 1} · {BN[i]}</text>')
        for j, face in enumerate(FACES):
            C = PAL[(i * 5 + j * 7) % len(PAL)]
            shapes, fx, fy, fs = body()
            gx, gy = left + j * cell, top + i * cell
            out.append(f'<rect x="{gx + 3}" y="{gy + 3}" width="{cell - 6}" height="{cell - 6}" rx="18" fill="#F7F7FA"/>')
            out.append(f'<g transform="translate({gx + 8} {gy + 6}) scale(0.67)">' + "".join(shapes + face(fx, fy, fs)) + "</g>")
            out.append(f'<text x="{gx + 14}" y="{gy + 22}" font-family="Nunito,Arial" font-weight="900" font-size="12" fill="#B7B7B7">{i + 1}{chr(65 + j)}</text>')
    out.append("</svg>")
    p = Path(__file__).parent / "characters-grid.svg"
    p.write_text("".join(out), encoding="utf-8")
    print(p)


if __name__ == "__main__":
    main()
