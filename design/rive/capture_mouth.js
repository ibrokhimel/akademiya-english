// Mouth check in the real runtime: each mood settled + a mid-morph frame (~75 ms into the 150 ms blend).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const SEQ = ['happy', 'smirk', 'laugh', 'talk', 'surprised', 'smirk', 'confused', 'oops', 'think', 'focus', 'sleepy', 'wink', 'proud', 'listen'];
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 900 } });
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  const c = await p.$('canvas'); const shots = [];
  const shot = async (l) => { const f = path.join(ROOT, 'captures', `mouth-${shots.length}.png`); await c.screenshot({ path: f }); shots.push([f, l]); };
  await shot('smirk');
  let prev = 'smirk';
  for (const m of SEQ) { await p.evaluate(v => window.set('mood', v), m); await p.waitForTimeout(70); await shot(`${prev}→${m}`); await p.waitForTimeout(450); await shot(m); prev = m; }
  await b.close(); if (server.listening) server.close();
  fs.writeFileSync(path.join(ROOT, 'captures', 'mouth-labels.json'), JSON.stringify(shots));
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
