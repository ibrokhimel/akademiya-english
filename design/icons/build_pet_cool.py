"""De-kawaii pass on the black 2D pet: no blush, no anime arc eyes, no tongue; cooler faces for teens + adults.
Writes characters-pet-cool.svg (sheet). Run: python build_pet_cool.py"""
from pathlib import Path

BODY, EDGE, EYE, ACC = "#2B2B3C", "#17171F", "#FFFFFF", "#7B5CFF"


def rr(x, y, w, h, r, c): return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{c}"/>'
def ci(x, y, r, c): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}"/>'


def blob(squash=1.0):
    if squash == 1.0:
        return [ci(100, 108, 66, EDGE), ci(100, 104, 66, BODY)]
    h = 132 * squash
    return [rr(34, 170 - h + 4, 132, h, min(66, h / 2), EDGE), rr(34, 170 - h, 132, h, min(66, h / 2), BODY)]


def smirk(x=104, y=124, w=26):  # off-centre, one corner up
    return [rr(x - w / 2, y, w, 7, 3.5, EYE), rr(x + w / 2 - 7, y - 6, 7, 13, 3.5, EYE)]


V = []
def add(name, shapes): V.append((name, shapes))

add("1 · tall eyes, smirk", blob() + [rr(66, 78, 18, 34, 9, EYE), rr(116, 78, 18, 34, 9, EYE)] + smirk())
add("2 · giant square eyes", blob() + [rr(56, 72, 38, 46, 13, EYE), rr(106, 72, 38, 46, 13, EYE), rr(70, 86, 16, 24, 8, BODY), rr(120, 86, 16, 24, 8, BODY)])
add("3 · half-lid, confident", blob() + [rr(62, 84, 28, 26, 10, EYE), rr(110, 84, 28, 26, 10, EYE), rr(58, 80, 36, 12, 0, BODY), rr(106, 80, 36, 12, 0, BODY)] + smirk(102, 126, 22))
add("4 · visor (AI)", blob() + [rr(48, 78, 104, 40, 20, "#0E0E16"), rr(64, 88, 24, 20, 10, ACC), rr(112, 88, 24, 20, 10, ACC)])
add("5 · one eye", blob() + [ci(100, 94, 26, EYE), ci(106, 96, 12, BODY)] + smirk(100, 132, 22))
add("6 · line eyes, chill", blob() + [rr(62, 92, 30, 9, 4.5, EYE), rr(108, 92, 30, 9, 4.5, EYE)] + smirk(104, 120, 24))
add("7 · mochi + tall eyes", blob(.8) + [rr(68, 92, 18, 30, 9, EYE), rr(114, 92, 18, 30, 9, EYE)] + smirk(104, 132, 24))
add("8 · dot eyes, no mouth", blob() + [ci(76, 98, 9, EYE), ci(124, 98, 9, EYE)])


def hands(dx=25):  # two circle hands resting low at the sides
    return [ci(dx, 138, 14, EDGE), ci(dx, 135, 14, BODY), ci(200 - dx, 138, 14, EDGE), ci(200 - dx, 135, 14, BODY)]
def hand(x, y):  # one shade lighter than the body so it still reads in front of it
    return [ci(x, y + 3, 14, EDGE), ci(x, y, 14, "#45455A")]


# Default = NO hands. Hands only appear in gesture poses (shown for pet #1).
POSES = [("1-pose-wave", V[0][1] + hand(182, 66)),
         ("1-pose-celebrate", V[0][1] + hand(26, 52) + hand(174, 52)),
         ("1-pose-thinking", V[0][1] + hand(132, 146))]


def main():
    cell, cols = 190, 4
    rows = (len(V) + cols - 1) // cols
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols * cell}" height="{rows * cell}" viewBox="0 0 {cols * cell} {rows * cell}"><rect width="100%" height="100%" fill="#FFFFFF"/>']
    for k, (name, shapes) in enumerate(V):
        gx, gy = (k % cols) * cell, (k // cols) * cell
        out.append(f'<rect x="{gx + 5}" y="{gy + 5}" width="{cell - 10}" height="{cell - 10}" rx="22" fill="#EFEBFF"/>')
        out.append(f'<g transform="translate({gx + 25} {gy + 12}) scale(0.7)">{"".join(shapes)}</g>')
        out.append(f'<text x="{gx + cell / 2}" y="{gy + cell - 16}" font-family="Nunito,Arial" font-weight="800" font-size="13" fill="#6E6E82" text-anchor="middle">{name}</text>')
    out.append("</svg>")
    one = Path(__file__).parent / "characters-pet-cool"
    one.mkdir(exist_ok=True)
    for k, (name, shapes) in enumerate(V):
        slug = name.split(" · ")[1].replace(",", "").replace(" ", "-").replace("(", "").replace(")", "")
        (one / f"{k + 1}-{slug}.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  '
                                                 + "\n  ".join(shapes) + "\n</svg>\n", encoding="utf-8")
    for slug, shapes in POSES:
        (one / f"{slug}.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  '
                                         + "\n  ".join(shapes) + "\n</svg>\n", encoding="utf-8")
    p = Path(__file__).parent / "characters-pet-cool.svg"
    p.write_text("".join(out), encoding="utf-8")
    print(p)


if __name__ == "__main__":
    main()
