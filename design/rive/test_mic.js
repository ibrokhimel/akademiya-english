// Verifies the two microphone interactions with a FAKE microphone (Chromium plays a wav file as the mic input):
//   talk: while Dombi is held, VM `amp` follows the voice and his body pulses  ·  blow: steady loud noise while idle -> `play` = wind
// node test_mic.js talk | blow
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const which = process.argv[2] || 'talk';
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.png': 'image/png' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const BODY_H = () => { const cv = document.getElementById('c'), ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, cv.width, cv.height).data; let y0 = 1e9, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x += 2) { const k = (y * cv.width + x) * 4; if (d[k + 3] > 200 && d[k] < 60) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } return y1 - y0; };
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const wav = path.join(ROOT, 'captures', 'mic', which === 'talk' ? 'speech.wav' : 'blow.wav');
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1040, height: 720 }, permissions: ['microphone'] }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8790/play.html'); await p.waitForFunction(() => window.playReady); await p.waitForTimeout(3800);
  const scr = await p.$('#screen'), box = await scr.boundingBox();
  await p.click('#bMic'); await p.waitForTimeout(700);
  const micOn = await p.evaluate(() => !!window.playState.mic); const log0 = await p.$eval('#log', e => e.textContent);
  console.log('mic stream opened:', micOn, '·', log0);
  const sample = () => p.evaluate((fn) => ({ mode: window.playState.mode, level: window.playState.mic ? Math.round(window.playState.mic.level) : -1, amp: Math.round(window.dombi.number('amp').value), play: window.dombi.enum('play').value, h: (new Function('return (' + fn + ')()'))() }), BODY_H.toString());
  const out = [];
  if (which === 'talk') {
    const s = await p.evaluate(() => ({ x: window.playState.x, y: window.playState.y })); const c = { x: box.x + s.x, y: box.y + s.y - 86 };
    await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(450); await p.mouse.move(c.x + 20, c.y - 150, { steps: 10 }); await p.waitForTimeout(900);   // held, at rest
    for (let i = 0; i < 44; i++) { out.push(await sample()); if (i === 12 || i === 30) await scr.screenshot({ path: path.join(ROOT, 'captures', `mic-talk-${i}.png`) }); await p.waitForTimeout(60); }
    await p.mouse.up();
    const amps = out.map(o => o.amp), hs = out.map(o => o.h);
    console.log('held:', out.every(o => o.mode === 'held'), '· amp min/max', Math.min(...amps), Math.max(...amps), '· body height min/max', Math.min(...hs), Math.max(...hs), 'px');
    console.log('amp over time:', amps.join(' '));
    console.log('PASS talk:', micOn && Math.max(...amps) >= 40 && Math.min(...amps) <= 15 && Math.max(...hs) - Math.min(...hs) >= 4);
  } else {
    for (let i = 0; i < 70; i++) { out.push(await sample()); if (out[i].mode === 'wind' && !out.shot) { out.shot = true; await p.waitForTimeout(250); await scr.screenshot({ path: path.join(ROOT, 'captures', 'mic-blow.png') }); } await p.waitForTimeout(70); }
    const modes = out.map(o => o.mode[0]).join(''), sawWind = out.some(o => o.mode === 'wind' && o.play === 'wind'), ended = out.findIndex(o => o.mode === 'wind'), back = out.slice(Math.max(0, ended)).some(o => o.mode === 'idle');
    console.log('modes over time (i = idle, w = wind):', modes);
    console.log('level max', Math.max(...out.map(o => o.level)), '· wind seen:', sawWind, '· back to idle after it stopped:', back);
    console.log('PASS blow:', micOn && sawWind && back);
  }
  console.log('page errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
