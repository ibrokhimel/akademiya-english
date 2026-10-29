// What Dombi remembers, kept in this browser: the learner, the phrasebook. Seeded from the app's own saved answers when they exist.
const KEY = 'speak.profile';

export const emptyProfile = () => ({ name: '', goal: '', level: '', interests: [], mistakes: [], lastTalk: '', phrasebook: [], talks: 0, voice: '', pack: '', mic: 'auto' });

const parse = (s) => { try { return s == null ? null : JSON.parse(s); } catch { return null; } };
const LEVELS = { new: 'Zero' };                                     // the app's onboarding answer; "some" leaves the level to Dombi

// seedFromApp(profile, storage) -> profile: fills name, goal and level from the app's keys only where the profile is still blank
export function seedFromApp(profile, storage) {
  const p = { ...profile };
  const name = parse(storage.getItem('akademiya.name'));
  if (!p.name && typeof name === 'string') p.name = name;
  const events = parse(storage.getItem('akademiya.events'));
  const ob = Array.isArray(events) ? events.filter((e) => e && e.type === 'onboarding').pop() : null;
  if (ob) {
    if (!p.goal && ob.goal) p.goal = ob.goal === 'self' ? 'talk' : ob.goal;
    if (!p.level && LEVELS[ob.level]) p.level = LEVELS[ob.level];
  }
  return p;
}

export function loadProfile(storage = localStorage) { return seedFromApp({ ...emptyProfile(), ...(parse(storage.getItem(KEY)) || {}) }, storage); }
export function saveProfile(profile, storage = localStorage) { try { storage.setItem(KEY, JSON.stringify(profile)); } catch {} return profile; }
export function resetProfile(storage = localStorage) { try { storage.removeItem(KEY); } catch {} return emptyProfile(); }

// addPhrases(profile, [{ en, uz }]) -> profile: new phrases get today's date; a phrase already there (same English) is not added twice
export function addPhrases(profile, phrases) {
  const have = new Set(profile.phrasebook.map((x) => x.en.toLowerCase()));
  const date = new Date().toISOString().slice(0, 10), add = [];
  for (const ph of phrases) { const k = (ph.en || '').toLowerCase().trim(); if (!k || have.has(k)) continue; have.add(k); add.push({ en: ph.en.trim(), uz: (ph.uz || '').trim(), date }); }
  return { ...profile, phrasebook: [...profile.phrasebook, ...add] };
}
