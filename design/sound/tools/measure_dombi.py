"""How loud and how high each of Dombi's voices is.  python -I tools/measure_dombi.py <folder from check-dombi.js> [target LUFS]
Prints the gain each voice needs in dombi-voice.js to be heard at the target (same measure as the other sounds)."""
import os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path[:0] = [HERE, os.path.dirname(HERE)]
import features
from build_final import loudness

folder = sys.argv[1]; target = float(sys.argv[2]) if len(sys.argv) > 2 else -33.0
print('%-8s %7s %6s %6s  %-9s %s' % ('voice', 'loud', 'peak', 'bright', 'gain x', 'notes'))
for f in sorted(os.listdir(folder)):
    if not f.endswith('.wav'): continue
    w = wave.open(os.path.join(folder, f), 'rb'); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64) / 32768.0
    d = features.describe(os.path.join(folder, f)); loud = loudness(x[:, None])
    print('%-8s %7.1f %6.2f %6.0f  x %-7.2f %s' % (f[:-4], loud, np.abs(x).max(), d['bright'], 10 ** ((target - loud) / 20), d['notes']))
