// A lesson answered by voice for real: the browser's microphone is fed a recording, the app records it and the speech-to-text server on
// this PC writes it down (no window.APP_TEST). Needs the lab's server and python src/stt/server.py.   node speak-real.js [file.wav]
const path = require('path'); const { chromium } = require('playwright');
const wav = process.argv[2] || path.join(__dirname, '..', '..', 'content', 'audio', 'uk', 'aziz', 'a-coffee-please.wav');
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 430, height: 880 }, permissions: ['microphone'] }), p = await ctx.newPage(), errors = [];
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.text().startsWith('DBG')) console.log(m.text()); });
  await p.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); const y = new Date(Date.now() - 864e5).toISOString();
    localStorage.setItem('akademiya.events', JSON.stringify([{ type: 'onboarding', at: y }, ...['l1', 'l2', 'l3', 'l4', 'l5', 'c1'].map((id) => ({ type: 'lesson', id, at: y }))])); });
  const press = async (sel) => { const el = p.locator(sel).first(); await el.waitFor({ state: 'visible', timeout: 20000 }); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); };
  await p.goto('http://127.0.0.1:8791/src/web/'); await p.waitForFunction(() => window.APP && window.APP.learn && window.APP.learn.ready(), null, { timeout: 40000 });
  console.log('hearing with:', await p.evaluate(() => window.APP.hearing));
  await press('.pathin [data-id="l6"]'); await p.waitForTimeout(900); await press('#shStart'); await p.waitForSelector('.scr.lesson .ex');
  await p.waitForFunction(() => document.querySelector('.ex .mic .halo') && document.querySelector('.ex .mic .halo').getAnimations().length > 0, null, { timeout: 30000 });
  await press('.ex .mic .p3d'); const t0 = Date.now(); require('fs').mkdirSync(path.join(__dirname, 'shots-speak'), { recursive: true });
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(500); const live = await p.evaluate(() => [...document.querySelectorAll('.ex .result .chipw')].map((c) => c.textContent).join(' '));      // the words so far, while speaking
    console.log(`  ${((Date.now() - t0) / 1000).toFixed(1)}s live: ${live}`); await p.locator('#phone').screenshot({ path: path.join(__dirname, 'shots-speak', `live-${i}.png`) }); }
  await p.waitForFunction(() => { const r = document.querySelector('.ex .result'); return (r && r.style.display === 'flex') || /Eshitmadim|Tushunmadim/.test(document.querySelector('.ex .mic').textContent); }, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const out = await p.evaluate(() => ({ said: [...document.querySelectorAll('.ex .result .words .chipw')].map((c) => c.textContent + (c.classList.contains('good') ? '✓' : '✗')).join(' '), cap: document.querySelector('.ex .mic .cap').textContent, sheet: document.querySelector('.sheet.correct')._up ? 'Zo\'r!' : document.querySelector('.sheet.fix')._up ? 'answer shown' : '-' }));
  console.log('heard in', ((Date.now() - t0) / 1000).toFixed(1) + 's:', JSON.stringify(out));
  await p.locator('#phone').screenshot({ path: path.join(__dirname, 'shots-speak', 'final.png') });
  console.log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message.slice(0, 300)); process.exit(1); });
