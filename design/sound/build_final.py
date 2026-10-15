"""Build the chosen sound set for the app.  python -I build_final.py

Reads picks.json (one liked option per sound) and manifest.json, takes the untouched original of each pick, and writes
final/<name>.wav (16-bit, 44.1 kHz, silence and slow fade-ins trimmed, peak at -3 dB) plus final/sounds.json
(where each sound came from, its licence, the credit it needs, and for the app: "volume", and "hit" = how many ms into
the file the loud moment comes, for the sounds that build up first).
On/off picks become two files: <name>-on.wav and <name>-off.wav.
"""
import os, json, wave, shutil, subprocess
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from scipy.signal import lfilter

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'final'); SR = 44100
# How loud each sound should be heard, in LUFS (loudest 200 ms, measured the way the ear weighs it). The volume in sounds.json is
# worked out from this, so a quiet file and a loud file end up at the level their job needs: constant sounds low, rare rewards higher.
LOUD = {'button': -46, 'pick': -40, 'tile': -39, 'count': -40, 'switch': -39, 'whoosh': -40, 'pop': -37, 'mic': -34, 'not-right': -31, 'right': -28, 'combo': -28,
        'streak': -28, 'freeze': -29, 'new-phrase': -28, 'award': -27, 'reminder': -27, 'lesson-done': -25, 'level-up': -26, 'perfect': -24, 'trophy': -25}
CUT = {'mic': -18, 'voice': -45}                                   # where the file starts: the first moment this many dB under the top (default -30)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, stdin=subprocess.DEVNULL).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768.0
    m = np.abs(x).max(axis=1)
    a = int(np.argmax(m > m.max() * 0.004)); b = len(m) - int(np.argmax(m[::-1] > m.max() * 0.0016))        # same cut as the listening page
    return x[a:min(len(x), b + int(SR * 0.03))].copy()


def envelope(x):                                                           # loudness over time, 10 ms wide
    m = x.mean(axis=1).astype(np.float64); n = int(SR * 0.01); return np.sqrt(np.convolve(m * m, np.ones(n) / n, 'same'))


def loudness(x):                                                           # ITU-R BS.1770 weighting, loudest 200 ms (a 10 ms click counts as 10 ms of sound, not 200)
    def biquad(kind, fc, q, gain=0.0):
        A = 10 ** (gain / 40); w = 2 * np.pi * fc / SR; al = np.sin(w) / (2 * q); c = np.cos(w)
        if kind == 'shelf':
            b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
            a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
        else: b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
        return np.array(b) / a[0], np.array(a) / a[0]
    n = int(SR * 0.2); y = np.concatenate([x.astype(np.float64), np.zeros((n, x.shape[1]))])
    for f in (biquad('shelf', 1500.0, 0.7071, 4.0), biquad('pass', 38.0, 0.5)): y = lfilter(f[0], f[1], y, axis=0)
    e = np.concatenate([[0], np.cumsum((y ** 2).sum(axis=1) if x.shape[1] > 1 else y[:, 0] ** 2)])
    return -0.691 + 10 * np.log10(max((e[n:] - e[:-n]).max() / n, 1e-12))


def write(slot, name, src, out=OUT, target=None):                         # build_families.py uses this too, with its own folder and level
    x = decode(os.path.join(HERE, src))
    env = envelope(x); x = x[max(0, int(np.argmax(env > env.max() * 10 ** (CUT.get(slot, -30) / 20))) - int(SR * 0.01)):]      # no slow fade-in before the sound is heard
    mono = x.mean(axis=1, keepdims=True)
    lost = 20 * np.log10(max(np.sqrt((mono ** 2).mean()), 1e-9) / max(np.sqrt((x ** 2).mean()), 1e-9))
    if lost > -1.5: x = mono                                               # mono unless the two sides cancel each other
    x = x * (10 ** (-3 / 20) / np.abs(x).max())
    fade = max(min(int(SR * 0.004), len(x) // 4), 1); ramp = np.linspace(0, 1, fade)[:, None]; x[:fade] *= ramp; x[-fade:] *= ramp[::-1]
    with wave.open(os.path.join(out, name + '.wav'), 'wb') as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    env = envelope(x); half = int(np.argmax(env > env.max() * 0.5)) / SR
    hit = int(env.argmax() * 1000 / SR) if half > 0.25 else 0      # a sound that takes over a quarter of a second to get loud builds up: the app starts it early by this much
    loud = loudness(x); volume = round(min(1.0, 10 ** (((LOUD[slot] if target is None else target) - loud) / 20)), 3)
    return {'file': name + '.wav', 'ms': int(len(x) / SR * 1000), 'channels': x.shape[1], 'hit': hit, 'volume': volume, 'loud': round(loud, 1)}


def main():
    man = json.load(open(os.path.join(HERE, 'manifest.json'), encoding='utf-8')); picks = json.load(open(os.path.join(HERE, 'picks.json'), encoding='utf-8'))
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT); jobs = []
    for s in man['slots']:
        liked = picks.get(s['id'], {}).get('liked', [])
        if len(liked) != 1: print('!! %s has %d likes, skipped' % (s['id'], len(liked))); continue
        it = next(i for i in s['items'] if i['id'] == liked[0])
        for name, src in ([(s['id'] + '-on', it['orig']), (s['id'] + '-off', it['orig2'])] if it.get('orig2') else [(s['id'], it['orig'])]): jobs.append((s, it, name, src))
    with ThreadPoolExecutor(12) as ex: done = list(ex.map(lambda j: write(j[0]['id'], j[2], j[3]), jobs))
    out = []
    for (s, it, name, src), d in zip(jobs, done):
        out.append({'name': name, **d, 'when': s['when'], 'needed': s['priority'], 'picked': it['title'], 'source': it['source'], 'licence': it['lic'],
                    'credit': it.get('attribution'), 'page': it.get('page2') if name.endswith('-off') and it.get('page2') else it.get('page'), 'original': src})
        print('%-14s %5d ms  %s  file %6.1f LUFS -> heard at %3d (volume %.3f)  %s%s' % (name, d['ms'], 'mono  ' if d['channels'] == 1 else 'stereo', d['loud'], LOUD[s['id']], d['volume'],
                                                                                 it['title'], '  · loud moment at %d ms' % d['hit'] if d['hit'] else ''))
    json.dump({'sounds': out}, open(os.path.join(OUT, 'sounds.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'files ·', sum(os.path.getsize(os.path.join(OUT, o['file'])) for o in out) // 1024, 'KB')


if __name__ == '__main__': main()
