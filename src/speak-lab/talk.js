// The talk: mic → Gemini → Dombi's voice, face and captions. One screen; End hands a transcript to the caller.
// talkScreen(root, { pack, topic, profile, onEnd(result) })
import { CFG } from './config.js';
import { COPY } from './copy.js';
import { startMic, makePlayer } from './audio.js';
import { connectLive } from './live.js';
import { connectFake } from './fake.js';
import { mountDombi } from './dombi.js';
import { mountCards, captionButtons } from './cards.js';
import { shouldAskFeedback, silenceStage, moodFor, sendMic, cleanCaption } from './rules.js';

// what the page tells the model when the learner goes quiet (spec §4.3); the model answers in character, out loud
const NUDGE = {
  remark: '[The learner has been quiet for a while. Say one casual thing to pull them back in, in character, in one sentence. Do not mention this note.]',
  whisper: '[The learner has been silent for about two minutes. Whisper to them in natural Uzbek: ask gently what is up and offer one easy question. Do not mention this note.]',
  goodbye: '[Time is almost up. Say goodbye in character in one or two sentences, with one thing they did well. Do not mention this note.]',
};
import { estimateCost } from './rules.js';
import { pcmToBase64, base64ToPcm } from './audio.js';
import { PACKS } from './config.js';

const isFake = () => new URLSearchParams(location.search).has('fake');
const MAX_TURN_CHUNKS = 300;                                                  // 30 s of the learner's audio per turn, at most

// the side calls go to the server, or to window.FAKE.<name> in fake mode (a missing fake means "no answer")
export async function side(name, body) {
  if (isFake()) { const f = window.FAKE && window.FAKE[name]; if (!f) throw new Error('no fake ' + name); return f(body); }
  const r = await fetch(CFG.SERVER + '/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  return r.json();
}

export async function talkScreen(root, { pack, voice = '', topic, topicName, profile, onEnd }) {
  root.innerHTML = `
    <div class="talk">
      <div class="tbar"><span class="topic">${topicName || COPY.title}</span><span class="status">${COPY.connecting}</span><span class="endw"><div class="p3d btn small danger end"><div class="face">${COPY.end}</div></div></span></div>
      <div class="stage"><div class="dbox"></div></div>
      <div class="caps"><div class="cap live"></div></div>
      <div class="side"></div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const state = { captions: [], learner: [], transcript: [], cards: [], nudges: [], mood: 'smirk', level: profile.level || '', latencies: [], interruptions: 0, started: Date.now(), lastSpokeAt: Date.now(), dombiTalking: false, silence: 'none', secIn: 0, secOut: 0, cost: 0, goodbye: false };
  const id = Math.random().toString(36).slice(2, 10);
  const T = { state, player: null, dombi: null, session: null, end: null, playerPushes: 0, clockOffset: 0, voice: voice || (PACKS.find((p) => p.id === pack) || PACKS[0]).voice };
  const now = () => Date.now() + T.clockOffset;                              // the checks move the clock with tick(ms)
  T.tick = (ms) => { T.clockOffset += ms; };
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
      if (ended) return; T.playerPushes++; player.push(pcm); state.secOut += pcm.length / 24000; state.cost = estimateCost(state.secIn, state.secOut, CFG.PRICE);
      if (!state.dombiTalking) { state.dombiTalking = true; T.dombi.talking(true); T.dombi.listening(false); if (speechEndAt && !firstAudioAt) { firstAudioAt = Date.now(); state.latencies.push(firstAudioAt - speechEndAt); }
        setTimeout(askFeedback, 400); }                                          // a beat, so late transcript pieces of the learner's turn arrive first
    },
    onCaption(text, final) {
      if (final) { const line = cleanCaption(capText); if (line) { lastDombi = line; state.captions.push(lastDombi); state.transcript.push({ who: 'dombi', text: lastDombi }); addCaption(lastDombi); } capText = ''; return; }
      capText += text; $('.cap.live').textContent = cleanCaption(capText);
      const m = moodFor(cleanCaption(capText)); if (m !== state.mood) { state.mood = m; T.dombi.mood(m); }      // his face follows his words as they come
    },
    onLearnerText(text, final) {
      if (final) { if (learnerText.trim()) { state.learner.push(learnerText.trim()); state.transcript.push({ who: 'learner', text: learnerText.trim() }); } learnerText = ''; return; }
      learnerText += text; state.lastSpokeAt = now(); state.silence = 'none'; speechEndAt = Date.now(); firstAudioAt = 0;
    },
    onInterrupted() { state.interruptions++; player.clear(); capText = ''; $('.cap.live').textContent = ''; },
    onTurnComplete() { /* the player's idle event turns the mouth off */ },
    onToolCall() { /* no tools in this build: the voice model spoke them aloud */ },
    onClose(reason) { if (reason === 'lost') { status(COPY.lost); T.end(); } },       // the socket is gone for good: the talk ends with what it has
  };
  // End works from the first moment, before the mic and the socket are up; everything it stops may still be missing
  let mic = null, meter = null, quiet = null;
  T.end = () => {
    if (ended) return; ended = true; clearInterval(meter); clearInterval(quiet); clearInterval(mouth); T.endedAt = Math.round((now() - state.started) / 1000);
    if (mic) mic.stop(); player.clear(); if (T.session) T.session.close(); T.dombi.listening(false); T.dombi.talking(false);
    const result = { id, transcript: state.transcript, cards: state.cards, nudges: state.nudges, latencies: state.latencies, interruptions: state.interruptions, seconds: Math.round((now() - state.started) / 1000), mood: state.mood, level: state.level, secIn: Math.round(state.secIn), secOut: Math.round(state.secOut), cost: state.cost, pack, topic };
    side('log', result).then((j) => { if (j && j.monthTotal != null) T.month = j; }).catch((e) => console.warn('log', e.message));
    onEnd(result);
  };
  $('.end').onclick = T.end;
  // "Slower": the line again from the TTS model, in the pack's voice; the mic is not sent while it plays, so Dombi is not cut off by his own slow voice
  let muted = false;
  async function slower(line) {
    const { pcm } = await side('slower', { line, voice: T.voice });
    if (!pcm || ended) return;
    muted = true; player.clear(); T.playerPushes++; player.push(base64ToPcm(pcm));
    await new Promise((r) => { const t = setInterval(() => { if (!player.playing() || ended) { clearInterval(t); r(); } }, 100); });
    muted = false;
  }
  function addCaption(text) {
    const el = document.createElement('div'); el.className = 'cap done'; const line = document.createElement('div'); line.className = 'ctext'; line.textContent = text; el.appendChild(line);
    captionButtons(el, text, { onExplain: (l) => side('explain', { line: l, history: state.transcript.slice(-4) }).then((j) => j && j.uz), onSlower: slower });
    $('.caps').insertBefore(el, $('.cap.live')); while ($('.caps').children.length > 5) $('.caps').firstChild.remove();
    $('.cap.live').textContent = '';
  }
  player.onIdle(() => { state.dombiTalking = false; T.dombi.talking(false); T.dombi.amp(0); T.dombi.viseme(0); if (!ended) T.dombi.listening(true); });
  // his mouth moves with his voice: a new mouth shape every ~95 ms while the sound is up, closed in the quiet bits (the lab's talk pacing; real lip sync comes later)
  const SHAPES = [5, 3, 6, 4, 8, 3, 5, 1, 6, 4, 9, 7]; let shape = 0; T.mouthMoves = 0;
  const mouth = setInterval(() => { if (ended || !state.dombiTalking) return; const loud = player.amp() > 4; T.dombi.viseme(loud ? SHAPES[shape++ % SHAPES.length] : 0); if (loud) T.mouthMoves++; }, 95);

  // the mic: blocked → the Uzbek line and a retry
  try { mic = await startMic((pcm) => { if (!T.session || ended || muted || !sendMic({ amp: mic.amp(), dombiTalking: state.dombiTalking }, CFG)) return; T.session.sendAudio(pcm); state.secIn += pcm.length / 16000; if (!state.dombiTalking && mic.amp() > CFG.MIC_FLOOR) { if (turnPcm.length < MAX_TURN_CHUNKS) turnPcm.push(pcm); } }); }
  catch (e) { ended = true; root.innerHTML = `<div class="talk problem"><p>${COPY.micBlocked}</p><div class="p3d btn primary retry"><div class="face">${COPY.retry}</div></div></div>`; $('.retry').onclick = () => location.reload(); return T; }
  if (ended) { mic.stop(); return T; }                                            // End was pressed while the mic was being asked for

  // the session: real or scripted
  try { T.session = await (isFake() ? connectFake : connectLive)({ pack, voice: T.voice, topic, profile, handlers }); }
  catch (e) { if (ended) return T; mic.stop(); ended = true; root.innerHTML = `<div class="talk problem"><p>${e.status === 402 && e.body ? COPY.budgetOver(Number(e.body.spent || 0).toFixed(2), e.body.budget) : COPY.serverDown}</p><div class="p3d btn primary retry"><div class="face">${COPY.retry}</div></div></div>`; $('.retry').onclick = () => location.reload(); T.error = e; return T; }
  if (ended) { T.session.close(); return T; }                                     // End was pressed while the socket was opening
  // Dombi speaks first: the model only talks after a turn, so the page gives it one
  T.session.sendText('[The learner just opened the app and is listening. Start the conversation now, in character: one short greeting and one question. Do not wait for them.]');

  meter = setInterval(() => { if (ended) return; const a = state.dombiTalking ? player.amp() : mic.amp(); T.dombi.amp(a); if (!state.dombiTalking && a > CFG.MIC_FLOOR) { state.lastSpokeAt = now(); state.silence = 'none'; } }, 100);
  T.micAmp = () => mic.amp();
  // Dombi on his own: the silence nudges (and the test bar's buttons)
  T.nudge = (kind) => { if (ended || !NUDGE[kind]) return; state.silence = kind; state.nudges.push({ kind, at: Math.round((now() - state.started) / 1000) }); T.session.sendText(NUDGE[kind]); };
  quiet = setInterval(() => {
    if (ended) return;
    const kind = silenceStage({ quietMs: now() - state.lastSpokeAt, stage: state.silence, dombiTalking: state.dombiTalking || player.playing() }, CFG); if (kind !== 'none') T.nudge(kind);
    // the per-talk cap: a goodbye a little before it; the talk ends once the goodbye has been said (or after the grace, whatever happens)
    const age = now() - state.started;
    if (!state.goodbye && age >= CFG.TALK_CAP_MS - CFG.GOODBYE_BEFORE_CAP_MS) { state.goodbye = true; state.goodbyeAt = now(); T.nudge('goodbye'); }
    if (age >= CFG.TALK_CAP_MS) {
      const said = state.goodbye && now() - state.goodbyeAt >= 2000 && !player.playing() && !state.dombiTalking;
      if (said || age >= CFG.TALK_CAP_MS + CFG.CAP_GRACE_MS) T.end();
    }
  }, 1000);
  return T;
}
