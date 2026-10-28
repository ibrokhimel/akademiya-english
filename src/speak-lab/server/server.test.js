// node --test src/speak-lab/server/   (a fake gemini is injected; nothing reaches Google)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';

const fakeGemini = {
  calls: [],
  async token(constraints) { this.calls.push(['token', constraints]); return 'tok_123'; },
  async flash() { return '{}'; },
  async tts() { return ''; },
};

async function up(env = { GEMINI_API_KEY: 'k' }) {
  const server = createServer({ gemini: fakeGemini, env });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
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

test('missing key refuses /token with 503 in English JSON', async () => {
  const s = await up({});
  const r = await post(s.base, '/token', { pack: 'kind' });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, 'no key');
  await s.close();
});
