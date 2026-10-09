"""Akademiya icon set v2 — every remaining icon in Duolingo illustration style.

glyphs/      single-colour UI glyphs, each ONE filled path (recolourable in Rive / Pencil / code)
illustrated/ multi-colour icons that replace the emoji placeholders
All drawn on a 48x48 grid. Run: python build_icons2.py
"""
import math
from pathlib import Path

from build_icons import rounded_poly, star

# ---------- single-path glyph helpers (clockwise = solid, counter-clockwise = hole) ----------

def rr(x, y, w, h, r, hole=False):
    tl, tr, br, bl = r if isinstance(r, tuple) else (r, r, r, r)
    if not hole:
        return (f"M{x + tl} {y} H{x + w - tr} A{tr} {tr} 0 0 1 {x + w} {y + tr} V{y + h - br} "
                f"A{br} {br} 0 0 1 {x + w - br} {y + h} H{x + bl} A{bl} {bl} 0 0 1 {x} {y + h - bl} "
                f"V{y + tl} A{tl} {tl} 0 0 1 {x + tl} {y} Z ")
    return (f"M{x + tl} {y} A{tl} {tl} 0 0 0 {x} {y + tl} V{y + h - bl} A{bl} {bl} 0 0 0 {x + bl} {y + h} "
            f"H{x + w - br} A{br} {br} 0 0 0 {x + w} {y + h - br} V{y + tr} A{tr} {tr} 0 0 0 {x + w - tr} {y} Z ")


def circ(cx, cy, r, hole=False):
    s = 0 if hole else 1
    return f"M{cx - r} {cy} A{r} {r} 0 1 {s} {cx + r} {cy} A{r} {r} 0 1 {s} {cx - r} {cy} Z "


def ring(cx, cy, r, w):
    return circ(cx, cy, r + w / 2) + circ(cx, cy, r - w / 2, hole=True)


def cap(x1, y1, x2, y2, w, hole=False):
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * w / 2, dx / L * w / 2
    pts = [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]
    area = sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))
    if (area < 0) != hole:
        pts = [pts[3], pts[2], pts[1], pts[0]]
    s = 0 if hole else 1
    r = w / 2
    a, b, c, d = pts
    return (f"M{a[0]:.2f} {a[1]:.2f} L{b[0]:.2f} {b[1]:.2f} A{r} {r} 0 0 {s} {c[0]:.2f} {c[1]:.2f} "
            f"L{d[0]:.2f} {d[1]:.2f} A{r} {r} 0 0 {s} {a[0]:.2f} {a[1]:.2f} Z ")


def arc(cx, cy, r, a0, a1, w):
    """Thick arc with round ends, clockwise from angle a0 to a1 (degrees, 0 = right, 90 = down)."""
    R, ri, h = r + w / 2, r - w / 2, w / 2
    p = lambda rad, a: (cx + rad * math.cos(math.radians(a)), cy + rad * math.sin(math.radians(a)))
    lg = 1 if (a1 - a0) > 180 else 0
    o0, o1, i1, i0 = p(R, a0), p(R, a1), p(ri, a1), p(ri, a0)
    return (f"M{o0[0]:.2f} {o0[1]:.2f} A{R} {R} 0 {lg} 1 {o1[0]:.2f} {o1[1]:.2f} A{h} {h} 0 0 1 {i1[0]:.2f} {i1[1]:.2f} "
            f"A{ri} {ri} 0 {lg} 0 {i0[0]:.2f} {i0[1]:.2f} A{h} {h} 0 0 1 {o0[0]:.2f} {o0[1]:.2f} Z ")


def poly(pts, r):
    return rounded_poly(pts, r) + " "


GLYPHS = {
    "check": cap(12, 25, 20, 33, 6) + cap(20, 33, 36, 15, 6),
    "close": cap(14, 14, 34, 34, 6) + cap(34, 14, 14, 34, 6),
    "chevron-right": cap(19, 13, 30, 24, 6) + cap(30, 24, 19, 35, 6),
    "chevron-left": cap(29, 13, 18, 24, 6) + cap(18, 24, 29, 35, 6),
    "lock": arc(24, 19, 8.5, 180, 360, 6.5) + cap(15.5, 18, 15.5, 24, 6.5) + cap(32.5, 18, 32.5, 24, 6.5)
            + rr(9, 21, 30, 23, 7) + circ(24, 30, 3.6, True) + rr(22.2, 31, 3.6, 7, 1.8, True),
    "speaker": rr(7, 18, 10, 12, 3) + poly([(13, 18), (25, 9), (25, 39), (13, 30)], 2.5)
               + arc(26, 24, 8, -45, 45, 4) + arc(26, 24, 14.5, -45, 45, 4),
    "mic": rr(18, 5, 12, 23, 6) + arc(24, 22, 11, 0, 180, 4) + cap(24, 33, 24, 40, 4) + cap(17, 41, 31, 41, 4),
    "mic-off": rr(18, 5, 12, 23, 6) + arc(24, 22, 11, 0, 180, 4) + cap(24, 33, 24, 40, 4)
               + cap(17, 41, 31, 41, 4) + cap(11, 9, 37, 39, 4.5),
    "play": poly([(15, 9), (39, 24), (15, 39)], 4),
    "replay": arc(24, 25, 12, 200, 470, 5) + poly([(4, 19), (17, 15), (13, 27)], 2),
    "more": circ(13, 24, 3.6) + circ(24, 24, 3.6) + circ(35, 24, 3.6),
    "list": circ(11, 14, 3) + circ(11, 24, 3) + circ(11, 34, 3) + cap(19, 14, 38, 14, 5)
            + cap(19, 24, 38, 24, 5) + cap(19, 34, 31, 34, 5),
    "timer": ring(24, 27, 13, 5) + cap(24, 27, 24, 20, 4) + rr(19, 5, 10, 5, 2.5) + cap(36, 12, 39, 15, 4),
    "user": circ(24, 15, 8.5) + rr(9, 28, 30, 15, (15, 15, 5, 5)),
    "message": rr(7, 8, 34, 25, 10) + poly([(12, 28), (24, 30), (13, 41)], 2.5),
    "target": circ(24, 24, 17) + circ(24, 24, 12.5, True) + circ(24, 24, 8) + circ(24, 24, 3.8, True) + circ(24, 24, 1.8),
    "bell": ("M24 6 C34 6 36 14 36 22 V28 C36 31 39 33 41 35 Q42 37 40 37 H8 Q6 37 7 35 C9 33 12 31 12 28 V22 "
             "C12 14 14 6 24 6 Z ") + rr(6, 34, 36, 6, 3) + circ(24, 41.5, 4) + circ(24, 6, 3.2),
    "shield": poly([(24, 5), (39, 11), (37, 30), (24, 43), (11, 30), (9, 11)], 5),
    "trash": cap(10, 13, 38, 13, 5) + rr(19, 6, 10, 6, 3) + rr(13, 17, 22, 26, 5)
             + rr(18.5, 22, 3.5, 15, 1.75, True) + rr(26, 22, 3.5, 15, 1.75, True),
    "info": circ(24, 24, 17) + circ(24, 15.5, 2.7, True) + rr(21.75, 20.5, 4.5, 14, 2.25, True),
    "wifi-off": arc(24, 34, 20, 225, 315, 4.5) + arc(24, 34, 12, 225, 315, 4.5) + circ(24, 36, 3.5)
                + cap(10, 8, 38, 40, 4.5),
    "slow": circ(20, 23, 12) + circ(20, 23, 7, True) + circ(20, 23, 3) + rr(5, 33, 37, 9, 4.5)
            + cap(37, 37, 40, 24, 8) + cap(38, 25, 35, 14, 2.6) + cap(41, 25, 44.5, 15, 2.6)
            + circ(35, 13, 2.6) + circ(44.6, 14.5, 2.6),
    "wave": cap(10, 20, 10, 28, 5) + cap(17, 15, 17, 33, 5) + cap(24, 10, 24, 38, 5) + cap(31, 15, 31, 33, 5)
            + cap(38, 20, 38, 28, 5),
    "sparkles": poly([(20, 10), (24, 22), (36, 26), (24, 30), (20, 42), (16, 30), (4, 26), (16, 22)], 2)
                + poly([(37, 4), (39, 9), (44, 11), (39, 13), (37, 18), (35, 13), (30, 11), (35, 9)], 1),
    "circle-check": ring(24, 24, 16, 4.5) + cap(16, 25, 21.5, 30.5, 4.5) + cap(21.5, 30.5, 32, 18.5, 4.5),
    "phone": rr(13, 4, 22, 40, 6) + rr(16.5, 9, 15, 26, 2.5, True) + circ(24, 39, 2.2, True),
    "home": poly([(24, 5), (45, 23), (3, 23)], 3) + rr(32, 8, 6, 12, 2) + rr(9, 20, 30, 23, (0, 0, 5, 5))
            + rr(20, 30, 8, 13, (4, 4, 0, 0), True),
    "chart": rr(7, 27, 8, 15, 4) + rr(20, 18, 8, 24, 4) + rr(33, 7, 8, 35, 4),
    "star": star(24, 25, 17, 8) + " ",
}

# ---------- illustrated (multi-colour) — same shape language as build_icons.py ----------
from build_icons import R, C, F  # noqa: E402


def leaf(bx, by, ang, L, W, color):
    """Duolingo-style teardrop leaf: starts at the stem (bx, by), round body, soft tip at length L."""
    a = math.radians(ang)
    dx, dy = math.cos(a), math.sin(a)
    px, py = -dy, dx
    T = (bx + dx * L, by + dy * L)
    f = lambda v: f"{v[0]:.2f} {v[1]:.2f}"
    c1 = (bx + px * W * 0.75 + dx * L * 0.1, by + py * W * 0.75 + dy * L * 0.1)
    c2 = (T[0] - dx * L * 0.35 + px * W * 0.55, T[1] - dy * L * 0.35 + py * W * 0.55)
    c3 = (T[0] - dx * L * 0.35 - px * W * 0.55, T[1] - dy * L * 0.35 - py * W * 0.55)
    c4 = (bx - px * W * 0.75 + dx * L * 0.1, by - py * W * 0.75 + dy * L * 0.1)
    return ("raw", f'<path d="M{f((bx, by))} C{f(c1)} {f(c2)} {f(T)} C{f(c3)} {f(c4)} {f((bx, by))} Z" fill="{color}"/>')

SKIN, SKIN_SH = "#FFB59F", "#FA8E77"
HAND = (
    '<rect x="13" y="37" width="25" height="10" rx="4.5" fill="#7B5CFF"/>'
    '<rect x="13" y="42.5" width="25" height="4.5" rx="2.25" fill="#5A3FD9"/>'
    '<rect x="4" y="21" width="15" height="7.5" rx="3.75" fill="#FA8E77" transform="rotate(38 17 25)"/>'
    '<rect x="4" y="20" width="15" height="7.5" rx="3.75" fill="#FFB59F" transform="rotate(38 17 25)"/>'
    '<rect x="14" y="8" width="6.2" height="18" rx="3.1" fill="#FFB59F"/>'
    '<rect x="19.6" y="4.5" width="6.2" height="21" rx="3.1" fill="#FFB59F"/>'
    '<rect x="25.2" y="5.5" width="6.2" height="20" rx="3.1" fill="#FFB59F"/>'
    '<rect x="30.8" y="10" width="6.2" height="16" rx="3.1" fill="#FFB59F"/>'
    '<path d="M14 21 H37 V31 A10 10 0 0 1 27 41 H24 A10 10 0 0 1 14 31 Z" fill="#FFB59F"/>'
    '<path d="M31 21 H37 V31 A10 10 0 0 1 27 41 H26 A10 10 0 0 0 31 31 Z" fill="#FA8E77"/>'
    '<path d="M19.9 13 V21 M25.5 12 V21 M31.1 15 V21" stroke="#FA8E77" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
    '<rect x="16" y="11" width="2.4" height="6" rx="1.2" fill="#FFD3C4"/>'
)

FACE, FACE_SH, EEL = "#FFC800", "#F2A900", "#4B4B4B"


def face(extra):
    return [C(5, 6, 38, FACE_SH), C(5, 4, 38, FACE), R(11, 12, 6, 6, 3, "#FFE36E")] + extra


ILLU = {
    "bulb-tip": [C(9, 4, 30, "#FFC800"), R(29, 8, 8, 18, (0, 6, 6, 0), "#F2A900"), R(14, 9, 5, 9, 2.5, "#FFF3B0"),
                 R(17, 30, 14, 6, 3, "#AFAFAF"), R(18, 35, 12, 5, 2.5, "#8A8AA0"), R(21, 40, 6, 4, 2, "#8A8AA0")],
    "party-popper": [F(rounded_poly([(6, 42), (16, 18), (30, 32)], 2.5), "#7B5CFF"),
                     F(rounded_poly([(6, 42), (12, 28), (18, 34)], 1.5), "#5A3FD9"),
                     R(28, 6, 4, 9, 2, "#FF4B4B"), R(36, 14, 4, 9, 2, "#1CB0F6"), R(19, 4, 4, 7, 2, "#58CC02"),
                     C(38, 4, 5, "#FFC800"), C(40, 28, 5, "#FF9600"), C(30, 20, 4, "#FF86D0")],
    "sparkles": [F(star(20, 27, 15, 5, 2.4), "#FFC800"), F(star(37, 11, 8, 3, 1.2), "#FF9600"),
                 F(star(38, 36, 5, 2, 0.8), "#FFC800")],
    "face-starstruck": [C(5, 6, 38, FACE_SH), C(5, 4, 38, FACE), ("raw", '<rect x="11.5" y="10.5" width="5" height="9" rx="2.5" fill="#FFE36E" transform="rotate(35 14 15)"/>'), F(star(17, 20, 6.5, 3, 1), "#FF4B4B"), F(star(31, 20, 6.5, 3, 1), "#FF4B4B"), ("raw", '<path d="M13 27 H35 Q35 38.5 24 38.5 Q13 38.5 13 27 Z" fill="#AD3B3B"/><rect x="15" y="27" width="18" height="4" rx="2" fill="#FFFFFF"/><rect x="18.5" y="33" width="11" height="4" rx="2" fill="#F05656"/>')],
    "face-grin": [C(5, 6, 38, FACE_SH), C(5, 4, 38, FACE), ("raw", '<rect x="11.5" y="10.5" width="5" height="9" rx="2.5" fill="#FFE36E" transform="rotate(35 14 15)"/>'), R(15, 15, 5, 8, 2.5, EEL), R(28, 15, 5, 8, 2.5, EEL), ("raw", '<path d="M13 27 H35 Q35 38.5 24 38.5 Q13 38.5 13 27 Z" fill="#AD3B3B"/><rect x="15" y="27" width="18" height="4" rx="2" fill="#FFFFFF"/><rect x="18.5" y="33" width="11" height="4" rx="2" fill="#F05656"/>')],
    "face-smile": face([R(16, 18, 5, 7, 2.5, EEL), R(27, 18, 5, 7, 2.5, EEL),
                        ("p", "M17 30 Q24 36 31 30", EEL, 3, "none", "round")]),
    "face-pleading": face([C(12, 14, 11, "#FFFFFF"), C(25, 14, 11, "#FFFFFF"), C(14, 16, 7, EEL), C(27, 16, 7, EEL),
                           C(16, 17, 2.5, "#FFFFFF"), C(29, 17, 2.5, "#FFFFFF"),
                           ("p", "M19 34 Q24 30 29 34", EEL, 3, "none", "round")]),
    "face-dizzy": face([("p", "M14 16 L20 22 M20 16 L14 22 M28 16 L34 22 M34 16 L28 22", EEL, 3, "none", "round"),
                        C(19, 28, 10, "#AD3B3B")]),
    "money-bag": [C(11, 15, 32, "#43C000"), C(8, 14, 32, "#58CC02"), R(17, 8, 14, 9, 3, "#58CC02"),
                  C(13, 2, 9, "#58CC02"), C(19.5, 0.5, 9, "#58CC02"), C(26, 2, 9, "#58CC02"), R(15, 13, 18, 5, 2.5, "#FFC800"),
                  R(12, 22, 4, 9, 2, "#89E219"), C(25, 27, 18, "#E0A400"), C(25, 25, 18, "#FFC800"), R(30, 29, 3.5, 10, 1.75, "#FFE36E")],
    "card": [R(4, 12, 40, 28, 6, "#1453A3"), R(4, 10, 40, 28, 6, "#1CB0F6"), R(4, 16, 40, 6, 0, "#2B70C9"),
             R(9, 28, 10, 5, 2.5, "#FFC800"), R(24, 29, 14, 3, 1.5, "#84D8FF")],
    "hand-wave": [("raw", '<g transform="rotate(-12 24 30)"><rect x="17" y="34" width="15" height="12" rx="4.5" fill="#7B5CFF"/><rect x="15" y="6" width="7.5" height="20" rx="3.75" fill="#FFB59F" transform="rotate(-12 18.75 26)"/><rect x="21.5" y="3" width="7.5" height="21" rx="3.75" fill="#FFB59F"/><rect x="28" y="6" width="7.5" height="19" rx="3.75" fill="#FFB59F" transform="rotate(12 31.75 25)"/><rect x="3" y="20" width="16" height="7.5" rx="3.75" fill="#FFB59F" transform="rotate(30 17 24)"/><rect x="12" y="18" width="24" height="21" rx="10" fill="#FFB59F"/></g>'
                          '<path d="M40 5 Q45.5 8 46 14.5 M37 9.5 Q40.5 11 41 15" stroke="#1CB0F6" stroke-width="2.6" fill="none" stroke-linecap="round"/>')],
    "hands-up": [("raw", '<g transform="translate(25 13) rotate(-10 -12 15) scale(-0.6 0.6)"><rect x="17" y="34" width="15" height="12" rx="4.5" fill="#7B5CFF"/><rect x="15" y="6" width="7.5" height="20" rx="3.75" fill="#FFB59F" transform="rotate(-12 18.75 26)"/><rect x="21.5" y="3" width="7.5" height="21" rx="3.75" fill="#FFB59F"/><rect x="28" y="6" width="7.5" height="19" rx="3.75" fill="#FFB59F" transform="rotate(12 31.75 25)"/><rect x="3" y="20" width="16" height="7.5" rx="3.75" fill="#FFB59F" transform="rotate(30 17 24)"/><rect x="12" y="18" width="24" height="21" rx="10" fill="#FFB59F"/></g>'
                         '<g transform="translate(23 13) rotate(10 12 15) scale(0.6)"><rect x="17" y="34" width="15" height="12" rx="4.5" fill="#7B5CFF"/><rect x="15" y="6" width="7.5" height="20" rx="3.75" fill="#FFB59F" transform="rotate(-12 18.75 26)"/><rect x="21.5" y="3" width="7.5" height="21" rx="3.75" fill="#FFB59F"/><rect x="28" y="6" width="7.5" height="19" rx="3.75" fill="#FFB59F" transform="rotate(12 31.75 25)"/><rect x="3" y="20" width="16" height="7.5" rx="3.75" fill="#FFB59F" transform="rotate(30 17 24)"/><rect x="12" y="18" width="24" height="21" rx="10" fill="#FFB59F"/></g>'
                         '<path d="M24 2 V8 M17 4 L19.5 8.5 M31 4 L28.5 8.5" stroke="#FFC800" stroke-width="2.6" fill="none" stroke-linecap="round"/>')],
    "ice-freeze": [R(8, 10, 32, 32, 9, "#84D8FF"), R(8, 8, 32, 32, 9, "#BDEBFF"), R(28, 8, 12, 32, (0, 9, 9, 0), "#84D8FF"),
                   R(13, 13, 6, 11, 3, "#FFFFFF"), R(21, 13, 4, 6, 2, "#FFFFFF")],
    "target": [C(3, 5, 42, "#D63445"), C(3, 3, 42, "#FF4B4B"), C(10, 10, 28, "#FFFFFF"), C(16, 16, 16, "#FF4B4B"),
               C(21, 21, 6, "#FFFFFF")],
    "calendar": [R(5, 10, 38, 34, 7, "#D9D9E3"), R(5, 8, 38, 34, 7, "#FFFFFF"), R(5, 8, 38, 11, (7, 7, 0, 0), "#FF4B4B"),
                 R(13, 4, 5, 10, 2.5, "#4B4B4B"), R(30, 4, 5, 10, 2.5, "#4B4B4B"),
                 R(11, 24, 7, 6, 2, "#E5E5E5"), R(21, 24, 7, 6, 2, "#E5E5E5"), R(31, 24, 7, 6, 2, "#7B5CFF"),
                 R(11, 33, 7, 6, 2, "#E5E5E5"), R(21, 33, 7, 6, 2, "#E5E5E5")],
    "repeat": [F(arc(24, 24, 15, 200, 340, 6), "#7B5CFF"), F(rounded_poly([(39, 13), (44, 26), (32, 24)], 1.5), "#7B5CFF"),
               F(arc(24, 24, 15, 20, 160, 6), "#FF9600"), F(rounded_poly([(9, 35), (4, 22), (16, 24)], 1.5), "#FF9600")],
    "grad-cap": [R(14, 24, 20, 13, (2, 2, 9, 9), "#5A3FD9"), F(rounded_poly([(24, 8), (46, 18), (24, 28), (2, 18)], 2.5), "#7B5CFF"),
                 R(39, 18, 3, 14, 1.5, "#FFC800"), C(37.5, 30, 6, "#FFC800")],
    "trash": [R(10, 16, 28, 28, (3, 3, 8, 8), "#AFAFAF"), R(30, 16, 8, 28, (0, 3, 8, 0), "#8A8AA0"),
              R(6, 10, 36, 7, 3.5, "#8A8AA0"), R(18, 5, 12, 7, 3, "#8A8AA0"),
              R(16, 21, 4, 17, 2, "#E5E5E5"), R(24, 21, 4, 17, 2, "#E5E5E5")],
    "bell": [("raw", '<g transform="rotate(-14 24 10)">'
                     '<circle cx="24" cy="41" r="4.2" fill="#FF9600"/>'
                     '<path d="M24 7 C34 7 36 15 36 23 V28 C36 31 39 33 41 35 Q42 37 40 37 H8 Q6 37 7 35 '
                     'C9 33 12 31 12 28 V23 C12 15 14 7 24 7 Z" fill="#FFC800"/>'
                     '<path d="M29.5 8 C34 10 36 16 36 23 V28 C36 31 39 33 41 35 Q42 37 40 37 H34.5 '
                     'C36 31 35.5 15 29.5 8 Z" fill="#F2A900"/>'
                     '<rect x="6" y="34" width="36" height="6" rx="3" fill="#F2A900"/>'
                     '<circle cx="24" cy="6.5" r="3.2" fill="#F2A900"/>'
                     '<rect x="16" y="13" width="4" height="11" rx="2" fill="#FFE36E"/></g>'
                     '<path d="M4 16 Q2 21 4 26 M44 12 Q47 17 45.5 22" stroke="#FF9600" stroke-width="2.6" '
                     'fill="none" stroke-linecap="round"/>')],
    "no-wifi": [F(arc(24, 34, 20, 225, 315, 5), "#AFAFAF"), F(arc(24, 34, 12, 225, 315, 5), "#AFAFAF"), C(20, 32, 8, "#AFAFAF"),
                F(cap(10, 8, 38, 40, 5), "#FF4B4B")],
    "speak-bubble": [R(4, 6, 40, 30, 12, "#1899D6"), R(4, 4, 40, 30, 12, "#1CB0F6"),
                     F(rounded_poly([(10, 29), (22, 31), (11, 43)], 2.5), "#1CB0F6"),
                     R(11, 16, 4, 8, 2, "#FFFFFF"), R(18, 12, 4, 16, 2, "#FFFFFF"), R(25, 14, 4, 12, 2, "#FFFFFF"),
                     R(32, 17, 4, 6, 2, "#FFFFFF")],
    "studio-mic": [R(15, 3, 18, 26, 9, "#7B5CFF"), R(26, 3, 7, 26, (0, 9, 9, 0), "#5A3FD9"), R(15, 11, 18, 3, 1.5, "#5A3FD9"),
                   R(15, 17, 18, 3, 1.5, "#5A3FD9"), R(19, 7, 4, 7, 2, "#B3A4FF"),
                   ("p", "M10 21 A14 14 0 0 0 38 21", "#AFAFAF", 4, "none", "round"), R(22, 34, 4, 7, 2, "#AFAFAF"),
                   R(14, 40, 20, 5, 2.5, "#8A8AA0")],
    "backpack": [R(16, 3, 16, 8, 4, "#D9483A"), R(8, 9, 32, 36, 10, "#D9483A"), R(8, 7, 32, 36, 10, "#FF6B5B"),
                 R(13, 27, 22, 13, 5, "#D9483A"), R(20, 31, 8, 3, 1.5, "#FFC800"), R(12, 12, 5, 10, 2.5, "#FF9A8F")],
    "notepad": [R(8, 6, 32, 40, 6, "#D9D9E3"), R(8, 4, 32, 40, 6, "#FFFFFF"), R(8, 4, 32, 8, (6, 6, 0, 0), "#1CB0F6"),
                R(13, 18, 22, 3, 1.5, "#AFAFAF"), R(13, 25, 22, 3, 1.5, "#AFAFAF"), R(13, 32, 14, 3, 1.5, "#AFAFAF"),
                R(31, 26, 6, 18, 3, "#FFC800")],
    "plane": [("raw", '<g transform="translate(0 5) rotate(18 24 20)">'
                      f'<path d="{rounded_poly([(37, 22.6), (43, 22.6), (47.5, 28.5), (45.5, 29.2)], 1.2)}" fill="#1899D6"/>'
                      '<path d="M8 12 L42 18.5 Q46 19.5 45.5 21.5 Q45 23.5 42 23.5 L11 26.5 Q2 27 2 19.5 Q2 12 8 12 Z" fill="#E5E5E5"/>'
                      f'<path d="{rounded_poly([(33, 19), (43, 12), (47, 13), (43, 20.5)], 1.2)}" fill="#1CB0F6"/>'
                      f'<path d="{rounded_poly([(5.4, 15), (8.6, 12.8), (10.9, 13.1), (10.3, 16.3)], 0.8)}" fill="#1CB0F6"/>'
                      f'<path d="{rounded_poly([(11.9, 13.3), (15.8, 14.1), (15.2, 17.2), (11.4, 16.5)], 0.8)}" fill="#1CB0F6"/>'
                      '<rect x="20" y="17" width="3.2" height="5" rx="1.6" fill="#1CB0F6"/>'
                      '<rect x="24.3" y="17.7" width="3.2" height="5" rx="1.6" fill="#1CB0F6"/>'
                      '<rect x="28.6" y="18.4" width="3.2" height="4.8" rx="1.6" fill="#1CB0F6"/>'
                      f'<path d="{rounded_poly([(10.4, 19), (12, 25.2), (33, 28.8), (32.4, 27)], 1.3)}" fill="#1CB0F6"/>'
                      '<rect x="9.8" y="14" width="2.4" height="15" rx="1.2" fill="#AFAFAF" transform="rotate(20 11 21.5)"/>'
                      '<circle cx="11" cy="21.5" r="2" fill="#AFAFAF"/></g>')],
    "briefcase": [R(17, 5, 14, 9, (4, 4, 0, 0), "#8A5A2B"), R(20, 8, 8, 6, 2, "#FFFFFF"),
                  R(4, 14, 40, 30, 7, "#8A5A2B"), R(4, 12, 40, 30, 7, "#B66E28"), R(4, 24, 40, 4, 0, "#8A5A2B"),
                  R(20, 21, 8, 10, 2.5, "#FFC800")],
    "heart": [C(3.5, 8.5, 22, "#E0A400"), C(22.5, 8.5, 22, "#E0A400"), F(rounded_poly([(4.5, 23), (43.5, 23), (24, 44)], 3), "#E0A400"),
              C(3.5, 6.5, 22, "#FFC800"), C(22.5, 6.5, 22, "#FFC800"), F(rounded_poly([(4.5, 21), (43.5, 21), (24, 42)], 3), "#FFC800"),
              R(9, 11, 5, 8, 2.5, "#FFE36E")],
    "sprout": [R(10, 38, 28, 8, 4, "#B66E28"), R(22.8, 23, 2.4, 17, 1.2, "#58A700"),
               leaf(24, 28, -150, 19, 11, "#58CC02"), leaf(24, 23, -32, 18, 10, "#89E219")],
    "plant": [R(12, 40, 24, 6, 3, "#B66E28"), R(22.8, 17, 2.4, 25, 1.2, "#58A700"),
              leaf(24, 37, -150, 17, 10, "#58A700"), leaf(24, 32, -32, 16, 9, "#58CC02"),
              R(15, 10, 18, 14, (0, 0, 9, 9), "#FF4B4B"),
              F(rounded_poly([(15, 14), (15, 5), (19.8, 10.5), (24, 3), (28.2, 10.5), (33, 5), (33, 14)], 1.8), "#FF4B4B"),
              F(rounded_poly([(24, 3), (28.2, 10.5), (33, 5), (33, 14), (26, 14)], 1.8), "#EA2B2B"),
              R(26, 12, 7, 12, (0, 0, 7, 0), "#EA2B2B"), R(18, 11, 3.5, 7, 1.75, "#FF8A8A")],
    "crown": [F(rounded_poly([(5, 15), (15, 25), (24, 8), (33, 25), (43, 15), (39, 38), (9, 38)], 3), "#FFC800"),
              R(9, 34, 30, 6, 3, "#E0A400"), C(21, 4, 6, "#FF4B4B"), C(2, 11, 6, "#1CB0F6"), C(40, 11, 6, "#58CC02"),
              R(21, 26, 6, 6, 3, "#FF4B4B")],
    "medal-silver": [F(rounded_poly([(12, 2), (22, 2), (26, 20), (16, 20)], 2), "#1CB0F6"),
                     F(rounded_poly([(26, 2), (36, 2), (32, 20), (22, 20)], 2), "#FF4B4B"),
                     C(9, 17, 30, "#9AA3B8"), C(9, 15, 30, "#C0C7D6"), C(15, 21, 18, "#E3E7EF"), R(21, 26, 6, 8, 3, "#9AA3B8")],
    "top-hat": [R(4, 34, 40, 7, 3.5, "#4B4B4B"), R(12, 8, 24, 30, (5, 5, 2, 2), "#4B4B4B"), R(12, 26, 24, 6, 0, "#7B5CFF"),
                R(28, 8, 8, 30, (0, 5, 2, 0), "#3D3D3D"), R(16, 11, 4, 12, 2, "#777777")],
    "scarf": [("raw", '<rect x="11" y="15" width="11" height="25" rx="5.5" fill="#EA2B2B"/>'
                      '<rect x="11" y="28" width="11" height="4" rx="2" fill="#FFFFFF"/>'
                      '<rect x="12" y="38" width="2.6" height="7" rx="1.3" fill="#EA2B2B"/><rect x="15.2" y="38" width="2.6" height="8" rx="1.3" fill="#EA2B2B"/>'
                      '<rect x="18.4" y="38" width="2.6" height="7" rx="1.3" fill="#EA2B2B"/>'
                      '<rect x="6" y="9" width="36" height="12" rx="6" fill="#FF4B4B"/>'
                      '<rect x="25" y="9" width="4.5" height="12" rx="2.25" fill="#FFFFFF"/><rect x="33" y="9" width="4.5" height="12" rx="2.25" fill="#FFFFFF"/>')],
    "skip-ahead": [F(rounded_poly([(4, 10), (24, 24), (4, 38)], 3.5), "#7B5CFF"), F(rounded_poly([(22, 10), (42, 24), (22, 38)], 3.5), "#9F86FF")],
}


def main():
    from build_icons import render
    base = Path(__file__).parent
    g = base / "glyphs"
    g.mkdir(exist_ok=True)
    for name, d in GLYPHS.items():
        (g / f"{name}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">\n'
            f'  <path d="{d.strip()}" fill="#4B4B4B"/>\n</svg>\n', encoding="utf-8")
    il = base / "illustrated"
    il.mkdir(exist_ok=True)
    for name, shapes in ILLU.items():
        body = "\n  ".join(s[1] if s[0] == "raw" else render(s) for s in shapes)
        (il / f"{name}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">\n  {body}\n</svg>\n',
            encoding="utf-8")
    print(f"wrote {len(GLYPHS)} glyphs, {len(ILLU)} illustrated icons")


if __name__ == "__main__":
    main()
