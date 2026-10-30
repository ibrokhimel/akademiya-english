// node --test src/speak-lab/clock.test.js   (the word clock: when each of his words plays)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClock } from './clock.js';

// a stand-in for the lip-sync weights: 60 ms a letter, plus the pause after a comma or a full stop
const weigh = (w, p = '') => w.length * 60 + (/[.!?…]/.test(p) ? 420 : /[,;:]/.test(p) ? 220 : 0);
const near = (a, b, d = 1) => assert.ok(Math.abs(a - b) <= d, `${a} not within ${d} of ${b}`);

test('longer words get longer slots', () => {
  const c = makeClock({ weigh }); c.start(0); c.text('I am freezing.'); c.audio(2000);
  assert.ok(c.endOf(2) - c.startOf(2) > c.endOf(0) - c.startOf(0));
  assert.deepEqual(c.words().map((w) => w.text), ['I', 'am', 'freezing']);
});

test('a closed turn ends exactly with its sound', () => {
  const c = makeClock({ weigh }); c.start(1000); c.text('Hi there.'); c.audio(900); c.close();
  near(c.endOf(1), 1900); near(c.startOf(0), 1000);
});

test('text ahead of audio never moves the lit word backwards or past the sound', () => {
  const c = makeClock({ weigh }); c.start(0);
  c.text('I am so very cold today, and it is really bad out there.');
  let lastK = -1;
  for (let a = 200; a <= 4000; a += 200) {
    c.audio(a);
    for (let t = a - 200; t <= a; t += 20) {
      const k = c.wordAt(t);
      assert.ok(k >= lastK, `went back from ${lastK} to ${k} at ${t}`);
      assert.ok(k < 0 || c.startOf(k) <= Math.max(t, c.startOf(lastK < 0 ? 0 : lastK)), `word ${k} lit before it starts`);
      lastK = k;
    }
    if (a === 2000) c.text('I am so very cold today, and it is really bad out there. Brr.');
  }
  c.close();
  assert.ok(c.wordAt(4000) >= lastK);
});

test('audio ahead of text: the first word still starts with the sound', () => {
  const c = makeClock({ weigh }); c.start(500); c.audio(3000); c.text('Hello');
  near(c.startOf(0), 500);
});

test('a quiet gap re-anchors the next sentence, earlier words stay', () => {
  const c = makeClock({ weigh }); c.start(0); c.text('Hi there. How are you?'); c.audio(3000);
  const before = c.startOf(1), est = c.startOf(2);
  c.quiet(est - 300, est + 150);
  near(c.startOf(2), est + 150); near(c.startOf(1), before);
});

test('a quiet gap far from any pause is ignored', () => {
  const c = makeClock({ weigh }); c.start(0); c.text('Hi there. How are you?'); c.audio(3000);
  const est = c.startOf(2); c.quiet(est + 1500, est + 1700);
  near(c.startOf(2), est);
});

test('wordAt is -1 before the start and the last word after the end; nothing before start() is timed', () => {
  const c = makeClock({ weigh }); c.text('One two.');
  assert.equal(c.wordAt(100), -1);
  c.start(1000); c.audio(800); c.close();
  assert.equal(c.wordAt(999), -1); assert.equal(c.wordAt(5000), 1);
});

test('sentences and sentenceOf split at . ! ? only', () => {
  const c = makeClock({ weigh }); c.start(0); c.text('Wow, so cold! Brr. And');
  assert.deepEqual(c.sentences().map((s) => [s.from, s.n]), [[0, 3], [3, 1], [4, 1]]);
  assert.equal(c.sentenceOf(1), 0); assert.equal(c.sentenceOf(3), 1); assert.equal(c.sentenceOf(4), 2);
});

test('the measured rate of a closed turn carries to the next turn', () => {
  const a = makeClock({ weigh }); a.start(0); a.text('Hello there.'); a.audio(1200); a.close();   // 600 ms of words spoken in 1200: half speed
  near(a.rate(), 2, 0.01);
  const b = makeClock({ weigh, rate: a.rate() }); b.start(0); b.text('Hello again'); b.audio(5000);
  near(b.startOf(1), 600);
});

test('numbers count as words, emoji and dashes do not break it', () => {
  const c = makeClock({ weigh }); c.start(0); c.text('In 2026 🔥 - IELTS.'); c.audio(2000); c.close();
  assert.deepEqual(c.words().map((w) => w.text), ['In', '2026', 'IELTS']);
  near(c.endOf(2), 2000);
});
