// node check-dombi.js [folder]  -> one .wav per voice of Dombi saying "Salom! Men Dombiman." (the server must be running)
// The voices are made in the browser, so this renders each one to a file; measure_dombi.py in design/sound/tools then
// reports how loud and how high each is, which is how their levels are set without listening.
const fs = require('fs'), os = require('os'), path = require('path'), { chromium } = require('playwright');
(async () => {
  const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'dombi-')), b = await chromium.launch(), p = await b.newPage();
  await p.goto('http://127.0.0.1:8791/design/motion/onboarding.html'); await p.waitForFunction(() => window.DOMBI);
  for (const v of await p.evaluate(() => Object.keys(DOMBI.VOICES))) {
    const pcm = await p.evaluate(async (v) => { const c = new OfflineAudioContext(1, 44100 * 2, 44100), plan = DOMBI.render(c, c.destination, 'Salom! Men Dombiman.', v, 0.05);
      const d = (await c.startRendering()).getChannelData(0); return { ms: plan.ms, n: plan.syl.length, data: Array.from(d, (x) => Math.round(Math.max(-1, Math.min(1, x)) * 32767)) }; }, v);
    const body = Buffer.alloc(pcm.data.length * 2); pcm.data.forEach((x, i) => body.writeInt16LE(x, i * 2));
    const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + body.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
    h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(body.length, 40);
    fs.writeFileSync(path.join(OUT, v + '.wav'), Buffer.concat([h, body])); console.log(`${v}: ${pcm.n} sounds over ${pcm.ms} ms`);
  }
  await b.close(); console.log('folder:', OUT);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
