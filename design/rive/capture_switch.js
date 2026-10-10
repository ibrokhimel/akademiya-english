// Switching check: celebrate (into its loop) -> wave -> thinking -> point -> none
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 900 } });
  await p.goto('http://127.0.0.1:8790/preview.html'); await p.waitForFunction(() => window.dombiReady); await p.waitForTimeout(3600);
  const c = await p.$('canvas'); const shots = [];
  const shot = async (l) => { const f = path.join(ROOT, 'captures', `switch-${shots.length}.png`); await c.screenshot({ path: f }); shots.push([f, l]); };
  const set = (k, v) => p.evaluate(([k, v]) => window.set(k, v), [k, v]);
  await set('mood', 'laugh'); await set('gesture', 'celebrate'); await p.waitForTimeout(3000); await shot('celebrate loop');
  await set('mood', 'happy'); await set('gesture', 'wave'); await p.waitForTimeout(500); await shot('wave 0.5s'); await p.waitForTimeout(1000); await shot('wave 1.5s'); await p.waitForTimeout(1500); await shot('wave done (loop)');
  await set('mood', 'think'); await set('gesture', 'thinking'); await p.waitForTimeout(1200); await shot('thinking loop');
  await set('mood', 'smirk'); await set('gesture', 'point'); await p.waitForTimeout(900); await shot('point loop');
  await set('gesture', 'none'); await p.waitForTimeout(500); await shot('none');
  await set('gesture', 'celebrate'); await p.waitForTimeout(250); await shot('celebrate again 0.25s');
  await b.close(); if (server.listening) server.close();
  const { execSync } = require('child_process');
  fs.writeFileSync(path.join(ROOT, 'captures', 'switch.json'), JSON.stringify(shots));
  execSync(`python -c "
import json
from PIL import Image, ImageDraw
s=json.load(open('captures/switch.json'));W=160
S=Image.new('RGB',(len(s)*W,W+18),'#F7F5FF');d=ImageDraw.Draw(S)
for i,(f,l) in enumerate(s):
  im=Image.open(f).convert('RGBA').resize((W,W));bg=Image.new('RGBA',(W,W),'#FFFFFF');bg.alpha_composite(im);S.paste(bg.convert('RGB'),(i*W,0));d.text((i*W+4,W+3),l,fill='#2B2B3C')
S.save('captures/switch-strip.png')"`, { cwd: ROOT });
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
