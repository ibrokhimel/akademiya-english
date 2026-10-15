// node check-sync.js [case ...]  -> captures/sync-<case>.png + a table of what sounded when   (SYNC_FROM=ms and SYNC_N=frames choose which part the strip shows)
// Checks that a sound's loud moment and the picture's beat are the same instant. It records each moment as a video with a level
// bar in the corner (SND.meter), then check-sync.py reads the bar frame by frame and lays the frames out as a strip to look at.
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const side = (k, v) => `[data-${k}="${v}"]`, ctl = (d, a) => `#${d} .ctl [data-a="${a}"]`;
// name: [page, what to crop to, what to click, how long to record (ms), an earlier click if the moment needs one]
const CASES = {
  right: ['lesson.html', '#dAnswer', '#dAnswer .tile:nth-of-type(2)', 900, null, '#dAnswer .check'],
  combo: ['lesson.html', '#dPhone .phonewrap', ctl('dPhone', 'combo'), 1400],
  micon: ['lesson.html', '#dMic', ctl('dMic', 'say'), 900],
  finish: ['nav.html', '.phonewrap', side('a', 'finish'), 2200, side('a', 'today')],
  cansay: ['screens.html', '.phonewrap', side('s', 'cansay'), 2000],
  result: ['screens.html', '.phonewrap', side('s', 'result'), 2600],
  perfect: ['screens.html', '.phonewrap', side('s', 'perfect'), 3200],
  trophy: ['screens.html', '.phonewrap', side('s', 'trophy'), 2600],
  level: ['screens.html', '.phonewrap', side('s', 'level'), 2000],
  streak: ['progress.html', '#dStreak', ctl('dStreak', 'done'), 1600],
  freeze: ['progress.html', '#dStreak', ctl('dStreak', 'freeze'), 2000],
  phrase: ['progress.html', '#dPhrases', ctl('dPhrases', 'new'), 1500],
  streak19: ['lessonmoments.html', '.phonewrap', side('s', 'streak'), 2200],
  award: ['profile.html', '.phonewrap', side('a', 'award'), 2600],
};
(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CASES);
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-')), OUT = path.join(__dirname, 'captures'); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const name of names) {
    const [pageName, crop, click, ms, before, then] = CASES[name];
    const c = await b.newContext({ viewport: { width: 1240, height: 800 }, recordVideo: { dir: TMP, size: { width: 1240, height: 800 } } }), p = await c.newPage();
    await p.goto(`http://127.0.0.1:8791/design/motion/${pageName}`); await p.mouse.click(4, 30);
    await p.waitForFunction(() => window.labReady, null, { timeout: 15000 }); await p.evaluate(() => SND.ready); await p.waitForTimeout(2700);
    const el = await p.$(crop); await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    if (before) { await p.click(before); await p.waitForTimeout(600); }
    await p.evaluate(() => { SND.log.length = 0; SND.meter(); }); await p.waitForTimeout(300);
    await p.click(click); if (then) { await p.waitForTimeout(250); await p.evaluate(() => { SND.log.length = 0; }); await p.click(then); }
    await p.waitForTimeout(ms);
    const box = await el.boundingBox(), log = await p.evaluate(() => SND.log.map((e) => ({ name: e.name, t: e.t, skipped: e.skipped, hit: (SND.meta[e.name] || {}).hit || 0 })));
    await c.close(); const video = await p.video().path();
    const job = path.join(TMP, name + '.json'); fs.writeFileSync(job, JSON.stringify({ name, video, box, log, out: path.join(OUT, `sync-${name}.png`) }));
    process.stdout.write(execFileSync('python', ['-I', path.join(__dirname, 'check-sync.py'), job], { encoding: 'utf8' }));
  }
  await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
