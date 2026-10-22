// node --test src/core/core.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { judge, judgeAny, plain, numberWords, tilesOf, sameTiles, slug, answerOf, voiceOf } from './text.js';
import { makeSession, spareTiles, mix } from './session.js';
import { progressOf, streakOf, dayOf } from './progress.js';

const content = (f) => JSON.parse(fs.readFileSync(new URL('../content/' + f, import.meta.url), 'utf8'));
const P = Object.fromEntries(content('phrases.json').phrases.map((p) => [p.id, p]));
const units = [1, 2, 3].map((n) => content(`unit-${n}.json`));

test('numbers a phone writes in digits are read as words', () => {
  assert.equal(numberWords(45000), 'forty five thousand'); assert.equal(numberWords(100), 'one hundred'); assert.equal(numberWords(17), 'seventeen');
  assert.deepEqual(plain("It's 10,000 som."), ['it', 'is', 'ten', 'thousand', 'som']);
  assert.deepEqual(plain('1 2 3 4 5'), ['one', 'two', 'three', 'four', 'five']);
  assert.deepEqual(plain('90 100'), ['ninety', 'one', 'hundred']);
  assert.deepEqual(plain('45 000 som'), ['forty', 'five', 'thousand', 'som']);
});
test('a phrase said right is right, however the phone spells it', () => {
  for (const [want, heard] of [['A coffee, please.', 'a coffee please'], ["I'm from Uzbekistan.", 'I am from Uzbekistan'], ["It's ten thousand som.", "it's 10000 sum"], ['A red T-shirt, please.', 'a red t shirt please'],
    ["That's forty-five thousand.", 'that is 45,000'], ['One, two, three, four, five.', '12345'.split('').join(' ')], ['Sixty, seventy, eighty, ninety, a hundred.', '60 70 80 90 100'], ["I'll take it.", 'I will take it'], ['Hi!', 'hey']])
    assert.equal(judge(want, heard).right, true, `${want} <- ${heard}`);
});
test('a name counts whatever the phone heard there', () => {
  assert.equal(judge("I'm Aziz.", "I'm as is", ['Aziz']).right, true);
  assert.equal(judge('My name is Malika.', 'my name is', ['Malika']).right, true);
  assert.equal(judge("I'd like a samsa, please.", "I'd like a some sir please", ['samsa']).right, true);
  assert.equal(judge("I'm Aziz.", 'Aziz', ['Aziz']).right, false);                       // the "I'm" is the lesson
});
test('a missing or wrong word is marked, word by word', () => {
  const r = judge('An orange juice, please.', 'a orange juice please');
  assert.equal(r.right, false); assert.deepEqual(r.words.map((w) => w.ok), [false, true, true, true]);
  assert.deepEqual(judge("I'm fine, thank you.", 'I fine thank you').words.map((w) => w.ok), [false, true, true, true]);
  assert.deepEqual(judge('How much is this?', 'how much this').words.map((w) => w.ok), [true, true, false, true]);
  assert.equal(judge('Hello!', '').right, false);
});
test('another right answer is accepted, and the words shown are that answer\'s', () => {
  const r = judgeAny(['A coffee, please.', 'Can I have a coffee?'], ['can I have a coffee', 'can I have coffee']);
  assert.equal(r.right, true); assert.equal(r.want, 'Can I have a coffee?');
  assert.equal(judgeAny(['A coffee, please.'], ['a tea please']).right, false);
});
test('short speech answers reject unrelated words and padded answers', () => {
  for (const heard of ['banana', 'yellow', 'hello banana', 'banana hello spaceship', 'hello hello'])
    assert.equal(judge('Hello!', heard).right, false, heard);
  assert.equal(judge('Good morning!', 'good evening').right, false);
  assert.equal(judge('Good morning!', 'morning').right, false);
  assert.equal(judge('Good morning!', 'good morning banana').right, false);
  assert.equal(judge('Hello!', 'HELLO.').right, true);
});
test('a lower-ranked speech hypothesis cannot override a different top result', () => {
  assert.equal(judgeAny(['Hello!'], ['yellow', 'hello']).right, false);
  assert.equal(judgeAny(['Hello!'], ['', 'hello']).right, false);
  assert.equal(judgeAny(['Hello!', 'Hi!'], ['hi', 'hello']).right, true);
});
test('every taught phrase is judged right when said as written, and as tiles', () => {
  for (const p of Object.values(P)) { assert.equal(judge(p.en, p.en, p.loose).right, true, p.en); assert.equal(sameTiles(tilesOf(p.en), p.en), true, p.en); }
  assert.deepEqual(tilesOf('A coffee, please.'), ['a', 'coffee', 'please']); assert.deepEqual(tilesOf("I'm Aziz."), ["I'm", 'Aziz']);
});
test('a lesson: missed items come back at the end until they are right', () => {
  const l = units[1].lessons[0], s = makeSession(l); let seen = 0;
  while (!s.startMistakes()) { const e = s.next(); assert.equal(e.round, 'lesson'); seen++; s.answer(e.n !== 4 && e.n !== 6); }      // items 5 and 7 are missed; the player asks startMistakes() before every next()
  assert.equal(seen, 12); assert.equal(s.startMistakes(), false);
  const a = s.next(); assert.equal(a.round, 'mistakes'); assert.equal(a.n, 4); s.answer(false);                   // missed again: it goes to the back
  assert.equal(s.next().n, 6); s.answer(true); assert.equal(s.next().n, 4); s.answer(true); assert.equal(s.next(), null);
  const st = s.stats(); assert.equal(st.mistakes, 2); assert.equal(st.accuracy, 83); assert.equal(st.perfect, false); assert.equal(st.progress, 1);
});
test('a perfect lesson, and speaking off', () => {
  const l = units[1].lessons[0], s = makeSession(l); for (let e; (e = s.next());) s.answer(true);
  assert.equal(s.stats().perfect, true); assert.equal(s.stats().bestCombo, 12); assert.equal(s.startMistakes(), false);
  const q = makeSession(l, { speaking: false }); let skipped = 0, tiles = 0;
  for (let e; (e = q.next());) { const way = q.way(e.item); if (way === 'skip') { q.skip(); skipped++; } else { if (way === 'tiles' && e.item.ex !== 'tiles') tiles++; q.answer(true); } }
  assert.equal(skipped, 3); assert.equal(tiles, 5); assert.equal(q.stats().progress, 1); assert.equal(q.stats().answered, 9);
});
test('three unverified speech attempts add no mistakes or completion credit', () => {
  const s = makeSession(units[0].lessons[0]);
  const first = s.next();
  for (let i = 0; i < 3; i++) s.retrySpeech();
  assert.equal(s.next(), first);
  assert.equal(s.stats().mistakes, 0);
  assert.equal(s.stats().speechRetries, 3);
  assert.equal(s.stats().answered, 0);
  assert.equal(s.stats().progress, 0);
  assert.equal(s.startMistakes(), false);
  s.answer(true);
  for (let item; (item = s.next());) s.answer(true);
  assert.equal(s.stats().mistakes, 0);
  assert.equal(s.stats().progress, 1);
  assert.equal(s.stats().perfect, false); // no claim of first-attempt perfection
});
test('speech retries survive resume separately from a real choice mistake', () => {
  const lesson = units[0].lessons[0], original = makeSession(lesson);
  original.next(); original.retrySpeech(); original.retrySpeech(); original.answer(true);
  original.next(); original.answer(false);
  const restored = makeSession(lesson);
  for (const op of ['v', 'v', 'r', 'w']) {
    restored.startMistakes(); restored.next();
    if (op === 'v') restored.retrySpeech(); else restored.answer(op === 'r');
  }
  assert.deepEqual(restored.stats(), original.stats());
  assert.equal(restored.stats().mistakes, 1);
  assert.equal(restored.stats().speechRetries, 2);
  assert.equal(restored.next().n, 2);
});
test('every item of every lesson has an answer, a voice and a clip name', () => {
  for (const u of units) for (const l of [...u.lessons, u.checkpoint]) for (const it of l.items) { if (it.ex === 'heard') continue;
    assert.ok(answerOf(it, P), l.id); assert.ok(['aziz', 'malika', 'waiter', 'seller'].includes(voiceOf(it, P))); assert.ok(slug(answerOf(it, P))); }
});
test('spare tiles are not part of the answer and stay the same', () => {
  const a = spareTiles(['a', 'coffee', 'please'], ['A tea, please.', 'An orange juice, please.']);
  assert.equal(a.length, 2); assert.ok(a.every((w) => !['a', 'coffee', 'please'].includes(w)));
  assert.deepEqual(a, spareTiles(['a', 'coffee', 'please'], ['A tea, please.', 'An orange juice, please.']));
  assert.deepEqual(mix([1, 2, 3, 4, 5], 7), mix([1, 2, 3, 4, 5], 7)); assert.equal(mix([1, 2, 3, 4, 5], 7).length, 5);
});

// lessons on these days (local time, noon); "now" is Wednesday 2026-10-14
const on = (...days) => days.map((d, i) => ({ type: 'lesson', id: 'l' + (i + 1), at: new Date(d + 'T12:00:00').toISOString() }));
const NOW = new Date('2026-10-14T18:00:00');
test('lessons open one after another, the checkpoint after the five lessons, the next unit after the checkpoint', () => {
  const ids = (n) => units.flatMap((u) => [...u.lessons, u.checkpoint]).slice(0, n).map((l) => ({ type: 'lesson', id: l.id, at: NOW.toISOString() }));
  let p = progressOf(units, [], { now: NOW });
  assert.equal(p.current, 'l1'); assert.equal(p.state('l1'), 'cur'); assert.equal(p.state('l2'), 'locked'); assert.equal(p.open('l2'), false); assert.equal(p.phrases, 0); assert.equal(p.level, 0);
  p = progressOf(units, ids(5), { now: NOW }); assert.equal(p.current, 'c1'); assert.equal(p.state('l6'), 'locked'); assert.equal(p.unit, 1);
  p = progressOf(units, ids(6), { now: NOW }); assert.equal(p.current, 'l6'); assert.equal(p.unit, 2); assert.equal(p.phrases, 15);
  p = progressOf(units, ids(18), { now: NOW }); assert.equal(p.current, null); assert.equal(p.level, 1); assert.equal(p.unit, 3); assert.equal(p.phrases, 49);
  assert.equal(progressOf(units, [], { now: NOW, openAll: true }).open('c3'), true);
});
test('the streak counts days in a row, today stays alive until it is over, one freeze a week covers a missed day', () => {
  assert.equal(dayOf(new Date('2026-10-14T23:30:00')), '2026-10-14');
  assert.deepEqual([streakOf([], NOW).count, streakOf([], NOW).today], [0, false]);
  let s = streakOf(on('2026-10-12', '2026-10-13', '2026-10-14'), NOW); assert.equal(s.count, 3); assert.equal(s.today, true);
  s = streakOf(on('2026-10-12', '2026-10-13'), NOW); assert.equal(s.count, 2); assert.equal(s.today, false);
  assert.deepEqual(s.week.map((d) => d.state), ['none', 'done', 'done', 'today', 'none', 'none', 'none']);       // Sunday first
  s = streakOf(on('2026-10-11', '2026-10-13', '2026-10-14'), NOW); assert.equal(s.count, 3); assert.deepEqual([...s.frozen], ['2026-10-12']);
  s = streakOf(on('2026-10-10', '2026-10-13', '2026-10-14'), NOW); assert.equal(s.count, 2);                        // two missed days in one week: the second breaks it
  s = streakOf(on('2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-12', '2026-10-13'), NOW);
  assert.equal(s.count, 9); assert.deepEqual([...s.frozen].sort(), ['2026-10-04', '2026-10-11']);                   // one freeze in each week
  assert.equal(streakOf(on('2026-10-11'), NOW).count, 0);                                                            // Monday and Tuesday missed: gone
  assert.equal(streakOf(on('2026-10-12'), NOW).count, 1); assert.equal(streakOf(on('2026-10-12'), NOW).frozen.size, 1);
  s = streakOf(on('2026-10-11', '2026-10-13', '2026-10-15'), new Date('2026-10-16T18:00:00'));                         // the freeze went on Monday, so missing Wednesday too starts again
  assert.equal(s.count, 1); assert.equal(s.frozen.size, 0);
});
