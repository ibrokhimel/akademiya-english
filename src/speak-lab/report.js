// The report after a talk: stars with one line, the phrases kept, pronunciation notes, Dombi's level guess.
// reportScreen(root, report, { onAgain, onStart, onRetry })   report = { stars, why, phrases, pron, level, failed }
import { COPY } from './copy.js';

export function reportScreen(root, report, { onAgain, onStart, onRetry }) {
  const stars = [1, 2, 3].map((i) => `<span class="star${i <= report.stars ? ' on' : ''}">★</span>`).join('');
  const li = (s) => `<li>${s}</li>`;
  root.innerHTML = `
    <div class="report">
      <h2>${COPY.reportTitle}</h2>
      <div class="stars">${stars}</div>
      <p class="why">${report.why || ''}</p>
      ${report.failed ? `<div class="p3d btn primary retry"><div class="face">${COPY.retry}</div></div>` : ''}
      ${report.phrases.length ? `<div class="lbl">${COPY.phrases}</div><ul class="plist">${report.phrases.map((p) => li(`<b>${p.en}</b><span>${p.uz}</span>`)).join('')}</ul>` : ''}
      ${report.pron.length ? `<div class="lbl">${COPY.pron}</div><ul class="plist pron">${report.pron.map(li).join('')}</ul>` : ''}
      ${report.level ? `<p class="lvl">${COPY.levelGuess}: <b>${report.level}</b></p>` : ''}
      <div class="rbtns"><div class="p3d btn primary again"><div class="face">${COPY.again}</div></div><div class="p3d btn secondary home"><div class="face">${COPY.home}</div></div></div>
    </div>`;
  root.querySelector('.again').onclick = onAgain; root.querySelector('.home').onclick = onStart;
  const r = root.querySelector('.retry'); if (r) r.onclick = onRetry;
  window.SPEAK = Object.assign(window.SPEAK || {}, { screen: 'report', report });
}
