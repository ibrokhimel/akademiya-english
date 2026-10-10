// Plays out/dombi.riv in the real Rive web runtime (preview.html) and screenshots the canvas over time.
// Usage: node capture_preview.js  -> captures/play-*.png + captures/play-sheet.png (needs playwright)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.riv': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });  // reuse a running serve.js
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 900 } });
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto('http://127.0.0.1:8790/preview.html');
  await p.waitForFunction(() => window.dombiReady, null, { timeout: 20000 });
  const c = await p.$('canvas');
  const shots = [];
  const shot = async (label) => { const f = path.join(ROOT, 'captures', `play-${shots.length}.png`); await c.screenshot({ path: f }); shots.push([f, label]); };
  const wait = (ms) => p.waitForTimeout(ms);
  const set = (k, v) => p.evaluate(([k, v]) => window.set(k, v), [k, v]);

  await wait(4000); await shot('start: smirk');
  await set('mood', 'happy'); await wait(60); await shot('happy +60ms (blending)'); await wait(300); await shot('happy');
  await set('gesture', 'wave'); await wait(70); await shot('wave +70ms (from behind)'); await wait(40); await shot('wave +110ms'); await wait(300); await shot('wave');
  await set('gesture', 'none'); await wait(70); await shot('none +70ms (pop out)'); await wait(300); await shot('hands hidden');
  await set('mood', 'laugh'); await set('gesture', 'celebrate'); await wait(400); await shot('laugh + celebrate');
  await set('gesture', 'none'); await set('mood', 'sleepy'); await wait(400); await shot('sleepy (no leftovers)');
  await set('mood', 'think'); await set('gesture', 'thinking'); await wait(120); await shot('thinking: reach out'); await wait(80); await shot('thinking: swap to front'); await wait(300); await shot('think + thinking');
  await set('gesture', 'none'); await set('mood', 'smirk'); await wait(400); await shot('back to smirk');
  // catch a blink: sample quickly for ~7 s
  let blinkShot = null;
  for (let i = 0; i < 160 && !blinkShot; i++) {
    const h = await p.evaluate(() => { const cv = document.querySelector('canvas'); const ctx = cv.getContext('2d');
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 240 && d[k + 1] > 240 && d[k + 2] > 240 && d[k + 3] > 200) n++; return n; });
    if (i === 0) p.baseWhite = h;
    if (h < p.baseWhite * 0.6) { await shot('blink (caught live)'); blinkShot = true; }
    await wait(45);
  }
  await b.close(); if (server.listening) server.close();
  fs.writeFileSync(path.join(ROOT, 'captures', 'play-labels.json'), JSON.stringify(shots));
  console.log(shots.map(s => s[1]).join('\n'), blinkShot ? '' : '\n(no blink caught)');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
