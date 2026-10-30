// "What Dombi remembers": the profile in plain words, the phrasebook, and the delete buttons (the privacy control).
// memoryScreen(root, profile, { onChange(profile), onBack })
import { COPY } from './copy.js';
import { emptyProfile } from './profile.js';

export function memoryScreen(root, profile, { onChange, onBack }) {
  const row = (label, value) => (value ? `<div class="mrow"><span class="ml">${label}</span><span class="mv">${value}</span></div>` : '');
  const empty = !profile.name && !profile.goal && !profile.interests.length && !profile.mistakes.length && !profile.phrasebook.length && !profile.talks;
  root.innerHTML = `
    <div class="memory">
      <h2>${COPY.memoryTitle}</h2>
      ${empty ? `<p class="why">${COPY.memEmpty}</p>` : ''}
      ${row(COPY.memName, profile.name)}${row(COPY.memGoal, profile.goal)}${row(COPY.memLevel, profile.level)}
      ${row(COPY.memInterests, profile.interests.join(', '))}${row(COPY.memMistakes, profile.mistakes.join(' · '))}${row(COPY.memLast, profile.lastTalk)}${row(COPY.memTalks, profile.talks ? String(profile.talks) : '')}
      <div class="lbl">${COPY.phrasebook}</div>
      <ul class="plist book">${profile.phrasebook.map((p, i) => `<li data-i="${i}"><b>${p.en}</b><span>${p.uz}</span><button class="del">${COPY.deleteOne}</button></li>`).join('')}</ul>
      <div class="rbtns"><div class="p3d btn secondary back"><div class="face">${COPY.back}</div></div><div class="p3d btn danger wipe"><div class="face">${COPY.deleteAll}</div></div></div>
    </div>`;
  root.querySelectorAll('.del').forEach((b) => b.addEventListener('click', () => { const i = +b.closest('li').dataset.i; const next = { ...profile, phrasebook: profile.phrasebook.filter((_, k) => k !== i) }; onChange(next); memoryScreen(root, next, { onChange, onBack }); }));
  root.querySelector('.wipe').onclick = () => { if (confirm(COPY.deleteAllAsk)) { onChange(emptyProfile()); memoryScreen(root, emptyProfile(), { onChange, onBack }); } };
  root.querySelector('.back').onclick = onBack;
  window.SPEAK = Object.assign(window.SPEAK || {}, { screen: 'memory' });
}
