// What the profile shows about the learner: name and about me, badges, stats. Pure logic, no app code.
import { STAT_IDS, USERNAME, normalizeProfile } from './profile.js';

// ---- Name and about me ----
/** What the username field keeps while the learner types: no @, lower case, only a-z 0-9 _, 20 at most. */
export function cleanUsername(text) {
  return (typeof text === 'string' ? text : '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}
/** The B1 rule: 3 to 20 of a-z 0-9 _. */
export const isUsername = (u) => typeof u === 'string' && USERNAME.test(u);

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/** birthday "MM-DD"; `date` in the phone's own time. A 29 February birthday is kept on the 28th in other years. */
export function birthdayOn(birthday, date) {
  if (typeof birthday !== 'string' || !/^\d\d-\d\d$/.test(birthday)) return false;
  const m = date.getMonth() + 1, d = date.getDate();
  if (birthday === '02-29' && !isLeap(date.getFullYear())) return m === 2 && d === 28;
  return birthday === `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/** The first open on the birthday, with the greeting on, once a year (`greetedYear` is the year it last ran). */
export function shouldGreetBirthday({ birthday, greet, now, greetedYear }) {
  return greet === true && birthdayOn(birthday, now) && greetedYear !== now.getFullYear();
}
export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
/** "03-12" -> "12-mart" ("" for anything that is not MM-DD). */
export function birthdayLabel(birthday) {
  if (typeof birthday !== 'string' || !/^(0[1-9]|1[0-2])-\d\d$/.test(birthday)) return '';
  return `${Number(birthday.slice(3))}-${MONTHS[Number(birthday.slice(0, 2)) - 1]}`;
}
/** Whether a part of the profile (SECTION_IDS) is shown; the order and the switches come from look.sections. */
export function shows(profile, id) {
  const p = normalizeProfile(profile);
  return p.look.sections.find((s) => s.id === id)?.shown ?? false;
}

// ---- Dombi ----
export { dombiName } from './profile.js';
// Poses the rig can play, as the moments that already play them (src/core/dombi.js). "read" has no Rive art yet (Ruling 3).
const POSE_MOMENTS = { sit: 'idle', wave: 'glad', sleep: 'night' };
/** The Dombi moment for his pose on the Profile tab; an unknown pose sits. */
export function poseMoment(pose) {
  return POSE_MOMENTS[pose] ?? 'idle';
}

// ---- Badges ----
/** Pin or unpin a badge; 3 at most, so a fourth is refused. */
export function togglePin(pinned, id, max = 3) {
  const list = Array.isArray(pinned) ? pinned : [];
  if (list.includes(id)) return list.filter((x) => x !== id);
  return list.length >= max ? list : [...list, id];
}
/** badges = [{ id, goal, earned }]. The rarest is the earned one with the biggest goal (until there are numbers from all learners). */
export function rarestBadge(badges) {
  let best = null;
  for (const b of Array.isArray(badges) ? badges : []) if (b.earned && (!best || b.goal > best.goal)) best = b;
  return best ? best.id : null;
}
/** The trophy shelf in the learner's order: saved ids that still exist, then any others in their own order. */
export function shelfOrder(saved, ids) {
  const out = [];
  for (const id of [...(Array.isArray(saved) ? saved : []), ...ids]) if (ids.includes(id) && !out.includes(id)) out.push(id);
  return out;
}
/** The list with `id` moved to `index`. */
export function moveTo(list, id, index) {
  if (!list.includes(id)) return list;
  const rest = list.filter((x) => x !== id);
  rest.splice(Math.max(0, Math.min(index, rest.length)), 0, id);
  return rest;
}

// ---- Stats ----
/** The numbers the profile shows: the picked ones (in the order picked) that have a value now (`available`, a Set); none in private mode. */
export function statsToShow(profile, available) {
  const p = normalizeProfile(profile);
  if (p.stats.private) return [];
  return p.stats.shown.filter((id) => available.has(id));
}
/** The picked stats after a switch: turned on goes last, turned off comes out (unknown ids are ignored). */
export function toggleStat(shown, id, on) {
  if (!STAT_IDS.includes(id)) return shown;
  const rest = shown.filter((x) => x !== id);
  return on ? [...rest, id] : rest;
}

// ---- Look: colours, background, what shows ----
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast of two "#RRGGBB" colours (1 to 21); NaN for anything else. Large bold text needs 3, body text 4.5. */
export function contrastRatio(a, b) {
  const hex = /^#[0-9a-f]{6}$/i;
  if (!hex.test(a) || !hex.test(b)) return NaN;
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
