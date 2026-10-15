import json, os, sys, glob
PREF = {'.wav': 0, '.flac': 1, '.ogg': 2, '.mp3': 3, '.m4a': 4, '.aif': 1, '.aiff': 1}
def load(slug):
    rows = json.load(open('sound-tools/meas/%s.json' % slug)); best = {}
    for r in rows:
        b, e = os.path.splitext(os.path.basename(r['file'])); k = b.lower()
        if k not in best or PREF.get(e.lower(), 9) < PREF.get(os.path.splitext(best[k]['file'])[1].lower(), 9): best[k] = r
    return sorted(best.values(), key=lambda r: r['file'])
if __name__ == '__main__':
    for slug in sys.argv[1:]:
        rows = load(slug); print('##', slug, len(rows))
        root = os.path.commonpath([r['file'] for r in rows]) if len(rows) > 1 else ''
        out = []
        for r in rows:
            n = os.path.relpath(r['file'], root).replace(os.sep, '/') if root else os.path.basename(r['file'])
            n = os.path.splitext(n)[0]
            out.append('%s|%.2f|%d|%s%d' % (n, r['s'], r['cen'], {'up': '^', 'down': 'v', 'flat': '-'}[r['dir']], r['onsets']))
        print('  '.join(out))
