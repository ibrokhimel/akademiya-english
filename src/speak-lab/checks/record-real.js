// Records what the page actually plays during one real greeting (the player's output, tapped) and the raw chunks Gemini sent,
// so the sound can be analysed and listened to.   node src/speak-lab/checks/record-real.js <out-dir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(__dirname, '..', 'server', 'logs');
const wav = (int16, rate) => { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + int16.length * 2, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(int16.length * 2, 40); return Buffer.concat([h, Buffer.from(int16.buffer, int16.byteOffset, int16.length * 2)]); };
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto('http://127.0.0.1:8791/src/speak-lab/'); await p.waitForSelector('.start .go'); await p.click('.tcard[data-id="day"]'); await p.click('.go');
  await p.waitForFunction(() => window.SPEAK && window.SPEAK.talk && window.SPEAK.talk.session, null, { timeout: 20000 });
  await p.evaluate(() => { const T = window.SPEAK.talk; T.tapped = []; T.raw = []; T.player.tap((f) => T.tapped.push(Array.from(f))); const push = T.player.push.bind(T.player); T.player.push = (pcm) => { T.raw.push(Array.from(pcm)); push(pcm); }; });
  await p.waitForFunction(() => document.querySelectorAll('.cap.done').length >= 1, null, { timeout: 40000 }); await p.waitForTimeout(1500);
  const { tapped, raw, rate, caption } = await p.evaluate(() => ({ tapped: window.SPEAK.talk.tapped.flat(), raw: window.SPEAK.talk.raw, rate: window.SPEAK.talk.player ? 24000 : 0, caption: document.querySelector('.cap.done .ctext').textContent }));
  fs.mkdirSync(OUT, { recursive: true });
  const played = Int16Array.from(tapped, (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767))));
  const rawAll = Int16Array.from(raw.flat());
  fs.writeFileSync(path.join(OUT, 'played.wav'), wav(played, rate)); fs.writeFileSync(path.join(OUT, 'raw.wav'), wav(rawAll, 24000));
  fs.writeFileSync(path.join(OUT, 'chunks.json'), JSON.stringify(raw.map((c) => c.length)));
  console.log(`caption: ${caption}\nplayed: ${(played.length / rate).toFixed(2)} s · raw: ${(rawAll.length / 24000).toFixed(2)} s in ${raw.length} chunks · saved to ${OUT}`);
  await b.close();
})().catch((e) => { console.log('record-real: FAIL', e.message); process.exit(1); });
