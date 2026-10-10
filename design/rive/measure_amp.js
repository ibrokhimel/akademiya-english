// Measures Dombi's body bounding box at amp 0 / 50 / 100 (voice pulse data-bind check).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  for (const amp of [0, 50, 100, 0]) {
    await p.evaluate(a => { window.vmi.number('amp').value = a; }, amp); await p.waitForTimeout(250);
    const box = await p.evaluate(() => { const cv = document.querySelector('canvas'), ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const k = (y * cv.width + x) * 4;
        if (d[k + 3] > 200 && d[k] < 80) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return { w: x1 - x0, h: y1 - y0 }; });
    console.log('amp', amp, '-> body', box.w, 'x', box.h);
  }
  await b.close(); if (server.listening) server.close();
})();
