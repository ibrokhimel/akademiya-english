// Pop-ups and problem screens: feedback form (29, 29b), confidence again (30, 30b), no internet (31a), mic blocked (31b),
// speech recognition unavailable (31c), something went wrong (31e), not ready yet (31d). Motion from the lab (design/motion/states.js, controls.js).
// Each one lays itself over ctx.phone (full pages z 50, sheets z 60, offline z 70) and removes itself when done. The screen behind stays as it was:
// Dombi is borrowed from wherever he is and put back afterwards (People.home() would also park the lesson's people, so it is not used here).
//   ctx = { phone, firstConfidence, saveFeedback(obj), where?() }
import { People } from './people.js';

const btn = (label, cls = 'primary', extra = '') => `<button class="p3d btn ${cls}"><span class="face"><span class="lbl">${label}</span>${extra}</span></button>`;
const DOTS = '<span class="bdots"><i></i><i></i><i></i></span>';
const FACES = [['face-pleading', 'Umuman ishonmayman'], ['face-dizzy', 'Biroz qo\'rqaman'], ['face-smile', 'O\'rtacha'], ['face-grin', 'Ancha ishonaman'], ['face-starstruck', 'Juda ishonaman']];

function layer(ctx, cls, z, html) {
  const el = document.createElement('div'); el.className = `stlayer ${cls}`; el.style.zIndex = z; el.innerHTML = html; ctx.phone.appendChild(el);
  el.querySelectorAll('.btn').forEach((b) => M.pressable(b)); return el;
}
// Dombi into a box; give() puts him back where he was, with the face he had
function borrowDombi(box, size, own = box.closest('.stlayer')) {
  const c = People.canvas.dombi, d = People.dombi, was = { parent: c.parentElement, css: c.style.cssText, next: c.nextSibling, mood: d.enum('mood').value, gesture: d.enum('gesture').value };
  People.putDombi(box, size); d.enum('gesture').value = 'none'; d.enum('mood').value = 'smirk';
  return { d, give() { if (!own.contains(c)) return;                                       // someone else has him by now
    if (was.parent) was.parent.insertBefore(c, was.next && was.next.parentElement === was.parent ? was.next : null); c.style.cssText = was.css; d.enum('mood').value = was.mood; d.enum('gesture').value = was.gesture; } };
}
const enter = async (d) => { d.boolean('hidden').value = true; await M.wait(60); d.boolean('hidden').value = false; };
const show = (el, ms, how = 'up') => M.wait(ms).then(() => { if (!el.isConnected) return; el.style.opacity = 1; return how === 'pop' ? M.popIn(el) : M.fadeUp(el, 10, 220); });
const pressed = (b) => new Promise((r) => b.addEventListener('pointerup', r, { once: true }));
const fadeIn = (el) => M.anim(el, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, translate: '24px 0' }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, fill: 'backwards' });
const fadeAway = (el) => M.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: EASE.in, fill: 'forwards' }).then(() => el.remove());
// the three dots inside a button while it tries; resolves after `ms`
async function trying(b, ms = 1100) {
  const lbl = b.querySelector('.lbl'), dots = b.querySelector('.bdots'); lbl.style.opacity = 0; dots.style.opacity = 1;
  const an = [...dots.children].map((d, i) => { const a = d.animate([{ translate: '0 2px' }, { translate: '0 -5px' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 110 }); a.playbackRate = 1 / M.slow; return a; });
  await M.wait(ms); an.forEach((a) => a.cancel()); dots.style.opacity = 0; lbl.style.opacity = 1;
}
// a bottom sheet over the screen: the dim fades in 200 ms, the sheet comes up in 300 ms with an 8 px overshoot; down in 200 ms
function sheetUp(el) { SND.play('whoosh'); M.anim(el.querySelector('.stdim'), [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
  return M.anim(el.querySelector('.stsheet'), M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] :
    [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' }); }
async function sheetDown(el, quiet) { if (!quiet) SND.play('close'); M.anim(el.querySelector('.stdim'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  const s = el.querySelector('.stsheet'); await M.anim(s, [{ transform: getComputedStyle(s).transform }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' }); el.remove(); }

// ---------- 29 · feedback form, 29b · thank-you toast ----------
export async function feedbackForm(ctx) {
  const el = layer(ctx, 'st29', 60, `<div class="stdim"></div><div class="stsheet"><div class="stgrab"></div><div class="stdbox" style="width:80px;height:80px"></div>
    <div class="sth22">Nimadir xato ketdimi?</div><div class="stp14">Ayting — tuzatamiz. Sizning fikringiz ilovani yaxshilaydi.</div>
    <div class="chips">${['Javob xato', 'Ovoz ishlamadi', 'Tushunarsiz', 'Boshqa'].map((c) => `<button class="chip">${c}</button>`).join('')}</div>
    <textarea placeholder="Mikrofonni bosdim, lekin hech narsa bo'lmadi…"></textarea>
    <div class="shot">Ekran rasmini qo'shish<button class="tgl on"><i style="translate:20px 0"></i></button></div>${btn('YUBORISH', 'disabled')}</div>`);
  const q = (s) => el.querySelector(s), sheet = q('.stsheet'), send = q('.btn'), text = q('textarea'), tgl = q('.tgl'), chips = [...el.querySelectorAll('.chip')];
  const dom = borrowDombi(q('.stdbox'), 80); sheetUp(el); M.wait(200).then(() => enter(dom.d));
  const can = () => chips.some((c) => c.classList.contains('on')) || text.value.trim().length > 0;
  const ready = () => { const on = can(), was = send.classList.contains('primary'); send.classList.toggle('disabled', !on); send.classList.toggle('primary', on); if (on && !was) M.wait(T.colour).then(() => M.shine(send)); };
  chips.forEach((c) => { c.onclick = () => { const on = !c.classList.contains('on'); c.classList.toggle('on', on); SND.play('seg'); M.punch(c, 1.06, 160); if (on) dom.d.enum('mood').value = 'happy'; ready(); }; });
  text.oninput = ready;
  tgl.onclick = () => { const on = !tgl.classList.contains('on'), knob = tgl.querySelector('i'); tgl.classList.toggle('on', on); SND.play(on ? 'switch-on' : 'switch-off');
    const from = on ? 0 : 20, to = on ? 20 : 0; knob.style.translate = `${to}px 0`;
    M.anim(knob, M.reduce ? [{ translate: `${from}px 0` }, { translate: `${to}px 0` }] : [{ translate: `${from}px 0`, scale: '1 1' }, { translate: `${(from + to) / 2}px 0`, scale: '1.18 .92', offset: 0.5 }, { translate: `${to}px 0`, scale: '1 1' }], { duration: 180, easing: EASE.std }); };
  return new Promise((done) => {
    let over = false;
    const close = async () => { if (over) return; over = true; text.blur(); await sheetDown(el); dom.give(); done({ sent: false }); };
    q('.stdim').onclick = close;
    // swipe down to close: the sheet follows the finger; far enough and it goes
    let drag = null; const k = () => ctx.phone.offsetWidth / ctx.phone.getBoundingClientRect().width;
    sheet.addEventListener('pointerdown', (e) => { if (e.target.closest('textarea, button')) return; drag = { y: e.clientY }; sheet.setPointerCapture(e.pointerId); });
    sheet.addEventListener('pointermove', (e) => { if (!drag) return; const dy = Math.max(0, (e.clientY - drag.y) * k()); drag.dy = dy; sheet.getAnimations().forEach((a) => a.cancel()); sheet.style.transform = `translateY(${dy}px)`; });
    sheet.addEventListener('pointerup', () => { if (!drag) return; const dy = drag.dy || 0; drag = null; if (dy > 90) close(); else { M.anim(sheet, [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 180, easing: EASE.std }); sheet.style.transform = 'translateY(0)'; } });
    send.addEventListener('pointerup', async () => {
      if (over) return; if (!can()) return M.shake(send, 4, T.shakeSmall);
      over = true; text.blur();
      const fb = { chips: chips.filter((c) => c.classList.contains('on')).map((c) => c.textContent), text: text.value.trim(), screenshot: tgl.classList.contains('on'), at: new Date().toISOString(), where: ctx.where ? ctx.where() : null };
      try { if (ctx.saveFeedback) ctx.saveFeedback(fb); } catch (e) { console.error(e); }
      await M.wait(120); M.anim(q('.stdim'), [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });                         // the form shrinks up and away
      await M.anim(sheet, [{ opacity: 1, scale: '1', transform: 'translateY(0)' }, { opacity: 0, scale: '.9', transform: 'translateY(-40px)' }], { duration: 220, easing: EASE.in, fill: 'forwards' });
      el.remove(); dom.give(); done({ sent: true }); thanks(ctx);
    });
  });
}
// 29b: "Rahmat!" at the top, then it goes by itself
async function thanks(ctx) {
  const t = document.createElement('div'); t.className = 'sttoast'; ctx.phone.appendChild(t);
  t.innerHTML = `<span class="tile"><img src="/design/icons/characters-dombi/happy.svg" alt=""></span><span><b>Rahmat! Xabaringiz yetib keldi</b><small>Tez orada tuzatamiz.</small></span>`;
  SND.play('sent'); await M.anim(t, [{ opacity: 0, translate: '0 -20px' }, { opacity: 1, translate: '0 0' }], { duration: T.toastIn, fill: 'forwards' });
  M.punch(t.querySelector('.tile'), 1.12, 220); await M.wait(T.toastHold); await M.fadeOut(t, -12, T.toastOut); t.remove();
}

// ---------- 30 · confidence again (about 2 weeks in), 30b · it grew ----------
export async function confidenceAgain(ctx) {
  const first = ctx.firstConfidence || 0;
  const el = layer(ctx, 'st30 full', 50, `<div class="cbody"><div class="guide"><span class="stdbox" style="width:80px;height:80px"></span><div class="speech" style="opacity:0">2 hafta o'tdi! Endi gapirganda o'zingizga qanchalik ishonasiz?</div></div>
    ${FACES.map(([ic, l], i) => `<button class="copt" style="opacity:0"><img src="${ICON}${ic}.png" alt=""><span class="lb">${l}</span>${i + 1 === first ? '<span class="day1">1-kuni</span>' : `<span class="num">${i + 1}</span>`}</button>`).join('')}</div>
    <div class="stbot" style="opacity:0">${btn('YUBORISH', 'disabled')}</div>`);
  const q = (s) => el.querySelector(s), opts = [...el.querySelectorAll('.copt')], go = q('.btn');
  fadeIn(el); const dom = borrowDombi(q('.stdbox'), 80); await enter(dom.d);
  const sp = q('.speech'); show(sp, 300, 'pop').then(() => SND.play('pop', { volume: 0.6 }));
  opts.forEach((o, i) => show(o, 420 + i * T.stagger)); show(q('.stbot'), 420 + opts.length * T.stagger);
  let value = 0;
  opts.forEach((o, i) => M.pressable(o, () => {
    opts.forEach((x) => { x.classList.remove('sel'); x.style.opacity = x === o ? 1 : 0.55; if (x._setRest) x._setRest(0); });
    o.classList.add('sel'); if (o._setRest) o._setRest(1); M.punch(o.querySelector('img'), 1.35, 260); value = i + 1;
    dom.d.enum('mood').value = ['wink', 'smirk', 'happy', 'happy', 'laugh'][i];                                                     // Dombi answers the mood, never sad
    if (go.classList.contains('disabled')) { go.classList.replace('disabled', 'primary'); M.wait(T.colour).then(() => M.shine(go)); }
  }));
  await new Promise((r) => go.addEventListener('pointerup', () => { if (value) r(); else M.shake(go, 4, T.shakeSmall); }));
  SND.play('sent');
  if (first && value > first) await grew(el, dom, first, value);
  dom.give(); await fadeAway(el); return { value };
}
async function grew(el, dom, from, to) {
  const out = el.querySelector('.cbody'), bot = el.querySelector('.stbot');
  await Promise.all([out, bot].map((x) => M.anim(x, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-60px 0' }], { duration: 180, easing: EASE.in, fill: 'forwards' })));
  out.remove(); bot.remove();
  el.insertAdjacentHTML('beforeend', `<div class="stbody" style="gap:16px;padding:0 24px"><div class="stdbox" style="width:170px;height:170px"></div><div class="sth22" style="opacity:0">Ishonchingiz oshdi!</div>
    <div class="stp14" style="opacity:0">2 hafta oldin: “${FACES[from - 1][1]}”. Bugun: “${FACES[to - 1][1]}”.</div>
    <div class="grow"><div class="gtile" style="opacity:0"><span>${from}</span></div><span class="garrow">→</span><div class="gtile" style="opacity:0"><span>${from}</span></div></div></div>
    <div class="stbot" style="opacity:0;padding:12px 16px 30px">${btn('ZO\'R!')}</div>`);
  const q = (s) => el.querySelector(s), go = q('.btn'); M.pressable(go);
  People.putDombi(q('.stdbox'), 170); dom.d.enum('gesture').value = 'none'; await enter(dom.d); dom.d.enum('mood').value = 'happy';
  show(q('.sth22'), 250); show(q('.stp14'), 370);
  const [a, b] = el.querySelectorAll('.gtile'), arrow = q('.garrow');
  await show(a, 520, 'pop');
  await M.anim(arrow, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 260, easing: EASE.std, fill: 'forwards' });   // the arrow draws itself
  b.style.opacity = 1; await M.popIn(b);
  for (let n = from + 1; n <= to; n++) {                                                                   // the number rolls up to the new one
    const old = b.querySelector('span'), neu = document.createElement('span'); neu.textContent = n; b.appendChild(neu);
    M.anim(old, [{ translate: '0 0', opacity: 1 }, { translate: '0 -34px', opacity: 0 }], { duration: 150, easing: EASE.in, fill: 'forwards' }).then(() => old.remove());
    await M.anim(neu, [{ translate: '0 34px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 190, fill: 'forwards' });
  }
  b.classList.add('up'); M.punch(b, 1.18, 240); M.pop(b, GREEN); SND.play('right'); dom.d.enum('mood').value = 'laugh'; dom.d.enum('gesture').value = 'celebrate';
  M.wait(1100).then(() => { dom.d.enum('mood').value = 'happy'; dom.d.enum('gesture').value = 'none'; });
  show(q('.stbot'), 250); M.wait(800).then(() => { if (go.isConnected) M.shine(go); });
  await pressed(go);
}

// ---------- 31a · no internet ----------
function offlinePage(ctx) {
  const el = layer(ctx, 'st31a full', 70, `<div class="stbody"><div class="stdbox" style="width:170px;height:170px"><span class="badge" style="opacity:0"><img src="${ICON}glyph-wifi-off-grey.png" alt=""></span></div>
    <div class="sth22" style="opacity:0">Internet yo'q</div><div class="stp14" style="opacity:0">Darslar uchun internet kerak. Ulanish qaytishi bilan avtomatik davom etamiz.</div></div>
    <div class="stbot" style="opacity:0">${btn('QAYTA URINISH', 'primary', DOTS)}</div>`);
  const q = (s) => el.querySelector(s), badge = q('.badge'); fadeIn(el); const dom = borrowDombi(q('.stdbox'), 170); enter(dom.d);
  show(badge, 300, 'pop'); show(q('.sth22'), 250); show(q('.stp14'), 370); show(q('.stbot'), 500);
  let pulse = null; M.wait(520).then(() => { if (!M.reduce && el.isConnected) { pulse = badge.querySelector('img').animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: 1000, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); pulse.playbackRate = 1 / M.slow; } });   // the wifi icon fades slowly
  let gone = false;
  const leave = async () => { if (gone) return; gone = true; if (pulse) pulse.cancel(); M.pop(q('.btn'), GREEN); SND.play('right'); await M.wait(250); dom.give(); await fadeAway(el); };
  return { el, btn: q('.btn'), leave, gone: () => gone };
}
// shows 31a while the browser is offline, and leaves on its own when it is back
export function watchOnline(ctx) {
  let page = null, timer = 0;
  const check = async (by) => { if (!page || page.gone()) return; if (by) await trying(page.btn); if (navigator.onLine) { clearInterval(timer); const p = page; page = null; await p.leave(); } else if (by) M.shake(page.el.querySelector('.stbody'), 5, T.shakeSmall); };
  const off = () => { if (page) return; page = offlinePage(ctx); let busy = false;
    page.btn.addEventListener('pointerup', async () => { if (busy) return; busy = true; await check(true); busy = false; });
    timer = setInterval(() => check(false), 4000); };                                                 // it also tries by itself every few seconds
  const on = () => check(false);
  addEventListener('offline', off); addEventListener('online', on); if (!navigator.onLine) off();
  return () => { removeEventListener('offline', off); removeEventListener('online', on); clearInterval(timer); if (page) { page.leave(); page = null; } };
}
// the same page on demand (for the test viewer): QAYTA URINISH tries, then it leaves
export async function showOffline(ctx) {
  const page = offlinePage(ctx); await pressed(page.btn); await trying(page.btn); await page.leave();
}

// ---------- 31b · mic blocked ----------
export async function micBlocked(ctx) {
  const el = layer(ctx, 'st31b', 60, `<div class="stdim"></div><div class="stsheet"><div class="stgrab"></div>
    <div class="stdbox mbd"><span class="badge"><img src="${ICON}glyph-mic-off-muted.png" alt=""></span></div>
    <div class="sth22">Mikrofon yopiq</div><div class="stp14">Gapirish mashqlari uchun mikrofonga ruxsat kerak:</div>
    <div class="steps">${['Manzil satridagi qulf belgisini bosing', 'Mikrofonga ruxsat bering', 'QAYTA URINISH tugmasini bosing'].map((t, i) => `<div><i>${i + 1}</i>${t}</div>`).join('')}</div>
    ${btn('QAYTA URINISH')}<button class="stlink">GAPIRMASDAN DAVOM ETISH</button></div>`);
  const q = (s) => el.querySelector(s), dom = borrowDombi(q('.mbd'), 110);
  sheetUp(el); show(q('.badge'), 380, 'pop');
  (async () => { for (const [i, r] of [...el.querySelectorAll('.steps div')].entries()) { await M.wait(i ? 110 : 520); if (!el.isConnected) return; SND.play('step', { step: SND.deg(i) }); r.style.opacity = 1; M.fadeUp(r, 6, 180); M.popIn(r.querySelector('i')); }   // the steps tick in
    await M.wait(300); if (el.isConnected) M.shine(q('.btn')); })();
  const pick = await new Promise((r) => { q('.btn').addEventListener('pointerup', () => r('retry'), { once: true }); q('.stlink').onclick = () => r('continue'); });
  await sheetDown(el); dom.give(); return pick;
}

// ---------- 31c · speech recognition unavailable ----------
export async function speechUnavailable(ctx) {
  const el = layer(ctx, 'st31c', 60, `<div class="stdim"></div><div class="stsheet"><div class="stgrab"></div><div class="stdbox" style="width:100px;height:100px"></div>
    <div class="sth22">Hozir sizni tushuna olmayapman</div><div class="stp14">Brauzeringiz hozir ovozni matnga aylantira olmayapti. Hozircha gapirish o'rniga so'zlarni tanlab javob berasiz — gapirishga keyin qaytamiz.</div>
    ${btn('SO\'ZLARNI TANLAB DAVOM ETISH')}<button class="stlink">QAYTA URINIB KO'RISH</button></div>`);
  const q = (s) => el.querySelector(s), dom = borrowDombi(q('.stdbox'), 100); dom.d.enum('mood').value = 'think';
  sheetUp(el); M.wait(700).then(() => { if (el.isConnected) { dom.d.enum('mood').value = 'smirk'; M.shine(q('.btn')); } });
  const pick = await new Promise((r) => { q('.btn').addEventListener('pointerup', () => r('tiles'), { once: true }); q('.stlink').onclick = () => r('retry'); });
  await sheetDown(el); dom.give(); return pick;
}

// ---------- 31e · something went wrong ----------
export async function errorScreen(ctx, err) {
  if (err) console.error(err);
  const el = layer(ctx, 'st31e full', 50, `<div class="stbody"><div class="stdbox" style="width:170px;height:170px"></div>
    <div class="sth22" style="opacity:0">Voy, nimadir xato ketdi</div><div class="stp14" style="opacity:0">Bu sizning aybingiz emas. Bir oz kutib, qayta urinib ko'ring.</div></div>
    <div class="stbot" style="opacity:0">${btn('QAYTA URINISH', 'primary', DOTS)}${btn('XATO HAQIDA XABAR BERISH', 'secondary')}</div>`);
  const q = (s) => el.querySelector(s), [retry, report] = el.querySelectorAll('.btn');
  fadeIn(el); const dom = borrowDombi(q('.stdbox'), 170); await enter(dom.d);
  M.wait(350).then(() => { if (el.isConnected) dom.d.enum('gesture').value = 'thinking'; });                                          // hand to chin, still calm
  show(q('.sth22'), 250); show(q('.stp14'), 370); show(q('.stbot'), 500);
  const pick = await new Promise((r) => { let busy = false;
    retry.addEventListener('pointerup', async () => { if (busy) return; busy = true; dom.d.enum('mood').value = 'think'; await trying(retry, 1200); r('retry'); });
    report.addEventListener('pointerup', () => { if (!busy) r('report'); }); });
  dom.give(); await fadeAway(el); return pick;
}

// ---------- 31d · not ready yet ----------
export async function notReady(ctx) {
  const el = layer(ctx, 'st31d full', 50, `<button class="xclose"><img src="${ICON}glyph-close-muted.png" alt=""></button><div class="stbody"><div class="art" style="opacity:0"><img src="${ICON}sprout.png" alt=""></div>
    <div class="h26" style="opacity:0">Bu bo'lim hali yaratilmoqda</div><div class="p16" style="opacity:0">Tez orada qo'shamiz! Hozircha darslarni davom ettiring — har bir dars sizni oldinga olib boradi.</div></div>
    <div class="stbot" style="opacity:0">${btn('DARSLARGA QAYTISH')}${btn('BU HAQDA FIKR BILDIRISH', 'secondary')}</div>`);
  const q = (s) => el.querySelector(s), [back, tell] = el.querySelectorAll('.btn'), art = q('.art');
  fadeIn(el); await show(art, 150, 'pop');
  let sway = null; if (!M.reduce && el.isConnected) { sway = art.querySelector('img').animate([{ rotate: '-3deg', scale: '1' }, { rotate: '3deg', scale: '1.07' }], { duration: 1900, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); sway.playbackRate = 1 / M.slow; }   // it sways and grows a little
  show(q('.h26'), 100); show(q('.p16'), 220); show(q('.stbot'), 360);
  await new Promise((r) => { back.addEventListener('pointerup', r, { once: true }); q('.xclose').onclick = r;
    tell.addEventListener('pointerup', async () => { await feedbackForm(ctx); r(); }); });
  if (sway) sway.cancel(); await fadeAway(el);
}
