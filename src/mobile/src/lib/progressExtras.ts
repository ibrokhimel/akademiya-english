// The browser's presentation calculations, kept separate from the shared rules.
import { dayOf,streakOf } from "../../../core/progress.js";
import { units } from "../data/content";
import type { Event } from "./store";
export const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
export function shortDate(at: string) { const date = new Date(at); return `${date.getDate()}-${["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"][date.getMonth()]}`; }
export function longDate(at: string) { return `${shortDate(at)}, ${new Date(at).getFullYear()}`; }
export function profileFacts(events: Event[]) {
  const lessons = events.filter(e => e.type === "lesson").slice().sort((a, b) => a.at.localeCompare(b.at));
  const days = [...new Set(lessons.map(e => dayOf(e.at)))].sort();
  let best = 0, bestEnd = "", run = 0, previous = "", spoken = 0, minuteAt = "";
  for (const day of days) { const prior = new Date(day + "T12:00"); prior.setDate(prior.getDate() - 1); run = previous && dayOf(prior) === previous ? run + 1 : 1; previous = day; if (run >= best) { best = run; bestEnd = day; } }
  for (const lesson of lessons) { spoken += lesson.spokenMs || 0; if (!minuteAt && spoken >= 60000) minuteAt = lesson.at; }
  const levelIds = new Set(units.filter(u => u.checkpoint.levelUp).map(u => u.checkpoint.id));
  return { lessons, best, bestEnd, perfect: lessons.filter(e => !e.speechRetries && (e.mistakes === 0 || e.accuracy === 100)), early: lessons.filter(e => new Date(e.at).getHours() < 8), fixed: lessons.filter(e => (e.mistakes || 0) > 0), minutes: Math.floor(spoken / 60000), minuteAt, levelAt: lessons.find(e => e.id && levelIds.has(e.id))?.at, last: lessons.at(-1)?.at };
}
export function newestPhrases(events: Event[], limit = 3) {
  const all = Object.fromEntries(units.flatMap(u => u.lessons.map(l => [l.id, l]))), out: string[] = [], seen = new Set<string>();
  for (const event of events.filter(e => e.type === "lesson").slice().sort((a, b) => b.at.localeCompare(a.at))) {
    for (const id of all[event.id || ""]?.new || []) if (out.length < limit && !seen.has(id)) { seen.add(id); out.push(id); }
    if (out.length >= limit) break;
  }
  return out;
}
export function prediction(events: Event[], level: number) {
  if (level >= 1) return "";
  const lessons = events.filter((e) => e.type === "lesson"),
    n = new Set(lessons.map((e) => e.id)).size,
    active = new Set(lessons.map((e) => dayOf(e.at))).size;
  if (!n) return "1-daraja: —";
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil((18 - n) / (n / active)));
  return `1-daraja: ${date.getDate()}-${["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"][date.getMonth()]}`;
}
export function frozenDays(events: Event[]) {
  const lessons = events.filter((e) => e.type === "lesson"),
    days = [...new Set(lessons.map((e) => dayOf(e.at)))].sort().reverse(),
    result = new Set<string>(),
    weeks = new Set<string>();
  const take = (frozen: Set<string>) => {
    for (const day of frozen) {
      const date = new Date(day + "T12:00:00");
      date.setDate(date.getDate() - date.getDay());
      const week = dayOf(date);
      if (!weeks.has(week)) {
        weeks.add(week);
        result.add(day);
      }
    }
  };
  take(streakOf(lessons).frozen);
  for (const day of days)
    take(
      streakOf(
        lessons.filter((e) => dayOf(e.at) <= day),
        new Date(day + "T23:59:00"),
      ).frozen,
    );
  return result;
}
