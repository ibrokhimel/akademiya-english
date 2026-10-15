// Shared runner for the page checks: opens a lab page in a real browser, plays steps, saves pictures, reports page errors.
// Steps: ['shot', '#id', 'name'] · ['act', '#id', 'data-a'] · ['press', 'selector'] · ['click', 'selector'] · ['wait', ms] · ['eval', fn]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
module.exports = async function run(pageName, prefix, steps, viewport = { width: 1240, height: 900 }) {
  const OUT = path.join(__dirname, 'captures'); fs.mkdirSync(OUT, { recursive: true });
  const dark = process.argv[2] === 'dark', tag = dark ? '-dark' : '';
  const b = await chromium.launch(); const p = await b.newPage({ viewport });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(`http://127.0.0.1:8791/design/motion/${pageName}`); await p.mouse.click(4, 4);      // a first tap, so the browser allows sound
  await p.waitForFunction(() => window.labReady, null, { timeout: 15000 });
  await p.waitForTimeout(2700);                                   // the Rive start-up logo
  if (dark) await p.click('#tDark');
  const centre = async (sel) => { const el = await p.$(sel); if (!el) throw new Error('not found: ' + sel); await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); const r = await el.boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  for (const [kind, a, c] of steps) {
    if (kind === 'wait') await p.waitForTimeout(a);
    else if (kind === 'shot') { await (await p.$(a)).screenshot({ path: path.join(OUT, `${prefix}-${c}${tag}.png`) }); await p.evaluate((n) => window.SND && SND.log.push({ name: `[${n}]` }), c); }
    else if (kind === 'act') await p.click(`${a} .ctl [data-a="${c}"]`);
    else if (kind === 'press') { const [x, y] = await centre(a); await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); }
    else if (kind === 'click') { const [x, y] = await centre(a); await p.mouse.click(x, y); }
    else if (kind === 'eval') console.log(JSON.stringify(await p.evaluate(a)));
  }
  // which sound played at which point: [name] marks a picture taken; ~x = not played (mic listening, repeat, sound asleep)
  console.log('sounds: ' + await p.evaluate(() => window.SND ? SND.log.map((e) => (e.skipped ? '~' : '') + e.name + (e.step ? '+' + e.step : '') + (e.n > 1 ? 'x' + e.n : '') + (e.skipped ? '(' + e.skipped + ')' : '')).join(' ') : 'none'));
  await b.close();
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
};
