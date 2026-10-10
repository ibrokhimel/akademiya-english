// Mood-switch flash test, schedule driven INSIDE the page (separate evaluates get queued behind the recorder).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const RECORDER = `(ms, schedule) => new Promise(res => {
  const cv = document.querySelector('canvas'), w = cv.width, h = cv.height;
  const x0 = Math.floor(w*0.28), x1 = Math.floor(w*0.72), y0 = Math.floor(h*0.60), y1 = Math.floor(h*0.76);   // mouth only, below the eyes
  const off = document.createElement('canvas'); off.width = x1-x0; off.height = y1-y0; const octx = off.getContext('2d');
  const frames = [], t0 = performance.now(); let next = 0, cur = 'smirk';
  const tick = () => { const t = performance.now()-t0; if (t > ms) return res(frames);
    while (next < schedule.length && t >= schedule[next].t) { cur = schedule[next].mood; const e = document.getElementById('mood'); e.value = cur; e.onchange(); next++; }
    octx.drawImage(cv, x0, y0, x1-x0, y1-y0, 0, 0, x1-x0, y1-y0);
    const d = octx.getImageData(0,0,off.width,off.height).data; let n=0; for (let k=0;k<d.length;k+=4) if (d[k]>200&&d[k+1]>200&&d[k+2]>200&&d[k+3]>100) n++;
    frames.push({ t: Math.round(t), area: n, shape: cur, png: off.toDataURL('image/png') });
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick); })`;
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://127.0.0.1:8790/talk.html'); await p.waitForTimeout(4200);
  const schedule = ['laugh', 'smirk', 'surprised', 'confused', 'happy', 'oops', 'talk', 'smirk'].map((mood, i) => ({ t: 100 + i * 330, mood }));
  const frames = await p.evaluate(`(${RECORDER})(2900, ${JSON.stringify(schedule)})`);
  const a = frames.map(f => f.area), flags = [];
  for (let i = 1; i < a.length - 1; i++) { const dip = Math.min(a[i-1], a[i+1]) - a[i], spike = a[i] - Math.max(a[i-1], a[i+1]);
    if (dip > 120 || spike > 120) flags.push(`${frames[i].t}ms ${dip > 0 ? 'dip ' + dip : 'spike ' + spike}`); }
  console.log(`ff-mood2: ${frames.length} frames, area ${Math.min(...a)}–${Math.max(...a)}; one-frame dips/spikes >120px: ${flags.length}${flags.length ? ' -> ' + flags.join('; ') : ''}`);
  console.log('area every ~100 ms:', frames.filter((f, i) => i % 6 === 0).map(f => `${f.t}:${f.area}${f.shape[0]}`).join(' '));
  frames.forEach((f, i) => fs.writeFileSync(path.join(ROOT, 'captures', `ff-mood2-${i}.png`), Buffer.from(f.png.split(',')[1], 'base64')));
  fs.writeFileSync(path.join(ROOT, 'captures', 'ff-mood2.json'), JSON.stringify(frames.map(({ png, ...r }) => r)));
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
