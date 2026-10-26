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
test('touch: two taps within 300 ms do a trick, never the same one twice running', () => {
  const dbl = (t, r) => [{ type: 'down', t, x: 334, y: 660 }, { type: 'up', t: t + 60, x: 334, y: 660 }, { type: 'down', t: t + 150, x: 334, y: 660 }, { type: 'up', t: t + 210, x: 334, y: 660, rand: r }];
  const { fx } = run([...dbl(0, 0), ...dbl(5000, 0)]);
  const tricks = fires(fx).filter((f) => f.startsWith('trick'));
  assert.equal(tricks.length, 2); assert.notEqual(tricks[0], tricks[1]);
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
