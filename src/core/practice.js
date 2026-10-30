// What each Practice activity plays, picked from the lessons the learner has finished (spec: "When Speak and Practice open").
// No screens here. Practice never writes a lesson event, so it never counts toward the streak.
//   practiceItems(kind, units, done, { n, rand }) -> items for the lesson player ('catch' | 'overheard' | 'fixit')
//   practiceCounts(units, done) -> { catch, overheard, fixit, match }: how much each activity has to play
//   matchPool(units, done, P) -> the phrases Match rush pairs up
// done: a Set (or object) of finished lesson ids.

const isDone = (done, id) => (done instanceof Set ? done.has(id) : !!done[id]);
const finished = (units, done) => units.flatMap((u) => [...u.lessons, u.checkpoint]).filter((l) => isDone(done, l.id));
// A checkpoint repeats some of its unit's lesson items: each item is kept once.
const keyOf = (i) => i.ex + ':' + (i.p ?? i.en ?? (i.talk ? JSON.stringify(i.talk) : i.right));
const itemsOf = (units, done, ex) => { const seen = new Set();
  return finished(units, done).flatMap((l) => l.items).filter((i) => i.ex === ex && !seen.has(keyOf(i)) && seen.add(keyOf(i))); };
export function shuffle(list, rand = Math.random) { const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a; }

export const MIN = { catch: 1, overheard: 1, fixit: 1, match: 4 };

export function practiceItems(kind, units, done, { n, rand = Math.random } = {}) {
  if (kind === 'catch') return shuffle(itemsOf(units, done, 'tiles'), rand).slice(0, n ?? 5).map((i) => ({ ...i, listen: true }));
  if (kind === 'overheard') return shuffle(itemsOf(units, done, 'heard'), rand).slice(0, n ?? 5);
  if (kind === 'fixit')   // X1 find the mistake, then X4 say a different sentence fixed, in turn
    return shuffle(itemsOf(units, done, 'fix'), rand).slice(0, n ?? 6)
      .map((i, k) => (k % 2 === 0 ? i : { ex: 'say', fix: true, wrong: i.words.join(' '), right: i.right, ctx: i.ctx, trap: i.trap }));
  throw new Error(`unknown practice kind: ${kind}`);
}

export function matchPool(units, done, P) {
  const ids = [...new Set(finished(units, done).flatMap((l) => l.new || []))];
  return ids.map((id) => P[id]).filter(Boolean);
}

export function practiceCounts(units, done) {
  return { catch: itemsOf(units, done, 'tiles').length, overheard: itemsOf(units, done, 'heard').length, fixit: itemsOf(units, done, 'fix').length,
    match: [...new Set(finished(units, done).flatMap((l) => l.new || []))].length };
}
