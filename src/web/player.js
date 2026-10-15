// One lesson (or checkpoint) played from its first item to the result screen: the lesson screen of the lab (top bar, exercise, bottom bar,
// feedback sheets) around the exercises of exercises.js, with the order and the mistakes round coming from src/core/session.js.
//   playLesson(lesson, { phone, screen, mic, speaking })  ->  { done: true, stats, spokenMs, speaking } or { done: false } when the learner left
import { say, stop } from './audio.js';
import { People } from './people.js';
import { makeSession } from '../core/session.js';
import { exerciseFor } from './exercises.js';
import { mistakesCard, canSay, result } from './finish.js';
import { closeClips } from './voicerec.js';
import { closeHear } from './hear.js';

const HTML = `<div class="scr lesson"><div class="status"></div>
  <div class="topbar"><button class="xbtn"><img class="x" src="/pendev/icons-r2/glyph-close-grey.png" alt=""></button>
    <div class="progress"><div class="fill tc" style="width:0%"></div></div>
    <div class="combo"><img src="/pendev/icons-r2/flame-streak.png" alt=""><span class="n">0</span></div></div>
  <div class="body"></div>
  <div class="dock">
    <div class="sheet bar"><button class="p3d btn disabled check"><span class="face">TEKSHIRISH</span></button>
      <button class="link cant"></button></div>
    <div class="sheet correct" style="position:absolute;left:0;bottom:0;transform:translateY(100%)">
      <div class="head"><span class="badge"><img src="/pendev/icons-r2/glyph-check-white.png" alt=""></span><span class="ttl">Zo'r!</span></div>
      <button class="p3d btn green next"><span class="face">DAVOM ETISH</span></button></div>
    <div class="sheet fix" style="position:absolute;left:0;bottom:0;transform:translateY(100%)">
      <div><div class="lbl">To'g'ri javob:</div><div class="ans"></div></div>
      <div class="tipbox"><img src="/pendev/icons-r2/bulb-tip.png" alt=""><span class="tiptext"></span></div>
      <button class="p3d btn primary next"><span class="face">DAVOM ETISH</span></button></div>
  </div><div class="qback"></div>
  <div class="qsheet"><span class="qdombi"></span><b>Darsni tark etasizmi?</b><p>Bu darsdagi natija saqlanmaydi.</p>
    <button class="p3d btn primary stay"><span class="face">DAVOM ETISH</span></button><button class="leave">CHIQISH</button></div><div class="toast"></div>
  <div class="combo14"><div class="track"><i></i></div><div class="mid"><img class="flame" src="/pendev/icons-r2/flame-streak.png" alt=""><div class="big"></div><div class="sub">Siz to'xtamayapsiz 💪</div></div></div></div>`;

export async function playLesson(lesson, { phone, screen, mic, speaking = true, keepVoice = null, resume = null, onProgress = null, onSpeech = null, quiet = false }) {
  const session = makeSession(lesson, { speaking }); screen.innerHTML = HTML;
  const q = (s) => screen.querySelector(s), body = q('.body'), check = q('.check'), fill = q('.fill'), comboEl = q('.combo .n'), sOk = q('.sheet.correct'), sNo = q('.sheet.fix'), cant = q('.cant'), toastEl = q('.toast');
  let run = 0, spokenMs = 0, checkFn = null, nextFn = null, abort = null, left = false, pct = 0, toldSkip = false, cur = null;
  M.pressable(check, () => { if (check.classList.contains('disabled')) M.shake(check, 4, T.shakeSmall); else if (checkFn) { const f = checkFn; checkFn = null; f(); } });
  screen.querySelectorAll('.next, .stay').forEach((b) => M.pressable(b));
  screen.querySelectorAll('.next').forEach((b) => b.addEventListener('pointerup', () => { if (nextFn) { const f = nextFn; nextFn = null; f(); } }));
  const grow = (to) => { const from = pct; pct = Math.min(to, 100); fill.style.width = pct + '%';
    M.anim(fill, [{ width: from + '%' }, { width: Math.min(pct + 2.5, 100) + '%', offset: 0.7 }, { width: pct + '%' }], { duration: T.barGrow }); M.shine(fill); };
  const toast = async (text) => { toastEl.textContent = text; await M.anim(toastEl, [{ opacity: 0, translate: '-50% -10px' }, { opacity: 1, translate: '-50% 0' }], { duration: T.toastIn, fill: 'forwards' });
    await M.wait(T.toastHold + 800); M.anim(toastEl, [{ opacity: 1 }, { opacity: 0 }], { duration: T.toastOut, fill: 'forwards' }); };
  // "can't speak now": one tap turns speaking off for the lesson (Echo is left out, the other speaking items are built from words); the same control turns it back on
  const showCant = () => { cant.innerHTML = session.speaking ? `<img src="/pendev/icons-r2/glyph-mic-off-grey.png" alt="">HOZIR GAPIRA OLMAYMAN` : `<img src="/pendev/icons-r2/glyph-mic-off-grey.png" alt="">GAPIRISH O'CHIQ · <b>YOQISH</b>`; cant.classList.toggle('off', !session.speaking); };
  const setSpeaking = (on) => { session.speaking = on; showCant(); if (cur && ['meet', 'say', 'echo'].includes(cur.item.ex) && abort) abort({ redo: true }); };
  cant.onclick = () => { M.punch(cant, 1.05, 160); setSpeaking(!session.speaking); }; showCant();
  // leaving: the X asks first, on the sheet with a calm Dombi (lab page 3, "quit the lesson"); no sad face, no guilt
  const qs = q('.qsheet'), qb = q('.qback'); let asking = false;
  const ask = () => { if (asking || left) return; asking = true; const d = People.putDombi(q('.qdombi'), 80); d.enum('mood').value = 'smirk'; d.enum('gesture').value = 'none';
    qb.style.pointerEvents = 'auto'; SND.play('whoosh'); M.anim(qb, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
    M.anim(qs, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] : [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' }); };
  const stay = () => { if (!asking) return; asking = false; qb.style.pointerEvents = 'none'; SND.play('close'); M.anim(qb, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    M.anim(qs, [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' }).then(() => { if (!asking) document.querySelector('#park').appendChild(People.canvas.dombi); }); };
  q('.xbtn').onclick = ask; q('.stay').addEventListener('pointerup', stay); qb.onclick = stay;
  q('.leave').onclick = () => { if (!asking) return; left = true; run++; if (abort) abort({ quit: true }); if (nextFn) { const f = nextFn; nextFn = null; f(); } };

  // the combo page (14c): 3, 5 and 10 right in a row. Violet screen, the flame pops, about 1.3 s; a tap skips it
  async function comboPage(count) {
    const page = q('.combo14'), flame = q('.combo14 .flame'), big = q('.combo14 .big'), sub = q('.combo14 .sub'), mid = q('.combo14 .mid');
    const c = People.canvas.embers; c.className = ''; c.style.cssText = ''; mid.prepend(c);
    big.textContent = `${count} ta ketma-ket!`; q('.combo14 .track i').style.width = pct + '%'; page.style.pointerEvents = 'auto';
    const skip = new Promise((r) => { page.onclick = r; });
    M.anim(page, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' }); SND.play('combo', { step: { 3: 0, 5: 2, 10: 4 }[count] || 0 });
    big.style.opacity = 0; sub.style.opacity = 0;
    if (!M.reduce) M.anim(flame, [{ scale: '.3', opacity: 0 }, { scale: '1.15', opacity: 1, offset: 0.6 }, { scale: '1' }], { duration: 300 });
    M.wait(120).then(() => { if (!M.reduce) People.fx.embers.trigger('fire').trigger(); });
    const flick = flame.animate([{ scale: '1 1' }, { scale: '1.03 .96' }], { duration: 420, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: 300 * M.slow });
    flick.playbackRate = 1 / M.slow; if (M.reduce) flick.cancel();
    M.wait(80).then(() => { big.style.opacity = 1; M.popIn(big); }); M.fadeUp(sub, 8, 200, 200);
    await Promise.race([M.wait(1300), skip]);
    await M.anim(page, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -16px' }], { duration: 200, easing: EASE.in, fill: 'forwards' });
    flick.cancel(); page.style.pointerEvents = 'none'; page.onclick = null; document.querySelector('#park').appendChild(c);
  }

  async function runItem(e, way, first) {
    const me = ++run, alive = () => me === run && !left, el = document.createElement('div'); el.className = 'ex'; body.appendChild(el); cur = e;
    W.ready(check, false); checkFn = null; if (window.APP) window.APP.now = { item: e.item, way, round: e.round, n: e.n, seq: me };      // for the checks: what is on screen
    const ctx = { item: e.item, n: e.n, lesson, el, mic, alive, ready: (on) => W.ready(check, on), onCheck: (fn) => { checkFn = fn; }, spoke: (ms) => { spokenMs += ms; }, speaking: session.speaking, keepVoice };
    const going = exerciseFor(e.item, way)(ctx);
    if (!first && !M.reduce) [...el.children].forEach((c, i) => M.anim(c, [{ opacity: 0, translate: '70px 0' }, { opacity: getComputedStyle(c).opacity, translate: '0 0' }], { duration: T.exSlide, delay: i * T.stagger * M.slow, fill: 'backwards' }));
    const res = await Promise.race([going, new Promise((r) => { abort = r; })]); abort = null;
    if (!res || res.redo || res.quit || res.off) { run++; stop(); mic.idle(false); People.home(); document.querySelector('#park').appendChild(mic.el); el.remove(); return res || { quit: true }; }
    const out = session.answer(res.right); comboEl.textContent = out.combo; M.punch(comboEl, 1.3, 180); fill.classList.toggle('gold', out.combo >= 5);
    if (res.right) { grow(session.stats().progress * 100); SND.play('right'); await M.wait(150); W.sheetShow(sOk); if (res.hear && res.voice) M.wait(650).then(() => { if (alive()) say(res.voice, res.answer); }); }
    else { SND.play('not-right'); q('.ans').textContent = res.answer; q('.tiptext').textContent = res.tip || ''; q('.tipbox').style.display = res.tip ? 'flex' : 'none';
      await M.wait(350); W.sheetShow(sNo); if (res.voice) M.wait(700).then(() => { if (alive()) say(res.voice, res.answer); }); }          // the right answer is shown and said; never "wrong"
    await new Promise((r) => { nextFn = r; }); run++; stop(); W.sheetHide(sOk); W.sheetHide(sNo); mic.idle(false);
    await M.anim(el, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-90px 0' }], { duration: 180, easing: EASE.in, fill: 'forwards' });
    People.home(); document.querySelector('#park').appendChild(mic.el); el.remove(); cur = null; return { ...res, combo: out.combo };
  }

  // after a reload in the middle of the lesson: the answers so far are played into the session again, so it goes on from the same item
  const ops = resume ? [...resume.ops] : [];
  if (resume) { for (const op of ops) { session.startMistakes(); if (!session.next()) break; if (op === 's') session.skip(); else session.answer(op === 'r'); }
    spokenMs = resume.spokenMs || 0; session.speaking = resume.speaking; showCant(); comboEl.textContent = session.stats().combo; pct = session.stats().progress * 100; fill.style.width = pct + '%'; }
  const save = () => { if (onProgress) onProgress({ id: lesson.id, ops, spokenMs: Math.round(spokenMs), speaking: session.speaking }); };
  let first = true;
  while (!left) {
    if (session.startMistakes()) { await mistakesCard(q('.scr'), session.stats().left); if (left) break; }
    const e = session.next(); if (!e) break;
    const way = session.way(e.item);
    if (way === 'skip') { session.skip(); ops.push('s'); save(); grow(session.stats().progress * 100); if (!toldSkip) { toldSkip = true; toast('Gapirish mashqlari keyinga qoldirildi'); } continue; }
    const res = await runItem(e, way, first); first = false;
    if (!res.off && !res.quit && !res.redo && res.right != null) { ops.push(res.right ? 'r' : 'w'); save(); }
    if (res.right && [3, 5, 10].includes(res.combo) && !left) await comboPage(res.combo);
    if (res.off) {                                                                                   // the mic is blocked (31b) or the browser cannot make words of speech (31c)
      const pick = onSpeech ? await onSpeech(res.off) : 'tiles'; if (left) break;
      if (pick === 'retry') continue;
      session.speaking = false; showCant(); save(); if (!onSpeech) toast(res.off === 'nomic' ? 'Mikrofon yopiq. So\'zlarni tanlab javob berasiz.' : 'Bu brauzer nutqni taniy olmaydi. So\'zlarni tanlab javob berasiz.'); }
  }
  stop(); People.home(); VOICE.close(); closeClips(); closeHear();
  if (left) return { done: false, speaking: session.speaking };
  const stats = session.stats();
  if (!lesson.checkpoint && !quiet) { await canSay(phone, screen, lesson); await result(phone, screen, lesson, stats, spokenMs); }     // a checkpoint ends on its trophy (moments.js)
  return { done: true, stats, spokenMs, speaking: session.speaking };
}
