// What the profile shows about the learner: name and about me, badges, stats. Pure logic, no app code.
import { USERNAME, normalizeProfile } from './profile.js';

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
