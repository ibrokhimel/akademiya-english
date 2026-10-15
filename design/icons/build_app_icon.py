"""Build the app icon files (option A, picked 2026-10-15) for src/mobile/assets.

Same shapes as the Pencil board "Storyboard · App icon & launch screen":
Dombi's body is 1.3x the icon, its left edge at 25% and top at -5%, one eye showing.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[2] / "src" / "mobile" / "assets"
SS = 4  # supersampling

VIOLET, DOMBI, WHITE, BLACK = "#7B5CFF", "#2B2B3C", "#FFFFFF", "#121214"


def dombi(draw, S, ox, oy, body, eye):
    """Dombi peeking in, laid out on an S-sized square whose corner is at (ox, oy)."""
    D, x0, y0 = 1.3 * S, ox + 0.25 * S, oy - 0.05 * S
    if body:
        draw.ellipse([x0, y0, x0 + D, y0 + D], fill=body)
    ew, eh = D * 0.1364, D * 0.2576
    ex, ey = x0 + D * 0.2424, y0 + D * 0.303
    draw.rounded_rectangle([ex, ey, ex + ew, ey + eh], radius=ew / 2, fill=eye)


def render(size, bg, body, eye, mode="RGB", frame=None):
    """frame = (offset, side) of the visible square inside the canvas; whole canvas by default."""
    big = size * SS
    img = Image.new(mode, (big, big), bg)
    off, side = frame if frame else (0, size)
    dombi(ImageDraw.Draw(img), side * SS, off * SS, off * SS, body, eye)
    return img.resize((size, size), Image.LANCZOS)


def main():
    # iPhone: light, dark, tinted (1024, square, the system rounds the corners)
    render(1024, VIOLET, DOMBI, WHITE).save(OUT / "icon.png")
    render(1024, BLACK, VIOLET, WHITE).save(OUT / "icon-dark.png")
    tinted = render(1024, (0, 0, 0), (58, 58, 58), (230, 230, 230))
    tinted.convert("L").save(OUT / "icon-tinted.png")

    # Android adaptive icon: 108dp canvas, the middle 72dp is what launchers show
    off, side = 512 * 18 / 108, 512 * 72 / 108
    render(512, VIOLET, None, None).save(OUT / "android-icon-background.png")
    render(512, (0, 0, 0, 0), DOMBI, WHITE, "RGBA", (off, side)).save(OUT / "android-icon-foreground.png")
    # Monochrome: the body as a white shape with the eye cut out
    off_m, side_m = 432 * 18 / 108, 432 * 72 / 108
    render(432, (0, 0, 0, 0), WHITE, (0, 0, 0, 0), "RGBA", (off_m, side_m)).save(OUT / "android-icon-monochrome.png")

    render(48, VIOLET, DOMBI, WHITE).save(OUT / "favicon.png")


if __name__ == "__main__":
    main()
