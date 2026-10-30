import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyRecognition, recognitionResult, finishedRecognition } from '../src/lib/recognition.ts';
import { speechOptions } from '../src/lib/speechOptions.ts';

const event = (text, isFinal) => ({ isFinal, results: [{transcript:text}] });
test('a live matching guess followed by a different final word grades the final word', () => {
  let state = recognitionResult(emptyRecognition(), event('hello', false));
  assert.equal(state.transcript, 'hello');
  assert.deepEqual(finishedRecognition(state).alts, []);
  state = recognitionResult(state, event('yellow', true));
  assert.deepEqual(finishedRecognition(state).alts, ['yellow']);
});
test('network failure, abort and ending without a final result cannot pass partial speech', () => {
  const partial = recognitionResult(emptyRecognition(), event('hello', false));
  for (const error of [undefined, 'network', 'aborted', 'no-speech'])
    assert.deepEqual(finishedRecognition(partial, error).alts, []);
  const final = recognitionResult(partial, event('hello', true));
  assert.deepEqual(finishedRecognition(final, 'network').alts, []);
  assert.deepEqual(finishedRecognition(final).alts, ['hello']);
});
test('late interim results cannot replace a completed transcript', () => {
  const final = recognitionResult(emptyRecognition(), event('good morning', true));
  assert.deepEqual(recognitionResult(final, event('good', false)), final);
  assert.deepEqual(finishedRecognition(emptyRecognition()).alts, []);
});
test('live text grows and can revise words before any final answer is available', () => {
  let state = emptyRecognition();
  for (const text of ['good', 'good mourning', 'good morning']) {
    state = recognitionResult(state, event(text, false));
    assert.equal(state.transcript, text);
    assert.equal(state.final, false);
    assert.deepEqual(finishedRecognition(state).alts, []);
  }
  state = recognitionResult(state, event('Good morning!', true));
  assert.deepEqual(finishedRecognition(state).alts, ['Good morning!']);
});
test('short Android exercises request short-word recognition and live text without final-only word metadata', () => {
  const short = speechOptions('android', 35, 'Hello!');
  assert.equal(short.interimResults, true);
  assert.equal(short.androidIntentOptions.EXTRA_LANGUAGE_MODEL, 'web_search');
  assert.equal(speechOptions('android', 35, 'Good morning!').androidIntentOptions.EXTRA_LANGUAGE_MODEL, 'web_search');
  assert.equal(short.androidIntentOptions.EXTRA_REQUEST_WORD_TIMING, false);
  assert.equal(short.androidIntentOptions.EXTRA_REQUEST_WORD_CONFIDENCE, false);
  assert.equal(speechOptions('android', 35, 'A coffee, please.').androidIntentOptions.EXTRA_LANGUAGE_MODEL, 'free_form');
  assert.equal(speechOptions('android', 32, 'Hi').androidIntentOptions.EXTRA_REQUEST_WORD_TIMING, undefined);
  assert.equal(speechOptions('ios', 18, 'Hi').androidIntentOptions, undefined);
});
