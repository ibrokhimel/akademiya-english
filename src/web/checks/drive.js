// Plays one lesson (or checkpoint) that is on screen, like a learner, then the screens after it, up to the Learn page or the account screen.
// Shared by play.js and flow.js.   await playThrough(p, id, { miss: Set of item numbers to answer wrongly first, pics: bool, shot(name), press(sel) })  ->  { log, stats }
async function playThrough(p, id, { miss = new Set(), pics = false, shot, press }) {
  const log = []; let step = 0, tried = new Set();
    for (;;) {
      // what is on screen: an item, the mistakes card, or the end
      const now = await p.evaluate(() => { const o = document.querySelector('.scr.over .go'), fin = !document.querySelector('.scr.lesson'); return fin ? { end: true } : o ? { card: true } : { ...window.APP.now, id: window.APP.now.n + ':' + window.APP.now.round, answer: null }; });
      if (now.end) break;
      if (now.card) { await p.waitForTimeout(900); if (pics) await shot(`${id}-mistakes-card`); await press('.scr.over .go'); await p.waitForTimeout(500); continue; }
      const it = now.item, wrong = miss.has(now.n + 1) && !tried.has(now.n); tried.add(now.n); step++;
      const name = `${id}-${String(step).padStart(2, '0')}-${now.way === 'tiles' && it.ex !== 'tiles' ? it.ex + '-as-tiles' : it.ex}`;
      if (now.way === 'speak') { await p.evaluate((w) => { window.APP_TEST.say = [w ? 'banana' : true]; }, wrong);
        const reduce = await p.evaluate(() => M.reduce); if (!reduce) await p.waitForFunction(() => document.querySelector('.ex .mic .halo') && document.querySelector('.ex .mic .halo').getAnimations().length > 0, null, { timeout: 30000 });      // the mic glows: it is the learner's turn
        if (pics) await shot(name + '-a');
        if (!reduce) await press('.ex .mic .p3d');
        else for (let i = 0; i < 40; i++) { await press('.ex .mic .p3d'); await p.waitForTimeout(800); if (await p.evaluate(() => { const r = document.querySelector('.ex .result'); return (r && r.style.display === 'flex') || [...document.querySelectorAll('.sheet.correct, .sheet.fix')].some((s) => s._up); })) break; } }      // with Reduce Motion the ring does not breathe: press until it listens
      else if (now.way === 'tiles') { const words = await p.evaluate(({ it, wrong }) => { const P = window.APP.C.P, text = it.p ? P[it.p].en : it.en, want = text.replace(/[.,!?]/g, '').split(/\s+/).map((w) => w.toLowerCase()); return wrong ? want.slice().reverse() : want; }, { it, wrong });
        await p.waitForTimeout(700); if (pics) await shot(name + '-a');
        for (const w of words) { const i = await p.evaluate((w) => [...document.querySelectorAll('.bbank .word:not(.used)')].findIndex((t) => t.textContent.toLowerCase() === w), w); if (i < 0) throw new Error('no tile ' + w); await press(`.bbank .word:not(.used) >> nth=${i}`); await p.waitForTimeout(330); }
        await press('.check');
        if (!wrong && it.ex === 'tiles' && now.way === 'tiles' && await p.evaluate(() => window.APP.ctx.settings.speaking)) {           // the read-aloud after a sentence built right
          await p.waitForSelector('.readaloud .mic .p3d', { timeout: 15000 }); await p.evaluate(() => { window.APP_TEST.say = [true]; }); await p.waitForTimeout(500); if (pics) await shot(name + '-readaloud'); await press('.readaloud .mic .p3d'); } }
      else if (it.ex === 'heard') { await p.waitForFunction(() => document.querySelector('.ex .row3') && document.querySelector('.ex .row3').style.opacity === '1', null, { timeout: 60000 }); await p.waitForTimeout(500);
        if (pics) await shot(name + '-a'); const k2 = wrong ? (it.right + 1) % 3 : it.right; await press(`.ex .picture[data-k="${k2}"]`); await p.waitForTimeout(250); await press('.check'); }
      else { await p.waitForTimeout(700); if (pics) await shot(name + '-a'); /* force: the gaps breathe, so they never hold still */ const want = it.ex === 'gap' ? it.gap : it.bad, pick = wrong ? (want === 0 ? 1 : 0) : want;
        await p.locator(it.ex === 'gap' ? '.ex .gap' : '.ex .mword').nth(pick).click({ force: true }); await p.waitForTimeout(250); await press('.check'); }
      await p.waitForFunction(() => [...document.querySelectorAll('.sheet.correct, .sheet.fix:not(.quit)')].some((s) => s._up), null, { timeout: 30000 }); await p.waitForTimeout(700);
      const sheet = await p.evaluate(() => (document.querySelector('.sheet.correct')._up ? 'right' : 'answer shown: ' + document.querySelector('.sheet.fix .ans').textContent));
      log.push(`${now.n + 1}${now.round === 'mistakes' ? '*' : ''} ${it.ex}${now.way === 'tiles' && it.ex !== 'tiles' ? ' as tiles' : ''}: ${sheet}`); if (pics) await shot(name + '-b');
      await press(sheet === 'right' ? '.sheet.correct .next' : '.sheet.fix:not(.quit) .next'); await p.waitForTimeout(450);
      if (await p.evaluate(() => { const c = document.querySelector('.combo14'); return !!c && c.style.pointerEvents === 'auto'; })) { await p.waitForTimeout(450); if (pics) await shot(`${id}-combo-after-${step}`); }      // the combo page is up
      await p.waitForFunction((s) => !document.querySelector('.scr.lesson') || document.querySelector('.scr.over .go') || window.APP.now.seq !== s, now.seq, { timeout: 30000 });
    }
    let stats = '';
    for (;;) {                                                     // can say, result, trophy, level up, streak: each waits for its button, then the Learn page
      await p.waitForSelector('.cscard, .rstats, .trophy, .lbadge, .streakbig, .learnpage, .ob, .st30'); if (await p.locator('.learnpage, .ob, .st30').count()) break;      // .st30: the confidence question, left to the caller
      const what = await p.evaluate(() => ['cscard', 'rstats', 'trophy', 'lbadge', 'streakbig'].find((c) => document.querySelector('.' + c)));
      await p.waitForTimeout(what === 'rstats' ? 2600 : 2000); if (what === 'rstats') stats = await p.evaluate(() => [...document.querySelectorAll('.rstat .v')].map((v) => v.textContent).join(' · '));
      if (what === 'trophy') stats = await p.evaluate(() => document.querySelector('.react .n').textContent);
      if (pics) await shot(`${id}-${{ cscard: 'can-say', rstats: 'result', trophy: 'trophy', lbadge: 'level-up', streakbig: 'streak' }[what]}`); await press('.go'); await p.waitForTimeout(400);
    }
  return { log, stats };
}
module.exports = { playThrough };
