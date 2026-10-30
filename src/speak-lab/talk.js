// The talk: mic → Gemini → Dombi's voice, face and captions. One screen; End hands a transcript to the caller.
// talkScreen(root, { pack, topic, profile, onEnd(result) })
import { CFG } from './config.js';
import { COPY } from './copy.js';
import { startMic, makePlayer } from './audio.js';
import { connectLive } from './live.js';
import { connectFake } from './fake.js';
import { mountDombi } from './dombi.js';
import { mountCards, captionButtons } from './cards.js';
import { makeActing } from './actions/engine.js';
import { mountStage } from './actions/stage.js';
import { shouldAskFeedback, silenceStage, moodFor, sendMic, cleanCaption, captionHtml } from './rules.js';
import { makeClock } from './clock.js';
import { makeLipsync, weighWord, loadDict } from './lipsync.js';

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

export async function talkScreen(root, { pack, voice = '', mic: micStart = 'auto', topic, topicName, profile, onEnd }) {
  const micSw = [['auto', COPY.micAuto], ['hold', COPY.micHold]].map(([id, name]) => `<button data-id="${id}">${name}</button>`).join('');
  root.innerHTML = `
    <div class="talk">
      <div class="tbar"><span class="topic">${topicName || COPY.title}</span><span class="status">${COPY.connecting}</span><span class="micsw">${micSw}</span><span class="endw"><div class="p3d btn small danger end"><div class="face">${COPY.end}</div></div></span></div>
      <div class="stage"><div class="dbox"></div></div>
      <div class="caps"><div class="cap live"></div></div>
      <div class="holdw"><div class="p3d btn primary hold"><div class="face">${COPY.holdToTalk}</div></div></div>
      <div class="side"></div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const state = { captions: [], learner: [], transcript: [], cards: [], nudges: [], mood: 'smirk', level: profile.level || '', latencies: [], interruptions: 0, started: Date.now(), lastSpokeAt: Date.now(), dombiTalking: false, silence: 'none', secIn: 0, secOut: 0, cost: 0, goodbye: false };
  const id = Math.random().toString(36).slice(2, 10);
  const T = { state, player: null, dombi: null, session: null, end: null, playerPushes: 0, clockOffset: 0, voice: voice || (PACKS.find((p) => p.id === pack) || PACKS[0]).voice };
  const now = () => Date.now() + T.clockOffset;                              // the checks move the clock with tick(ms)
  T.tick = (ms) => { T.clockOffset += ms; };
  T.timing = [];                                                             // caption / audio arrival times for the talk log (timing.json)
  window.SPEAK = Object.assign(window.SPEAK || {}, { screen: 'talk', talk: T });

  T.dombi = await mountDombi($('.dbox'), 220);
  const player = (T.player = makePlayer()), cards = (T.cards = mountCards($('.side'), CFG));
  // Dombi acts out his own lines (docs/superpowers/specs/2026-10-30-dombi-action-engine-design.md)
  // At each clause of his, Gemini Flash (the director) may pick an action too; its answer never holds up his voice.
  const direct = (q) => { if (ended) return; state.cost += CFG.PRICE.directPerCall;
    side('direct', { learner: state.learner[state.learner.length - 1] || '', said: q.said, line: q.line, pack, recent: q.recent, turn: q.turn })
      .then((j) => { if (!ended && j) T.acting.apply(j); }).catch(() => {}); };
  // He lives on the stage on his own: listening moves while the learner talks, small gestures while he talks, the rest when quiet.
  const stageCfg = isFake() && window.FAKE && window.FAKE.cfg ? { ...CFG, ...window.FAKE.cfg } : CFG;    // the checks speed it up
  T.stage = mountStage({ stageEl: $('.stage'), boxEl: $('.dbox'), dombi: T.dombi, cfg: stageCfg, pack, reduce: !!(window.M && M.reduce),
    getState: () => (state.dombiTalking ? 'talking' : now() - state.lastSpokeAt < CFG.LISTEN_HOLD_MS ? 'listening' : 'idle') });
  T.acting = makeActing({ dombi: T.dombi, clock: () => clock, now: () => player.playNow(), cfg: stageCfg, reduce: !!(window.M && M.reduce), onPick: direct, stage: T.stage });
  let cutting = false, cutTimer = null;    // cutting: the learner cut him off; his output still on its way is dropped until Gemini says interrupted or done
  let capText = '', learnerText = '', speechEndAt = 0, firstAudioAt = 0, ended = false, turnPcm = [], lastDombi = '';

  // one word clock per turn of his (spec 2026-10-30 in-sync §4.1): the live subtitle and his mouth both read it.
  // `rate` is how fast he really spoke last turn, carried over; the dictionary loads in the background (rules until then)
  let dict = null, rate = CFG.SPEECH_RATE, clock = null, clockAudio = 0, clockClosed = false, pendingLine = '';
  loadDict().then((d) => { dict = d; });
  // for the talk log: each turn's word times, as the clock finally had them
  const wordTimes = [], keepWords = (c) => { if (c && c.words().length) wordTimes.push({ turn: wordTimes.length + 1, words: c.words().map((w) => [w.text, Math.round(w.start), Math.round(w.end)]) }); };
  let quietFrom = null;                                                          // when his sound last went quiet (reset every turn: a stale one would pin his first word)
  function newClock() {
    if (pendingLine) fileLine();
    keepWords(clock);
    clock = T.clock = makeClock({ weigh: (w, p) => weighWord(w, p, dict), rate }); clockAudio = 0; clockClosed = false; quietFrom = null;
    T.lipsync = makeLipsync({ clock, levelAt: player.levelAt, dict: () => dict, cfg: CFG });
  }
  const dropClock = () => { clock = null; clockClosed = false; quietFrom = null; pendingLine = ''; shown = ''; $('.cap.live').textContent = ''; };
  function fileLine() { const line = pendingLine; pendingLine = ''; if (line) addCaption(line); }

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
      if (ended || cutting) return; T.playerPushes++; player.push(pcm);
      if (!clock || clockClosed) newClock();
      if (!clockAudio) clock.start(player.endsAt() - pcm.length / 24); clockAudio += pcm.length / 24; clock.audio(clockAudio); T.acting.audio(); T.timing.push({ t: Math.round(performance.now()), kind: 'audio', ms: Math.round(pcm.length / 24) }); state.secOut += pcm.length / 24000; state.cost = estimateCost(state.secIn, state.secOut, CFG.PRICE);
      if (!state.dombiTalking) { state.dombiTalking = true; T.dombi.talking(true); T.dombi.listening(false); if (speechEndAt && !firstAudioAt) { firstAudioAt = Date.now(); state.latencies.push(firstAudioAt - speechEndAt); }
        setTimeout(askFeedback, 400); }                                          // a beat, so late transcript pieces of the learner's turn arrive first
    },
    onCaption(text, final) {
      if (final && cutting) { cutting = false; capText = ''; T.timing.push({ t: Math.round(performance.now()), kind: 'final' }); return; }
      if (cutting) return;
      // the finished line goes to the list once his voice has said it (frame loop; at once if his voice already ran out),
      // the transcript has it now
      if (final) { T.acting.final(); T.timing.push({ t: Math.round(performance.now()), kind: 'final' }); const line = cleanCaption(capText); if (line) { lastDombi = line; state.captions.push(lastDombi); state.transcript.push({ who: 'dombi', text: lastDombi }); pendingLine = line; if (!clock || !player.playing()) fileLine(); } if (clock) { clock.close(); clockClosed = true; rate = Math.min(1.5, Math.max(0.3, clock.rate())); } capText = ''; return; }
      if (!clock || clockClosed) newClock();
      capText += text; clock.text(cleanCaption(capText)); T.acting.caption(cleanCaption(capText));
      T.timing.push({ t: Math.round(performance.now()), kind: 'caption', words: cleanCaption(capText).split(/\s+/).filter(Boolean).length });
    },
    onLearnerText(text, final) {
      if (final) { if (learnerText.trim()) { state.learner.push(learnerText.trim()); state.transcript.push({ who: 'learner', text: learnerText.trim() }); } learnerText = ''; return; }
      learnerText += text; T.acting.learnerTurn(); state.lastSpokeAt = now(); state.silence = 'none'; speechEndAt = Date.now(); firstAudioAt = 0;
    },
    onInterrupted() { cutting = false; state.interruptions++; T.acting.interrupted(); player.clear(); capText = ''; dropClock(); },
    onTurnComplete() { /* the player's idle event turns the mouth off */ },
    onToolCall() { /* no tools in this build: the voice model spoke them aloud */ },
    onClose(reason) { if (reason === 'lost') { status(COPY.lost); T.end(); } },       // the socket is gone for good: the talk ends with what it has
  };
  // End works from the first moment, before the mic and the socket are up; everything it stops may still be missing
  let mic = null, meter = null, quiet = null;
  T.end = () => {
    if (ended) return; ended = true; clearInterval(meter); clearInterval(quiet); T.endedAt = Math.round((now() - state.started) / 1000);
    removeEventListener('keydown', keys); removeEventListener('keyup', keys); removeEventListener('blur', release); clearTimeout(cutTimer); T.acting.stop(); T.stage.stop(); T.dombi.reset(); if (mic) mic.stop(); player.clear(); if (T.session) T.session.close(); T.dombi.listening(false); T.dombi.talking(false);
    keepWords(clock);
    const result = { id, timing: T.timing, acting: T.acting.log, words: wordTimes, visemes: T.visemes, transcript: state.transcript, cards: state.cards, nudges: state.nudges, latencies: state.latencies, interruptions: state.interruptions, seconds: Math.round((now() - state.started) / 1000), mood: state.mood, level: state.level, secIn: Math.round(state.secIn), secOut: Math.round(state.secOut), cost: state.cost, pack, topic };
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
  player.onIdle(() => { T.acting.idle(); state.dombiTalking = false; T.dombi.talking(false); T.dombi.amp(0); T.dombi.viseme(0); lastV = 0; quietFrom = null; if (pendingLine) fileLine(); shown = ''; $('.cap.live').textContent = ''; if (!ended) T.dombi.listening(true); });
  // every frame, on the sound playing now: the live subtitle up to the word he is saying (lit), his mouth shape for it, his
  // face from the words said so far, and quiet gaps in his voice handed to the clock to pin the next sentence
  let lastV = 0, shown = ''; T.mouthMoves = 0; T.visemes = [];
  const frame = () => {
    if (ended) return; requestAnimationFrame(frame);
    if (!clock || !player.playing() || (clockClosed && !pendingLine)) return;          // a filed line is not shown again (e.g. under "Slower")
    const t = player.playNow(), k = clock.wordAt(t), words = clock.words(), html = captionHtml(words, k);
    if (html !== shown) { shown = html; $('.cap.live').innerHTML = html;
      const m = moodFor(words.slice(0, k + 1).map((w) => w.text + w.punct).join(' ')); if (m !== state.mood) { state.mood = m; T.dombi.mood(m); } }
    if (player.levelAt(t) < 4) quietFrom ??= t; else if (quietFrom != null) { if (t - quietFrom >= CFG.QUIET_GAP_MS) clock.quiet(quietFrom, t); quietFrom = null; }
    const v = state.dombiTalking ? T.lipsync.at(t) : 0; if (v !== lastV) { lastV = v; T.dombi.viseme(v); if (v) T.mouthMoves++; if (T.visemes.length < 20000) T.visemes.push([Math.round(t), v]); }
    if (pendingLine && clockClosed && t >= (clock.endOf(words.length - 1) ?? 0)) fileLine();
  };
  requestAnimationFrame(frame);

  // the mic switch (spec 2026-10-30 §4.4): in hold mode the mic goes to Gemini only while the button or the space bar is held;
  // switching mode mid-talk reconnects (live.js setMic) and hands the new session the last lines if it can't resume
  let micMode = micStart === 'hold' ? 'hold' : 'auto', holding = false, switching = false;
  const showMic = () => { root.querySelectorAll('.micsw button').forEach((b) => b.classList.toggle('on', b.dataset.id === micMode)); $('.holdw').style.display = micMode === 'hold' ? '' : 'none'; };
  // cut him off now: his voice, his planned actions and his half line go; what of that turn is still on its way gets dropped
  // (cutting) until Gemini says interrupted or done; the 4 s fallback is so a lost signal can never mute him for good
  const cutHim = () => {
    if (!state.dombiTalking && !player.playing() && !capText) return;
    T.acting.interrupted(); player.clear(); capText = ''; dropClock();
    cutting = true; clearTimeout(cutTimer); cutTimer = setTimeout(() => { cutting = false; }, 4000);
  };
  const press = () => { if (micMode !== 'hold' || holding || switching || ended || !T.session) return; holding = true; $('.hold').classList.add('down'); cutHim(); T.session.activityStart(); };
  const release = () => { if (!holding) return; holding = false; $('.hold').classList.remove('down'); if (T.session) T.session.activityEnd(); };
  T.switchMic = async (mode) => {
    if (mode === micMode || switching || ended || !T.session) return;
    release(); cutHim(); learnerText = ''; switching = true; micMode = mode; showMic(); status(COPY.reconnecting);
    const lines = state.transcript.slice(-6).map((t) => `${t.who === 'dombi' ? 'Dombi' : 'Learner'}: ${t.text}`);
    // the old socket is gone, so nothing of his cut turn can still arrive; a switch that can't reconnect ends the talk (not a silent one)
    try { (T.micSwitches ||= []).push(await T.session.setMic(mode, lines)); } catch (e) { console.warn('mic switch', e.message); switching = false; cutting = false; if (!ended) { status(COPY.lost); T.end(); } return; }
    switching = false; cutting = false; if (!ended) status(COPY.listening);
  };
  const keys = (e) => { if (e.code !== 'Space' || e.repeat || /input|textarea/i.test(e.target.tagName)) return; e.preventDefault(); (e.type === 'keydown' ? press : release)(); };
  $('.hold').addEventListener('pointerdown', press); $('.hold').addEventListener('pointerup', release); $('.hold').addEventListener('pointerleave', release); $('.hold').addEventListener('pointercancel', release);
  addEventListener('keydown', keys); addEventListener('keyup', keys); addEventListener('blur', release);   // keyup never comes if the window loses focus
  root.querySelectorAll('.micsw button').forEach((b) => b.addEventListener('click', () => T.switchMic(b.dataset.id)));
  showMic();

  // the mic: blocked → the Uzbek line and a retry
  try { mic = await startMic((pcm) => { if (!T.session || ended || muted || switching || (micMode === 'hold' ? !holding : !sendMic({ amp: mic.amp(), dombiTalking: state.dombiTalking }, CFG))) return; T.session.sendAudio(pcm); state.secIn += pcm.length / 16000; if (!state.dombiTalking && mic.amp() > CFG.MIC_FLOOR) { if (turnPcm.length < MAX_TURN_CHUNKS) turnPcm.push(pcm); } }); }
  catch (e) { ended = true; root.innerHTML = `<div class="talk problem"><p>${COPY.micBlocked}</p><div class="p3d btn primary retry"><div class="face">${COPY.retry}</div></div></div>`; $('.retry').onclick = () => location.reload(); return T; }
  if (ended) { mic.stop(); return T; }                                            // End was pressed while the mic was being asked for

  // the session: real or scripted
  try { T.session = await (isFake() ? connectFake : connectLive)({ pack, voice: T.voice, topic, profile, mic: micMode, handlers }); }
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
