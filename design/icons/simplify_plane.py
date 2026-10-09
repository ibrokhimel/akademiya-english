"""Rebuilds the traced reference plane from Duolingo primitives, each fitted to its traced part.

Body/tail = few-corner rounded polygons, wing = rounded triangle (min enclosing triangle),
windows = rotated pills (min area rect), propeller = pill + hub circle.
Usage: python simplify_plane.py <reference.jpg> <out.svg>
"""
import math
import sys

import cv2
import numpy as np

from build_icons import rounded_poly

REF = {"bg": (0x17, 0x1E, 0x26), "body": (0xE5, 0xE5, 0xE5), "red": (0xEA, 0x5A, 0x52),
       "blue": (0x5C, 0xB4, 0xF0), "grey": (0x8C, 0x9A, 0xA0)}


def main(src, out):
    img = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(np.int32)
    h, w, _ = img.shape
    s = w / 924
    crop = img[int(590 * s):int(800 * s), int(270 * s):int(660 * s)]
    names = list(REF)
    cols = np.array([REF[n] for n in names])
    lab = ((crop[:, :, None, :] - cols[None, None]) ** 2).sum(-1).argmin(-1)
    m = {n: (lab == i).astype(np.uint8) * 255 for i, n in enumerate(names)}
    ys, xs = np.nonzero(255 - m["bg"])
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max(), ys.max()
    sc = 44 / max(bx1 - bx0, by1 - by0)
    ox, oy = (48 - (bx1 - bx0) * sc) / 2, (48 - (by1 - by0) * sc) / 2
    G = lambda x, y: ((x - bx0) * sc + ox, (y - by0) * sc + oy)
    k3 = np.ones((3, 3), np.uint8)

    def comps(mask, min_area):
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k3)
        cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        return sorted([c for c in cs if cv2.contourArea(c) >= min_area], key=cv2.contourArea, reverse=True)

    def poly(c, eps, r, fill):
        p = cv2.approxPolyDP(c, eps, True)
        return f'<path d="{rounded_poly([G(q[0][0], q[0][1]) for q in p], r)}" fill="{fill}"/>'

    def pill(c, fill):
        (cx, cy), (rw, rh), a = cv2.minAreaRect(c)
        gx, gy = G(cx, cy)
        W, H = rw * sc, rh * sc
        return (f'<rect x="{gx - W / 2:.2f}" y="{gy - H / 2:.2f}" width="{W:.2f}" height="{H:.2f}" '
                f'rx="{min(W, H) / 2:.2f}" fill="{fill}" transform="rotate({a:.1f} {gx:.2f} {gy:.2f})"/>'), (gx, gy, min(W, H))

    out_parts = []
    body = cv2.morphologyEx(cv2.bitwise_or(m["body"], m["blue"]), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    out_parts.append(poly(comps(body, 400)[0], 9, 3.2, "#E5E5E5"))
    reds = sorted(comps(m["red"], 60), key=lambda c: cv2.boundingRect(c)[0])  # left-most = wing (nearer the nose)
    for i, c in enumerate(reds):
        if i == 0:  # main wing: min enclosing triangle
            out_parts.append(poly(c, 5, 1.4, "#1899D6"))
        else:      # tail fin + stabiliser
            out_parts.append(poly(c, 4, 1.2, "#1CB0F6"))
    for c in comps(m["blue"], 20):
        out_parts.append(pill(c, "#1CB0F6")[0])
    greys = comps(m["grey"], 30)
    if greys:
        (cx, cy), (rw, rh), a = cv2.minAreaRect(greys[0])
        gx, gy = G(cx, cy)
        L, ang = (rw * sc, a) if rw >= rh else (rh * sc, a + 90)
        L = max(L, 10.5)
        out_parts.append(f'<rect x="{gx - L / 2:.2f}" y="{gy - 1:.2f}" width="{L:.2f}" height="2" rx="1" fill="#AFAFAF" '
                         f'transform="rotate({ang:.1f} {gx:.2f} {gy:.2f})"/>')
        out_parts.append(f'<circle cx="{gx:.2f}" cy="{gy:.2f}" r="1.7" fill="#AFAFAF"/>')
    open(out, "w", encoding="utf-8").write(
        '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48">\n  '
        + "\n  ".join(out_parts) + "\n</svg>\n")
    print(len(out_parts), "shapes")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
