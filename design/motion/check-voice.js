// node check-voice.js  -> captures/voice-*.png and what the listening bars did, with a real (pretend) microphone
// The browser is given a recording as its mic: 1.5 s of quiet, four syllables, then quiet. A second run gives it only quiet.
// Checks: the bars rest as dots (as tall as wide), rise with the voice, and the screen moves on by itself after the voice stops.
const fs = require('fs'), os = require('os'), path = require('path'), { chromium } = require('playwright');
const OUT = path.join(__dirname, 'captures'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-'));
function wav(file, voiced) {                                      // 48 kHz mono: a voice-like buzz (150 Hz and its overtones) in four syllables
  const sr = 48000, n = sr * 7, pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) { const t = i / sr, s = t - 1.5; let v = 0;
    if (voiced && s > 0 && s < 1.2) { const env = Math.pow(Math.max(0, Math.sin(s / 0.3 * Math.PI)), 0.6); for (let h = 1; h <= 18; h++) v += Math.sin(2 * Math.PI * 150 * h * t) / h; v *= env * 0.22; }
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2); }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); fs.writeFileSync(file, Buffer.concat([h, pcm])); return file;
}
const browser = (file) => chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${file}%noloop`] });
const errors = [];
async function page(b, url) { const c = await b.newContext({ viewport: { width: 1240, height: 860 }, permissions: ['microphone'] }), p = await c.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://127.0.0.1:8791/design/motion/' + url); await p.mouse.click(4, 4); await p.waitForFunction(() => window.labReady); await p.evaluate(() => SND.ready); await p.waitForTimeout(2700); return p; }
// every 100 ms: the bars' heights, and a word about where the screen is
async function watch(p, sel, ms, where) { const rows = [];
  for (let t = 0; t <= ms; t += 100) { rows.push(await p.evaluate(([sel, where]) => [[...document.querySelectorAll(sel)].map((b) => Math.round(parseFloat(b.style.height) || b.offsetHeight)), eval(where)], [sel, where])); await p.waitForTimeout(100); }
  return rows; }
const report = (name, rows, w) => { const all = rows.flatMap((r) => r[0]); let prev = null;
  console.log(`== ${name} ==  bar is ${w} px wide · lowest ${Math.min(...all)} px · highest ${Math.max(...all)} px`);
  rows.forEach(([h, s], i) => { if (i % 3 === 0 || s !== prev) console.log(String(i * 100).padStart(5) + ' ms  ' + h.map((v) => String(v).padStart(2)).join(' ') + '   ' + (s !== prev ? s : '')); prev = s; }); };
(async () => {
  let b = await browser(wav(path.join(TMP, 'hello.wav'), true));
  // 1 · onboarding: the mic check waits for a real "Hello!" and moves on by itself
  let p = await page(b, 'onboarding.html'); await p.evaluate(() => OB.go('listen')); await p.waitForTimeout(700);
  const S = '.phonewrap'; await (await p.$(S)).screenshot({ path: path.join(OUT, 'voice-onboarding-1-quiet.png') });
  const shots = (async () => { await p.waitForTimeout(1500); await (await p.$(S)).screenshot({ path: path.join(OUT, 'voice-onboarding-2-speaking.png') }); })();
  report('onboarding mic check, real mic', await watch(p, '#obstage .obscr:last-child .vbars i', 4200, 'OB.cur'), 8); await shots; await p.close();
  // 2 · the mic button on the lesson page, pressed for real
  p = await page(b, 'lesson.html'); const btn = await p.$('#mic .p3d'); await btn.evaluate((e) => e.scrollIntoView({ block: 'center' })); const r = await btn.boundingBox();
  await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up();
  const shot2 = (async () => { await p.waitForTimeout(600); await (await p.$('#dMic')).screenshot({ path: path.join(OUT, 'voice-mic-1-quiet.png') }); await p.waitForTimeout(1400); await (await p.$('#dMic')).screenshot({ path: path.join(OUT, 'voice-mic-2-speaking.png') }); })();
  report('mic button, real mic', await watch(p, '#mic .bars i', 4800, "document.querySelector('#mic .cap').textContent"), 5); await shot2; await p.close(); await b.close();
  // 3 · nobody speaks: it gives up after 5 s
  b = await browser(wav(path.join(TMP, 'quiet.wav'), false)); p = await page(b, 'lesson.html'); const b2 = await p.$('#mic .p3d'); await b2.evaluate((e) => e.scrollIntoView({ block: 'center' })); const r2 = await b2.boundingBox();
  await p.mouse.move(r2.x + r2.width / 2, r2.y + r2.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up();
  const rows = await watch(p, '#mic .bars i', 6200, "document.querySelector('#mic .cap').textContent"); report('mic button, nobody speaks', rows.filter((_, i) => i % 6 === 0 || i > 48), 5);
  console.log('sounds:', await p.evaluate(() => SND.log.map((e) => e.name + (e.skipped ? '~' + e.skipped : '')).join(' '))); await b.close();
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
