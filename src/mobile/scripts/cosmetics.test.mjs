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
  // poses the rig plays (idle, the wave, asleep); no Rive input tints him yet, so only black
  assert.deepEqual(cos.shown(cos.dombiPoses).map((x) => x.id), ['sit', 'wave', 'sleep']);
  assert.deepEqual(cos.shown(cos.dombiTints).map((x) => x.id), ['black']);
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
test('profile colour and card colour read in light and dark: the name colour on the page and on every card, body text on every card', async () => {
  // the same palettes and the same lookColors() the app draws with
  const { lookColors } = await import('../src/data/profileLook.ts');
  const { makeThemes, brandColors, colourOf } = await import('../src/components/themeColors.ts');
  const { contrastRatio } = await import('../../core/showcase.js');
  const tokens = JSON.parse(fs.readFileSync(new URL('../../../design/system/tokens.json', import.meta.url), 'utf8'));
  const themes = makeThemes(tokens.color, tokens.color.app.english), named = brandColors(tokens.color, tokens.color.app.english);
  for (const dark of [false, true]) {
    const t = dark ? themes.dark : themes.light, colour = (name) => colourOf(name, t, named);
    for (const p of cos.profileColors) for (const k of cos.cardColors) {
      const look = lookColors({ color: p.id, cardColor: k.id }, dark, colour, cos);
      for (const bg of [t.bg, look.card]) assert.ok(contrastRatio(look.text, bg) >= 3, `${dark ? 'dark' : 'light'} ${p.id} on ${bg}`);
      assert.ok(contrastRatio(t.text, look.card) >= 4.5, `${dark ? 'dark' : 'light'} ink on ${k.id}`);
      assert.equal(look.fill, colour(p.color));
    }
  }
});
test("a new install keeps today's look: the name in the text ink and the cards as they were", async () => {
  const { lookColors } = await import('../src/data/profileLook.ts');
  const look = lookColors({ color: 'violet', cardColor: 'white' }, false, (n) => n ?? '', cos);
  assert.equal(look.name, undefined);
  assert.equal(look.custom, false);
  assert.ok(lookColors({ color: 'coral', cardColor: 'sky' }, false, (n) => n ?? '', cos).name && lookColors({ color: 'violet', cardColor: 'sky' }, false, (n) => n ?? '', cos).custom);
});
test('every part of the profile has its row in "Nimalar ko\'rinsin", in the default order', async () => {
  const { SECTION_IDS } = await import('../../core/profile.js');
  assert.deepEqual(cos.profileSections.map((x) => x.id), SECTION_IDS);
});
test('the app look picks are the ids src/core/look.js checks a stored look against', async () => {
  const look = await import('../../core/look.js');
  const ids = (list) => list.map((x) => x.id);
  assert.deepEqual(ids(cos.themes), look.THEME_IDS);
  assert.deepEqual(ids(cos.appIcons), look.APP_ICON_IDS);
  assert.deepEqual(ids(cos.lessonBackgrounds), look.LESSON_BACKGROUND_IDS);
  assert.deepEqual(ids(cos.pathSkins), look.PATH_SKIN_IDS);
});
