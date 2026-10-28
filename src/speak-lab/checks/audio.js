// Does the mic path give 16 kHz chunks and the player play to the end? Headless Chrome with its fake microphone (a tone).
//   node src/speak-lab/checks/audio.js     (needs the lab's server: node design/motion/serve.js)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://127.0.0.1:8791/src/speak-lab/checks/audio.html');
  await p.click('#go'); await p.waitForTimeout(2500);
  const log = await p.textContent('#log'), amp = await p.textContent('#amp');
  const chunks = (log.match(/chunk \d+: 1600 samples/g) || []).length, idle = /player idle/.test(log);
  console.log(`chunks of 1600: ${chunks} · ${amp} · tone finished: ${idle} · page errors: ${errors.length}`);
  console.log(chunks >= 2 && idle && errors.length === 0 ? 'audio: ok' : 'audio: FAIL\n' + log + errors.join('\n'));
  await b.close();
})();
