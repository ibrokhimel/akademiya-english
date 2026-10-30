// A whole talk with the scripted Gemini (?fake=1) in headless Chrome, and the mic-blocked screen.
//   node src/speak-lab/checks/talk.js     (needs the lab's server: node design/motion/serve.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const URL = 'http://127.0.0.1:8791/src/speak-lab/?fake=1';
// a silent microphone (Chrome's default fake device beeps, which would count as the learner speaking)
const SILENT = path.join(os.tmpdir(), 'speak-lab-silent.wav');
(() => { const n = 16000 * 2, h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n * 2, 40); fs.writeFileSync(SILENT, Buffer.concat([h, Buffer.alloc(n * 2)])); })();
const TURNS = [{ caption: 'Salom! Bugun nima qilding?', mood: 'happy', audioMs: 500 }, { caption: 'Ha-ha, that was actually funny bro.', mood: 'laugh', audioMs: 500 }, { caption: 'Okay. Tell me more about the match.', mood: 'think', audioMs: 400 }, { caption: 'Three apples? Zo\'r. Who ate them?', mood: 'wink', audioMs: 400 }];
const results = []; const ok = (name, pass, extra = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${SILENT}`, '--autoplay-policy=no-user-gesture-required'] });
  // 1. a talk: three scripted turns, the mood follows, End shows the report
  let p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript((turns) => { let n = 0; window.FAKE = { turns, feedbackCalls: [],
    feedback: (body) => { window.FAKE.feedbackCalls.push(body); return ++n === 1 ? Promise.resolve({ better: 'I went to the bazaar yesterday.', pron: '', level: 'Beginner' }) : Promise.reject(new Error('coach down')); },
    report: (body) => { window.FAKE.reportCalls = (window.FAKE.reportCalls || 0) + 1; return window.FAKE.reportDown ? Promise.reject(new Error('coach down')) : Promise.resolve({ stars: 2, why: 'Yaxshi gaplashdingiz, faqat o\'tgan zamonni unutmang.', phrases: [{ en: 'I went to the bazaar', uz: 'Bozorga bordim' }], pron: ['th → z'], level: 'Beginner', profileUpdate: { interests: ['football'], mistakes: ['I go yesterday → I went yesterday'], lastTalk: 'Futbol haqida gaplashdik.' } }); },
    explain: (body) => Promise.resolve({ uz: "'Bugun nima qilding' — bugun nima ish qilganingni so'rayapti." }),
    slower: (body) => Promise.resolve({ pcm: btoa(String.fromCharCode(...new Uint8Array(4800))) }) }; }, TURNS);
  await p.goto(URL);
  // the start page: six packs, BOSHLASH off until a topic is picked, then Futbol + Qo'pol
  await p.waitForSelector('.start .go');
  ok('start page has six packs', (await p.$$('.pk')).length === 6);
  // the voice is chosen apart from the personality, with a listen button each
  ok('start page has eight voices', (await p.$$('.vc')).length === 8);
  await p.evaluate(() => { window.FAKE.sayCalls = []; window.FAKE.say = (b) => { window.FAKE.sayCalls.push(b.voice); return Promise.resolve({ pcm: btoa(String.fromCharCode(...new Uint8Array(2400))) }); }; });
  await p.click('.vc[data-id="Leda"] .listen'); await p.waitForTimeout(400);
  ok('listen plays a sample in that voice', await p.evaluate(() => window.FAKE.sayCalls[0] === 'Leda'));
  await p.click('.vc[data-id="Leda"]');
  ok('start is off before a topic', await p.$eval('.go', (e) => e.classList.contains('disabled')));
  await p.click('.tcard[data-id="football"]'); await p.click('.pk[data-id="rude"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.fake && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  ok('talk shows the topic name', (await p.textContent('.tbar .topic')) === 'Futbol');
  ok('the chosen voice reaches the talk and is remembered', await p.evaluate(() => window.SPEAK.talk.voice === 'Leda' && JSON.parse(localStorage.getItem('speak.profile')).voice === 'Leda'));
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  // the learner says a clumsy line, Dombi answers: one "say it better" card; a two-word line gets no call at all
  await p.evaluate(() => window.SPEAK.fake.learner('yesterday I go bazaar')); await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  const moodAfter2 = await p.evaluate(() => window.SPEAK.talk.state.mood);
  await p.waitForSelector('.fcard.better', { timeout: 5000 });
  ok('one "say it better" card with the coach\'s line', (await p.textContent('.fcard.better .ktxt')) === 'I went to the bazaar yesterday.' && (await p.$$('.fcard')).length === 1);
  ok('the coach got the learner\'s words', await p.evaluate(() => window.FAKE.feedbackCalls[0].learnerText === 'yesterday I go bazaar'));
  await p.evaluate(() => window.SPEAK.fake.learner('and then I buy three apple')); await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 3, null, { timeout: 10000 });
  await p.waitForTimeout(600);
  ok('a failed coach call leaves the talk running', await p.evaluate(() => window.FAKE.feedbackCalls.length === 2 && !!window.SPEAK.talk.session) && (await p.$$('.fcard')).length === 1);
  await p.evaluate(() => window.SPEAK.fake.learner('yes yes')); await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 4, null, { timeout: 10000 });
  await p.waitForTimeout(600);
  ok('a two-word line asks for no card', await p.evaluate(() => window.FAKE.feedbackCalls.length === 2) && (await p.$$('.fcard')).length === 1);
  const caps = await p.$$eval('.cap.done .ctext', (els) => els.map((e) => e.textContent));
  ok('four captions in order', caps.join('|') === TURNS.map((t) => t.caption).join('|'), caps.join(' | '));
  // the two buttons under the first caption: the Uzbek explanation appears, the slow repeat reaches the player
  await p.click('.cap.done .explain'); await p.waitForFunction(() => /so'rayapti/.test(document.querySelector('.cap.done .uz').textContent), null, { timeout: 5000 });
  ok('explain shows the Uzbek text under the line', true);
  const pushes = await p.evaluate(() => window.SPEAK.talk.playerPushes);
  await p.click('.cap.done .slower'); await p.waitForTimeout(600);
  ok('slower plays through the player', await p.evaluate(() => window.SPEAK.talk.playerPushes) > pushes);
  // silence: the clock jumps 50 s → a remark nudge; 110 s → the Uzbek whisper; nothing twice
  const nudges = () => p.evaluate(() => window.SPEAK.fake.sent.texts.filter((t) => /quiet|silent/.test(t)));
  await p.waitForTimeout(1500); ok('no nudge while the learner just spoke', (await nudges()).length === 0);
  await p.evaluate(() => window.SPEAK.talk.tick(50000)); await p.waitForFunction(() => window.SPEAK.fake.sent.texts.some((t) => /quiet for a while/.test(t)), null, { timeout: 5000 });
  ok('a remark nudge after 50 s of silence', (await nudges()).length === 1);
  await p.evaluate(() => window.SPEAK.talk.tick(60000)); await p.waitForFunction(() => window.SPEAK.fake.sent.texts.some((t) => /Whisper/.test(t)), null, { timeout: 5000 });
  await p.waitForTimeout(1500); ok('the whisper after 110 s, and no third nudge', (await nudges()).length === 2);
  ok('the test bar is there', (await p.$('.testbar .nudge-whisper')) !== null);
  ok('the cost counter moves', await p.evaluate(() => window.SPEAK.talk.state.cost > 0 && window.SPEAK.talk.state.secOut > 0));
  // the cap: the clock jumps to 20 s before it → a goodbye nudge; at the cap the talk ends by itself
  ok('the transcript files the learner before the reply', await p.evaluate(() => { const t = window.SPEAK.talk.state.transcript; const i = t.findIndex((x) => x.who === 'learner'); return i > 0 && t[i + 1] && t[i + 1].who === 'dombi' && t[i + 1].text === 'Ha-ha, that was actually funny bro.'; }));
  const tickTo = (sec) => p.evaluate((s) => { const T = window.SPEAK.talk; T.tick(s * 1000 - (Date.now() + T.clockOffset - T.state.started)); }, sec);   // move the talk's clock to an exact age
  await tickTo(882);                                                            // past the goodbye mark (880), short of the cap (900)
  const goodbye = await p.waitForFunction(() => window.SPEAK.fake.sent.texts.some((t) => /almost up/.test(t)), null, { timeout: 5000 }).then(() => true).catch(() => false);
  ok('a goodbye nudge before the cap', goodbye);
  await p.waitForFunction(() => /Xayr/.test(document.querySelector('.cap.live').textContent), null, { timeout: 5000 });   // Dombi is saying goodbye
  await tickTo(902); await p.waitForTimeout(1200);                              // past the cap while the goodbye is still playing
  const capState = await p.evaluate(() => ({ screen: window.SPEAK.screen, playing: window.SPEAK.talk.player.playing(), endedAt: window.SPEAK.talk.endedAt }));
  ok('the cap does not cut the goodbye', capState.screen === 'talk', JSON.stringify(capState));
  await p.waitForFunction(() => window.SPEAK.screen === 'report', null, { timeout: 8000 });
  ok('the talk ends once the goodbye is said', true);
  await p.click('.report .home'); await p.waitForSelector('.start .go'); await p.click('.tcard[data-id="football"]'); await p.click('.pk[data-id="rude"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.fake && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  await p.evaluate(() => window.SPEAK.fake.learner('yesterday I go bazaar')); await p.evaluate(() => window.SPEAK.fake.next()); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  ok('mood laugh on the second turn', moodAfter2 === 'laugh', moodAfter2);
  ok('the mouth moved while he spoke', await p.evaluate(() => window.SPEAK.talk.mouthMoves > 3), String(await p.evaluate(() => window.SPEAK.talk.mouthMoves)));
  ok('mic chunks reach the session', await p.evaluate(() => window.SPEAK.fake.sent.audioChunks) > 3);
  await p.click('.end'); await p.waitForFunction(() => document.querySelectorAll('.report .star.on').length === 2, null, { timeout: 5000 });
  ok('End shows the report with two stars', /unutmang/.test(await p.textContent('.report .why')) && (await p.$$('.plist li')).length === 2);
  // the phrasebook kept it: the memory page lists the phrase, delete empties it
  await p.click('.report .home'); await p.waitForSelector('.start'); await p.click('.memlink'); await p.waitForSelector('.memory');
  ok('memory page has the phrase and the talk', /I went to the bazaar/.test(await p.textContent('.plist.book')) && /football/.test(await p.textContent('.memory')));
  await p.click('.plist.book .del'); await p.waitForTimeout(200);
  ok('deleting the phrase empties the book', (await p.$$('.plist.book li')).length === 0 && await p.evaluate(() => JSON.parse(localStorage.getItem('speak.profile')).phrasebook.length === 0));
  ok('no page errors', errors.length === 0, errors.join('; '));
  // 1b. a talk where the learner never speaks: zero stars, no coach call
  const callsBefore = await p.evaluate(() => window.FAKE.reportCalls || 0);
  await p.click('.memory .back'); await p.waitForSelector('.start .go'); await p.click('.tcard[data-id="day"]'); await p.click('.go');
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 }); await p.click('.end'); await p.waitForSelector('.report', { timeout: 5000 });
  ok('a silent talk gets the "you did not speak" report', /gapirmadingiz/.test(await p.textContent('.report .why')) && (await p.$$('.star.on')).length === 0 && await p.evaluate((n) => (window.FAKE.reportCalls || 0) === n, callsBefore));
  // 1c. the coach is down at the end: "Hisobot kelmadi" and a retry that works
  await p.click('.report .home'); await p.waitForSelector('.start .go'); await p.click('.tcard[data-id="day"]'); await p.click('.go');
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  await p.evaluate(() => { window.FAKE.reportDown = true; window.SPEAK.fake.learner('I like football very much'); return window.SPEAK.fake.next(); }); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  await p.click('.end'); await p.waitForSelector('.report .retry', { timeout: 5000 });
  ok('coach down → "Hisobot kelmadi" with retry', /Hisobot kelmadi/.test(await p.textContent('.report .why')));
  await p.evaluate(() => { window.FAKE.reportDown = false; }); await p.click('.report .retry'); await p.waitForFunction(() => document.querySelectorAll('.report .star.on').length === 2, null, { timeout: 5000 });
  ok('retry brings the report', true);
  // 1e. the socket is lost for good: the talk ends by itself with a report of what was said
  await p.click('.report .home'); await p.waitForSelector('.start .go'); await p.evaluate(() => { window.FAKE.reportDown = false; }); await p.click('.tcard[data-id="day"]'); await p.click('.go');
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  await p.evaluate(() => { window.SPEAK.fake.learner('my day was good'); return window.SPEAK.fake.next(); }); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  await p.evaluate(() => window.SPEAK.fake.drop());
  const lostReport = await p.waitForFunction(() => window.SPEAK.screen === 'report' && document.querySelectorAll('.report .star.on').length === 2, null, { timeout: 5000 }).then(() => true).catch(() => false);
  ok('a lost socket ends the talk with a report', lostReport);
  // 1f. "talk again" pressed while the report is still loading: the late report must not cover the new talk
  await p.click('.report .home'); await p.waitForSelector('.start .go'); await p.evaluate(() => { const old = window.FAKE.report; window.FAKE.report = (b) => new Promise((r) => setTimeout(() => old(b).then(r), 2500)); });
  await p.click('.tcard[data-id="day"]'); await p.click('.go'); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  await p.evaluate(() => { window.SPEAK.fake.learner('one more line here'); return window.SPEAK.fake.next(); }); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  await p.click('.end'); await p.waitForSelector('.report .again'); await p.click('.report .again'); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 10000 });
  await p.evaluate(() => { window.SPEAK.fake.learner('and this is the next talk'); return window.SPEAK.fake.next(); }); await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 2, null, { timeout: 10000 });
  await p.waitForTimeout(3000);
  ok('a late report does not cover the new talk', await p.evaluate(() => window.SPEAK.screen === 'talk' && !!document.querySelector('.talk .end')));
  await p.click('.end');
  const afterAgain = await p.waitForFunction(() => window.SPEAK.screen === 'report' && document.querySelectorAll('.report .star.on').length === 2, null, { timeout: 8000 }).then(() => 'ok').catch(() => 'timeout');
  ok('the new talk ends with its own report', afterAgain === 'ok', afterAgain === 'ok' ? '' : await p.evaluate(() => JSON.stringify({ screen: window.SPEAK.screen, stars: document.querySelectorAll('.report .star.on').length, why: document.querySelector('.report .why') && document.querySelector('.report .why').textContent, session: !!(window.SPEAK.talk && window.SPEAK.talk.session), ended: window.SPEAK.talk && window.SPEAK.talk.endedAt })));
  await p.evaluate(() => { window.FAKE.report = (b) => Promise.resolve({ stars: 2, why: 'ok', phrases: [], pron: [], level: '', profileUpdate: {} }); });
  // 1d. over budget: the server refuses a new talk → the Uzbek budget line
  await p.click('.report .home'); await p.waitForSelector('.start .go'); await p.evaluate(() => { window.FAKE.token = 'budget'; });
  await p.click('.tcard[data-id="day"]'); await p.click('.go'); await p.waitForSelector('.problem', { timeout: 10000 });
  ok('over budget → the budget line', /byudjet tugadi \(\$10\.50 \/ \$10\)/.test(await p.textContent('.problem p')), await p.textContent('.problem p'));
  await p.close();
  // 2. the mic blocked: the Uzbek line and a retry
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }); await ctx.grantPermissions([]);
  p = await ctx.newPage(); await p.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); });
  await p.goto(URL); await p.waitForSelector('.start .go'); await p.click('.tcard[data-id="day"]'); await p.click('.go'); await p.waitForSelector('.problem', { timeout: 10000 });
  const line = await p.textContent('.problem p');
  ok('mic-blocked line', /Mikrofon yopiq/.test(line) && (await p.$('.retry')) !== null, line);
  // 3. dark mode and Reduce Motion: one short talk each, no page errors, dark actually applied
  for (const [name, opts] of [['dark', { colorScheme: 'dark' }], ['reduce motion', { reducedMotion: 'reduce' }]]) {
    const c = await b.newContext({ viewport: { width: 1200, height: 800 }, ...opts }); const q = await c.newPage(); const errs = []; q.on('pageerror', (e) => errs.push(e.message));
    await q.addInitScript((turns) => { window.FAKE = { turns, report: () => Promise.resolve({ stars: 1, why: 'ok', phrases: [], pron: [], level: '', profileUpdate: {} }) }; }, TURNS);
    await q.goto(URL); await q.waitForSelector('.start .go'); await q.click('.tcard[data-id="day"]'); await q.click('.go');
    await q.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 15000 }); await q.click('.end'); await q.waitForSelector('.report', { timeout: 5000 });
    const dark = await q.evaluate(() => document.body.classList.contains('dark')), reduce = await q.evaluate(() => !!(window.M && M.reduce));
    ok(`${name}: a talk runs clean`, errs.length === 0 && (name === 'dark' ? dark : reduce), errs.join('; ') || `dark=${dark} reduce=${reduce}`);
    await c.close();
  }
  await b.close();
  console.log(results.every(Boolean) ? 'talk: ok' : 'talk: FAIL'); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.log('talk: FAIL', e.message); process.exit(1); });
