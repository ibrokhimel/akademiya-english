// node --test src/core/look.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MODES, modeOf, isDarkMode, TEXT_SIZES, textScale, THEME_IDS, themePalette, accentInk, defaultAppLook, normalizeAppLook } from './look.js';
import { contrastRatio } from './showcase.js';

const tokens = JSON.parse(fs.readFileSync(new URL('../../design/system/tokens.json', import.meta.url), 'utf8'));

test('the light/dark switch becomes a mode once, on load', () => {
  assert.deepEqual(MODES, ['light', 'dark', 'system']);
  assert.equal(modeOf({ dark: true }), 'dark');
  assert.equal(modeOf({ dark: false }), 'light');
  assert.equal(modeOf({}), 'light');
  assert.equal(modeOf(undefined), 'light');
  // a stored mode wins over an old dark flag left beside it
  assert.equal(modeOf({ mode: 'system', dark: true }), 'system');
  assert.equal(modeOf({ mode: 'light', dark: true }), 'light');
  assert.equal(modeOf({ mode: 'sepia', dark: true }), 'dark');
});

test('"Telefondagidek" follows the phone; the others ignore it', () => {
  assert.equal(isDarkMode('dark', 'light'), true);
  assert.equal(isDarkMode('light', 'dark'), false);
  assert.equal(isDarkMode('system', 'dark'), true);
  assert.equal(isDarkMode('system', 'light'), false);
  assert.equal(isDarkMode('system', null), false);
  assert.equal(isDarkMode('system', undefined), false);
});

test('text size steps are x0.9, x1, x1.15 and x1.3; anything else is x1', () => {
  assert.deepEqual(TEXT_SIZES.map((s) => [s.id, s.scale]), [['small', 0.9], ['medium', 1], ['large', 1.15], ['huge', 1.3]]);
  assert.equal(textScale('small'), 0.9);
  assert.equal(textScale('huge'), 1.3);
  assert.equal(textScale('giant'), 1);
  assert.equal(textScale(undefined), 1);
});

test('every theme has a light and a dark palette in tokens.json; Binafsha is today\'s palette', () => {
  assert.deepEqual(THEME_IDS, ['violet', 'pomegranate', 'lagoon', 'apricot', 'cotton', 'night']);
  for (const mode of ['light', 'dark'])
    for (const id of THEME_IDS) {
      const p = tokens.color.themes[mode][id];
      assert.ok(p, `${mode} ${id}`);
      assert.deepEqual(Object.keys(p).sort(), Object.keys(tokens.color.app.english).sort(), `${mode} ${id}`);
      for (const v of Object.values(p)) assert.match(v, /^#[0-9A-F]{6}$/, `${mode} ${id}`);
    }
  assert.deepEqual(tokens.color.themes.light.violet, tokens.color.app.english);
  // today's dark wash and wash line (components/themeColors.ts before themes)
  assert.deepEqual(tokens.color.themes.dark.violet, { ...tokens.color.app.english, wash: '#26214A', washLine: '#463C85' });
});

test('a theme id finds its palette; an unknown one falls back to Binafsha', () => {
  const t = tokens.color.themes;
  assert.equal(themePalette(t, 'lagoon', false), t.light.lagoon);
  assert.equal(themePalette(t, 'lagoon', true), t.dark.lagoon);
  assert.equal(themePalette(t, 'neon', false), t.light.violet);
  assert.equal(themePalette(t, undefined, true), t.dark.violet);
});

test('text on the accent is white unless white reads badly there; it is never below 3:1', () => {
  const ink = tokens.color.light.ink;
  assert.equal(accentInk('#7B5CFF', ink), '#FFFFFF');
  assert.equal(accentInk('#FFFFFF', ink), ink);
  for (const mode of ['light', 'dark'])
    for (const id of THEME_IDS) {
      const main = tokens.color.themes[mode][id].main;
      assert.ok(contrastRatio(accentInk(main, ink), main) >= 3, `${mode} ${id}`);
    }
});

test('a new install keeps today\'s look; a stored look is checked field by field', () => {
  const d = defaultAppLook();
  assert.deepEqual(d, { theme: 'violet', icon: 'main', lessonBackground: { kind: 'item', id: 'plain', uri: null }, pathSkin: 'road', textSize: 'medium', dyslexiaFont: false, tabLabels: false });
  assert.deepEqual(normalizeAppLook(undefined), d);
  assert.deepEqual(normalizeAppLook('x'), d);
  const n = normalizeAppLook({ theme: 'night', icon: 'gold', lessonBackground: { kind: 'media', id: 'plain', uri: 'file:///p/a.jpg' }, pathSkin: 'metro', textSize: 'huge', dyslexiaFont: true, tabLabels: true });
  assert.deepEqual(n, { theme: 'night', icon: 'gold', lessonBackground: { kind: 'media', id: 'plain', uri: 'file:///p/a.jpg' }, pathSkin: 'metro', textSize: 'huge', dyslexiaFont: true, tabLabels: true });
  const bad = normalizeAppLook({ theme: 'neon', icon: 7, lessonBackground: { kind: 'media', id: 'plain', uri: null }, pathSkin: '', textSize: 'giant', dyslexiaFont: 'yes', tabLabels: 1 });
  assert.deepEqual(bad, d);
  // an unknown catalogue id falls back, a known one stays
  assert.deepEqual(normalizeAppLook({ lessonBackground: { kind: 'item', id: 'city' } }).lessonBackground, { kind: 'item', id: 'city', uri: null });
  assert.deepEqual(normalizeAppLook({ lessonBackground: { kind: 'item', id: 'moon' } }).lessonBackground, d.lessonBackground);
  // the default is a fresh object each time
  assert.notEqual(defaultAppLook().lessonBackground, defaultAppLook().lessonBackground);
});
