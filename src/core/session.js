// One lesson being played: which item comes next, the mistakes round, the numbers for the result screen.
// Rules: docs/ideas/lesson-template.md and mistake-engine.md. No screen in here. Tests: node --test src/core/core.test.js
//
//   const s = makeSession(lesson, { speaking: true })
//   s.next()            -> { item, round: 'lesson' | 'mistakes', n, of } or null when the lesson is over
//   s.answer(right)     the learner answered the item that next() gave
//   s.skip()            the item cannot be done now (an Echo line while speaking is off): it is left out, not counted
//   s.startMistakes()   true when the lesson's items are done and missed ones wait; the player shows the mistakes card first
//   s.stats()           { accuracy, mistakes, perfect, combo, bestCombo, progress, answered, skipped }

import { tilesOf } from './text.js';

const SPEAK_ONLY = new Set(['echo']);            // skipped as a whole while speaking is off
const BY_TILES = new Set(['meet', 'say']);       // answered with word tiles while speaking is off

export function makeSession(lesson, { speaking = true } = {}) {
  const todo = lesson.items.map((item, n) => ({ item, n })), again = [];
  let cur = null, round = 'lesson', asked = 0, firstRight = 0, missed = 0, combo = 0, bestCombo = 0, done = 0, skipped = 0, announced = false;
  const total = () => lesson.items.length - skipped;

  return {
    lesson,
    get speaking() { return speaking; }, set speaking(v) { speaking = v; },
    // how the item is answered right now: 'speak', 'tiles' (speaking is off) or its own way
    way(item) { return SPEAK_ONLY.has(item.ex) || BY_TILES.has(item.ex) ? (speaking ? 'speak' : BY_TILES.has(item.ex) ? 'tiles' : 'skip') : item.ex; },
    next() {
      if (cur) return cur;
      if (round === 'lesson' && !todo.length && again.length) round = 'mistakes';
      const from = round === 'lesson' ? todo : again; if (!from.length) return null;
      const e = from.shift(); cur = { ...e, round, of: lesson.items.length }; return cur;
    },
    startMistakes() { if (announced || todo.length || !again.length || cur) return false; announced = true; return true; },
    answer(right) {
      if (!cur) throw new Error('no item is open');
      const first = cur.round === 'lesson';
      if (first) { asked++; if (right) firstRight++; else missed++; }
      if (right) { done++; combo++; bestCombo = Math.max(bestCombo, combo); } else { combo = 0; again.push({ item: cur.item, n: cur.n }); }   // a missed item comes back at the end, until it is right
      cur = null; return { combo, round };
    },
    skip() { if (!cur) throw new Error('no item is open'); skipped++; cur = null; },
    stats() {
      return { accuracy: asked ? Math.round((firstRight / asked) * 100) : 100, mistakes: missed, perfect: asked > 0 && missed === 0, combo, bestCombo,
        progress: total() ? done / total() : 1, answered: asked, skipped, left: todo.length + again.length + (cur ? 1 : 0) };
    },
  };
}

// Two wrong tiles for an item that is answered with tiles only because speaking is off (the lesson file gives none for those):
// words from the lesson's other phrases that are not in the answer. The same item always gets the same two.
export function spareTiles(answerWords, otherTexts, count = 2) {
  const have = new Set(answerWords.map((w) => w.toLowerCase())), pool = [];
  for (const t of otherTexts) for (const w of tilesOf(t)) if (!have.has(w.toLowerCase()) && !pool.some((p) => p.toLowerCase() === w.toLowerCase())) pool.push(w);
  if (pool.length <= count) return pool;
  const seed = answerWords.join(' ').length, a = pool[seed % pool.length], b = pool[(seed + 1 + (pool.length >> 1)) % pool.length];
  return a === b ? [a, pool[(seed + 1) % pool.length]] : [a, b];
}
// A fixed shuffle: the same tiles come in the same order every time an item is shown (a learner who retries sees the same board).
export function mix(list, seed) { const a = [...list]; let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a; }
