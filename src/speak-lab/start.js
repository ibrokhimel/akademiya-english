// The start page: pick a topic card or type one, pick Dombi's personality, start.
// startPage(root, { profile, onStart({ pack, voice, mic, topic, topicName }), onMemory() })
import { PACKS, VOICES } from './config.js';
import { COPY } from './copy.js';
import { topicsFor } from './rules.js';
import { makePlayer, base64ToPcm } from './audio.js';
import { side } from './talk.js';

export function startPage(root, { profile, onStart, onMemory }) {
  const voice0 = VOICES.some((v) => v.id === profile.voice) ? profile.voice : VOICES[0].id, pack0 = PACKS.some((p) => p.id === profile.pack) ? profile.pack : PACKS[0].id, mic0 = profile.mic === 'hold' ? 'hold' : 'auto';
  const cards = topicsFor(profile.goal), mine = cards.filter((c) => c.goal), rest = cards.filter((c) => !c.goal);
  const card = (c) => `<div class="tcard p3d" data-id="${c.id}"><div class="face"><span class="em">${c.emoji}</span><span>${c.name}</span></div></div>`;
  root.innerHTML = `
    <div class="start">
      <h1>${COPY.startTitle}</h1>
      ${mine.length ? `<div class="lbl">${COPY.forGoal}</div><div class="tgrid">${mine.map(card).join('')}</div>` : ''}
      <div class="lbl">${COPY.justTalk}</div><div class="tgrid">${rest.map(card).join('')}</div>
      <input class="own" placeholder="${COPY.ownTopic}" maxlength="80">
      <div class="lbl">${COPY.pack}</div>
      <div class="packs">${PACKS.map((p) => `<button class="pk${p.id === pack0 ? ' on' : ''}" data-id="${p.id}">${p.name}</button>`).join('')}</div>
      <div class="lbl">${COPY.voice}</div>
      <div class="voices">${VOICES.map((v) => `<div class="vc${v.id === voice0 ? ' on' : ''}" data-id="${v.id}"><span class="vw">${v.who}</span><b>${v.name}</b><button class="listen" title="${v.id}">${COPY.listen}</button></div>`).join('')}</div>
      <div class="lbl">${COPY.micMode}</div>
      <div class="mics">${[['auto', COPY.micAuto], ['hold', COPY.micHold]].map(([id, name]) => `<button class="mc${id === mic0 ? ' on' : ''}" data-id="${id}">${name}</button>`).join('')}</div>
      <div class="p3d btn primary go disabled"><div class="face">${COPY.start}</div></div>
      <a class="memlink" href="#memory">${COPY.memoryLink}</a>
    </div>`;
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  let chosen = null, pack = pack0, voice = voice0, mic = mic0, player = null;
  $$('.vc').forEach((el) => el.addEventListener('click', () => { voice = el.dataset.id; $$('.vc').forEach((x) => x.classList.toggle('on', x === el)); }));
  // "Tinglash": one sample line in that voice, from the server's TTS
  $$('.vc .listen').forEach((b) => b.addEventListener('click', async (e) => { e.stopPropagation(); const v = b.closest('.vc').dataset.id; b.disabled = true;
    try { player ||= makePlayer(); const { pcm } = await side('say', { voice: v }); if (pcm) { player.clear(); player.push(base64ToPcm(pcm)); } } catch (err) { console.warn('say', err.message); } b.disabled = false; }));
  const go = $('.go'), own = $('.own');
  const ready = () => { const ok = !!chosen || own.value.trim().length > 1; go.classList.toggle('disabled', !ok); go.classList.toggle('primary', ok); };
  $$('.tcard').forEach((el) => el.addEventListener('click', () => { $$('.tcard').forEach((x) => x.classList.toggle('sel', x === el)); chosen = cards.find((c) => c.id === el.dataset.id); own.value = ''; ready(); }));
  own.addEventListener('input', () => { if (own.value.trim()) { chosen = null; $$('.tcard').forEach((x) => x.classList.remove('sel')); } ready(); });
  $$('.pk').forEach((b) => b.addEventListener('click', () => { pack = b.dataset.id; $$('.pk').forEach((x) => x.classList.toggle('on', x === b)); }));
  $$('.mc').forEach((b) => b.addEventListener('click', () => { mic = b.dataset.id; $$('.mc').forEach((x) => x.classList.toggle('on', x === b)); }));
  go.addEventListener('click', () => { if (go.classList.contains('disabled')) return;
    const typed = own.value.trim(); onStart({ pack, voice, mic, topic: typed || chosen.topic, topicName: typed || chosen.name }); });
  $('.memlink').addEventListener('click', (e) => { e.preventDefault(); onMemory && onMemory(); });
  window.SPEAK = Object.assign(window.SPEAK || {}, { screen: 'start' });
}
