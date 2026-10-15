"""Build the audition set.  python -I build_candidates.py <curated.json>

curated.json = {"slots": [{id, group, name, when, want, priority, ladder, items: [{src, src2?, title, source, lic, attribution, page}]}]}
For every item: trim the silence at both ends, bring the peak to -3 dB (so no option wins just by being louder),
save as candidates/<slot>/<nn>-<name>.ogg, and write manifest.json (with a small waveform and where the sound came from).
An item with `src2` is an on/off pair: on, a pause, off.
The untouched original of every option is copied to originals/<slot>/ (`orig` in the manifest); `page` is where it came from.
"""
import sys, os, re, json, shutil, subprocess
from concurrent.futures import ThreadPoolExecutor
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'candidates'); KEEP = os.path.join(HERE, 'originals'); SR = 44100


def decode(path):
    """Decoded stereo samples with the silence cut from both ends (start: below -48 dB of the peak, end: below -56 dB)."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, stdin=subprocess.DEVNULL).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768.0
    m = np.abs(x).max(axis=1) if len(x) else np.zeros(0)
    if not len(m) or m.max() < 1e-3: return x[:0]
    a = int(np.argmax(m > m.max() * 0.004)); b = len(m) - int(np.argmax(m[::-1] > m.max() * 0.0016))
    return x[a:min(len(x), b + int(SR * 0.03))].copy()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:40]


def make(job):
    sid, n, it = job
    x = decode(it['src'])
    if it.get('src2'): x = np.concatenate([x, np.zeros((int(SR * 0.4), 2), np.float32), decode(it['src2'])])
    peak = float(np.abs(x).max()) if len(x) else 0.0
    if len(x) < SR * 0.002 or peak < 1e-3: return None
    x = x * (10 ** (-3 / 20) / peak)
    fade = max(min(int(SR * 0.004), len(x) // 4), 1); ramp = np.linspace(0, 1, fade)[:, None]; x[:fade] *= ramp; x[-fade:] *= ramp[::-1]   # no clicks at the cut
    name = '%02d-%s.ogg' % (n, slug(it['title'])); dst = os.path.join(OUT, sid, name)
    p = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libvorbis', '-q:a', '6', dst],
                       input=(np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes(), capture_output=True)
    if p.returncode: return None
    keep = lambda src, tag='': shutil.copyfile(src, os.path.join(KEEP, sid, name[:-4] + tag + os.path.splitext(src)[1].lower())) and None or 'originals/%s/%s' % (sid, name[:-4] + tag + os.path.splitext(src)[1].lower())
    orig = keep(it['src']); orig2 = keep(it['src2'], '-off') if it.get('src2') else None
    mono = np.abs(x).max(axis=1); k = 48; step = max(len(mono) // k, 1)
    peaks = [round(float(mono[i * step:(i + 1) * step].max()), 2) for i in range(k) if i * step < len(mono)]
    return {'id': sid + '/' + name[:-4], 'url': 'candidates/%s/%s' % (sid, name), 'title': it['title'], 'source': it['source'], 'lic': it['lic'], 'attribution': it.get('attribution'),
            'page': it.get('page'), 'orig': orig, 'orig2': orig2, 'page2': it.get('page2'), 'ms': int(len(x) / SR * 1000), 'peaks': peaks}


def main():
    cur = json.load(open(sys.argv[1], encoding='utf-8'))
    for d in (OUT, KEEP):
        if os.path.isdir(d): shutil.rmtree(d)
    jobs = []
    for s in cur['slots']:
        os.makedirs(os.path.join(OUT, s['id']), exist_ok=True); os.makedirs(os.path.join(KEEP, s['id']), exist_ok=True)
        jobs += [(s['id'], i + 1, it) for i, it in enumerate(s['items'])]
    with ThreadPoolExecutor(12) as ex: done = list(ex.map(make, jobs))       # ffmpeg takes seconds to start on this machine, so run many at once
    slots, skipped = [], [j[2]['src'] for j, r in zip(jobs, done) if r is None]
    for s in cur['slots']:
        items = [r for j, r in zip(jobs, done) if j[0] == s['id'] and r]
        slots.append({k: s[k] for k in ('id', 'group', 'name', 'when', 'want', 'priority')} | {'ladder': bool(s.get('ladder')), 'items': items})
        print('%-12s %d' % (s['id'], len(items)))
    json.dump({'slots': slots}, open(os.path.join(HERE, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('total', sum(len(s['items']) for s in slots), '· skipped', len(skipped)); [print('  skipped', x) for x in skipped]


main()
