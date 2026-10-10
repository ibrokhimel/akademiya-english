// Dombi's talking mouths (visemes), from research/5-visemes.md §1.9: 10 shapes (+2 optional) that cover English,
// Uzbek and Russian. Same build as the mood mouths in dombi_rig.js: either one round-capped `line` (cubic segments)
// or one closed `fill` with 3 vertices + 6 control points -> maps 1:1 onto Rive's mouthLine / mouthShape.
// Run: node dombi_visemes.js -> visemes-sheet.svg (all shapes) + visemes-words.svg (example words)
const fs = require('fs');
const path = require('path');
const { C, pose } = require('./dombi_rig');

const seg = (...n) => [[n[0], n[1]], [n[2], n[3]], [n[4], n[5]], [n[6], n[7]]];
// D / lens: corners a (left) and b (right), bottom point c. sag > 0 bends the top edge down (smile slit),
// sag < 0 arches it up (lens). round 0..1 = how full the bottom is. tilt lifts the right corner (Dombi's side smile).
function dFill(cx, top, w, h, { sag = 0, round = 0.55, tilt = 2 } = {}) {
  const a = [cx - w / 2, top + tilt / 2], b = [cx + w / 2, top - tilt / 2], c = [cx, top + h];
  const k = round * 0.55 + 0.2;
  return { inner: true, verts: [a, b, c], c: [
    [a[0] + w / 3, a[1] + sag], [b[0] - w / 3, b[1] + sag],          // top edge a -> b
    [b[0], b[1] + h * k], [c[0] + w * 0.5 * k, c[1]],                 // b -> c
    [c[0] - w * 0.5 * k, c[1]], [a[0], a[1] + h * k]] };              // c -> a
}
function ovalFill(cx, cy, rx, ry) {   // 3-vertex ellipse (same construction as circleFill)
  const k = 4 / 3 * Math.tan(Math.PI / 6), th = [-90, 30, 150].map(d => d * Math.PI / 180);
  const v = th.map(t => [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  const out = th.map((t, i) => [v[i][0] - k * rx * Math.sin(t), v[i][1] + k * ry * Math.cos(t)]);
  const inn = th.map((t, i) => [v[i][0] + k * rx * Math.sin(t), v[i][1] - k * ry * Math.cos(t)]);
  return { inner: true, verts: v, c: [out[0], inn[1], out[1], inn[2], out[2], inn[0]] };
}

const VISEMES = [   // fills are INNER geometry: the 7 px stroke adds 3.5 px all round
  { id: 0, name: 'REST', sounds: 'silence', line: [seg(88, 127, 96, 131, 108, 131, 118, 119)] },     // = smirk A
  { id: 1, name: 'MBP', sounds: 'm b p', line: [seg(91, 128, 97, 129, 107, 129, 114, 127)] },
  { id: 2, name: 'FV', sounds: 'f v', fill: dFill(104, 125, 12, 2.5, { round: 0, tilt: 0.5 }) },                 // short, flat top
  { id: 3, name: 'TEETH', sounds: 't d n s z k g q x r', fill: dFill(103, 125.5, 28, 3.5, { sag: -2, round: 0.3, tilt: 2 }) },  // wide flat lens
  { id: 4, name: 'EE', sounds: 'i y (ee)', fill: dFill(103, 123.5, 32, 3, { sag: 3, round: 0.3, tilt: 3 }) },         // widest, corners up
  { id: 5, name: 'EH', sounds: 'e æ ə ʌ l · uz a', fill: dFill(103, 123, 26, 8, { round: 0.55, tilt: 2 }) },
  { id: 6, name: 'AA', sounds: 'a (ah)', fill: dFill(103, 121.5, 23, 15, { round: 0.75, tilt: 2 }) },
  { id: 7, name: 'OH', sounds: 'uz o · ru о · ɔ', fill: ovalFill(103, 128.5, 7, 4.8) },
  { id: 8, name: 'OO', sounds: "u w · uz o'", fill: ovalFill(103, 128.5, 2.8, 2.4) },
  { id: 9, name: 'SH_R', sounds: 'sh ch j · en r', fill: ovalFill(103, 128, 6, 1.8) },
  // th: lips relaxed and slightly apart, tongue tip between them -> small soft opening, top edge dips in the middle
  { id: 10, name: 'TH', sounds: 'th (θ ð)', fill: dFill(103, 124.5, 16, 5, { sag: 2.5, round: 0.5, tilt: 1 }) },
];

const OPTIONAL = [
  { id: 11, name: 'UH (optional)', sounds: 'lazy ə · ru reduced', fill: dFill(103, 125, 18, 3.5, { round: 0.6, tilt: 1.5 }) },
];

// ---- rendering ----
const mouthSvg = (m) => require('./mouth_geo').svgPath(m, '#fff');
function face(m) {
  const P = pose('smirk');
  const rect = (p, col) => `<rect x="${p.cx - p.w / 2}" y="${p.cy - p.h / 2}" width="${p.w}" height="${p.h}" rx="${p.r}" fill="${col}"/>`;
  return `<circle cx="100" cy="108" r="66" fill="${C.edge}"/><circle cx="100" cy="104" r="66" fill="${C.body}"/>${rect(P.eyeL, '#fff')}${rect(P.eyeR, '#fff')}${mouthSvg(m)}`;
}
const T = (x, y, s, size, col, w = 800, anchor = 'middle') => `<text x="${x}" y="${y}" font-family="Nunito,Arial" font-weight="${w}" font-size="${size}" fill="${col}" text-anchor="${anchor}">${s}</text>`;

function sheet() {
  const all = [...VISEMES, ...OPTIONAL], cell = 190, cols = 6, rows = Math.ceil(all.length / cols);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * (cell + 30)}"><rect width="100%" height="100%" fill="#fff"/>`;
  all.forEach((m, i) => {
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 30);
    s += `<rect x="${x + 5}" y="${y + 5}" width="${cell - 10}" height="${cell + 20}" rx="22" fill="${m.id > 9 ? '#F6F5FA' : '#EFEBFF'}"/>`
      + `<g transform="translate(${x + 30} ${y + 8}) scale(0.65)">${face(m)}</g>`
      + T(x + cell / 2, y + 160, `${m.id} · ${m.name}`, 15, '#2B2B3C', 900) + T(x + cell / 2, y + 180, m.sounds, 13, '#6E6E82', 700);
  });
  return s + '</svg>';
}
// example words as viseme strips (hand-picked sequences, the engine will compute these from text)
const WORDS = [['Hello', 'en', [3, 5, 5, 8, 0]], ['Salom', 'uz', [3, 6, 5, 7, 1, 0]], ['Привет', 'ru', [1, 3, 4, 5, 3, 0]],
  ['Rahmat', 'uz', [3, 6, 1, 6, 3, 0]], ['Thank you', 'en', [3, 5, 3, 3, 4, 8, 0]], ['Спасибо', 'ru', [3, 1, 6, 3, 4, 1, 7, 0]]];
function words() {
  const cell = 110, labelW = 140;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${labelW + 8 * cell}" height="${WORDS.length * (cell + 26) + 10}"><rect width="100%" height="100%" fill="#fff"/>`;
  WORDS.forEach(([w, lang, seq], r) => {
    const y = 8 + r * (cell + 26);
    s += T(12, y + cell / 2, w, 18, '#2B2B3C', 900, 'start') + T(12, y + cell / 2 + 20, lang, 13, '#6E6E82', 700, 'start');
    seq.forEach((v, i) => {
      const x = labelW + i * cell;
      s += `<rect x="${x + 3}" y="${y}" width="${cell - 6}" height="${cell + 20}" rx="14" fill="#EFEBFF"/><g transform="translate(${x + 8} ${y - 2}) scale(0.47)">${face(VISEMES[v])}</g>`
        + T(x + cell / 2, y + cell + 12, VISEMES[v].name, 11, '#6E6E82', 800);
    });
  });
  return s + '</svg>';
}

module.exports = { VISEMES, OPTIONAL, dFill, ovalFill };
if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, 'visemes-sheet.svg'), sheet(), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'visemes-words.svg'), words(), 'utf8');
  console.log('ok');
}
