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

// a clause is done at , . ! ? (or … ;), or after cfg.CLAUSE_WORDS words without one: that is when the director is asked
export function clauseEnd(sentence, wordsSinceLast, cfg) {
  return /[,.!?;…]\s*$/.test(sentence || '') || wordsSinceLast >= cfg.CLAUSE_WORDS;
}
