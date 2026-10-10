// Frame strip of one gesture in the real runtime: node capture_gesture.js <gesture> <mood> <tag> [ms=2400] [step=80]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [g, mood, tag, dur = 2400, step = 80] = process.argv.slice(2);
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 900 } });
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  const c = await p.$('canvas'); const shots = [];
  await p.evaluate(([g, m]) => { window.set('mood', m); window.set('gesture', g); }, [g, mood]);
  const t0 = Date.now();
  while (Date.now() - t0 < +dur) { const f = path.join(ROOT, 'captures', `${tag}-${shots.length}.png`); await c.screenshot({ path: f }); shots.push([f, `${Date.now() - t0}ms`]); await p.waitForTimeout(+step); }
  await b.close(); if (server.listening) server.close();
  const { execSync } = require('child_process');
  fs.writeFileSync(path.join(ROOT, 'captures', `${tag}.json`), JSON.stringify(shots));
  execSync(`python -c "
import json
from PIL import Image, ImageDraw
s=json.load(open('captures/${tag}.json'));W=150;cols=10;rows=(len(s)+cols-1)//cols
S=Image.new('RGB',(cols*W,rows*(W+16)),'#F7F5FF');d=ImageDraw.Draw(S)
for i,(f,l) in enumerate(s):
  im=Image.open(f).convert('RGBA').resize((W,W));x=(i%cols)*W;y=(i//cols)*(W+16)
  bg=Image.new('RGBA',(W,W),'#FFFFFF');bg.alpha_composite(im);S.paste(bg.convert('RGB'),(x,y));d.text((x+4,y+W+2),l,fill='#6E6E82')
S.save('captures/${tag}-strip.png')"`, { cwd: ROOT });
  console.log(`captures/${tag}-strip.png`, shots.length, 'frames');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
