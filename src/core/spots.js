// Where Dombi sits in a lesson: the free place nearest to a point (owner, 2026-10-27: "he will go to the closest
// non occupying space"). No screens here.
//   pickSpot({ area, blocks, target, sizes?, gap?, step? }) -> { x, y, size } | null
// area: the box he may sit in; blocks: what the exercise shows there (never covered, kept `gap` away);
// target: the point his centre should be nearest to. He is 80 when that fits anywhere, else 48, else there is no spot.

/** @typedef {{ x: number, y: number, w: number, h: number }} Rect */

/** @param {{ area: Rect, blocks: Rect[], target: { x: number, y: number }, sizes?: number[], gap?: number, step?: number }} o */
export function pickSpot({ area, blocks, target, sizes = [80, 48], gap = 8, step = 4 }) {
  for (const size of sizes) {
    const free = (x, y) => !blocks.some((b) => x < b.x + b.w + gap && b.x - gap < x + size && y < b.y + b.h + gap && b.y - gap < y + size);
    const xs = steps(area.x, area.x + area.w - size, step), ys = steps(area.y, area.y + area.h - size, step);
    // The exact target place is tried first, so a drop on free ground stays where it landed.
    const exact = { x: clamp(target.x - size / 2, area.x, area.x + area.w - size), y: clamp(target.y - size / 2, area.y, area.y + area.h - size) };
    if (xs.length && ys.length && free(exact.x, exact.y)) return { ...exact, size };
    let best = null, far = Infinity;
    for (const y of ys) for (const x of xs) {
      if (!free(x, y)) continue;
      const d = Math.hypot(x + size / 2 - target.x, y + size / 2 - target.y);
      if (d < far) { far = d; best = { x, y, size }; }
    }
    if (best) return best;
  }
  return null;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function steps(from, to, step) {
  if (to < from) return [];
  const out = [];
  for (let v = from; v < to; v += step) out.push(v);
  out.push(to);
  return out;
}
