// node --test src/speak-lab/lipsync.test.js   (his mouth shapes from his words, on the word clock)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weighWord, langOf, makeLipsync } from './lipsync.js';
import { makeClock } from './clock.js';
import { buildTrack } from '../../design/rive/talk/engine.js';

const cfg = { MOUTH_GATE_MS: 80 };
const loud = () => 50;
function talk(line, audioMs, levelAt = loud) {
  const clock = makeClock({ weigh: (w, p) => weighWord(w, p, null) }); clock.start(0); clock.text(line); clock.audio(audioMs); clock.close();
  return { clock, lips: makeLipsync({ clock, levelAt, dict: () => null, cfg }) };
}
const mid = (clock, k) => (clock.startOf(k) + clock.endOf(k)) / 2;

test('weighWord uses the sounds: "freezing" > "it"; a full stop adds 420, a comma 220', () => {
  assert.ok(weighWord('freezing', '', null) > weighWord('it', '', null));
  assert.equal(Math.round(weighWord('it', '.', null) - weighWord('it', '', null)), 420);
  assert.equal(Math.round(weighWord('it', ',', null) - weighWord('it', '', null)), 220);
});

test('langOf: Cyrillic is ru, o\' g\' q x mark Uzbek, a dictionary word is English, other Latin is English', () => {
  assert.equal(langOf('привет', null), 'ru');
  assert.equal(langOf("qo'shiq", null), 'uz'); assert.equal(langOf('xayr', null), 'uz');
  assert.equal(langOf('quick', { quick: 'K W IH1 K' }), 'en');
  assert.equal(langOf('freezing', null), 'en'); assert.equal(langOf('box', null), 'en');
});

test('inside a loud word the shapes come in the word\'s own order', () => {
  const { clock, lips } = talk('mama', 600);
  const want = buildTrack('mama', 'en').segs.map((s) => s.v), got = [];
  for (let t = clock.startOf(0); t < clock.endOf(0); t += 5) { const v = lips.at(t); if (got[got.length - 1] !== v) got.push(v); }
  assert.deepEqual(got, want);
});

test('in the pause after a comma the mouth rests', () => {
  const { clock, lips } = talk('Hi, mama.', 2000);
  assert.ok(clock.startOf(1) - clock.endOf(0) > 100);
  assert.equal(lips.at((clock.endOf(0) + clock.startOf(1)) / 2), 0);
});

test('quiet for longer than the gate rests the mouth, a 40 ms dip does not', () => {
  const probe = talk('banana', 900), t = mid(probe.clock, 0);
  assert.notEqual(probe.lips.at(t), 0);
  const long = talk('banana', 900, (x) => (x > t - 100 && x <= t ? 0 : 50));
  assert.equal(long.lips.at(t), 0);
  const dip = talk('banana', 900, (x) => (x > t - 40 && x <= t ? 0 : 50));
  assert.notEqual(dip.lips.at(t), 0);
});

test('with no dictionary English still gets shapes from the rules', () => {
  const { clock, lips } = talk('hello', 500);
  assert.notEqual(lips.at(mid(clock, 0)), 0);
});

test('odd words never throw and give a shape 0..11', () => {
  for (const w of ['IELTS', '2026', '🔥', '-', '']) {
    const { clock, lips } = talk(`so ${w} ok`, 1200);
    for (let t = 0; t < 1300; t += 50) { const v = lips.at(t); assert.ok(Number.isInteger(v) && v >= 0 && v <= 11, `${w}: ${v}`); }
  }
  assert.ok(weighWord('2026', '', null) >= 80);
});
