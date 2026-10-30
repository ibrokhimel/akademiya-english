// node --test src/speak-lab/actions/rules.test.js   (the action engine's pure rules, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry, variant, livePick, nextLifeMs, beatOk, holdEnd, talkBeats } from './rules.js';
import { makeClock } from '../clock.js';
import { makeActing } from './engine.js';

test('every catalog entry fires something the rig has', () => {
  const RIG = { trigger: ['eat', 'dizzy', 'shook', 'clap', 'hop', 'land', 'smug', 'snap', 'ahem', 'wake', 'poke1', 'poke2', 'poke3', 'playoff', 'trickSpin', 'trickFlick', 'trickShades', 'grow', 'dress', 'celebrate', 'correct', 'wrong', 'tapped', 'blink', 'lookAround', 'weightShift', 'idleHop', 'leanBack', 'nod', 'spit', 'dance', 'facepalm', 'fistsUp', 'eyeRoll', 'shrug', 'headScratch', 'armsCrossed', 'fingerWag', 'flex', 'brushShoulders', 'stomp', 'bow', 'melt', 'micDrop', 'idea', 'steam', 'sweat', 'chefKiss', 'hideFace', 'laughHard', 'flop', 'whisper', 'salute', 'fingerGuns', 'applause', 'headbang', 'sneeze', 'hiccup', 'yawn', 'shiver', 'phoneScroll', 'teaSip', 'kickBall', 'impatient', 'pointLaugh', 'boo', 'headShake', 'slide', 'drumroll', 'gasp', 'byeBye', 'doubleJump', 'roll', 'bounceBall', 'squash', 'stretchTall', 'wobbleJelly', 'peekSide', 'sneakyLook', 'karate', 'boxing', 'doubleFlex', 'ohNo', 'cheer', 'wiggleDance', 'robotDance', 'chinRub', 'callMe', 'cantHear', 'shush', 'yesYes', 'rofl', 'faint', 'runAway', 'startled', 'bubbleGum', 'readBook', 'writeNote', 'trophy', 'gift', 'magnify', 'dozeOff', 'bigStretch', 'airGuitar', 'mindBlown'],
    play: ['none', 'held', 'walk', 'pet', 'peek', 'warm', 'sleep', 'wind', 'highfive', 'back'], gesture: ['wave', 'celebrate', 'thinking', 'point'],
    mood: ['smirk', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'wink', 'proud', 'focus', 'confused', 'oops', ...['sideEye','deadpan','grin','suspicious','cringe','disgusted','shocked','awkward','cryLaugh','bored', 'hmph', 'squint', 'innocent', 'excited', 'speechless', 'nervousGrin', 'content', 'thinkingHard', 'angry', 'smugFace', 'worried', 'woozy', 'tired', 'delighted', 'judging', 'flirty', 'cocky', 'scared', 'puzzled', 'hungry', 'dreamy', 'serious', 'evilLaugh']] };
  for (const e of CATALOG) e.rig.trigger ? assert.ok(RIG.trigger.includes(e.rig.trigger), e.id) : assert.ok(RIG[e.rig.enum].includes(e.rig.value), e.id);
  assert.equal(new Set(CATALOG.map((e) => e.id)).size, CATALOG.length);
  for (const id of ['play:held', 'play:pet', 'play:wind', 'play:back', 'tapped', 'poke1']) assert.equal(entry(id).talk, false, id);
});
test('matchWords finds food and dizziness, whole words only, across pieces', () => {
  assert.deepEqual(matchWords('Chorsu samsa is the best', CATALOG).map((m) => [m.id, m.word]), [['eat', 'samsa']]);
  assert.deepEqual(matchWords('I am still dizzy', CATALOG).map((m) => m.id), ['dizzy']);
  assert.deepEqual(matchWords('samsara', CATALOG), []);
  assert.deepEqual(matchWords('Plov yeymiz', CATALOG).map((m) => m.id), ['eat']);
  assert.equal(matchWords('I am still dizzy', CATALOG)[0].index, 3);
});
test('clauseEnd at punctuation or after CLAUSE_WORDS words', () => {
  assert.equal(clauseEnd('Chorsu samsa is the best,', 5, { CLAUSE_WORDS: 8 }), true);
  assert.equal(clauseEnd('Chorsu samsa is', 3, { CLAUSE_WORDS: 8 }), false);
  assert.equal(clauseEnd('one two three four five six seven eight', 8, { CLAUSE_WORDS: 8 }), true);
});

test('variant never repeats the last one and never picks touch-only', () => {
  for (let i = 0; i < 50; i++) assert.notEqual(variant('show-off', { lastId: 'trickSpin', rand: Math.random }, CATALOG).id, 'trickSpin');
  assert.equal(variant('touch', { lastId: '', rand: Math.random }, CATALOG), null);
});
// a seeded random, so the weight tests are the same every run
const seeded = (s = 7) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const C = { TRAVEL_WEIGHT: 2 };
test('livePick while listening: listening moves only, no travel, nothing big, never the last one', () => {
  const rand = seeded();
  for (let i = 0; i < 500; i++) {
    const p = livePick({ state: 'listening', pack: 'kind', lastId: 'nod', reduce: false, rand }, CATALOG, C);
    assert.ok(p && !p.travel, 'no travel while they talk'); assert.ok(p.life.listening > 0 && !p.big && p.talk !== false && p.id !== 'nod', p.id);
  }
});
test('livePick idle: travel happens, but never with Reduce Motion', () => {
  const rand = seeded(11); let travel = 0, travelReduce = 0, big = 0;
  for (let i = 0; i < 500; i++) { if ((livePick({ state: 'idle', pack: 'kind', lastId: '', reduce: false, rand }, CATALOG, C) || {}).travel) travel++; }
  for (let i = 0; i < 500; i++) { const p = livePick({ state: 'idle', pack: 'kind', lastId: '', reduce: true, rand }, CATALOG, C) || {}; if (p.travel) travelReduce++; if (p.big) big++; }
  assert.ok(travel > 20, `travel ${travel}`); assert.equal(travelReduce, 0); assert.equal(big, 0);
});
test('livePick: Dangasa falls asleep more often than Kind', () => {
  const count = (pack) => { const rand = seeded(3); let n = 0; for (let i = 0; i < 2000; i++) if ((livePick({ state: 'idle', pack, lastId: '', reduce: false, rand }, CATALOG, C) || {}).id === 'play:sleep') n++; return n; };
  assert.ok(count('dangasa') > count('kind') * 3, `${count('dangasa')} vs ${count('kind')}`);
});
test('nextLifeMs stays in its window, doubled with Reduce Motion', () => {
  const c = { LIFE_MIN_MS: 3000, LIFE_MAX_MS: 8000 };
  for (let i = 0; i < 100; i++) { const t = nextLifeMs({ reduce: false, rand: Math.random }, c); assert.ok(t >= 3000 && t <= 8000); }
  assert.equal(nextLifeMs({ reduce: true, rand: () => 0 }, c), 6000);
});

// beats (spec 2026-10-30 in-sync §4.4): spacing, how many in a sentence, no repeats, big ones rare, mouth ones wait for a pause
const B = { BEAT_GAP_MS: 700, BEATS_PER_SENTENCE: 3, BIG_EVERY_TURNS: 3, HOLD_TAIL_MS: 300, HOLD_CAP_MS: 10000, HOLD_MIN_MS: 800 };
test('beatOk: three beats in a sentence, the fourth skipped; starts 500 ms apart skip, 700 go', () => {
  const base = { e: entry('dizzy'), at: 5000, starts: [], inSentence: 0, lastId: '', turn: 5, lastBigTurn: -99 };
  assert.equal(beatOk(base, B), 'go');
  assert.equal(beatOk({ ...base, inSentence: 3 }, B), 'skip');
  assert.equal(beatOk({ ...base, starts: [4500] }, B), 'skip');
  assert.equal(beatOk({ ...base, starts: [4300] }, B), 'go');
  assert.equal(beatOk({ ...base, lastId: 'dizzy' }, B), 'skip');
  assert.equal(beatOk({ ...base, e: entry('celebrate'), lastBigTurn: 4 }, B), 'skip');
  assert.equal(beatOk({ ...base, e: entry('celebrate'), reduce: true }, B), 'skip');
  assert.equal(beatOk({ ...base, e: entry('eat') }, B), 'pause');
  assert.equal(beatOk({ ...base, e: entry('tapped') }, B), 'skip');
});

const weigh = (w, p = '') => w.length * 60 + (/[.!?…]/.test(p) ? 420 : /[,;:]/.test(p) ? 220 : 0);
test('holdEnd: the sentence end, a word end, a topic to his voice end + 300, never past 10 s, never under 800 ms', () => {
  const c = makeClock({ weigh }); c.start(0); c.text('It is so cold here. And then'); c.audio(5000);
  assert.equal(holdEnd({ until: 'sentence', k: 1, clock: c, startedAt: 0 }, B), c.endOf(4));
  assert.equal(holdEnd({ until: 'sentence', k: 5, clock: c, startedAt: 2000 }, B), 12000);         // its sentence is still coming: only the cap
  assert.equal(holdEnd({ until: 'word', k: 3, clock: c, startedAt: 100 }, B), Math.max(c.endOf(3), 900));
  assert.equal(holdEnd({ until: 'topic', k: 1, clock: c, startedAt: 100 }, B), 10100);
  assert.equal(holdEnd({ until: 'topic', k: 1, clock: c, startedAt: 100, voiceEndAt: 4000 }, B), 4300);
  assert.equal(holdEnd({ until: 'topic', k: 1, clock: c, startedAt: 100, voiceEndAt: 40000 }, B), 10100);
  assert.equal(holdEnd({ until: 'word', k: 0, clock: c, startedAt: 0 }, B), 800);
});

test('livePick returns nothing while he talks: beats and talking motion are his only motion then', () => {
  for (let i = 0; i < 30; i++) assert.equal(livePick({ state: 'talking', pack: 'funny', rand: Math.random }, CATALOG, { TRAVEL_WEIGHT: 2 }), null);
});

// the beat engine on a real word clock, a fake Dombi that records holds, and a clock the test moves (tick by tick)
function stage(cfg = {}) {
  const st = { t: 0 }, ops = [], clocks = [];
  const dombi = {
    hold: (rig, holdable) => { const h = { id: rig.trigger || rig.value, holdable, face: rig.enum === 'mood' }; ops.push({ t: st.t, op: 'hold', id: h.id, face: h.face }); return h; },
    release: (h) => { if (h) ops.push({ t: st.t, op: 'release', id: h.id, face: h.face }); },
    fire: (rig) => ops.push({ t: st.t, op: 'fire', id: rig.trigger || rig.value }), talkingOff: () => {}, beat: () => ops.push({ t: st.t, op: 'beat' }),
  };
  const say = (text, audioMs) => { const c = makeClock({ weigh }); c.start(st.t); c.text(text); c.audio(audioMs); clocks.push(c); return c; };
  const a = makeActing({ dombi, clock: () => clocks[clocks.length - 1] || null, now: () => st.t, manual: true,
    cfg: { CLAUSE_WORDS: 8, MOUTH_AFTER_MS: 250, ...B, ...cfg } });
  const run = (ms) => { for (const end = st.t + ms; st.t < end; st.t += 20) a.tick(); };
  const held = (id) => { const h = ops.find((o) => o.op === 'hold' && o.id === id), r = ops.find((o) => o.op === 'release' && o.id === id && (!h || o.t >= h.t)); return { from: h && h.t, to: r && r.t }; };
  return { st, a, say, run, held, ops };
}

test('engine: a word-list shiver holds from its word to the end of its sentence', () => {
  const { a, say, run, held } = stage();
  const c = say('Well, winter is here and everything is grey. Anyway.', 6000); a.caption('Well, winter is here and everything is grey. Anyway.');
  run(6000);
  const h = held('shiver');
  assert.ok(h.from != null && Math.abs(h.from - c.startOf(1)) <= 20, JSON.stringify(h) + ' start ' + c.startOf(1));
  assert.ok(h.to != null && Math.abs(h.to - c.endOf(7)) <= 20, JSON.stringify(h) + ' end ' + c.endOf(7));
  a.stop();
});

test('engine: a director topic hold carries into the next sentence and ends when a new move beat starts', () => {
  const { a, say, run, held } = stage();
  const text = 'This party is crazy. Everybody is here tonight. Then I go home.';
  const c = say(text, 9000); a.caption(text);
  a.apply({ turn: a.turnId(), beats: [{ action: 'dance', word: 'party', until: 'topic' }], keep: true });
  a.apply({ turn: a.turnId(), beats: [{ action: 'trickSpin', word: 'Then', until: 'sentence' }], keep: true });
  run(9000);
  const d = held('dance');
  assert.ok(d.from != null && d.from < c.startOf(4) && d.to != null, JSON.stringify(d));
  assert.ok(d.to > c.endOf(3) + 300, 'the dance went on into the next sentence: ' + JSON.stringify(d));
  assert.ok(Math.abs(d.to - c.startOf(8)) <= 20, 'and ended when the trick started: ' + JSON.stringify(d) + ' ' + c.startOf(8));
  a.stop();
});

test('engine: keep:false ends a topic hold', () => {
  const { st, a, say, run, held } = stage();
  const text = 'This party is crazy, everybody came, honestly it is the best one yet.';
  say(text, 6000); a.caption(text);
  a.apply({ turn: a.turnId(), beats: [{ action: 'dance', word: 'party', until: 'topic' }], keep: true });
  run(1500); assert.ok(held('dance').from != null && held('dance').to == null);
  a.apply({ turn: a.turnId(), beats: [], keep: false }); run(60);
  assert.ok(held('dance').to != null && held('dance').to <= st.t, JSON.stringify(held('dance')));
  a.stop();
});

test('engine: interrupted() releases every hold at once', () => {
  const { st, a, say, run, held } = stage();
  const text = 'This party is crazy, and that DJ is the worst though.';
  say(text, 6000); a.caption(text);
  a.apply({ turn: a.turnId(), beats: [{ action: 'dance', word: 'party', until: 'topic' }, { action: 'mood:angry', word: 'worst', until: 'topic' }], keep: true });
  run(3000); assert.ok(held('dance').from != null && held('angry').from != null);
  const cutAt = st.t; a.interrupted();
  assert.equal(held('dance').to, cutAt); assert.equal(held('angry').to, cutAt);
  a.stop();
});

test('engine: a face beat and a move beat overlap, two move beats never do', () => {
  const { a, say, run, held, ops } = stage();
  const text = 'What, this party is crazy and that DJ is the worst, then a trick.';
  say(text, 8000); a.caption(text);
  a.apply({ turn: a.turnId(), beats: [{ action: 'dance', word: 'party', until: 'topic' }, { action: 'mood:angry', word: 'worst', until: 'sentence' }, { action: 'trickSpin', word: 'trick', until: 'sentence' }], keep: true });
  run(8000);
  const d = held('dance'), f = held('angry'), t = held('trickSpin');
  assert.ok(f.from > d.from && f.from < d.to, 'the face started while the dance held: ' + JSON.stringify({ d, f }));
  assert.ok(t.from >= d.to, 'the trick started only once the dance was released: ' + JSON.stringify({ d, t }));
  let moves = 0, most = 0; for (const o of ops) { if (o.face) continue; moves += o.op === 'hold' ? 1 : o.op === 'release' ? -1 : 0; most = Math.max(most, moves); }
  assert.equal(most, 1);
  a.stop();
});

test('engine: a mouth action waits for his voice to run out', () => {
  const { st, a, say, run, ops } = stage();
  const text = 'I could eat ten plov right now.';
  say(text, 3000); a.caption(text); a.final();
  run(2000); assert.ok(!ops.some((o) => o.id === 'eat'));
  a.idle(); run(100);
  assert.ok(ops.some((o) => o.id === 'eat' && o.t >= 2000), JSON.stringify(ops));
  a.stop();
});

// small talking motion (spec §4.7): on his longer words, spaced out, never while a move holds
test('talkBeats: longer than the line\'s median, TALK_BEAT_GAP_MS apart, none while a move holds, none for nothing', () => {
  const cfg = { TALK_BEAT_GAP_MS: 600 };
  const lens = [100, 400, 120, 380, 90, 420, 110, 400, 100, 450];
  let t = 0; const words = lens.map((d, k) => { const w = { k, start: t, end: t + d }; t += d + 30; return w; });
  const ks = talkBeats(words, { heldUntil: -Infinity, cfg });
  assert.ok(ks.length >= 2, JSON.stringify(ks));
  for (const k of ks) assert.ok(lens[k] > 250, `word ${k} is short`);
  for (let i = 1; i < ks.length; i++) assert.ok(words[ks[i]].start - words[ks[i - 1]].start >= 600);
  const held = talkBeats(words, { heldUntil: words[6].start, cfg });
  assert.ok(held.every((k) => words[k].start >= words[6].start), JSON.stringify(held));
  assert.deepEqual(talkBeats([], { heldUntil: -Infinity, cfg }), []);
});

test('engine: a talking beat on a long word when no move holds, none while a dance holds', () => {
  const { st, a, say, run, ops } = stage({ TALK_BEAT_GAP_MS: 600 });
  const text = 'Honestly yesterday everything happened unbelievably quickly, remember?';
  say(text, 6000); a.caption(text); run(6000);
  assert.ok(ops.filter((o) => o.op === 'beat').length >= 2, JSON.stringify(ops));
  a.stop();
  const s2 = stage({ TALK_BEAT_GAP_MS: 600 });
  const t2 = 'This party is crazy, everybody showed up dancing tremendously.';
  s2.say(t2, 6000); s2.a.caption(t2); s2.a.apply({ turn: s2.a.turnId(), beats: [{ action: 'dance', word: 'party', until: 'topic' }], keep: true });
  s2.run(6000);
  const d = s2.held('dance');
  assert.ok(!s2.ops.some((o) => o.op === 'beat' && o.t >= d.from && o.t < (d.to ?? Infinity)), JSON.stringify(s2.ops));
  s2.a.stop();
});
