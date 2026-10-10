// Local preview: node serve.js  ->  http://127.0.0.1:8790/preview.html  (plays out/dombi.riv)
const http = require('http'), fs = require('fs'), path = require('path');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.png': 'image/png' };
http.createServer((q, s) => {
  const u = q.url.split('?')[0]; const f = path.join(__dirname, decodeURIComponent(u === '/' ? '/index.html' : u));
  if (!f.startsWith(__dirname) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
}).listen(8790, '127.0.0.1', () => console.log('Open http://127.0.0.1:8790/preview.html'));
