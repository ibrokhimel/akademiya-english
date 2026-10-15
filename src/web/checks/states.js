// Plays every pop-up and problem screen (states.js) over a lesson picture and saves pictures, light and dark.
//   node states.js   (needs the lab's server: node design/motion/serve.js)   pictures -> src/web/checks/shots-st/
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const OUT = path.join(__dirname, 'shots-st'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(), log = [], errors = [];
  for (const dark of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(), d = dark ? '-dark' : '';
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('http://127.0.0.1:8791/src/web/checks/states.html' + (dark ? '?dark' : '')); await p.waitForFunction(() => window.ready, null, { timeout: 40000 });
    const shot = (n) => p.locator('#phone').screenshot({ path: path.join(OUT, n + d + '.png') });
    const wait = (ms) => p.waitForTimeout(ms), result = () => p.waitForFunction(() => window.ST.result !== null, null, { timeout: 20000 }).then(() => p.evaluate(() => window.ST.result));
    const home = () => p.evaluate(() => window.ST.dombiHome());
    const run = (n, ...a) => p.evaluate(({ n, a }) => window.ST.run(n, ...a), { n, a });
    // 29 · feedback form: sent, and closed by a tap outside
    await run('feedbackForm'); await wait(160); await shot('29-0-rising'); await wait(900); await shot('29-1-open');
    await p.locator('.st29 .chip', { hasText: 'Ovoz ishlamadi' }).click(); await p.locator('.st29 textarea').fill('Mikrofonni bosdim, lekin hech narsa bo\'lmadi'); await wait(400); await shot('29-2-filled');
    await p.locator('.st29 .tgl').click(); await wait(300); await p.locator('.st29 .btn').click(); await wait(150); await shot('29-3-leaving'); await wait(400); await shot('29b-toast');
    log.push(`29 sent: ${JSON.stringify(await result())} saved: ${JSON.stringify(await p.evaluate(() => window.ST.saved.map((f) => [f.chips, f.text.length, f.screenshot])))} dombi back: ${await home()}`);
    await wait(2600);
    await run('feedbackForm'); await wait(900); await p.mouse.click(195, 120); log.push(`29 tap outside: ${JSON.stringify(await result())} dombi back: ${await home()}`);
    // 30 · confidence again, 30b · grew
    await run('confidenceAgain'); await wait(1300); await shot('30-0-open'); await p.locator('.st30 .copt').nth(3).click(); await wait(400); await shot('30-1-picked');
    await p.locator('.st30 .btn').click(); await wait(1150); await shot('30b-0-arrow'); await wait(1500); await shot('30b-1-done'); await p.locator('.st30 .btn').click();
    log.push(`30 grew: ${JSON.stringify(await result())} dombi back: ${await home()}`);
    await run('confidenceAgain'); await wait(1300); await p.locator('.st30 .copt').nth(1).click(); await wait(200); await p.locator('.st30 .btn').click(); log.push(`30 same as day 1: ${JSON.stringify(await result())}`);
    // 31a · no internet: shown on demand, and when the browser really goes offline
    await run('showOffline'); await wait(1300); await shot('31a-0-open'); await p.locator('.st31a .btn').click(); await wait(500); await shot('31a-1-trying'); log.push(`31a on demand: ${await result()}`);
    await p.evaluate(() => { window.stopWatch = window.ST.S.watchOnline(window.ST.ctx); }); await ctx.setOffline(true); await wait(1400); const shown = await p.locator('.st31a').count();
    await shot('31a-2-offline'); await ctx.setOffline(false); await wait(1600); log.push(`31a offline: shown ${shown}, after online: ${await p.locator('.st31a').count()} left`); await p.evaluate(() => window.stopWatch());
    // 31b · mic blocked
    await run('micBlocked'); await wait(250); await shot('31b-0-rising'); await wait(1300); await shot('31b-1-open'); await p.locator('.st31b .stlink').click(); log.push(`31b: ${await result()} dombi back: ${await home()}`);
    // 31c · speech unavailable
    await wait(400); await run('speechUnavailable'); await wait(1100); await shot('31c-open'); await p.locator('.st31c .btn').click(); log.push(`31c: ${await result()}`);
    // 31e · something went wrong
    await wait(400); await run('errorScreen'); await wait(1300); await shot('31e-0-open'); await p.locator('.st31e .btn.primary').click(); await wait(500); await shot('31e-1-trying'); log.push(`31e: ${await result()} dombi back: ${await home()}`);
    // 31d · not ready yet, then its feedback button
    await run('notReady'); await wait(1300); await shot('31d-open'); await p.locator('.st31d .btn.secondary').click(); await wait(900); await shot('31d-feedback-over');
    await p.mouse.click(195, 120); log.push(`31d via feedback: ${await result()}`);
    await shot('end-behind'); await ctx.close();
  }
  console.log(log.join('\n')); console.log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
