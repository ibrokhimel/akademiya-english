import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import * as cos from '../src/data/cosmetics.ts';
import { earnedItems } from '../../core/profile.js';

const lists = Object.entries(cos).filter(([, v]) => Array.isArray(v));
const assetKeys = new Set([...fs.readFileSync(new URL('../src/data/assets.ts', import.meta.url), 'utf8').split('export const pictures')[1].split('export const')[0].matchAll(/^ {2}"([^"]+)":/gm)].map((m) => m[1]));
const allEarned = earnedItems({ bestStreak: 365, perfectLessons: 10, minutesSpoken: 60, level: 5, unitsDone: Object.values(cos.unitSlugs), earlyLessons: 5 });

test('every list has unique ids and a label', () => {
  assert.ok(lists.length >= 19);
  for (const [name, list] of lists) {
    const keys = list.map((x) => (x.group ? x.group + '/' : '') + x.id);
    assert.equal(new Set(keys).size, keys.length, name);
    for (const x of list) assert.ok(typeof x.id === 'string' && x.label, name + ' ' + x.id);
  }
});
test('pictures exist in assets.ts and earned ids exist in core', () => {
  for (const [name, list] of lists) for (const x of list) {
    if (x.picture) assert.ok(assetKeys.has(x.picture), `${name} ${x.id}: ${x.picture}`);
    if (x.earnedBy) assert.ok(allEarned.has(x.earnedBy) || x.earnedBy === 'avatar.moving', `${name} ${x.id}: ${x.earnedBy}`);
  }
});
test('defaults of a new profile are in the catalogue', () => {
  const has = (list, id) => list.some((x) => x.id === id);
  assert.ok(has(cos.avatarColors, 'violet') && has(cos.avatarBackgrounds, 'plain') && has(cos.expressions, 'smile'));
  assert.ok(has(cos.frames, 'none') && has(cos.banners, 'violet') && has(cos.nameColors, 'default') && has(cos.nativeLanguages, 'uz'));
  assert.ok(has(cos.dombiItems, 'none') && has(cos.dombiPoses, 'sit') && has(cos.dombiTints, 'black') && has(cos.cardColors, 'white'));
  assert.ok(has(cos.profileColors, 'violet') && has(cos.backgrounds, 'plain') && has(cos.skinTones, '2'));
});
test('only none and doppi are ready for Dombi, and earned items need their id', () => {
  assert.deepEqual(cos.shown(cos.dombiItems).map((x) => x.id), ['none', 'doppi']);
  const frame = cos.frames.find((f) => f.id === 'streak30');
  assert.equal(cos.isOpen(frame, new Set()), false);
  assert.equal(cos.isOpen(frame, new Set(['frame.streak30'])), true);
  assert.equal(cos.isOpen(cos.frames.find((f) => f.id === 'gold'), new Set()), true);
});
test('every seasonal frame is in the catalogue and shown in the holidays section', async () => {
  const { SEASONAL_FRAMES } = await import('../../core/customize.js');
  for (const id of SEASONAL_FRAMES) assert.ok(cos.frames.some((f) => f.id === id && f.group === 'special'), id);
  assert.deepEqual(cos.shown(cos.frames).filter((f) => SEASONAL_FRAMES.includes(f.id)).map((f) => f.id), ['navruz', 'newyear', 'independence', 'ramadan']);
});
