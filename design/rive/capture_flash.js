// Flash test: screenshot the canvas every ~20 ms during (a) mouth-only talking and (b) mood switches; measure the
// white area in the mouth region per frame. A flash = a sudden dip/spike between neighbouring frames.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const MOUTH_BOX = () => { const cv = document.querySelector('canvas'); const ctx = cv.getContext('2d');
  const w = cv.width, h = cv.height, x0 = Math.floor(w * 0.30), x1 = Math.floor(w * 0.70), y0 = Math.floor(h * 0.50), y1 = Math.floor(h * 0.72);
  const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; let n = 0;
  for (let k = 0; k < d.length; k += 4) if (d[k] > 200 && d[k + 1] > 200 && d[k + 2] > 200 && d[k + 3] > 100) n++; return n; };
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://127.0.0.1:8790/talk.html'); await p.waitForTimeout(4200);
  const c = await p.$('canvas');
  async function record(tag, ms) {
    const frames = []; const t0 = Date.now();
    while (Date.now() - t0 < ms) { const f = path.join(ROOT, 'captures', `${tag}-${frames.length}.png`); await c.screenshot({ path: f });
      frames.push({ f, t: Date.now() - t0, area: await p.evaluate(MOUTH_BOX), shape: await p.$eval('#shape', e => e.textContent) }); await p.waitForTimeout(8); }
    fs.writeFileSync(path.join(ROOT, 'captures', `${tag}.json`), JSON.stringify(frames));
    const a = frames.map(x => x.area); let worst = 0;
    for (let i = 1; i < a.length - 1; i++) { const dip = Math.min(a[i - 1], a[i + 1]) - a[i]; if (dip > worst) worst = dip; }
    console.log(tag, frames.length, 'frames,', 'area min/max', Math.min(...a), Math.max(...a), '· worst 1-frame dip', worst, '· mean step', Math.round(a.slice(1).reduce((s, v, i) => s + Math.abs(v - a[i]), 0) / (a.length - 1)));
  }
  // (a) talking, mouth only, English dense sentence
  await p.evaluate(() => { document.getElementById('lang').value = 'en'; document.getElementById('text').value = "Thank you very much, Bobur. Let's practise speaking English."; });
  await p.click('#silent'); await p.waitForTimeout(1200);
  await record('flash-talk', 2600);
  await p.click('#stop'); await p.waitForTimeout(300);
  // (b) mood switches every 350 ms
  const moods = ['laugh', 'smirk', 'surprised', 'confused', 'happy', 'oops', 'smirk'];
  const sw = (async () => { for (const m of moods) { await p.evaluate(v => { document.getElementById('mood').value = v; document.getElementById('mood').onchange(); }, m); await p.waitForTimeout(350); } })();
  await record('flash-mood', 2500); await sw;
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
