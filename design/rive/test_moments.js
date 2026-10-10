// Plays every moment on moments.html and screenshots the phone at chosen times.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.png': 'image/png' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const PLAN = process.env.ONLY ? JSON.parse(process.env.ONLY) : { correct: [150, 450], wrong: [200, 500], combo3: [450, 900], combo5: [500, 1000], phrase: [500, 1600], speak: [900, 1700, 2250, 2700], lesson: [500, 1300, 2300], perfect: [700, 1500, 2600], streak: [200, 420, 900], freeze: [500, 800, 1300], checkpoint: [600, 760, 1100, 1900], levelup: [900, 1700, 2600] };
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:8790/moments.html'); await p.waitForFunction(() => window.momentsReady); await p.waitForTimeout(3800);
  const phone = await p.$('.wrap'); const shots = [];
  for (const [m, times] of Object.entries(PLAN)) {
    const done = p.evaluate(x => window.play(x), m); let t = 0;
    for (const at of times) { await p.waitForTimeout(at - t); t = at; const f = path.join(ROOT, 'captures', `moment-${m}-${at}.png`); await phone.screenshot({ path: f }); shots.push([f, `${m} ${at}ms`]); }
    await done; await p.waitForTimeout(900);
  }
  fs.writeFileSync(path.join(ROOT, 'captures', 'moments.json'), JSON.stringify(shots));
  console.log('shots', shots.length, '· errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
