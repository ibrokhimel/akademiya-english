// Sound audition server: serves the project folder and saves what you like to design/sound/picks.json.
//   node serve.js  ->  http://127.0.0.1:8792/design/sound/
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), PICKS = path.join(__dirname, 'picks.json');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
            '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.riv': 'application/octet-stream', '.wasm': 'application/wasm' };
const PORT = +process.argv[2] || 8792;
http.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (q.method === 'POST' && u === '/design/sound/picks') {
    let body = ''; q.on('data', (c) => { body += c; if (body.length > 1e6) q.destroy(); });
    q.on('end', () => { try { const j = JSON.parse(body); fs.writeFileSync(PICKS, JSON.stringify(j, null, 2)); s.writeHead(200); s.end('ok'); } catch (e) { s.writeHead(400); s.end('bad json'); } });
    return;
  }
  if (u === '/design/sound/picks.json' && !fs.existsSync(PICKS)) { s.writeHead(200, { 'Content-Type': 'application/json' }); return s.end('{}'); }
  if (u.endsWith('/')) u += 'index.html';
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(s);
}).listen(PORT, '127.0.0.1', () => console.log(`Open http://127.0.0.1:${PORT}/design/sound/`));
