// node check-wheel.js  -> captures/wheel-*.png and a line for each test of the time wheel (the server must be running)
// Flick, slow drag, tap and mouse wheel on both wheels: where it comes to rest, how many ticks, and pictures along the way.
const path = require('path'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), OUT = path.join(__dirname, 'captures'), errors = [];
  for (const [name, url, open] of [['controls', 'controls.html', null], ['onboarding', 'onboarding.html', () => OB.go('reminder')]]) {
    const p = await b.newPage({ viewport: { width: 1240, height: 900 } }); p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://127.0.0.1:8791/design/motion/' + url); await p.mouse.click(4, 4); await p.waitForFunction(() => window.labReady); await p.evaluate(() => SND.ready); await p.waitForTimeout(2700);
    if (open) { await p.evaluate(open); await p.waitForTimeout(1200); }
    const w = await p.$('.wheel'); await w.evaluate((e) => e.scrollIntoView({ block: 'center' })); const r = await w.boundingBox(), x = r.x + r.width / 2, y = r.y + r.height / 2;
    const state = () => p.evaluate(() => { const w = document.querySelector('.wheel'), s = w.querySelector('.sel').getBoundingClientRect(), on = w.querySelector('.opt.on'), o = on.getBoundingClientRect();
      const rows = [...w.querySelectorAll('.opt')].map((e) => [e.getBoundingClientRect().top, e.textContent]).sort((a, c) => a[0] - c[0]).map((e) => e[1]);
      return { on: on.textContent, offCentre: Math.round((o.top + o.height / 2 - s.top - s.height / 2) * 10) / 10, order: rows.join(' '), ticks: SND.log.filter((e) => e.name === 'tick').reduce((a, e) => a + (e.n || 1), 0) }; });
    const clear = () => p.evaluate(() => { SND.log.length = 0; }), shot = (n) => w.screenshot({ path: path.join(OUT, `wheel-${name}-${n}.png`) });
    const drag = async (dy, ms, hold = 0) => { await p.mouse.move(x, y); await p.mouse.down(); const steps = Math.max(2, Math.round(ms / 10)); for (let i = 1; i <= steps; i++) { await p.mouse.move(x, y + dy * i / steps); await p.waitForTimeout(8); } if (hold) await p.waitForTimeout(hold); await p.mouse.up(); };
    console.log(`== ${name} ==`); console.log('at rest      ', JSON.stringify(await state())); await shot('0-rest');
    await clear(); await drag(-70, 60); await p.waitForTimeout(120); await shot('1-flick-120ms'); await p.waitForTimeout(500); await shot('2-flick-620ms'); await p.waitForTimeout(2600); await shot('3-flick-rest');
    console.log('flick up     ', JSON.stringify(await state()));
    await clear(); await drag(100, 500, 200); await p.waitForTimeout(700); console.log('slow drag, held, let go', JSON.stringify(await state()));
    await clear(); await p.mouse.click(x, y - 60); await p.waitForTimeout(700); console.log('tap the row above', JSON.stringify(await state()));
    await clear(); await p.mouse.move(x, y); await p.mouse.wheel(0, 100); await p.waitForTimeout(100); await p.mouse.wheel(0, 100); await p.waitForTimeout(700); console.log('mouse wheel, two notches', JSON.stringify(await state()));
    await clear(); await drag(260, 70); await p.waitForTimeout(3200); console.log('hard flick down', JSON.stringify(await state())); await shot('4-after-hard-flick');
    await p.close();
  }
  await b.close(); console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
