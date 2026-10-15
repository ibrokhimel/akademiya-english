"""Lesson pictures for Unit 1 (Hello!): Aziz, Malika, greetings, names, where from, how are you, goodbye."""
from build_icons import C, F, P, R, rounded_poly, tri
from lesson_pic_parts import (BLUE, BLUE_D, BLUE_L, CORAL, CORAL_D, DARK_M, G, GOLD, GOLD_L, GREEN, GREEN_D, GREEN_L,
                              HAIR_M, INK, LILAC, RED, RED_D, SHADE_B, SHADE_M, SKIN_A, SKIN_B, SKIN_M, SKY, VIOLET,
                              VIOLET_D, VIOLET_L, WHITE, WOOD, WOOD_D, ask, aziz, malika, name_badge, palm, pointing,
                              rot, thumb_up)

FACE = [C(5, 6, 38, "#F2A900"), C(5, 4, 38, GOLD), R(11, 12, 6, 6, 3, GOLD_L), R(16, 18, 5, 7, 2.5, INK),
        R(27, 18, 5, 7, 2.5, INK), P("M17 30 Q24 36 31 30", INK, 3, fill="none")]          # the face-smile icon


def pin(cx, cy, d=15, hole=WHITE):
    """A red map pin: the round head centred on (cx, cy), the point below it."""
    r = d / 2

    def one(dy, f):
        return [C(cx - r, cy - r + dy, d, f),
                F(rounded_poly([(cx - r * 0.82, cy + r * 0.5 + dy), (cx + r * 0.82, cy + r * 0.5 + dy), (cx, cy + r * 2.2 + dy)], 1.4), f)]
    return one(1.4, RED_D) + one(0, RED) + [C(cx - r * 0.44, cy - r * 0.44, d * 0.44, hole)]


def waves(*paths):
    return [P(d, BLUE, 2.2, fill="none") for d in paths]


def malika_small(x=0):
    """Malika from head to foot, small, one hand up in a wave."""
    return [G([C(13, 5.6, 6.4, HAIR_M), R(9.6, 9.8, 12.8, 16, (6.4, 6.4, 4, 4), HAIR_M),
               R(12.3, 35, 3.2, 10, 1.6, VIOLET_D), R(16.5, 35, 3.2, 10, 1.6, VIOLET_D),
               R(11.2, 43.4, 5, 3, 1.5, "#2B70C9"), R(16.4, 43.4, 5, 3, 1.5, "#2B70C9"),      # shoes: not dark grey, it is lost on the dark tile
               R(8.4, 24.5, 3.2, 10, 1.6, CORAL_D), rot(21, 13.5, 3.2, 12.5, 22, SKIN_M), C(22.4, 9.6, 5, SKIN_M),
               R(10.2, 23, 11.6, 14, (4.5, 4.5, 2.5, 2.5), CORAL), R(14.2, 20.5, 3.6, 4.5, 1.8, SHADE_M),
               R(11.4, 11.2, 9.2, 10.8, (4.6, 4.6, 3.8, 3.8), SKIN_M), R(11, 10.2, 10, 3.8, (5, 5, 3.2, 0.5), HAIR_M),
               R(12.9, 15, 2.5, 3.4, 1.25, WHITE), R(16.6, 15, 2.5, 3.4, 1.25, WHITE),
               R(14, 15.9, 1.2, 1.8, 0.6, INK), R(16.8, 15.9, 1.2, 1.8, 0.6, INK),
               P("M14.2 19.6 Q16 20.9 17.9 19.5", DARK_M, 0.9, fill="none")], tx=x)]


PICS = {
    "hello": [G(aziz(), tx=-7),
              R(31.8, 29, 8.4, 14, 4.2, VIOLET_D), rot(33, 17, 6.6, 17, 6, SKIN_A),
              G(palm(SKIN_A, SKIN_A), tx=28, ty=1, s=0.39, deg=8),
              *waves("M28.4 5 Q26.4 8.4 27.2 12.4", "M44.8 5 Q46.8 8.6 45.6 12.4")],
    "morning": [C(10, 7, 28, GOLD_L), C(13.5, 10.5, 21, GOLD),
                *[rot(22.7, 0.8, 2.6, 5, a, "#FF9600", 24, 21) for a in (-76, -38, 0, 38, 76)],
                R(2, 29, 27, 17, (13, 13, 4, 4), GREEN_L), R(15, 25.5, 31, 20.5, (15, 15, 4, 4), GREEN),
                R(2, 40.5, 44, 5.5, (0, 0, 4, 4), GREEN_D)],
    "aziz": [*aziz(), *name_badge(26.6, 35.6, 9.6, 7.6),
             rot(6.5, 40.2, 12, 6.4, -26, VIOLET_D), rot(13.4, 32.6, 10, 6.8, -26, SKIN_A)],                    # his hand on his chest: "me"
    "malika": [*malika(), *name_badge(26.6, 35.6, 9.6, 7.6)],
    "name-ask": [P("M12.8 2 L20.5 12 M28.2 2 L20.5 12", VIOLET, 2.6, fill="none"), R(17, 9.5, 7, 5.5, 2, VIOLET_D),
                 R(3, 15.6, 35, 30, 5, LILAC), R(3, 13.5, 35, 30, 5, "#EAE4FF"), R(3, 13.5, 35, 9, (5, 5, 0, 0), VIOLET),
                 C(7, 26, 11.5, LILAC), R(21.5, 27.5, 13, 3, 1.5, LILAC), R(21.5, 33.5, 9, 3, 1.5, LILAC),
                 *ask(38.5, 12)],
    "uzbekistan": [R(3, 12, 38, 28, 5, GREEN_D), R(3, 10, 38, 28, 5, GREEN), R(3, 19, 38, 10.4, 0, RED),
                   R(3, 20, 38, 8.4, 0, WHITE), R(3, 10, 38, 9.4, (5, 5, 0, 0), BLUE),
                   C(6.6, 11.5, 6.2, WHITE), C(8.4, 11.3, 5.6, BLUE),
                   *[C(x, y, 1.5, WHITE) for x, y in ((15.5, 11.6), (18.8, 11.6), (22.1, 11.6), (17.1, 14.6), (20.4, 14.6))],
                   *pin(35, 23, 13.5)],
    "tashkent": [R(2, 42, 44, 4.5, 2.25, GREEN),
                 F(rounded_poly([(28.6, 43), (35.6, 22), (42.6, 43)], 1.5), VIOLET_L),
                 R(34.7, 2, 1.8, 14, 0.9, VIOLET_D), R(33.3, 12, 4.6, 31, (2.3, 2.3, 0, 0), VIOLET),
                 R(29.6, 16.5, 12, 5.6, 2.8, VIOLET_D), R(31.6, 24, 8, 3, 1.5, VIOLET_D),
                 R(3, 26, 11, 17, (2, 2, 0, 0), BLUE_L), R(5.2, 29, 2.6, 3.2, 0.8, WHITE), R(9.2, 29, 2.6, 3.2, 0.8, WHITE),
                 R(5.2, 35, 2.6, 3.2, 0.8, WHITE), R(9.2, 35, 2.6, 3.2, 0.8, WHITE),
                 R(13, 17, 13, 26, (2, 2, 0, 0), BLUE), R(22, 17, 4, 26, (0, 2, 0, 0), BLUE_D),
                 *[R(x, y, 2.6, 3.2, 0.8, SKY) for y in (20.5, 26.5, 32.5, 38) for x in (15.2, 18.8)],
                 *pin(16, 8, 13)],
    "where": [C(3, 8, 38, BLUE_D), C(3, 6, 38, BLUE), R(8.5, 13, 13, 9, 4.5, GREEN), C(10.5, 17.5, 10, GREEN),
              R(23, 23, 11, 13, 5.5, GREEN), R(20, 34, 9, 6, 3, GREEN), C(26.5, 12, 6, GREEN),
              R(8, 31, 6, 4, 2, GREEN), *ask(38.5, 10)],
    "how": [R(3, 9.5, 37, 28, 12, BLUE_D), F(tri(8, 30.5, 15, 15, 3, True), BLUE_D),
            R(3, 7, 37, 28, 12, BLUE), F(tri(8, 28, 15, 15, 3, True), BLUE),
            G(FACE, tx=8.4, ty=9.6, s=0.54), *ask(38.5, 10)],
    "fine": [G(FACE, tx=0, ty=-1, s=0.76), G(thumb_up(), tx=17.5, ty=18.5, s=0.62)],
    "and-you": [G(thumb_up(), tx=0, ty=0, s=0.66), G(pointing(), tx=14.5, ty=19.5, s=0.69)],
    "handshake": [R(0, 17, 10.5, 17, 3.5, VIOLET), R(37.5, 17, 10.5, 17, 3.5, CORAL),
                  R(8, 19, 27, 13.5, 6.75, SKIN_M), R(17.5, 18, 22, 15.5, 7.75, SKIN_B),
                  R(20, 22.4, 8.5, 2.4, 1.2, SHADE_B), R(20, 26.2, 8.5, 2.4, 1.2, SHADE_B), R(20, 30, 7.5, 2.4, 1.2, SHADE_B),
                  rot(22.5, 13.4, 13, 5.8, -14, SKIN_B), rot(14, 14.6, 14, 5.8, 16, SKIN_M)],
    "goodbye": [R(2, 2, 29, 45, (3, 3, 1.5, 1.5), WOOD_D), R(5, 5, 23, 42, (2, 2, 0, 0), SKY),
                R(5, 41, 23, 6, 0, GREEN_L), *malika_small(0.6),
                R(28, 3, 10, 44, (1, 3, 2, 1), WOOD), R(34.5, 3, 3.5, 44, (0, 3, 2, 0), "#C98530"),
                C(29.6, 23, 3, GOLD), *waves("M27 4.8 Q29.6 7.4 29.2 11")],
    "see-you": [G(palm(SKIN_M, VIOLET), tx=0.4, ty=0, s=0.8, deg=-12, pivot=(24, 30)),
                *waves("M32 2.6 Q36.6 4.6 37.4 9.4"),
                C(25.5, 26, 21, BLUE_D), C(25.5, 24.4, 21, BLUE), C(28.5, 27.4, 15, WHITE),
                R(35.1, 29.4, 1.9, 6.6, 0.95, VIOLET_D), R(35.1, 34.1, 6.4, 1.9, 0.95, VIOLET_D)],
}
