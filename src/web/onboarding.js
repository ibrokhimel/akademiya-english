// Onboarding: the 12 locked screens of lab page 8 (design/motion/onboarding.js, onboarding2.js) as the app's first run, plus
// 1L Log in and 1L·b Account not found (Pencil). One Dombi travels from screen to screen.
//   onboarding(ctx)   -> { goal, level, confidence, micOk, saveVoice, reminder, method } after screen 9, or { loggedIn: method } from Log in
//   createAccount(ctx) -> { name, signIn }   (screen 10, shown after Lesson 1)
// ctx = { phone, screen, hasAccount(method) -> bool, micBlocked?() -> 'continue' | 'retry' }
import { People } from './people.js';

const METHODS = [['google', '<span class="ico">G</span>', 'GOOGLE ORQALI'], ['apple', '<span class="ico">A</span>', 'APPLE ORQALI'], ['phone', `<img src="${'/pendev/icons-r2/'}glyph-phone-dark.png" alt="">`, 'TELEFON RAQAM']];
const NAMES = { google: 'Google', apple: 'Apple', phone: 'telefon raqam' };
const btn = (label, cls = 'primary', attr = '') => `<button class="p3d btn ${cls}" ${attr}><span class="face">${label}</span></button>`;
const guide = (text) => `<div class="guide"><span class="dph" style="width:80px;height:80px"></span><div class="speech" style="opacity:0">${text}</div></div>`;
const signins = (first) => [...METHODS].sort((a, b) => (b[0] === first) - (a[0] === first)).map(([k, ic, l]) => `<button class="p3d signin" data-m="${k}" data-in><span class="face">${ic}${l}</span></button>`).join('');

// the frame: screen changes, the step bar and the travelling Dombi (lab: OB.start)
function frame(ctx) {
  const { phone, screen } = ctx;
  screen.innerHTML = `<div class="ob scr" style="background:var(--bg)"><div id="obstage"></div><div id="obbar"><img id="obback" src="${ICON}glyph-chevron-left-muted.png" alt=""><div class="steps">${'<i></i>'.repeat(9)}</div></div></div>`;
  const root = screen.querySelector('.ob'), stage = root.querySelector('#obstage'), bar = root.querySelector('#obbar'), steps = [...bar.querySelectorAll('.steps i')];
  const cD = People.canvas.dombi, d = People.dombi; cD.id = 'fxDombi'; root.appendChild(cD); cD.style.cssText = 'opacity:0';
  const F = { S: {}, order: [], run: 0, cur: null, d, root };
  let barAt = null, box = null;
  function setBar(idx) {
    M.anim(bar, [{ opacity: getComputedStyle(bar).opacity }, { opacity: idx == null ? 0 : 1 }], { duration: 150, fill: 'forwards' }); bar.style.pointerEvents = idx == null ? 'none' : 'auto';
    if (idx == null) { barAt = null; return; }
    steps.forEach((s, i) => { const w = i === idx ? 40 : 24, c = i <= idx ? 'var(--violet)' : 'var(--grey)', ow = s.style.width || '24px', oc = s.style.background || 'var(--grey)';
      s.style.width = w + 'px'; s.style.background = c;
      if (barAt != null && (ow !== w + 'px' || oc !== c)) M.anim(s, [{ width: ow, background: oc }, { width: w + 'px', background: c }], { duration: 260, easing: EASE.std }).then(() => { if (i === idx) M.shine(s); }); });
    barAt = idx;
  }
  function moveDombi(holder, animate) {
    if (!holder) { cD.style.opacity = 0; box = null; return; }
    const p = phone.getBoundingClientRect(), r = holder.getBoundingClientRect(), k = phone.offsetWidth / p.width;
    const f = dombiFit(r.width * k), to = { left: (r.left - p.left) * k + f.dx + 'px', top: (r.top - p.top) * k + f.dy + 'px', width: f.size + 'px', height: f.size + 'px' };
    cD.style.opacity = 1;
    if (animate && box && !M.reduce) M.anim(cD, [box, to], { duration: 300, easing: EASE.std });
    Object.assign(cD.style, to); box = to;
  }
  F.show = (el, me, ms, how = 'up', quiet = el.classList.contains('speech')) => M.wait(ms).then(() => { if (me !== F.run) return; el.style.opacity = 1; if (!quiet) SND.appear();
    return how === 'pop' ? M.popIn(el) : M.fadeUp(el, 10, 220); });
  F.talk = async (ms, me) => { const V = [5, 3, 6, 4, 8, 3, 5, 1, 6, 4]; d.boolean('talking').value = true; d.number('amp').value = 40;
    for (let t = 0, i = 0; t < ms && me === F.run; t += 95, i++) { d.number('viseme').value = V[i % V.length]; await M.wait(95); } d.boolean('talking').value = false; d.number('amp').value = 0; };
  // pick one option: it turns violet and punches, the others dim, the main button wakes up
  F.choose = (el, opts, onPick) => { const go = el.querySelector('.obbot .btn');
    opts.forEach((o, i) => M.pressable(o, () => {
      opts.forEach((x) => { x.classList.remove('sel'); x.style.opacity = x === o ? 1 : 0.55; x._setRest(0); const c = x.querySelector('.ck'); if (c) c.style.opacity = 0; });
      o.classList.add('sel'); o._setRest(1); M.punch(o, 1.04); const ck = o.querySelector('.ck'); if (ck) { ck.style.opacity = 1; M.popIn(ck); M.pop(ck, VIOLET); }
      if (go.classList.contains('disabled')) { go.classList.replace('disabled', 'primary'); M.wait(T.colour).then(() => M.shine(go)); }
      if (onPick) onPick(o, i);
    })); };
  F.go = (name, dir) => {
    const def = F.S[name], me = ++F.run, old = stage.lastElementChild;
    if (dir == null) dir = F.cur && F.order.indexOf(name) < F.order.indexOf(F.cur) ? -1 : 1;
    if (F.cur === 'listen') { SND.mic(false, name !== 'heard'); VOICE.close(); }
    if (old && F.cur !== 'listen' && !SND.busy) SND.play(dir < 0 ? 'back' : 'next');
    F.cur = name; if (window.APP) window.APP.ob = name;                                             // for the checks: which screen is up
    d.enum('gesture').value = 'none'; d.enum('mood').value = 'smirk'; d.boolean('listening').value = false; d.boolean('talking').value = false; d.number('amp').value = 0;
    const el = document.createElement('div'); el.className = 'obscr' + (def.bar != null ? ' bar' : ''); el.dataset.s = name; el.innerHTML = def.html(); stage.appendChild(el);
    el.querySelectorAll('.btn').forEach((b) => M.pressable(b));
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener(b.classList.contains('btn') ? 'pointerup' : 'click', () => { if (b.classList.contains('disabled')) M.shake(b, 4, T.shakeSmall); else F.go(b.dataset.go); }));
    setBar(def.bar);
    if (old) M.anim(old, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-90 * dir}px 0` }], { duration: 180, easing: EASE.in, fill: 'forwards' }).then(() => old.remove());
    if (old && !M.reduce) el.querySelectorAll('[data-in]').forEach((p, i) => { SND.appear(120 + i * T.stagger, () => me === F.run); M.anim(p, [{ opacity: 0, translate: `${70 * dir}px 0` }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, delay: (120 + i * T.stagger) * M.slow, fill: 'backwards' }); });
    moveDombi(el.querySelector('.dph'), !!old);
    const sp = el.querySelector('.speech'); if (sp) { F.show(sp, me, old ? 380 : 300, 'pop');
      M.wait(old ? 380 : 300).then(() => { if (me === F.run && !DOMBI.talk(d, sp.textContent, () => me === F.run) && !SND.busy) SND.play('pop', { volume: 0.6 }); }); }
    if (def.enter) def.enter(el, me);
  };
  root.querySelector('#obback').onclick = () => { const back = F.S[F.cur].back || F.order[F.order.indexOf(F.cur) - 1]; if (back) F.go(back, -1); };
  F.end = () => { F.run++; VOICE.close(); People.home(); };
  return F;
}

export function onboarding(ctx) {
  return new Promise((finish) => {
    const F = frame(ctx), d = F.d, out = { goal: null, level: null, confidence: null, micOk: false, saveVoice: false, reminder: null, method: null };
    const done = (v) => { F.end(); finish(v); };
    F.order = ['welcome', 'login', 'meet', 'goal', 'level', 'achieve', 'confidence', 'mic', 'listen', 'heard', 'promise', 'reminder'];
    const add = (name, def) => { F.S[name] = def; };
    // ---------- 1 · Welcome ----------
    add('welcome', { bar: null,
      html: () => `<div class="obmid" style="gap:18px"><span class="dph" style="width:213px;height:213px"></span><div class="obtitle" style="opacity:0">Akademiya English</div>
        <div class="obsub" style="opacity:0;width:300px">Ingliz tilida gapirishni birinchi kundanoq boshlang.</div></div>
        <div class="obbot" style="opacity:0">${btn('BOSHLASH', 'primary', 'data-go="meet"')}${btn('KIRISH', 'secondary', 'data-go="login"')}</div>`,
      async enter(el, me) { d.boolean('hidden').value = true; await M.wait(80); if (me !== F.run) return;
        d.boolean('hidden').value = false; d.enum('gesture').value = 'wave'; SND.play('pop');
        F.show(el.querySelector('.obtitle'), me, 300); F.show(el.querySelector('.obsub'), me, 420); F.show(el.querySelector('.obbot'), me, 560);
        M.wait(950).then(() => { if (me === F.run) M.shine(el.querySelector('.btn.primary')); }); M.wait(1800).then(() => { if (me === F.run) d.enum('gesture').value = 'none'; }); } });
    // ---------- 1L · Log in (and 1L·b, the sheet when there is no such account) ----------
    add('login', { bar: null, back: 'welcome',
      html: () => `<div class="obtop"><img class="obback2" src="${ICON}glyph-chevron-left-grey.png" alt=""></div>
        <div class="obmid" style="gap:14px;padding:0 24px"><span class="dph" style="width:150px;height:150px"></span><div class="h24" data-in>Qaytganingizdan xursandman!</div>
        <div class="p15" data-in>Hisobingizga kiring — natijalaringiz shu yerda kutyapti.</div></div>
        <div class="obbot" data-in>${signins()}<button class="oblink violet" data-go="meet">HISOBIM YO'Q — BOSHIDAN BOSHLASH</button></div>
        <div class="obdim"></div><div class="obsheet"><div class="grab"></div><span class="dbox"></span><b>Bu hisob hali yo'q</b><p></p>${btn('YANGIDAN BOSHLASH', 'primary', 'id="fresh"')}${btn('BOSHQA USULDA KIRISH', 'secondary', 'id="other"')}</div>`,
      enter(el, me) { d.enum('mood').value = 'happy';
        el.querySelector('.obback2').onclick = () => F.go('welcome', -1);
        const dim = el.querySelector('.obdim'), sheet = el.querySelector('.obsheet'); let open = false, method = null;
        const up = () => { open = true; dim.style.pointerEvents = 'auto'; SND.play('whoosh'); M.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
          M.anim(sheet, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] : [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' });
          const dd = People.dombi; d.enum('mood').value = 'think'; M.wait(320).then(() => { if (me === F.run && open) { dombiInto(People.canvas.dombi, sheet.querySelector('.dbox'), 110); dd.enum('mood').value = 'smirk'; } }); };
        const down = () => { if (!open) return; open = false; dim.style.pointerEvents = 'none'; SND.play('close'); M.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
          M.anim(sheet, [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' });
          const cD = People.canvas.dombi; F.root.appendChild(cD); cD.style.cssText = ''; cD.id = 'fxDombi'; moveDombi2(el); d.enum('mood').value = 'happy'; };
        const moveDombi2 = (e) => { const h = e.querySelector('.dph'), cD = People.canvas.dombi, p = ctx.phone.getBoundingClientRect(), r = h.getBoundingClientRect(), k = ctx.phone.offsetWidth / p.width, f = dombiFit(r.width * k);
          Object.assign(cD.style, { position: 'absolute', opacity: 1, left: (r.left - p.left) * k + f.dx + 'px', top: (r.top - p.top) * k + f.dy + 'px', width: f.size + 'px', height: f.size + 'px' }); };
        el.querySelectorAll('.signin').forEach((b) => M.pressable(b, () => { method = b.dataset.m; M.pop(b, VIOLET);
          if (ctx.hasAccount && ctx.hasAccount(method)) { d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate'; SND.play('right'); M.wait(700).then(() => { if (me === F.run) done({ loggedIn: method }); }); return; }
          sheet.querySelector('p').textContent = `Bu ${NAMES[method]} bilan hali hech kim ro'yxatdan o'tmagan. Yangidan boshlaymizmi? Hisobni birinchi darsdan keyin shu ${NAMES[method]} bilan yaratamiz.`; up(); }));
        dim.onclick = down; el.querySelector('#other').addEventListener('pointerup', down);
        el.querySelector('#fresh').addEventListener('pointerup', () => { out.method = method; open = false; dim.style.pointerEvents = 'none'; const cD = People.canvas.dombi; F.root.appendChild(cD); cD.style.cssText = ''; cD.id = 'fxDombi'; F.go('meet'); }); } });
    // ---------- 1b · Meet Dombi ----------
    add('meet', { bar: null, back: 'welcome',
      html: () => `<div class="obmid" style="gap:10px"><div class="speech solo" style="opacity:0">Salom! Men Dombiman.</div><span class="dph" style="width:238px;height:238px"></span></div>
        <div class="obbot" data-in>${btn('DAVOM ETISH', 'primary', 'data-go="goal"')}</div>`,
      async enter(el, me) { await M.wait(480); if (me !== F.run) return; if (DOMBI.voice === 'off') await F.talk(1200, me); else await M.wait(1200);
        if (me === F.run) d.enum('mood').value = 'happy'; } });
    // ---------- 2 · Goal ----------
    const GOALS = [['school', 'backpack', 'Maktab'], ['ielts', 'notepad', 'IELTS'], ['travel', 'plane', 'Sayohat'], ['work', 'briefcase', 'Ish'], ['self', 'heart', 'O\'zim uchun']];
    add('goal', { bar: 0,
      html: () => `<div class="obbody">${guide('Ingliz tili sizga nima uchun kerak?')}<div class="opts">${GOALS.map(([k, ic, l]) =>
          `<button class="p3d tile gopt" data-k="${k}" data-in><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${l}</span><span class="ck"><img src="${ICON}glyph-check-white.png" alt=""></span></span></button>`).join('')}</div></div>
        <div class="obbot" data-in>${btn('DAVOM ETISH', 'disabled', 'data-go="level"')}</div>`,
      enter(el) { F.choose(el, [...el.querySelectorAll('.gopt')], (o) => { out.goal = o.dataset.k; d.enum('mood').value = 'happy'; }); } });
    // ---------- 3 · Your level ----------
    add('level', { bar: 1,
      html: () => `<div class="obbody">${guide('Ingliz tilini qanchalik bilasiz?')}<div class="opts" style="gap:12px">${[['new', 'sprout', 'Men yangiman', 'Ingliz tilini noldan boshlayman'], ['some', 'plant', 'Biroz bilaman', 'Baribir 1-bo\'limdan — tez o\'tasiz']].map(([k, ic, t, b]) =>
          `<button class="p3d tile gopt lvl" data-k="${k}" data-in><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${t}<small>${b}</small></span></span></button>`).join('')}</div></div>
        <div class="obbot" data-in>${btn('DAVOM ETISH', 'disabled', 'data-go="achieve"')}</div>`,
      enter(el) { F.choose(el, [...el.querySelectorAll('.gopt')], (o) => { out.level = o.dataset.k; M.punch(o.querySelector('img'), 1.25, 240); d.enum('mood').value = 'happy'; }); } });
    // ---------- 4 · What you'll achieve ----------
    add('achieve', { bar: 2,
      html: () => `<div class="obbody">${guide('30 kunda mana shularga erishasiz!')}${[['coffee-kafeda', 'Kafeda buyurtma bera olasiz', 'Salomlashish, buyurtma, narx so\'rash'], ['bubble-phrases', '40+ iborani ayta olasiz', 'Ovoz chiqarib, o\'z talaffuzingiz bilan'],
          ['flame-streak', 'Har kungi odat hosil qilasiz', 'Kuniga 10 daqiqa, mehribon eslatmalar']].map(([ic, t, b]) => `<div class="outcome" style="opacity:0"><img src="${ICON}${ic}.png" alt=""><span><b>${t}</b><small>${b}</small></span></div>`).join('')}</div>
        <div class="obbot" data-in>${btn('DAVOM ETISH', 'primary', 'data-go="confidence"')}</div>`,
      async enter(el, me) { d.enum('mood').value = 'proud';
        for (const [i, o] of [...el.querySelectorAll('.outcome')].entries()) { await M.wait(i ? 260 : 650); if (me !== F.run) return; o.style.opacity = 1; M.popIn(o, { duration: 260 }); SND.appear(); M.wait(140).then(() => M.punch(o.querySelector('img'), 1.3, 240)); }
        await M.wait(400); if (me === F.run) M.shine(el.querySelector('.obbot .btn')); } });
    // ---------- 5 · Confidence survey ----------
    add('confidence', { bar: 3,
      html: () => `<div class="obbody">${guide('Ingliz tilida gapirganda o\'zingizga qanchalik ishonasiz?')}<div class="opts">${[['face-pleading', 'Umuman ishonmayman'], ['face-dizzy', 'Biroz qo\'rqaman'], ['face-smile', 'O\'rtacha'], ['face-grin', 'Ancha ishonaman'],
          ['face-starstruck', 'Juda ishonaman']].map(([ic, l], i) => `<button class="p3d tile gopt conf" data-in><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${l}</span><span class="num">${i + 1}</span></span></button>`).join('')}</div></div>
        <div class="obbot" data-in>${btn('DAVOM ETISH', 'disabled', 'data-go="mic"')}</div>`,
      enter(el) { F.choose(el, [...el.querySelectorAll('.gopt')], (o, i) => { out.confidence = i + 1; M.punch(o.querySelector('img'), 1.35, 260); d.enum('mood').value = ['wink', 'smirk', 'happy', 'happy', 'laugh'][i]; }); } });
    // ---------- 6 · Mic explainer: the browser asks for the mic here, as the phone will ----------
    add('mic', { bar: 4,
      html: () => `<div class="obmid" style="gap:18px"><span class="dph" style="width:190px;height:190px"><span class="micbadge" style="opacity:0"><i></i><img src="${ICON}studio-mic.png" alt=""></span></span>
        <div class="h24" data-in>Mikrofonni yoqamiz</div><div class="p15" data-in>Mashqlarda ovoz chiqarib gapirasiz. Javobingizni eshitishim uchun mikrofon kerak.</div></div>
        <div class="obbot" data-in>${btn('MIKROFONNI YOQISH', 'primary', 'id="micOn"')}<button class="oblink" id="micLater">HOZIR EMAS</button></div>`,
      async enter(el, me) { const badge = el.querySelector('.micbadge'); el.querySelector('#micLater').onclick = () => { out.micOk = false; F.go('promise'); };
        let glow = { cancel() {} };
        el.querySelector('#micOn').addEventListener('pointerup', async function ask() {
          glow.cancel(); M.pop(badge, CORAL); M.punch(badge, 1.2, 220);
          const ok = window.APP_TEST ? true : await VOICE.open(); if (me !== F.run) return;
          if (ok) { out.micOk = true; d.enum('mood').value = 'happy'; await M.wait(420); if (me === F.run) F.go('listen'); return; }
          const again = ctx.micBlocked ? await ctx.micBlocked() : 'continue'; if (me !== F.run) return;
          if (again === 'retry') return ask(); out.micOk = false; F.go('promise'); });
        await F.show(badge, me, 480, 'pop'); if (me !== F.run) return; glow = M.glow(badge.querySelector('i')); } });
    // ---------- 7 · Mic check: Dombi listens for a real "Hello!" ----------
    add('listen', { bar: 5,
      html: () => `<div class="obmid" style="gap:16px"><div class="h26" data-in>Menga “Hello!” deng</div><span class="dph" style="width:190px;height:190px"></span>
        <div class="vbars" data-in>${'<i></i>'.repeat(7)}</div><div class="p15" style="font-size:14px;font-weight:800" data-in>Tinglayapman…</div></div>
        <div class="obbot" data-in>${btn('DAVOM ETISH', 'disabled')}<button class="oblink" data-go="promise">HOZIR GAPIRA OLMAYMAN</button></div>`,
      enter(el, me) { const draw = voiceBars([...el.querySelectorAll('.vbars i')], 40); d.boolean('listening').value = true; SND.mic(true); let turn = 0;
        const show = (level, bands) => { d.number('amp').value = level * 100; draw(level, bands); };
        const hear = (real) => { const mine = ++turn;
          hearVoice({ n: 5, ms: 1100, real, keep: true, alive: () => me === F.run && mine === turn, onLevel: show }).then((got) => { if (me !== F.run || mine !== turn) return;
            if (got === 'heard') F.go('heard'); else if (real) hear(true); }); };
        show(0, []);
        if (window.APP_TEST) M.wait(900).then(() => { if (me === F.run) hear(false); });                       // the checks have no mic: a made-up "Hello!"
        else VOICE.open().then((ok) => { if (me === F.run) { if (ok) hear(true); else F.go('promise'); } }); } });
    // ---------- 7b · Heard you ----------
    add('heard', { bar: 5, back: 'mic',
      html: () => `<div class="obmid" style="gap:16px"><span class="dph" style="width:170px;height:170px"></span><div class="h26" style="opacity:0">Zo'r! Sizni eshitdim</div>
        <div class="hello" style="opacity:0"><img src="${ICON}glyph-check-green.png" alt="">“Hello!”</div><div class="p15" style="opacity:0">Mikrofon ishlayapti — endi gapirib o'rganamiz.</div></div>
        <div class="obbot" style="opacity:0">${btn('DAVOM ETISH', 'primary', 'data-go="promise"')}</div>`,
      async enter(el, me) { d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate';
        F.show(el.querySelector('.h26'), me, 150, 'pop'); await F.show(el.querySelector('.hello'), me, 320, 'pop', true); if (me !== F.run) return; M.pop(el.querySelector('.hello'), GREEN); SND.play('right');
        F.show(el.querySelector('.p15'), me, 140); F.show(el.querySelector('.obbot'), me, 280); M.wait(700).then(() => { if (me === F.run) M.shine(el.querySelector('.obbot .btn')); }); } });
    // ---------- 8 · Dombi's promise (two equal buttons) ----------
    add('promise', { bar: 6, back: 'mic',
      html: () => `<div class="obbody">${guide('Ovozingiz faqat sizniki. Va\'da beraman:')}${[['lock', 'Faqat siz eshitasiz', 'Hech kim — hatto biz ham — tinglamaydi'], ['trash', 'Istalgan vaqtda o\'chirasiz', 'Sozlamalar → Ovoz yozuvlari'],
          ['sparkles', 'Taraqqiyotingizni eshitasiz', '1-kun va 30-kun ovozingizni solishtiring']].map(([ic, t, b]) => `<div class="promise" style="opacity:0"><span class="tile"><img src="${ICON}glyph-${ic}-violet.png" alt=""></span><span><b>${t}</b><small>${b}</small></span></div>`).join('')}</div>
        <div class="obbot" data-in>${btn('OVOZIMNI SAQLASH', 'primary', 'id="keep"')}${btn('SAQLAMASDAN DAVOM ETISH', 'secondary', 'id="nokeep"')}</div>`,
      async enter(el, me) { el.querySelector('#keep').addEventListener('pointerup', () => { out.saveVoice = true; F.go('reminder'); }); el.querySelector('#nokeep').addEventListener('pointerup', () => { out.saveVoice = false; F.go('reminder'); });
        for (const [i, r] of [...el.querySelectorAll('.promise')].entries()) { await M.wait(i ? 150 : 650); if (me !== F.run) return; r.style.opacity = 1; M.fadeUp(r, 10, 220); M.popIn(r.querySelector('.tile'), { duration: 260 }); SND.appear(); } } });
    // ---------- 9 · Reminder time ----------
    add('reminder', { bar: 7,
      html: () => `<div class="obbody">${guide('Har kuni soat nechada eslatay? Kuniga bir martagina eslataman.')}<div class="wheelwrap" data-in><div class="wheel"><div class="sel"></div><div class="list"></div></div></div></div>
        <div class="obbot" data-in>${btn('ESLATMANI YOQISH', 'primary', 'id="remOn"')}<button class="oblink" id="remLater">HOZIR EMAS</button></div>`,
      enter(el, me) { const wheel = el.querySelector('.wheel'), k = ctx.phone.getBoundingClientRect().width / ctx.phone.offsetWidth, w = timeWheel(wheel, DAY, DAY.indexOf('19:00'), k);
        el.querySelector('#remLater').onclick = () => { out.reminder = null; done(out); };
        el.querySelector('#remOn').addEventListener('pointerup', async () => { out.reminder = DAY[w.idx]; M.punch(wheel.querySelector('.sel'), 1.05, 200); M.punch(w.opts[w.idx], 1.15, 220); M.pop(wheel.querySelector('.sel'), VIOLET); d.enum('mood').value = 'happy'; SND.play('reminder');
          await M.wait(480); if (me === F.run) done(out); }); } });
    F.go('welcome');
  });
}

// ---------- 10 · What should Dombi call you? Then save the account (after Lesson 1) ----------
export function createAccount(ctx, { method } = {}) {
  return new Promise((finish) => {
    const F = frame(ctx), d = F.d; F.order = ['name'];
    F.S.name = { bar: null,
      html: () => `<div class="obbody">${guide('Sizni nima deb chaqiray?')}<input class="namefield" data-in placeholder="Ismingiz" autocomplete="off" spellcheck="false" maxlength="24"><div class="lbl12" data-in>KEYIN HISOBNI SAQLANG:</div>
        ${signins(method)}</div><div class="obbot" data-in><button class="oblink" id="later">KEYINROQ</button></div>`,
      async enter(el, me) { const f = el.querySelector('.namefield'); let said = '';
        const sayName = async () => { const n = f.value.trim(); if (!n || n === said) return; said = n; await (DOMBI.talk(d, n, () => me === F.run) || F.talk(520, me)); if (me === F.run) d.enum('mood').value = 'happy'; };
        f.onblur = sayName; f.onkeydown = (e) => { if (e.key === 'Enter') f.blur(); };
        const end = (signIn) => { F.end(); finish({ name: f.value.trim() || null, signIn }); };
        el.querySelectorAll('.signin').forEach((b) => M.pressable(b, async () => { M.pop(b, GREEN); d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate'; SND.play('right'); sayName();
          await M.wait(900); if (me === F.run) end(b.dataset.m); }));
        el.querySelector('#later').onclick = () => end(null);
        if (method) { const first = el.querySelector(`.signin[data-m="${method}"]`); M.wait(900).then(() => { if (me === F.run && first) M.shine(first); }); }
        await M.wait(700); if (me === F.run && !window.APP_TEST) f.focus({ preventScroll: true }); } };
    F.go('name');
  });
}
