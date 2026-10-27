// How the app looks (screen lAk24 "Ilova ko'rinishi"): light / dark / like the phone, the colour theme, the text size,
// and the other app-wide picks. Plain rules that need no phone; the palettes live in design/system/tokens.json.
import { contrastRatio } from './showcase.js';

export const MODES = ['light', 'dark', 'system'];

/** The stored mode; an install from before modes had only `dark: true|false`, which becomes 'dark' or 'light'. */
export function modeOf(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  if (MODES.includes(s.mode)) return s.mode;
  return s.dark === true ? 'dark' : 'light';
}

/** True when the app draws dark: the dark mode, or "like the phone" while the phone is dark (`scheme` from useColorScheme). */
export function isDarkMode(mode, scheme) {
  return mode === 'dark' || (mode === 'system' && scheme === 'dark');
}

/** MATN O'LCHAMI: Kichik, O'rta, Katta, Juda katta. */
export const TEXT_SIZES = [
  { id: 'small', scale: 0.9 },
  { id: 'medium', scale: 1 },
  { id: 'large', scale: 1.15 },
  { id: 'huge', scale: 1.3 },
];
export function textScale(id) {
  return TEXT_SIZES.find((s) => s.id === id)?.scale ?? 1;
}

// Ids of the picks; data/cosmetics.ts holds their labels and stand-ins (scripts/cosmetics.test.mjs keeps the two in step).
export const THEME_IDS = ['violet', 'pomegranate', 'lagoon', 'apricot', 'cotton', 'night'];
export const APP_ICON_IDS = ['main', 'doppi', 'gold', 'night'];
export const LESSON_BACKGROUND_IDS = ['plain', 'pattern', 'city'];
export const PATH_SKIN_IDS = ['road', 'bazaar', 'caravan', 'metro'];

/** The palette of theme `id` (tokens.json `color.themes`) for light or dark; an unknown id is Binafsha. */
export function themePalette(themes, id, dark) {
  const mode = themes[dark ? 'dark' : 'light'];
  return mode[id] ?? mode[THEME_IDS[0]];
}

/** Text on an accent fill: white while it reads at 3:1 or better (bold button text), else the ink. */
export function accentInk(main, ink) {
  return contrastRatio('#FFFFFF', main) >= 3 ? '#FFFFFF' : ink;
}

/** A new install: today's look (Binafsha, the plain lesson page, today's tab bar with the name under the open tab only). */
export function defaultAppLook() {
  return {
    theme: 'violet',
    icon: 'main',
    lessonBackground: { kind: 'item', id: 'plain', uri: null },
    pathSkin: 'road',
    textSize: 'medium',
    dyslexiaFont: false,
    tabLabels: false,
  };
}

/** A stored look with every field checked; anything missing or unknown takes the default. */
export function normalizeAppLook(saved) {
  const d = defaultAppLook();
  const s = saved && typeof saved === 'object' ? saved : {};
  const pick = (value, ids, fallback) => (ids.includes(value) ? value : fallback);
  const bg = s.lessonBackground && typeof s.lessonBackground === 'object' ? s.lessonBackground : {};
  const lessonBackground = bg.kind === 'media' && typeof bg.uri === 'string' && bg.uri
    ? { kind: 'media', id: 'plain', uri: bg.uri }
    : bg.kind === 'item' && LESSON_BACKGROUND_IDS.includes(bg.id) ? { kind: 'item', id: bg.id, uri: null } : d.lessonBackground;
  return {
    theme: pick(s.theme, THEME_IDS, d.theme),
    icon: pick(s.icon, APP_ICON_IDS, d.icon),
    lessonBackground,
    pathSkin: pick(s.pathSkin, PATH_SKIN_IDS, d.pathSkin),
    textSize: pick(s.textSize, TEXT_SIZES.map((t) => t.id), d.textSize),
    dyslexiaFont: typeof s.dyslexiaFont === 'boolean' ? s.dyslexiaFont : d.dyslexiaFont,
    tabLabels: typeof s.tabLabels === 'boolean' ? s.tabLabels : d.tabLabels,
  };
}
