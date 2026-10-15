// Checks the motion lab in a real browser: page errors, then screenshots of each demo at chosen moments.
//   node check.js [dark]      -> captures/<name>.png   (the server must be running: node serve.js)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const OUT = path.join(__dirname, 'captures'); fs.mkdirSync(OUT, { recursive: true });
const dark = process.argv[2] === 'dark', tag = dark ? '-dark' : '';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1240, height: 900 } });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('http://127.0.0.1:8791/design/motion/lesson.html'); await p.waitForFunction(() => window.labReady, null, { timeout: 15000 });
  await p.waitForTimeout(2600);                                   // the Rive start-up logo
  if (dark) await p.click('#tDark');
  await p.mouse.click(4, 4);                                      // a first tap, so the browser allows sound
  const shot = async (id, name) => { await (await p.$('#' + id)).screenshot({ path: path.join(OUT, `${name}${tag}.png`) }); await p.evaluate((n) => SND.log.push({ name: `[${n}]` }), name); };
  const act = (id, a) => p.click(`#${id} .ctl [data-a="${a}"]`);
  const press = async (sel) => { const el = await p.$(sel); await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); };

  await shot('dMain', 'main-0-grey'); await act('dMain', 'ready'); await p.waitForTimeout(420); await shot('dMain', 'main-1-shine');
  await p.hover('#mainBtn'); await p.mouse.down(); await p.waitForTimeout(120); await shot('dMain', 'main-2-pressed'); await p.mouse.up();
  await shot('dFamily', 'family');

  for (const [id, wrong, right] of [['dAnswer', 0, 1], ['dPicture', 0, 1]]) {
    await press(`#${id} .tile:nth-of-type(${right + 1})`); await p.waitForTimeout(300); await shot(id, `${id}-1-picked`);
    await press(`#${id} .check`); await p.waitForTimeout(140); await shot(id, `${id}-2-right`);
    await p.waitForTimeout(900); await act(id, 'reset'); await p.waitForTimeout(200);
    await press(`#${id} .tile:nth-of-type(${wrong + 1})`); await p.waitForTimeout(200); await press(`#${id} .check`); await p.waitForTimeout(160); await shot(id, `${id}-3-wrong`);
  }
  // tile builder: An orange juice, please.
  const word = async (w) => { const els = await p.$$('#bBank .word:not(.used)'); for (const e of els) if ((await e.textContent()) === w) { await e.evaluate((x) => x.scrollIntoView({ block: 'center' })); const r = await e.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); return; } };
  await word('An'); await p.waitForTimeout(130); await shot('dBuilder', 'builder-1-flying'); await p.waitForTimeout(350);
  for (const w of ['orange', 'juice,', 'please.']) { await word(w); await p.waitForTimeout(380); }
  await shot('dBuilder', 'builder-2-placed'); await press('#dBuilder .check'); await p.waitForTimeout(150); await shot('dBuilder', 'builder-3-wave'); await p.waitForTimeout(500); await shot('dBuilder', 'builder-4-right');

  await press('#mSent .mword:nth-child(1)'); await p.waitForTimeout(250); await shot('dMistake', 'mistake-1-picked');
  await press('#dMistake .check'); await p.waitForTimeout(260); await shot('dMistake', 'mistake-2-strike'); await p.waitForTimeout(900); await shot('dMistake', 'mistake-3-fixed');
  await shot('dGap', 'gap-0-start'); await press('#gSent .gap:nth-of-type(2)'); await p.waitForTimeout(300); await shot('dGap', 'gap-1-picked');
  await press('#dGap .check'); await p.waitForTimeout(700); await shot('dGap', 'gap-2-right');

  for (let i = 0; i < 3; i++) { await act('dBar', 'right'); await p.waitForTimeout(i === 2 ? 180 : 420); }
  await shot('dBar', 'bar-1-growing'); await p.waitForTimeout(600); await act('dBar', 'right'); await p.waitForTimeout(400); await act('dBar', 'right'); await p.waitForTimeout(330); await shot('dBar', 'bar-2-gold');
  await act('dSheet', 'ok'); await p.waitForTimeout(150); await shot('dSheet', 'sheet-1-rising'); await p.waitForTimeout(400); await shot('dSheet', 'sheet-2-ok');
  await act('dSheet', 'no'); await p.waitForTimeout(520); await shot('dSheet', 'sheet-3-answer');
  await act('dToast', 'toast'); await act('dToast', 'tip'); await p.waitForTimeout(450); await shot('dToast', 'toast');

  await shot('dMic', 'mic-0-idle'); await act('dMic', 'say'); await p.waitForTimeout(700); await shot('dMic', 'mic-1-listening');
  await p.waitForTimeout(1100); await shot('dMic', 'mic-2-thinking'); await p.waitForTimeout(700); await shot('dMic', 'mic-3-heard-draw'); await p.waitForTimeout(1100); await shot('dMic', 'mic-4-heard');
  await press('#dAudio .audio.big'); await p.waitForTimeout(400); await shot('dAudio', 'audio-playing');

  await shot('dPhone', 'phone-0'); await press('#phone .tile:nth-of-type(2)'); await p.waitForTimeout(250); await press('#phone .check'); await p.waitForTimeout(170); await shot('dPhone', 'phone-1-right');
  await p.waitForTimeout(600); await shot('dPhone', 'phone-2-sheet'); await press('#phone .sheet.correct .next'); await p.waitForTimeout(650); await shot('dPhone', 'phone-3-combo'); await p.waitForTimeout(1200); await shot('dPhone', 'phone-3-sliding');
  await p.waitForTimeout(600); await press('#phone .tile:nth-of-type(1)'); await p.waitForTimeout(200); await press('#phone .check'); await p.waitForTimeout(800); await shot('dPhone', 'phone-4-wrong');
  console.log('sounds: ' + await p.evaluate(() => SND.log.map((e) => (e.skipped ? '~' : '') + e.name + (e.step ? '+' + e.step : '') + (e.n > 1 ? 'x' + e.n : '') + (e.skipped ? '(' + e.skipped + ')' : '')).join(' ')));
  await b.close();
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
