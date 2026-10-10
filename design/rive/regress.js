// Regression + real-click test in the runtime (preview.html). Prints measurements; saves a few frames.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const BOX = () => { const cv = document.querySelector('canvas'), ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, white = 0, hand = 0; for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const k = (y * cv.width + x) * 4;
    if (d[k + 3] > 200 && d[k] < 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (d[k + 3] > 200 && d[k] > 230 && d[k + 1] > 230) white++; if (d[k + 3] > 200 && d[k] > 62 && d[k] < 76 && d[k + 2] > 82 && d[k + 2] < 98) hand++; }
  return { w: x1 - x0, h: y1 - y0, white, hand }; };
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  const c = await p.$('canvas'); const m = () => p.evaluate(BOX); const res = {};
  res.rest = await m();
  // real click on his body
  const bb = await c.boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height * 0.55); await p.waitForTimeout(70); res.afterClick70 = await m(); await p.waitForTimeout(170); res.afterClick240 = await m(); await p.waitForTimeout(700);
  // gestures still work
  await p.evaluate(() => window.vmi.enum('gesture').value = 'celebrate'); await p.waitForTimeout(2600); res.celebrateLoop = await m();
  await p.evaluate(() => window.vmi.enum('gesture').value = 'none'); await p.waitForTimeout(600); res.none = await m();
  // talking still wins over the mood mouth
  await p.evaluate(() => { window.vmi.boolean('talking').value = true; window.vmi.number('viseme').value = 6; }); await p.waitForTimeout(300); res.talkAA = await m();
  await p.evaluate(() => { window.vmi.number('viseme').value = 1; }); await p.waitForTimeout(300); res.talkMBP = await m();
  await p.evaluate(() => { window.vmi.boolean('talking').value = false; }); await p.waitForTimeout(400); res.afterTalk = await m();
  // correct while a gesture is up, then back
  await p.evaluate(() => window.vmi.trigger('correct').trigger()); await p.waitForTimeout(500); res.correctMid = await m(); await p.waitForTimeout(1200); res.afterCorrect = await m();
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(16), JSON.stringify(v));
  console.log('page errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
