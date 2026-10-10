// Drives every interaction on play.html with a real mouse and screenshots the screen. -> captures/playtest-sheet.png
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname, T = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.png': 'image/png' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise(r => { server.once('error', () => r()); server.listen(8790, '127.0.0.1', r); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1040, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:8790/play.html'); await p.waitForFunction(() => window.playReady); await p.waitForTimeout(3800);
  const scr = await p.$('#screen'), box = await scr.boundingBox(), shots = [], notes = [];
  const shot = async (label) => { const f = path.join(ROOT, 'captures', `playtest-${shots.length}.png`); await scr.screenshot({ path: f }); shots.push([f, label]); };
  const st = () => p.evaluate(() => ({ ...window.playState, mic: null }));
  const body = async () => { const s = await st(); return { x: box.x + s.x, y: box.y + s.y - 86 }; };
  const at = (x, y) => ({ x: box.x + x, y: box.y + y });
  const wait = (ms) => p.waitForTimeout(ms);
  const idle = async (max = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if ((await st()).mode === 'idle') return true; await wait(120); } notes.push('not idle after ' + max + ' ms: ' + (await st()).mode); return false; };
  const glide = async (to, steps, stepMs) => { const from = await p.evaluate(() => window.__m || null); for (let i = 1; i <= steps; i++) { await p.mouse.move(to.x0 + (to.x - to.x0) * i / steps, to.y0 + (to.y - to.y0) * i / steps); await wait(stepMs); } };
  const pick = async () => { const c = await body(); await p.mouse.move(c.x, c.y); await p.mouse.down(); await wait(430); return c; };
  const carry = async (c, x, y, steps = 14, ms = 22) => { const t = at(x, y); await glide({ x0: c.x, y0: c.y, x: t.x, y: t.y }, steps, ms); return t; };
  const log = () => p.$eval('#log', e => e.textContent);
  const expect = async (name, cond) => { if (!cond) notes.push('FAIL ' + name); };

  await shot('start');
  // 1. hold -> hop on -> carried -> shaken -> dropped -> walks home
  let c = await pick(); await shot('hold: hop on'); await expect('held', (await st()).mode === 'held');
  let t = await carry(c, 200, 300); await shot('carried (moving)'); await wait(350); await shot('carried (settled)');
  for (let i = 0; i < 9; i++) { await p.mouse.move(t.x + (i % 2 ? -95 : 95), t.y, { steps: 3 }); await wait(34); }
  await p.mouse.move(t.x, t.y); await wait(260); await shot('shaken: dizzy'); await expect('dizzy fired', /dizzy/.test(await log())); await wait(1700);
  await p.mouse.up(); await wait(140); await shot('dropped: falling'); await wait(330); await shot('landed (squash)'); await wait(700); await shot('shakes it off'); await wait(600); await shot('walking home'); await idle(); await shot('home again');
  // 2. fling
  c = await pick(); t = await carry(c, 150, 330, 10, 20); await wait(150);
  for (let i = 1; i <= 5; i++) { await p.mouse.move(t.x + i * 34, t.y - i * 16); await wait(12); }
  await p.mouse.up(); await wait(130); await shot('thrown: tumbling'); await wait(260); await shot('tumbling 2'); await expect('flying', ['flying', 'recover'].includes((await st()).mode));
  await wait(1500); await shot('landed on his feet'); await wait(650); await shot('smug blink'); await idle();
  // 3. drop zones
  c = await pick(); t = await carry(c, 135, 150); await wait(250); await p.mouse.up(); await wait(1300); await shot('dropped on the card: peeks'); await expect('perch peek', (await st()).perch === 'peek');
  c = await pick(); t = await carry(c, 300, 470); await wait(250); await p.mouse.up(); await wait(1500); await shot('by the flame: warms hands'); await expect('perch warm', (await st()).perch === 'warm');
  c = await pick(); t = await carry(c, 170, 500); await wait(200); await p.mouse.up(); await idle();
  // 4. poke escalation
  for (const n of [1, 2, 3, 4]) { c = await body(); await p.mouse.click(c.x, c.y); await wait(n === 3 ? 260 : 220); await shot('poke ' + n + (n === 4 ? ': turns his back' : '')); await wait(520); }
  await expect('back', (await st()).mode === 'back'); await wait(3100); await idle(); await shot('turned round again');
  // 5. double-tap tricks (three, never the same twice in a row)
  const seen = [];
  for (let i = 0; i < 3; i++) { c = await body(); await p.mouse.click(c.x, c.y); await wait(110); await p.mouse.click(c.x, c.y); await wait(330); seen.push((await log()).replace('double-tap: ', '')); await shot('double-tap: ' + seen[i]); await wait(2000); }
  await expect('tricks differ', seen[0] !== seen[1] && seen[1] !== seen[2]); await wait(4200);
  // 6. rub / pet
  c = await body(); await p.mouse.move(c.x - 20, c.y); await p.mouse.down(); for (let i = 0; i < 12; i++) { await p.mouse.move(c.x + (i % 2 ? -24 : 24), c.y + 4, { steps: 2 }); await wait(60); }
  await shot('rubbed: tolerates it'); await p.mouse.up(); await wait(260); await shot('"that was nothing"'); await wait(900);
  // 7. feed a word
  const chip = await (await p.$('.chip[data-w="coffee"]')).boundingBox(); c = await body();
  await p.mouse.move(chip.x + 20, chip.y + 14); await p.mouse.down(); await p.mouse.move(c.x, c.y - 60, { steps: 12 }); await shot('dragging a word'); await p.mouse.move(c.x, c.y, { steps: 4 }); await p.mouse.up();
  await wait(170); await shot('eats it (open)'); await wait(520); await shot('chewing'); await wait(600); await shot('the word shows on him'); await wait(1900);
  // 8. pinch (mouse wheel)
  c = await body(); await p.mouse.move(c.x, c.y); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 90); await wait(30); } await shot('pinched: stretched'); await wait(330); await shot('snaps back'); await wait(700);
  // 9. tilt
  await p.evaluate(() => { const e = document.getElementById('tilt'); e.value = 38; e.oninput(); }); await wait(1000); await shot('phone tilted: slides + leans');
  await p.evaluate(() => { const e = document.getElementById('tilt'); e.value = 0; e.oninput(); }); await idle();
  // 10. shake the phone
  await p.click('#bShake'); await wait(260); await shot('phone shaken: bouncing'); await wait(600); await shot('bouncing 2'); const sh = Date.now(); while (Date.now() - sh < 6000 && (await st()).mode === 'flying') await wait(80);
  await wait(900); await shot('annoyed look'); await idle();
  // 11. blow
  const bb = await (await p.$('#bBlow')).boundingBox(); await p.mouse.move(bb.x + 20, bb.y + 12); await p.mouse.down(); await wait(600); await shot('blown at: leans back'); await p.mouse.up(); await wait(500);
  // 12. sleep -> wake
  await p.click('#bSleep'); await wait(1500); await shot('asleep'); c = await body(); await p.mouse.click(c.x, c.y); await wait(420); await shot('wakes: one eye first'); await wait(1500); await shot('awake'); await idle();
  // 13. high-five: tapped, then ignored
  await p.click('#bCorrect'); await wait(2000); await shot('hand up for a high-five'); const s1 = await st(); await p.mouse.click(box.x + s1.x - 117 + 185, box.y + s1.y - 180 + 66); await wait(120); await shot('high-five!'); await expect('clap', /high-five/.test(await log())); await wait(1400);
  await p.click('#bCorrect'); await wait(4350); await shot('ignored: plays it off'); await expect('playoff', /plays it off/.test(await log())); await wait(1500);
  // 14. hide & peek
  c = await pick(); t = await carry(c, -70, 300, 12, 20); await wait(150); await p.mouse.up(); await wait(1500); await shot('dragged off: peeks back in'); await wait(900); await shot('hops back in'); await idle(12000);
  // 15. where can he be touched? all three options
  const hold = async () => { const c2 = await body(); await p.mouse.move(c2.x, c2.y); await p.mouse.down(); await wait(480); const m = (await st()).mode; await p.mouse.up(); await wait(250); return m; };
  const tapHim = async () => { const c2 = await body(); await p.mouse.click(c2.x, c2.y); await wait(260); return log(); };
  // A: home only
  await p.selectOption('#policy', 'home'); // start from A (the page now opens on the chosen option B)
  await p.click('#tabLesson'); await wait(300); await expect('A lesson: hold does nothing', (await hold()) === 'idle'); await expect('A lesson: tap does nothing', !/poke/.test(await tapHim())); await shot('A · lesson: locked');
  await p.click('#tabHome'); await wait(300); await expect('A home: hold carries', (await hold()) === 'held'); await idle();
  // B: everywhere, carrying locked during an exercise
  await p.selectOption('#policy', 'everywhere'); await p.click('#tabLesson'); await wait(300);
  await expect('B lesson: hold does not carry', (await hold()) !== 'held'); await wait(700); await expect('B lesson: tap pokes', /poke/.test(await tapHim())); await shot('B · lesson: taps work, no carry'); await wait(900);
  // C: dedicated Dombi screen
  await p.selectOption('#policy', 'dombi'); await p.click('#tabHome'); await wait(300); await expect('C home: hold does not carry', (await hold()) !== 'held'); await wait(400);
  await tapHim(); await wait(300); await expect('C home: tap opens the Dombi screen', (await st()).screen === 'dombi'); await shot('C · tap on Home opens his screen');
  await expect('C dombi screen: hold carries', (await hold()) === 'held'); await idle(); await p.click('#tabLesson'); await wait(300); await expect('C lesson: locked', (await hold()) === 'idle'); await shot('C · lesson: locked');
  await p.selectOption('#policy', 'everywhere'); await p.click('#tabHome');

  fs.writeFileSync(path.join(ROOT, 'captures', 'playtest.json'), JSON.stringify(shots));
  console.log('shots', shots.length, '· page errors:', errs.length ? errs.join(' | ') : 'none', '· checks:', notes.length ? notes.join(' ; ') : 'all passed');
  await b.close(); if (server.listening) server.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
