// Records Dombi idling in the real runtime: one frame every 700 ms for ~25 s -> captures/idle-strip.png
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 900 } });
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady);
  await p.waitForTimeout(3500);
  const c = await p.$('canvas'); const files = [];
  for (let i = 0; i < 36; i++) { const f = path.join(ROOT, 'captures', `idle-${i}.png`); await c.screenshot({ path: f }); files.push(f); await p.waitForTimeout(700); }
  await b.close(); if (server.listening) server.close();
  fs.writeFileSync(path.join(ROOT, 'captures', 'idle-files.json'), JSON.stringify(files));
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
