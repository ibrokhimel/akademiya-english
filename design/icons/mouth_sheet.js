// Every Dombi mood with Duolingo-style mouths (one round-capped stroke or one solid shape), per smirk option.
// Run: node mouth_sheet.js  -> mouth-sheet.svg
const fs = require('fs');
const path = require('path');
const { C, pose } = require('./dombi_rig');

const S = (d, w = 7) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const FILL = (d) => `<path d="${d}" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`;
const SMIRKS = {
  A: 'M88 127 C96 131 108 131 118 119', B: 'M90 127 C99 130 109 129 116 122', D: 'M84 126 C95 131 110 131 121 117',
  E: 'M95 128 C102 130 109 128 115 121',
};
SMIRKS.C = SMIRKS.A;
const extra = { C: S('M120 126 C121 129 121 131 120 133', 4) };
const MOUTH = {   // mouths that don't depend on the smirk option
  happy: S('M86 124 C93 133 109 133 117 122'),
  laugh: FILL('M84 121 L118 117 C120 128 112 138 101 137 C92 136 85 130 84 121 Z'),
  talk: FILL('M93 124 L111 122 C112 129 108 134 102 134 C97 134 93 130 93 124 Z'),
  listen: S('M100 128 C103 128 107 127 110 126'),
  think: S('M106 128 C110 126 113 126 117 128'),
  surprised: '<circle cx="101" cy="131" r="7" fill="#fff"/>',
  sleepy: S('M98 128 C101 129 104 129 107 127', 6),
  focus: S('M93 127 C99 127 105 127 110 126'),
  confused: S('M90 128 C95 124 99 124 103 128 C107 132 111 131 115 127'),
  oops: S('M86 128 C92 124 97 131 103 127 C109 123 114 130 119 126'),
};
const MOODS = ['smirk', 'wink', 'proud', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'focus', 'confused', 'oops'];

function rect(p, color) {
  if (!p.op) return '';
  const t = p.rot ? ` transform="rotate(${p.rot} ${p.cx} ${p.cy})"` : '';
  return `<rect x="${p.cx - p.w / 2}" y="${p.cy - p.h / 2}" width="${p.w}" height="${p.h}" rx="${p.r}" fill="${color}"${t}/>`;
}
function face(mood, opt) {
  const P = pose(mood), F = P.face;
  const mouth = ['smirk', 'wink', 'proud'].includes(mood) ? S(SMIRKS[opt]) + (extra[opt] || '') : MOUTH[mood];
  const zs = mood === 'sleepy' ? `<text x="150" y="58" font-family="Nunito,Arial" font-weight="900" font-size="22" fill="${C.hand}">z</text><text x="168" y="38" font-family="Nunito,Arial" font-weight="900" font-size="15" fill="${C.hand}">z</text>` : '';
  return `<circle cx="100" cy="108" r="66" fill="${C.edge}"/><circle cx="100" cy="104" r="66" fill="${C.body}"/>`
    + `<g transform="translate(${F.dx} ${F.dy}) rotate(${F.rot} 100 104)">${rect(P.eyeL, '#fff')}${rect(P.eyeR, '#fff')}${rect(P.lidL, C.body)}${rect(P.lidR, C.body)}${mouth}</g>${zs}`;
}

const cell = 150, labelW = 190;
const rows = [['A', 'A · swoosh'], ['B', 'B · soft smirk'], ['C', 'C · swoosh + dimple'], ['D', 'D · long sly'], ['E', 'E · short tilt']];
let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${labelW + MOODS.length * cell}" height="${(rows.length + 1) * cell + 20}"><rect width="100%" height="100%" fill="#fff"/>`;
MOODS.forEach((m, i) => s += `<text x="${labelW + i * cell + cell / 2}" y="22" font-family="Nunito,Arial" font-weight="800" font-size="15" fill="#6E6E82" text-anchor="middle">${m}</text>`);
rows.forEach(([opt, label], r) => {
  const y = 30 + r * cell;
  s += `<text x="12" y="${y + cell / 2 + 5}" font-family="Nunito,Arial" font-weight="900" font-size="16" fill="#2B2B3C">${label}</text>`;
  MOODS.forEach((m, i) => {
    const x = labelW + i * cell, varies = ['smirk', 'wink', 'proud'].includes(m);
    s += `<rect x="${x + 4}" y="${y + 4}" width="${cell - 8}" height="${cell - 8}" rx="18" fill="${varies ? '#EFEBFF' : '#F6F5FA'}"/>`
      + `<g transform="translate(${x + 15} ${y + 8}) scale(0.6)">${face(m, opt)}</g>`;
  });
});
s += `<text x="12" y="${30 + rows.length * cell + 30}" font-family="Nunito,Arial" font-weight="700" font-size="14" fill="#6E6E82">Violet cells change with the smirk option (smirk, wink, proud). Grey cells are the same in every row.</text>`;
fs.writeFileSync(path.join(__dirname, 'mouth-sheet.svg'), s + '</svg>', 'utf8');
console.log('ok');
