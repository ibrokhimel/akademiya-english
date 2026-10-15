// What the learner has done, worked out from the list of things that happened (the events). No screens here.
//   progressOf(units, events, { now, openAll })  ->  the path (which lesson is done, current or locked), phrases, level, streak
// Rules (docs/ideas/progress-system.md, gamification.md): lessons open one after another; a unit's checkpoint opens when its five
// lessons are done, and the next unit when the checkpoint is passed. Streak = days in a row with at least one lesson; one free
// freeze a week (weeks start on Sunday) covers a missed day by itself. Level = the highest "levelUp" of a passed checkpoint.

// the local calendar day of a moment, as "2026-10-14"
export const dayOf = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const shift = (day, n) => { const [y, m, d] = day.split('-').map(Number); return dayOf(new Date(y, m - 1, d + n)); };
const weekday = (day) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d).getDay(); };      // 0 = Sunday
const weekOf = (day) => shift(day, -weekday(day));                                                                      // the Sunday the week starts on

export function streakOf(events, now = new Date()) {
  const days = new Set(events.filter((e) => e.type === 'lesson').map((e) => dayOf(e.at))), today = dayOf(now), first = [...days].sort()[0];
  const todayDone = days.has(today), used = new Set();
  let count = 0, frozen = new Set();
  // day by day from the first lesson, as it happens: a missed day takes the week's freeze if there is one, otherwise the streak starts again
  for (let d = first; first && d <= today; d = shift(d, 1)) {
    if (days.has(d)) { count++; continue; }
    if (d === today) break;                                                // today still counts as alive until it is over
    const wk = weekOf(d); if (count && !used.has(wk)) { used.add(wk); frozen.add(d); continue; }
    count = 0; frozen = new Set();
  }
  // this week, Sunday first: what each dot shows
  const sun = weekOf(today), week = [...Array(7)].map((_, i) => { const day = shift(sun, i);
    return { day, state: days.has(day) ? 'done' : frozen.has(day) ? 'frozen' : day === today ? 'today' : 'none' }; });
  return { count, today: todayDone, frozen, week };
}

export function progressOf(units, events, { now = new Date(), openAll = false } = {}) {
  const done = {}; for (const e of events) if (e.type === 'lesson') done[e.id] = done[e.id] || e;
  const order = units.flatMap((u) => [...u.lessons, u.checkpoint]);
  const current = (order.find((l) => !done[l.id]) || {}).id || null;
  const state = (id) => done[id] ? 'done' : id === current ? 'cur' : 'locked';
  const open = (id) => openAll || state(id) !== 'locked';
  const phrases = units.flatMap((u) => u.lessons).filter((l) => done[l.id]).reduce((n, l) => n + (l.new || []).length, 0);
  const level = Math.max(0, ...units.map((u) => u.checkpoint).filter((c) => done[c.id] && c.levelUp).map((c) => c.levelUp));
  // the unit to show first: the one with the current lesson (the last one when everything is done)
  const unit = current ? units.find((u) => [...u.lessons, u.checkpoint].some((l) => l.id === current)).unit : units[units.length - 1].unit;
  return { done, current, state, open, phrases, level, unit, streak: streakOf(events, now) };
}
