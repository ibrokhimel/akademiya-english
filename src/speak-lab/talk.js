// The talk: mic → Gemini → Dombi's voice, face and captions. One screen; End hands a transcript to the caller.
// talkScreen(root, { pack, topic, profile, onEnd(result) })
import { CFG } from './config.js';
import { COPY } from './copy.js';
import { startMic, makePlayer } from './audio.js';
import { connectLive } from './live.js';
import { connectFake } from './fake.js';
import { mountDombi } from './dombi.js';
import { mountCards } from './cards.js';
import { shouldAskFeedback } from './rules.js';
import { pcmToBase64 } from './audio.js';

const isFake = () => new URLSearchParams(location.search).has('fake');
const MAX_TURN_CHUNKS = 300;                                                  // 30 s of the learner's audio per turn, at most

// the side calls go to the server, or to window.FAKE.<name> in fake mode (a missing fake means "no answer")
async function side(name, body) {
  if (isFake()) { const f = window.FAKE && window.FAKE[name]; if (!f) throw new Error('no fake ' + name); return f(body); }
  const r = await fetch(CFG.SERVER + '/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  return r.json();
}

export async function talkScreen(root, { pack, topic, topicName, profile, onEnd }) {
  root.innerHTML = `
    <div class="talk">
      <div class="tbar"><span class="topic">${topicName || COPY.title}</span><span class="status">${COPY.connecting}</span><span class="endw"><div class="p3d btn small danger end"><div class="face">${COPY.end}</div></div></span></div>
      <div class="stage"><div class="dbox"></div></div>
      <div class="caps"><div class="cap live"></div></div>
      <div class="side"></div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const state = { captions: [], learner: [], transcript: [], cards: [], mood: 'smirk', level: profile.level || '', latencies: [], interruptions: 0, started: Date.now(), lastSpokeAt: 0, dombiTalking: false };
  const T = { state, player: null, dombi: null, session: null, end: null, playerPushes: 0 };
  window.SPEAK = Object.assign(window.SPEAK || {}, { screen: 'talk', talk: T });

  T.dombi = await mountDombi($('.dbox'), 220);
  const player = (T.player = makePlayer()), cards = (T.cards = mountCards($('.side'), CFG));
  let capText = '', learnerText = '', speechEndAt = 0, firstAudioAt = 0, ended = false, turnPcm = [], lastDombi = '';

  // the learner's turn is over when Dombi starts answering: his audio + what was heard → the coach → the cards
  function askFeedback() {
    const text = learnerText.trim(), pcm = turnPcm; turnPcm = []; cards.turn();
    if (!shouldAskFeedback(text, CFG)) return;
    const all = new Int16Array(pcm.reduce((n, c) => n + c.length, 0)); let o = 0; for (const c of pcm) { all.set(c, o); o += c.length; }
    side('feedback', { audio: pcmToBase64(all), learnerText: text, dombiText: lastDombi, history: state.transcript.slice(-4), level: state.level })
      .then((j) => { if (ended || !j) return; if (j.level) state.level = j.level; for (const k of ['better', 'pron']) if (j[k] && cards.show(k, j[k])) state.cards.push({ kind: k, text: j[k], turn: state.transcript.length }); })
      .catch((e) => console.warn('feedback', e.message));                        // no card, the talk goes on
  }
  const status = (s) => { $('.status').textContent = s; };

  const handlers = {
    onOpen() { status(COPY.listening); },
    onAudio(pcm) {
      if (ended) return; T.playerPushes++; player.push(pcm);
      if (!state.dombiTalking) { state.dombiTalking = true; T.dombi.talking(true); T.dombi.listening(false); if (speechEndAt && !firstAudioAt) { firstAudioAt = Date.now(); state.latencies.push(firstAudioAt - speechEndAt); }
        setTimeout(askFeedback, 400); }                                          // a beat, so late transcript pieces of the learner's turn arrive first
    },
    onCaption(text, final) {
      if (final) { if (capText.trim()) { lastDombi = capText.trim(); state.captions.push(lastDombi); state.transcript.push({ who: 'dombi', text: lastDombi }); addCaption(lastDombi); } capText = ''; return; }
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
    $('.caps').insertBefore(el, $('.cap.live')); while ($('.caps').children.length > 5) $('.caps').firstChild.remove();
    $('.cap.live').textContent = '';
  }
  player.onIdle(() => { state.dombiTalking = false; T.dombi.talking(false); T.dombi.amp(0); if (!ended) T.dombi.listening(true); });

  // the mic: blocked → the Uzbek line and a retry
  let mic = null;
  try { mic = await startMic((pcm) => { if (!T.session || ended) return; T.session.sendAudio(pcm); if (!state.dombiTalking && mic.amp() > CFG.MIC_FLOOR) { if (turnPcm.length < MAX_TURN_CHUNKS) turnPcm.push(pcm); } }); }
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
