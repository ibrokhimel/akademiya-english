// node --test src/core/core.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { judge, judgeAny, plain, numberWords, tilesOf, sameTiles, slug, answerOf, voiceOf } from './text.js';
import { makeSession, spareTiles, mix } from './session.js';
import { progressOf, streakOf, dayOf } from './progress.js';
import { defaultProfile, normalizeProfile, earnedItems, profileForSync, mediaToUpload, SECTION_IDS, STAT_IDS } from './profile.js';
import { MEDIA_LIMITS, pickedMediaType, mediaProblem, gifDurationMs, rememberMedia, cropBase, cropRect, clampPan, seasonOpen, frameShown, SEASONAL_FRAMES, thumbnailOf } from './customize.js';

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

import { MOMENTS, stillPoseFor, rigFor, animates, idleMoment, levelForFps, levelFrom } from './dombi.js';
import { helpStart, helpReducer, HELP_STEPS } from './help.js';

test('every moment in the moment map has a still pose and a rig state', () => {
  assert.equal(MOMENTS.length, 28);
  assert.equal(stillPoseFor("welcome"), "150-happy"); assert.equal(stillPoseFor("onboardingIdle"), "150-default"); assert.equal(stillPoseFor("thanks"), "48-happy"); assert.deepEqual(rigFor("confidenceUp"), { mood: "happy", gesture: "celebrate" });
  assert.equal(stillPoseFor("error"), "150-confused"); assert.equal(stillPoseFor("offline"), "150-thinking");
  for (const m of MOMENTS) { assert.match(stillPoseFor(m), /^(48|80|150)-[a-z-]+$/, m); assert.ok(rigFor(m).mood, m); }
  assert.equal(stillPoseFor('correct'), '48-laugh'); assert.equal(stillPoseFor('notYet'), '48-oops'); assert.equal(stillPoseFor('waiting'), '80-think');
  assert.deepEqual(rigFor('lessonResult'), { mood: 'laugh', gesture: 'celebrate' });
  assert.equal(rigFor('notYet').trigger, 'wrong');
  assert.throws(() => stillPoseFor('nope'));
});
test('Light animates only onboarding, answers and celebrations; Still never', () => {
  for (const m of MOMENTS) { assert.equal(animates(m, 'full'), true); assert.equal(animates(m, 'still'), false); }
  assert.deepEqual(MOMENTS.filter((m) => animates(m, 'light')).sort(), ['activityEnd', 'confidenceUp', 'correct', 'lessonResult', 'levelUp', 'notYet', 'onboarding', 'onboardingIdle', 'welcome']);
  assert.equal(animates('talking', 'light'), false);
});
test('back after a break wins over late at night', () => {
  const at = (d, h) => new Date(2026, 9, d, h, 30).getTime();
  assert.equal(idleMoment({ now: at(27, 23), lastOpen: at(25, 10) }), 'glad');
  assert.equal(idleMoment({ now: at(27, 23), lastOpen: at(27, 9) }), 'night');
  assert.equal(idleMoment({ now: at(27, 3), lastOpen: at(26, 20) }), 'night');
  assert.equal(idleMoment({ now: at(27, 14), lastOpen: at(27, 9) }), 'idle');
  assert.equal(idleMoment({ now: at(27, 14) }), 'idle');
});
test('phone level: fps measure, Reduce Motion and the switch', () => {
  assert.equal(levelForFps(58), 'full'); assert.equal(levelForFps(40), 'light'); assert.equal(levelForFps(20), 'still');
  assert.equal(levelFrom({ measured: 'full', reduceMotion: true }), 'still');
  assert.equal(levelFrom({ measured: 'full', lessMotion: true }), 'still');
  assert.equal(levelFrom({ measured: 'light' }), 'light');
  assert.equal(levelFrom({ measured: 'still' }), 'still');
  assert.equal(levelFrom({ measured: 'still', lessMotion: false }), 'light');
  assert.equal(levelFrom({ measured: 'still', lessMotion: false, reduceMotion: true }), 'still');
  assert.equal(levelFrom({}), 'full');
});
test('help: offered once on the second miss, steps go 1 to 4, a new item resets', () => {
  let s = helpStart();
  assert.deepEqual(s, { misses: 0, step: 0, offered: false });
  s = helpReducer(s, { type: 'miss' }); assert.equal(s.offered, false);
  s = helpReducer(s, { type: 'miss' }); assert.equal(s.offered, true);
  s = helpReducer(s, { type: 'open' }); assert.equal(s.step, 1); assert.equal(s.offered, false, 'opening help answers the offer'); assert.equal(s.misses, 0);
  s = helpReducer(s, { type: 'miss' }); assert.equal(s.offered, false, 'one more miss after help does not offer again');
  for (let i = 0; i < 6; i++) s = helpReducer(s, { type: 'next' });
  assert.equal(s.step, HELP_STEPS.length); assert.equal(HELP_STEPS.length, 4);
  s = helpReducer(s, { type: 'item' }); assert.deepEqual(s, helpStart());
});
test('help: a right answer clears the offer for that item', () => {
  let s = helpReducer(helpReducer(helpStart(), { type: 'miss' }), { type: 'miss' });
  assert.equal(s.offered, true);
  s = helpReducer(s, { type: 'right' }); assert.deepEqual(s, helpStart());
});

import { touchStart, touchReducer } from './touch.js';

const ENV = { w: 390, h: 800, homeX: 334, floorY: 700 };
const run = (events, s = touchStart(0)) => { const fx = []; for (const e of events) { const r = touchReducer(s, { env: ENV, rule: 'all', ...e }); s = r.state; fx.push(...r.effects); } return { s, fx }; };
const fires = (fx) => fx.filter((f) => f.fire).map((f) => f.fire);
const plays = (fx) => fx.filter((f) => 'play' in f).map((f) => f.play);
const ticks = (from, to, step = 16) => { const out = []; for (let t = from; t <= to; t += step) out.push({ type: 'tick', t, dt: step / 1000 }); return out; };

test('touch: a quick tap pokes, pokes count up and the 4th turns his back for 3 s', () => {
  const tap = (t) => [{ type: 'down', t, x: 334, y: 660 }, { type: 'up', t: t + 100, x: 334, y: 660 }];
  const { s, fx } = run([...tap(0), ...tap(1000), ...tap(2000), ...tap(3000)]);
  assert.deepEqual(fires(fx), ['poke1', 'poke2', 'poke3']);
  assert.deepEqual(plays(fx), ['back']); assert.equal(s.mode, 'back');
  const after = run(ticks(3100, 6200, 100), s);
  assert.equal(after.s.mode, 'idle'); assert.deepEqual(plays(after.fx), ['none']);
  assert.deepEqual(fires(run([...tap(0), ...tap(5000)]).fx), ['poke1', 'poke1'], 'pokes reset after 4 s');
});
test('touch: two taps within 400 ms do a trick, never the same one twice running', () => {
  const dbl = (t, r) => [{ type: 'down', t, x: 334, y: 660 }, { type: 'up', t: t + 60, x: 334, y: 660 }, { type: 'down', t: t + 150, x: 334, y: 660 }, { type: 'up', t: t + 210, x: 334, y: 660, rand: r }];
  const { fx } = run([...dbl(0, 0), ...dbl(5000, 0)]);
  const tricks = fires(fx).filter((f) => f.startsWith('trick'));
  assert.equal(tricks.length, 2); assert.notEqual(tricks[0], tricks[1]);
});
test('touch: a double-tap at a normal pace (0.33 s between taps) still does a trick', () => {
  const { fx } = run([{ type: 'down', t: 0, x: 334, y: 660 }, { type: 'up', t: 90, x: 334, y: 660 }, { type: 'down', t: 330, x: 334, y: 660 }, { type: 'up', t: 420, x: 334, y: 660, rand: 0 }]);
  assert.deepEqual(fires(fx), ['poke1', 'trickSpin']);
});
test('touch: a rub that starts slowly turns into petting instead of carrying him off', () => {
  const ev = [{ type: 'down', t: 0, x: 334, y: 660 }, { type: 'move', t: 150, x: 337, y: 660 }, { type: 'move', t: 280, x: 340, y: 660 }, ...ticks(296, 312)];
  for (let i = 0; i < 6; i++) ev.push({ type: 'move', t: 330 + i * 70, x: i % 2 ? 320 : 350, y: 660 }, { type: 'tick', t: 331 + i * 70, dt: 0.016 });
  const { s, fx } = run([...ev, { type: 'up', t: 800, x: 335, y: 660 }, ...ticks(816, 3000)]);
  assert.deepEqual(plays(fx), ['held', 'pet', 'none']); assert.deepEqual(fires(fx), ['hop', 'ahem']);
  assert.equal(s.mode, 'idle'); assert.equal(s.body.x, ENV.homeX); assert.equal(s.body.y, ENV.floorY);
});
test('touch: hold 300 ms picks him up only where carrying is allowed', () => {
  const hold = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)];
  const a = run(hold);
  assert.equal(a.s.mode, 'held'); assert.deepEqual(fires(a.fx), ['hop']); assert.deepEqual(plays(a.fx), ['held']);
  const fx = []; let s = touchStart(0);
  for (const e of hold) { const r = touchReducer(s, { env: ENV, rule: 'nocarry', ...e }); s = r.state; fx.push(...r.effects); }
  assert.notEqual(s.mode, 'held'); assert.deepEqual(fires(fx), []);
});
test('touch: moving straight away pets him; letting go says "ahem"', () => {
  const { s, fx } = run([{ type: 'down', t: 0, x: 334, y: 660 }, { type: 'move', t: 80, x: 350, y: 660 }, { type: 'up', t: 400, x: 352, y: 660 }]);
  assert.deepEqual(plays(fx), ['pet', 'none']); assert.deepEqual(fires(fx), ['ahem']); assert.equal(s.mode, 'idle');
});
test('touch: a fast release throws him, a slow one drops him; he lands and walks home', () => {
  const carry = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)];
  const thrown = run([...carry, { type: 'move', t: 330, x: 200, y: 500 }, { type: 'move', t: 380, x: 150, y: 450 }, { type: 'up', t: 400, x: 140, y: 440 }]);
  assert.equal(thrown.s.mode, 'flying');
  const dropped = run([...carry, { type: 'move', t: 330, x: 300, y: 500 }, ...ticks(331, 690), { type: 'move', t: 695, x: 300, y: 498 }, { type: 'up', t: 700, x: 300, y: 498 }]);
  assert.equal(dropped.s.mode, 'falling');
  const home = run(ticks(716, 6000), dropped.s);
  assert.ok(fires(home.fx).includes('land')); assert.ok(plays(home.fx).includes('walk'));
  assert.equal(home.s.mode, 'idle'); assert.ok(Math.abs(home.s.body.x - ENV.homeX) < 6); assert.equal(home.s.body.y, ENV.floorY);
});
test('touch: shaking him while held makes him dizzy, with a cooldown', () => {
  const ev = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)];
  let x = 334; for (let i = 0; i < 12; i++) { x += i % 2 ? -60 : 60; ev.push({ type: 'move', t: 330 + i * 60, x, y: 600 }); }
  assert.deepEqual(fires(run(ev).fx).filter((f) => f === 'dizzy'), ['dizzy']);
});
test('touch: after 22 s alone he sleeps; a tap wakes him', () => {
  const a = run(ticks(0, 22600, 500));
  assert.equal(a.s.mode, 'asleep'); assert.deepEqual(plays(a.fx), ['sleep']);
  const b = run([{ type: 'down', t: 23000, x: 334, y: 660 }, { type: 'up', t: 23080, x: 334, y: 660 }, ...ticks(23100, 24200, 100)], a.s);
  assert.deepEqual(fires(b.fx), ['wake']); assert.equal(b.s.mode, 'idle');
});
test('touch: a press that starts while he flies does not pick him up when he lands', () => {
  const carry = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)];
  const thrown = run([...carry, { type: 'move', t: 330, x: 200, y: 500 }, { type: 'move', t: 380, x: 150, y: 450 }, { type: 'up', t: 400, x: 140, y: 440 }]);
  const later = run([{ type: 'down', t: 420, x: 140, y: 440 }, ...ticks(436, 4000)], thrown.s);
  assert.ok(!fires(later.fx).includes('hop'));
});
test('touch: a cancelled touch is not a tap', () => {
  const { fx } = run([{ type: 'down', t: 0, x: 334, y: 660 }, { type: 'up', t: 80, x: 334, y: 660, cancel: true }]);
  assert.deepEqual(fires(fx), []);
});

import { practiceItems, practiceCounts, matchPool } from './practice.js';
import { matchStart, matchReducer } from './match.js';
const doneOf = (...ids) => new Set(ids);
const lessonsOf = (ids) => units.flatMap((u) => [...u.lessons, u.checkpoint]).filter((l) => ids.includes(l.id));

test('practice: items come only from finished lessons', () => {
  const done = doneOf('l1', 'l2'), mine = lessonsOf(['l1', 'l2']).flatMap((l) => l.items);
  for (const kind of ['catch', 'overheard']) for (const it of practiceItems(kind, units, done, { rand: () => 0.3 }))
    assert.ok(mine.some((m) => m.talk ? m.talk === it.talk : m.p === it.p), kind);
  assert.deepEqual(practiceItems('fixit', units, done), []);
});
test('practice: Catch items are tiles items heard first, at most 5', () => {
  const items = practiceItems('catch', units, doneOf('l1', 'l2', 'l3', 'l4', 'l5'), { rand: () => 0.5 });
  assert.equal(items.length, 5); assert.ok(items.every((i) => i.ex === 'tiles' && i.listen === true));
});
test('practice: Overheard is the lessons\' conversations, at most 5', () => {
  const items = practiceItems('overheard', units, doneOf('l1', 'l2', 'l3', 'l4', 'l5', 'c1', 'l6'), { rand: () => 0.1 });
  assert.equal(items.length, 5); assert.ok(items.every((i) => i.ex === 'heard'));
});
test('practice: Fix it alternates find the mistake and say it fixed, on different sentences', () => {
  const items = practiceItems('fixit', units, doneOf(...['l1', 'l2', 'l3', 'l4', 'l5', 'c1', 'l6', 'l7', 'l8', 'l9']), { rand: () => 0.2 });
  assert.deepEqual(items.map((i) => i.ex), ['fix', 'say', 'fix']);
  const say = items[1]; assert.equal(say.fix, true); assert.ok(say.wrong && say.right && say.ctx);
  assert.notEqual(say.right, items[0].right); assert.notEqual(say.right, items[2].right);
  const src = units.flatMap((u) => [...u.lessons, u.checkpoint]).flatMap((l) => l.items).find((i) => i.ex === 'fix' && i.right === say.right);
  assert.equal(say.wrong, src.words.join(' '));   // the sentence as written, mistake and all
});
test('practice: counts with one lesson done', () => {
  assert.deepEqual(practiceCounts(units, doneOf('l1')), { catch: 1, overheard: 1, fixit: 0, match: 3 });
  assert.deepEqual(practiceCounts(units, doneOf()), { catch: 0, overheard: 0, fixit: 0, match: 0 });
});
test('practice: the Match pool is the phrases of finished lessons', () => {
  const pool = matchPool(units, doneOf('l1', 'l2'), P);
  assert.equal(pool.length, 6); assert.ok(pool.every((p) => p.en && p.uz && p.id));
});

const pool6 = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, en: id.toUpperCase() }));
const at = (s, side, id) => s[side].indexOf(id);
test('match: 60 s, 4 audio cards and the same 4 phrases', () => {
  const s = matchStart(pool6, { rand: () => 0.4, now: 1000 });
  assert.equal(s.end, 61000); assert.equal(s.audio.length, 4); assert.deepEqual([...s.audio].sort(), [...s.phrase].sort());
  assert.equal(s.found, 0); assert.equal(s.done, false);
});
test('match: a right pair counts 1 and fades; a wrong pair flashes and counts nothing', () => {
  let s = matchStart(pool6, { rand: () => 0.4, now: 0 }); const id = s.audio[0], other = s.audio[1];
  s = matchReducer(s, { type: 'audio', i: 0, t: 100 });
  s = matchReducer(s, { type: 'phrase', i: at(s, 'phrase', other), t: 200 });
  assert.equal(s.found, 0); assert.deepEqual(s.flash, { audio: 0, phrase: at(s, 'phrase', other), until: 800 }); assert.equal(s.combo, 0);
  s = matchReducer(s, { type: 'phrase', i: at(s, 'phrase', id), t: 300 });
  s = matchReducer(s, { type: 'audio', i: 0, t: 400 });
  assert.equal(s.found, 1); assert.equal(s.combo, 1); assert.ok(s.matched.includes(id));
  const again = matchReducer(matchReducer(s, { type: 'audio', i: 0, t: 500 }), { type: 'phrase', i: at(s, 'phrase', id), t: 600 });
  assert.equal(again.found, 1);   // a faded card does nothing
});
test('match: when all 4 are found a new board of 4 comes', () => {
  let s = matchStart(pool6, { rand: () => 0.7, now: 0 }); const first = [...s.audio];
  for (const id of first) { s = matchReducer(s, { type: 'audio', i: at(s, 'audio', id), t: 1000 }); s = matchReducer(s, { type: 'phrase', i: at(s, 'phrase', id), t: 1100 }); }
  assert.equal(s.found, 4); assert.equal(s.matched.length, 0); assert.equal(s.audio.length, 4);
  assert.ok(s.audio.some((id) => !first.includes(id)));   // the 2 phrases not on the last board come first
});
test('match: time up at 60 s; a tap after the end does not count', () => {
  let s = matchStart(pool6, { rand: () => 0.4, now: 0 }); const id = s.audio[0];
  s = matchReducer(s, { type: 'audio', i: 0, t: 59000 });
  s = matchReducer(s, { type: 'phrase', i: at(s, 'phrase', id), t: 60100 });
  assert.equal(s.found, 0); assert.equal(s.done, true);
  assert.equal(matchReducer(matchStart(pool6, { now: 0 }), { type: 'tick', t: 60000 }).done, true);
});
test('practice: a checkpoint\'s repeats of lesson items are played and counted once', () => {
  const done = doneOf(...units.slice(0, 2).flatMap((u) => [...u.lessons, u.checkpoint].map((l) => l.id)));
  const fix = practiceItems('fixit', units, done, { rand: () => 0.3 });
  assert.equal(new Set(fix.map((i) => i.right)).size, fix.length);
  assert.equal(practiceCounts(units, done).fixit, fix.length);
  const all = practiceItems('catch', units, doneOf(...[...units[0].lessons, units[0].checkpoint].map((l) => l.id)), { n: 99 });
  assert.equal(new Set(all.map((i) => i.p ?? i.en)).size, all.length);
});

import { pickSpot } from './spots.js';

// A lesson screen 360 wide; the free area for Dombi is the exercise's scroll view, 0..360 x 0..440.
const AREA = { x: 0, y: 0, w: 360, h: 440 };
const hits = (s, b) => s.x < b.x + b.w && b.x < s.x + s.size && s.y < b.y + b.h && b.y < s.y + s.size;
test('spots: he sits next to a centred row instead of on it, nearest to where he was dropped', () => {
  const blocks = [{ x: 16, y: 12, w: 328, h: 50 }, { x: 110, y: 80, w: 140, h: 90 }, { x: 16, y: 190, w: 328, h: 250 }];
  const s = pickSpot({ area: AREA, blocks, target: { x: 340, y: 120 } });
  assert.equal(s.size, 80); assert.ok(!blocks.some((b) => hits(s, b)));
  assert.ok(s.x >= 250 && s.y >= 62 && s.y + 80 <= 190, 'right of the centred row');
});
test('spots: when nothing is covered at the drop point he stays right there', () => {
  const s = pickSpot({ area: AREA, blocks: [{ x: 16, y: 12, w: 328, h: 50 }], target: { x: 180, y: 300 } });
  assert.deepEqual([s.x + 40, s.y + 40, s.size], [180, 300, 80]);
});
test('spots: with no room for 80 he shrinks to 48, and with no room at all there is no spot', () => {
  const tight = [{ x: 16, y: 0, w: 328, h: 180 }, { x: 16, y: 250, w: 328, h: 190 }];
  const s = pickSpot({ area: AREA, blocks: tight, target: { x: 300, y: 210 } });
  assert.equal(s.size, 48); assert.ok(!tight.some((b) => hits(s, b)));
  assert.equal(pickSpot({ area: AREA, blocks: [{ x: 0, y: 0, w: 360, h: 440 }], target: { x: 0, y: 0 } }), null);
});
test('touch: in a lesson a throw plays out; he stays where he lands and goes to his spot only after 4 s untouched', () => {
  const env = { ...ENV, groundY: 760 };
  const go = (events, s = touchStart(0)) => { const fx = []; for (const e of events) { const r = touchReducer(s, { env, rule: 'perch', ...e }); s = r.state; fx.push(...r.effects); } return { s, fx }; };
  const carry = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)];
  const thrown = go([...carry, { type: 'move', t: 330, x: 200, y: 500 }, { type: 'move', t: 380, x: 150, y: 450 }, { type: 'up', t: 400, x: 140, y: 440 }]);
  assert.equal(thrown.s.mode, 'flying'); assert.ok(fires(thrown.fx).includes('hop'));
  const landed = go(ticks(416, 3900), thrown.s);
  assert.ok(fires(landed.fx).includes('land')); assert.equal(landed.s.body.y, 760);
  assert.equal(landed.s.mode, 'idle'); assert.notEqual(landed.s.body.x, ENV.homeX, 'he stays where he landed');
  assert.ok(!landed.fx.some((f) => f.drop) && !plays(landed.fx).includes('walk'));
  // A poke while he is away starts the wait again.
  const poked = go([{ type: 'down', t: 3950, x: 100, y: 700 }, { type: 'up', t: 4030, x: 100, y: 700 }, ...ticks(4100, 7900, 100)], landed.s);
  assert.ok(!poked.fx.some((f) => f.drop));
  const back = go(ticks(8000, 8300, 100), poked.s);
  assert.equal(back.fx.filter((f) => f.drop).length, 1);
  assert.equal(back.s.body.x, ENV.homeX); assert.equal(back.s.body.y, ENV.floorY);
});

// Remaining touch moves (plan 2026-10-27-dombi-remaining-features, numbers from design/rive/play.html).
const NUMS = (fx, name) => fx.filter((f) => f.num && f.num[0] === name).map((f) => f.num[1]);
const runR = (events, rule = 'all', s = touchStart(0), env = ENV) => { const fx = []; for (const e of events) { const r = touchReducer(s, { env, rule, ...e }); s = r.state; fx.push(...r.effects); } return { s, fx }; };
const carryTo = (x, y) => [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), { type: 'move', t: 330, x, y }, ...ticks(331, 700), { type: 'move', t: 705, x, y: y + 1 }, { type: 'up', t: 710, x, y: y + 1 }];
test('touch: let go at the screen edge, he hides and peeks back in from a side, then comes home', () => {
  const a = runR([...carryTo(4, 400)]);
  assert.equal(a.s.mode, 'hidden'); assert.ok(a.fx.some((f) => f.hidden === true));
  const b = runR(ticks(716, 1500).map((e) => ({ ...e, rand: 0.2 })), 'all', a.s);
  assert.equal(b.s.mode, 'peeking'); assert.ok(b.fx.some((f) => f.hidden === false)); assert.ok(b.s.body.x < 40, 'from the left');
  assert.ok(b.fx.some((f) => f.looking === true)); assert.equal(NUMS(b.fx, 'lookX')[0], 80);
  const c = runR(ticks(1516, 12000), 'all', b.s);
  assert.equal(c.s.mode, 'idle'); assert.ok(Math.abs(c.s.body.x - ENV.homeX) < 6);
});
test('touch: a fast sideways swipe throws him off the screen', () => {
  const ev = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), { type: 'move', t: 330, x: 300, y: 600 }, { type: 'move', t: 350, x: 250, y: 598 }, { type: 'up', t: 360, x: 220, y: 597 }];
  const a = runR(ev); assert.equal(a.s.mode, 'exit');
  assert.equal(runR(ticks(376, 1200), 'all', a.s).s.mode, 'hidden');
});
const ZONES = { peek: { l: 20, r: 370, top: 300 }, warm: { x: 330, y: 60 } };
test('touch: dropped over the top of the Learn card he sits on it and peeks', () => {
  const env = { ...ENV, zones: ZONES };
  const a = runR([...carryTo(150, 260), ...ticks(716, 2400)], 'all', touchStart(0), env);
  assert.equal(a.s.mode, 'perched'); assert.equal(a.s.body.y, 304); assert.ok(fires(a.fx).includes('land')); assert.ok(plays(a.fx).includes('peek'));
});
test('touch: dropped beside the flame he warms his hands', () => {
  const env = { ...ENV, zones: ZONES };
  const a = runR([...carryTo(290, 70), ...ticks(716, 2400)], 'all', touchStart(0), env);
  assert.equal(a.s.mode, 'perched'); assert.equal(a.s.body.x, 286); assert.ok(plays(a.fx).includes('warm')); assert.ok(a.fx.some((f) => f.mood === 'happy'));
});
test('touch: fed a word he eats it, but not while carried', () => {
  assert.deepEqual(fires(runR([{ type: 'feed', t: 100 }]).fx), ['eat']);
  const held = runR([{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), { type: 'feed', t: 330 }]);
  assert.ok(!fires(held.fx).includes('eat'));
});
test('touch: after a right answer he offers a high-five; a hit claps, ignored he plays it off', () => {
  const hit = runR([{ type: 'highfive', t: 0 }, ...ticks(16, 1100, 50), { type: 'hand', t: 1200 }]);
  assert.ok(plays(hit.fx).includes('highfive')); assert.ok(fires(hit.fx).includes('clap')); assert.ok(hit.fx.some((f) => f.pop));
  const miss = runR([{ type: 'highfive', t: 0 }, ...ticks(16, 4000, 50)]);
  assert.ok(fires(miss.fx).includes('playoff')); assert.ok(!fires(miss.fx).includes('clap'));
});
test('touch: a pinch stretches him and snaps on release, and cancels the press it started from', () => {
  const a = runR([{ type: 'down', t: 0, x: 334, y: 660 }, { type: 'pinch', t: 50, d: 100 }, { type: 'pinch', t: 100, d: 200 }, ...ticks(116, 400), { type: 'pinchEnd', t: 410 }, { type: 'up', t: 420, x: 334, y: 660 }]);
  assert.equal(NUMS(a.fx, 'stretch').at(1), 60); assert.ok(fires(a.fx).includes('snap'));
  assert.ok(!fires(a.fx).includes('hop') && !fires(a.fx).includes('poke1'));
});
test('touch: shaking the phone throws him; he lands and looks annoyed', () => {
  const a = runR([{ type: 'phoneShake', t: 0, rand: 0.3 }]); assert.equal(a.s.mode, 'flying');
  const b = runR(ticks(16, 4000), 'all', a.s); assert.ok(fires(b.fx).includes('shook'));
});
test('touch: while held, his body pulses with the mic and steady blowing leans him into the wind', () => {
  const base = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)];
  const talk = runR([...base, { type: 'mic', t: 330, level: 50, dt: 0.05 }]);
  assert.equal(NUMS(talk.fx, 'amp').length, 1); assert.ok(NUMS(talk.fx, 'amp')[0] > 0);
  const ev = [...base]; for (let i = 0; i < 8; i++) ev.push({ type: 'mic', t: 330 + i * 50, level: 100, dt: 0.05 });
  const blow = runR(ev); assert.ok(plays(blow.fx).includes('wind'));
  const stop = runR([800, 850, 900, 950, 1000, 1050, 1100, 1150].map((t) => ({ type: 'mic', t, level: 0, dt: 0.05 })), 'all', blow.s);
  assert.deepEqual(plays(stop.fx), ['held']);
  assert.deepEqual(runR([{ type: 'mic', t: 10, level: 100, dt: 0.05 }]).fx, [], 'not held: the mic does nothing');
});
test('touch: his eyes follow a finger on the screen and let go 2.5 s later', () => {
  const env = { ...ENV, eyeUp: 50 };
  const a = runR([{ type: 'look', t: 0, x: ENV.homeX + 110, y: ENV.floorY - 50 }], 'all', touchStart(0), env);
  assert.ok(a.fx.some((f) => f.looking === true)); assert.deepEqual(NUMS(a.fx, 'lookX'), [50]); assert.deepEqual(NUMS(a.fx, 'lookY'), [0]);
  const b = runR(ticks(16, 2600, 100), 'all', a.s, env); assert.ok(b.fx.some((f) => f.looking === false));
});
test('touch: while his hand is up, a tap on him is the high-five', () => {
  const a = runR([{ type: 'highfive', t: 0 }, ...ticks(16, 1100, 50), { type: 'down', t: 1200, x: 334, y: 660 }, { type: 'up', t: 1260, x: 334, y: 660 }], 'nocarry');
  assert.ok(fires(a.fx).includes('clap')); assert.ok(!fires(a.fx).includes('poke1'));
});
test('touch: a pinch that starts after he was picked up drops him; nothing stays held', () => {
  const a = runR([{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 400), { type: 'pinch', t: 410, d: 100 }, { type: 'pinchEnd', t: 600 }, { type: 'up', t: 620, x: 334, y: 660 }, ...ticks(636, 6000)]);
  assert.notEqual(a.s.mode, 'held'); assert.equal(a.s.mode, 'idle');
});
test('touch: a pinch that starts as a rub ends the petting pose', () => {
  const a = runR([{ type: 'down', t: 0, x: 334, y: 660 }, { type: 'move', t: 60, x: 360, y: 660 }, { type: 'pinch', t: 80, d: 100 }, { type: 'pinchEnd', t: 300 }, { type: 'up', t: 320, x: 334, y: 660 }]);
  assert.equal(plays(a.fx).at(-1), 'none');
});
test('touch: a let-go with no press left still releases him if he is held', () => {
  const held = runR([{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320)]);
  const s = { ...held.s, press: null };
  assert.notEqual(runR([{ type: 'up', t: 400, x: 334, y: 660 }], 'all', s).s.mode, 'held');
});
test('touch: offering a high-five counts as activity', () => {
  const a = runR([{ type: 'highfive', t: 5000 }]); assert.equal(a.s.lastAct, 5000);
  const b = runR(ticks(5016, 6100, 50), 'all', a.s); assert.ok(b.s.lastAct >= 6000);
});
test('touch: on the real Learn tab (flame just above the card) a drop just above the card lands on it', () => {
  const env = { ...ENV, zones: { peek: { l: 20, r: 340, top: 102 }, warm: { x: 226, y: 78 } } };
  const hold = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), { type: 'move', t: 330, x: 190, y: 119 }, ...ticks(331, 1500), { type: 'up', t: 1510, x: 190, y: 119 }];
  const a = runR([...hold, ...ticks(1516, 2400)], 'all', touchStart(0), env);
  assert.equal(a.s.mode, 'perched'); assert.equal(a.s.perch, 'peek');
});
test('touch: the lesson waking him: asleep, a nudge wakes him; awake, it does nothing', () => {
  const asleep = runR(ticks(0, 22600, 500));
  const a = runR([{ type: 'nudge', t: 23000 }, ...ticks(23100, 24200, 100)], 'all', asleep.s);
  assert.deepEqual(fires(a.fx), ['wake']); assert.equal(a.s.mode, 'idle');
  assert.deepEqual(runR([{ type: 'nudge', t: 10 }]).fx, []);
});
// Phone gravity (owner 2026-10-27: "how I move the phone should change Dombi's gravity"; real fall to any edge, tabs only).
const GENV = { ...ENV, top: 60 };
const grav = (t, gx, gy) => ({ type: 'gravity', t, gx, gy });
test('gravity: phone turned on its left side, he falls to the left edge and lies there', () => {
  const a = runR([grav(0, -1, 0), ...ticks(16, 3000)], 'all', touchStart(0), GENV);
  assert.equal(a.s.mode, 'lying'); assert.equal(a.s.edge, 'left'); assert.equal(a.s.body.x, 34); assert.equal(a.s.body.rot, 90);
  assert.ok(fires(a.fx).includes('land'));
  assert.equal(runR(ticks(3016, 9000, 100), 'all', a.s, GENV).s.mode, 'lying', 'he stays where he landed');
});
test('gravity: upside down, he falls to the top edge, head down', () => {
  const a = runR([grav(0, 0, -1), ...ticks(16, 3000)], 'all', touchStart(0), GENV);
  assert.equal(a.s.edge, 'top'); assert.equal(a.s.body.y, 124); assert.equal(Math.abs(a.s.body.rot), 180);
});
test('gravity: a phone lying flat keeps the screen bottom as down', () => {
  const a = runR([grav(0, 0.05, 0.02), ...ticks(16, 2000)], 'all', touchStart(0), GENV);
  assert.equal(a.s.mode, 'idle'); assert.equal(a.s.body.x, ENV.homeX); assert.equal(a.s.body.y, ENV.floorY);
});
test('gravity: upright again, he falls to the bottom and walks home after 3 s upright', () => {
  const left = runR([grav(0, -1, 0), ...ticks(16, 3000)], 'all', touchStart(0), GENV);
  const b = runR([grav(3100, 0, 1), ...ticks(3116, 5000)], 'all', left.s, GENV);
  assert.notEqual(b.s.mode, 'walking', 'not before 3 s upright'); assert.equal(b.s.body.y, ENV.floorY); assert.equal(b.s.body.rot, 0);
  const c = runR(ticks(5016, 16000), 'all', b.s, GENV);
  assert.equal(c.s.mode, 'idle'); assert.ok(Math.abs(c.s.body.x - ENV.homeX) < 6);
});
test('gravity: a sideways tilt slides him along the bottom without falling off it', () => {
  const a = runR([grav(0, -0.5, 0.87), ...ticks(16, 1500)], 'all', touchStart(0), GENV);
  assert.equal(a.s.body.y, ENV.floorY); assert.notEqual(a.s.body.x, ENV.homeX); assert.equal(a.s.mode, 'lying'); assert.equal(a.s.edge, 'bottom');
});
test('gravity: while carried, gravity changes nothing; let go, he falls the new way', () => {
  const held = runR([{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), grav(330, 1, 0), ...ticks(346, 600)], 'all', touchStart(0), GENV);
  assert.equal(held.s.mode, 'held');
  const out = runR([{ type: 'up', t: 610, x: 200, y: 400 }, ...ticks(626, 3000)], 'all', held.s, GENV);
  assert.equal(out.s.edge, 'right'); assert.equal(out.s.body.x, ENV.w - 34);
});
test('gravity: lying still against an edge needs no frames, and he can still fall asleep there', () => {
  const a = runR([grav(0, -1, 0), ...ticks(16, 30000, 50)], 'all', touchStart(0), GENV);
  assert.equal(a.s.mode, 'asleep'); assert.equal(a.s.moving, false);
});
// Weight (owner 2026-10-27: "make it bounce not just stick, it should have some weight").
const trace = (events, s, env = GENV) => { const ys = []; for (const e of events) { const r = touchReducer(s, { env, rule: 'all', ...e }); s = r.state; ys.push({ y: s.body.y, x: s.body.x, sq: s.body.squish, mode: s.mode }); } return { s, ys }; };
test('weight: a plain drop bounces a few times before he settles, with a squash on impact', () => {
  const held = runR([{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), { type: 'move', t: 330, x: 200, y: 300 }, ...ticks(331, 1500), { type: 'up', t: 1510, x: 200, y: 300 }], 'all', touchStart(0), GENV);
  assert.equal(held.s.mode, 'falling');
  const { s, ys } = trace(ticks(1516, 5000), held.s);
  const firstHit = ys.findIndex((p) => p.y >= ENV.floorY);
  assert.ok(firstHit > 0); assert.ok(ys.slice(firstHit).some((p) => p.y < ENV.floorY - 10), 'he bounces back up');
  assert.ok(ys.some((p) => p.sq < -10), 'squashed on impact');
  assert.equal(s.body.y, ENV.floorY); assert.notEqual(s.mode, 'falling');
});
test('weight: falling onto a side edge, he bounces off it before lying there', () => {
  const { s, ys } = trace([grav(0, -1, 0), ...ticks(16, 4000)], touchStart(0));
  const firstHit = ys.findIndex((p) => p.x <= 34);
  assert.ok(firstHit > 0); assert.ok(ys.slice(firstHit).some((p) => p.x > 48), 'bounces off the wall');
  assert.equal(s.mode, 'lying'); assert.equal(s.body.x, 34);
});
test('weight: tipped along the floor he keeps sliding a little after the tilt stops', () => {
  const a = runR([grav(0, -0.6, 0.8), ...ticks(16, 800), grav(810, 0, 1)], 'all', touchStart(0), GENV);
  const x0 = a.s.body.x, b = runR(ticks(826, 1000), 'all', a.s, GENV);
  assert.ok(b.s.body.x < x0 - 1, 'momentum carries him on');
});
// Like a bouncing ball (owner 2026-10-27: "it should rotate too based on the gravity, make it act like a bouncing ball").
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
test('ball: sliding along the floor he rolls the way he moves', () => {
  const a = runR([grav(0, -0.6, 0.8), ...ticks(16, 300)], 'all', touchStart(0), GENV);
  assert.ok(a.s.body.vx < 0); assert.ok(a.s.body.rot < -5, 'rolling left turns him anticlockwise');
});
test('ball: at rest on a tilted phone he stands upright to real gravity', () => {
  const a = runR([grav(0, -0.5, 0.866), ...ticks(16, 8000)], 'all', touchStart(0), GENV);
  assert.ok(near(a.s.body.rot, 30, 1.5), 'leans 30 degrees, feet toward the pull: ' + a.s.body.rot);
});
test('ball: a sideways landing sets him spinning, and he settles feet-down again', () => {
  const ev = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), { type: 'move', t: 330, x: 330, y: 400 }, ...ticks(331, 1500), { type: 'move', t: 1510, x: 250, y: 380 }, { type: 'move', t: 1540, x: 200, y: 370 }, { type: 'up', t: 1550, x: 190, y: 368 }];
  const thrown = runR(ev, 'all', touchStart(0), GENV);
  let s = thrown.s, spunAfterHit = false, hit = false;
  for (const e of ticks(1566, 3500)) { s = touchReducer(s, { env: GENV, rule: 'all', ...e }).state; if (s.body.y >= ENV.floorY) hit = true; else if (hit && Math.abs(s.body.spin) > 50) spunAfterHit = true; }
  assert.ok(spunAfterHit, 'the floor turns his slide into spin');
  const later = runR(ticks(3516, 12000), 'all', s, GENV);
  assert.ok(near(((later.s.body.rot % 360) + 360) % 360, 0, 1) || near(((later.s.body.rot % 360) + 360) % 360, 360, 1), 'feet down again: ' + later.s.body.rot);
});
// Holding follows the pull too (owner 2026-10-28: "holding him is the same no matter the gravity").
test('held: with the phone on its left side he hangs toward the left', () => {
  const a = runR([{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), grav(330, -1, 0), ...ticks(346, 1200)], 'all', touchStart(0), GENV);
  assert.equal(a.s.mode, 'held'); assert.ok(near(a.s.body.rot, 90, 1), 'rot ' + a.s.body.rot);
});
test('held: he swings with movement across the pull, not always left-right', () => {
  const ev = [{ type: 'down', t: 0, x: 334, y: 660 }, ...ticks(16, 320), grav(325, -1, 0), ...ticks(326, 330)];
  for (let i = 0; i < 10; i++) ev.push({ type: 'move', t: 340 + i * 30, x: 334, y: 660 - i * 25 }, { type: 'tick', t: 341 + i * 30, dt: 0.03 });
  const most = (events) => { let s = touchStart(0), m = 0; for (const e of events) { s = touchReducer(s, { env: GENV, rule: 'all', ...e }).state; m = Math.max(m, Math.abs(s.body.swing)); } return m; };
  assert.ok(most(ev) > 0.3, 'moving along the screen length swings him when the pull is sideways');
  assert.ok(most(ev.filter((e) => e.type !== 'gravity')) < 0.05, 'with the pull down, the same move does not swing him');
});
test('held: his eyes look toward the finger in his own turned frame', () => {
  const env = { ...GENV, eyeUp: 50 };
  const lying = runR([grav(0, -1, 0), ...ticks(16, 4000)], 'all', touchStart(0), env);
  const b = lying.s.body, look = runR([{ type: 'look', t: 4100, x: b.x + 250, y: b.y }], 'all', lying.s, env);
  assert.ok(NUMS(look.fx, 'lookY')[0] < -20, 'lying on the left wall, the screen right is his up: ' + NUMS(look.fx, 'lookY')[0]);
  assert.ok(Math.abs(NUMS(look.fx, 'lookX')[0]) < 5);
});

test('a new profile starts with the defaults', () => {
  const p = defaultProfile();
  assert.equal(p.v, 1); assert.equal(p.avatar.kind, 'letter'); assert.equal(p.frame, 'none'); assert.equal(p.nameColor, 'default');
  assert.deepEqual(p.stats.shown, ['streak', 'phrases']);   // the Profile tab's 2 x 2 as before: streak, then phrases
  assert.deepEqual(p.look.sections.map((s) => s.id), SECTION_IDS);
  assert.equal(p.look.sections.filter((s) => !s.shown).map((s) => s.id).join(), 'joined,trophyShelf');
  assert.deepEqual(STAT_IDS, ['phrases', 'streak', 'minutesSpoken', 'lessons', 'level', 'prediction']);
  assert.deepEqual(normalizeProfile(p), p);
  assert.notEqual(defaultProfile().look.sections, p.look.sections);
});
test('a stored profile is cleaned: unknown keys dropped, bad values reset', () => {
  assert.deepEqual(normalizeProfile(null), defaultProfile());
  assert.deepEqual(normalizeProfile('x'), defaultProfile());
  const p = normalizeProfile({ junk: 1, frame: 7, nameColor: null, avatar: { kind: 'nope', color: 'red', extra: 1, built: { skin: 4, wat: 1 } }, dombi: { name: 'Bo', zzz: 1 } });
  assert.equal(p.junk, undefined); assert.equal(p.frame, 'none'); assert.equal(p.nameColor, 'default');
  assert.equal(p.avatar.kind, 'letter'); assert.equal(p.avatar.color, 'red'); assert.equal(p.avatar.extra, undefined);
  assert.equal(p.avatar.built.skin, 4); assert.equal(p.avatar.built.wat, undefined); assert.equal(p.dombi.name, 'Bo'); assert.equal(p.dombi.pose, 'sit');
});
test('bio is cut at 60, username must be a-z 0-9 _ and 3 to 20 long', () => {
  assert.equal(normalizeProfile({ bio: 'a'.repeat(80) }).bio.length, 60);
  assert.equal(normalizeProfile({ username: 'Aziz_01' }).username, 'aziz_01');
  for (const bad of ['ab', 'a'.repeat(21), 'has space', 'dot.dot', 5]) assert.equal(normalizeProfile({ username: bad }).username, '', String(bad));
});
test('pinned badges are 3 at most and unique; dim stays 0 to 0.8', () => {
  assert.deepEqual(normalizeProfile({ badges: { pinned: ['a', 'b', 'a', 'c', 'd'] } }).badges.pinned, ['a', 'b', 'c']);
  assert.equal(normalizeProfile({ look: { dim: 5 } }).look.dim, 0.8);
  assert.equal(normalizeProfile({ look: { dim: -1 } }).look.dim, 0);
  assert.equal(normalizeProfile({ look: { dim: 'x' } }).look.dim, 0.3);
});
test('sections: unknown dropped, missing added at their place, always all of them', () => {
  const p = normalizeProfile({ look: { sections: [{ id: 'bio', shown: false }, { id: 'zzz', shown: true }, { id: 'banner', shown: true }, { id: 'bio', shown: true }] } });
  assert.equal(p.look.sections.length, SECTION_IDS.length);
  assert.deepEqual(p.look.sections.slice(0, 3).map((s) => s.id), ['bio', 'title', 'banner']);   // title lands at its default index 1
  assert.equal(new Set(p.look.sections.map((s) => s.id)).size, SECTION_IDS.length);
  assert.equal(p.look.sections[0].shown, false);
  assert.equal(p.look.sections.find((s) => s.id === 'title').shown, true);
  assert.equal(p.look.sections.find((s) => s.id === 'joined').shown, false);
  const none = normalizeProfile({ look: { sections: SECTION_IDS.map((id) => ({ id, shown: false })) } });
  assert.equal(none.look.sections.length, SECTION_IDS.length);
});
test('stats shown keeps only known ids', () => {
  assert.deepEqual(normalizeProfile({ stats: { shown: ['streak', 'nope', 'streak', 'level'] } }).stats.shown, ['streak', 'level']);
});
test('streak frames come from the best streak ever', () => {
  const e = earnedItems({ bestStreak: 31, perfectLessons: 0, minutesSpoken: 0, level: 0, unitsDone: [] });
  assert.ok(e.has('frame.streak7') && e.has('frame.streak30') && !e.has('frame.streak100') && !e.has('frame.streak365'));
  assert.ok(e.has('nameColor.gradient'));
  const f = (n) => earnedItems({ bestStreak: n });
  assert.ok(!f(6).has('frame.streak7') && f(7).has('frame.streak7') && !f(29).has('nameColor.gradient') && f(100).has('frame.streak100') && f(365).has('frame.streak365'));
});
test('perfect and speaker frames', () => {
  assert.ok(!earnedItems({ perfectLessons: 9 }).has('frame.perfect') && earnedItems({ perfectLessons: 10 }).has('frame.perfect'));
  assert.ok(!earnedItems({ minutesSpoken: 59 }).has('frame.speaker') && earnedItems({ minutesSpoken: 60 }).has('frame.speaker'));
});
test('level frames and the moving avatar follow the level', () => {
  assert.equal(earnedItems({ level: 0 }).size, 0);
  const l1 = earnedItems({ level: 1 }); assert.ok(l1.has('frame.level.a1') && !l1.has('frame.level.a2') && !l1.has('avatar.moving'));
  const l5 = earnedItems({ level: 5 });
  for (const k of ['a1', 'a2', 'b1', 'b2', 'c1']) assert.ok(l5.has('frame.level.' + k), k);
  assert.ok(l5.has('avatar.moving') && earnedItems({ level: 2 }).has('avatar.moving'));
});
test('a finished unit gives its frame and title', () => {
  const e = earnedItems({ unitsDone: ['cafe', 'shop'] });
  for (const id of ['frame.unit.cafe', 'title.unit.cafe', 'frame.unit.shop', 'title.unit.shop']) assert.ok(e.has(id), id);
  assert.ok(!e.has('frame.unit.bank') && !e.has('title.earlyBird'));
  assert.equal(earnedItems({}).size, 0);
});
test('badge styles are grid, row and shelf; anything else is grid', () => {
  for (const s of ['grid', 'row', 'shelf']) assert.equal(normalizeProfile({ badges: { style: s } }).badges.style, s);
  for (const bad of ['list', 'nope', 5, null]) assert.equal(normalizeProfile({ badges: { style: bad } }).badges.style, 'grid');
});
test('earned units ignore entries that are not unit names', () => {
  const e = earnedItems({ unitsDone: ['cafe', 5, null, '', {}] });
  assert.deepEqual([...e].sort(), ['frame.unit.cafe', 'title.unit.cafe']);
});
test('the synced profile never carries a phone path, and the input is left alone', () => {
  const p = normalizeProfile({ avatar: { kind: 'photo', uri: 'file:///a.jpg', mediaType: 'image' }, banner: { kind: 'media', uri: 'file:///b.mp4', mediaType: 'video' }, look: { background: { kind: 'media', uri: 'file:///c.gif', mediaType: 'gif' } } });
  const out = profileForSync(p);
  assert.equal(out.avatar.uri, null); assert.equal(out.banner.uri, null); assert.equal(out.look.background.uri, null);
  assert.equal(out.avatar.mediaType, 'image'); assert.equal(out.banner.kind, 'media');
  assert.equal(p.avatar.uri, 'file:///a.jpg');
  assert.deepEqual(profileForSync(defaultProfile()), defaultProfile());
});
test('only media that is in use and not yet uploaded is picked', () => {
  const p = normalizeProfile({ avatar: { kind: 'media', uri: 'file:///a.gif', mediaType: 'gif' }, banner: { kind: 'media', uri: 'file:///b.png', mediaType: 'image' }, look: { background: { kind: 'color', id: 'plain', uri: 'file:///old.png', mediaType: 'image' } } });
  assert.deepEqual(mediaToUpload(p, {}).map((m) => m.field), ['avatar', 'banner']);
  assert.deepEqual(mediaToUpload(p, { avatar: 'file:///a.gif' }).map((m) => m.field), ['banner']);
  assert.deepEqual(mediaToUpload(p, { avatar: 'file:///a.gif', banner: 'file:///b.png' }), []);
  assert.equal(mediaToUpload(p, {})[0].uri, 'file:///a.gif'); assert.equal(mediaToUpload(p, {})[0].mediaType, 'gif');
});
test('a letter avatar or a colour banner uploads nothing, and a changed picture uploads again', () => {
  assert.deepEqual(mediaToUpload(defaultProfile(), {}), []);
  const p = normalizeProfile({ avatar: { kind: 'photo', uri: 'file:///new.jpg', mediaType: 'image' } });
  assert.deepEqual(mediaToUpload(p, { avatar: 'file:///old.jpg' }).map((m) => m.field), ['avatar']);
  assert.deepEqual(mediaToUpload(null, null), []);
});
test('the early bird title needs five early lessons', () => {
  assert.ok(!earnedItems({ earlyLessons: 4 }).has('title.earlyBird') && earnedItems({ earlyLessons: 5 }).has('title.earlyBird'));
  assert.equal(earnedItems({}).has('title.earlyBird'), false);
});

// ---- profile customization: media limits, recent pictures, crop, seasonal frames (customize.js) ----
const gif = (...delays) => {   // a tiny GIF89a: header, screen, no colour table, one image per delay (centiseconds)
  const out = [...'GIF89a'].map((ch) => ch.charCodeAt(0)).concat([1, 0, 1, 0, 0, 0, 0]);
  out.push(0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map((ch) => ch.charCodeAt(0)), 3, 1, 0, 0, 0);   // loop extension, skipped
  for (const cs of delays) out.push(0x21, 0xf9, 4, 0, cs & 0xff, cs >> 8, 0, 0, 0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x44, 0x01, 0);
  out.push(0x3b);
  return Uint8Array.from(out);
};
test('picked media is an image, a GIF or a video', () => {
  assert.equal(pickedMediaType({ type: 'image', mimeType: 'image/jpeg', fileName: 'a.jpg' }), 'image');
  assert.equal(pickedMediaType({ type: 'image', mimeType: 'image/gif' }), 'gif');
  assert.equal(pickedMediaType({ type: 'image', fileName: 'Fun.GIF' }), 'gif');
  assert.equal(pickedMediaType({ type: 'image', uri: 'file:///x/y.gif' }), 'gif');
  assert.equal(pickedMediaType({ type: 'video', mimeType: 'video/mp4' }), 'video');
  assert.equal(pickedMediaType({ type: 'pairedVideo' }), 'video');
  assert.equal(pickedMediaType({ type: null, mimeType: 'video/quicktime' }), 'video');
  assert.equal(pickedMediaType({ type: 'livePhoto' }), 'image');
  assert.equal(pickedMediaType({}), 'image');
});
test('GIF and video over 8 MB or 6 seconds are refused, pictures are never refused', () => {
  const MB = 1024 * 1024;
  assert.equal(MEDIA_LIMITS.bytes, 8 * MB); assert.equal(MEDIA_LIMITS.ms, 6000);
  assert.equal(mediaProblem({ mediaType: 'video', bytes: 3 * MB, ms: 5900 }), null);
  assert.equal(mediaProblem({ mediaType: 'video', bytes: 8 * MB, ms: 6000 }), null);
  assert.equal(mediaProblem({ mediaType: 'video', bytes: 3 * MB, ms: 6040 }), null, 'a 6 s clip the container rounds up still passes');
  assert.equal(mediaProblem({ mediaType: 'video', bytes: 3 * MB, ms: 6200 }), 'tooLong');
  assert.equal(mediaProblem({ mediaType: 'gif', bytes: 8 * MB + 1, ms: 1000 }), 'tooBig');
  assert.equal(mediaProblem({ mediaType: 'gif', bytes: 9 * MB, ms: 9000 }), 'tooBig');
  assert.equal(mediaProblem({ mediaType: 'gif', bytes: 100, ms: null }), null, 'unknown length is not a reason to refuse');
  assert.equal(mediaProblem({ mediaType: 'video', bytes: null, ms: 2000 }), null);
  assert.equal(mediaProblem({ mediaType: 'image', bytes: 40 * MB, ms: null }), null);
});
test('a GIF is as long as its frame delays, short delays play at 100 ms like browsers do', () => {
  assert.equal(gifDurationMs(gif(50, 50, 100)), 2000);
  assert.equal(gifDurationMs(gif(0, 1, 2)), 220);
  assert.equal(gifDurationMs(gif(700)), 7000);
  assert.equal(gifDurationMs(Uint8Array.from([1, 2, 3])), null);
  assert.equal(gifDurationMs(gif(50).slice(0, 30)), null, 'a cut file has no length');
});
test('recent pictures keep the last 4, newest first, without repeats', () => {
  let list = [];
  for (const n of [1, 2, 3, 4, 5]) list = rememberMedia(list, { uri: `file:///${n}.jpg`, mediaType: 'image' }).list;
  assert.deepEqual(list.map((m) => m.uri), ['file:///5.jpg', 'file:///4.jpg', 'file:///3.jpg', 'file:///2.jpg']);
  const again = rememberMedia(list, { uri: 'file:///3.jpg', mediaType: 'image' });
  assert.deepEqual(again.list.map((m) => m.uri), ['file:///3.jpg', 'file:///5.jpg', 'file:///4.jpg', 'file:///2.jpg']);
  assert.deepEqual(again.dropped, []);
  const next = rememberMedia(again.list, { uri: 'file:///6.mp4', mediaType: 'video' });
  assert.deepEqual(next.dropped.map((m) => m.uri), ['file:///2.jpg']);
  assert.deepEqual(rememberMedia('junk', { uri: 'file:///a.gif', mediaType: 'gif' }).list, [{ uri: 'file:///a.gif', mediaType: 'gif' }]);
  assert.deepEqual(rememberMedia([{ uri: 5 }, null, { uri: 'file:///b.png', mediaType: 'nope' }], { uri: 'file:///a.gif', mediaType: 'gif' }).list.map((m) => m.uri), ['file:///a.gif']);
});
test('the crop window covers the mask, pans only as far as the picture reaches and maps to picture pixels', () => {
  const g = { imageW: 3000, imageH: 4000, viewW: 390, maskW: 300, maskH: 300 };
  assert.equal(cropBase(g), 0.13);   // fits the screen width
  assert.equal(cropBase({ imageW: 4000, imageH: 1000, viewW: 390, maskW: 350, maskH: 178 }), 0.178);   // a wide strip still covers the mask height
  const mid = cropRect({ ...g, scale: 1, x: 0, y: 0 });
  assert.deepEqual(mid, { originX: 346, originY: 846, width: 2308, height: 2308 });
  const far = cropRect({ ...g, scale: 1, x: 9999, y: -9999 });
  assert.equal(far.originX, 0); assert.equal(far.originY, 4000 - far.height);
  const zoom = cropRect({ ...g, scale: 2, x: 0, y: 0 });
  assert.equal(zoom.width, 1154); assert.equal(zoom.originX, 923);
  assert.deepEqual(clampPan({ ...g, scale: 1, x: 9999, y: 9999 }), { x: 45, y: 110 });
  const tiny = cropRect({ imageW: 100, imageH: 100, viewW: 390, maskW: 350, maskH: 178, scale: 0.2, x: 0, y: 0 });
  assert.ok(tiny.originX >= 0 && tiny.originY >= 0 && tiny.originX + tiny.width <= 100 && tiny.originY + tiny.height <= 100, JSON.stringify(tiny));
});
test('seasonal frames open only in their window, year-end windows wrap, Ramadan is always open', () => {
  const on = (id, iso) => seasonOpen(id, new Date(iso + 'T12:00:00'));
  assert.ok(on('navruz', '2027-03-01') && on('navruz', '2027-03-31') && !on('navruz', '2027-02-28') && !on('navruz', '2027-04-01'));
  assert.ok(on('independence', '2027-08-25') && on('independence', '2027-09-05') && !on('independence', '2027-08-24') && !on('independence', '2027-09-06'));
  assert.ok(on('newyear', '2026-12-15') && on('newyear', '2026-12-31') && on('newyear', '2027-01-15') && !on('newyear', '2027-01-16') && !on('newyear', '2026-12-14'));
  assert.ok(on('ramadan', '2027-06-10') && on('violet', '2027-06-10') && on('streak7', '2027-06-10'));
  assert.deepEqual(SEASONAL_FRAMES, ['navruz', 'independence', 'newyear', 'ramadan']);
});
test('a seasonal frame chosen in its window is drawn as none after it', () => {
  assert.equal(frameShown('navruz', new Date('2027-03-10T12:00:00')), 'navruz');
  assert.equal(frameShown('navruz', new Date('2027-04-10T12:00:00')), 'none');
  assert.equal(frameShown('gold', new Date('2027-04-10T12:00:00')), 'gold');
  assert.equal(frameShown('ramadan', new Date('2027-04-10T12:00:00')), 'ramadan');
});
test('the moving avatar is a kind of its own, and a letter on your own picture uploads that picture', () => {
  assert.equal(normalizeProfile({ avatar: { kind: 'moving' } }).avatar.kind, 'moving');
  const own = normalizeProfile({ avatar: { kind: 'letter', bg: 'own', uri: 'file:///bg.jpg', mediaType: 'image' } });
  assert.deepEqual(mediaToUpload(own, {}).map((m) => [m.field, m.uri]), [['avatar', 'file:///bg.jpg']]);
  assert.deepEqual(mediaToUpload(normalizeProfile({ avatar: { kind: 'letter', bg: 'plain', uri: 'file:///bg.jpg', mediaType: 'image' } }), {}), []);
});
test('a video keeps its first-frame picture next to it', () => {
  assert.equal(thumbnailOf('file:///docs/profile/ab-12.mp4'), 'file:///docs/profile/ab-12.thumb.jpg');
  assert.equal(thumbnailOf('file:///docs/profile/ab.MOV'), 'file:///docs/profile/ab.thumb.jpg');
  assert.equal(thumbnailOf('file:///docs/profile/noext'), 'file:///docs/profile/noext.thumb.jpg');
  assert.equal(thumbnailOf('file:///docs.v2/profile/noext'), 'file:///docs.v2/profile/noext.thumb.jpg');
});

// ---- profile showcase: name and about me, badges, stats (showcase.js) ----
import { cleanUsername, isUsername, birthdayOn, shouldGreetBirthday, birthdayLabel, MONTHS, toggleStat, shows, togglePin, rarestBadge, shelfOrder, moveTo, statsToShow } from './showcase.js';
test('username typing: the @ and capitals go, only a-z 0-9 _ stay, 20 at most; the B1 rule decides', () => {
  assert.equal(cleanUsername('@Aziz.01 x'), 'aziz01x');
  assert.equal(cleanUsername('@@ibrokhim'), 'ibrokhim');
  assert.equal(cleanUsername('a'.repeat(30)).length, 20);
  assert.equal(cleanUsername(null), '');
  assert.ok(isUsername('aziz_01') && !isUsername('ab') && !isUsername('') && !isUsername('Aziz'));
  for (const u of ['abc', 'a_b_c', 'x'.repeat(20)]) assert.equal(normalizeProfile({ username: u }).username, u);
});
test('birthday: the same month and day; 29 February is kept on the 28th in other years', () => {
  assert.ok(birthdayOn('03-12', new Date(2027, 2, 12, 9)));
  assert.ok(!birthdayOn('03-12', new Date(2027, 2, 13)) && !birthdayOn(null, new Date(2027, 2, 12)) && !birthdayOn('3-12', new Date(2027, 2, 12)));
  assert.ok(birthdayOn('02-29', new Date(2028, 1, 29)) && !birthdayOn('02-29', new Date(2028, 1, 28)));
  assert.ok(birthdayOn('02-29', new Date(2027, 1, 28)) && !birthdayOn('02-28', new Date(2027, 2, 1)));
});
test('birthday greeting: on the day, switched on, once a year', () => {
  const day = new Date(2027, 2, 12, 8);
  assert.ok(shouldGreetBirthday({ birthday: '03-12', greet: true, now: day }));
  assert.ok(!shouldGreetBirthday({ birthday: '03-12', greet: false, now: day }));
  assert.ok(!shouldGreetBirthday({ birthday: '03-12', greet: true, now: day, greetedYear: 2027 }));
  assert.ok(shouldGreetBirthday({ birthday: '03-12', greet: true, now: new Date(2028, 2, 12), greetedYear: 2027 }));
  assert.ok(!shouldGreetBirthday({ birthday: '03-12', greet: true, now: new Date(2027, 2, 11) }));
});
test('the birthday greeting is on by default and stays a yes or no', () => {
  assert.equal(defaultProfile().birthdayGreet, true);
  assert.equal(normalizeProfile({ birthdayGreet: false }).birthdayGreet, false);
  assert.equal(normalizeProfile({ birthdayGreet: 'no' }).birthdayGreet, true);
});
test('a birthday reads as day and month in Uzbek', () => {
  assert.equal(birthdayLabel('03-12'), '12-mart');
  assert.equal(birthdayLabel('01-01'), '1-yanvar');
  assert.equal(birthdayLabel('12-31'), '31-dekabr');
  assert.equal(birthdayLabel('nope'), '');
});
test('a part of the profile shows unless the learner hid it', () => {
  assert.ok(shows(defaultProfile(), 'bio') && shows(defaultProfile(), 'title') && !shows(defaultProfile(), 'trophyShelf'));
  assert.ok(!shows(normalizeProfile({ look: { sections: [{ id: 'bio', shown: false }] } }), 'bio'));
  assert.ok(shows(null, 'bio') && !shows(defaultProfile(), 'nope'));
});
test('pins: up to 3, a second press takes the pin off, a full row takes no more', () => {
  assert.deepEqual(togglePin([], 'a'), ['a']);
  assert.deepEqual(togglePin(['a', 'b'], 'a'), ['b']);
  assert.deepEqual(togglePin(['a', 'b', 'c'], 'd'), ['a', 'b', 'c']);
  assert.deepEqual(togglePin(['a', 'b', 'c'], 'b'), ['a', 'c']);
  assert.deepEqual(togglePin(null, 'a'), ['a']);
});
test('the rarest badge is the earned one with the biggest goal; the first of equals wins', () => {
  const list = [{ id: 'perfect', goal: 5, earned: true }, { id: 'early', goal: 10, earned: false }, { id: 'speaker', goal: 10, earned: true }, { id: 'fixer', goal: 10, earned: true }, { id: 'legend', goal: 1, earned: true }];
  assert.equal(rarestBadge(list), 'speaker');
  assert.equal(rarestBadge(list.map((b) => ({ ...b, earned: b.id === 'legend' }))), 'legend');
  assert.equal(rarestBadge(list.map((b) => ({ ...b, earned: false }))), null);
  assert.equal(rarestBadge([]), null);
});
test('trophy shelf: the learner order first, unknown ids dropped, new trophies added at the end', () => {
  assert.deepEqual(shelfOrder(['c', 'x', 'a'], ['a', 'b', 'c']), ['c', 'a', 'b']);
  assert.deepEqual(shelfOrder([], ['a', 'b']), ['a', 'b']);
  assert.deepEqual(shelfOrder(['b', 'b'], ['a', 'b']), ['b', 'a']);
});
test('moving a trophy puts it at the new place and keeps the rest in order', () => {
  assert.deepEqual(moveTo(['a', 'b', 'c'], 'a', 2), ['b', 'c', 'a']);
  assert.deepEqual(moveTo(['a', 'b', 'c'], 'c', 0), ['c', 'a', 'b']);
  assert.deepEqual(moveTo(['a', 'b', 'c'], 'b', 1), ['a', 'b', 'c']);
  assert.deepEqual(moveTo(['a', 'b', 'c'], 'z', 0), ['a', 'b', 'c']);
  assert.deepEqual(moveTo(['a', 'b', 'c'], 'a', 9), ['b', 'c', 'a']);
});
test('stats on the profile: the picked ones in the order they were picked, only those with a value; private mode shows none', () => {
  const all = new Set(STAT_IDS);
  assert.deepEqual(statsToShow(defaultProfile(), all), ['streak', 'phrases']);
  assert.deepEqual(statsToShow(normalizeProfile({ stats: { shown: ['level', 'phrases'] } }), all), ['level', 'phrases']);
  assert.deepEqual(statsToShow(normalizeProfile({ stats: { shown: ['prediction', 'streak'] } }), new Set(['streak'])), ['streak']);
  assert.deepEqual(statsToShow(normalizeProfile({ stats: { private: true } }), all), []);
});
test('stat layout is a 2 x 2 grid or one big number; anything else is the grid', () => {
  assert.equal(defaultProfile().stats.layout, 'grid');
  assert.equal(normalizeProfile({ stats: { layout: 'big' } }).stats.layout, 'big');
  for (const bad of ['huge', 5, null]) assert.equal(normalizeProfile({ stats: { layout: bad } }).stats.layout, 'grid');
});
test('turning a stat on puts it last, turning it off takes it out', () => {
  assert.deepEqual(toggleStat(['streak', 'phrases'], 'level', true), ['streak', 'phrases', 'level']);
  assert.deepEqual(toggleStat(['streak', 'phrases'], 'streak', false), ['phrases']);
  assert.deepEqual(toggleStat(['streak'], 'streak', true), ['streak']);
  assert.deepEqual(toggleStat(['streak'], 'nope', true), ['streak']);
});
test('the month names are the Uzbek ones, January first', () => {
  assert.equal(MONTHS.length, 12); assert.equal(MONTHS[0], 'yanvar'); assert.equal(MONTHS[11], 'dekabr');
});
