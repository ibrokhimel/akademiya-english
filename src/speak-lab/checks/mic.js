// The mic switch with the scripted Gemini (?fake=1): auto (hands-free) or hold-to-talk, picked on the start page and
// switchable during the talk (spec 2026-10-30 §4.4).    node src/speak-lab/checks/mic.js   (needs node design/motion/serve.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const URL = 'http://127.0.0.1:8791/src/speak-lab/?fake=1';
// a quiet hum on the mic, so in auto mode audio flows and in hold mode it only flows while held
const HUM = path.join(os.tmpdir(), 'speak-lab-hum.wav');
(() => { const n = 16000 * 4, h = Buffer.alloc(44), d = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) d.writeInt16LE(Math.round(Math.sin(i / 16000 * 2 * Math.PI * 300) * 9000), i * 2);
  h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n * 2, 40); fs.writeFileSync(HUM, Buffer.concat([h, d])); })();
const TURNS = [{ caption: 'Salom! Qalaysan?', audioMs: 400 },
  { chunks: [{ text: 'Okay so honestly, let me tell you a long story about the bus, it was so cool.', audioMs: 3000 }] },
  { chunks: [{ text: 'And another long story, honestly, the bus driver was so cool, seriously.', audioMs: 3000 }] },
  { chunks: [{ text: 'Okay so here is', audioMs: 600 }, { text: ' the thing about samsa,', audioMs: 600 }, { text: ' I am so dizzy now.', audioMs: 600 }] },
  { chunks: [{ text: 'Wait wait let me', audioMs: 600 }, { text: ' tell you about Chorsu', audioMs: 600 }, { text: ' and the samsa there.', audioMs: 600 }] },
  { caption: 'Fresh line here.', audioMs: 500 }];
const results = []; const ok = (name, pass, extra = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${HUM}`, '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript((turns) => { window.FAKE = { turns, feedback: () => Promise.resolve({}), report: () => Promise.resolve({ stars: 1, phrases: [], pron: [] }) }; }, TURNS);
  await p.goto(URL); await p.waitForSelector('.start .go');
  // 1. the start page offers both modes; hold is remembered
  ok('start page offers auto and hold', (await p.$$('.mc')).length === 2 && !!(await p.$('.mc[data-id="auto"].on')));
  await p.click('.mc[data-id="hold"]'); await p.click('.tcard[data-id="day"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.fake && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  ok('the hold choice is remembered', await p.evaluate(() => JSON.parse(localStorage.getItem('speak.profile')).mic === 'hold'));
  const sent = () => p.evaluate(() => ({ audio: window.SPEAK.fake.sent.audioChunks, events: window.SPEAK.fake.sent.events.slice() }));
  await p.waitForTimeout(1500);
  ok('hold mode: no audio is sent until the button is held', (await sent()).audio === 0, `${(await sent()).audio} chunks`);
  // 2. hold the button: activity start, audio flows; let go: activity end, audio stops
  const hold = await p.$('.hold'); ok('the hold button shows in hold mode', !!hold && await hold.isVisible());
  const bb = await hold.boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(700);
  let s = await sent(); ok('pressing sends activity start and the mic', s.events[s.events.length - 1] === 'start' && s.audio > 0, JSON.stringify(s));
  await p.mouse.up(); await p.waitForTimeout(300); const after = (await sent()).audio; await p.waitForTimeout(700);
  s = await sent(); ok('letting go sends activity end and the mic stops', s.events[s.events.length - 1] === 'end' && s.audio === after, JSON.stringify(s));
  // 3. the space bar does the same
  await p.keyboard.down('Space'); await p.waitForTimeout(300); await p.keyboard.up('Space'); await p.waitForTimeout(200);
  s = await sent(); ok('space bar holds too', s.events.slice(-2).join() === 'start,end', JSON.stringify(s.events));
  // 4. pressing while Dombi talks cuts him off
  await p.evaluate(() => { window.SPEAK.fake.next(); }); await p.waitForTimeout(400);    // next() returns the whole turn: don't wait for it
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(200);
  ok('pressing while he talks stops his voice and his actions', await p.evaluate(() => !window.SPEAK.talk.player.playing() && window.SPEAK.talk.acting.log.some((x) => x.how === 'cut')));
  await p.mouse.up(); await p.waitForTimeout(3200);
  // 5. switching to auto during the talk: the last lines go along, the status comes back, audio flows unheld
  await p.click('.micsw [data-id="auto"]'); await p.waitForTimeout(600);
  s = await sent(); const mic = await p.evaluate(() => window.SPEAK.fake.sent.mic.slice());
  ok('the switch reconnects with the last lines of the talk', mic.length === 1 && mic[0].mode === 'auto' && mic[0].lines.length >= 1, JSON.stringify(mic));
  ok('after the switch: listening again, no hold button', /Eshityapman/.test(await p.textContent('.status')) && !(await p.$eval('.hold', (e) => e.offsetParent !== null)));
  const a0 = (await sent()).audio; await p.waitForTimeout(800); ok('auto mode: audio flows without holding', (await sent()).audio > a0);
  // 6. back to hold while holding is impossible from auto; so: to hold, hold with space, switch to auto -> activity end first
  await p.click('.micsw [data-id="hold"]'); await p.waitForTimeout(500);
  await p.keyboard.down('Space'); await p.waitForTimeout(300); await p.click('.micsw [data-id="auto"]'); await p.waitForTimeout(500); await p.keyboard.up('Space');
  s = await sent(); const tail = s.events.slice(-3).join();
  ok('switching while holding ends the hold first', tail === 'start,end,mic:auto', tail);
  // 7. switching while Dombi talks clears his voice and his planned actions
  const before = await p.evaluate(() => window.SPEAK.talk.acting.log.length);
  await p.evaluate(() => { window.SPEAK.fake.next(); }); await p.waitForTimeout(500);
  await p.click('.micsw [data-id="hold"]'); await p.waitForTimeout(3200);
  const L = await p.evaluate((n) => window.SPEAK.talk.acting.log.slice(n), before);
  ok('switching while he talks stops his voice and his planned actions', await p.evaluate(() => !window.SPEAK.talk.player.playing()) && L.some((x) => x.how === 'plan') && !L.some((x) => x.how === 'word'), JSON.stringify(L));
  // 8. hold pressed while more of his turn is still on its way: the rest of that turn is dropped (no voice, no actions, no caption)
  await p.evaluate(() => { window.SPEAK.fake.next(); }); await p.waitForTimeout(60); await p.keyboard.down('Space'); await p.waitForTimeout(1200);
  let L2 = await p.evaluate(() => window.SPEAK.talk.acting.log.slice()); const cutAt = L2.map((x) => x.how).lastIndexOf('cut');
  ok('after a hold press the rest of his turn is dropped', cutAt >= 0 && await p.evaluate(() => !window.SPEAK.talk.player.playing() && document.querySelector('.cap.live').textContent === '')
    && !L2.slice(cutAt + 1).some((x) => ['plan', 'word', 'pause'].includes(x.how)), JSON.stringify(L2.slice(cutAt)));
  await p.keyboard.up('Space'); await p.waitForTimeout(1500);
  // 9. switching mid-sentence: his cut line never merges into his next one
  await p.evaluate(() => { window.SPEAK.fake.next(); }); await p.waitForTimeout(60); await p.click('.micsw [data-id="auto"]'); await p.waitForTimeout(2500);
  await p.evaluate(() => { window.SPEAK.fake.next(); }); await p.waitForTimeout(1500);
  const lastCap = await p.evaluate(() => [...document.querySelectorAll('.cap.done .ctext')].pop().textContent);
  ok('after a mid-sentence switch his next line stands alone', lastCap === 'Fresh line here.', JSON.stringify(lastCap));
  // 10. the window loses focus while space is held: the hold ends
  await p.click('.micsw [data-id="hold"]'); await p.waitForTimeout(500); await p.keyboard.down('Space'); await p.waitForTimeout(200);
  await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await p.waitForTimeout(200);
  s = await sent(); ok('losing focus ends a hold', s.events[s.events.length - 1] === 'end', JSON.stringify(s.events.slice(-3))); await p.keyboard.up('Space');
  // 11. a switch that cannot reconnect ends the talk instead of leaving it silent
  await p.evaluate(() => { window.FAKE.setMicFail = true; }); await p.click('.micsw [data-id="auto"]'); await p.waitForTimeout(800);
  ok('a failed switch ends the talk', await p.evaluate(() => window.SPEAK.talk.endedAt != null));
  ok('no page errors', errors.length === 0, errors.join(' | '));
  await b.close();
  const failed = results.filter((r) => !r).length; console.log(failed ? `mic: ${failed} FAILED` : 'mic: ok'); process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
