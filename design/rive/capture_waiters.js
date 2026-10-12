// Records the waiters in the real runtime (waiters.html) -> captures/waiters/<tag>-N.png + <tag>.json (ms since the action).
//   node capture_waiters.js idle 9              dense frames of the idle
//   node capture_waiters.js correct 1.5 "api.correct()"     run an action, then record
//   node capture_waiters.js visemes             one still per mouth shape (0-11)
//   add "dark" as the last argument for dark mode
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.riv': 'application/octet-stream' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  const args = process.argv.slice(2); const dark = args[args.length - 1] === 'dark'; if (dark) args.pop();
  const [tag = 'idle', secs = '8', action] = args;
  await new Promise(r => server.listen(8793, '127.0.0.1', r));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 940, height: 760 } });
  await p.goto('http://127.0.0.1:8793/waiters.html'); await p.waitForFunction(() => window.waitersReady);
  await p.waitForTimeout(2300);                                   // the runtime's start-up logo
  if (dark) { await p.evaluate(() => window.api.dark(true)); await p.waitForTimeout(500); }
  const stage = await p.$('#stage'); const dir = path.join(ROOT, 'captures', 'waiters'); fs.mkdirSync(dir, { recursive: true });
  const times = [];
  if (tag.startsWith('visemes')) {
    for (let i = 0; i < 12; i++) { await p.evaluate((n) => window.api.viseme(n), i); await p.waitForTimeout(350); times.push(i); await stage.screenshot({ path: path.join(dir, `${tag}-${i}.png`) }); }
  } else {
    if (action) await p.evaluate(action);
    const t0 = Date.now();
    for (let i = 0; Date.now() - t0 < +secs * 1000; i++) { times.push(Date.now() - t0); await stage.screenshot({ path: path.join(dir, `${tag}-${i}.png`) }); }
  }
  await b.close(); server.close();
  fs.writeFileSync(path.join(dir, `${tag}.json`), JSON.stringify(times));
  console.log(tag, times.length, 'frames');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
