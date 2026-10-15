// node check-haptic.js  -> one line for each test of the taps in the hand, and captures/hap-marker.png (the server must be running)
// A PC cannot feel a tap, so the tests read HAP.log (every tap given: kind, what for, when) beside SND.log (every sound's moment).
const path = require('path'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), OUT = path.join(__dirname, 'captures'), errors = []; let bad = 0;
  const say = (ok, what, detail) => { if (!ok) bad++; console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? '   ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };
  async function open(url) {
    const p = await b.newPage({ viewport: { width: 1240, height: 900 } }); p.on('pageerror', (e) => errors.push(url + ': ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(url + ': ' + m.text()); });
    await p.goto('http://127.0.0.1:8791/design/motion/' + url); await p.mouse.click(4, 4); await p.waitForFunction(() => window.labReady, null, { timeout: 15000 }); await p.evaluate(() => SND.ready); await p.waitForTimeout(2700);
    const centre = async (sel) => { const el = await p.$(sel); if (!el) throw new Error('not found: ' + sel); await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); const r = await el.boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
    return { p, centre,
      press: async (sel) => { const [x, y] = await centre(sel); await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); },
      click: async (sel) => { const [x, y] = await centre(sel); await p.mouse.click(x, y); },
      clear: () => p.evaluate(() => { SND.log.length = 0; HAP.log.length = 0; }),
      taps: () => p.evaluate(() => HAP.log.map((e) => ({ ...e }))), sounds: () => p.evaluate(() => SND.log.map((e) => ({ ...e }))),
      wait: (ms) => p.waitForTimeout(ms) };
  }
  const kinds = (taps) => taps.map((t) => t.kind + (t.name ? ':' + t.name : '')).join(' ');
  const STRONG = ['light', 'medium', 'success', 'heavy'];                                      // anything above a soft tap

  // ---------- the controls page: buttons, the typed answer, switches, the time wheel, the two switches in the tool bar ----------
  { const t = await open('controls.html'), { p } = t;
    say(await p.evaluate(() => !!document.querySelector('#tSound + #tTaps')), 'the Taps switch sits next to Sound');
    await t.clear(); await t.click('#dField .ctl [data-a="right"]'); await t.wait(900); await t.clear(); await t.press('#dField .check'); await t.wait(400); let taps = await t.taps();
    say(taps.length === 2 && taps[0].kind === 'light' && taps[0].name === 'button' && taps[1].kind === 'success' && taps[1].name === 'right', 'a button press gives light, the right answer gives success', kinds(taps));
    await t.click('#dField .ctl [data-a="wrong"]'); await t.wait(900); await t.clear(); await t.press('#dField .check'); await t.wait(500); taps = await t.taps();
    const after = taps.filter((x) => x.name !== 'button');
    say(after.length === 1 && after[0].kind === 'soft' && after[0].name === 'not-right', 'a mistake gives one soft tap and nothing stronger', kinds(taps));
    await t.clear(); await t.click('#dToggle .setrow:nth-child(2) .toggle'); await t.wait(300); await t.click('#seg button:nth-of-type(3)'); await t.wait(300); taps = await t.taps();
    say(taps.some((x) => x.kind === 'light' && /^switch-/.test(x.name)) && taps.some((x) => x.kind === 'selection' && x.name === 'seg'), 'a toggle gives light, the two-option control gives selection', kinds(taps));
    // the wheel: a slow drag over three steps, held still, let go
    const [x, y] = await t.centre('#wheel'); await t.clear(); await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 60; i++) { await p.mouse.move(x, y + 132 * i / 60); await p.waitForTimeout(10); } await p.waitForTimeout(250); await p.mouse.up(); await t.wait(600);
    const ticks = (await t.sounds()).filter((e) => e.name === 'tick').reduce((a, e) => a + (e.n || 1), 0); taps = await t.taps();
    say(ticks === 3 && taps.length === 3 && taps.every((x) => x.kind === 'selection' && x.name === 'tick'), 'the time wheel gives one selection for each step', `${ticks} ticks · ${kinds(taps)}`);
    // Sound off: the taps still come
    await t.click('#tSound'); await t.click('#dField .ctl [data-a="right"]'); await t.wait(900); await t.clear(); await t.press('#dField .check'); await t.wait(400); taps = await t.taps();
    say(await p.evaluate(() => document.querySelector('#tSound').getAttribute('aria-pressed') === 'false') && taps.length === 2 && taps[1].kind === 'success', 'with Sound off the taps are still given', kinds(taps));
    await t.click('#tSound');
    // Taps off: none, though the sounds play
    await t.click('#tTaps'); await t.click('#dField .ctl [data-a="right"]'); await t.wait(900); await t.clear(); await t.press('#dField .check'); await t.wait(400); taps = await t.taps(); const snd = await t.sounds();
    say(taps.length === 0 && snd.some((e) => e.name === 'right' && !e.skipped), 'with Taps off no tap is given and the sounds still play', `${taps.length} taps · sounds: ${snd.map((e) => e.name).join(' ')}`);
    await t.click('#tTaps'); await t.wait(120);
    // two taps that fall together are one, and the stronger one counts
    await t.clear(); taps = await p.evaluate(() => { HAP.play('light', 'a'); HAP.play('selection', 'b'); HAP.play('heavy', 'c'); return HAP.log.map((e) => ({ ...e })); });
    say(taps.length === 1 && taps[0].kind === 'heavy', 'taps inside 25 ms are one tap, the stronger one', kinds(taps));
    // the marker in the tool bar, for the picture
    await t.wait(200); await p.evaluate(() => scrollTo(0, 0)); await p.evaluate(() => HAP.play('success', 'right')); await t.wait(60);
    await p.screenshot({ path: process.env.HAP_SHOT || path.join(OUT, 'hap-marker.png'), clip: { x: 0, y: 0, width: 1240, height: 260 } });
    await p.close(); }

  // ---------- the speaking exercises: nothing while the mic listens ----------
  { const t = await open('exercises.html'), { p } = t; await t.wait(2400); await t.clear();
    await t.click('#side [data-s="right"]'); await t.wait(700);
    const during = await p.evaluate(() => { const n = HAP.log.length; HAP.play('heavy', 'test'); return { listening: SND.listening, added: HAP.log.length - n }; });
    say(during.listening && during.added === 0, 'a tap asked for while the mic listens is not given', during);
    await t.wait(3600); let taps = await t.taps(), snd = await t.sounds();
    const on = snd.find((e) => e.name === 'mic-on'), off = snd.find((e) => e.name === 'mic-off'), mid = on && off ? taps.filter((x) => x.t > on.t + 5 && x.t < off.t - 5) : null;
    say(!!mid && mid.length === 0 && taps.some((x) => x.name === 'mic-on' && x.kind === 'light') && taps.some((x) => x.name === 'mic-off' && x.kind === 'light'),
      'mic on is a light tap, then none until the mic closes with a light tap', `${off && on ? off.t - on.t : '?'} ms of listening · ${kinds(taps)}`);
    say(taps.filter((x) => x.name === 'right').length === 1 && taps.find((x) => x.name === 'right').kind === 'success', 'the spoken answer that is right gives success', kinds(taps));
    await t.click('#side [data-e="e2"]'); await t.wait(2200); await t.clear(); await t.click('#side [data-s="off"]'); await t.wait(4600); taps = await t.taps(); snd = await t.sounds();
    const closed = snd.find((e) => e.name === 'mic-off'), late = closed ? taps.filter((x) => x.t > closed.t + 5) : [];
    say(late.filter((x) => x.name === 'not-right' && x.kind === 'soft').length === 1 && !late.some((x) => STRONG.includes(x.kind)), 'a spoken mistake gives one soft tap and nothing stronger', kinds(taps));
    await t.click('#side [data-e="e2"]'); await t.wait(2200); await t.clear(); await t.click('#side [data-s="silent"]'); await t.wait(2600); taps = await t.taps();
    say(taps.some((x) => x.name === 'nothing' && x.kind === 'soft') && !taps.some((x) => x.name === 'mic-off'), 'nothing heard gives a soft tap in place of the mic-off tap', kinds(taps));
    await p.close(); }

  // ---------- sounds that build up first: the tap waits for the loud moment ----------
  { const t = await open('screens.html'), { p } = t;
    await t.clear(); await t.click('#side [data-s="result"]'); await t.wait(3200); let taps = await t.taps(), snd = await t.sounds();
    const s = snd.find((e) => e.name === 'lesson-done'), tap = taps.find((x) => x.name === 'lesson-done'), lead = await p.evaluate(() => SND.meta['lesson-done'].hit);
    say(!!s && !!tap && tap.kind === 'success' && Math.abs(tap.t - s.t - lead) < 60, 'Lesson done: success on the hit, not at the start of the sound', s && tap ? `sound starts ${s.t}, tap ${tap.t - s.t} ms later, loud moment at ${lead} ms` : kinds(taps));
    await t.clear(); await t.click('#side [data-s="perfect"]'); await t.wait(3200); taps = await t.taps(); snd = await t.sounds();
    const slam = taps.find((x) => x.name === 'perfect slam'), burst = taps.find((x) => x.name === 'perfect'), ps = snd.find((e) => e.name === 'perfect');
    say(!!slam && !!burst && slam.kind === 'heavy' && burst.kind === 'success' && burst.t - slam.t > 40 && burst.t - slam.t < 220 && Math.abs(burst.t - ps.t) < 30, 'Perfect lesson: heavy on the slam, then success on the burst',
      slam && burst ? `slam, then the burst ${burst.t - slam.t} ms later` : kinds(taps));
    await t.clear(); await t.click('#side [data-s="trophy"]'); await t.wait(1500); taps = await t.taps();
    say(taps.some((x) => x.name === 'trophy' && x.kind === 'heavy'), 'Trophy: heavy on the landing', kinds(taps));
    await t.clear(); await t.click('#side [data-s="level"]'); await t.wait(1500); taps = await t.taps();
    say(taps.some((x) => x.name === 'level-up' && x.kind === 'heavy'), 'Level up: heavy on the badge', kinds(taps));
    // leaving a screen drops the taps that were still waiting with its sound
    await t.clear(); await t.click('#side [data-s="result"]'); await t.wait(500); await t.click('#side [data-s="goal"]'); await t.wait(2200); taps = await t.taps();
    say(!taps.some((x) => x.name === 'lesson-done'), 'leaving the screen before the hit: its tap is dropped with the sound', kinds(taps));
    await p.close(); }
  { const t = await open('progress.html'), { p } = t;
    await t.clear(); await t.click('#dStreak .ctl [data-a="freeze"]'); await t.wait(2200); const taps = await t.taps(), snd = await t.sounds();
    const s = snd.find((e) => e.name === 'freeze'), tap = taps.find((x) => x.name === 'freeze'), lead = await p.evaluate(() => SND.meta.freeze.hit);
    say(!!s && !!tap && tap.kind === 'soft' && tap.t - s.t > lead * 0.8 && tap.t - s.t < lead * 1.1, 'Streak freeze: a soft tap as the ice lands', s && tap ? `tap ${tap.t - s.t} ms after the sound starts, loud moment near ${lead} ms` : kinds(taps));
    await p.close(); }

  // ---------- every sound the pages ask for either has a tap or is on the list of those that have none ----------
  { const fs = require('fs'), src = fs.readdirSync(__dirname).filter((f) => /\.(js|html)$/.test(f) && !/^check/.test(f)).map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
    const names = new Set([...src.matchAll(/SND\.(?:play|hit)\('([a-z-]+)'/g)].map((m) => m[1]));
    for (const f of ['../sound/final/sounds.json', '../sound/families/families.json']) { const j = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); (j.sounds || []).forEach((s) => names.add(s.name)); (j.families || []).forEach((x) => Object.keys(x.sounds).forEach((n) => names.add(n))); }
    ['switch-on', 'switch-off', 'next', 'back', 'sent', 'friend', 'mic-on', 'mic-off', 'button', 'pick', 'count', 'roll', 'appear', 'tick'].forEach((n) => names.add(n));   // names put together in code
    const t = await open('controls.html'), TAP = await t.p.evaluate(() => HAP.TAP); await t.p.close();
    const NONE = ['appear', 'roll', 'whoosh', 'close', 'pop', 'next', 'back', 'unfold', 'step', 'mistakes', 'reminder'], lost = [...names].filter((n) => !TAP[n] && !NONE.includes(n)), gone = Object.keys(TAP).filter((n) => !names.has(n));
    say(lost.length === 0 && gone.length === 0, `all ${names.size} sound names are covered: ${Object.keys(TAP).length} with a tap, ${NONE.length} without`, lost.length || gone.length ? { noDecision: lost, notASound: gone } : ''); }

  await b.close(); console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors'); console.log(bad ? `${bad} FAILED` : 'all passed'); if (bad) process.exit(1);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
