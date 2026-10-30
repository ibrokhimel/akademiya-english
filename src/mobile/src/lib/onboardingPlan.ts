import { lessons, units } from "../data/content";

/** A rough lesson length for the plan until lessons time themselves. */
export const LESSON_MINUTES = 6;
export const MINUTE_CHOICES = [5, 10, 15, 20] as const;
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
export const dayMonth = (date: Date) => `${date.getDate()}-${MONTHS[date.getMonth()]}`;

/** How many days the first unit and every unit take at a number of minutes a day, and the dates they end. */
export function planFor(minutes: number, now = new Date()) {
  const days = (count: number) => Math.max(1, Math.ceil((count * LESSON_MINUTES) / minutes));
  const after = (n: number) => { const date = new Date(now); date.setDate(date.getDate() + n); return date; };
  const unitDays = days(units[0].lessons.length + 1), allDays = days(lessons.length);
  return { unitDays, allDays, unitEnd: dayMonth(after(unitDays)), allEnd: dayMonth(after(allDays)) };
}
