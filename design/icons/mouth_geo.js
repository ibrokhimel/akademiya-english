// Single-shape mouth model (2026-10-11, fixes the "flash" between talking shapes).
// Every mouth — mood or viseme — is ONE closed path with 3 free vertices (a left, b right, c bottom) carrying a white
// fill AND a 7 px round-joined white stroke:
//   closed mouth = zero-area path that retraces a curve (a→b on top, b→c→a back along the same curve); the stroke draws
//                  it as a 7 px line with round ends (the 180° turns at a and b become round caps)
//   open mouth   = a D / oval; the stroke rounds it and adds 3.5 px all round
// So any mouth morphs into any other by moving 3 points: no line/fill crossfade, no dot-collapse.
// Fill geometry given as "inner" (already allowing for the stroke) is used as is; other fills are inset by the stroke.
const STROKE = 7;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function split(p0, p1, p2, p3) {   // one cubic -> two cubics at t = 0.5
  const a = lerp(p0, p1, .5), b = lerp(p1, p2, .5), c = lerp(p2, p3, .5), d = lerp(a, b, .5), e = lerp(b, c, .5), m = lerp(d, e, .5);
  return [[p0, a, d, m], [m, e, c, p3]];
}
const evalCubic = ([p0, p1, p2, p3], t) => { const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };

// Fit ONE cubic (endpoints fixed) to a 1-2 segment curve — least squares on 48 samples, chord-length parameters.
function fitCubic(segs) {
  if (segs.length === 1) return segs[0];
  const pts = []; for (const s of segs) for (let i = 0; i < 24; i++) pts.push(evalCubic(s, i / 24)); pts.push(segs[segs.length - 1][3]);
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const T = d.map(x => x / d[d.length - 1]), P0 = pts[0], P3 = pts[pts.length - 1];
  let a11 = 0, a12 = 0, a22 = 0, bx1 = 0, bx2 = 0, by1 = 0, by2 = 0;
  pts.forEach((q, i) => { const t = T[i], u = 1 - t, A1 = 3 * u * u * t, A2 = 3 * u * t * t;
    const rx = q[0] - u * u * u * P0[0] - t * t * t * P3[0], ry = q[1] - u * u * u * P0[1] - t * t * t * P3[1];
    a11 += A1 * A1; a12 += A1 * A2; a22 += A2 * A2; bx1 += A1 * rx; bx2 += A2 * rx; by1 += A1 * ry; by2 += A2 * ry; });
  const det = a11 * a22 - a12 * a12;
  const C1 = [(bx1 * a22 - bx2 * a12) / det, (by1 * a22 - by2 * a12) / det], C2 = [(a11 * bx2 - a12 * bx1) / det, (a11 * by2 - a12 * by1) / det];
  return [P0, C1, C2, P3];
}

// -> [{p, in, out}] for vertices a, b, c (absolute coords in the 200-space)
function shapeOf(m) {
  if (m.line) {
    const top = fitCubic(m.line), [first, second] = split(...top);
    return [{ p: top[0], in: first[1], out: top[1] }, { p: top[3], in: top[2], out: second[2] }, { p: first[3], in: second[1], out: first[2] }];
  }
  let { verts: v, c } = m.fill;
  if (!m.fill.inner) {   // inset by the stroke so the visible size stays the drawn size
    const xs = v.map(q => q[0]), ys = v.map(q => q[1]), W = Math.max(...xs) - Math.min(...xs), H = Math.max(...ys) - Math.min(...ys);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const sx = Math.max(0.1, (W - STROKE) / W), sy = Math.max(0.1, (H - STROKE) / H);
    const f = (q) => [cx + (q[0] - cx) * sx, cy + (q[1] - cy) * sy];
    v = v.map(f); c = c.map(f);
  }
  return [{ p: v[0], in: c[5], out: c[0] }, { p: v[1], in: c[1], out: c[2] }, { p: v[2], in: c[3], out: c[4] }];
}
const f2 = (n) => +n.toFixed(2), pt = (q) => `${f2(q[0])} ${f2(q[1])}`;
function svgPath(m, color = '#FFFFFF') {
  const [a, b, c] = shapeOf(m);
  return `<path d="M${pt(a.p)} C${pt(a.out)} ${pt(b.in)} ${pt(b.p)} C${pt(b.out)} ${pt(c.in)} ${pt(c.p)} C${pt(c.out)} ${pt(a.in)} ${pt(a.p)}Z" fill="${color}" stroke="${color}" stroke-width="${STROKE}" stroke-linejoin="round"/>`;
}
module.exports = { STROKE, shapeOf, svgPath, fitCubic, split };
