"""python -I find.py <regex> [min_s] [max_s] [pack-regex]  -> matching files across all measured packs (deduped formats)"""
import sys, re, json, glob, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'sound-tools'); from listing import load
rx = re.compile(sys.argv[1], re.I); lo = float(sys.argv[2]) if len(sys.argv) > 2 else 0; hi = float(sys.argv[3]) if len(sys.argv) > 3 else 99
prx = re.compile(sys.argv[4], re.I) if len(sys.argv) > 4 else None
base = 'sound-src/packs/'
for f in sorted(glob.glob('sound-tools/meas/*.json')):
    slug = os.path.basename(f)[:-5]
    if prx and not prx.search(slug): continue
    rows = [r for r in load(slug) if lo <= r['s'] <= hi and rx.search(r['file'].split('/packs/' + slug + '/')[-1])]
    if not rows: continue
    print('##', slug, len(rows))
    print('  '.join('%s|%.2f|%d|%s%d' % (os.path.splitext(r['file'].split('/packs/' + slug + '/')[-1])[0], r['s'], r['cen'], {'up': '^', 'down': 'v', 'flat': '-'}[r['dir']], r['onsets']) for r in rows))
