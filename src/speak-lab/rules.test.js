// node --test src/speak-lab/rules.test.js   (the page's pure rules and helpers, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pcmToBase64, base64ToPcm } from './audio.js';

test('pcm base64 round-trips', () => {
  const x = new Int16Array(1000); for (let i = 0; i < x.length; i++) x[i] = ((i * 7919) % 65536) - 32768;
  const y = base64ToPcm(pcmToBase64(x));
  assert.equal(y.length, x.length); assert.deepEqual(Array.from(y), Array.from(x));
});
