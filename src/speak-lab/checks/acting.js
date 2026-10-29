// Dombi acting out his lines, with the scripted Gemini (?fake=1) in headless Chrome.
//   node src/speak-lab/checks/acting.js     (needs the lab's server: node design/motion/serve.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const URL = 'http://127.0.0.1:8791/src/speak-lab/?fake=1';
const SILENT = path.join(os.tmpdir(), 'speak-lab-silent.wav');
(() => { const n = 16000 * 2, h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n * 2, 40); fs.writeFileSync(SILENT, Buffer.concat([h, Buffer.alloc(n * 2)])); })();
// turn 0 is his opener; the check plays the others one by one with SPEAK.fake.next()
const TURNS = [
  { caption: 'Salom! Qalaysan?', audioMs: 400 },
  { chunks: [{ text: 'I am still dizzy from the bus.', audioMs: 900 }, { text: ' Chorsu samsa is the best.', audioMs: 900 }] },
  { chunks: [{ text: 'Watch this, I am so hungry! Watch this again.', audioMs: 1400 }] },
  { chunks: [{ text: 'I am still diz', audioMs: 500 }, { text: 'zy, bro.', audioMs: 500 }] },
  { chunks: [{ text: 'Okay okay okay, honestly, it is a lot, that is so cool.', audioMs: 2400 }] },
  { chunks: [{ text: 'That was smooth, bro, honestly.', audioMs: 1500 }] },
  { chunks: [{ text: 'Fine, whatever you say.', audioMs: 700 }] },
  { chunks: [{ text: 'Messi is better. Fight me.', audioMs: 1400 }] },
  { chunks: [{ text: 'Okay, still dizzy, but you go first.', audioMs: 2400 }] },
];
const results = []; const ok = (name, pass, extra = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`); };
const log = (p) => p.evaluate(() => (window.SPEAK.talk.acting ? window.SPEAK.talk.acting.log.slice() : null));

(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${SILENT}`, '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  // his own moves every 0.3–0.6 s here (3–8 s for real), and walking much more likely, so the living cases are quick
  await p.addInitScript((turns) => { window.FAKE = { turns, cfg: { LIFE_MIN_MS: 300, LIFE_MAX_MS: 600, TRAVEL_WEIGHT: 20, ACT_OFFSET_MS: 0 }, feedback: () => Promise.resolve({}), report: () => Promise.resolve({ stars: 1, phrases: [], pron: [] }) }; }, TURNS);
  await p.goto(URL); await p.waitForSelector('.start .go');
  await p.click('.tcard[data-id="football"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.fake && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  ok('the talk has an acting engine with a log', Array.isArray(await log(p)));
  if (!(await log(p))) { await b.close(); process.exit(1); }

  // 1. "dizzy" lands on its word (word 3 of 7 in a 900 ms chunk: ~386 ms in), "samsa" makes him eat after his voice is done
  await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForTimeout(3200);
  let L = await log(p);
  const dz = L.find((x) => x.id === 'dizzy' && x.how === 'word'), eat = L.find((x) => x.id === 'eat' && x.how === 'pause');
  ok('dizzy fires on its word', !!dz && dz.how === 'word' && Math.abs(dz.at - dz.turnStartAt - 386) <= 150, dz ? `${dz.at - dz.turnStartAt} ms into the turn` : 'not fired');
  ok('eat waits until his voice is done', !!eat && eat.how === 'pause' && eat.at - eat.turnStartAt >= 1800, eat ? `${eat.at - eat.turnStartAt} ms into the turn` : 'not fired');

  // 2. one per sentence (trickSpin wins over eat in sentence 1), no repeats (sentence 2's trickSpin is skipped)
  let before = L.length; await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForTimeout(1800);
  L = await log(p); ok('one action per sentence, never twice running', L.slice(before).filter((x) => x.how === 'word' || x.how === 'pause').map((x) => x.id).join() === 'trickSpin', JSON.stringify(L.slice(before).map((x) => x.id + ':' + x.how)));

  // 3. a word split across pieces still matches
  before = L.length; await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForTimeout(1600);
  L = await log(p); ok('"diz" + "zy" still fires dizzy', L.slice(before).some((x) => x.id === 'dizzy' && x.how === 'word'));

  // 4. interrupted with trickShades planned ~2 s ahead: nothing fires after the interrupt
  before = L.length; await p.evaluate(() => { window.SPEAK.fake.next(); setTimeout(() => window.SPEAK.fake.interrupt(), 150); }); await p.waitForTimeout(2600);
  L = await log(p); ok('nothing fires after an interrupt', L.slice(before).some((x) => x.id === 'trickShades' && x.how === 'plan') && !L.slice(before).some((x) => x.how === 'word' || x.how === 'pause'), JSON.stringify(L.slice(before)));

  // 5. the director: no word-list match in "That was smooth, bro", Flash picks trickSpin on "smooth" and it fires
  before = L.length;
  await p.evaluate(() => { window.FAKE.directCalls = []; window.FAKE.direct = (b) => { window.FAKE.directCalls.push(b); return Promise.resolve(/smooth/.test(b.said) ? { action: 'trickSpin', word: 'smooth', strength: 'small', turn: b.turn } : { action: null, turn: b.turn }); }; window.SPEAK.fake.next(); });
  await p.waitForTimeout(2200);
  L = await log(p); const calls = await p.evaluate(() => window.FAKE.directCalls);
  ok('the director is asked per clause, with the turn and recent actions', calls.length >= 2 && calls.every((c) => typeof c.turn === 'number' && Array.isArray(c.recent)), `${calls.length} calls`);
  ok('a director pick fires on its word', L.slice(before).some((x) => x.id === 'trickSpin' && x.how === 'word'), JSON.stringify(L.slice(before).map((x) => x.id + ':' + x.how)));
  // 6. an answer that comes after his turn is over is dropped
  before = L.length;
  await p.evaluate(() => { window.FAKE.direct = (b) => new Promise((r) => setTimeout(() => r({ action: 'clap', word: 'Fine', turn: b.turn }), 2500)); window.SPEAK.fake.next(); });
  await p.waitForTimeout(3600);
  L = await log(p); ok('a late answer after his turn is dropped', L.slice(before).some((x) => x.id === 'clap' && x.how === 'dropped') && !L.slice(before).some((x) => x.id === 'clap' && (x.how === 'word' || x.how === 'pause')), JSON.stringify(L.slice(before).map((x) => x.id + ':' + x.how)));
  await p.evaluate(() => { delete window.FAKE.direct; });

  // 7. living: while the learner talks only listening moves and no walking; when it's quiet he walks to other spots
  const S = () => p.evaluate(() => window.SPEAK.talk.stage.log.slice());
  let s0 = (await S()).length;
  for (let i = 0; i < 12; i++) { await p.evaluate(() => window.SPEAK.fake.learner('and then I ')); await p.waitForTimeout(500); }
  let sl = (await S()).slice(s0);
  ok('while the learner talks: listening moves only, no walking', sl.length >= 3 && sl.every((x) => !x.travel && x.state === 'listening' && x.fits), JSON.stringify(sl.map((x) => x.travel ? 'walk' : x.id + ':' + x.state)));
  await p.waitForTimeout(1700); s0 = (await S()).length; await p.waitForTimeout(6000);
  sl = (await S()).slice(s0);
  ok('when it is quiet he walks to other spots', sl.some((x) => x.travel), JSON.stringify(sl.map((x) => x.travel ? 'walk:' + x.travel : x.id)));
  const moved = await p.evaluate(() => getComputedStyle(document.querySelector('.dbox')).left);
  ok('his box really moved on the stage', moved !== '' && await p.evaluate(() => document.querySelector('.stage').classList.contains('living')), moved);

  // 8. a new emote: "Fight me." puts his fists up on "Fight"
  before = (await log(p)).length; await p.evaluate(() => { window.SPEAK.fake.next(); }); await p.waitForTimeout(2400);
  L = await log(p); ok('"Fight me." fires fistsUp on its word', L.slice(before).some((x) => x.id === 'fistsUp' && x.how === 'word' && /fight/i.test(x.word)), JSON.stringify(L.slice(before).map((x) => x.id + ':' + x.how)));

  // 9. End with an action scheduled: nothing fires after End, no page errors
  before = L.length; await p.evaluate(() => { window.SPEAK.fake.next(); setTimeout(() => window.SPEAK.talk.end(), 150); }); await p.waitForTimeout(2600);
  L = await p.evaluate(() => window.SPEAK.talk.acting.log.slice());
  ok('nothing fires after End', L.slice(before).some((x) => x.id === 'dizzy' && x.how === 'plan') && !L.slice(before).some((x) => x.how === 'word' || x.how === 'pause'), JSON.stringify(L.slice(before)));
  const sEnd = await p.evaluate(() => window.SPEAK.talk.stage.log.length); await p.waitForTimeout(1500);
  ok('after End he does nothing more on his own', (await p.evaluate(() => window.SPEAK.talk.stage.log.length)) === sEnd);
  ok('no page errors', errors.length === 0, errors.join(' | '));
  await b.close();
  const failed = results.filter((r) => !r).length; console.log(failed ? `acting: ${failed} FAILED` : 'acting: ok'); process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
