// The acting engine: his streaming captions -> catalog actions fired on the word they belong to (spec §4.2).
// makeActing({ dombi, player, cfg, catalog?, now?, reduce?, onPick?, stage? }) ->
//   { audio(chunkMs), caption(textSoFar), final(), idle(), interrupted(), learnerTurn(), stop(), apply(pick), log }
// Nothing here is awaited on the audio path: captions schedule timers, his voice never waits.
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry, decide, wordTime, pauseTime, late } from './rules.js';

const SENTENCE = /[^.!?…]+(?:[.!?…]+|$)/g;
const wordsOf = (s) => s.split(/\s+/).filter(Boolean);

export function makeActing({ dombi, player, cfg, catalog = CATALOG, now = () => performance.now(), reduce = false, onPick = null, stage = null }) {
  const log = [], timers = new Set();
  let alive = true, turn = 0, lastBigTurn = -99, lastId = '', T = null, done = null;

  const at = (ms, fn) => { const h = setTimeout(() => { timers.delete(h); if (alive) fn(); }, Math.max(0, ms - now())); timers.add(h); return h; };
  const clearAll = () => { for (const h of timers) clearTimeout(h); timers.clear(); };
  const newTurn = () => ({ id: ++turn, startAt: null, pushed0: 0, audioMs: 0, text: '', handled: new Set(), acted: new Set(), turnEnd: [], clauseWords: 0, asked: 0 });

  function fire(e, how, word, of = T) {
    if (!alive) return;
    dombi.fire(e.rig, e.ms);
    log.push({ id: e.id, word, how, at: Math.round(now()), turnStartAt: of ? Math.round(of.startAt) : null, turn: of ? of.id : turn });
    if (stage) { stage.pause(); setTimeout(() => alive && stage.resume(), e.ms); }
  }
  // sentences of the turn so far, each with the index of its first word
  function sentences(text) {
    const out = []; let w = 0;
    for (const m of text.match(SENTENCE) || []) { const n = wordsOf(m).length; if (!n) continue; out.push({ text: m.trim(), from: w, n, complete: /[.!?…]\s*$/.test(m) }); w += n; }
    return out;
  }
  const timeOfWord = (k) => wordTime({ turnStartAt: T.startAt, turnAudioMs: T.audioMs, k, n: wordsOf(T.text).length, offsetMs: cfg.ACT_OFFSET_MS || 0 });

  // one wanted action for sentence si, landing on word k (k = its index in the turn)
  function want(e, si, k, word) {
    const how = decide({ e, actedThisSentence: T.acted.has(si), turn: T.id, lastBigTurn, lastId, reduce }, cfg);
    if (how === 'skip') { log.push({ id: e.id, word, how: 'skip', turn: T.id }); return; }
    T.acted.add(si); lastId = e.id; if (e.big) lastBigTurn = T.id;
    const me = T;
    if (how === 'word') {
      const when = timeOfWord(k), next = sentences(T.text)[si + 1];
      const nextAt = next ? timeOfWord(next.from) : null;
      if (late({ at: Math.max(when, now()), nextSentenceStartAt: nextAt })) { log.push({ id: e.id, word, how: 'dropped', turn: T.id }); return; }
      log.push({ id: e.id, word, how: 'plan', at: Math.round(when), turn: me.id });
      at(when, () => { if (T === me || done === me) fire(e, 'word', word, me); });
      return;
    }
    me.pending = me.pending || []; me.pending.push({ e, si, word });              // a mouth action: decided when its sentence ends
  }
  function sentenceDone(s, si) {
    const me = T, end = timeOfWord(s.from + s.n);
    for (const p of (me.pending || []).filter((p) => p.si === si)) {
      at(end + cfg.MOUTH_AFTER_MS, () => {
        const more = wordsOf(me.text).length > s.from + s.n;                       // his next sentence is already coming
        const t = pauseTime({ sentenceEndAt: end, moreTextAfter: more, cfg });
        if (t === 'turn-end') me.turnEnd.push(p); else fire(p.e, 'pause', p.word, me);
      });
    }
  }

  return {
    log,
    // after each chunk of his voice is pushed: where this turn starts on the clock, and how much of it there is
    audio(chunkMs) {
      if (!alive) return; if (!T) T = newTurn();
      if (T.startAt == null) { T.startAt = player.endsAt() - chunkMs; T.pushed0 = player.pushedMs() - chunkMs; }
      T.audioMs = player.pushedMs() - T.pushed0;
    },
    // his caption so far for this turn (already cleaned of tags)
    caption(text) {
      if (!alive) return; if (!T) T = newTurn(); if (T.startAt == null) { T.startAt = now(); }
      const grew = wordsOf(text).length - wordsOf(T.text).length; T.text = text; T.clauseWords += Math.max(0, grew);
      sentences(text).forEach((s, si) => {
        for (const m of matchWords(s.text, catalog)) {
          const key = si + ':' + m.id; if (T.handled.has(key)) continue;
          if (!s.complete && m.index === s.n - 1 && /[\p{L}'ʻ]$/u.test(text)) continue;   // the last word may still be arriving ("diz" -> "dizzy")
          T.handled.add(key); want(entry(m.id), si, s.from + m.index, m.word);
        }
        if (s.complete && !T.handled.has('end:' + si)) { T.handled.add('end:' + si); sentenceDone(s, si); }
      });
      if (onPick && clauseEnd(text, T.clauseWords, cfg)) { T.clauseWords = 0; onPick({ turn: T.id, said: text, recent: log.filter((x) => x.how === 'word' || x.how === 'pause').slice(-4).map((x) => x.id) }); }
    },
    // his turn's text is complete (Gemini's turnComplete); its mouth actions still wait for his voice to end
    final() { if (!T) return; this.caption(T.text + ' '); if (!T) return; const s = sentences(T.text), last = s[s.length - 1]; if (last && !T.handled.has('end:' + (s.length - 1))) { T.handled.add('end:' + (s.length - 1)); sentenceDone(last, s.length - 1); } done = T; T = null; },
    // his voice has run out: the turn's waiting mouth actions play now
    idle() { const d = done; if (!d) return; setTimeout(() => { if (!alive || done !== d) return; for (const p of d.turnEnd.splice(0)) fire(p.e, 'pause', p.word, d); }, 0); },
    // cut off: everything planned for this turn is dropped
    interrupted() { clearAll(); T = null; done = null; },
    learnerTurn() { if (done) done.turnEnd.length = 0; },
    stop() { alive = false; clearAll(); T = null; done = null; },
    // a director pick (Task 6) lands through the same rules; answers for another turn are ignored
    apply(pick) { return pick; },
    turnId: () => (T ? T.id : null),
  };
}
