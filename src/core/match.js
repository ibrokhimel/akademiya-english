// Match rush (Juftini top), frames M1–M5: one minute, boards of 4 audio cards and the same 4 phrases.
// Tap a card on one side, then its pair on the other. A right pair fades; a new board comes when all 4 are found.
// A wrong pair flashes amber for 600 ms and counts nothing. Taps from the 60th second on do not count. No screens here.
//   matchStart(pool, { rand, now }) -> state      matchReducer(state, { type: 'audio' | 'phrase' | 'tick', i?, t }) -> state
import { shuffle } from './practice.js';

export const MATCH_MS = 60000, BOARD = 4, FLASH_MS = 600;

function board(pool, last, rand) {
  const fresh = shuffle(pool.filter((p) => !last.includes(p.id)), rand), old = shuffle(pool.filter((p) => last.includes(p.id)), rand);
  const ids = [...fresh, ...old].slice(0, BOARD).map((p) => p.id);
  return { audio: shuffle(ids, rand), phrase: shuffle(ids, rand), matched: [] };
}

export function matchStart(pool, { rand = Math.random, now = Date.now() } = {}) {
  return { pool, rand, ...board(pool, [], rand), pick: null, flash: null, found: 0, combo: 0, bestCombo: 0, missed: [], end: now + MATCH_MS, done: false };
}

export function matchReducer(s, ev) {
  if (s.done) return s;
  if (ev.t >= s.end) return { ...s, done: true, pick: null };
  if (ev.type === 'tick') return s.flash && ev.t >= s.flash.until ? { ...s, flash: null } : s;
  const side = ev.type, id = s[side][ev.i];
  if (id === undefined || s.matched.includes(id)) return s;
  const flash = s.flash && ev.t < s.flash.until ? s.flash : null;
  if (!s.pick || s.pick.side === side) return { ...s, flash, pick: { side, i: ev.i } };
  const other = s[s.pick.side][s.pick.i], a = side === 'audio' ? ev.i : s.pick.i, p = side === 'phrase' ? ev.i : s.pick.i;
  if (other !== id) {
    const missed = s.missed.includes(s.audio[a]) ? s.missed : [...s.missed, s.audio[a]];
    return { ...s, pick: null, combo: 0, missed, flash: { audio: a, phrase: p, until: ev.t + FLASH_MS } };
  }
  const combo = s.combo + 1, next = { ...s, pick: null, flash, found: s.found + 1, combo, bestCombo: Math.max(s.bestCombo, combo), matched: [...s.matched, id] };
  return next.matched.length === BOARD ? { ...next, ...board(s.pool, s.audio, s.rand) } : next;
}
