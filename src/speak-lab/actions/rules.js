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

// may this action play, and how (spec §4.2.5–6): 'word' lands on its word, 'pause' waits for the pause after the sentence
// (it uses his mouth), 'skip' = not now. One per sentence, never the same twice running, big ones once in BIG_EVERY_TURNS turns.
export function decide({ e, actedThisSentence, turn, lastBigTurn, lastId, reduce = false }, cfg) {
  if (!e || e.talk === false || actedThisSentence || e.id === lastId) return 'skip';
  if (e.big && (reduce || turn - lastBigTurn < cfg.BIG_EVERY_TURNS)) return 'skip';
  return e.mouth ? 'pause' : 'word';
}

// one action of a family, at random, never the last one played and never touch-only; null if none is left
export function variant(family, { lastId = '', rand = Math.random }, catalog = CATALOG) {
  const pool = catalog.filter((e) => e.family === family && e.talk !== false && e.id !== lastId);
  return pool.length ? pool[Math.floor(rand() * pool.length) % pool.length] : null;
}

// when word k of the n words so far plays: his speech is taken as even over the audio pushed so far (offsetMs is measured, Task 9)
export const wordTime = ({ turnStartAt, turnAudioMs, k, n, offsetMs = 0 }) => turnStartAt + (n ? (turnAudioMs * k) / n : 0) + offsetMs;

// a mouth action's moment: just after the sentence, unless his next sentence is already arriving, then at the end of his turn
export const pauseTime = ({ sentenceEndAt, moreTextAfter, cfg }) => (moreTextAfter ? 'turn-end' : sentenceEndAt + cfg.MOUTH_AFTER_MS);

// too late once his next sentence has started playing
export const late = ({ at, nextSentenceStartAt }) => nextSentenceStartAt != null && at > nextSentenceStartAt;

// the living layer (spec §4.3): what he does on his own now. Weighted by e.life[state] × the pack's tint; travel only when
// idle and not Reduce Motion; nothing big unless idle and not Reduce Motion; never the last one; never touch-only.
export function livePick({ state, pack, lastId = '', reduce = false, rand = Math.random }, catalog = CATALOG, cfg = {}) {
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
