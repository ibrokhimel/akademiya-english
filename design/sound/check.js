// node check.js  -> captures/*.png   Opens the listening page in a real browser, decodes EVERY sound, plays one, likes one, checks the save.
const fs = require('fs'), path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [path.join(__dirname, '..', 'motion'), path.join(__dirname, '..', 'rive')] }));
(async () => {
  const OUT = path.join(__dirname, 'captures'); fs.mkdirSync(OUT, { recursive: true });
  const picksFile = path.join(__dirname, 'picks.json'), before = fs.existsSync(picksFile) ? fs.readFileSync(picksFile) : null;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('http://127.0.0.1:8792/design/sound/'); await p.waitForFunction(() => window.auditionReady, null, { timeout: 20000 });
  const res = await p.evaluate(async () => { const man = await (await fetch('manifest.json')).json(), ctx = new AudioContext(), bad = []; let n = 0;
    for (const s of man.slots) for (const it of s.items) { try { const buf = await ctx.decodeAudioData(await (await fetch(it.url)).arrayBuffer()); if (Math.abs(buf.duration * 1000 - it.ms) > 60) bad.push(it.url + ' length'); n++; } catch (e) { bad.push(it.url); } }
    return { n, bad, slots: man.slots.map((s) => s.id + ' ' + s.items.length) }; });
  console.log('decoded', res.n, 'bad', JSON.stringify(res.bad)); console.log(res.slots.join(' · '));
  await p.screenshot({ path: path.join(OUT, '1-top.png') });
  await p.click('#right .card:nth-child(2)'); await p.waitForTimeout(250);
  console.log('playing class:', await p.evaluate(() => document.querySelectorAll('.card.playing').length));
  await p.click('#right .card:nth-child(3) .heart'); await p.waitForTimeout(900);
  console.log('saved:', fs.existsSync(picksFile) ? JSON.stringify(JSON.parse(fs.readFileSync(picksFile)).right) : 'NO FILE', '·', await p.textContent('#stat'), '·', await p.textContent('#saved'));
  await p.screenshot({ path: path.join(OUT, '2-liked.png') });
  await p.click('#tDark'); await p.evaluate(() => document.querySelector('#switch').scrollIntoView()); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, '3-dark-switch.png') });
  await p.setViewportSize({ width: 420, height: 800 }); await p.evaluate(() => document.querySelector('#pick').scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, '4-narrow.png') });
  if (before) fs.writeFileSync(picksFile, before); else if (fs.existsSync(picksFile)) fs.unlinkSync(picksFile);       // leave no test like behind
  console.log(errors.length ? 'PAGE ERRORS: ' + errors.join(' | ') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
