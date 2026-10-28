// node --test src/speak-lab/server/   (a fake gemini is injected; nothing reaches Google)
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';

const servers = [];                                              // closed at the end even when an assertion throws, so a failure never hangs the run
after(() => Promise.all(servers.map((s) => new Promise((r) => s.close(r)))));

const fakeGemini = {
  calls: [],
  async token(constraints) { this.calls.push(['token', constraints]); return 'tok_123'; },
  async flash() { return '{}'; },
  async tts() { return ''; },
};

async function up(env = { GEMINI_API_KEY: 'k' }) {
  const server = createServer({ gemini: fakeGemini, env });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); servers.push(server);
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}
const post = (base, path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health reports the model', async () => {
  const s = await up();
  const r = await (await fetch(s.base + '/health')).json();
  assert.equal(r.ok, true); assert.equal(r.model, 'gemini-3.8-live');
  await s.close();
});

test('token returns the pack voice and the locked model', async () => {
  const s = await up(); fakeGemini.calls.length = 0;
  const r = await post(s.base, '/token', { pack: 'rude', topic: 'futbol' });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.token, 'tok_123'); assert.equal(j.model, 'gemini-3.8-live');
  assert.equal(j.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Zephyr');
  assert.deepEqual(j.config.responseModalities, ['AUDIO']);
  assert.equal(j.config.tools[0].functionDeclarations[0].name, 'set_mood');
  const [, constraints] = fakeGemini.calls[0];
  assert.equal(constraints.liveConnectConstraints.model, 'models/gemini-3.8-live');
  assert.equal(constraints.uses, 1);
  await s.close();
});

test('token refuses an unknown pack with 400', async () => {
  const s = await up();
  const r = await post(s.base, '/token', { pack: 'evil' });
  assert.equal(r.status, 400);
  await s.close();
});

test('system prompt holds the pack text and the learner\'s name and goal', async () => {
  const { buildSystemPrompt } = await import('./prompts.js');
  const p = buildSystemPrompt({ pack: 'rude', topic: 'futbol', profile: { name: 'Ibrohim', goal: 'ielts', level: 'Beginner', interests: ['football'], mistakes: [], lastTalk: '' } });
  assert.match(p, /ahmoq/);                       // the owner's rude example line
  assert.match(p, /Ibrohim/); assert.match(p, /ielts/i); assert.match(p, /futbol/);
  assert.match(p, /set_mood/); assert.match(p, /Tashkent/);
});

test('couple pack keeps romance for adults only when age is under 18', async () => {
  const { buildSystemPrompt } = await import('./prompts.js');
  const line = /never a boyfriend or girlfriend/;
  assert.match(buildSystemPrompt({ pack: 'couple', topic: '', profile: { age: 15 } }), line);
  assert.doesNotMatch(buildSystemPrompt({ pack: 'couple', topic: '', profile: { age: 25 } }), line);
  assert.doesNotMatch(buildSystemPrompt({ pack: 'couple', topic: '', profile: {} }), line);
});

test('unknown pack throws', async () => {
  const { buildSystemPrompt } = await import('./prompts.js');
  assert.throws(() => buildSystemPrompt({ pack: 'evil', topic: '', profile: {} }));
});

test('feedback returns the model\'s json and empty strings when the model says nothing', async () => {
  const s = await up();
  fakeGemini.flash = async (parts, opts) => { fakeGemini.calls.push(['flash', parts, opts]); return { better: 'I went to the bazaar yesterday.', pron: '', level: 'Beginner' }; };
  const body = { audio: 'AAAA', learnerText: 'yesterday I go bazaar', dombiText: 'Oh nice, what did you buy?', history: [], level: '' };
  let r = await post(s.base, '/feedback', body); assert.equal(r.status, 200);
  let j = await r.json(); assert.equal(j.better, 'I went to the bazaar yesterday.'); assert.equal(j.pron, ''); assert.equal(j.level, 'Beginner');
  const [, parts, opts] = fakeGemini.calls.at(-1); assert.equal(parts[0].inlineData.mimeType, 'audio/pcm;rate=16000'); assert.equal(opts.json, true);
  fakeGemini.flash = async () => ({});
  r = await post(s.base, '/feedback', body); j = await r.json(); assert.deepEqual(j, { better: '', pron: '', level: '' });
  await s.close();
});

test('explain returns uz text', async () => {
  const s = await up();
  fakeGemini.flash = async (parts, opts) => { fakeGemini.calls.push(['flash', parts, opts]); return "Bu yerda 'what did you buy' deb so'rayapti: nima sotib olding."; };
  const r = await post(s.base, '/explain', { line: 'What did you buy?', history: [{ who: 'learner', text: 'I go bazaar' }] });
  assert.equal(r.status, 200); assert.match((await r.json()).uz, /sotib olding/);
  const [, parts, opts] = fakeGemini.calls.at(-1); assert.match(parts[0].text, /What did you buy\?/); assert.equal(opts.json, undefined);
  await s.close();
});

test('slower returns base64 pcm', async () => {
  const s = await up();
  fakeGemini.tts = async (text, voice, style) => { fakeGemini.calls.push(['tts', text, voice, style]); return 'AAAAAAAA'; };
  const r = await post(s.base, '/slower', { line: 'Tell me more about the match.', voice: 'Zephyr' });
  assert.equal(r.status, 200); assert.equal((await r.json()).pcm, 'AAAAAAAA');
  const [, text, voice, style] = fakeGemini.calls.at(-1); assert.equal(text, 'Tell me more about the match.'); assert.equal(voice, 'Zephyr'); assert.match(style, /slow/i);
  await s.close();
});

test('report returns the model\'s json', async () => {
  const s = await up();
  fakeGemini.flash = async (parts, opts) => { fakeGemini.calls.push(['flash', parts, opts]); return { stars: 2, why: 'Yaxshi gaplashdingiz.', phrases: [{ en: 'I went to the bazaar', uz: 'Bozorga bordim' }], pron: ['th'], level: 'Beginner', profileUpdate: { interests: ['football'], mistakes: ['go → went'], lastTalk: 'Futbol haqida.' } }; };
  const r = await post(s.base, '/report', { transcript: [{ who: 'dombi', text: 'Salom!' }, { who: 'learner', text: 'yesterday I go bazaar' }], cards: [], profile: { name: 'Ibrohim' }, pack: 'kind', topic: 'futbol' });
  assert.equal(r.status, 200); const j = await r.json();
  assert.equal(j.stars, 2); assert.equal(j.phrases[0].uz, 'Bozorga bordim'); assert.deepEqual(j.profileUpdate.interests, ['football']);
  const [, parts, opts] = fakeGemini.calls.at(-1); assert.match(parts[0].text, /yesterday I go bazaar/); assert.equal(opts.json, true);
  await s.close();
});

test('log writes a folder and grows the ledger, and token refuses with 402 over budget', async () => {
  const { mkdtempSync, existsSync, readFileSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const { join } = await import('node:path');
  const logs = mkdtempSync(join(tmpdir(), 'speak-logs-'));
  const server = createServer({ gemini: fakeGemini, env: { GEMINI_API_KEY: 'k' }, logsDir: logs, budgetUsd: 1 });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); servers.push(server); const base = `http://127.0.0.1:${server.address().port}`;
  let r = await post(base, '/log', { id: 'abc', transcript: [{ who: 'dombi', text: 'Salom' }], cards: [], secIn: 600, secOut: 300, latencies: [800], interruptions: 1 });
  assert.equal(r.status, 200); const j = await r.json(); assert.ok(j.cost > 0); assert.ok(j.monthTotal >= j.cost);
  const folder = join(logs, j.folder); assert.ok(existsSync(join(folder, 'transcript.json'))); assert.ok(existsSync(join(folder, 'stats.json')));
  assert.equal(JSON.parse(readFileSync(join(logs, 'ledger.json'), 'utf8')).talks.length, 1);
  r = await post(base, '/log', { id: 'big', transcript: [], cards: [], secIn: 3600 * 50, secOut: 3600 * 50, latencies: [], interruptions: 0 });   // a huge talk pushes the month over $1
  r = await post(base, '/token', { pack: 'kind' }); assert.equal(r.status, 402); const b = await r.json(); assert.equal(b.reason, 'budget'); assert.equal(b.budget, 1); assert.ok(b.spent > 1);
});

test('missing key refuses /token with 503 in English JSON', async () => {
  const s = await up({});
  const r = await post(s.base, '/token', { pack: 'kind' });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, 'no key');
  await s.close();
});
