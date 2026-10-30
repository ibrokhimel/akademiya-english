// Dombi in sync (spec 2026-10-30 in-sync): the lit word follows his voice, beats hold until their sentence or topic ends,
// his mouth keeps moving through a held move, no stage directions reach the subtitle, a cut ends every hold.
//   node src/speak-lab/checks/sync.js     (needs the lab's server: node design/motion/serve.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const URL = 'http://127.0.0.1:8791/src/speak-lab/?fake=1';
const SILENT = path.join(os.tmpdir(), 'speak-lab-silent.wav');
(() => { const n = 16000 * 2, h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n * 2, 40); fs.writeFileSync(SILENT, Buffer.concat([h, Buffer.alloc(n * 2)])); })();
// turn 0 is his opener; each chunk is one piece of text with its sound, at about a real speaking pace
const TURNS = [
  { caption: 'Salom! Qalaysan?', audioMs: 900 },
  { chunks: [{ text: 'Honestly, my morning was fine.', audioMs: 1700 }, { text: ' Then the bus came late,', audioMs: 1500 }, { text: ' and I waited forever.', audioMs: 1500 }] },
  { chunks: [{ text: 'Well, winter is here and everything is grey.', audioMs: 2800 }, { text: ' Anyway, tell me more.', audioMs: 1500 }] },
  { chunks: [{ text: 'This party is wild, honestly.', audioMs: 1900 }, { text: ' Everybody is here tonight.', audioMs: 1800 }, { text: ' Then a trick for you.', audioMs: 1600 }] },
  { chunks: [{ text: 'Ha [jump] okay *spins* (laughs) that is', audioMs: 1500 }, { text: ' how we do it.', audioMs: 1000 }] },
  { chunks: [{ text: 'This party is wild, everybody came, honestly it is the best one yet and', audioMs: 4000 }, { text: ' it goes on and on.', audioMs: 1500 }] },
];
const results = []; const ok = (name, pass, extra = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${SILENT}`, '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript((turns) => { window.FAKE = { turns, cfg: { LIFE_MIN_MS: 60000, LIFE_MAX_MS: 60000 }, feedback: () => Promise.resolve({}), log: (b) => { window.LOGGED = b; return Promise.resolve({}); }, report: () => Promise.resolve({ stars: 1, phrases: [], pron: [] }) }; }, TURNS);
  await p.goto(URL); await p.waitForSelector('.start .go');
  await p.click('.tcard[data-id="football"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.fake && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  // every 40 ms while a turn plays: the lit word, the words' clock times, the live subtitle, his mouth moves
  const record = (ms) => p.evaluate(async (ms) => {
    const T = window.SPEAK.talk, out = []; const end = performance.now() + ms;
    while (performance.now() < end) {
      const lit = document.querySelector('.cap.live .now');
      out.push({ t: T.player.playNow(), lit: lit ? lit.textContent : null, live: document.querySelector('.cap.live').textContent, mouth: T.mouthMoves,
        words: T.clock ? T.clock.words().map((w) => [w.text, Math.round(w.start), Math.round(w.end)]) : [] });
      await new Promise((r) => setTimeout(r, 40));
    }
    return out;
  }, ms);
  const log = () => p.evaluate(() => window.SPEAK.talk.acting.log.slice());
  const next = (fn = '') => p.evaluate((fn) => { if (fn) window.FAKE.direct = new Function('b', fn); window.SPEAK.fake.next(); }, fn);

  // 1. the lit word walks through his line in order and stays inside the sound it came with (each chunk's text with its audio)
  await next(); const r1 = await record(7000);
  const T1 = TURNS[1].chunks, words = r1[r1.length - 1].words, t0 = words[0][1];
  const chunkOf = [], chunkAt = []; let n = 0, acc = t0;
  const count = (s) => s.split(/\s+/).filter(Boolean).length;
  T1.forEach((c, i) => { const m = count(c.text); for (let j = 0; j < m; j++) chunkOf.push(i); chunkAt.push([acc, acc + c.audioMs, n, n + m - 1]); n += m; acc += c.audioMs; });
  const lit = r1.filter((x) => x.lit).map((x) => ({ t: x.t, k: count(x.live) - 1 }));
  let back = 0, outside = []; for (let i = 1; i < lit.length; i++) if (lit[i].k < lit[i - 1].k) back++;
  for (const x of lit) { const c = chunkAt.find((z) => x.t >= z[0] && x.t < z[1]); if (c && (x.k < c[2] - 1 || x.k > c[3] + 1)) outside.push(Math.round(x.t - t0) + 'ms:k' + x.k); }
  ok('the lit word walks through his line in order, every word', back === 0 && new Set(lit.map((x) => x.k)).size >= words.length - 1, `${new Set(lit.map((x) => x.k)).size}/${words.length} words lit, ${back} steps back; ${lit.filter((x, i) => !i || x.k !== lit[i - 1].k).map((x) => Math.round(x.t - t0) + ':' + x.k).join(' ')}`);
  ok('the lit word stays with the sound it came with (one word of slack)', outside.length === 0, outside.slice(0, 6).join(' '));
  ok('the live subtitle never shows a word before it plays', r1.every((x) => { const said = x.words.filter((w) => w[1] <= x.t + 100).length; return count(x.live) <= said; }));

  // 2. the word list's shiver holds from "winter" to the end of its sentence
  let before = (await log()).length; await next(); const r2 = await record(5200);
  let L = (await log()).slice(before); const w2 = r2[r2.length - 1].words;
  const sOn = L.find((x) => x.id === 'shiver' && x.how === 'word'), sOff = L.find((x) => x.id === 'shiver' && x.how === 'released');
  const greyEnd = w2.find((w) => w[0] === 'grey'), anyway = w2.find((w) => w[0] === 'Anyway');
  ok('shiver starts on "winter" and lets go at its sentence end', !!sOn && !!sOff && greyEnd && anyway && sOff.at >= w2.find((w) => w[0] === 'grey')[1] && sOff.at <= anyway[1] + 200, sOn && sOff && greyEnd ? `held ${sOff.at - sOn.at} ms, released ${Math.round(sOff.at - greyEnd[2])} ms after "grey" ends` : JSON.stringify(L.map((x) => x.id + ':' + x.how)));
  const m2 = r2.filter((x) => sOn && sOff && x.t >= sOn.at && x.t <= sOff.at);
  ok('his mouth keeps moving while the shiver holds', m2.length > 2 && m2[m2.length - 1].mouth - m2[0].mouth >= 5, m2.length ? `${m2[m2.length - 1].mouth - m2[0].mouth} mouth changes` : 'no hold');

  // 3. a director topic hold (dance on "party") carries into the next sentence and ends when the trick starts
  before = (await log()).length;
  await next("return Promise.resolve(/party/.test(b.said) ? { beats: [{ action: 'dance', word: 'party', until: 'topic' }], keep: true, turn: b.turn } : /trick/.test(b.said) ? { beats: [{ action: 'trickSpin', word: 'trick', until: 'sentence' }], keep: true, turn: b.turn } : { beats: [], keep: true, turn: b.turn });");
  const r3 = await record(6200); L = (await log()).slice(before); const w3 = r3[r3.length - 1].words;
  const dOn = L.find((x) => x.id === 'dance' && x.how === 'word'), dOff = L.find((x) => x.id === 'dance' && x.how === 'released'), trick = L.find((x) => x.id === 'trickSpin' && x.how === 'word');
  const honestly = w3.find((w) => w[0] === 'honestly');
  ok('the dance holds past its own sentence', !!dOn && !!dOff && honestly && dOff.at > honestly[2] + 500, dOn && dOff ? `held ${dOff.at - dOn.at} ms` : JSON.stringify(L.map((x) => x.id + ':' + x.how)));
  ok('and lets go when the trick starts', !!trick && !!dOff && Math.abs(dOff.at - trick.at) <= 60, trick && dOff ? `${dOff.at - trick.at} ms apart` : 'no trick');

  // 4. stage directions never reach the subtitle
  await p.evaluate(() => { delete window.FAKE.direct; }); await next(); const r4 = await record(3200);
  ok('no [tags], *actions* or (laughs) in the subtitle', r4.every((x) => !/[[\]*]|\(laughs\)/.test(x.live)) && r4.some((x) => /okay/.test(x.live)), [...new Set(r4.map((x) => x.live))].slice(-1)[0]);

  // 5. a cut in the middle of a topic hold ends it at once (applause: dance is a big move and had its turn in 3)
  before = (await log()).length;
  await next("return Promise.resolve(/party/.test(b.said) ? { beats: [{ action: 'applause', word: 'party', until: 'topic' }], keep: true, turn: b.turn } : { beats: [], keep: true, turn: b.turn });");
  await p.waitForTimeout(2600); const cutAt = await p.evaluate(() => { window.SPEAK.fake.interrupt(); return performance.now(); }); await p.waitForTimeout(400);
  L = (await log()).slice(before); const dCut = L.find((x) => x.id === 'applause' && x.how === 'released');
  ok('a cut mid-hold lets go within 150 ms', !!L.find((x) => x.id === 'applause' && x.how === 'word') && !!dCut && dCut.at - cutAt <= 150, dCut ? `${Math.round(dCut.at - cutAt)} ms` : JSON.stringify(L.map((x) => x.id + ':' + x.how)));
  const mouthAfter = await p.evaluate(() => new Promise((r) => setTimeout(() => r(window.SPEAK.talk.dombi && document.querySelector('.cap.live').textContent), 200)));
  ok('after the cut the subtitle is empty', mouthAfter === '', JSON.stringify(mouthAfter));

  // 6. the talk log keeps each turn's word times, his mouth shapes and every beat's start and let-go
  await p.evaluate(() => window.SPEAK.talk.end()); await p.waitForFunction(() => window.LOGGED, null, { timeout: 5000 });
  const LG = await p.evaluate(() => ({ words: window.LOGGED.words.length, first: window.LOGGED.words[0], visemes: window.LOGGED.visemes.length, held: window.LOGGED.acting.filter((x) => x.how === 'released').length }));
  ok('the talk log has word times, mouth shapes and beats', LG.words >= 5 && LG.first.words.length >= 2 && LG.visemes > 50 && LG.held >= 3, JSON.stringify({ ...LG, first: undefined }));
  ok('no page errors', errors.length === 0, errors.join(' | '));
  await b.close();
  const failed = results.filter((r) => !r).length; console.log(failed ? `sync: ${failed} FAILED` : 'sync: ok'); process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
