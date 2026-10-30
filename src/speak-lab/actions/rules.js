// The action engine's pure rules: no DOM, no timers, tested in node (rules.test.js). Spec: docs/superpowers/specs/2026-10-30-dombi-action-engine-design.md
import { CATALOG } from './catalog.js';

const BY_ID = new Map(CATALOG.map((e) => [e.id, e]));
export const entry = (id) => BY_ID.get(id);

// letters for word edges: Latin, Cyrillic, and the Uzbek apostrophes that live inside words (o'zbek, g'alaba)
const LETTER = "\\p{L}\\p{N}'ʻʼ‘’";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RX = new Map();
const rxFor = (w) => RX.get(w) || RX.set(w, new RegExp(`(?<![${LETTER}])${esc(w)}(?![${LETTER}])`, 'iu')).get(w);

// matchWords(sentence so far) -> [{ id, word, index }] in sentence order; index = the word's position (0-based), for timing.
// Runs on the whole sentence so far, so a word split across caption pieces still matches once it is complete.
export function matchWords(sentence, catalog = CATALOG) {
  const text = sentence || '', hits = [];
  for (const e of catalog) {
    if (e.talk === false) continue;
    for (const w of e.words) {
      const m = rxFor(w).exec(text);
      if (m) { hits.push({ id: e.id, word: m[0], index: text.slice(0, m.index).split(/\s+/).filter(Boolean).length, at: m.index }); break; }
    }
  }
  return hits.sort((x, y) => x.at - y.at).map(({ at, ...h }) => h);
}

// may this beat play, and how (spec 2026-10-30 in-sync §4.4): 'go' starts on its word, 'pause' waits for his voice to run
// out (it uses his mouth), 'skip' = not now. At most BEATS_PER_SENTENCE in a sentence, starts BEAT_GAP_MS apart, never the
// same action twice running, big ones once in BIG_EVERY_TURNS turns and never with Reduce Motion.
export function beatOk({ e, at, starts = [], inSentence = 0, lastId = '', turn, lastBigTurn, reduce = false }, cfg) {
  if (!e || e.talk === false || e.id === lastId || inSentence >= cfg.BEATS_PER_SENTENCE) return 'skip';
  if (starts.some((s) => Math.abs(s - at) < cfg.BEAT_GAP_MS)) return 'skip';
  if (e.big && (reduce || turn - lastBigTurn < cfg.BIG_EVERY_TURNS)) return 'skip';
  return e.mouth ? 'pause' : 'go';
}

// when a held beat lets go: the end of word k (`word`), of k's sentence once that sentence is complete (`sentence`), or
// never on its own (`topic`); always by his voice's end + HOLD_TAIL_MS and HOLD_CAP_MS after it started, never before HOLD_MIN_MS
export function holdEnd({ until, k, clock, voiceEndAt = Infinity, startedAt }, cfg) {
  let end = Infinity;
  if (until === 'word') end = clock.endOf(k) ?? Infinity;
  else if (until === 'sentence') { const s = clock.sentences()[clock.sentenceOf(k)]; if (s && s.complete) end = clock.endOf(s.from + s.n - 1); }
  return Math.min(Math.max(end, startedAt + cfg.HOLD_MIN_MS), voiceEndAt + cfg.HOLD_TAIL_MS, startedAt + cfg.HOLD_CAP_MS);
}

// small talking motion (spec 2026-10-30 in-sync §4.7): which of his words get a nod / tilt / bob: the ones longer than the
// line's median (the stressed, content-carrying ones), TALK_BEAT_GAP_MS apart, none that start before `heldUntil` (a move is on)
export function talkBeats(words, { heldUntil = -Infinity, cfg }) {
  const timed = words.filter((w) => w.start != null && w.end != null);
  if (!timed.length) return [];
  const lens = timed.map((w) => w.end - w.start).sort((x, y) => x - y), median = lens[Math.floor(lens.length / 2)];
  const out = []; let last = -Infinity;
  for (const w of timed) {
    if (w.end - w.start <= median || w.start < heldUntil || w.start - last < cfg.TALK_BEAT_GAP_MS) continue;
    out.push(w.k); last = w.start;
  }
  return out;
}

// the face a move that cannot hold yet leaves on him for the rest of its beat (spec §4.5)
export const FAMILY_FACE = { celebrate: 'happy', 'show-off': 'cocky', surprise: 'surprised', annoyed: 'hmph', oops: 'oops', lazy: 'tired',
  think: 'think', listen: 'listen', food: 'hungry', greet: 'happy', dizzy: 'woozy', offer: 'happy', explain: 'focus', move: null, touch: null };

// one action of a family, at random, never the last one played and never touch-only; null if none is left
export function variant(family, { lastId = '', rand = Math.random }, catalog = CATALOG) {
  const pool = catalog.filter((e) => e.family === family && e.talk !== false && e.id !== lastId);
  return pool.length ? pool[Math.floor(rand() * pool.length) % pool.length] : null;
}

// the living layer (spec §4.3): what he does on his own now. Weighted by e.life[state] × the pack's tint; travel only when
// idle and not Reduce Motion; nothing big unless idle and not Reduce Motion; never the last one; never touch-only.
// Nothing while he talks: his beats and talking motion are his only motion then (spec 2026-10-30 in-sync §4.5).
export function livePick({ state, pack, lastId = '', reduce = false, rand = Math.random }, catalog = CATALOG, cfg = {}) {
  if (state === 'talking') return null;
  const items = catalog.filter((e) => e.talk !== false && e.id !== lastId && (e.life[state] || 0) > 0 && (!e.big || (state === 'idle' && !reduce)))
    .map((e) => [e, e.life[state] * ((e.packs && e.packs[pack]) ?? 1)]);
  if (state === 'idle' && !reduce) items.push([{ travel: true }, cfg.TRAVEL_WEIGHT || 0]);
  const total = items.reduce((n, [, w]) => n + w, 0); if (!total) return null;
  let r = rand() * total;
  for (const [e, w] of items) { if ((r -= w) < 0) return e; }
  return items[items.length - 1][0];
}

// how long until his next living move: LIFE_MIN_MS..LIFE_MAX_MS, twice as long with Reduce Motion (half as many moves)
export const nextLifeMs = ({ reduce = false, rand = Math.random }, cfg) => (cfg.LIFE_MIN_MS + rand() * (cfg.LIFE_MAX_MS - cfg.LIFE_MIN_MS)) * (reduce ? 2 : 1);

// a clause is done at , . ! ? (or … ;), or after cfg.CLAUSE_WORDS words without one: that is when the director is asked
export function clauseEnd(sentence, wordsSinceLast, cfg) {
  return /[,.!?;…]\s*$/.test(sentence || '') || wordsSinceLast >= cfg.CLAUSE_WORDS;
}
