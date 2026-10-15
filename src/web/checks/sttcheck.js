// Sends lesson clips to the speech-to-text server on this PC and prints what it heard.   node sttcheck.js
const fs = require('fs'), path = require('path');
const CLIPS = ['aziz/a-coffee-please', 'malika/can-i-have-a-sandwich', 'waiter/its-ten-thousand-som', 'aziz/im-aziz', 'seller/how-much-is-this'];
(async () => { for (const c of CLIPS) { const f = path.join(__dirname, '..', '..', 'content', 'audio', 'uk', c + '.wav'); if (!fs.existsSync(f)) { console.log(c, 'no clip'); continue; }
  const t0 = Date.now(), r = await fetch('http://127.0.0.1:8795/stt', { method: 'POST', body: fs.readFileSync(f) }); console.log(c.padEnd(32), JSON.stringify((await r.json()).text), (Date.now() - t0) + 'ms'); } })();
