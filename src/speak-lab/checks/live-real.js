// Does the real Live socket open and does Dombi speak first? Headless Chrome with its fake microphone against the real server (costs a few seconds of Gemini).
//   node src/speak-lab/checks/live-real.js     (needs both servers: design/motion/serve.js and speak-lab/server/server.js)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', ...(process.env.AUDIO ? ['--use-file-for-fake-audio-capture=' + process.env.AUDIO] : []), '--autoplay-policy=no-user-gesture-required'] });   // AUDIO=a .wav to speak into the mic
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const logs = [];
  p.on('console', (m) => { if (/live|token|error|warn/i.test(m.text())) logs.push(m.text().slice(0, 200)); }); p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await p.goto('http://127.0.0.1:8791/src/speak-lab/');
  await p.waitForSelector('.start .go'); if (process.env.MIC === 'hold') await p.click('.mc[data-id="hold"]'); await p.click('.tcard[data-id="day"]'); await p.click('.go');
  const t0 = Date.now();
  const got = await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1 || document.querySelector('.problem'), null, { timeout: 40000 }).then(() => true).catch(() => false);
  console.log('player:', JSON.stringify(await p.evaluate(() => window.SPEAK && window.SPEAK.talk && window.SPEAK.talk.player && window.SPEAK.talk.player.stats && window.SPEAK.talk.player.stats())));
  console.log('messages:', JSON.stringify(await p.evaluate(() => window.SPEAK && window.SPEAK.talk && window.SPEAK.talk.session && window.SPEAK.talk.session.stats && window.SPEAK.talk.session.stats())));
  const caps = await p.$$eval('.cap.done', (els) => els.map((e) => e.textContent)), live = await p.textContent('.cap.live').catch(() => ''), problem = await p.textContent('.problem p').catch(() => null);
  const st = await p.evaluate(() => window.SPEAK && window.SPEAK.talk && { pushes: window.SPEAK.talk.playerPushes, mood: window.SPEAK.talk.state.mood, status: document.querySelector('.status') && document.querySelector('.status').textContent, error: window.SPEAK.talk.error && (window.SPEAK.talk.error.message + ' ' + (window.SPEAK.talk.error.stack || '').slice(0, 300)) });
  console.log(`after ${Date.now() - t0} ms: captions=${JSON.stringify(caps)} live=${JSON.stringify(live)} problem=${problem} state=${JSON.stringify(st)}`);
  // MIC=hold: the talk starts in hold mode; MIC=switch: it starts in auto and switches to hold mid-talk. Then: hold for HOLD_MS
  // while the mic plays (AUDIO=…wav for real speech), let go, see if he answers; switch back to auto
  if ((process.env.MIC === 'switch' || process.env.MIC === 'hold') && got && caps.length) {
    const sw = async (mode) => { const t = Date.now(); await p.evaluate((m) => window.SPEAK.talk.switchMic(m), mode); return `${await p.evaluate(() => window.SPEAK.talk.micSwitches.slice(-1)[0])} in ${Date.now() - t} ms`; };
    const toHold = process.env.MIC === 'switch' ? await sw('hold') : 'started in hold', n0 = (await p.$$('.cap.done')).length;
    await p.evaluate(() => document.querySelector('.hold').dispatchEvent(new PointerEvent('pointerdown'))); await p.waitForTimeout(+process.env.HOLD_MS || 2500);
    await p.evaluate(() => document.querySelector('.hold').dispatchEvent(new PointerEvent('pointerup')));
    const answered = await p.waitForFunction((n) => document.querySelectorAll('.cap.done').length > n, n0, { timeout: 20000 }).then(() => true).catch(() => false);
    const toAuto = await sw('auto');
    const heard = await p.evaluate(() => window.SPEAK.talk.state.learner.slice(-1)[0] || '');
    console.log(`MIC: to hold ${toHold}; heard ${JSON.stringify(heard)}; he answered after a hold: ${answered}; back to auto ${toAuto}`);
  }
  console.log('logs:', logs.length ? logs.join('\n  ') : 'none');
  console.log(got && caps.length ? 'live-real: ok' : 'live-real: FAIL');
  await b.close();
})();
