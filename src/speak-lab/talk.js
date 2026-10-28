// The talk: mic → Gemini → Dombi's voice, face and captions. One screen; End hands a transcript to the caller.
// talkScreen(root, { pack, topic, profile, onEnd(result) })
import { CFG } from './config.js';
import { COPY } from './copy.js';
import { startMic, makePlayer } from './audio.js';
import { connectLive } from './live.js';
import { connectFake } from './fake.js';
import { mountDombi } from './dombi.js';

const isFake = () => new URLSearchParams(location.search).has('fake');

export async function talkScreen(root, { pack, topic, topicName, profile, onEnd }) {
  root.innerHTML = `
    <div class="talk">
      <div class="tbar"><span class="topic">${topicName || COPY.title}</span><span class="status">${COPY.connecting}</span><span class="endw"><div class="p3d btn small danger end"><div class="face">${COPY.end}</div></div></span></div>
      <div class="stage"><div class="dbox"></div></div>
      <div class="caps"><div class="cap live"></div></div>
      <div class="side"></div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const state = { captions: [], learner: [], transcript: [], mood: 'smirk', latencies: [], interruptions: 0, started: Date.now(), lastSpokeAt: 0, dombiTalking: false };
  const T = { state, player: null, dombi: null, session: null, end: null, playerPushes: 0 };
  window.SPEAK = Object.assign(window.SPEAK || {}, { screen: 'talk', talk: T });

  T.dombi = await mountDombi($('.dbox'), 220);
  const player = (T.player = makePlayer());
  let capText = '', learnerText = '', speechEndAt = 0, firstAudioAt = 0, ended = false;
  const status = (s) => { $('.status').textContent = s; };

  const handlers = {
    onOpen() { status(COPY.listening); },
    onAudio(pcm) {
      if (ended) return; T.playerPushes++; player.push(pcm);
      if (!state.dombiTalking) { state.dombiTalking = true; T.dombi.talking(true); T.dombi.listening(false); if (speechEndAt && !firstAudioAt) { firstAudioAt = Date.now(); state.latencies.push(firstAudioAt - speechEndAt); } }
    },
    onCaption(text, final) {
      if (final) { if (capText.trim()) { state.captions.push(capText.trim()); state.transcript.push({ who: 'dombi', text: capText.trim() }); addCaption(capText.trim()); } capText = ''; return; }
      capText += text; $('.cap.live').textContent = capText;
    },
    onLearnerText(text, final) {
      if (final) { if (learnerText.trim()) { state.learner.push(learnerText.trim()); state.transcript.push({ who: 'learner', text: learnerText.trim() }); } learnerText = ''; return; }
      learnerText += text; state.lastSpokeAt = Date.now(); speechEndAt = Date.now(); firstAudioAt = 0;
    },
    onInterrupted() { state.interruptions++; player.clear(); capText = ''; $('.cap.live').textContent = ''; },
    onTurnComplete() { /* the player's idle event turns the mouth off */ },
    onToolCall(name, args) { if (name === 'set_mood') { state.mood = args.mood; T.dombi.mood(args.mood); } },
    onClose(reason) { if (reason === 'lost') { status(COPY.lost); } },
  };
  function addCaption(text) {
    const el = document.createElement('div'); el.className = 'cap done'; el.textContent = text;
    $('.caps').insertBefore(el, $('.cap.live')); while ($('.caps').children.length > 4) $('.caps').firstChild.remove();
    $('.cap.live').textContent = '';
  }
  player.onIdle(() => { state.dombiTalking = false; T.dombi.talking(false); T.dombi.amp(0); if (!ended) T.dombi.listening(true); });

  // the mic: blocked → the Uzbek line and a retry
  let mic = null;
  try { mic = await startMic((pcm) => { if (T.session && !ended) T.session.sendAudio(pcm); }); }
  catch (e) { root.innerHTML = `<div class="talk problem"><p>${COPY.micBlocked}</p><div class="p3d btn primary retry"><div class="face">${COPY.retry}</div></div></div>`; $('.retry').onclick = () => location.reload(); return T; }

  // the session: real or scripted
  try { T.session = await (isFake() ? connectFake : connectLive)({ pack, topic, profile, handlers }); }
  catch (e) { mic.stop(); root.innerHTML = `<div class="talk problem"><p>${e.status === 402 ? e.body && e.body.reason : COPY.serverDown}</p><div class="p3d btn primary retry"><div class="face">${COPY.retry}</div></div></div>`; $('.retry').onclick = () => location.reload(); T.error = e; return T; }
  // Dombi speaks first: the model only talks after a turn, so the page gives it one
  T.session.sendText('[The learner just opened the app and is listening. Start the conversation now, in character: one short greeting and one question. Do not wait for them.]');

  const meter = setInterval(() => { if (ended) return; const a = state.dombiTalking ? player.amp() : mic.amp(); T.dombi.amp(a); if (!state.dombiTalking && a > CFG.MIC_FLOOR) state.lastSpokeAt = Date.now(); }, 100);

  T.end = () => {
    if (ended) return; ended = true; clearInterval(meter); mic.stop(); player.clear(); T.session.close(); T.dombi.listening(false); T.dombi.talking(false);
    onEnd({ transcript: state.transcript, latencies: state.latencies, interruptions: state.interruptions, seconds: Math.round((Date.now() - state.started) / 1000), mood: state.mood });
  };
  $('.end').onclick = T.end;
  return T;
}
