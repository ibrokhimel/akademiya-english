// node --test src/speak-lab/actions/rules.test.js   (the action engine's pure rules, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from './catalog.js';
import { matchWords, clauseEnd, entry } from './rules.js';

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
