// Adds mouth shapes to the lesson clips:  node lesson_mouth.mjs <index.json>   (build_lessons.py runs it)
// The voice tells us when each word starts and ends. The talking engine (design/rive/talk/engine.js) knows which mouth shapes a word
// is made of. Here each word's shapes are fitted into that word's real time, with the mouth at rest in the gaps and at the end.
// Result, for each clip and for its slow version:  mouth: [[ms, shape], ...]   shape = 0-11, the `viseme` number of Dombi and the waiters.
import fs from 'fs';
import { buildTrack } from '../../rive/talk/engine.js';
import { dictionary } from '../../rive/node_modules/cmu-pronouncing-dictionary/index.js';

const SHORT = 55, GAP = 70, KEEP = new Set([1, 2, 8]);            // a shape shorter than this is not seen · a pause longer than this closes the mouth · lip shapes are never dropped
const LEAD = 60;                                                  // the mouth moves this much before the sound, as a real mouth does. The build measured word times 16 ms late at the median, so this also keeps most mouths from being late
function mouth(words, ms) {
  let segs = [];
  words.forEach(([text, start, end], i) => {
    const tr = buildTrack(text, 'en', { dict: dictionary }).segs.filter((s) => s.v !== 0), total = tr.reduce((a, s) => a + s.dur, 0);
    let t = start; for (const s of tr) { const d = s.dur * (end - start) / total; segs.push({ v: s.v, start: t, dur: d }); t += d; }
    const next = words[i + 1]; if (next ? next[1] - end > GAP : true) segs.push({ v: 0, start: end, dur: (next ? next[1] : ms) - end });
  });
  segs = segs.filter((s, i) => s.v === 0 || s.dur >= SHORT || KEEP.has(s.v) || !segs[i - 1] || segs[i - 1].v === 0);      // a dropped shape's time goes to the one before it
  const out = []; for (const s of segs) if (!out.length || out[out.length - 1][1] !== s.v) out.push([Math.max(0, Math.round(s.start - LEAD)), s.v]);
  return out;
}
const file = process.argv[2], index = JSON.parse(fs.readFileSync(file, 'utf8')); let n = 0, none = [];
for (const [name, c] of Object.entries(index.clips)) for (const part of [c, c.slow]) {
  if (!part.words.length) { none.push(name); part.mouth = [[0, 5], [part.ms - 90, 0]]; continue; }                         // no word times came back: open, then closed
  part.mouth = mouth(part.words, part.ms); n++;
}
fs.writeFileSync(file, JSON.stringify(index, null, 1));
console.log(`mouth shapes for ${n} clips` + (none.length ? `; no word times for: ${[...new Set(none)].join(', ')}` : ''));
