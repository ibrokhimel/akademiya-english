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
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
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
/** The numbers the profile shows: the picked ones (in STAT_IDS order) that have a value now (`available`, a Set); none in private mode. */
export function statsToShow(profile, available) {
  const p = normalizeProfile(profile);
  if (p.stats.private) return [];
  return STAT_IDS.filter((id) => p.stats.shown.includes(id) && available.has(id));
}
