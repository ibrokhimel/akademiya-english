"""Builds the Akademiya icon set (Duolingo illustration style) as SVG files.

Same shapes as the Pencil components on the "Icons · Duolingo style" board.
All shapes are drawn on a 48x48 grid. Run: python build_icons.py
"""
import math
from pathlib import Path

GREY, HOLE = "#AFAFAF", "#E5E5E5"


def rounded_poly(pts, r):
    """Closed polygon path with every corner replaced by a circular arc of radius r (no stroke needed)."""
    n = len(pts)
    d = ""
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        v1 = (p0[0] - p1[0], p0[1] - p1[1])
        v2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1, l2 = math.hypot(*v1), math.hypot(*v2)
        ang = math.acos(max(-1, min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2))))
        ri = r[i] if isinstance(r, (list, tuple)) else r  # per-corner radius: sharp tips need a small one
        t = min(ri / math.tan(ang / 2), l1 / 2, l2 / 2)
        rr = t * math.tan(ang / 2)
        a = (p1[0] + v1[0] / l1 * t, p1[1] + v1[1] / l1 * t)
        b = (p1[0] + v2[0] / l2 * t, p1[1] + v2[1] / l2 * t)
        sweep = 1 if (v1[0] * v2[1] - v1[1] * v2[0]) < 0 else 0
        d += f"{'M' if i == 0 else 'L'}{a[0]:.2f} {a[1]:.2f} A{rr:.2f} {rr:.2f} 0 0 {sweep} {b[0]:.2f} {b[1]:.2f} "
    return d + "Z"


def star(cx, cy, R, r, rad=2.2):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 else R
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return rounded_poly(pts, rad)


def tri(x, y, w, h, r, flip=False):
    pts = [(x, y), (x + w, y), (x + w / 2, y + h)] if flip else [(x, y + h), (x + w / 2, y), (x + w, y + h)]
    return rounded_poly(pts, r * 1.6)


def R(x, y, w, h, r, f):
    return ("r", x, y, w, h, r, f)


def C(x, y, d, f, inner=None):
    return ("c", x, y, d, f, inner)


def P(g, f, sw, fill=None, join="round"):
    return ("p", g, f, sw, fill, join)


def F(g, f):
    return ("f", g, f)


ICONS = {
    "flame-streak": [C(9, 18, 30, "#FF9600"), F(tri(10, -1, 28, 36, 2.5), "#FF9600"), C(16, 30, 16, "#FFC800"),
                     F(tri(16, 14, 16, 24, 2), "#FFC800"), R(13, 24, 4, 8, 2, "#FFB84D")],
    "bubble-phrases": [R(4, 9, 40, 30, 12, "#5A3FD9"), F(tri(10, 33, 13, 11, 3, True), "#5A3FD9"),
                       R(4, 6, 40, 30, 12, "#7B5CFF"), F(tri(10, 30, 13, 11, 3, True), "#7B5CFF"),
                       C(12, 18, 6, "#FFFFFF"), C(21, 18, 6, "#FFFFFF"), C(30, 18, 6, "#FFFFFF")],
    "apple-currency": [C(10, 13, 33, "#EA2B2B"), C(7, 12, 33, "#FF4B4B"), R(13, 18, 5, 10, 2.5, "#FF8A8A"),
                       R(22, 3, 4, 11, 2, "#B66E28"), ("leaf",)],
    "level-badge": [("hex", 6, 7, 36, 40, "#E0A400"), ("hex", 6, 4, 36, 40, "#FFC800"),
                    F(star(24, 24, 10, 4.6), "#FFFFFF")],
    "book-phrase-list": [R(3, 12, 42, 29, 5, "#C9BDFF"), R(4, 9, 19, 28, 4, "#FFFFFF"), R(25, 9, 19, 28, 4, "#FFFFFF"),
                         R(8, 16, 11, 3, 1.5, "#C9BDFF"), R(8, 23, 8, 3, 1.5, "#C9BDFF"),
                         R(29, 16, 11, 3, 1.5, "#C9BDFF"), R(29, 23, 8, 3, 1.5, "#C9BDFF")],
    "trophy-unit": [C(4, 8, 14, "#FFC800", 0.45), C(30, 8, 14, "#FFC800", 0.45), R(11, 5, 26, 22, (4, 4, 13, 13), "#FFC800"),
                    R(28, 5, 9, 22, (0, 4, 13, 0), "#E6AE00"), R(15, 9, 4, 10, 2, "#FFE36E"), R(21, 26, 6, 8, 2, "#F49000"),
                    R(13, 33, 22, 9, 4, "#F49000"), R(16, 31, 16, 4, 2, "#FFC800")],
    "coffee-kafeda": [R(17, 3, 4, 10, 2, "#C9BDFF"), R(24, 1, 4, 12, 2, "#C9BDFF"), R(31, 3, 4, 10, 2, "#C9BDFF"),
                      C(31, 19, 14, "#1CB0F6", 0.45), R(9, 16, 28, 24, (4, 4, 11, 11), "#1CB0F6"),
                      R(29, 16, 8, 24, (0, 4, 11, 0), "#1899D6"), R(11, 17, 24, 5, 2.5, "#B66E28"),
                      R(13, 25, 4, 9, 2, "#84D8FF"), R(4, 39, 40, 6, 3, "#2B70C9")],
    "cart-dokon": [C(13, 4, 12, "#FF4B4B"), R(29, 2, 8, 14, 3, "#58CC02"), R(1, 11, 13, 4, 2, "#4B4B4B"),
                   R(9, 14, 33, 19, (3, 3, 8, 8), "#FF9600"), R(9, 27, 33, 6, (0, 0, 8, 8), "#E07E00"),
                   R(15, 18, 3, 8, 1.5, "#FFC800"), R(24, 18, 3, 8, 1.5, "#FFC800"), R(33, 18, 3, 8, 1.5, "#FFC800"),
                   C(12, 35, 9, "#4B4B4B"), C(32, 35, 9, "#4B4B4B")],
    "tab-home": [F(tri(2, 2, 44, 24, 4), "#FF4B4B"), R(9, 21, 30, 23, 4, "#FFC800"),
                 R(31, 21, 8, 23, (0, 4, 4, 0), "#F2B200"), R(20, 30, 8, 14, (4, 4, 0, 0), "#B66E28")],
    "tab-progress": [R(6, 26, 10, 17, 5, "#58CC02"), R(19, 16, 10, 27, 5, "#1CB0F6"), R(32, 5, 10, 38, 5, "#FFC800")],
    "tab-profile": [R(8, 26, 32, 18, (16, 16, 6, 6), "#7B5CFF"), C(15, 5, 18, "#FFB59F"),
                    R(15, 5, 18, 7, (9, 9, 2, 2), "#3D3D3D")],
    "glyph-star": [F(star(24, 25, 17, 8), GREY)],
    "glyph-star-white": [F(star(24, 25, 17, 8), "#FFFFFF")],
    "glyph-mic": [R(17, 5, 14, 23, 7, GREY), P("M12 22 A12 12 0 0 0 36 22", GREY, 4, fill="none"),
                  R(22, 33, 4, 7, 2, GREY), R(15, 39, 18, 4, 2, GREY)],
    "glyph-headphones": [P("M10 30 V25 A14 14 0 0 1 38 25 V30", GREY, 5, fill="none"),
                         R(6, 26, 10, 16, 5, GREY), R(32, 26, 10, 16, 5, GREY)],
    "glyph-chat": [R(5, 7, 38, 27, 11, GREY), F(tri(11, 30, 13, 12, 3, True), GREY),
                   C(13, 18, 6, HOLE), C(21, 18, 6, HOLE), C(29, 18, 6, HOLE)],
}


def rounded_rect(x, y, w, h, r, f):
    if not isinstance(r, tuple):
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{f}"/>'
    tl, tr, br, bl = r
    d = (f"M{x + tl} {y} H{x + w - tr} A{tr} {tr} 0 0 1 {x + w} {y + tr} V{y + h - br} "
         f"A{br} {br} 0 0 1 {x + w - br} {y + h} H{x + bl} A{bl} {bl} 0 0 1 {x} {y + h - bl} "
         f"V{y + tl} A{tl} {tl} 0 0 1 {x + tl} {y} Z")
    return f'<path d="{d}" fill="{f}"/>'


def hexagon(x, y, w, h, f):
    cx, cy, rx, ry = x + w / 2, y + h / 2, w / 2, h / 2
    pts = [(cx + rx * math.cos(math.radians(a)), cy + ry * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    return f'<path d="{rounded_poly(pts, 5)}" fill="{f}"/>'


def render(shape):
    kind = shape[0]
    if kind == "r":
        return rounded_rect(*shape[1:])
    if kind == "c":
        _, x, y, d, f, inner = shape
        r = d / 2
        if inner:
            w = r * (1 - inner)
            return (f'<circle cx="{x + r}" cy="{y + r}" r="{r - w / 2}" fill="none" stroke="{f}" '
                    f'stroke-width="{w}" stroke-linecap="round"/>')
        return f'<circle cx="{x + r}" cy="{y + r}" r="{r}" fill="{f}"/>'
    if kind == "p":
        _, g, f, sw, fill, join = shape
        return (f'<path d="{g}" fill="{fill or f}" stroke="{f}" stroke-width="{sw}" '
                f'stroke-linecap="round" stroke-linejoin="{join}"/>')
    if kind == "f":
        return f'<path d="{shape[1]}" fill="{shape[2]}"/>'
    if kind == "hex":
        return hexagon(*shape[1:])
    if kind == "leaf":
        return '<rect x="26" y="9" width="13" height="7" rx="3.5" fill="#58CC02" transform="rotate(-25 26 9)"/>'
    raise ValueError(kind)


def main():
    out = Path(__file__).parent / "svg"
    out.mkdir(exist_ok=True)
    for name, shapes in ICONS.items():
        body = "\n  ".join(render(s) for s in shapes)
        (out / f"{name}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">\n  {body}\n</svg>\n',
            encoding="utf-8")
    print(f"wrote {len(ICONS)} icons to {out}")


if __name__ == "__main__":
    main()
