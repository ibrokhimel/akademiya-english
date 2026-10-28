// node --test src/speak-lab/rules.test.js   (the page's pure rules and helpers, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pcmToBase64, base64ToPcm } from './audio.js';
import { nextReconnect, topicsFor, shouldAskFeedback, silenceStage } from './rules.js';

test('silenceStage gives remark at 50 s, whisper at 110 s, none again right after a nudge', () => {
  const c = { SILENCE_REMARK_MS: 50000, SILENCE_WHISPER_MS: 110000 };
  assert.equal(silenceStage({ quietMs: 20000, stage: 'none', dombiTalking: false }, c), 'none');
  assert.equal(silenceStage({ quietMs: 50000, stage: 'none', dombiTalking: false }, c), 'remark');
  assert.equal(silenceStage({ quietMs: 70000, stage: 'remark', dombiTalking: false }, c), 'none');
  assert.equal(silenceStage({ quietMs: 110000, stage: 'remark', dombiTalking: false }, c), 'whisper');
  assert.equal(silenceStage({ quietMs: 200000, stage: 'whisper', dombiTalking: false }, c), 'none');
  assert.equal(silenceStage({ quietMs: 60000, stage: 'none', dombiTalking: true }, c), 'none');
});
import { CFG } from './config.js';

test('shouldAskFeedback is false under three words', () => {
  assert.equal(shouldAskFeedback('yes', CFG), false); assert.equal(shouldAskFeedback('I go', CFG), false);
  assert.equal(shouldAskFeedback('I go bazaar', CFG), true); assert.equal(shouldAskFeedback('  ', CFG), false);
});
import { seedFromApp, addPhrases, emptyProfile } from './profile.js';

const mem = (o) => ({ getItem: (k) => (k in o ? o[k] : null) });

test('seedFromApp maps self to talk and keeps a saved name', () => {
  // the app keeps JSON values: the name as a JSON string, the goal and level inside the onboarding event
  const app = { 'akademiya.name': '"Ibrohim"', 'akademiya.events': JSON.stringify([{ type: 'onboarding', goal: 'self', level: 'new' }, { type: 'lesson', id: 'l1' }]) };
  const p = seedFromApp(emptyProfile(), mem(app));
  assert.equal(p.name, 'Ibrohim'); assert.equal(p.goal, 'talk'); assert.equal(p.level, 'Zero');
  const kept = seedFromApp({ ...emptyProfile(), name: 'Aziz', goal: 'ielts', level: 'Beginner' }, mem(app));
  assert.equal(kept.name, 'Aziz'); assert.equal(kept.goal, 'ielts'); assert.equal(kept.level, 'Beginner');
  assert.equal(seedFromApp(emptyProfile(), mem({ 'akademiya.name': 'broken{' })).name, '');
});

test('addPhrases does not duplicate a phrase', () => {
  let p = addPhrases(emptyProfile(), [{ en: 'I went to the bazaar', uz: 'Bozorga bordim' }]);
  p = addPhrases(p, [{ en: 'I went to the bazaar', uz: 'Bozorga bordim' }, { en: 'See you', uz: "Ko'rishguncha" }]);
  assert.equal(p.phrasebook.length, 2); assert.ok(p.phrasebook.every((x) => x.date));
});

test('topicsFor puts the goal cards first', () => {
  const t = topicsFor('ielts'); assert.equal(t[0].goal, 'ielts'); assert.ok(t.some((c) => c.id === 'football'));
  assert.ok(topicsFor('talk').every((c) => !c.goal)); assert.ok(topicsFor('').every((c) => !c.goal));
});

test('reconnect policy gives up after two failures', () => {
  assert.equal(nextReconnect(0), 500); assert.equal(nextReconnect(1), 1500); assert.equal(nextReconnect(2), null);
});

test('pcm base64 round-trips', () => {
  const x = new Int16Array(1000); for (let i = 0; i < x.length; i++) x[i] = ((i * 7919) % 65536) - 32768;
  const y = base64ToPcm(pcmToBase64(x));
  assert.equal(y.length, x.length); assert.deepEqual(Array.from(y), Array.from(x));
});
