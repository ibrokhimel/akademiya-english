"""Lesson pictures for Unit 2 (the café: price, sugar, paying) and Unit 3 (the shop: T-shirts, colours, sizes)."""
from build_icons import C, ICONS, P, R
from lesson_pic_parts import (BLUE, BLUE_L, CORAL, CORAL_D, CREAM, G, GOLD, GOLD_D, GREEN, GREEN_D, RED, RED_D,
                              RED_L, SHADE_A, SHADE_M, SKIN_A, SKIN_M, TEE_BLUE, TEE_GOLD, TEE_GREEN, TEE_RED,
                              VIOLET, VIOLET_D, VIOLET_L, WHITE, WOOD, WOOD_D, ask, aziz_head, heart, malika, palm,
                              pointing, raw, rot, tag, tshirt, twinkle)


def cube(x, y, s=17):
    """A sugar cube: warm off-white instead of white, so it shows on a white tile; dots for the grains."""
    return [R(x, y + 1.8, s, s, 3.4, "#EFCB8E"), R(x, y, s, s, 3.4, "#FFF8EA"), R(x + s - 5, y, 5, s, (0, 3.4, 3.4, 0), "#FFEBC8"),
            C(x + 3, y + 3.4, 1.7, "#FFD99C"), C(x + 7.6, y + 8.6, 1.7, "#FFD99C"), C(x + 3.8, y + 11.8, 1.4, "#FFD99C")]


SUGAR = [*cube(3, 27), *cube(24, 27), *cube(13.5, 9), *twinkle(40, 11, 4.2), *twinkle(7, 13, 2.8)]


def card(x, y, w, h, deg, f, px, py):
    return raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{f}" transform="rotate({deg} {px} {py})"/>')


def pics(water):
    """`water` is the water bottle of build_lesson_pics.py, reused for "Do you have water?"."""
    return {
        # ---------- Unit 2 ----------
        "price-ask": [G(tag(GOLD, GOLD_D, "#D49B00"), tx=8.5, ty=15, s=1.66, deg=-18, pivot=(10, 6.5)), *ask(38.5, 10)],
        "sugar": SUGAR,
        "no-sugar": [G(SUGAR, tx=5, ty=6, s=0.78), C(3, 3, 42, RED, 0.8), rot(21.9, 5, 4.2, 38, -45, RED)],
        "no-thanks": [G(palm(SKIN_A, CORAL), tx=4.5, ty=0)],
        "here-you-are": [G(ICONS["coffee-kafeda"], tx=16.5, ty=0.6, s=0.53),
                         R(8, 26.2, 39, 4.8, 2.4, VIOLET_D), R(8, 24.4, 39, 4.8, 2.4, VIOLET),
                         R(0.6, 30, 9, 15, 3.5, CORAL), R(7, 30.5, 24, 10.5, 5.25, SKIN_M),
                         rot(9, 21.6, 12, 6.2, -8, SKIN_M), R(21, 34.6, 7, 2.2, 1.1, SHADE_M)],
        "thanks": [*malika(), rot(29.4, 40, 13, 6.4, -30, CORAL_D), rot(22.6, 33.4, 11, 7, -18, SKIN_M),       # her hand on her heart
                   G(heart(), tx=33, ty=1.5, s=0.3)],
        # ---------- Unit 3 ----------
        "water-ask": [G(water, tx=-5), *ask(38.5, 11)],
        "yes": [C(4, 6, 40, GREEN_D), C(4, 4, 40, GREEN), P("M14.5 24.5 L21.5 31 L34 17.5", WHITE, 5.5, fill="none")],
        "no": [R(5.5, 5, 37, 39, 3, CREAM), R(4, 4, 4.5, 42, 2, WOOD_D), R(39.5, 4, 4.5, 42, 2, WOOD_D),
               R(4, 4, 40, 4.5, 2, WOOD), R(4, 22, 40, 5, 2, WOOD), R(4, 40.5, 40, 5, 2, WOOD),
               C(15.5, 6.5, 17, "#7F78A8"), C(15.5, 5, 17, "#9A93C2"),
               P("M20.7 10.2 L27.3 16.8 M27.3 10.2 L20.7 16.8", WHITE, 2.4, fill="none")],
        "this": [G(tshirt(*TEE_GREEN), tx=5.5, ty=1.5, s=1.1), G(tag(RED, RED_L, RED_D), tx=27, ty=24, s=0.8, deg=24, pivot=(4, 6.5)),
                 R(0, 37, 8, 10, 3, VIOLET), R(5.5, 34, 15, 11.5, 5.75, SKIN_A), rot(13, 30.5, 9.5, 5.4, -32, SKIN_A),
                 R(12, 39.6, 6, 2, 1, SHADE_A)],
        "that": [R(1, 4, 46, 3, 1.5, WOOD_D), P("M34.2 5.5 V9.5", WOOD_D, 1.6, fill="none"),
                 G(tshirt(*TEE_GREEN), tx=22, ty=8.4, s=0.68),
                 G(pointing(SKIN_A, SHADE_A, VIOLET), tx=-2.5, ty=18.5, s=0.62, deg=-38)],
        "this-one": [R(14.4, 2.5, 19.2, 20, 5, "#E3DBFF"), G(tshirt(*TEE_BLUE), tx=0.6, ty=6, s=0.4),
                     G(tshirt(*TEE_GOLD), tx=16.8, ty=6, s=0.4), G(tshirt(*TEE_RED), tx=33, ty=6, s=0.4),
                     G(pointing(SKIN_A, SHADE_A, VIOLET), tx=10.5, ty=21.5, s=0.56, deg=-90)],
        "tshirt-red": [G(tshirt(*TEE_RED), tx=3.3, ty=5.5, s=1.15)],
        "tshirt-blue": [G(tshirt(*TEE_BLUE), tx=1.5, ty=9, s=1.1), *ask(38.5, 10)],
        "colour-like": [card(13, 8, 22, 36, -22, RED, 24, 44), card(13, 8, 22, 36, 20, GOLD, 24, 44),
                        R(12, 6, 24, 38, 4, BLUE), R(12, 31, 24, 13, (0, 0, 4, 4), "#DDF4FF"),
                        R(16, 35, 12, 2.4, 1.2, BLUE_L), R(16, 39.2, 8, 2.4, 1.2, BLUE_L),
                        G(heart(), tx=25, ty=19.5, s=0.48)],
        "sizes": [G(tshirt(*TEE_GOLD), tx=0.4, ty=39 - 32 * 0.42, s=0.42), G(tshirt(*TEE_GOLD), tx=8.5, ty=39 - 32 * 0.56, s=0.56),
                  G(tshirt(*TEE_GOLD), tx=21.7, ty=39 - 32 * 0.72, s=0.72)],
        "too-big": [R(19.4, 38, 3.8, 8.4, 1.9, VIOLET_D), R(24.8, 38, 3.8, 8.4, 1.9, VIOLET_D),
                    R(17.6, 44.2, 6.2, 3.2, 1.6, "#2B70C9"), R(24.2, 44.2, 6.2, 3.2, 1.6, "#2B70C9"),
                    R(5.6, 26, 6.2, 12.5, 3.1, GOLD), R(36.2, 26, 6.2, 12.5, 3.1, GOLD_D),
                    G(tshirt(*TEE_GOLD), tx=7.8, ty=15, s=0.9), G(aziz_head("hm"), tx=5.3, ty=-2.5, s=0.78)],
        "tshirt-small": [G(tshirt(*TEE_GOLD), tx=5, ty=17, s=0.74), *ask(38.5, 10)],
        "bag": [G(tshirt(*TEE_RED), tx=9.6, ty=1, s=0.8),
                R(7, 20, 34, 27, (3, 3, 6, 6), VIOLET_D), R(7, 18, 34, 27, (3, 3, 6, 6), VIOLET),
                R(33, 18, 8, 27, (0, 3, 6, 0), VIOLET_D), R(7, 18, 34, 4.5, (3, 3, 0, 0), VIOLET_L),
                P("M16 20 Q16 8.5 24 8.5 Q32 8.5 32 20", VIOLET_D, 2.6, fill="none"), R(11, 27, 3.4, 9, 1.7, VIOLET_L)],
    }
