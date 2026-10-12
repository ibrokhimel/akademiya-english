// Still pictures of the waiters for Pencil, taken from the real runtime (transparent background), light and dark:
//   pendev/icons-r2/waiter-<a|c>[-talk|-grin|-hm][-dark].png            node capture_waiter_png.js
// rest = idle, talk = mouth shape 5 (EH), grin = peak of the right-answer reaction, hm = peak of the mistake reaction.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, OUT = path.join(ROOT, '..', '..', 'pendev', 'icons-r2');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.riv': 'application/octet-stream' };
const PAGE = `<!doctype html><body><script src="node_modules/@rive-app/canvas/rive.js"></script><script>
  window.vmis = []; let n = 0;
  for (const k of ['A', 'C']) for (const dark of [false, true]) {
    const c = document.createElement('canvas'); c.width = c.height = 512; c.id = 'waiter-' + k.toLowerCase() + (dark ? '-dark' : ''); document.body.appendChild(c);
    const r = new rive.Rive({ src: 'out/waiters/test.riv', canvas: c, artboard: 'Waiter ' + k, stateMachines: 'Waiter', autoplay: true, autoBind: true,
      onLoad: () => { r.viewModelInstance.boolean('dark').value = dark; window.vmis.push(r.viewModelInstance); if (++n === 4) window.ready = true; } });
  }
  window.grab = () => Object.fromEntries([...document.querySelectorAll('canvas')].map(c => [c.id, c.toDataURL('image/png')]));
</script></body>`;
const server = http.createServer((q, s) => { const u = q.url.split('?')[0];
  if (u === '/still.html') { s.writeHead(200, { 'Content-Type': 'text/html' }); return s.end(PAGE); }
  const f = path.join(ROOT, decodeURIComponent(u));
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => server.listen(8794, '127.0.0.1', r));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 1100 } });
  await p.goto('http://127.0.0.1:8794/still.html'); await p.waitForFunction(() => window.ready);
  const grab = async (suffix) => { const shots = await p.evaluate(() => window.grab());
    for (const [id, url] of Object.entries(shots)) { const name = id.replace(/^(waiter-.)/, '$1' + suffix) + '.png';
      fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(',')[1], 'base64')); console.log(name); } };
  await p.waitForTimeout(3300);                     // after the start-up logo, before the first blink
  await grab('');
  await p.evaluate(() => window.vmis.forEach(v => { v.number('viseme').value = 5; v.boolean('talking').value = true; })); await p.waitForTimeout(300);
  await grab('-talk');
  await p.evaluate(() => window.vmis.forEach(v => { v.boolean('talking').value = false; })); await p.waitForTimeout(250);
  await p.evaluate(() => window.vmis.forEach(v => v.trigger('correct').trigger())); await p.waitForTimeout(450);
  await grab('-grin');
  await p.waitForTimeout(1200);
  await p.evaluate(() => window.vmis.forEach(v => v.trigger('wrong').trigger())); await p.waitForTimeout(350);
  await grab('-hm');
  await b.close(); server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
