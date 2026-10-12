"""Builds the lesson pictures (things the learner names in exercises E1, E2, E6) as SVG files.

Same style and 48x48 grid as build_icons.py. Run: python build_lesson_pics.py
"""
from pathlib import Path

from build_icons import C, F, R, render, rounded_poly, tri

STEAM = "#C9BDFF"


def rot(x, y, w, h, deg, f):
    """Pill rotated around its own centre."""
    return ("raw", f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{min(w, h) / 2}" fill="{f}" '
                   f'transform="rotate({deg} {x + w / 2} {y + h / 2})"/>')


PICS = {
    "tea": [R(3, 5, 3.5, 8, 1.75, STEAM), R(8.5, 2, 3.5, 9, 1.75, STEAM),
            C(29, 18, 17, "#43C000", 0.5),
            F(rounded_poly([(14, 34), (2.5, 20), (8, 16.5), (19, 25)], 2), "#58CC02"),
            R(10, 15, 28, 27, 13, "#58CC02"), R(29, 15, 9, 27, (0, 13, 13, 0), "#43C000"),
            R(14, 22, 4, 9, 2, "#89E219"), R(16, 40, 16, 4, 2, "#58A700"),
            R(14, 12.5, 20, 5, 2.5, "#FFC800"), C(20.75, 6, 6.5, "#FFC800")],
    "orange-juice": [rot(27, 0, 3.6, 26, 16, "#58CC02"),
                     R(13, 12, 22, 33, (3, 3, 7, 7), "#BFE8FF"),
                     R(15, 19, 18, 24, (2, 2, 5, 5), "#FF9600"), R(27, 19, 6, 24, (0, 2, 5, 0), "#F08400"),
                     R(18, 23, 3, 9, 1.5, "#FFC04D"),
                     C(4, 4, 17, "#FF9600"), C(6.5, 6.5, 12, "#FFC800"), R(11.75, 8, 1.5, 9, 0.75, "#FF9600"),
                     R(8, 11.75, 9, 1.5, 0.75, "#FF9600")],
    "water": [R(19, 2, 10, 6.5, 2, "#2B70C9"), R(20.5, 8, 7, 5, 1, "#BFE8FF"),
              R(13, 11, 22, 35, (7, 7, 5, 5), "#BFE8FF"), R(13, 19, 22, 27, (0, 0, 5, 5), "#84D8FF"),
              R(29, 19, 6, 27, (0, 0, 5, 0), "#5CC6F2"),
              R(13, 24, 22, 11, 0, "#1CB0F6"), R(29, 24, 6, 11, 0, "#1899D6"),
              C(18.5, 26.5, 6, "#FFFFFF"), R(16, 38, 3, 5.5, 1.5, "#DDF4FF")],
    "sandwich": [R(5, 33, 38, 9, 3, "#E09A3E"), R(5, 33, 38, 6, (3, 3, 0, 0), "#FFE2A8"),
                 R(5, 29, 38, 5, 1.5, "#FFC800"), F(tri(26, 31, 10, 8, 1.4, True), "#FFC800"),
                 R(7, 25, 34, 5, 2.5, "#FF4B4B"),
                 R(4, 20, 40, 5, 2.5, "#58CC02"), C(3, 20, 8.5, "#58CC02"), C(11.5, 21, 8.5, "#58CC02"),
                 C(20, 20, 8.5, "#58CC02"), C(28.5, 21, 8.5, "#58CC02"), C(36.5, 20, 8.5, "#58CC02"),
                 R(22.9, 4, 2.2, 12, 1.1, "#B66E28"),
                 R(5, 13, 38, 9, 3, "#E09A3E"), R(5, 16, 38, 6, (0, 0, 3, 3), "#FFE2A8"),
                 C(20, 1, 8, "#58A700"), C(22.5, 3, 3, "#FF4B4B")],
    "samsa": [F(rounded_poly([(2, 45), (24, 5), (46, 45)], 6.5), "#F5A63A"),
              R(9, 38.5, 30, 5, 2.5, "#DE8A24"),
              rot(14.5, 19, 3.8, 11, 29, "#FFC978"),
              rot(22, 17, 3.8, 2.2, -20, "#FFF3D6"), rot(27, 23, 3.8, 2.2, 25, "#4B4B4B"),
              rot(20, 26.5, 3.8, 2.2, 15, "#4B4B4B"), rot(29, 30.5, 3.8, 2.2, -15, "#FFF3D6"),
              rot(21.5, 33, 3.8, 2.2, -30, "#FFF3D6")],
    "salad": [C(5, 9, 17, "#58CC02"), C(26, 9, 17, "#58CC02"), C(15, 4, 18, "#89E219"),
              C(11, 13, 9, "#FF4B4B"), C(29, 12, 8, "#FF4B4B"), C(21.5, 9, 6, "#FFC800"),
              C(20, 16, 8, "#D7FFB8"),
              R(5, 23, 38, 20, (2, 2, 18, 18), "#7B5CFF"), R(31, 23, 12, 20, (0, 2, 18, 0), "#5A3FD9"),
              R(3, 21, 42, 5, 2.5, "#9F86FF"), R(11, 29, 4, 7, 2, "#9F86FF"),
              R(17, 42, 14, 3.5, 1.75, "#5A3FD9")],
}


def main():
    out = Path(__file__).parent / "lesson"
    out.mkdir(exist_ok=True)
    for name, shapes in PICS.items():
        body = "\n  ".join(s[1] if s[0] == "raw" else render(s) for s in shapes)
        (out / f"{name}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">\n  {body}\n</svg>\n',
            encoding="utf-8")
    print(f"wrote {len(PICS)} lesson pictures to {out}")


if __name__ == "__main__":
    main()
