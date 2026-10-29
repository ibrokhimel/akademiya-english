// The acting engine: his streaming captions -> catalog actions fired on the word they belong to (spec §4.2).
// makeActing({ dombi, player, cfg, catalog?, now?, reduce?, onPick?, stage? }) ->
//   { audio(chunkMs), caption(textSoFar), final(), idle(), interrupted(), learnerTurn(), stop(), apply(pick), log }
// Nothing here is awaited on the audio path: captions schedule timers, his voice never waits.
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry, decide, variant, wordTime, pauseTime, late } from './rules.js';

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
  const timeOfWord = (me, k) => wordTime({ turnStartAt: me.startAt, turnAudioMs: me.audioMs, k, n: wordsOf(me.text).length, offsetMs: cfg.ACT_OFFSET_MS || 0 });

  // one wanted action for sentence si of turn `me`, landing on word k (its index in the turn). A late director pick waits for
  // the end of his turn instead (spec §4.2.3); a late word-list match is dropped.
  function want(me, e, si, k, word, director = false) {
    const how = decide({ e, actedThisSentence: me.acted.has(si), turn: me.id, lastBigTurn, lastId, reduce }, cfg);
    if (how === 'skip') { log.push({ id: e.id, word, how: 'skip', turn: me.id }); return; }
    me.acted.add(si); lastId = e.id; if (e.big) lastBigTurn = me.id;
    if (how === 'word') {
      const when = timeOfWord(me, k), next = sentences(me.text)[si + 1];
      const nextAt = next ? timeOfWord(me, next.from) : null;
      // his voice for this turn has already played out: only knowable once the turn is closed (while it streams, more audio comes)
      const over = me !== T && Math.max(when, now()) > me.startAt + me.audioMs + 100;
      if (over || late({ at: Math.max(when, now()), nextSentenceStartAt: nextAt })) {
        if (director && !me.idled && !over) { me.turnEnd.push({ e, si, word }); log.push({ id: e.id, word, how: 'deferred', turn: me.id }); }
        else log.push({ id: e.id, word, how: 'dropped', turn: me.id });
        return;
      }
      log.push({ id: e.id, word, how: 'plan', at: Math.round(when), turn: me.id });
      at(when, () => { if (T === me || done === me) fire(e, 'word', word, me); });
      return;
    }
    if (me.handled.has('end:' + si)) { me.turnEnd.push({ e, si, word }); return; }   // its sentence is already over: the end of his turn
    me.pending = me.pending || []; me.pending.push({ e, si, word });              // a mouth action: decided when its sentence ends
  }
  function sentenceDone(s, si) {
    const me = T, end = timeOfWord(me, s.from + s.n);
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
          T.handled.add(key); want(T, entry(m.id), si, s.from + m.index, m.word);
        }
        if (s.complete && !T.handled.has('end:' + si)) { T.handled.add('end:' + si); sentenceDone(s, si); }
      });
      if (onPick && clauseEnd(text, T.clauseWords, cfg)) { T.clauseWords = 0; onPick({ turn: T.id, said: text, recent: log.filter((x) => x.how === 'word' || x.how === 'pause').slice(-4).map((x) => x.id) }); }
    },
    // his turn's text is complete (Gemini's turnComplete); its mouth actions still wait for his voice to end
    final() { if (!T) return; this.caption(T.text + ' '); if (!T) return; const s = sentences(T.text), last = s[s.length - 1]; if (last && !T.handled.has('end:' + (s.length - 1))) { T.handled.add('end:' + (s.length - 1)); sentenceDone(last, s.length - 1); } done = T; T = null; if (!player.playing()) this.idle(); },   // his voice may have ended first
    // his voice has run out: the turn's waiting mouth actions play now
    idle() { const d = done; if (!d) return; d.idled = true; setTimeout(() => { if (!alive || done !== d) return; for (const p of d.turnEnd.splice(0)) fire(p.e, 'pause', p.word, d); }, 0); },
    // cut off: everything planned for this turn is dropped
    interrupted() { clearAll(); T = null; done = null; log.push({ how: 'cut', at: Math.round(now()), turn }); },
    learnerTurn() { if (done) done.turnEnd.length = 0; },
    stop() { alive = false; clearAll(); T = null; done = null; },
    // a director pick lands through the same rules as a word match; an answer for another turn, or after his voice ended, is dropped
    apply(pick) {
      if (!alive || !pick || !pick.action) return;
      const me = T && T.id === pick.turn ? T : done && done.id === pick.turn && !done.idled ? done : null;
      if (!me) { log.push({ id: pick.action, word: pick.word || '', how: 'dropped', turn: pick.turn }); return; }
      let e = entry(pick.action); if (!e || e.talk === false) return;
      if (e.id === lastId) e = variant(e.family, { lastId }, catalog) || e;             // the family's idea, another of its actions
      const all = sentences(me.text), w = (pick.word || '').toLowerCase().replace(/[^\p{L}'ʻ]/gu, '');
      let si = all.length - 1, k = wordsOf(me.text).length - 1;                       // no usable word: now
      for (let i = all.length - 1; i >= 0 && w; i--) {
        const idx = wordsOf(all[i].text).findIndex((x) => x.toLowerCase().replace(/[^\p{L}'ʻ]/gu, '') === w);
        if (idx >= 0) { si = i; k = all[i].from + idx; break; }
      }
      if (si < 0) return;
      want(me, e, si, Math.max(0, k), pick.word || '', true);
    },
    turnId: () => (T ? T.id : null),
  };
}
