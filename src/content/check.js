// Checks the lesson files against the lesson rules (docs/ideas/lesson-template.md, exercises.md, mistake-engine.md).
//   node check.js            every rule; lists what is wrong, what is only worth a look, and what is missing (pictures, audio)
//   node check.js --clips    prints the list of sound clips the lessons need, as JSON (the audio builder reads this)
//   node check.js --words    prints, per lesson, the words heard in conversations that no earlier phrase has taught
const fs = require('fs'), path = require('path');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), PICS = path.join(ROOT, 'pendev', 'icons-r2');
const read = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));
const phrases = read('phrases.json').phrases, traps = read('traps.json').traps, units = [1, 2, 3].map((n) => read(`unit-${n}.json`));
const P = Object.fromEntries(phrases.map((p) => [p.id, p])), T = new Set(traps.map((t) => t.id)), VOICES = ['aziz', 'malika', 'waiter', 'seller'];
const errors = [], notes = [], missing = [];
const err = (where, what) => errors.push(`${where}: ${what}`), note = (where, what) => notes.push(`${where}: ${what}`);

// the text of an item's answer, who says it, and its words as tiles
const answer = (it) => it.p ? P[it.p].en : it.en || it.line || it.right;
const voiceOf = (it) => it.voice || (it.p && P[it.p].voice) || (phrases.find((p) => p.en === answer(it)) || {}).voice || 'malika';
const tiles = (text) => text.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
const slug = (text) => text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const kind = (it) => (it.ex === 'gap' ? 'fix' : it.ex);

// ---- every clip the lessons play: one per (voice, text) ----
function clips() {
  const all = new Map(), add = (voice, text, why) => { const k = `${voice}/${slug(text)}`, had = all.get(k);
    if (had && had.text !== text) err('clips', `"${had.text}" and "${text}" would be the same file for ${voice}`);
    if (!had) all.set(k, { voice, text, file: `${voice}/${slug(text)}`, why }); };
  phrases.forEach((p) => add(p.voice, p.en, 'phrase'));
  for (const u of units) for (const l of [...u.lessons, u.checkpoint]) for (const it of l.items) {
    if (it.ex === 'heard') it.talk.forEach(([who, text]) => add(who, text, 'conversation'));
    else { if (it.lead) add(it.lead[0], it.lead[1], 'cue'); add(voiceOf(it), answer(it), it.ex); }
  }
  return [...all.values()];
}
if (process.argv.includes('--clips')) { console.log(JSON.stringify(clips())); process.exit(0); }

const picFile = (pic) => pic.startsWith('text:') ? null : path.join(PICS, pic.startsWith('icon:') ? `${pic.slice(5)}.png` : `lesson-${pic}.png`);
const needPic = (where, pic) => { const f = picFile(pic); if (f && !fs.existsSync(f)) missing.push(`picture ${pic}  (${where})`); };

// ---- phrases ----
{ const seen = new Set(), texts = new Set();
  for (const p of phrases) { const w = `phrase ${p.id}`;
    if (seen.has(p.id)) err(w, 'the id is used twice'); seen.add(p.id);
    if (texts.has(p.en)) err(w, `"${p.en}" is in the list twice`); texts.add(p.en);
    for (const k of ['en', 'uz', 'pic', 'voice', 'lesson']) if (!p[k]) err(w, `no ${k}`);
    if (!VOICES.includes(p.voice)) err(w, `unknown voice ${p.voice}`);
    (p.loose || []).forEach((x) => { if (!tiles(p.en).includes(x)) err(w, `loose word "${x}" is not in the phrase`); });
    needPic(w, p.pic); } }

// ---- lessons and checkpoints ----
const known = new Set(), recycled = Object.fromEntries(phrases.map((p) => [p.id, 0])), heardWords = {};
const SUPPORT = new Set(['anything', 'else', 'yes', 'too']);                          // words a learner hears before they are taught, kept to a few
function checkItems(l, n, isCheckpoint) {
  const w = l.id; let run = 0, prev = '';
  l.items.forEach((it, i) => { const at = `${w} item ${i + 1} (${it.ex})`, k = kind(it);
    run = k === prev ? run + 1 : 1; prev = k; if (run > 3 && it.step == null) err(at, 'more than 3 of the same exercise in a row');      // the checkpoint's story chain is 5 on purpose
    if (!['meet', 'heard', 'fix', 'gap', 'echo', 'tiles', 'say'].includes(it.ex)) return err(at, 'unknown exercise');
    for (const id of [it.p, it.of, ...(it.also || [])].filter(Boolean)) {                              // of: the phrase a free sentence practises
      if (!P[id]) return err(at, `no phrase ${id}`);
      if (P[id].lesson > n) err(at, `${id} is taught later, in lesson ${P[id].lesson}`);
      if (it.review && P[id].lesson >= n && !isCheckpoint && id !== (it.also || [])[0]) err(at, `${id} is marked review but is from this lesson`);
      if (!it.review && it.ex !== 'meet' && !isCheckpoint && P[id].lesson < n && (id === it.p || id === it.of) && !it.use) note(at, `${id} is from lesson ${P[id].lesson} but not marked review`);
      if (it.ex !== 'meet' && P[id].lesson < n) recycled[id]++;
      if (it.ex !== 'meet' && !known.has(id) && (id === it.p || id === it.of)) err(at, `${id} is used before its Meet It`);
    }
    if (it.pic) needPic(at, it.pic);
    if (it.voice && !VOICES.includes(it.voice)) err(at, `unknown voice ${it.voice}`);
    if (it.trap && !T.has(it.trap)) err(at, `no trap ${it.trap}`);
    if (it.ex === 'meet') { if (P[it.p].lesson !== n) err(at, `${it.p} belongs to lesson ${P[it.p].lesson}`); known.add(it.p); }
    if (it.ex === 'heard') {
      if (!it.q || !Array.isArray(it.opts) || it.opts.length !== 3) err(at, 'needs a question and exactly 3 answers');
      if (!(it.right >= 0 && it.right < 3)) err(at, 'the right answer is not one of the 3');
      it.opts.forEach(([pic]) => needPic(at, pic)); if (new Set(it.opts.map((o) => o.join('|'))).size !== 3) err(at, 'two answers are the same');
      it.talk.forEach(([who, text]) => { if (!VOICES.includes(who)) err(at, `unknown voice ${who}`);
        tiles(text).forEach((x) => { (heardWords[w] = heardWords[w] || new Set()).add(x.toLowerCase()); }); });
    }
    if (it.ex === 'fix') { if (!(it.bad >= 0 && it.bad < it.words.length)) err(at, 'the wrong word is not in the sentence'); if (!it.ctx || !it.right || !it.trap) err(at, 'needs a context line, the right sentence and a trap'); }
    if (it.ex === 'gap') { if (!(it.gap >= 0 && it.gap <= it.words.length)) err(at, 'the gap is outside the sentence'); if (!it.ctx || !it.right || !it.trap) err(at, 'needs a context line, the right sentence and a trap');
      const built = tiles(it.right).length; if (built !== it.words.length && built !== it.words.length + 1) note(at, 'the right sentence is not the shown one plus a word'); }
    if (it.ex === 'tiles') { const ans = tiles(answer(it)).map((x) => x.toLowerCase());
      if (!it.p && (!it.en || !it.uz)) err(at, 'a free sentence needs en and uz');
      if (!Array.isArray(it.extra) || it.extra.length !== 2) err(at, 'needs 2 extra words');
      (it.extra || []).forEach((x) => { if (ans.includes(x.toLowerCase())) err(at, `extra word "${x}" is part of the answer`); });
      if (ans.length < 2) err(at, 'the answer is one word'); }
    if (it.ex === 'echo' && !it.p && (!it.line || !it.uz)) err(at, 'a free line needs line and uz');
    if (it.ex === 'say' && !it.task) err(at, 'no task');
  });
}
for (const u of units) {
  for (const l of u.lessons) { const w = l.id, n = l.n;
    for (const id of l.new) { if (!P[id]) { err(w, `no phrase ${id}`); continue; } if (P[id].lesson !== n) err(w, `${id} is marked for lesson ${P[id].lesson}`);
      if (!l.items.some((it) => it.ex === 'meet' && it.p === id)) err(w, `${id} has no Meet It`);
      if (!l.items.some((it) => ['echo', 'tiles', 'say'].includes(it.ex) && (it.p === id || it.of === id))) err(w, `${id} is never said or built in its own lesson`); }
    phrases.filter((p) => p.lesson === n && !l.new.includes(p.id)).forEach((p) => err(w, `${p.id} is for this lesson but not in "new"`));
    checkItems(l, n, false);
    const count = l.items.length, fixes = l.items.filter((it) => kind(it) === 'fix'), reviews = l.items.filter((it) => it.review).length, last = l.items[count - 1];
    if (n === 1 ? count !== 8 : count < 12 || count > 13) err(w, `${count} items`);
    if (!(last.ex === 'say' && last.use)) err(w, 'does not end with the Use item');
    if (n !== 1 && reviews !== 2) err(w, `${reviews} review items, not 2`); if (n === 1 && reviews) err(w, 'lesson 1 has no review');
    if (l.trap === 'T9') { if (l.items.filter((it) => it.ex === 'heard' && it.trap === 'T9').length !== 2) err(w, 'the fifteen / fifty trap needs 2 What Happened? items'); }
    else if (l.trap) { if (fixes.length !== 1 || fixes[0].trap !== l.trap) err(w, `needs exactly one Tap the Mistake item for ${l.trap}`); }
    else if (fixes.length) err(w, 'has a Tap the Mistake item but no trap');
    if (l.items.filter((it) => it.ex === 'heard').length < 1) err(w, 'no What Happened? item');
  }
  const c = u.checkpoint; checkItems(c, 99, true);
  if (l5(c.items.length)) err(c.id, `${c.items.length} items`);
  if (c.items.some((it) => it.ex === 'meet')) err(c.id, 'a checkpoint teaches nothing new');
  const chain = c.items.filter((it) => it.ex === 'say' && it.step != null);
  if (chain.length !== 5 || c.steps.length !== 5 || chain.some((it, i) => it.step !== i)) err(c.id, 'the story chain needs 5 steps in order');
  if (c.items.slice(-5).some((it) => it.step == null)) err(c.id, 'the story chain is not at the end');
  for (const [ex, want] of [['heard', 2], ['fix', 2], ['echo', 2], ['tiles', 2]]) if (c.items.filter((it) => kind(it) === ex && !it.review).length !== want) err(c.id, `needs ${want} ${ex} items`);
}
function l5(n) { return n < 13 || n > 15; }

// ---- things worth a look ----
phrases.forEach((p) => { if (!recycled[p.id] && p.lesson < 15) note(`phrase ${p.id}`, 'never comes back after its own lesson'); });
const taught = (n) => new Set(phrases.filter((p) => p.lesson <= n).flatMap((p) => tiles(p.en).map((x) => x.toLowerCase())));
const NAMES = new Set(['aziz', 'malika']);
const newWords = []; for (const u of units) for (const l of [...u.lessons, u.checkpoint]) { const have = taught(l.n || 99);
  const extra = [...(heardWords[l.id] || [])].filter((x) => !have.has(x) && !NAMES.has(x)); if (extra.length) newWords.push(`${l.id}: ${extra.join(', ')}`);
  extra.forEach((x) => { if (!SUPPORT.has(x) && !/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)$/.test(x)) note(l.id, `a conversation uses "${x}", which no phrase has taught yet`); }); }
if (process.argv.includes('--words')) { console.log(newWords.join('\n')); process.exit(0); }

// ---- sound clips ----
const list = clips(), AUDIO = path.join(HERE, 'audio'); let cast = null;
try { cast = JSON.parse(fs.readFileSync(path.join(AUDIO, 'cast.json'), 'utf8')).use; } catch (e) {}
if (cast) for (const c of list) for (const f of [`${c.file}.wav`, `${c.file}.slow.wav`]) if (!fs.existsSync(path.join(AUDIO, cast, f))) missing.push(`sound ${cast}/${f}  "${c.text}"`);

const items = units.flatMap((u) => [...u.lessons, u.checkpoint]).reduce((a, l) => a + l.items.length, 0);
console.log(`${phrases.length} phrases · ${units.reduce((a, u) => a + u.lessons.length, 0)} lessons + ${units.length} checkpoints · ${items} items · ${list.length} sound clips${cast ? ` (voices: ${cast})` : ' (no audio built yet)'}`);
if (notes.length) console.log(`\nWorth a look (${notes.length}):\n  ` + notes.join('\n  '));
if (missing.length) console.log(`\nMissing (${missing.length}):\n  ` + [...new Set(missing)].join('\n  '));
if (errors.length) { console.log(`\nWrong (${errors.length}):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('\nNo rule is broken.');
