// Motion lab server: serves the whole project folder, so the pages can use the real icons and Rive files.
//   node serve.js  ->  http://127.0.0.1:8791/design/motion/
//   node serve.js 8793 lan  ->  also open to phones on the same Wi-Fi (to feel the taps in the hand). The mic needs https, so speaking stays on the PC.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm',
            '.png': 'image/png', '.svg': 'image/svg+xml', '.riv': 'application/octet-stream', '.json': 'application/json', '.wav': 'audio/wav' };
const PORT = +process.argv[2] || 8791, LAN = process.argv[3] === 'lan';
http.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const f = path.join(ROOT, u);
  // never the speak lab's server folder (its .env holds the Gemini key, its logs hold the learner's talks) nor any dotfile
  if (/\/\.|^\/src\/speak-lab\/server\//.test(u) || !f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(s);
}).listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => { console.log(`Open http://127.0.0.1:${PORT}/design/motion/`);
  if (LAN) Object.values(require('os').networkInterfaces()).flat().filter((a) => a.family === 'IPv4' && !a.internal).forEach((a) => console.log(`On a phone: http://${a.address}:${PORT}/design/motion/`)); });
// The browser version's speech to text (src/stt/server.py) starts with this server, unless it is already running.
http.get('http://127.0.0.1:8795/health', () => console.log('Speech to text is already running.')).on('error', () => {
  const py = require('child_process').spawn('python', [path.join(ROOT, 'src', 'stt', 'server.py')], { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  py.on('error', () => console.log('Speech to text did not start (python not found). The app will use the browser\'s own recogniser.'));
});
