"""Measure every audio file under a folder.  python -I analyse.py <folder> <out.json>
Per file: seconds (after trimming silence), centroid Hz, pitch at start / end (Hz), direction, onsets (rough note count), peak dB."""
import sys, os, json, subprocess
import numpy as np
EXT = ('.ogg', '.wav', '.mp3', '.m4a', '.flac', '.aif', '.aiff')
SR = 22050
def decode(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768.0
def pitch(x):
    if len(x) < 512: return 0
    w = x * np.hanning(len(x)); sp = np.abs(np.fft.rfft(w, 8192)); f = np.fft.rfftfreq(8192, 1 / SR)
    m = (f > 90) & (f < 5000); 
    if sp[m].max() < 1e-4: return 0
    return float(f[m][np.argmax(sp[m])])
def measure(p):
    x = decode(p)
    if len(x) < 64: return None
    peak = float(np.abs(x).max())
    if peak < 1e-4: return None
    thr = peak * 0.02; idx = np.where(np.abs(x) > thr)[0]; a, b = idx[0], idx[-1] + 1; y = x[a:b]
    sp = np.abs(np.fft.rfft(y * np.hanning(len(y)))); f = np.fft.rfftfreq(len(y), 1 / SR); cen = float((sp * f).sum() / max(sp.sum(), 1e-9))
    n = len(y); seg = max(1024, n // 4); p0, p1 = pitch(y[:seg]), pitch(y[-seg:])
    hop = 512; env = np.array([np.sqrt((y[i:i + hop] ** 2).mean()) for i in range(0, max(n - hop, 1), hop)])
    d = np.diff(env, prepend=0); on = int(((d > 0.08 * env.max()) & (np.roll(d, 1) <= 0.08 * env.max())).sum()) if len(env) > 2 else 1
    direction = 'flat' if not p0 or not p1 or abs(np.log2(p1 / p0)) < 0.08 else ('up' if p1 > p0 else 'down')
    return {'s': round(n / SR, 3), 'lead_ms': int(a / SR * 1000), 'cen': int(cen), 'p0': int(p0), 'p1': int(p1), 'dir': direction, 'onsets': on, 'peak_db': round(20 * np.log10(peak), 1)}
root, out = sys.argv[1], sys.argv[2]; res = []
for d, _, fs in os.walk(root):
    for fn in sorted(fs):
        if fn.lower().endswith(EXT):
            p = os.path.join(d, fn).replace(os.sep, '/')
            try: m = measure(p)
            except Exception as e: m = None
            if m: m['file'] = p; res.append(m)
json.dump(res, open(out, 'w'), indent=0); print(len(res), 'files measured')
