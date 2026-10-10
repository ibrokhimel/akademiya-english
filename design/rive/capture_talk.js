// Test talk.html in Chromium (mouth-only mode): frame strip per language + console errors
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://127.0.0.1:8790/talk.html'); await p.waitForTimeout(4200);
  for (const lang of ['en', 'uz', 'ru']) {
    await p.click(`[data-sample="${lang}"]`);
    await p.evaluate(() => { document.getElementById('text').value = document.getElementById('text').value.split(/(?<=[.!?])\s/)[0] + ' ' + document.getElementById('text').value.split(/(?<=[.!?])\s/)[1]; });
    await p.click('#silent'); await p.waitForTimeout(lang === 'en' ? 1500 : 150);
    const c = await p.$('canvas'); const shots = [];
    for (let i = 0; i < 16; i++) { const f = path.join(ROOT, 'captures', `talk-${lang}-${i}.png`); await c.screenshot({ path: f }); shots.push([f, await p.$eval('#shape', e => e.textContent)]); await p.waitForTimeout(60); }
    fs.writeFileSync(path.join(ROOT, 'captures', `talk-${lang}.json`), JSON.stringify(shots));
    await p.click('#stop'); await p.waitForTimeout(300);
  }
  await p.screenshot({ path: path.join(ROOT, 'captures', 'talk-page.png'), fullPage: true });
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
