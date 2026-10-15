"""Parts shared by the lesson pictures: groups, the "?" badge, hands, the T-shirt, and the two people (Aziz and Malika).

Everything is drawn on the 48x48 grid of build_icons.py. A part is a list of shapes in its own frame; G() moves and scales it.
"""
from build_icons import C, F, P, R, render, rounded_poly

WHITE, INK = "#FFFFFF", "#4B4B4B"
VIOLET, VIOLET_D, VIOLET_L, LILAC = "#7B5CFF", "#5A3FD9", "#9F86FF", "#C9BDFF"
CORAL, CORAL_D = "#FF6B5B", "#E0503F"
RED, RED_D, RED_L = "#FF4B4B", "#EA2B2B", "#FF8A8A"
BLUE, BLUE_D, BLUE_L, SKY = "#1CB0F6", "#1899D6", "#84D8FF", "#BFE8FF"
GREEN, GREEN_D, GREEN_L = "#58CC02", "#58A700", "#89E219"
GOLD, GOLD_D, GOLD_L = "#FFC800", "#E6AE00", "#FFE36E"
WOOD, WOOD_D, CREAM = "#E09A3E", "#B66E28", "#FFE2A8"
# skin: base, shade (nose, neck, the far hand), dark accent (mouth)
SKIN_A, SHADE_A, DARK_A, HAIR_A = "#DB8E73", "#B4654A", "#8C432A", "#55505F"      # Aziz
SKIN_M, SHADE_M, DARK_M, HAIR_M = "#FFB59F", "#FA8E77", "#C6553F", "#7A4A32"      # Malika
SKIN_B, SHADE_B = "#C6775B", "#A3563B"                                             # the second hand in a pair


def raw(s):
    return ("raw", s)


def svg(shapes):
    return "".join(s[1] if s[0] == "raw" else render(s) for s in shapes)


def G(shapes, tx=0, ty=0, s=1, deg=0, pivot=(24, 24), flip=False):
    """A part moved to (tx, ty) and scaled by s; deg turns it around `pivot` (a point of its own frame); flip mirrors it."""
    t = f"translate({tx} {ty}) scale({-s if flip else s} {s})" + (f" rotate({deg} {pivot[0]} {pivot[1]})" if deg else "")
    return raw(f'<g transform="{t}">{svg(shapes)}</g>')


def rot(x, y, w, h, deg, f, px=None, py=None):
    """Pill turned around its own centre, or around (px, py)."""
    px, py = (x + w / 2 if px is None else px), (y + h / 2 if py is None else py)
    return raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{min(w, h) / 2}" fill="{f}" '
               f'transform="rotate({deg} {px} {py})"/>')


def ask(cx=38.5, cy=10, r=8.5):
    """The small round "?" badge: this picture is a question."""
    return [C(cx - r, cy - r + 1.6, 2 * r, VIOLET_D), C(cx - r, cy - r, 2 * r, VIOLET),
            P(f"M{cx - 2.8} {cy - 2.6} A2.8 2.8 0 1 1 {cx + 1.6} {cy - 0.2} Q{cx} {cy + 0.8} {cx} {cy + 1.9}",
              WHITE, 2.3, fill="none"),
            C(cx - 1.35, cy + 3.7, 2.7, WHITE)]


def heart(col=RED, edge=RED_D, light=RED_L):
    """The heart of the heart icon, in its 48 frame."""
    def one(dy, f):
        return [C(3.5, 6.5 + dy, 22, f), C(22.5, 6.5 + dy, 22, f),
                F(rounded_poly([(7.5, 21 + dy), (40.5, 21 + dy), (24, 39.8 + dy)], 3), f)]
    return one(2, edge) + one(0, col) + [R(9, 11, 5, 8, 2.5, light)]


def twinkle(cx, cy, r, f=GOLD):
    """A sparkle: two crossed pills."""
    return [R(cx - r, cy - r * 0.28, 2 * r, r * 0.56, r * 0.28, f), R(cx - r * 0.28, cy - r, r * 0.56, 2 * r, r * 0.28, f)]


# ---------- hands (each in the 48 frame, cuff at the bottom or the left) ----------
def palm(skin=SKIN_M, cuff=VIOLET):
    """Open hand, fingers up, seen from the front (the hand of the hand-wave icon, upright)."""
    return [R(17, 34, 15, 12, 4.5, cuff), rot(15, 6, 7.5, 20, -12, skin, 18.75, 26), R(21.5, 3, 7.5, 21, 3.75, skin),
            rot(28, 6, 7.5, 19, 12, skin, 31.75, 25), rot(3, 20, 16, 7.5, 30, skin, 17, 24), R(12, 18, 24, 21, 10, skin)]


def thumb_up(skin=SKIN_M, shade=SHADE_M, cuff=VIOLET):
    """Fist with the thumb up; the arm comes from the left."""
    return [R(3, 24, 11, 15, 3.5, cuff), rot(17, 4, 9.5, 22, 8, skin, 22, 24), R(12, 20, 27, 22, 8.5, skin),
            R(28, 24.5, 9, 2.6, 1.3, shade), R(28, 29.7, 9, 2.6, 1.3, shade), R(28, 34.9, 8, 2.6, 1.3, shade)]


def pointing(skin=SKIN_M, shade=SHADE_M, cuff=VIOLET):
    """Hand pointing to the right; the arm comes from the left."""
    return [R(1, 19, 10, 15, 3.5, cuff), R(22, 17, 24, 8, 4, skin), rot(11, 10.5, 14, 7.5, -18, skin),
            R(9, 15, 21, 22, 8.5, skin), R(23, 27.2, 7, 2.6, 1.3, shade), R(23, 32, 6, 2.6, 1.3, shade)]


# ---------- the T-shirt, in a 36 x 32 frame ----------
def tshirt(col, shade, light):
    return [F(rounded_poly([(10, 1), (0, 9), (5, 16), (13, 10)], 2), col),
            F(rounded_poly([(26, 1), (36, 9), (31, 16), (23, 10)], 2), shade),
            R(8, 1, 20, 31, (5, 5, 4, 4), col), R(22, 9.5, 6, 22.5, (0, 0, 4, 0), shade),
            R(13, 1, 10, 5.5, (0, 0, 5, 5), shade), R(11.5, 11, 3, 8, 1.5, light)]


TEE_RED, TEE_BLUE, TEE_GREEN = (RED, RED_D, RED_L), (BLUE, BLUE_D, BLUE_L), (GREEN, GREEN_D, GREEN_L)
TEE_GOLD, TEE_VIOLET = (GOLD, GOLD_D, GOLD_L), (VIOLET, VIOLET_D, VIOLET_L)


def tag(col=RED, line=RED_L, edge=RED_D, string=WOOD_D):
    """A price tag in a 20 x 13 frame: the string and its hole at the left, two lines where the price is."""
    shape = [(0, 6.5), (6, 0), (20, 0), (20, 13), (6, 13)]
    return [P("M5.8 6.5 Q0.5 6 -3.5 1", string, 1.1, fill="none"),
            F(rounded_poly([(x, y + 1) for x, y in shape], 2.2), edge), F(rounded_poly(shape, 2.2), col), C(4, 4.7, 3.6, WHITE),
            R(10, 3.4, 7, 2.2, 1.1, line), R(10, 7.4, 5, 2.2, 1.1, line)]


def name_badge(x, y, w=10, h=8):
    """The small name card worn on the chest: a coloured top and two short lines, no letters."""
    return [R(x, y, w, h, 2, WHITE), R(x, y, w, h * 0.34, (2, 2, 0, 0), GOLD),
            R(x + 1.6, y + h * 0.48, w - 3.2, 1.3, 0.65, LILAC), R(x + 1.6, y + h * 0.72, w - 5, 1.3, 0.65, LILAC)]


# ---------- the two people, chest up, head centred on x = 24 ----------
def eyes(y=14.6, gap=0.0):
    return [R(18.3 - gap, y, 4.6, 6.2, 2.3, WHITE), R(25.1 + gap, y, 4.6, 6.2, 2.3, WHITE),
            R(20 - gap, y + 1.6, 2, 3, 1, INK), R(26 + gap, y + 1.6, 2, 3, 1, INK)]      # pupils a little towards the nose


def aziz_head(mouth="smile"):
    m = {"smile": P("M20.6 23.3 Q24.4 26.1 27.6 22.7", DARK_A, 1.5, fill="none"),
         "hm": P("M21.2 24.2 Q24 23.7 26.4 24.4", DARK_A, 1.5, fill="none")}[mouth]
    return [C(13.6, 15.6, 4.8, SKIN_A), C(29.6, 15.6, 4.8, SKIN_A), R(16, 7.5, 16, 19.5, (8, 8, 6, 6), SKIN_A),
            R(15.3, 4.8, 17.4, 9, (8.7, 8.7, 0.3, 0.3), HAIR_A), R(18.4, 11.2, 11.2, 3.4, (2.6, 2.6, 0, 0), SKIN_A),      # the hair, then the forehead over it
            R(15.3, 12, 3.1, 3.6, (0, 0, 1.5, 1.5), HAIR_A), R(29.6, 12, 3.1, 3.6, (0, 0, 1.5, 1.5), HAIR_A),
            R(23.6, 3.4, 8.6, 4.6, 2.3, HAIR_A),
            *eyes(), R(22.9, 18.4, 2.2, 3, 1.1, SHADE_A), m]


def aziz(top=VIOLET, top_d=VIOLET_D, mouth="smile"):
    """Aziz: a young man, short dark hair, violet top."""
    return [R(8, 30, 32, 17, (13, 13, 4, 4), top), R(19.5, 30, 9, 3.6, (0, 0, 3.6, 3.6), top_d),
            R(20.5, 24, 7, 8, 3.5, SHADE_A), *aziz_head(mouth)]


def malika(top=CORAL, top_d=CORAL_D):
    """Malika: a young woman, hair in a bun, coral top."""
    return [C(18.5, 0, 11, HAIR_M), R(12.5, 6, 23, 27, (11.5, 11.5, 7, 7), HAIR_M),
            R(8, 30, 32, 17, (13, 13, 4, 4), top), R(19.5, 30, 9, 3.6, (0, 0, 3.6, 3.6), top_d),
            R(20.5, 24, 7, 8, 3.5, SHADE_M), R(16.2, 8, 15.6, 19, (7.8, 7.8, 6.5, 6.5), SKIN_M),
            R(16.4, 6.6, 15.2, 4.4, (4.4, 4.4, 0, 0), HAIR_M), rot(15.2, 7.4, 5.4, 9.6, 14, HAIR_M),                     # the fringe, swept to one side
            *eyes(), R(22.9, 18.4, 2.2, 3, 1.1, SHADE_M), P("M20.8 23 Q24 25.7 27.2 22.8", DARK_M, 1.5, fill="none"),
            C(13.4, 20.4, 2.6, GOLD), C(32, 20.4, 2.6, GOLD)]
