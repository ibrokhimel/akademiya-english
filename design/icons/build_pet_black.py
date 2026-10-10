"""Black version of pet 2D (round blob, happy arc eyes, open smile) + key expressions.
Writes characters-pet-black/<state>.svg. Run: python build_pet_black.py"""
from pathlib import Path

from build_icons import rounded_poly

BODY, EDGE, SHINE = "#2B2B3C", "#17171F", "#45455A"
EYE, MOUTH, TONGUE, CHEEK = "#FFFFFF", "#E0485A", "#FF8A8A", "#FF8FA3"


def rr(x, y, w, h, r, c): return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{c}"/>'
def ci(x, y, r, c): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}"/>'
def tri(pts, r, c): return f'<path d="{rounded_poly(pts, r)}" fill="{c}"/>'


def body():
    return [ci(100, 108, 66, EDGE), ci(100, 104, 66, BODY), rr(56, 58, 34, 13, 6.5, SHINE), ci(51, 79, 4.5, SHINE)]


def arcs(y=96, s=1.0):
    o = []
    for d in (-1, 1):
        ex = 100 + d * 26 * s
        o += [rr(ex - 17 * s, y - 20 * s, 34 * s, 40 * s, 17 * s, EYE), rr(ex - 9 * s, y - 11 * s, 18 * s, 40 * s, 9 * s, BODY),
              rr(ex - 20 * s, y + 4 * s, 40 * s, 20 * s, 0, BODY)]
    return o


def open_eyes(y=96, s=1.0, look=0):
    o = []
    for d in (-1, 1):
        ex = 100 + d * 26 * s + look
        o += [rr(ex - 12 * s, y - 18 * s, 24 * s, 34 * s, 12 * s, EYE), ci(ex + 2 * s + look * .2, y + 2 * s, 6.5 * s, BODY)]
    return o


def mouth(y=120, w=30, h=22):
    return [rr(100 - w / 2, y, w, h, h / 2, MOUTH), rr(100 - w / 2, y - 4, w, 10, 0, BODY), rr(92, y + h - 10, 16, 8, 4, TONGUE)]


STATES = {
    "happy": body() + arcs() + mouth(),
    "listening": body() + open_eyes(90, 1.15) + [rr(78 + i * 10, 136 - h / 2, 6, h, 3, EYE) for i, h in enumerate([8, 16, 22, 16, 8])],
    "talking": body() + arcs(94) + [rr(84, 116, 32, 30, 15, MOUTH), rr(92, 132, 16, 10, 5, TONGUE)],
    "celebrating": [tri([(28, 40), (40, 30), (44, 48)], 3, "#FFC93C"), tri([(162, 34), (176, 42), (160, 52)], 3, "#FF9CC8"), ci(172, 74, 5, "#5ED6B4")]
                   + body() + arcs(92, 1.15) + mouth(118, 44, 30),
    "thinking": body() + open_eyes(92, 1, 8) + [rr(86, 126, 22, 7, 3.5, EYE), ci(150, 52, 7, "#B7B7C8"), ci(166, 36, 10, "#B7B7C8")],
    "sleepy": body() + [rr(64, 94, 24, 7, 3.5, EYE), rr(112, 94, 24, 7, 3.5, EYE), rr(94, 122, 12, 9, 4.5, MOUTH), rr(142, 40, 18, 5, 2.5, "#B7B7C8"), rr(156, 28, 12, 4, 2, "#B7B7C8")],
}


def main():
    out = Path(__file__).parent / "characters-pet-black"
    out.mkdir(exist_ok=True)
    for name, shapes in STATES.items():
        shapes = shapes + [ci(56, 122, 9, CHEEK), ci(144, 122, 9, CHEEK)]
        (out / f"{name}.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  '
                                         + "\n  ".join(shapes) + "\n</svg>\n", encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
