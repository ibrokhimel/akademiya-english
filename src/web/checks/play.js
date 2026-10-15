// Plays lessons in a real browser, the way a learner would, and saves a picture of every step.
//   node play.js [lesson ids...] [--dark] [--miss 3,7] [--off] [--shots] [--all] [--keep]
//     l6 c2 ...      which lessons to play (default l6)        --miss 3,7   answer items 3 and 7 wrongly the first time
//     --off          play with speaking turned off              --shots      a picture of every item (default: only the first lesson's)
//     --done l1,l2   count these as finished yesterday before starting
//     --all          every lesson open (else they are played in the order the path opens them)   --keep  do not clear what was saved
// Speaking is made up here: the page is told what "was heard" (window.APP_TEST), because a headless browser has no speech recogniser.
// Pictures go to src/web/checks/shots/ (not kept in git). Needs the lab's server: node design/motion/serve.js
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const { playThrough } = require('./drive.js');
const args = process.argv.slice(2), has = (f) => args.includes(f), val = (f) => { const i = args.indexOf(f); return i < 0 ? '' : args[i + 1]; };
const lessons = args.filter((a, i) => /^[lc]\d+$/.test(a) && !['--miss', '--done'].includes(args[i - 1])), miss = new Set(val('--miss').split(',').filter(Boolean).map(Number));
const OUT = path.join(__dirname, process.env.SHOTS || 'shots'); fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 430, height: 880 } }), errors = [];
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(({ dark, off, all, keep, seed }) => { window.APP_TEST = { say: [], else: true, clips: true }; try { if (!keep && !sessionStorage.getItem('kept')) localStorage.clear(); sessionStorage.setItem('kept', '1'); if (all) localStorage.setItem('akademiya.openAll', 'true'); if (!keep) { const y = new Date(Date.now() - 864e5).toISOString(); localStorage.setItem('akademiya.events', JSON.stringify([{ type: 'onboarding', at: y, goal: 'travel', level: 'new', confidence: 2, micOk: true, saveVoice: true, reminder: '19:00' }, ...seed.map((id) => ({ type: 'lesson', id, at: y, accuracy: 100, mistakes: 0, spokenMs: 5000, skipped: 0 }))])); localStorage.setItem('akademiya.saveVoice', 'true'); } if (dark) localStorage.setItem('akademiya.dark', 'true'); if (off) localStorage.setItem('akademiya.speaking', 'false'); } catch (e) {} }, { dark: has('--dark'), off: has('--off'), all: has('--all'), keep: has('--keep'), seed: val('--done').split(',').filter(Boolean) });
  await p.goto('http://127.0.0.1:8791/src/web/'); await p.waitForFunction(() => window.APP && window.APP.ready, null, { timeout: 30000 }); await p.waitForTimeout(1500);
  const shot = (name) => p.locator('#phone').screenshot({ path: path.join(OUT, name + (has('--dark') ? '-dark' : '') + '.png') });
  const press = async (sel) => { const el = p.locator(sel).first(); await el.waitFor({ state: 'visible', timeout: 15000 }); await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); };
  await shot('home');
  for (const [k, id] of (lessons.length ? lessons : ['l6']).entries()) {
    const pics = k === 0 || has('--shots'); await p.waitForFunction(() => window.APP.learn && window.APP.learn.ready(), null, { timeout: 30000 });
    await press(`.pathin [data-id="${id}"]`); await p.waitForTimeout(900); if (pics) await shot(`${id}-start-sheet`); await press(id[0] === 'c' ? '#cpStart' : '#shStart'); await p.waitForSelector('.scr.lesson .ex');
    const { log, stats } = await playThrough(p, id, { miss, pics, shot, press });
    await p.waitForTimeout(600); if (pics) await shot(`${id}-learn-during`); await p.waitForFunction(() => window.APP.learn.ready(), null, { timeout: 30000 }); await p.waitForTimeout(500); if (pics) await shot(`${id}-learn-after`); console.log(`${id}: ${log.length} answers | ${stats}\n  ` + log.join('\n  '));
  }
  await shot('home-after'); console.log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
