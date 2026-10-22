export function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function localDay(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
type Input = {
  time: string | null; now: Date; days: number; completed: string[]; copies: readonly string[];
  resume?: string; checkpoint?: string; streak?: number; learned?: readonly string[];
};
export function reminderPlan(input: Input) {
  if (!input.time || !validTime(input.time) || !input.copies.length) return [];
  const [hour, minute] = input.time.split(":").map(Number);
  const completed = new Set(input.completed.map(localDay));
  const result: { identifier: string; at: Date; body: string; url: string }[] = [];
  for (let i = 0; i < input.days; i++) {
    const at = new Date(input.now);
    at.setDate(at.getDate() + i);
    at.setHours(hour, minute, 0, 0);
    if (at <= input.now || completed.has(localDay(at))) continue;
    const ordinal = Math.floor(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) / 86400000);
    let body = input.copies[ordinal % input.copies.length], url = "/(tabs)";
    if (input.learned?.length && ordinal % 4 === 0)
      body = `“${input.learned[ordinal % input.learned.length]}” — inglizcha aytib ko'rasizmi?`;
    if (i === 0 && input.resume) {
      body = "Boshlagan darsingiz saqlangan. Qolganini tugatamizmi?";
      url = `/lesson/${input.resume}`;
    } else if (i === 0 && input.checkpoint) {
      body = "Bo'limdagi iboralarni o'rgandingiz. Endi birga ishlatib ko'ramizmi?";
      url = `/lesson/${input.checkpoint}`;
    } else if (i === 0 && [6, 13, 29].includes(input.streak || 0))
      body = `${input.streak} kun mashq qildingiz. Bugun yana bitta dars qilamizmi?`;
    result.push({ identifier: `practice-${localDay(at)}`, at, body, url });
  }
  return result;
}
export function reminderDestination(value: unknown, lessonIDs: readonly string[]): string {
  if (typeof value !== "string") return "/(tabs)";
  const id = /^\/lesson\/([lc]\d+)$/.exec(value)?.[1];
  return id && lessonIDs.includes(id) ? `/lesson/${id}` : "/(tabs)";
}
