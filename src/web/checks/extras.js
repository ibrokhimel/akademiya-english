// The rest of the app around the lessons: logging out and back in, deleting the account, the date moved 14 days (the confidence question
// comes back after a lesson), every pop-up and problem screen opened from Settings, a phone-sized window, and Reduce Motion.
//   node extras.js   (SHOTS=folder)        Needs the lab's server: node design/motion/serve.js
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright'); const { playThrough } = require('./drive.js');
const PART = process.env.PART, want = (n) => !PART || PART.split(',').includes(String(n));
const OUT = path.join(__dirname, process.env.SHOTS || 'shots-extras'); fs.mkdirSync(OUT, { recursive: true });
const seed = () => { const y = new Date(Date.now() - 864e5).toISOString(); localStorage.setItem('akademiya.events', JSON.stringify([{ type: 'onboarding', at: y, goal: 'travel', level: 'new', confidence: 2, micOk: true, saveVoice: true, reminder: '19:00' },
  { type: 'lesson', id: 'l1', at: y, accuracy: 100, mistakes: 0, spokenMs: 5000, skipped: 0 }, { type: 'account', method: 'google', at: y }])); localStorage.setItem('akademiya.account', '"google"'); localStorage.setItem('akademiya.name', '"Ibrokhim"'); };
(async () => {
  const b = await chromium.launch(), errors = [], out = [];
  const page = async (vp, opts = {}) => { const p = await b.newPage({ viewport: vp, ...opts }); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.addInitScript(`window.APP_TEST = { say: [], else: true, clips: true }; if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.clear(); (${seed})(); }`); return p; };
  const shotOf = (p) => (name) => p.locator('#phone').screenshot({ path: path.join(OUT, name + '.png') });
  const pressOf = (p) => async (sel) => { const el = p.locator(sel).first(); await el.waitFor({ state: 'visible', timeout: 15000 }); await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); };
  const learnReady = (p) => p.waitForFunction(() => window.APP && window.APP.learn && window.APP.learn.ready(), null, { timeout: 40000 });
  const openSettings = async (p, press) => { await p.click('.tab[data-t="profile"]'); await p.waitForTimeout(1200); await press('.pg27 [data-a="gear"]'); await p.waitForTimeout(1000); };

  // ---- 1. log out, then log back in with the same Google ----
  if (want(1)) { const p = await page({ width: 430, height: 880 }), shot = shotOf(p), press = pressOf(p);
    await p.goto('http://127.0.0.1:8791/src/web/'); await learnReady(p); await openSettings(p, press);
    await press('.pg28 [data-a="logout"]'); await p.waitForTimeout(700); await shot('1-logout-dialog');
    await Promise.all([p.waitForNavigation(), press('.pgsheet [data-y]')]); await p.waitForFunction(() => window.APP && window.APP.ob === 'welcome', null, { timeout: 40000 }); await p.waitForTimeout(1500); await shot('1-welcome-after-logout');
    await press('.obscr[data-s="welcome"] [data-go="login"]'); await p.waitForTimeout(1300); await press('.obscr[data-s="login"] .signin[data-m="google"]');
    await learnReady(p); await p.waitForTimeout(800); await shot('1-logged-back-in');
    out.push('log out and back in: ' + JSON.stringify(await p.evaluate(() => ({ lessons: window.APP.events.filter((e) => e.type === 'lesson').length, name: window.APP.ctx.settings.name })))); await p.close(); }

  // ---- 2. the date 14 days on: after a lesson the confidence question comes back ----
  if (want(2)) { const p = await page({ width: 430, height: 880 }), shot = shotOf(p), press = pressOf(p);
    await p.goto('http://127.0.0.1:8791/src/web/'); await learnReady(p); await openSettings(p, press);
    await Promise.all([p.waitForNavigation(), press('.pg28 [data-d="14"]')]); await learnReady(p); await p.waitForTimeout(800); await shot('2-learn-14-days-on');
    out.push('date after +14: ' + await p.evaluate(() => window.APP.ctx.now().toISOString().slice(0, 10)) + ', streak ' + await p.evaluate(() => window.APP.progress().streak.count));
    await press('.pathin [data-id="l2"]'); await p.waitForTimeout(900); await press('#shStart'); await p.waitForSelector('.scr.lesson .ex');
    await playThrough(p, 'l2', { shot, press }).catch(() => {});
    await p.waitForSelector('.st30', { timeout: 20000 }); await p.waitForTimeout(1500); await shot('2-confidence-again');
    await press('.st30 .copt >> nth=3'); await p.waitForTimeout(400); await press('.st30 .btn.primary'); await p.waitForTimeout(2600); await shot('2-confidence-grew'); await press('.st30 .btn'); await p.waitForFunction(() => !document.querySelector('.st30'), null, { timeout: 15000 }); await p.waitForTimeout(800);
    out.push('confidence saved: ' + JSON.stringify(await p.evaluate(() => window.APP.events.filter((e) => e.type === 'confidence')))); await p.close(); }

  // ---- 3. every pop-up and problem screen, opened from Settings → Oynalarni ko'rish ----
  if (want(3)) { const p = await page({ width: 430, height: 880 }), shot = shotOf(p), press = pressOf(p);
    await p.goto('http://127.0.0.1:8791/src/web/'); await learnReady(p); await openSettings(p, press);
    for (const name of ['feedback', 'offline', 'micBlocked', 'speech', 'error', 'notReady']) {
      await p.evaluate((n) => { window.__shown = window.APP.ctx.show(n); }, name); await p.waitForTimeout(1600); await shot('3-' + name);
      await p.mouse.click(215, 120); await p.waitForTimeout(300);                                                       // close what closes on a tap outside
      for (const sel of ['.st31a .btn', '.st31b .btn.primary', '.st31c .btn.primary', '.st31e .btn.primary', '.st31d .xclose', '.st31d .btn.primary']) if (await p.locator(sel).count()) { await press(sel).catch(() => {}); await p.waitForTimeout(400); }
      out.push(name + ': ' + (await Promise.race([p.evaluate(() => window.__shown.then(() => 'closed')), new Promise((r) => setTimeout(() => r('still open'), 3000))])));
    }
    await p.close(); }

  // ---- 4. a phone-sized window, and Reduce Motion ----
  if (want(4)) for (const [w, h, rm] of [[390, 844, false], [360, 740, true]]) {
    const p = await page({ width: w, height: h }, rm ? { reducedMotion: 'reduce' } : {}), shot = shotOf(p), press = pressOf(p);
    await p.goto('http://127.0.0.1:8791/src/web/'); await learnReady(p); await p.waitForTimeout(800); await shot(`4-learn-${w}x${h}${rm ? '-reduce' : ''}`);
    await press('.pathin [data-id="l2"]'); await p.waitForTimeout(900); await shot(`4-sheet-${w}x${h}`); await press('#shStart'); await p.waitForSelector('.scr.lesson .ex'); await p.waitForTimeout(1200); await shot(`4-lesson-${w}x${h}`);
    const r = await playThrough(p, 'l2', { shot, press }); out.push(`${w}x${h}${rm ? ' reduce motion' : ''}: l2 ${r.log.length} answers | ${r.stats} | M.reduce=${await p.evaluate(() => M.reduce)}`);
    await learnReady(p); await p.click('.tab[data-t="progress"]'); await p.waitForTimeout(1200); await shot(`4-progress-${w}x${h}`); await p.click('.tab[data-t="profile"]'); await p.waitForTimeout(1200); await shot(`4-profile-${w}x${h}`); await p.close(); }

  // ---- 5. deleting the account starts again from the Welcome screen ----
  if (want(5)) { const p = await page({ width: 430, height: 880 }), shot = shotOf(p), press = pressOf(p);
    await p.goto('http://127.0.0.1:8791/src/web/'); await learnReady(p); await openSettings(p, press);
    await press('.pg28 [data-a="delete"]'); await p.waitForTimeout(700); await shot('5-delete-dialog');
    await Promise.all([p.waitForNavigation(), press('.pgsheet [data-y]')]); await p.waitForFunction(() => window.APP && window.APP.ob === 'welcome', null, { timeout: 40000 }); await p.waitForTimeout(1200); await shot('5-welcome-after-delete');
    out.push('after delete: ' + JSON.stringify(await p.evaluate(async () => ({ events: window.APP.events.length, recordings: (await window.APP.ctx.rec.list()).length })))); await p.close(); }

  console.log(out.join('\n')); console.log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
