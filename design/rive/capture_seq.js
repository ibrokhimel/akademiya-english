// Filmstrip of any scripted sequence in the real runtime (preview.html), recorded in-page on rAF (frame accurate).
// node capture_seq.js <tag> <durationMs> <everyNthFrame> '<json schedule>'
//   schedule: [{t: ms, enum|bool|num|fire: prop, v: value}, ...]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const [tag, dur = 2000, nth = 3, sched = '[]'] = process.argv.slice(2);
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const RECORDER = `(ms, nth, schedule) => new Promise(res => {
  const cv = document.querySelector('canvas'); const OW = cv.width >= cv.height ? 195 : Math.round(195 * cv.width / cv.height), OH = Math.round(OW * cv.height / cv.width); const BG = getComputedStyle(cv).backgroundColor || '#fff'; const off = document.createElement('canvas'); off.width = OW; off.height = OH; const o = off.getContext('2d');
  const frames = [], t0 = performance.now(); let next = 0, n = 0;
  const apply = (a) => { const v = window.vmi; if (a.enum) v.enum(a.enum).value = a.v; if (a.bool) v.boolean(a.bool).value = a.v; if (a.num) v.number(a.num).value = a.v; if (a.fire) v.trigger(a.fire).trigger(); };
  const tick = () => { const t = performance.now() - t0; if (t > ms) return res(frames);
    while (next < schedule.length && t >= schedule[next].t) apply(schedule[next++]);
    if (n++ % nth === 0) { o.fillStyle = BG === 'rgba(0, 0, 0, 0)' ? '#fff' : BG; o.fillRect(0, 0, OW, OH); o.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, OW, OH); frames.push({ t: Math.round(t), png: off.toDataURL('image/png') }); }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick); })`;
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://127.0.0.1:8790/' + (process.env.PAGE || 'preview.html')); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  const frames = await p.evaluate(`(${RECORDER})(${+dur}, ${+nth}, ${sched})`);
  frames.forEach((f, i) => fs.writeFileSync(path.join(ROOT, 'captures', `${tag}-${i}.png`), Buffer.from(f.png.split(',')[1], 'base64')));
  fs.writeFileSync(path.join(ROOT, 'captures', `${tag}.json`), JSON.stringify(frames.map(f => f.t)));
  await b.close(); if (server.listening) server.close();
  fs.writeFileSync(path.join(ROOT, 'captures', '_strip.py'), `
import json,sys
from PIL import Image, ImageDraw
tag=sys.argv[1]; ts=json.load(open('captures/%s.json'%tag)); n=len(ts); im0=Image.open('captures/%s-0.png'%tag); W=130 if im0.width>=im0.height else 104; H=int(W*im0.height/im0.width); cols=min(n,12 if W>=120 else 16); rows=(n+cols-1)//cols
S=Image.new('RGB',(cols*W,rows*(H+14)),'#F7F5FF'); d=ImageDraw.Draw(S)
for i,t in enumerate(ts):
    im=Image.open('captures/%s-%d.png'%(tag,i)).convert('RGB').resize((W,H)); x=(i%cols)*W; y=(i//cols)*(H+14); S.paste(im,(x,y)); d.text((x+3,y+H+1),'%d'%t,fill='#6E6E82')
S.save('captures/%s-strip.png'%tag); print(tag,n,'frames',S.size)
`);
  console.log(execSync(`python captures/_strip.py ${tag}`, { cwd: ROOT }).toString().trim());
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
