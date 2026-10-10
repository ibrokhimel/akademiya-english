const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1250 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  for (const id of ['correct', 'wrong', 'listening', 'fakeVoice', 'follow']) { await p.click('#' + id); await p.waitForTimeout(500); }
  await p.mouse.move(700, 200); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(ROOT, 'captures', 'preview-page.png'), fullPage: true });
  console.log('state:', await p.$eval('#state', e => e.textContent), '\nerrors:', errs.length ? errs.join(' | ') : 'none');
  await b.close(); if (server.listening) server.close();
})();
