// Dombi rig model: one source of truth for expressions (SVG previews, Rive rig, Pencil components).
// Coordinates are the 200x200 space of build_pet_cool.py. Every part is a rounded rect / circle by its centre.
// Run: node dombi_rig.js  -> writes characters-dombi/*.svg + dombi-expressions.svg (sheet)
const fs = require('fs');
const path = require('path');

const C = { body: '#2B2B3C', edge: '#17171F', eye: '#FFFFFF', hand: '#45455A' };

// Base pose = locked Dombi (tall eyes, smirk, no hands).
const BASE = {
  eyeL: { cx: 75, cy: 95, w: 18, h: 34, r: 9, rot: 0, op: 1 },
  eyeR: { cx: 125, cy: 95, w: 18, h: 34, r: 9, rot: 0, op: 1 },
  lidL: { cx: 75, cy: 70, w: 30, h: 16, r: 0, rot: 0, op: 0 },   // body-coloured, cuts into the eye
  lidR: { cx: 125, cy: 70, w: 30, h: 16, r: 0, rot: 0, op: 0 },
  mouth: { cx: 104, cy: 127.5, w: 26, h: 7, r: 3.5, rot: 0, op: 1 },  // smirk bar
  tickR: { cx: 113.5, cy: 124.5, w: 7, h: 13, r: 3.5, rot: 0, op: 1 }, // right corner up
  tickL: { cx: 94.5, cy: 124.5, w: 7, h: 13, r: 3.5, rot: 0, op: 0 },  // left corner up (smile)
  mouthO: { cx: 102, cy: 128, w: 16, h: 12, r: 6, rot: 0, op: 0 },     // open mouth
  handL: { cx: 26, cy: 120, s: 0 },
  handR: { cx: 174, cy: 120, s: 0 },
  z1: { cx: 160, cy: 52, s: 0, op: 0 },
  z2: { cx: 178, cy: 30, s: 0, op: 0 },
  face: { rot: 0, dx: 0, dy: 0 },   // tilt/shift the whole face
  root: { dy: 0, sx: 1, sy: 1 },    // jump + squash (from the bottom centre)
};

const smile = { mouth: { cx: 100, w: 30 }, tickR: { cx: 111.5, cy: 126, h: 10 }, tickL: { op: 1, cx: 88.5, cy: 126, h: 10 } };
const noMouth = { mouth: { op: 0 }, tickR: { op: 0 }, tickL: { op: 0 } };
const flat = (cx, w, extra = {}) => ({ mouth: { cx, w, ...extra }, tickR: { op: 0 }, tickL: { op: 0 } });
const lines = (cy = 100, w = 22) => ({ eyeL: { cy, w, h: 6, r: 3 }, eyeR: { cy, w, h: 6, r: 3 } });

// Expressions (overrides on BASE). Cool, not kawaii: no blush, no ∩ eyes, no tongue, never a sad face.
const EXPR = {
  'smirk': {},
  'happy': { eyeL: { h: 26, cy: 98 }, eyeR: { h: 26, cy: 98 }, ...smile },
  'laugh': { eyeL: { w: 22, h: 12, r: 6, cy: 96 }, eyeR: { w: 22, h: 12, r: 6, cy: 96 }, ...noMouth,
             mouthO: { op: 1, cx: 100, cy: 128, w: 34, h: 20, r: 10 } },
  'talk': { ...noMouth, mouthO: { op: 1, cx: 102, cy: 128, w: 20, h: 15, r: 7.5 } },
  'listen': { eyeL: { w: 20, h: 38, r: 10, cx: 79, cy: 93 }, eyeR: { w: 20, h: 38, r: 10, cx: 129, cy: 93 },
              ...flat(106, 12), face: { rot: 8 } },
  'think': { eyeL: { cx: 69, cy: 88 }, eyeR: { cx: 119, cy: 91, h: 26 }, ...flat(112, 14) },
  'surprised': { eyeL: { w: 22, h: 40, r: 11, cy: 92 }, eyeR: { w: 22, h: 40, r: 11, cy: 92 }, ...noMouth,
                 mouthO: { op: 1, cx: 100, cy: 131, w: 14, h: 14, r: 7 } },
  'sleepy': { ...lines(101), ...flat(102, 10), face: { rot: -6 }, z1: { s: 1, op: 1 }, z2: { s: 0.7, op: 1 } },
  'wink': { eyeL: { cy: 98, w: 22, h: 6, r: 3, rot: -8 }, mouth: { w: 30, cx: 102 }, tickR: { cx: 113.5 } },
  'proud': { lidL: { op: 1, cy: 81 }, lidR: { op: 1, cy: 81 } },
  'focus': { lidL: { op: 1, cy: 80, rot: 14 }, lidR: { op: 1, cy: 80, rot: -14 }, ...flat(100, 18) },
  'confused': { eyeL: { h: 26, cy: 99 }, eyeR: { w: 20, h: 40, r: 10, cy: 92 }, ...flat(102, 20, { rot: -10 }),
                face: { rot: -5 } },
  'oops': { eyeL: { cx: 69 }, eyeR: { cx: 119 }, ...noMouth,
            mouthO: { op: 1, cx: 98, cy: 128, w: 28, h: 10, r: 5 }, face: { rot: 4 } },
};

// Gesture poses = expression + hands (hands hidden by default).
const POSES = {
  'wave': ['happy', { handR: { s: 1, cx: 182, cy: 66 } }],
  'celebrate': ['laugh', { handL: { s: 1, cx: 26, cy: 52 }, handR: { s: 1, cx: 174, cy: 52 } }],
  'thinking': ['think', { handR: { s: 1, cx: 132, cy: 146 } }],
  'point': ['smirk', { handR: { s: 1, cx: 184, cy: 112 } }],
};

// Mouths, Duolingo style (picked option A, 2026-10-10): one round-capped stroke (`line`: 1-2 cubic segments
// [p0, c1, c2, p3]) or one closed fill (`fill`: 3 vertices a,b,c + 6 control points for a->b, b->c, c->a).
// Asymmetric and off-centre like Duolingo's mouths. The old bar parts (mouth/ticks/mouthO) are no longer drawn.
const seg = (...n) => [[n[0], n[1]], [n[2], n[3]], [n[4], n[5]], [n[6], n[7]]];
const SMIRK_A = [seg(88, 127, 96, 131, 108, 131, 118, 119)];
// Default face since 2026-10-15 (owner: "use a normal face"): a centred, even smile. Wink and proud keep the smirk.
const SMILE = [seg(85, 122, 92.5, 130, 107.5, 130, 115, 122)];
function circleFill(cx, cy, r) {   // 3-vertex circle
  const k = r * 4 / 3 * Math.tan(Math.PI / 6), th = [-90, 30, 150].map(d => d * Math.PI / 180);
  const v = th.map(t => [cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  const out = th.map((t, i) => [v[i][0] - k * Math.sin(t), v[i][1] + k * Math.cos(t)]);
  const inn = th.map((t, i) => [v[i][0] + k * Math.sin(t), v[i][1] - k * Math.cos(t)]);
  return { verts: v, c: [out[0], inn[1], out[1], inn[2], out[2], inn[0]] };
}
const MOUTHS = {
  smirk: { line: SMILE }, wink: { line: SMIRK_A }, proud: { line: SMIRK_A },
  happy: { line: [seg(86, 124, 93, 133, 109, 133, 117, 122)] },
  listen: { line: [seg(100, 128, 103, 128, 107, 127, 110, 126)] },
  think: { line: [seg(106, 128, 110, 126, 113, 126, 117, 128)] },
  sleepy: { line: [seg(98, 128, 101, 129, 104, 129, 107, 127)] },
  focus: { line: [seg(93, 127, 99, 127, 105, 127, 110, 126)] },
  confused: { line: [seg(90, 128, 95, 124, 99, 124, 103, 128), seg(103, 128, 107, 132, 111, 131, 115, 127)] },
  oops: { line: [seg(86, 128, 92, 124, 97, 131, 103, 127), seg(103, 127, 109, 123, 114, 130, 119, 126)] },
  laugh: { fill: { verts: [[84, 121], [118, 117], [101, 137]], c: [[84, 121], [118, 117], [120, 128], [112, 138], [92, 136], [85, 130]] } },
  talk: { fill: { verts: [[93, 124], [111, 122], [102, 134]], c: [[93, 124], [111, 122], [112, 129], [108, 134], [97, 134], [93, 130]] } },
  surprised: { fill: circleFill(101, 131, 7) },
};

function pose(name) {
  let [expr, extra] = POSES[name] || [name, {}];
  const out = JSON.parse(JSON.stringify(BASE));
  for (const ov of [EXPR[expr], extra]) for (const [k, v] of Object.entries(ov)) Object.assign(out[k], v);
  for (const p of Object.values(out)) if ('r' in p) p.r = Math.min(p.r, p.w / 2, p.h / 2);
  out.mouthDef = MOUTHS[expr];
  return out;
}

// ---------- SVG renderer ----------
const f = (n) => +n.toFixed(2);
function rect(p, color) {
  if (!p.op) return '';
  const t = p.rot ? ` transform="rotate(${p.rot} ${f(p.cx)} ${f(p.cy)})"` : '';
  return `<rect x="${f(p.cx - p.w / 2)}" y="${f(p.cy - p.h / 2)}" width="${p.w}" height="${p.h}" rx="${f(p.r)}" fill="${color}"${t}/>`;
}
function hand(p) {
  if (!p.s) return '';
  const r = 14 * p.s;
  return `<circle cx="${p.cx}" cy="${p.cy + 3}" r="${r}" fill="${C.edge}"/><circle cx="${p.cx}" cy="${p.cy}" r="${r}" fill="${C.hand}"/>`;
}
function zee(p) {  // Z from 3 rounded bars, 18px tall at s=1
  if (!p.s || !p.op) return '';
  const k = p.s, w = 16 * k, t = 4.5 * k;
  return `<g transform="translate(${p.cx} ${p.cy})" fill="${C.hand}">`
    + `<rect x="${-w / 2}" y="${-9 * k}" width="${w}" height="${t}" rx="${t / 2}"/>`
    + `<rect x="${-w / 2}" y="${9 * k - t}" width="${w}" height="${t}" rx="${t / 2}"/>`
    + `<rect x="${-t / 2}" y="${-10 * k}" width="${t}" height="${20 * k}" rx="${t / 2}" transform="rotate(42)"/></g>`;
}
const mouthSvg = (m) => require('./mouth_geo').svgPath(m, C.eye);   // single-shape model (fill + 7 px stroke)
function svgBody(P) {
  const fc = P.face, rt = P.root;
  const face = ['lidL', 'lidR'].map(k => rect(P[k], C.body));
  const feats = ['eyeL', 'eyeR'].map(k => rect(P[k], C.eye)).join('') + face.join('')
    + mouthSvg(P.mouthDef);
  return `<g transform="translate(0 ${rt.dy}) translate(100 170) scale(${rt.sx} ${rt.sy}) translate(-100 -170)">`
    + `<circle cx="100" cy="108" r="66" fill="${C.edge}"/><circle cx="100" cy="104" r="66" fill="${C.body}"/>`
    + `<g transform="translate(${fc.dx} ${fc.dy}) rotate(${fc.rot} 100 104)">${feats}</g></g>`
    + hand(P.handL) + hand(P.handR) + zee(P.z1) + zee(P.z2);
}
const svg = (P) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">${svgBody(P)}</svg>\n`;

function main() {
  const dir = path.join(__dirname, 'characters-dombi');
  fs.mkdirSync(dir, { recursive: true });
  const names = [...Object.keys(EXPR), ...Object.keys(POSES).map(n => 'pose-' + n)];
  for (const n of names) fs.writeFileSync(path.join(dir, `${n}.svg`), svg(pose(n.replace('pose-', ''))));
  const cell = 210, cols = 6, rows = Math.ceil(names.length / cols);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}"><rect width="100%" height="100%" fill="#fff"/>`;
  names.forEach((n, i) => {
    const gx = (i % cols) * cell, gy = Math.floor(i / cols) * cell;
    s += `<rect x="${gx + 5}" y="${gy + 5}" width="${cell - 10}" height="${cell - 10}" rx="22" fill="#EFEBFF"/>`
      + `<g transform="translate(${gx + 30} ${gy + 14}) scale(0.75)">${svgBody(pose(n.replace('pose-', '')))}</g>`
      + `<text x="${gx + cell / 2}" y="${gy + cell - 18}" font-family="Nunito,Arial" font-weight="800" font-size="15" fill="#6E6E82" text-anchor="middle">${n}</text>`;
  });
  fs.writeFileSync(path.join(__dirname, 'dombi-expressions.svg'), s + '</svg>');
  console.log(names.join(' '));
}

module.exports = { C, BASE, EXPR, POSES, MOUTHS, SMIRK_A, pose };
if (require.main === module) main();
