// A whole talk with the scripted Gemini (?fake=1) in headless Chrome, and the mic-blocked screen.
//   node src/speak-lab/checks/talk.js     (needs the lab's server: node design/motion/serve.js)
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8791/src/speak-lab/?fake=1';
const TURNS = [{ caption: 'Salom! Bugun nima qilding?', mood: 'happy', audioMs: 500 }, { caption: 'Ha-ha, that was actually funny bro.', mood: 'laugh', audioMs: 500 }, { caption: 'Okay. Tell me more about the match.', mood: 'think', audioMs: 400 }];
const results = []; const ok = (name, pass, extra = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  // 1. a talk: three scripted turns, the mood follows, End shows the report
  let p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript((turns) => { window.FAKE = { turns }; }, TURNS);
  await p.goto(URL);
  // the start page: six packs, BOSHLASH off until a topic is picked, then Futbol + Qo'pol
  await p.waitForSelector('.start .go');
  ok('start page has six packs', (await p.$$('.pk')).length === 6);
  ok('start is off before a topic', await p.$eval('.go', (e) => e.classList.contains('disabled')));
  await p.click('.tcard[data-id="football"]'); await p.click('.pk[data-id="rude"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.fake && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  ok('talk shows the topic name', (await p.textContent('.tbar .topic')) === 'Futbol');
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  const moodAfter2 = await p.evaluate(() => window.SPEAK.talk.state.mood);
  await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 3, null, { timeout: 10000 });
  const caps = await p.$$eval('.cap.done', (els) => els.map((e) => e.textContent));
  ok('three captions in order', caps.join('|') === TURNS.map((t) => t.caption).join('|'), caps.join(' | '));
  ok('mood laugh on the second turn', moodAfter2 === 'laugh', moodAfter2);
  ok('mic chunks reach the session', await p.evaluate(() => window.SPEAK.fake.sent.audioChunks) > 3);
  await p.click('.end'); await p.waitForSelector('.report', { timeout: 5000 });
  ok('End shows the report', (await p.$('.report')) !== null);
  ok('no page errors', errors.length === 0, errors.join('; '));
  await p.close();
  // 2. the mic blocked: the Uzbek line and a retry
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }); await ctx.grantPermissions([]);
  p = await ctx.newPage(); await p.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); });
  await p.goto(URL); await p.waitForSelector('.start .go'); await p.click('.tcard[data-id="day"]'); await p.click('.go'); await p.waitForSelector('.problem', { timeout: 10000 });
  const line = await p.textContent('.problem p');
  ok('mic-blocked line', /Mikrofon yopiq/.test(line) && (await p.$('.retry')) !== null, line);
  await b.close();
  console.log(results.every(Boolean) ? 'talk: ok' : 'talk: FAIL'); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.log('talk: FAIL', e.message); process.exit(1); });
