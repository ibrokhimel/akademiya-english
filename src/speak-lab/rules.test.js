// node --test src/speak-lab/rules.test.js   (the page's pure rules and helpers, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pcmToBase64, base64ToPcm } from './audio.js';
import { nextReconnect, topicsFor, shouldAskFeedback, silenceStage, emptyReport, mergeProfile, estimateCost, moodFor, sendMic, cleanCaption, captionHtml } from './rules.js';

test('moodFor reads the mood off his words', () => {
  assert.equal(moodFor('Ha-ha, that was actually funny bro.'), 'laugh'); assert.equal(moodFor('Wow! No way!'), 'surprised');
  assert.equal(moodFor('Hmm... let me think.'), 'think'); assert.equal(moodFor('Zo\'r! You nailed it, proud of you.'), 'proud');
  assert.equal(moodFor('Oops, my bad.'), 'oops'); assert.equal(moodFor('Tell me about your day.'), 'happy'); assert.equal(moodFor(''), 'happy');
  assert.equal(moodFor('FINALLY! There it is.'), 'proud'); assert.equal(moodFor('Are you kidding me?'), 'surprised');
});

test('sendMic gates the mic while Dombi talks', () => {
  const c = { MIC_FLOOR: 6, BARGE_IN_FLOOR: 22 };
  assert.equal(sendMic({ amp: 3, dombiTalking: false }, c), true);        // his silence: everything goes, Gemini decides what is speech
  assert.equal(sendMic({ amp: 10, dombiTalking: true }, c), false);       // his voice through the speakers must not cut him off
  assert.equal(sendMic({ amp: 30, dombiTalking: true }, c), true);        // the learner really talking over him does
});

test('estimateCost multiplies seconds by price', () => {
  const price = { inPerSec: 0.0001, outPerSec: 0.0005 };
  assert.equal(estimateCost(100, 20, price), 0.02); assert.equal(estimateCost(0, 0, price), 0);
});

test('emptyReport has zero stars and no phrases', () => {
  const r = emptyReport('silent');
  assert.equal(r.stars, 0); assert.deepEqual(r.phrases, []); assert.deepEqual(r.pron, []); assert.match(r.why, /gapirmadingiz/); assert.equal(r.failed, false);
  assert.equal(emptyReport('failed').failed, true);
});

test('mergeProfile unions and caps', () => {
  const p = { ...emptyProfile(), interests: ['football'], mistakes: ['go → went'], talks: 2, lastTalk: 'old' };
  const m = mergeProfile(p, { interests: ['football', 'K-pop'], mistakes: Array.from({ length: 25 }, (_, i) => 'm' + i), lastTalk: 'new', level: 'Beginner' });
  assert.deepEqual(m.interests, ['football', 'K-pop']); assert.equal(m.mistakes.length, 20); assert.equal(m.mistakes[0], 'go → went');
  assert.equal(m.lastTalk, 'new'); assert.equal(m.level, 'Beginner'); assert.equal(m.talks, 3); assert.equal(p.talks, 2);
});

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

// live.js with a stub SDK: one goAway → exactly one new socket; nothing reopens after close(); a socket that never opens → a timely error
const stubSdk = (behaviour = {}) => {
  const log = { connects: 0, sessions: [] };
  log.sdk = { GoogleGenAI: class { constructor() { this.live = { connect: async ({ config, callbacks }) => {
    log.connects++; if (behaviour.hang) return new Promise(() => {});
    const s = { closed: false, handle: config.sessionResumption && config.sessionResumption.handle, sendRealtimeInput() {}, sendClientContent() {}, sendToolResponse() {}, close() { if (s.closed) return; s.closed = true; setTimeout(() => callbacks.onclose({ reason: 'closed' }), 0); } };
    s.callbacks = callbacks; log.sessions.push(s); setTimeout(() => callbacks.onopen(), 0); return s; } }; } } };
  return log;
};
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

test('one goAway opens one resumed session and nothing reopens after close', async () => {
  const { connectLive } = await import('./live.js');
  const log = stubSdk(), closes = [];
  const s = await connectLive({ pack: 'kind', handlers: { onClose: (r) => closes.push(r) }, sdk: log.sdk, getToken: async () => ({ token: 't', model: 'm', config: {} }), waits: [1, 1] });
  await tick(5);
  log.sessions[0].callbacks.onmessage({ sessionResumptionUpdate: { resumable: true, newHandle: 'h1' } });
  log.sessions[0].callbacks.onmessage({ goAway: { timeLeft: '1s' } });
  await tick(40);
  assert.equal(log.connects, 2); assert.equal(log.sessions[1].handle, 'h1'); assert.equal(log.sessions[0].closed, true);
  s.close(); await tick(10);
  log.sessions[1].callbacks.onmessage({ goAway: {} }); log.sessions[1].callbacks.onclose({ reason: 'x' }); await tick(40);
  assert.equal(log.connects, 2); assert.deepEqual(closes, []);
});

test('a socket that never opens gives an error within the timeout', async () => {
  const { connectLive } = await import('./live.js');
  const log = stubSdk({ hang: true }); const t0 = Date.now();
  await assert.rejects(connectLive({ pack: 'kind', handlers: {}, sdk: log.sdk, getToken: async () => ({ token: 't', model: 'm', config: {} }), connectTimeoutMs: 50 }), /timeout/);
  assert.ok(Date.now() - t0 < 1000);
});

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

test('cleanCaption drops tags in brackets and angle brackets', () => {
  assert.equal(cleanCaption('[smirk] That is my brave jonim!'), 'That is my brave jonim!');
  assert.equal(cleanCaption('<speaker_set_mood>{mood: think}</speaker_set_mood><speaker_audio>Chernobyl, again?'), 'Chernobyl, again?');
  assert.equal(cleanCaption('Choir. KWAI-er. [laughs] Go on.'), 'Choir. KWAI-er. Go on.');
  assert.equal(cleanCaption('no tags here'), 'no tags here');
  assert.equal(cleanCaption('Okay [smi'), 'Okay');                     // a tag still arriving shows nothing past its bracket
});

test('cleanCaption drops stars, underscores and stage-direction brackets, keeps real brackets', () => {
  assert.equal(cleanCaption('Wow *jumps* that is it'), 'Wow that is it');
  assert.equal(cleanCaption('so _shrugs_ fine'), 'so fine');
  assert.equal(cleanCaption('Ha (laughs) okay'), 'Ha okay');
  assert.equal(cleanCaption('(clears throat) Right.'), 'Right.');
  assert.equal(cleanCaption('Say it (in Uzbek) now'), 'Say it (in Uzbek) now');
  assert.equal(cleanCaption('a half tag *jum'), 'a half tag');          // still arriving: hidden until it closes
  assert.equal(cleanCaption('[jump] go'), 'go');                         // today's rules stay
  assert.equal(cleanCaption('then (dance) we go'), 'then we go');       // a catalog id in brackets is a stage direction too
});

test('captionHtml shows his words up to the one playing, that one lit, HTML escaped', () => {
  assert.equal(captionHtml([{ text: 'Hi', punct: ',' }, { text: '<b>', punct: '' }], 1), 'Hi, <span class="now">&lt;b&gt;</span>');
  assert.equal(captionHtml([{ text: 'Hi', punct: ',' }, { text: 'you', punct: '.' }], 0), '<span class="now">Hi,</span>');
  assert.equal(captionHtml([{ text: 'Hi', punct: '' }], -1), '');
});
