// node --test src/speak-lab/actions/rules.test.js   (the action engine's pure rules, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry, decide, variant, wordTime, pauseTime, late } from './rules.js';

test('every catalog entry fires something the rig has', () => {
  const RIG = { trigger: ['eat', 'dizzy', 'shook', 'clap', 'hop', 'land', 'smug', 'snap', 'ahem', 'wake', 'poke1', 'poke2', 'poke3', 'playoff', 'trickSpin', 'trickFlick', 'trickShades', 'grow', 'dress', 'celebrate', 'correct', 'wrong', 'tapped', 'blink', 'lookAround', 'weightShift', 'idleHop', 'leanBack', 'nod'],
    play: ['none', 'held', 'walk', 'pet', 'peek', 'warm', 'sleep', 'wind', 'highfive', 'back'], gesture: ['wave', 'celebrate', 'thinking', 'point'],
    mood: ['smirk', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'wink', 'proud', 'focus', 'confused', 'oops'] };
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
