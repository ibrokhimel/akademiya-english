// node --test src/speak-lab/actions/rules.test.js   (the action engine's pure rules, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry, decide, variant, wordTime, pauseTime, late, livePick, nextLifeMs } from './rules.js';

test('every catalog entry fires something the rig has', () => {
  const RIG = { trigger: ['eat', 'dizzy', 'shook', 'clap', 'hop', 'land', 'smug', 'snap', 'ahem', 'wake', 'poke1', 'poke2', 'poke3', 'playoff', 'trickSpin', 'trickFlick', 'trickShades', 'grow', 'dress', 'celebrate', 'correct', 'wrong', 'tapped', 'blink', 'lookAround', 'weightShift', 'idleHop', 'leanBack', 'nod', 'spit', 'dance', 'facepalm', 'fistsUp', 'eyeRoll', 'shrug', 'headScratch', 'armsCrossed', 'fingerWag', 'flex', 'brushShoulders', 'stomp', 'bow', 'melt'],
    play: ['none', 'held', 'walk', 'pet', 'peek', 'warm', 'sleep', 'wind', 'highfive', 'back'], gesture: ['wave', 'celebrate', 'thinking', 'point'],
    mood: ['smirk', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'wink', 'proud', 'focus', 'confused', 'oops', ...['sideEye','deadpan','grin','suspicious','cringe','disgusted','shocked','awkward','cryLaugh','bored']] };
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

test('decide: one per sentence, no repeats, big ones rare, mouth ones wait', () => {
  const c = { BIG_EVERY_TURNS: 3 };
  assert.equal(decide({ e: entry('dizzy'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'word');
  assert.equal(decide({ e: entry('dizzy'), actedThisSentence: true, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'skip');
  assert.equal(decide({ e: entry('dizzy'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: 'dizzy' }, c), 'skip');
  assert.equal(decide({ e: entry('celebrate'), actedThisSentence: false, turn: 5, lastBigTurn: 4, lastId: '' }, c), 'skip');
  assert.equal(decide({ e: entry('celebrate'), actedThisSentence: false, turn: 7, lastBigTurn: 4, lastId: '' }, c), 'word');
  assert.equal(decide({ e: entry('celebrate'), actedThisSentence: false, turn: 7, lastBigTurn: 0, lastId: '', reduce: true }, c), 'skip');
  assert.equal(decide({ e: entry('eat'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'pause');
  assert.equal(decide({ e: entry('tapped'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'skip');
});
test('variant never repeats the last one and never picks touch-only', () => {
  for (let i = 0; i < 50; i++) assert.notEqual(variant('show-off', { lastId: 'trickSpin', rand: Math.random }, CATALOG).id, 'trickSpin');
  assert.equal(variant('touch', { lastId: '', rand: Math.random }, CATALOG), null);
});
test('wordTime spreads words evenly over the audio so far', () => {
  assert.equal(wordTime({ turnStartAt: 1000, turnAudioMs: 2000, k: 2, n: 4, offsetMs: 0 }), 2000);
  assert.equal(wordTime({ turnStartAt: 1000, turnAudioMs: 2000, k: 2, n: 4, offsetMs: 30 }), 2030);
});
test('pauseTime waits for the turn end when the next sentence is already coming', () => {
  assert.equal(pauseTime({ sentenceEndAt: 3000, moreTextAfter: false, cfg: { MOUTH_AFTER_MS: 250 } }), 3250);
  assert.equal(pauseTime({ sentenceEndAt: 3000, moreTextAfter: true, cfg: { MOUTH_AFTER_MS: 250 } }), 'turn-end');
});
test('late once his next sentence has started', () => {
  assert.equal(late({ at: 5000, nextSentenceStartAt: 4800 }), true);
  assert.equal(late({ at: 4700, nextSentenceStartAt: 4800 }), false);
  assert.equal(late({ at: 4700, nextSentenceStartAt: null }), false);
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

// the engine itself, with a fake Dombi and player: a word near the end of a turn that is still streaming must not count as late
import { makeActing } from './engine.js';
test('an action on his last word is planned while his turn is still coming in, even with the caption-lead offset', () => {
  let clock = 1000; const fired = [];
  const player = { endsAt: () => clock + 3000, pushedMs: () => 3000, playing: () => true };
  const a = makeActing({ dombi: { fire: (rig) => fired.push(rig) }, player, now: () => clock, cfg: { ACT_OFFSET_MS: 590, BIG_EVERY_TURNS: 3, MOUTH_AFTER_MS: 250, CLAUSE_WORDS: 8 } });
  a.audio(3000); a.caption('Honestly the driver was so rude, seriously.');
  const L = a.log.filter((x) => x.id === 'poke2');
  assert.equal(L.length && L[0].how, 'plan', JSON.stringify(a.log));
  a.stop();
});

// final review fixes: a fake player whose clock and queue the test controls
function rig(cfg = {}) {
  const st = { clock: 1000, pushed: 0, queueEnd: 1000 }, fired = [];
  const player = { endsAt: () => Math.max(st.clock, st.queueEnd), pushedMs: () => st.pushed, playing: () => st.queueEnd > st.clock };
  const push = (ms) => { st.queueEnd = Math.max(st.clock, st.queueEnd) + ms; st.pushed += ms; };
  const a = makeActing({ dombi: { fire: (r) => fired.push(r) }, player, now: () => st.clock, cfg: { ACT_OFFSET_MS: 590, BIG_EVERY_TURNS: 3, MOUTH_AFTER_MS: 250, CLAUSE_WORDS: 8, ...cfg } });
  return { st, a, push, fired };
}
test('a director pick on the last word of a closed turn still plays while his voice is playing', () => {
  const { st, a, push } = rig();
  push(3000); a.audio(3000); a.caption('That was a nice little thing, you know.'); st.clock += 200; a.final();
  st.clock += 600; a.apply({ turn: 1, action: 'smug', word: 'know' });               // 2.2 s of his voice still to come
  assert.equal(a.log.filter((x) => x.id === 'smug').map((x) => x.how).join(), 'plan', JSON.stringify(a.log));
  a.stop();
});
test('a caption that arrives before its audio does not take the whole talk\'s audio as the turn\'s', () => {
  const { st, a, push } = rig({ ACT_OFFSET_MS: 0 });
  push(20000); a.audio(20000); a.caption('Long first turn.'); a.final(); st.clock += 21000;   // a 20 s first turn, played out
  a.caption('Okay so I am');                                                                  // turn 2: caption first...
  push(1500); a.audio(1500); a.caption('Okay so I am so dizzy, honestly.');                      // ...then its audio
  const plan = a.log.find((x) => x.id === 'dizzy' && x.how === 'plan');
  assert.ok(plan && plan.at - st.clock < 1500, `dizzy planned ${plan ? plan.at - st.clock : '?'} ms ahead`);
  a.stop();
});
