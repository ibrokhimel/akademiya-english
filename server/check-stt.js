// Sends a few lesson clips to the Whisper server and prints what it heard and how long it took.
//   node server/check-stt.js [http://127.0.0.1:8795]
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8795';
const AUDIO = path.join(__dirname, '..', 'src', 'content', 'audio');
const clips = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(mp3|m4a|wav|ogg)$/i.test(f.name) && !/slow/i.test(p)) clips.push(p); } })(AUDIO);

(async () => {
  const h = await fetch(BASE + '/health').then((r) => r.json()).catch(() => null);
  if (!h) { console.log('FAIL the speech server is not answering at', BASE); process.exit(1); }
  console.log('speech server:', h.model, 'on', h.device);
  for (const p of clips.filter((_, i) => i % Math.max(1, Math.floor(clips.length / 4)) === 0).slice(0, 4)) {
    const t = Date.now();
    const r = await fetch(BASE + '/stt', { method: 'POST', body: fs.readFileSync(p) }).then((x) => x.json());
    console.log(`${path.relative(AUDIO, p)}  ->  "${r.text}"  (${Date.now() - t} ms)`);
  }
})();
