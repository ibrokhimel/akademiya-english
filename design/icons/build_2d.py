"""Round 2 around pick 2D (circle body + happy arc eyes + open smile).
Sheet 1: 16 refinements. Sheet 2: 10 expressions of one base. Run: python build_2d.py"""
from pathlib import Path

from build_icons import rounded_poly

INK, W, MOUTH, TONGUE, CHEEK = "#2B2B3C", "#FFFFFF", "#AD3B3B", "#F05656", "#FF8FA3"
PAL = ["#6EC3FF", "#FFB86B", "#5ED6B4", "#FF7F6E", "#FFD84D", "#B79CFF", "#FF9CC8", "#A6E35A"]


def rr(x, y, w, h, r, c): return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{c}"/>'
def ci(x, y, r, c): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}"/>'
def tri(pts, r, c): return f'<path d="{rounded_poly(pts, r)}" fill="{c}"/>'


def shade(hexc, k):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02X%02X%02X" % tuple(max(0, min(255, int(v * k))) for v in (r, g, b))


# ---- eye / mouth parts (centre x, y, scale s, body colour c)
def arcs(x, y, s, c, gap=26, w=34, h=40):
    o = []
    for d in (-1, 1):
        ex = x + d * gap * s
        o += [rr(ex - w / 2 * s, y - 20 * s, w * s, h * s, w / 2 * s, INK), rr(ex - (w / 2 - 8) * s, y - 11 * s, (w - 16) * s, 40 * s, (w / 2 - 8) * s, c),
              rr(ex - (w / 2 + 3) * s, y + 4 * s, (w + 6) * s, 20 * s, 0, c)]
    return o


def open_eyes(x, y, s, look=0):
    o = []
    for d in (-1, 1):
        ex = x + d * 26 * s + look * s
        o += [rr(ex - 12 * s, y - 18 * s, 24 * s, 34 * s, 12 * s, INK), ci(ex - 3 * s, y - 8 * s, 4.5 * s, W)]
    return o


def big_mouth(x, y, s, c, w=30, h=22):
    return [rr(x - w / 2 * s, y, w * s, h * s, h / 2 * s, MOUTH), rr(x - w / 2 * s, y - 4 * s, w * s, 10 * s, 0, c), rr(x - 8 * s, y + (h - 10) * s, 16 * s, 8 * s, 4 * s, TONGUE)]


def smile(x, y, s, c, w=24):
    return [rr(x - w / 2 * s, y, w * s, 14 * s, 7 * s, INK), rr(x - w / 2 * s, y - 4 * s, w * s, 10 * s, 0, c)]


def base(c, cx=100, cy=106, r=66, squash=1.0):
    if squash == 1.0:
        return [ci(cx, cy, r, c)]
    h = 2 * r * squash
    return [rr(cx - r, cy + r - h, 2 * r, h, min(r, h / 2), c)]


# ---- sheet 1: refinements of 2D
def refinements():
    v = []
    def add(name, fn): v.append((name, fn))
    add("2D original", lambda c: base(c) + arcs(100, 96, 1, c) + big_mouth(100, 120, 1, c))
    add("+ cheeks", lambda c: base(c) + arcs(100, 96, 1, c) + big_mouth(100, 120, 1, c) + [ci(56, 120, 9, CHEEK), ci(144, 120, 9, CHEEK)])
    add("+ shine", lambda c: base(c) + [rr(58, 58, 34, 14, 7, shade(c, 1.15)), ci(52, 80, 5, shade(c, 1.15))] + arcs(100, 98, 1, c) + big_mouth(100, 122, 1, c))
    add("+ bottom shade", lambda c: base(c) + [rr(46, 140, 108, 30, 15, shade(c, .88)), ci(100, 104, 62, c)] + arcs(100, 96, 1, c) + big_mouth(100, 120, 1, c))
    add("bigger eyes", lambda c: base(c) + arcs(100, 92, 1.25, c) + big_mouth(100, 124, .9, c))
    add("eyes wide apart", lambda c: base(c) + arcs(100, 98, 1, c, gap=34) + big_mouth(100, 120, 1, c))
    add("small smile", lambda c: base(c) + arcs(100, 96, 1, c) + smile(100, 122, 1, c))
    add("wide grin", lambda c: base(c) + arcs(100, 94, 1, c) + big_mouth(100, 118, 1, c, w=50, h=26))
    add("mochi (squashed)", lambda c: base(c, cy=112, squash=.82) + arcs(100, 110, 1, c) + big_mouth(100, 132, 1, c))
    add("+ nub arms", lambda c: [ci(32, 122, 14, c), ci(168, 112, 14, c)] + base(c) + arcs(100, 96, 1, c) + big_mouth(100, 120, 1, c))
    add("+ feet", lambda c: [rr(66, 160, 28, 16, 8, shade(c, .85)), rr(106, 160, 28, 16, 8, shade(c, .85))] + base(c, cy=100) + arcs(100, 92, 1, c) + big_mouth(100, 116, 1, c))
    add("+ antenna", lambda c: [rr(97, 22, 6, 24, 3, shade(c, .8)), ci(100, 20, 9, "#FFD84D")] + base(c) + arcs(100, 98, 1, c) + big_mouth(100, 122, 1, c))
    add("+ leaf sprout", lambda c: [rr(97, 22, 6, 26, 3, "#4FB86A"), tri([(100, 32), (128, 16), (124, 40)], 5, "#5FC27A")] + base(c) + arcs(100, 98, 1, c) + big_mouth(100, 122, 1, c))
    add("+ little ears", lambda c: [ci(52, 54, 16, c), ci(148, 54, 16, c)] + base(c) + arcs(100, 98, 1, c) + big_mouth(100, 122, 1, c))
    add("+ doppi hat", lambda c: base(c) + [rr(62, 30, 76, 26, 10, "#2B2B3C"), rr(70, 36, 60, 5, 2.5, "#FFD84D"), ci(84, 46, 3, W), ci(100, 46, 3, W), ci(116, 46, 3, W)] + arcs(100, 100, 1, c) + big_mouth(100, 124, 1, c))
    add("+ headphones", lambda c: [rr(36, 46, 128, 22, 11, "#2B2B3C"), rr(26, 86, 20, 44, 10, "#2B2B3C"), rr(154, 86, 20, 44, 10, "#2B2B3C")] + base(c) + arcs(100, 98, 1, c) + big_mouth(100, 122, 1, c) + [rr(28, 90, 14, 36, 7, "#FF7F6E"), rr(158, 90, 14, 36, 7, "#FF7F6E")])
    return v


# ---- sheet 2: expressions (one base: circle + cheeks)
def expressions(c):
    ck = [ci(56, 120, 9, CHEEK), ci(144, 120, 9, CHEEK)]
    e = []
    e.append(("happy (idle)", base(c) + ck + arcs(100, 96, 1, c) + big_mouth(100, 120, 1, c)))
    e.append(("neutral", base(c) + ck + open_eyes(100, 96, 1) + smile(100, 124, 1, c, w=18)))
    e.append(("listening", base(c) + ck + open_eyes(100, 90, 1.15) + [rr(78 + i * 10, 136 - h / 2, 6, h, 3, INK) for i, h in enumerate([8, 16, 22, 16, 8])]))
    e.append(("thinking", base(c) + ck + open_eyes(100, 92, 1, look=8) + [rr(86, 126, 22, 7, 3.5, INK), ci(150, 52, 7, W), ci(166, 36, 10, W)]))
    e.append(("talking", base(c) + ck + arcs(100, 94, 1, c) + [rr(84, 116, 32, 30, 15, MOUTH), rr(92, 132, 16, 10, 5, TONGUE)]))
    e.append(("surprised", base(c) + ck + open_eyes(100, 92, 1.1) + [ci(100, 132, 11, MOUTH)]))
    e.append(("celebrating", [tri([(30, 40), (40, 30), (44, 46)], 3, "#FFD84D"), tri([(162, 34), (174, 42), (160, 50)], 3, "#FF9CC8"), ci(170, 72, 5, "#5ED6B4")] + base(c) + ck + arcs(100, 92, 1.15, c) + big_mouth(100, 118, 1, c, w=44, h=30)))
    e.append(("sleepy (night)", base(c) + ck + [rr(64, 94, 24, 7, 3.5, INK), rr(112, 94, 24, 7, 3.5, INK), rr(94, 122, 12, 9, 4.5, MOUTH), rr(140, 40, 18, 5, 2.5, INK), rr(154, 28, 12, 4, 2, INK)]))
    e.append(("oops (mistake)", base(c) + ck + open_eyes(100, 94, .9) + [rr(84, 124, 32, 8, 4, INK), ci(150, 70, 6, "#8FD3FF")]))
    e.append(("frozen (streak freeze)", [ci(100, 106, 70, "#DDF4FF")] + base("#BFE7FF", r=64) + [rr(48, 60, 30, 12, 6, W)] + arcs(100, 98, 1, "#BFE7FF") + smile(100, 124, 1, "#BFE7FF") + [rr(70, 168, 10, 16, 5, "#8FD3FF"), rr(116, 168, 10, 22, 5, "#8FD3FF")]))
    return e


def sheet(items, cols, path, colours=None):
    cell, top = 170, 8
    rows = (len(items) + cols - 1) // cols
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols * cell}" height="{top + rows * cell}" viewBox="0 0 {cols * cell} {top + rows * cell}"><rect width="100%" height="100%" fill="#FFFFFF"/>']
    for k, (name, shapes) in enumerate(items):
        gx, gy = (k % cols) * cell, top + (k // cols) * cell
        out.append(f'<rect x="{gx + 4}" y="{gy + 4}" width="{cell - 8}" height="{cell - 8}" rx="20" fill="#F7F7FA"/>')
        out.append(f'<g transform="translate({gx + 22} {gy + 14}) scale(0.63)">{"".join(shapes)}</g>')
        out.append(f'<text x="{gx + cell / 2}" y="{gy + cell - 14}" font-family="Nunito,Arial" font-weight="800" font-size="12" fill="#6E6E82" text-anchor="middle">{k + 1} · {name}</text>')
    out.append("</svg>")
    path.write_text("".join(out), encoding="utf-8")
    print(path)


def main():
    here = Path(__file__).parent
    ref = refinements()
    sheet([(n, fn(PAL[k % len(PAL)])) for k, (n, fn) in enumerate(ref)], 4, here / "characters-2d-refine.svg")
    sheet(expressions("#6EC3FF"), 5, here / "characters-2d-expressions.svg")


if __name__ == "__main__":
    main()


APP = [("violet $violet", "#7B5CFF"), ("light violet", "#9F86FF"), ("lavender", "#B9A6FF"), ("coral $coral", "#FF6B5B"),
       ("gold $gold", "#FFC93C"), ("orange $orange", "#FF9F1C"), ("green $green", "#3DCB6C"), ("ice (freeze)", "#5BC8F5")]


def app_sheets():
    here = Path(__file__).parent
    items = []
    for name, c in APP:
        items.append((name, [rr(52, 160, 96, 9, 4.5, "#E7E7E7"), ci(100, 104, 66, shade(c, .86)), ci(100, 100, 66, c)] + [ci(56, 116, 9, CHEEK), ci(144, 116, 9, CHEEK)] + arcs(100, 92, 1, c) + big_mouth(100, 116, 1, c)))
    sheet(items, 4, here / "characters-2d-colours.svg")
    for tag, c in (("violet", "#7B5CFF"), ("coral", "#FF6B5B"), ("gold", "#FFC93C")):
        sheet(expressions(c), 5, here / f"characters-2d-expressions-{tag}.svg")


app_sheets()
