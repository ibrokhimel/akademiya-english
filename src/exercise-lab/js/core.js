// Akademiya Exercise Lab: shared state, DOM helpers, audio, speech input and feedback.

function load(key, fallback) {
  try { const v = localStorage.getItem('lab.' + key); return v == null ? fallback : v; } catch (e) { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem('lab.' + key, value); } catch (e) { /* storage unavailable */ }
}

// mode: full = sound + speaking · headphones = sound, no speaking · silent = no sound, no speaking
const S = { mode: load('mode', 'full'), l1: load('l1', 'uz'), ex: load('ex', 'E1'), later: new Set(), noSpeak: false, cleanup: null };

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(k));
  }
  return el;
}
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const l1 = (obj) => obj[S.l1];
const l1Tag = () => (S.l1 === 'uz' ? 'UZ' : 'RU');

/* ---------- Text to speech ---------- */
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

function say(text, opts = {}) {
  return new Promise((resolve) => {
    if (S.mode === 'silent' || !('speechSynthesis' in window) || !text) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.pitch = opts.pitch || 1;
    u.rate = opts.rate || 0.92;
    u.onend = resolve; u.onerror = resolve;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}
async function sayLines(lines) {
  for (const l of lines) {
    if (S.mode === 'silent') return;
    await say(l.t, { pitch: l.who === 'Waiter' ? 0.8 : 1.25 });
    await wait(200);
  }
}
function audioBtn(text, label) {
  if (S.mode === 'silent') return null;
  return h('button', { class: label ? 'play big' : 'play', 'aria-label': 'Play audio', onclick: () => say(text) }, label || '🔊');
}

/* ---------- Feedback sound + vibration ---------- */
let actx = null;
function tone(ok) {
  if (S.mode !== 'silent') {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = 'sine';
      if (ok) { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(880, t + 0.09); }
      else { o.frequency.setValueAtTime(310, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.2); }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) { /* audio unavailable */ }
  }
  try { if (navigator.vibrate) navigator.vibrate(ok ? 15 : [20, 40, 20]); } catch (e) { /* no vibration */ }
}

/* ---------- Speech recognition ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen() {
  return new Promise((resolve, reject) => {
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    let got = false;
    r.onresult = (e) => { got = true; resolve(e.results[0][0].transcript); };
    r.onerror = (e) => reject(e.error);
    r.onend = () => { if (!got) reject('no-speech'); };
    r.start();
  });
}

/* ---------- Comparing answers ---------- */
function norm(s) {
  return String(s).toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\bi would\b/g, "i'd").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function compare(target, said) {
  const pool = norm(said).split(' ');
  const words = norm(target).split(' ').map((w) => {
    const i = pool.indexOf(w);
    if (i > -1) { pool.splice(i, 1); return { w, ok: true }; }
    return { w, ok: false };
  });
  const score = words.filter((x) => x.ok).length / words.length;
  return { words, score, pass: score >= 0.8, exact: score === 1 };
}
function chips(r) {
  return h('div', { class: 'chips' },
    r.words.map((x) => h('button', { class: 'chip ' + (x.ok ? 'ok' : 'bad'), title: 'Hear this word', onclick: () => say(x.w) }, x.w)));
}

function modeNote() {
  return S.mode === 'headphones' ? 'Headphones mode: speaking is off.' : 'Silent mode: no sound and no speaking.';
}

/* Word tiles for a fixed sentence: the no-speaking fallback for recall exercises (no long typing on a phone). */
const DISTRACT = ['the', 'a', 'want', 'is', 'do', 'to', 'have', 'my', 'are', 'it'];
function buildTiles(target, onDone) {
  const tw = norm(target).split(' ');
  const tiles = shuffle([...target.split(' '), ...shuffle(DISTRACT.filter((w) => !tw.includes(w))).slice(0, 2)]);
  const picked = [];
  const line = h('div', { class: 'line' }), bank = h('div', { class: 'bank' });
  function draw() {
    line.replaceChildren(...picked.map((ti, pi) => h('button', { class: 'tile on', onclick: () => { picked.splice(pi, 1); draw(); } }, tiles[ti])));
    if (!picked.length) line.append(h('span', { class: 'ph' }, 'Tap the words below'));
    bank.replaceChildren(...tiles.map((w, ti) => h('button', { class: 'tile', disabled: picked.includes(ti), onclick: () => { picked.push(ti); draw(); } }, w)));
  }
  draw();
  return h('div', { class: 'answer' }, line, bank,
    h('button', { class: 'btn', onclick: () => picked.length && onDone(picked.map((i) => tiles[i]).join(' '), 'tiles') }, 'Check'));
}

/* "Can't speak now" works like Duolingo's: one tap turns speaking off for the session.
   Speaking-only exercises are then skipped as a whole and saved for later; exercises where speaking is
   only the answer method ('tiles') switch to word tiles. "I can speak now" turns speaking back on. */
const canSpeak = () => S.mode === 'full' && !S.noSpeak && !!SR;
function speakingOff() {
  S.noSpeak = true;
  updateLater();
  mount();
}

/* Speak-first answer input for recall exercises; while speaking is off it shows word tiles instead.
   Speaking-only exercises never reach it with speaking off: speakingOnly() skips them first.
   onResult(text, via: 'mic'|'tiles'). */
function speakInput(o) {
  const wrap = h('div', { class: 'answer' });
  if (!canSpeak()) {
    const why = S.mode !== 'full' ? modeNote() : S.noSpeak ? 'Speaking is off, so build it with words.' : 'Speech recognition needs Chrome or Edge.';
    wrap.append(h('p', { class: 'hint' }, why), buildTiles(o.target, o.onResult));
    return wrap;
  }
  const status = h('p', { class: 'hint' });
  const mic = h('button', { class: 'mic' }, '🎤 Tap and speak');
  // One tap, no second confirmation: the tap is the learner's decision.
  const link = h('button', { class: 'linkbtn', onclick: speakingOff }, "Can't speak now");
  mic.addEventListener('click', async () => {
    mic.classList.add('on'); mic.textContent = 'Listening…'; status.textContent = '';
    try {
      o.onResult(await listen(), 'mic');
    } catch (err) {
      if (err === 'not-allowed' || err === 'audio-capture') speakingOff();
      else status.textContent = "Didn't catch that. Tap and try again.";
    } finally {
      mic.classList.remove('on'); mic.textContent = '🎤 Tap and speak';
    }
  });
  wrap.append(h('p', { class: 'prompt' }, o.prompt || 'Say it'), mic, status, link);
  return wrap;
}

/* Speaking-only exercises: skipped as a whole and saved for later while speaking is off
   (Can't speak now, Headphones or Silent mode). Returns true when it rendered the skipped card. */
function speakingOnly(card, alt) {
  if (S.mode === 'full' && !S.noSpeak) { S.later.delete(S.ex); updateLater(); return false; }
  S.later.add(S.ex);
  updateLater();
  const turnOn = S.noSpeak
    ? h('button', { class: 'btn ghost', onclick: () => { S.noSpeak = false; updateLater(); mount(); } }, 'I can speak now')
    : h('button', { class: 'btn ghost', onclick: () => { S.mode = 'full'; store('mode', 'full'); drawSeg(document.getElementById('mode-seg'), MODES, 'mode'); mount(); } }, 'Switch to Full mode');
  card.replaceChildren(h('div', { class: 'done' },
    h('p', { class: 'done-k' }, 'Saved for later'),
    h('p', {}, S.noSpeak
      ? 'Speaking is off, so this speaking exercise is skipped and saved for later.'
      : 'This exercise is only useful out loud, so it is skipped in this mode and saved for later.'),
    alt || null,
    turnOn));
  return true;
}

/* Small read-aloud check used after a correct tile answer (full mode only). */
function readAloud(target) {
  if (!canSpeak()) return null;
  const out = h('div');
  const mic = h('button', { class: 'btn ghost' }, '🎤 Now read it aloud');
  mic.addEventListener('click', async () => {
    mic.textContent = 'Listening…';
    try { out.replaceChildren(chips(compare(target, await listen()))); }
    catch (e) { out.replaceChildren(h('p', { class: 'hint' }, "Didn't catch that.")); }
    mic.textContent = '🎤 Read it again';
  });
  return h('div', { class: 'answer' }, mic, out);
}

const REACTIONS = ['🙂 The waiter smiles.', '😄 Waiter: “Perfect.”', '🙂 Waiter: “Got it.”'];
const maybeReact = () => (Math.random() < 0.35 ? REACTIONS[Math.floor(Math.random() * REACTIONS.length)] : null);

/* Feedback panel: locks the item's controls, explains in Uzbek/Russian, then Continue. */
function feedback(body, o) {
  body.querySelectorAll('button, input').forEach((b) => { b.disabled = true; });
  tone(o.kind === 'good');
  // Mistakes never say "wrong" or "not yet" (Duolingo-style): just the correct answer, then move on.
  const title = o.kind === 'notyet' ? 'Correct answer' : o.title || { good: 'Correct', near: 'Almost' }[o.kind];
  const panel = h('div', { class: 'fb ' + o.kind, role: 'status' },
    h('p', { class: 'fb-t' }, title),
    o.node || null,
    o.correct ? h('p', { class: 'fb-c' }, '', h('strong', {}, o.correct), ' ', audioBtn(o.correct)) : null,
    o.why ? h('p', { class: 'fb-why' }, h('span', { class: 'l1tag' }, l1Tag()), l1(WHY[o.why])) : null,
    o.react ? h('p', {}, o.react) : null,
    h('button', { class: 'btn', onclick: o.onNext }, 'Continue'));
  body.append(panel);
  panel.querySelector('.btn:last-child').focus();
}

/* Runs a set of items. A wrong item comes back once at the end of the same set. */
function runQueue(card, items, renderItem) {
  const q = items.map((x) => ({ it: x, tries: 0 }));
  const total = q.length;
  let done = 0;
  function next() {
    speechSynthesis.cancel();
    if (!q.length) {
      card.replaceChildren(h('div', { class: 'done' },
        h('p', { class: 'done-k' }, 'Set complete'),
        h('p', { class: 'hint' }, `${total} items. Mistakes came back at the end until you got them right.`),
        h('button', { class: 'btn', onclick: () => runQueue(card, items, renderItem) }, 'Play again')));
      return;
    }
    const cur = q.shift();
    const body = h('div', { class: 'item' });
    card.replaceChildren(h('div', { class: 'prog' }, h('div', { class: 'bar', style: `width:${(done / total) * 100}%` })), body);
    renderItem(cur.it, body, (ok) => {
      if (ok) done++;
      else q.push(cur); // mistakes go to the end of the lesson until answered correctly
      next();
    });
  }
  next();
}

function bubble(who, text, me) {
  const face = who === 'Waiter' ? '🧑‍🍳' : who === 'You' ? '🙋' : '👩';
  return h('div', { class: 'bubble' + (me ? ' me' : '') }, h('span', { class: 'who', 'aria-hidden': 'true' }, face),
    h('div', { class: 'txt' }, h('span', { class: 'name' }, who), text));
}
function transcript(lines, names) {
  return h('div', { class: 'transcript' }, lines.map((l, i) =>
    names ? bubble(l.who, l.t) : bubble(i % 2 ? 'Person B' : 'Person A', l.t)));
}
