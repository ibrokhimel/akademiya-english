// Plays the lesson's sound clips. A clip can light up words in time and move a speaker's mouth.
//   say(voice, text, { slow, words: [elements], mouth: who, onStart(ms) })   a promise that ends with the sound (its length in ms, 0 if it was cut)
//   stop()                                                                     cuts whatever is playing
import { C, clipUrl } from './content.js';
import { clipOf } from '../core/text.js';
import { People } from './people.js';

const buf = {}; let run = 0, live = null;
// the lesson voices have their own way out, so switching the sound effects off leaves them on
let bus = null; const voiceBus = () => bus || (bus = (() => { const g = SND.ctx.createGain(); g.connect(SND.ctx.destination); return g; })());
const load = (url) => buf[url] || (buf[url] = fetch(url).then((r) => r.arrayBuffer()).then((b) => SND.ctx.decodeAudioData(b)));
export const clipFor = (voice, text) => C.clips[clipOf(voice, text)];
export const preload = (voice, text) => { const f = clipOf(voice, text); if (C.clips[f]) load(clipUrl(f, false)); };
export function stop() { run++; if (live) { try { live.stop(); } catch (e) {} live = null; } People.quiet(); document.querySelectorAll('.now').forEach((w) => w.classList.remove('now')); }
export async function say(voice, text, o = {}) {
  stop(); const me = run, file = clipOf(voice, text), clip = C.clips[file], part = clip && (o.slow ? clip.slow : clip); if (!part) return 0;
  if (SND.ctx.state !== 'running') await SND.ctx.resume();
  const b = await load(clipUrl(file, o.slow)); if (me !== run) return 0;
  const src = SND.ctx.createBufferSource(), g = SND.ctx.createGain(); src.buffer = b; g.gain.value = part.volume; src.connect(g); g.connect(voiceBus()); src.start(); live = src;
  const vm = o.mouth ? People.vm[o.mouth] : null, t0 = performance.now(); let shown = -1; if (vm) vm.boolean('talking').value = true; if (o.onStart) o.onStart(part.ms);
  const tick = () => { if (me !== run) return; const t = performance.now() - t0;
    if (vm) { let shape = 0; for (const [at, s] of part.mouth) { if (at > t) break; shape = s; } if (shape !== shown) vm.number('viseme').value = shown = shape; }
    if (o.words) part.words.forEach(([, a, z], i) => { if (o.words[i]) o.words[i].classList.toggle('now', t >= a && t < z + 60); });
    if (t < part.ms) requestAnimationFrame(tick); }; tick();
  await new Promise((r) => { src.onended = r; }); if (me !== run) return 0; stop(); return part.ms;
}
