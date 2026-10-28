// Does the real Live socket open and does Dombi speak first? Headless Chrome with its fake microphone against the real server (costs a few seconds of Gemini).
//   node src/speak-lab/checks/live-real.js     (needs both servers: design/motion/serve.js and speak-lab/server/server.js)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const logs = [];
  p.on('console', (m) => { if (/live|token|error|warn/i.test(m.text())) logs.push(m.text().slice(0, 200)); }); p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await p.goto('http://127.0.0.1:8791/src/speak-lab/');
  const t0 = Date.now();
  const got = await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1 || document.querySelector('.problem'), null, { timeout: 25000 }).then(() => true).catch(() => false);
  const caps = await p.$$eval('.cap.done', (els) => els.map((e) => e.textContent)), live = await p.textContent('.cap.live').catch(() => ''), problem = await p.textContent('.problem p').catch(() => null);
  const st = await p.evaluate(() => window.SPEAK && window.SPEAK.talk && { pushes: window.SPEAK.talk.playerPushes, mood: window.SPEAK.talk.state.mood, status: document.querySelector('.status') && document.querySelector('.status').textContent, error: window.SPEAK.talk.error && (window.SPEAK.talk.error.message + ' ' + (window.SPEAK.talk.error.stack || '').slice(0, 300)) });
  console.log(`after ${Date.now() - t0} ms: captions=${JSON.stringify(caps)} live=${JSON.stringify(live)} problem=${problem} state=${JSON.stringify(st)}`);
  console.log('logs:', logs.length ? logs.join('\n  ') : 'none');
  console.log(got && caps.length ? 'live-real: ok' : 'live-real: FAIL');
  await b.close();
})();
