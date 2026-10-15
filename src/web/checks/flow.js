// The whole first run in a real browser, the way a new learner meets it: onboarding (1 → 9), Lesson 1, the account (10), the Learn page,
// the Progress tab with its two pages, the Profile tab, Settings, voice recordings, then a reload in the middle of a lesson.
//   node flow.js [--dark] [--login]      (SHOTS=folder; pictures of every step)      --login: Welcome → KIRISH → no such account → start fresh
// Needs the lab's server: node design/motion/serve.js
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright'); const { playThrough } = require('./drive.js');
const has = (f) => process.argv.includes(f), dark = has('--dark'), OUT = path.join(__dirname, process.env.SHOTS || 'shots-flow'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 430, height: 880 } }), errors = [];
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript((dark) => { window.APP_TEST = { say: [], else: true, clips: true }; if (sessionStorage.getItem('started')) return; sessionStorage.setItem('started', 1); localStorage.clear(); if (dark) localStorage.setItem('akademiya.dark', 'true'); }, dark);
  let n = 0; const shot = async (name) => p.locator('#phone').screenshot({ path: path.join(OUT, `${String(++n).padStart(2, '0')}-${name}${dark ? '-dark' : ''}.png`) });
  const press = async (sel) => { const el = p.locator(sel).first(); await el.waitFor({ state: 'visible', timeout: 15000 }); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); };
  const screenIs = (s) => p.waitForFunction((s) => window.APP && window.APP.ob === s, s, { timeout: 15000 });
  const step = async (s, ms = 1300) => { await screenIs(s); await p.waitForTimeout(ms); await shot('ob-' + s); };
  const log = (...a) => console.log(...a);
  await p.goto('http://127.0.0.1:8791/src/web/'); await p.waitForFunction(() => window.APP && window.APP.ready, null, { timeout: 40000 });

  // ---- onboarding ----
  await step('welcome', 1600);
  if (has('--login')) { await press('.obscr[data-s="welcome"] [data-go="login"]'); await step('login'); await press('.obscr[data-s="login"] .signin[data-m="google"]'); await p.waitForTimeout(900); await shot('ob-login-no-account');
    await press('#fresh'); }
  else await press('.obscr[data-s="welcome"] .btn.primary');
  await step('meet', 2000); await press('.obscr[data-s="meet"] .btn');
  await step('goal'); await press('.obscr[data-s="goal"] .gopt[data-k="travel"]'); await p.waitForTimeout(400); await shot('ob-goal-picked'); await press('.obscr[data-s="goal"] .obbot .btn');
  await step('level'); await press('.obscr[data-s="level"] .gopt[data-k="new"]'); await p.waitForTimeout(300); await press('.obscr[data-s="level"] .obbot .btn');
  await step('achieve', 2200); await press('.obscr[data-s="achieve"] .obbot .btn');
  await step('confidence'); await press('.obscr[data-s="confidence"] .gopt >> nth=1'); await p.waitForTimeout(300); await press('.obscr[data-s="confidence"] .obbot .btn');
  await step('mic'); await press('#micOn');
  await step('listen', 400); await step('heard', 1400); await press('.obscr[data-s="heard"] .obbot .btn');
  await step('promise', 1500); await press('#keep');
  await step('reminder'); await press('#remOn');
  // ---- Lesson 1 inside onboarding ----
  await p.waitForSelector('.scr.lesson .ex', { timeout: 20000 }); await p.waitForTimeout(800); await shot('lesson1-first-item');
  const l1 = await playThrough(p, 'l1', { pics: false, shot, press }); log('l1 inside onboarding:', l1.log.length, 'answers |', l1.stats);
  // ---- 10: the name and the account ----
  await screenIs('name'); await p.waitForTimeout(1200); await p.fill('.namefield', 'Ibrokhim'); await p.press('.namefield', 'Enter'); await p.waitForTimeout(600); await shot('ob-name');
  await press('.obscr[data-s="name"] .signin[data-m="google"]');
  await p.waitForFunction(() => window.APP.learn && window.APP.learn.ready(), null, { timeout: 30000 }); await p.waitForTimeout(800); await shot('learn-after-first-run');
  log('saved:', JSON.stringify(await p.evaluate(() => ({ events: window.APP.events.map((e) => e.type + (e.id ? ':' + e.id : '')), name: window.APP.ctx.settings.name, goal: window.APP.ctx.settings.goal, reminder: window.APP.ctx.settings.reminder, saveVoice: window.APP.ctx.settings.saveVoice }))));
  log('recordings:', JSON.stringify(await p.evaluate(async () => (await window.APP.ctx.rec.list()).map((r) => r.phraseId))));

  // ---- Progress tab: 24, then 25 and 26 ----
  await p.click('.tab[data-t="progress"]'); await p.waitForTimeout(1500); await shot('progress-24');
  await press('.pg24 .all'); await p.waitForTimeout(1200); await shot('progress-25');
  await press('.pg25 .back'); await p.waitForTimeout(700);
  await press('.pg24 .scard'); await p.waitForTimeout(1500); await shot('progress-26');
  await press('.pg26 .x'); await p.waitForTimeout(700);
  // ---- Profile tab, Settings, recordings ----
  await p.click('.tab[data-t="profile"]'); await p.waitForTimeout(1600); await shot('profile-27');
  await press('.pg27 [data-a="gear"]'); await p.waitForTimeout(1200); await shot('settings-28');
  await press('.pg28 [data-a="voice"]'); await p.waitForTimeout(1200); await shot('recordings-28b');
  await press('.pg28b .back'); await p.waitForTimeout(600);
  await press('.pg28 .back'); await p.waitForTimeout(600);
  await p.click('.tab[data-t="learn"]'); await p.waitForTimeout(600);

  // ---- a reload in the middle of Lesson 2 comes back to the same item ----
  await press('.pathin [data-id="l2"]'); await p.waitForTimeout(900); await press('#shStart'); await p.waitForSelector('.scr.lesson .ex');
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { window.APP_TEST.say = [true]; }); await p.waitForFunction(() => document.querySelector('.ex .mic .halo') && document.querySelector('.ex .mic .halo').getAnimations().length > 0, null, { timeout: 30000 });
    await press('.ex .mic .p3d'); await p.waitForFunction(() => document.querySelector('.sheet.correct')._up, null, { timeout: 20000 }); await p.waitForTimeout(600); await press('.sheet.correct .next'); await p.waitForTimeout(900); }
  const before = await p.evaluate(() => ({ n: window.APP.now.n, saved: JSON.parse(localStorage.getItem('akademiya.inLesson')) }));
  await p.reload(); await p.waitForFunction(() => window.APP && window.APP.ready && window.APP.now, null, { timeout: 40000 }); await p.waitForTimeout(1500); await shot('after-reload');
  const after = await p.evaluate(() => ({ n: window.APP.now.n, lesson: !!document.querySelector('.scr.lesson'), bar: document.querySelector('.progress .fill').style.width }));
  log('reload in a lesson: item before', before.n + 1, 'answers saved', before.saved && before.saved.ops.join(''), '→ after reload item', after.n + 1, 'lesson on screen', after.lesson, 'bar', after.bar);
  log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
