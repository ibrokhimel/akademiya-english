// The acting engine (spec 2026-10-30 in-sync §4.4-4.5): his words -> beats of catalog actions on the word clock. A beat
// starts on its word and is held until a word, its sentence or its topic ends; a face and a move can hold together, a new
// move replaces the held one. Word-list matches are placed at once, the director's plan for a clause a moment later.
// makeActing({ dombi, clock, cfg, catalog?, now?, reduce?, onPick?, stage?, manual? }) ->
//   { audio(), caption(text), final(), idle(), interrupted(), learnerTurn(), stop(), apply(plan), tick(), turnId(), log }
// `clock()` returns his current turn's word clock (a new clock = a new turn). Nothing here is awaited on the audio path:
// a light tick (every 40 ms, or the test's own) starts and ends beats against the clock.
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry, beatOk, holdEnd, variant, FAMILY_FACE, talkBeats } from './rules.js';

const LATE_MS = 400, RANK = { word: 0, sentence: 1, topic: 2 };
const norm = (w) => (w || '').toLowerCase().replace(/[^\p{L}\p{N}'ʻ]/gu, '');

export function makeActing({ dombi, clock: getClock, cfg, catalog = CATALOG, now = () => performance.now(), reduce = false, onPick = null, stage = null, manual = false }) {
  const log = [], holds = { move: null, face: null };                      // a hold: { beat, turn, handle }
  let alive = true, turnN = 0, lastBigTurn = -99, lastId = '', T = null, done = null, movingUntil = -Infinity, lastBeatK = -1, lastBeatTurn = null;
  const ticker = manual ? null : setInterval(() => tick(), 40);

  const newTurn = (c) => ({ id: ++turnN, clock: c, text: '', beats: [], handled: new Set(), starts: [], perSentence: new Map(), asks: [],
    clauseFrom: 0, clauseWords: 0, final: false, idled: false, voiceOut: false, voiceEndAt: Infinity, turnEnd: [], used: new Set() });
  function current() {                                                      // a new clock of his is a new turn
    const c = getClock(); if (!c) return T;
    if (!T || T.clock !== c) { if (T) { T.voiceEndAt = Math.min(T.voiceEndAt, now()); done = T; } T = newTurn(c); }
    return T;
  }
  const textOf = (ws) => ws.map((w) => w.text + w.punct).join(' ');
  // where a word of the director's plan is: its last place in the clause it planned, else in the whole turn; null = "now"
  function findWord(me, word, ask, after = -1) {
    const w = norm(word), ws = me.clock.words(); if (!w) return null;
    for (const [from, to] of [[ask.from, ask.to], [0, ws.length]]) for (let k = Math.min(to, ws.length) - 1; k >= Math.max(from, after); k--) if (norm(ws[k].text) === w) return k;
    return null;
  }

  function place(me, e, k, until, untilK, word, source) {
    if (!e || e.talk === false) return;
    // the same action already planned on the same word (the word list, then the director): one beat, the longer hold
    const same = me.beats.find((b) => b.e.id === e.id && b.k === k && b.status !== 'done');
    if (same) { if (RANK[until] > RANK[same.until]) { same.until = until; same.untilK = untilK; } return; }
    // never the same action twice in one turn: a word-list repeat is skipped, the director gets another of the family
    if (e.id === lastId || me.used.has(e.id)) { if (source !== 'director') { log.push({ id: e.id, word, how: 'skip', turn: me.id }); return; } e = variant(e.family, { lastId }, catalog) || e; }
    const c = me.clock, st = k == null ? now() : c.startOf(k) ?? now(), si = k == null ? Math.max(0, c.sentences().length - 1) : c.sentenceOf(k);
    if (st < now() - LATE_MS && !e.mouth) { log.push({ id: e.id, word, how: 'dropped', turn: me.id }); return; }   // its word is long gone
    const how = beatOk({ e, at: st, starts: me.starts, inSentence: me.perSentence.get(si) || 0, lastId, turn: me.id, lastBigTurn, reduce }, cfg);
    if (how === 'skip') { log.push({ id: e.id, word, how: 'skip', turn: me.id }); return; }
    me.perSentence.set(si, (me.perSentence.get(si) || 0) + 1); me.starts.push(st); me.used.add(e.id); lastId = e.id; if (e.big) lastBigTurn = me.id;
    if (how === 'pause') { me.turnEnd.push({ e, word }); log.push({ id: e.id, word, how: 'plan', at: Math.round(st), turn: me.id }); return; }
    me.beats.push({ e, k, until, untilK, word, source, status: 'wait', placedAt: now() });
    log.push({ id: e.id, word, how: 'plan', at: Math.round(st), until, turn: me.id });
  }

  function start(me, b, t) {
    b.status = 'on'; b.startedAt = t; if (b.k == null) b.k = Math.max(0, me.clock.wordAt(t));
    const face = b.e.rig.enum === 'mood', kind = face ? 'face' : 'move';
    release(kind, t);
    holds[kind] = { beat: b, turn: me, handle: dombi.hold(b.e.rig, !!b.e.hold) };
    if (!face) movingUntil = b.e.hold ? Infinity : t + b.e.ms;            // a once-move is over after its own length
    if (stage) { stage.pause(); b.paused = true; }
    log.push({ id: b.e.id, word: b.word, how: 'word', at: Math.round(t), turnStartAt: Math.round(me.clock.startOf(0) ?? t), until: b.until, turn: me.id });
    // a move that cannot hold yet plays once and leaves its family's face on him for the rest of the beat, unless a face was planned
    const f = !face && !b.e.hold && FAMILY_FACE[b.e.family];
    if (f && !(holds.face && holds.face.beat.source !== 'family')) {
      release('face', t);
      holds.face = { beat: { ...b, e: { id: 'mood:' + f, rig: { enum: 'mood', value: f } }, source: 'family', paused: false }, turn: me, handle: dombi.hold({ enum: 'mood', value: f }, false) };
    }
  }
  function release(kind, t) {
    const h = holds[kind]; if (!h) return; holds[kind] = null; h.beat.status = 'done'; if (kind === 'move') movingUntil = Math.min(movingUntil, t);
    dombi.release(h.handle);
    if (h.beat.paused && stage) stage.resume();
    log.push({ id: h.beat.e.id, how: 'released', at: Math.round(t), turn: h.turn.id });
  }

  function tick() {
    if (!alive) return; const t = now();
    for (const me of [done, T]) if (me) for (const b of me.beats) {
      if (b.status !== 'wait') continue;
      const st = b.k == null ? b.placedAt : me.clock.startOf(b.k);
      if (st != null && t >= st) start(me, b, t);
    }
    for (const kind of ['move', 'face']) {
      const h = holds[kind]; if (!h) continue; const b = h.beat;
      const end = holdEnd({ until: b.until, k: b.until === 'word' && b.untilK != null ? b.untilK : b.k, clock: h.turn.clock, voiceEndAt: h.turn.voiceEndAt, startedAt: b.startedAt }, cfg);
      if (t >= end) release(kind, t);
    }
    // small talking motion between beats: a nod / tilt / bob as one of his longer words starts, while no move is on
    if (T && dombi.beat && t >= movingUntil) {
      const k = T.clock.wordAt(t);
      if (lastBeatTurn !== T) { lastBeatTurn = T; lastBeatK = -1; }
      if (k > lastBeatK && talkBeats(T.clock.words(), { cfg }).includes(k)) { lastBeatK = k; dombi.beat(); log.push({ how: 'talkBeat', k, at: Math.round(t), turn: T.id }); }
    }
  }
  const releaseAll = () => { const t = now(); release('move', t); release('face', t); };

  return {
    log,
    tick,
    turnId: () => (T ? T.id : null),
    audio() { if (alive) { const me = current(); if (me) me.voiceOut = false; } },
    // his caption so far for this turn (already cleaned of tags; the clock has the same text)
    caption(text) {
      if (!alive) return; const me = current(); if (!me) return;
      const c = me.clock, ws = c.words(); me.clauseWords += Math.max(0, ws.length - (me.seen || 0)); me.seen = ws.length; me.text = text;
      c.sentences().forEach((s, si) => {
        for (const m of matchWords(textOf(ws.slice(s.from, s.from + s.n)), catalog)) {
          const key = si + ':' + m.id; if (me.handled.has(key)) continue;
          if (!s.complete && m.index === s.n - 1 && /[\p{L}'ʻ]$/u.test(text)) continue;   // the last word may still be arriving ("diz" -> "dizzy")
          me.handled.add(key); place(me, entry(m.id), s.from + m.index, 'sentence', null, m.word, 'words');
        }
      });
      if (onPick && clauseEnd(text, me.clauseWords, cfg) && ws.length > me.clauseFrom) {
        const ask = { from: me.clauseFrom, to: ws.length }; me.asks.push(ask); me.clauseFrom = ws.length; me.clauseWords = 0;
        onPick({ turn: me.id, said: textOf(ws.slice(ask.from, ask.to)), line: text, recent: log.filter((x) => x.how === 'word' || x.how === 'pause').slice(-4).map((x) => x.id) });
      }
    },
    // his turn's text is complete (Gemini's turnComplete): its last word counts as whole now; if his voice already ran out, the
    // turn ends here
    final() { if (!T) return; T.final = true; this.caption(T.text + ' '); if (T.voiceOut) this.idle(); },
    // his voice has run out: a finished turn's holds end (with a short tail) and its mouth actions play now
    idle() {
      const t = now(); if (T && !T.final) T.voiceOut = true;                  // more of his turn may still come (or its final)
      for (const me of [done, T]) {
        if (!me || !me.final || me.idled) continue; me.idled = true; me.voiceEndAt = Math.min(me.voiceEndAt, t);
        for (const p of me.turnEnd.splice(0)) { if (dombi.talkingOff) dombi.talkingOff(p.e.ms); dombi.fire(p.e.rig, p.e.ms); log.push({ id: p.e.id, word: p.word, how: 'pause', at: Math.round(t), turnStartAt: Math.round(me.clock.startOf(0) ?? t), turn: me.id }); }
      }
      if (manual) tick();
    },
    // cut off: every hold ends now and everything planned for this turn is dropped
    interrupted() { releaseAll(); T = null; done = null; log.push({ how: 'cut', at: Math.round(now()), turn: turnN }); },
    // the learner talks: a finished turn's waiting mouth actions are no longer wanted
    learnerTurn() { for (const me of [done, T]) if (me && me.final) me.turnEnd.length = 0; },
    stop() { releaseAll(); alive = false; if (ticker) clearInterval(ticker); T = null; done = null; },
    // the director's plan for a clause lands through the same rules as a word match; a plan for a turn whose voice ended is dropped
    apply(plan) {
      if (!alive || !plan) return;
      const me = [T, done].find((x) => x && x.id === plan.turn && !x.idled);
      if (!me) { for (const b of plan.beats || []) log.push({ id: b.action, word: b.word || '', how: 'dropped', turn: plan.turn }); return; }
      const ask = me.asks.shift() || { from: 0, to: me.clock.words().length };
      if (plan.keep === false) for (const kind of ['move', 'face']) if (holds[kind] && holds[kind].beat.until === 'topic') release(kind, now());
      for (const x of plan.beats || []) {
        const e = entry(x.action); if (!e || e.talk === false) continue;
        const k = findWord(me, x.word, ask), u = String(x.until || 'sentence');
        const until = u.startsWith('word:') ? 'word' : u === 'topic' ? 'topic' : 'sentence', untilK = until === 'word' ? findWord(me, u.slice(5), ask, k ?? 0) : null;
        place(me, e, k, until === 'word' && untilK == null ? 'sentence' : until, untilK, x.word || '', 'director');
      }
      if (manual) tick();
    },
  };
}
