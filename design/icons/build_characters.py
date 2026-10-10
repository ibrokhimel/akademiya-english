"""Guide-character candidates (Duolingo shape language). Run: python build_characters.py"""
import math
from pathlib import Path
from build_icons import rounded_poly

def rr(x, y, w, h, r, c, rot=None):
    t = f' transform="rotate({rot[0]} {rot[1]} {rot[2]})"' if rot else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"{t}/>'
def ci(x, y, r, c): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def tri(pts, r, c): return f'<path d="{rounded_poly(pts, r)}" fill="{c}"/>'
def line(d, w, c): return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def eyes(cx, y, gap, w, h, look=1):
    out = []
    for s in (-1, 1):
        ex = cx + s * (gap / 2 + w / 2)
        out.append(rr(ex - w / 2, y - h / 2, w, h, w / 2, "#FFFFFF"))
        pw, ph = w * .48, h * .52
        out.append(rr(ex - pw / 2 - s * w * .1 * look, y - ph / 2 + 1, pw, ph, pw / 2, "#4B4B4B"))
        out.append(ci(ex - pw / 2 - s * w * .1 * look + pw * .35, y - ph / 2 + 1 + ph * .28, pw * .18, "#FFFFFF"))
    return out
def shadow(cx, y, w, c="#E7E7E7"): return rr(cx - w / 2, y, w, 9, 4.5, c)
V, VE, VS = "#7B5CFF", "#5A3FD9", "#EFEBFF"

def irbis():  # snow leopard cub
    B, BS, SP, CR = "#E8E4F7", "#D3CCEE", "#8F86C4", "#FFF8EE"
    s = [shadow(100, 186, 96)]
    s += [rr(128, 118, 22, 66, 11, BS, (-25, 139, 150)), ci(150, 104, 7, SP), ci(144, 118, 5, SP)]          # tail
    s += [rr(62, 112, 76, 70, 30, B), rr(80, 128, 40, 50, 20, CR)]                                          # body + belly
    s += [rr(66, 168, 28, 18, 9, BS), rr(106, 168, 28, 18, 9, BS)]                                          # feet
    s += [rr(126, 120, 18, 44, 9, B), ci(135, 162, 10, B)]                                                  # arm down
    s += [rr(52, 84, 18, 44, 9, B, (-40, 61, 128)), ci(33, 94, 11, B)]                                        # waving arm
    s += [rr(70, 108, 60, 14, 7, V), rr(108, 112, 14, 32, 7, VE)]                                           # scarf
    s += [ci(56, 40, 16, B), ci(144, 40, 16, B), ci(56, 40, 8, "#F5B6C8"), ci(144, 40, 8, "#F5B6C8")]       # ears
    s += [rr(40, 30, 120, 90, 44, B)]                                                                       # head
    s += [ci(70, 44, 5, SP), ci(84, 38, 4, SP), ci(118, 40, 5, SP), ci(131, 47, 4, SP), ci(52, 70, 4, SP), ci(149, 72, 4, SP)]
    s += eyes(100, 70, 16, 18, 26)
    s += [rr(78, 84, 44, 26, 13, CR), tri([(92, 86), (108, 86), (100, 95)], 3, "#F07A98")]                 # muzzle + nose
    s += [line("M93 99 Q100 106 107 99", 3, "#C95C78")]
    s += [ci(62, 92, 7, "#FFC9D6"), ci(138, 92, 7, "#FFC9D6")]
    return s

def bota():  # baby camel, side view, with an ikat saddle cloth
    B, BS, BD = "#F2C38B", "#E3A866", "#C98A4B"
    s = [shadow(102, 186, 120)]
    s += [rr(70, 130, 13, 56, 6.5, BS), rr(130, 130, 13, 56, 6.5, BS)]                                      # far legs
    s += [rr(58, 98, 104, 54, 27, B), ci(104, 96, 24, B)]                                                   # body + hump
    s += [rr(60, 130, 13, 56, 6.5, B), rr(142, 130, 13, 56, 6.5, B)]                                        # near legs
    s += [rr(80, 96, 50, 34, 10, V)] + [rr(84 + i * 9, 100, 5, 26, 2.5, c) for i, c in enumerate(["#FFC93C", "#FF6B5B", "#3DCB6C", "#FFC93C", "#FF6B5B"])]
    s += [ci(85 + i * 10, 133, 3.5, "#FFC93C") for i in range(5)]                                           # tassels
    s += [rr(150, 112, 22, 10, 5, BS, (-30, 150, 117))]                                                     # tail
    s += [rr(40, 50, 26, 70, 13, B, (-12, 53, 85))]                                                         # neck
    s += [rr(18, 30, 62, 40, 20, B), rr(14, 46, 30, 26, 13, "#F7D3A8")]                                     # head + snout
    s += [ci(62, 30, 8, BS), ci(48, 28, 7, BS)]                                                              # ears
    s += [rr(44, 36, 13, 18, 6.5, "#FFFFFF"), rr(44, 39, 7, 11, 3.5, "#4B4B4B"), ci(46.5, 42, 1.6, "#FFFFFF")]  # eye (profile)
    s += [ci(19, 52, 2.5, BD), line("M22 63 Q30 68 38 62", 3, BD), ci(56, 58, 5, "#FFB49A")]
    return s

def gapir():  # speech-bubble character
    s = [shadow(100, 186, 70, "#E7E7E7")]
    s += [rr(70, 168, 26, 16, 8, VE), rr(104, 168, 26, 16, 8, VE)]                                          # floating feet
    s += [tri([(58, 120), (88, 132), (50, 156)], 6, V)]                                                     # bubble tail
    s += [rr(36, 40, 128, 108, 42, V), rr(52, 50, 40, 16, 8, "#9F86FF")]                                    # bubble + highlight
    s += [rr(150, 70, 16, 40, 8, V, (40, 158, 90)), ci(170, 66, 10, V)]                                     # waving arm
    s += [rr(36, 92, 16, 34, 8, V, (-20, 44, 109))]
    s += eyes(100, 88, 18, 20, 30)
    s += [rr(82, 108, 36, 20, 10, "#AD3B3B"), rr(92, 118, 16, 8, 4, "#F05656"), rr(86, 108, 28, 6, 3, "#FFFFFF")]  # open mouth
    s += [ci(62, 108, 7, "#B39CFF"), ci(138, 108, 7, "#B39CFF")]
    s += [rr(161, 31, 15, 15, 4, "#FFC93C", (45, 168.5, 38.5)), rr(178, 52, 8, 8, 2.5, "#FFC93C", (45, 182, 56))]
    return s

def mushuk():  # cat
    B, BS, ST = "#FFB27A", "#F59A5C", "#E0773A"
    s = [shadow(100, 186, 90)]
    s += [rr(126, 98, 18, 60, 9, B, (30, 135, 128)), rr(146, 84, 18, 34, 9, B, (-10, 155, 101))]          # tail
    s += [rr(64, 114, 72, 68, 30, B), rr(82, 128, 36, 48, 18, "#FFE8D2")]                                   # body + belly
    s += [rr(68, 168, 26, 16, 8, BS), rr(106, 168, 26, 16, 8, BS)]
    s += [rr(124, 122, 16, 42, 8, B), ci(132, 162, 9, B)]
    s += [rr(54, 88, 16, 42, 8, B, (-40, 62, 130)), ci(35, 98, 10, B)]
    s += [rr(68, 110, 64, 12, 6, V)]                                                                        # collar
    s += [ci(100, 124, 7, "#FFC93C")]                                                                       # bell
    s += [tri([(44, 52), (52, 12), (82, 36)], 8, B), tri([(156, 52), (148, 12), (118, 36)], 8, B)]        # ears
    s += [tri([(54, 44), (57, 24), (72, 36)], 4, "#FFC9D6"), tri([(146, 44), (143, 24), (128, 36)], 4, "#FFC9D6")]
    s += [rr(40, 28, 120, 92, 44, B)]
    s += [rr(94, 30, 12, 20, 6, ST), rr(78, 33, 10, 14, 5, ST), rr(112, 33, 10, 14, 5, ST)]                # stripes
    s += eyes(100, 72, 18, 18, 26)
    s += [rr(80, 86, 40, 24, 12, "#FFE8D2"), tri([(93, 88), (107, 88), (100, 96)], 3, "#F07A98")]
    s += [line("M93 100 Q100 106 107 100", 3, ST)]
    s += [line("M60 92 L44 88", 2.5, ST), line("M60 99 L44 101", 2.5, ST), line("M140 92 L156 88", 2.5, ST), line("M140 99 L156 101", 2.5, ST)]
    return s

out = Path(__file__).parent / "characters"
for name, fn in {"irbis": irbis, "bota": bota, "gapir": gapir, "mushuk": mushuk}.items():
    (out / f"{name}.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  '
                                     + "\n  ".join(fn()) + "\n</svg>\n", encoding="utf-8")
print("ok")
