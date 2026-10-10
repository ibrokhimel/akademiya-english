// Record th-heavy English in the runtime (mouth only) and build a sheet of the frames around every TH.
// Usage: node capture_th.js  -> captures/th-sheet.png
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const RECORDER = `(ms) => new Promise(res => {
  const cv = document.querySelector('canvas'), w = cv.width, h = cv.height;
  const x0 = Math.floor(w*0.28), x1 = Math.floor(w*0.72), y0 = Math.floor(h*0.58), y1 = Math.floor(h*0.76);
  const off = document.createElement('canvas'); off.width = x1-x0; off.height = y1-y0; const octx = off.getContext('2d');
  const frames = [], t0 = performance.now();
  const tick = () => { const t = performance.now()-t0; if (t > ms) return res(frames);
    octx.drawImage(cv, x0, y0, x1-x0, y1-y0, 0, 0, x1-x0, y1-y0);
    frames.push({ t: Math.round(t), shape: document.getElementById('shape').textContent, png: off.toDataURL('image/png') });
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick); })`;
const TEXT = process.argv[2] || 'Thank you. The thing with this is that I think.';
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  await p.goto('http://127.0.0.1:8790/talk.html'); await p.waitForTimeout(4200);
  await p.evaluate((txt) => { document.getElementById('lang').value = 'en'; document.getElementById('text').value = txt; }, TEXT);
  await p.click('#silent'); await p.waitForTimeout(1300);
  const frames = await p.evaluate(`(${RECORDER})(4200)`);
  frames.forEach((f, i) => fs.writeFileSync(path.join(ROOT, 'captures', `th-${i}.png`), Buffer.from(f.png.split(',')[1], 'base64')));
  fs.writeFileSync(path.join(ROOT, 'captures', 'th.json'), JSON.stringify(frames.map(({ png, ...r }) => r)));
  console.log('frames', frames.length, '· TH frames', frames.filter(f => f.shape === 'TH').length, '· shapes seen:', [...new Set(frames.map(f => f.shape))].join(' '));
  await b.close(); if (server.listening) server.close();
  fs.writeFileSync(path.join(ROOT, 'captures', 'th_sheet.py'), `
import json
from PIL import Image, ImageDraw
fr=json.load(open('captures/th.json')); n=len(fr)
runs=[]; i=0
while i<n:
    if fr[i]['shape']=='TH':
        j=i
        while j<n and fr[j]['shape']=='TH': j+=1
        runs.append((max(0,i-3), min(n-1,j+2))); i=j
    else: i+=1
runs=runs[:6]
im0=Image.open('captures/th-0.png'); W,H=im0.size; cols=max(b-a+1 for a,b in runs)
S=Image.new('RGB',(cols*(W+4),len(runs)*(H+18)),'#F7F5FF'); d=ImageDraw.Draw(S)
for r,(a,b) in enumerate(runs):
    y=r*(H+18)
    for k,i in enumerate(range(a,b+1)):
        im=Image.open('captures/th-%d.png'%i).convert('RGB'); x=k*(W+4); S.paste(im,(x,y))
        d.text((x+2,y+H+2),'%d %s'%(fr[i]['t'],fr[i]['shape']),fill='#2B2B3C' if fr[i]['shape']=='TH' else '#6E6E82')
S.save('captures/th-sheet.png'); print('runs',runs,S.size)
`);
  console.log(execSync('python captures/th_sheet.py', { cwd: ROOT }).toString());
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
