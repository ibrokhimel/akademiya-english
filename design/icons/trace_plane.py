"""Traces the reference Duolingo plane 1:1 into a 48x48 SVG, recoloured to the Akademiya palette.

Usage: python trace_plane.py <reference.jpg> <out.svg>
Colour regions are classified by nearest colour, traced with OpenCV contours and simplified to ~0.6 px.
"""
import sys

import cv2
import numpy as np

REF = {"bg": (0x17, 0x1E, 0x26), "body": (0xE5, 0xE5, 0xE5), "red": (0xEA, 0x5A, 0x52),
       "blue": (0x5C, 0xB4, 0xF0), "grey": (0x8C, 0x9A, 0xA0)}
OURS = {"body": "#E5E5E5", "red": "#1CB0F6", "red_dark": "#1899D6", "blue": "#1CB0F6", "grey": "#AFAFAF"}


def main(src, out):
    img = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(np.int32)
    h, w, _ = img.shape
    s = w / 924
    x0, y0, x1, y1 = int(270 * s), int(590 * s), int(660 * s), int(800 * s)
    crop = img[y0:y1, x0:x1]
    names = list(REF)
    cols = np.array([REF[n] for n in names])
    dist = ((crop[:, :, None, :] - cols[None, None, :, :]) ** 2).sum(-1)
    label = dist.argmin(-1)
    masks = {n: (label == i).astype(np.uint8) * 255 for i, n in enumerate(names)}

    plane = 255 - masks["bg"]
    ys, xs = np.nonzero(plane)
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max(), ys.max()
    scale = 44 / max(bx1 - bx0, by1 - by0)
    ox = (48 - (bx1 - bx0) * scale) / 2
    oy = (48 - (by1 - by0) * scale) / 2
    k = np.ones((3, 3), np.uint8)

    def paths(mask, min_area=40):
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
        cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        out = []
        for c in cs:
            if cv2.contourArea(c) < min_area:
                continue
            c = cv2.approxPolyDP(c, 1.0, True)
            pts = [((p[0][0] - bx0) * scale + ox, (p[0][1] - by0) * scale + oy) for p in c]
            d = "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + " Z"
            cy = sum(p[1] for p in pts) / len(pts)
            cx = sum(p[0] for p in pts) / len(pts)
            out.append((d, cx, cy, cv2.contourArea(c)))
        return out

    body = cv2.morphologyEx(cv2.bitwise_or(masks["body"], masks["blue"]), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    layers = []
    for d, *_ in paths(body, 400):
        layers.append((d, OURS["body"]))
    reds = paths(masks["red"])
    fin = min(reds, key=lambda r: r[2] - r[1])[0]  # tail fin = the red part highest and furthest right
    for d, cx, cy, a in reds:
        layers.append((d, OURS["red"] if d == fin else OURS["red_dark"]))
    for d, *_ in paths(masks["blue"], 20):
        layers.append((d, OURS["blue"]))
    for d, *_ in paths(masks["grey"], 20):
        layers.append((d, OURS["grey"]))

    body_svg = "\n  ".join(f'<path d="{d}" fill="{c}"/>'
                           for d, c in layers)
    open(out, "w", encoding="utf-8").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">\n  {body_svg}\n</svg>\n')
    print(f"{len(layers)} shapes: {[c for _, c in layers]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
