"""Café waiters A and C (bust only, 96x96 grid, same flat style as the icons). Run: python build_waiter.py

The bust is made to sit inside a round avatar (56 px in Echo Line, up to 150 px in the Checkpoint).
"""
from pathlib import Path

from build_icons import rounded_poly, rounded_rect

HAIR, EYE, WHITE = "#3D3D3D", "#4B4B4B", "#FFFFFF"


def rr(x, y, w, h, r, c, rot=None):
    t = f' transform="rotate({rot} {x + w / 2} {y + h / 2})"' if rot else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"{t}/>'


def ci(x, y, r, c):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'


def poly(pts, r, c):
    return f'<path d="{rounded_poly(pts, r)}" fill="{c}"/>'


def line(d, w, c):
    return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'


def head(skin, shade):
    return [rr(40, 54, 16, 22, 6, shade), ci(28, 40, 5.5, skin), ci(68, 40, 5.5, skin), rr(28, 16, 40, 46, 20, skin)]


def face(shade, mouth, brows=HAIR, smile="M41 50.5 Q48.5 57 56 49.5"):
    return [rr(37, 28.5, 8.5, 2.8, 1.4, brows, -6), rr(50.5, 28.5, 8.5, 2.8, 1.4, brows, 6),
            rr(38.5, 34, 5, 8.5, 2.5, EYE), rr(52.5, 34, 5, 8.5, 2.5, EYE),
            rr(46, 40, 4, 7, 2, shade), line(smile, 2.8, mouth)]


def bow_tie(c, y=74):
    return [poly([(48, y), (37, y - 6.5), (37, y + 6.5)], 2.2, c), poly([(48, y), (59, y - 6.5), (59, y + 6.5)], 2.2, c),
            ci(48, y, 3.2, c)]


def waiter_a():  # young man, vest and bow tie
    skin, shade = "#FFB59F", "#FA8E77"
    s = [rr(14, 68, 68, 44, 22, EYE), poly([(35, 67), (61, 67), (54, 100), (42, 100)], 3, WHITE)]
    s += head(skin, shade)
    s += [rounded_rect(26.5, 10, 43, 21, (15, 15, 2, 2), HAIR), rr(26.5, 22, 5.5, 13, 2.75, HAIR), rr(64, 22, 5.5, 13, 2.75, HAIR),
          rr(42, 12.5, 24, 9, 4.5, "#555555", -5)]
    s += face(shade, "#C4543F") + bow_tie("#FF4B4B")
    return s


def waiter_c():  # man with a moustache and a do'ppi, green apron
    skin, shade = "#E3A07F", "#C0775A"
    s = [rr(14, 68, 68, 44, 22, "#FFF3D6"), rr(35.5, 64, 4, 16, 2, "#43C000"), rr(56.5, 64, 4, 16, 2, "#43C000"),
         rr(33, 78, 30, 30, 6, "#58CC02"), rr(42, 84, 12, 3.5, 1.75, "#89E219")]
    s += head(skin, shade)
    s += [rr(27, 15, 42, 11, 8, HAIR), rr(27, 20, 5.5, 14, 2.75, HAIR), rr(63.5, 20, 5.5, 14, 2.75, HAIR),
          rr(29, 6, 38, 15, 5, "#2B2B2B"), rr(29, 17, 38, 2.6, 1.3, WHITE),
          ci(38.5, 11.5, 2, WHITE), ci(48, 10.5, 2, WHITE), ci(57.5, 11.5, 2, WHITE)]
    s += face(shade, "#8C432A", smile="M43 54.5 Q48.5 58 54 54.5")
    s += [rr(37.5, 46.5, 12, 5.5, 2.75, HAIR, 10), rr(46.5, 46.5, 12, 5.5, 2.75, HAIR, -10)]
    return s


WAITERS = {"waiter-a": waiter_a, "waiter-c": waiter_c}


def main():
    out = Path(__file__).parent / "characters-waiter"
    out.mkdir(exist_ok=True)
    for name, fn in WAITERS.items():
        body = "\n  ".join(fn())
        (out / f"{name}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 96 96">\n  {body}\n</svg>\n',
            encoding="utf-8")
    print(f"wrote {len(WAITERS)} waiter candidates to {out}")


if __name__ == "__main__":
    main()
