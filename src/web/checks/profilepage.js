// Pictures of the Profile tab on its own (profilepage.html): Profile with and without progress, Settings, its sheets and dialogs,
// Voice recordings with three made-up clips, deleting them; light and dark.   node profilepage.js   (pictures: shots-pf/)
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const OUT = path.join(__dirname, 'shots-pf'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(), errors = [];
  for (const dark of [false, true]) {
    const d = dark ? '-dark' : '';
    const open = async (q) => { const p = await b.newPage({ viewport: { width: 430, height: 880 } }); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await p.goto(`http://127.0.0.1:8791/src/web/checks/profilepage.html?${q}${dark ? '&dark=1' : ''}`); await p.waitForFunction(() => window.READY, null, { timeout: 30000 }); await p.waitForTimeout(1500); return p; };
    const shot = (p, n) => p.locator('#phone').screenshot({ path: path.join(OUT, n + d + '.png') });
    const tap = async (p, sel) => { const el = p.locator(sel).first(); await el.waitFor({ state: 'visible' }); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); };
    // Profile, empty
    let p = await open('x=1'); await shot(p, '27-empty'); await p.close();
    // Profile with progress, scrolled, the goal sheet
    p = await open('data=1&rec=1'); await shot(p, '27-top');
    await p.evaluate(() => { document.querySelector('.pf-scroll').scrollTop = 520; }); await p.waitForTimeout(900); await shot(p, '27-middle');
    await p.evaluate(() => { const s = document.querySelector('.pf-scroll'); s.scrollTop = s.scrollHeight; }); await p.waitForTimeout(3200); await shot(p, '27-bottom');
    await p.evaluate(() => { document.querySelector('.pf-scroll').scrollTop = 0; }); await p.waitForTimeout(500);
    await p.click('.pf-goal'); await p.waitForTimeout(700); await shot(p, '27-goal-sheet'); await tap(p, '.pf-opt[data-g="work"]'); await p.waitForTimeout(900); await shot(p, '27-goal-changed');
    // Settings
    await tap(p, '[data-a="gear"]'); await p.waitForTimeout(600); await shot(p, '28-settings');
    await p.click('.pg28 .toggle[data-k="sound"]'); await p.waitForTimeout(90); await shot(p, '28-toggle-moving'); await p.waitForTimeout(300);
    await p.evaluate(() => { document.querySelector('.pg28 .pf-body').scrollTop = 999; }); await p.waitForTimeout(300); await shot(p, '28-settings-test');
    await p.click('[data-d="14"]'); await p.waitForTimeout(250); await p.click('.pg28 .seg button[data-v="us"]'); await p.waitForTimeout(300); await shot(p, '28-test-used');
    await p.evaluate(() => { document.querySelector('.pg28 .pf-body').scrollTop = 0; }); await p.waitForTimeout(200);
    await p.click('[data-a="reminder"]'); await p.waitForTimeout(700); await shot(p, '28-reminder-sheet');
    await p.mouse.move(215, 480); await p.mouse.down(); await p.mouse.move(215, 430, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(1200); await tap(p, '[data-save]'); await p.waitForTimeout(900); await shot(p, '28-reminder-saved');
    await p.click('[data-a="logout"]'); await p.waitForTimeout(500); await shot(p, '28-logout-dialog'); await tap(p, '.dialog [data-n]'); await p.waitForTimeout(400);
    await p.evaluate(() => { document.querySelector('.pg28 .pf-body').scrollTop = 999; }); await p.waitForTimeout(200);
    await p.click('[data-a="windows"]'); await p.waitForTimeout(600); await shot(p, '28-windows-sheet'); await p.click('[data-w="speech"]'); await p.waitForTimeout(500);
    await p.evaluate(() => { document.querySelector('.pg28 .pf-body').scrollTop = 0; }); await p.waitForTimeout(200);
    // Voice recordings
    await p.click('[data-a="voice"]'); await p.waitForTimeout(900); await shot(p, '28b-recordings');
    await p.click('.pf-vrow .play'); await p.waitForTimeout(250); await shot(p, '28b-playing'); await p.waitForTimeout(900);
    await p.click('.pf-vrow:nth-child(2) .del'); await p.waitForTimeout(500); await shot(p, '28b-one-deleted');
    await tap(p, '[data-all]'); await p.waitForTimeout(500); await shot(p, '28b-delete-dialog'); await tap(p, '.dialog [data-y]'); await p.waitForTimeout(160); await shot(p, '28b-folding'); await p.waitForTimeout(900); await shot(p, '28b-empty');
    await p.click('.pg28b .toggle'); await p.waitForTimeout(400); await shot(p, '28b-saving-off');
    await p.click('.pg28b .back'); await p.waitForTimeout(500); await p.click('.pg28 .back'); await p.waitForTimeout(500); await shot(p, '27-after-settings');
    console.log(dark ? 'dark' : 'light', 'calls:', (await p.evaluate(() => window.CALLS)).join(' | '));
    console.log('saved clips left:', await p.evaluate(async () => (await import('/src/web/record.js')).Rec.list().then((l) => l.length)));
    await p.close();
  }
  console.log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
