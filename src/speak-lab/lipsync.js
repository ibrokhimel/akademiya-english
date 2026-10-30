// Lip sync (spec 2026-10-30 in-sync §4.3): his mouth shapes come from the words he says, each word's shapes fitted into the
// slot the word clock gives it, and a loudness gate so the mouth rests whenever his real sound goes quiet.
// The rules (EN / UZ / RU sounds -> mouth shapes 0..11) are the talking engine's: design/rive/talk/engine.js.
import { buildTrack, visemeAt } from '../../design/rive/talk/engine.js';

const DICT_URL = '/design/rive/node_modules/cmu-pronouncing-dictionary/index.js';   // ~4.7 MB, so it loads once, in the background
const LOUD = 4, MIN_WORD_MS = 80, NO_SHAPES = 5;                                     // a word with no known sounds still opens the mouth

// the English pronouncing dictionary, or null (opened from file://, offline): English then falls back to spelling rules
let dictLoad = null;
export const loadDict = () => (dictLoad ||= import(DICT_URL).then((m) => m.dictionary || null).catch(() => null));

export function langOf(word, dict) {
  const w = (word || '').toLowerCase();
  if (/[Ѐ-ӿ]/.test(w)) return 'ru';
  if (dict && dict[w.replace(/[^a-z']/g, '')]) return 'en';
  if (/[og]['ʻ’‘]|q(?!u)|^x/.test(w)) return 'uz';
  return 'en';
}

const tracks = new Map();
function trackOf(word, dict) {
  const key = (dict ? 'd:' : 'r:') + word;
  if (!tracks.has(key)) { let t; try { t = buildTrack(word, langOf(word, dict), { dict }); } catch { t = { segs: [], total: 0 }; } tracks.set(key, t); }
  return tracks.get(key);
}

// the clock's `weigh`: the word's natural length from its sounds, plus the pause its punctuation asks for
export function weighWord(word, punct, dict) {
  const speech = Math.max(MIN_WORD_MS, trackOf(word, dict).total, /\d/.test(word) ? word.length * 150 : 0);
  return speech + (/[.!?…]/.test(punct || '') ? 420 : /[,;:]/.test(punct || '') ? 220 : 0);
}

// makeLipsync({ clock, levelAt, dict, cfg }) -> { at(t) }: the mouth shape at page time t
export function makeLipsync({ clock, levelAt, dict = () => null, cfg }) {
  const gate = cfg.MOUTH_GATE_MS || 80;
  const quiet = (t) => { for (let d = 0; d <= gate; d += 20) if (levelAt(t - d) >= LOUD) return false; return true; };
  return {
    at(t) {
      if (quiet(t)) return 0;
      const w = clock.words().find((x) => x.start != null && t >= x.start && t < x.end);
      if (!w) return 0;                                                            // between words: a pause
      const tr = trackOf(w.text, dict());
      if (!tr.segs.length) return NO_SHAPES;
      const v = visemeAt(tr, ((t - w.start) / Math.max(1, w.end - w.start)) * tr.total);
      return Number.isInteger(v) && v >= 0 && v <= 11 ? v : 0;
    },
  };
}
