// Exercise registry, navigation, mode/language switches and tester notes.

const EX = [
  { id: 'E1', act: 'Picture Talk', name: 'Meet It', ladder: 'Intro', input: 'Listen + speak', fn: meetIt, desc: 'Listen first: picture, meaning and audio with no text. Repeat what you heard, then see the text.' },
  { id: 'E2', act: 'Picture Talk', name: 'Say What You See', ladder: 'Recall', input: 'Speak', fn: sayWhatYouSee, desc: 'A situation in Uzbek or Russian tells you what to say. Say the English phrase from memory.' },
  { id: 'E3', act: 'Picture Talk', name: 'Match Rush', ladder: 'Recognise', input: 'Listen + match', fn: matchRush, desc: 'Four sounds to four phrases against the clock. In Silent mode: meanings to phrases.' },
  { id: 'E4', act: 'Build the Sentence', name: 'Tile Builder', ladder: 'Rebuild', input: 'Tiles + speak', fn: tileBuilder, desc: 'Build the English sentence from word tiles, then read it aloud.' },
  { id: 'E5', act: 'Build the Sentence', name: 'Complete the Chunk', ladder: 'Recognise', input: 'Tap', fn: completeChunk, desc: 'Pick the missing piece of a ready-made phrase.' },
  { id: 'E6', act: 'Overheard', name: 'What Happened?', ladder: 'Recognise', input: 'Listen + tap', fn: whatHappened, desc: 'A short conversation with no text. Answer, then the text appears.' },
  { id: 'E7', act: 'Overheard', name: 'Who Said It?', ladder: 'Recognise', input: 'Listen + tap', fn: whoSaidIt, desc: 'Listen, then decide which character said the line.' },
  { id: 'E8', act: 'Overheard', name: 'Missing Word', ladder: 'Recall', input: 'Listen + type', fn: missingWord, desc: 'Hear the full sentence and type the word that is missing on screen.' },
  { id: 'E9', act: 'Echo', name: 'Echo Line', ladder: 'Recall', input: 'Speak', fn: echoLine, desc: 'Repeat a character’s line right after them. Each word turns green or orange.' },
  { id: 'E10', act: 'Sound Duel', name: 'Which One?', ladder: 'Recognise', input: 'Listen + tap', fn: whichOne, desc: 'Ship or sheep? Fast rounds on the sounds Uzbek and Russian speakers find hard.' },
  { id: 'E11', act: 'Sound Duel', name: 'Say Both', ladder: 'Recall', input: 'Speak', fn: sayBoth, desc: 'Say both words of a pair so they sound different.' },
  { id: 'E12', act: 'Spot the Rule', name: 'Find the Pattern', ladder: 'Notice', input: 'Tap', fn: findPattern, desc: 'Guess the rule from examples, then a two-line confirmation in Uzbek or Russian.' },
  { id: 'E13', act: 'Fix It', name: 'Tap the Mistake', ladder: 'Recognise', input: 'Tap', fn: tapMistake, desc: 'A context line plus a sentence with one typical Uzbek/Russian mistake. Find the wrong word.' },
  { id: 'E14', act: 'Fix It', name: 'Fix & Say', ladder: 'Recall', input: 'Speak', fn: fixAndSay, desc: 'A context line plus a wrong sentence. Say the corrected sentence out loud.' },
  { id: 'E15', act: 'Quick Reply', name: 'Guided Reply', ladder: 'Use', input: 'Tap + speak', fn: guidedReply, desc: 'Pick a reply, say it, and the waiter reacts.' },
  { id: 'E16', act: 'Quick Reply', name: 'Free Reply', ladder: 'Use', input: 'Speak freely', fn: freeReply, desc: 'Say anything to the waiter. Mistakes are corrected by repeating them the right way.' },
];

const MODES = [['full', 'Full'], ['headphones', 'Headphones'], ['silent', 'Silent']];
const LANGS = [['uz', "O'zbekcha"], ['ru', 'Русский']];

function readRating(id) {
  try { return JSON.parse(localStorage.getItem('lab.rate.' + id)) || { v: '', note: '' }; } catch (e) { return { v: '', note: '' }; }
}
function writeRating(id, r) {
  try { localStorage.setItem('lab.rate.' + id, JSON.stringify(r)); } catch (e) { /* storage unavailable */ }
}

function updateLater() {
  const el = document.getElementById('later');
  el.textContent = `Saved for later: ${S.later.size}`;
  el.title = [...S.later].map((id) => EX.find((e) => e.id === id).name).join(', ') || 'Nothing saved';
  const pill = document.getElementById('speak-on');
  pill.hidden = !S.noSpeak;
}

function drawSeg(el, options, key) {
  el.replaceChildren(...options.map(([v, label]) => h('button', {
    class: 'seg-b' + (S[key] === v ? ' on' : ''), 'aria-pressed': String(S[key] === v),
    onclick: () => { S[key] = v; store(key, v); drawSeg(el, options, key); mount(); },
  }, label)));
}

function drawNav() {
  const nav = document.getElementById('nav');
  const kids = [];
  let act = '';
  for (const e of EX) {
    if (e.act !== act) { act = e.act; kids.push(h('h2', {}, act)); }
    const r = readRating(e.id);
    kids.push(h('button', { class: 'nav-b' + (S.ex === e.id ? ' on' : ''), 'aria-current': S.ex === e.id ? 'true' : false, onclick: () => go(e.id) },
      h('span', { class: 'nav-code' }, e.id), h('span', { class: 'nav-name' }, e.name),
      r.v ? h('span', { class: 'nav-dot ' + r.v, title: r.v }) : null));
  }
  const copyBtn = h('button', { class: 'btn ghost' }, 'Copy all notes');
  copyBtn.addEventListener('click', async () => {
    const text = EX.map((e) => { const r = readRating(e.id); return `${e.id} ${e.name}: ${r.v || '—'}${r.note ? ' · ' + r.note : ''}`; }).join('\n');
    try { await navigator.clipboard.writeText(text); copyBtn.textContent = 'Copied'; }
    catch (err) { copyBtn.textContent = 'Copy failed'; }
    setTimeout(() => { copyBtn.textContent = 'Copy all notes'; }, 1500);
  });
  kids.push(h('div', { class: 'side-foot' }, h('p', {}, 'Dots show your verdict: green fun, yellow OK, red boring.'), copyBtn));
  nav.replaceChildren(...kids);
}

function drawRating(e) {
  const r = readRating(e.id);
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Verdict' });
  const drawButtons = () => seg.replaceChildren(...[['fun', 'Fun'], ['ok', 'OK'], ['boring', 'Boring']].map(([v, label]) => h('button', {
    class: 'seg-b' + (r.v === v ? ' on' : ''), 'aria-pressed': String(r.v === v),
    onclick: () => { r.v = r.v === v ? '' : v; writeRating(e.id, r); drawButtons(); drawNav(); },
  }, label)));
  drawButtons();
  const ta = h('textarea', { id: 'note-' + e.id, rows: '3', placeholder: 'What felt boring, confusing or fake? (saved in this browser)' });
  ta.value = r.note;
  ta.addEventListener('input', () => { r.note = ta.value; writeRating(e.id, r); });
  document.getElementById('rate').replaceChildren(h('p', { class: 'eyebrow' }, 'Tester verdict'), seg, ta);
}

function mount() {
  if (S.cleanup) { S.cleanup(); S.cleanup = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const e = EX.find((x) => x.id === S.ex) || EX[0];
  drawNav();
  document.getElementById('meta').replaceChildren(
    h('p', { class: 'eyebrow' }, `${e.id} · ${e.act}`),
    h('h1', {}, e.name),
    h('p', {}, e.desc),
    h('div', { class: 'tags' }, h('span', { class: 'tag ladder' }, 'Ladder: ' + e.ladder), h('span', { class: 'tag' }, 'Input: ' + e.input)));
  const old = document.getElementById('card');
  const card = h('div', { class: 'card', id: 'card' });
  old.replaceWith(card);
  e.fn(card);
  drawRating(e);
}

function go(id) { S.ex = id; store('ex', id); mount(); window.scrollTo({ top: 0 }); }

drawSeg(document.getElementById('mode-seg'), MODES, 'mode');
drawSeg(document.getElementById('l1-seg'), LANGS, 'l1');
document.getElementById('speak-on').addEventListener('click', () => { S.noSpeak = false; updateLater(); mount(); });
updateLater();
mount();
