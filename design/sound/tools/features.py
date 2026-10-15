"""What each sound in a folder is like, without listening: length, loudness, how bright, how tonal, and which notes it plays.
python -I tools/features.py <folder> [name filter]
"""
import os, sys, subprocess
import numpy as np

SR = 44100; NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, stdin=subprocess.DEVNULL).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    if not len(x) or np.abs(x).max() == 0: return x
    m = np.abs(x); a = int(np.argmax(m > m.max() * 0.004)); b = len(m) - int(np.argmax(m[::-1] > m.max() * 0.0016)); return x[a:b]


def notes(x, n=4096, hop=1024):
    """The note sounding in each short slice (strongest peak of the spectrum), as (midi number, cents off, strength, how pure)."""
    out = []; x = np.concatenate([x, np.zeros(n)]); w = np.hanning(n); top = 0
    for i in range(0, max(1, len(x) - n), hop):
        s = np.abs(np.fft.rfft(x[i:i + n] * w)); s[:int(60 * n / SR)] = 0; k = int(s.argmax()); e = s[k]
        if e <= 0 or k < 2 or k >= len(s) - 1: continue
        a, b, c = np.log(s[k - 1] + 1e-12), np.log(s[k] + 1e-12), np.log(s[k + 1] + 1e-12); f = (k + 0.5 * (a - c) / (a - 2 * b + c)) * SR / n
        pure = (s[max(0, k - 3):k + 4] ** 2).sum() / max((s ** 2).sum(), 1e-12); m = 69 + 12 * np.log2(f / 440.0); top = max(top, e)
        out.append((m, e, pure))
    return [(int(round(m)), int(round((m - round(m)) * 100)), e / top, pure) for m, e, pure in out if e > top * 0.25]


def describe(path):
    x = decode(path)
    if len(x) < 32: return None
    ms = len(x) * 1000 // SR; e = x * x; n = min(len(x), int(SR * 0.2)); c = np.concatenate([[0], np.cumsum(e)]); loud = 10 * np.log10(max((c[n:] - c[:-n]).max() / int(SR * 0.2), 1e-12))
    s = np.abs(np.fft.rfft(x * np.hanning(len(x)))); fr = np.fft.rfftfreq(len(x), 1 / SR); cen = (s * fr).sum() / max(s.sum(), 1e-12)
    nn = notes(x); pure = np.mean([p for *_, p in nn]) if nn else 0
    seq = []
    for m, cents, _, p in nn:
        if p > 0.25 and (not seq or seq[-1][0] != m): seq.append((m, cents))
    env = np.sqrt(np.convolve(e, np.ones(441) / 441, 'same')); attack = int(np.argmax(env > env.max() * 0.5) * 1000 / SR)
    return {'ms': ms, 'loud': loud, 'bright': cen, 'pure': pure, 'attack': attack, 'notes': ' '.join('%s%d%+d' % (NOTES[m % 12], m // 12 - 1, c) for m, c in seq[:10])}


if __name__ == '__main__':
    root = sys.argv[1]; flt = sys.argv[2] if len(sys.argv) > 2 else ''
    files = sorted(os.path.join(d, f) for d, _, fs in os.walk(root) for f in fs if f.lower().endswith(('.wav', '.ogg', '.mp3')) and flt in f)
    print('%-44s %6s %6s %7s %5s %4s  %s' % ('file', 'ms', 'loud', 'bright', 'pure', 'att', 'notes (cents off)'))
    for f in files:
        d = describe(f)
        if d: print('%-44s %6d %6.1f %7.0f %5.2f %4d  %s' % (os.path.relpath(f, root)[-44:], d['ms'], d['loud'], d['bright'], d['pure'], d['attack'], d['notes']))
