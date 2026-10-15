// Onboarding flow: the frame (screen changes, step bar, one travelling Dombi) and screens 1, 1b, 2, 3, 4, 5.
// onboarding2.js adds screens 6-10 and starts the flow.
const OB = { S: {}, order: ['welcome', 'meet', 'goal', 'level', 'achieve', 'confidence', 'mic', 'listen', 'heard', 'promise', 'reminder', 'name'], run: 0, cur: null };
OB.add = (name, def) => { OB.S[name] = def; };
OB.btn = (label, cls = 'primary', attr = '') => `<button class="p3d btn ${cls}" ${attr}><span class="face">${label}</span></button>`;
OB.guide = (text) => `<div class="guide"><span class="dph" style="width:80px;height:80px"></span><div class="speech" style="opacity:0">${text}</div></div>`;
OB.show = (el, me, ms, how = 'up', quiet = el.classList.contains('speech')) => M.wait(ms).then(() => { if (me !== OB.run) return; el.style.opacity = 1; if (!quiet) SND.appear();   // quiet: the thing has its own sound
    return how === 'pop' ? M.popIn(el) : M.fadeUp(el, 10, 220); });
// Dombi's mouth for a line of about `ms`
OB.talk = async (ms, me) => { const d = OB.dombi, V = [5, 3, 6, 4, 8, 3, 5, 1, 6, 4]; d.boolean('talking').value = true; d.number('amp').value = 40;
  for (let t = 0, i = 0; t < ms && me === OB.run; t += 95, i++) { d.number('viseme').value = V[i % V.length]; await M.wait(95); } d.boolean('talking').value = false; d.number('amp').value = 0; };
// pick one option: it turns violet and punches, the others dim, the main button wakes up
OB.choose = (el, opts, onPick) => { const go = $('.obbot .btn', el);
  opts.forEach((o, i) => M.pressable(o, () => {
    opts.forEach((x) => { x.classList.remove('sel'); x.style.opacity = x === o ? 1 : 0.55; x._setRest(0); const c = $('.ck', x); if (c) c.style.opacity = 0; });
    o.classList.add('sel'); o._setRest(1); M.punch(o, 1.04); const ck = $('.ck', o); if (ck) { ck.style.opacity = 1; M.popIn(ck); M.pop(ck, VIOLET); }
    if (go.classList.contains('disabled')) { go.classList.replace('disabled', 'primary'); M.wait(T.colour).then(() => M.shine(go)); }
    if (onPick) onPick(o, i);
  })); };

OB.start = async () => {
  const phone = $('#phone'), stage = $('#obstage'), bar = $('#obbar'), steps = $$('#obbar .steps i'), cD = $('#fxDombi');
  const d = OB.dombi = await M.rive(cD, 'Dombi', 'Dombi');
  const setDark = () => { d.boolean('dark').value = document.body.classList.contains('dark'); }; setDark(); document.addEventListener('lab-dark', setDark);
  let barAt = null, box = null;
  function setBar(idx) {
    M.anim(bar, [{ opacity: getComputedStyle(bar).opacity }, { opacity: idx == null ? 0 : 1 }], { duration: 150, fill: 'forwards' }); bar.style.pointerEvents = idx == null ? 'none' : 'auto';
    if (idx == null) { barAt = null; return; }
    steps.forEach((s, i) => { const w = i === idx ? 40 : 24, c = i <= idx ? 'var(--violet)' : 'var(--grey)', ow = s.style.width || '24px', oc = s.style.background || 'var(--grey)';
      s.style.width = w + 'px'; s.style.background = c;
      if (barAt != null && (ow !== w + 'px' || oc !== c)) M.anim(s, [{ width: ow, background: oc }, { width: w + 'px', background: c }], { duration: 260, easing: EASE.std }).then(() => { if (i === idx) M.shine(s); }); });
    barAt = idx;
  }
  function moveDombi(holder, animate) {                                     // one Dombi for the whole flow: he glides to his next place
    if (!holder) { cD.style.opacity = 0; box = null; return; }
    const p = phone.getBoundingClientRect(), r = holder.getBoundingClientRect(), k = phone.offsetWidth / p.width;
    const f = dombiFit(r.width * k), to = { left: (r.left - p.left) * k + f.dx + 'px', top: (r.top - p.top) * k + f.dy + 'px', width: f.size + 'px', height: f.size + 'px' };
    cD.style.opacity = 1;
    if (animate && box && !M.reduce) M.anim(cD, [box, to], { duration: 300, easing: EASE.std });
    Object.assign(cD.style, to); box = to;
  }
  OB.go = (name, dir) => {
    const def = OB.S[name], me = ++OB.run, old = stage.lastElementChild;
    if (dir == null) dir = OB.cur && OB.order.indexOf(name) < OB.order.indexOf(OB.cur) ? -1 : 1;
    if (OB.cur === 'listen') { SND.mic(false, name !== 'heard'); VOICE.close(); }                            // leaving the mic check closes the mic (with its sound only when it heard you)
    if (old && OB.cur !== 'listen' && !SND.busy) SND.play(dir < 0 ? 'back' : 'next');           // not after the mic check (the mic's own sounds speak) and not over the reminder preview
    OB.cur = name; $$('#side [data-s]').forEach((b) => b.classList.toggle('on', b.dataset.s === name));
    d.enum('gesture').value = 'none'; d.enum('mood').value = 'smirk'; d.boolean('listening').value = false; d.boolean('talking').value = false; d.number('amp').value = 0;
    const el = document.createElement('div'); el.className = 'obscr' + (def.bar != null ? ' bar' : ''); el.innerHTML = def.html(); stage.appendChild(el);
    $$('.btn', el).forEach((b) => M.pressable(b));
    $$('[data-go]', el).forEach((b) => b.addEventListener(b.classList.contains('btn') ? 'pointerup' : 'click', () => { if (b.classList.contains('disabled')) M.shake(b, 4, T.shakeSmall); else OB.go(b.dataset.go); }));
    setBar(def.bar);
    if (old) M.anim(old, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-90 * dir}px 0` }], { duration: 180, easing: EASE.in, fill: 'forwards' }).then(() => old.remove());
    if (old && !M.reduce) $$('[data-in]', el).forEach((p, i) => { SND.appear(120 + i * T.stagger, () => me === OB.run); M.anim(p, [{ opacity: 0, translate: `${70 * dir}px 0` }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, delay: (120 + i * T.stagger) * M.slow, fill: 'backwards' }); });
    moveDombi($('.dph', el), !!old);
    const sp = $('.speech', el); if (sp) { OB.show(sp, me, old ? 380 : 300, 'pop');                // Dombi says his bubble as it appears (or it pops, when his voice is off)
      M.wait(old ? 380 : 300).then(() => { if (me === OB.run && !DOMBI.talk(d, sp.textContent, () => me === OB.run) && !SND.busy) SND.play('pop', { volume: 0.6 }); }); }
    if (def.enter) def.enter(el, me);
  };
  $('#obback').onclick = () => { const i = OB.order.indexOf(OB.cur); if (i > 0) OB.go(OB.order[i - 1], -1); };
  $$('#side [data-s]').forEach((b) => b.onclick = () => OB.go(b.dataset.s));
  await M.initPop(); OB.go('welcome'); window.labReady = true;
};

// ---------- 1 · Welcome ----------
OB.add('welcome', { bar: null,
  html: () => `<div class="obmid" style="gap:18px"><span class="dph" style="width:213px;height:213px"></span><div class="obtitle" style="opacity:0">Akademiya English</div>
    <div class="obsub" style="opacity:0;width:300px">Ingliz tilida gapirishni birinchi kundanoq boshlang.</div></div>
    <div class="obbot" style="opacity:0">${OB.btn('BOSHLASH', 'primary', 'data-go="meet"')}${OB.btn('KIRISH', 'secondary')}</div>`,
  async enter(el, me) { const d = OB.dombi; d.boolean('hidden').value = true; await M.wait(80); if (me !== OB.run) return;
    d.boolean('hidden').value = false; d.enum('gesture').value = 'wave'; SND.play('pop');         // he pops up and waves
    OB.show($('.obtitle', el), me, 300); OB.show($('.obsub', el), me, 420); OB.show($('.obbot', el), me, 560);
    M.wait(950).then(() => { if (me === OB.run) M.shine($('.btn.primary', el)); }); M.wait(1800).then(() => { if (me === OB.run) d.enum('gesture').value = 'none'; }); } });
// ---------- 1b · Meet Dombi ----------
OB.add('meet', { bar: null,
  html: () => `<div class="obmid" style="gap:10px"><div class="speech solo" style="opacity:0">Salom! Men Dombiman.</div><span class="dph" style="width:238px;height:238px"></span></div>
    <div class="obbot" data-in>${OB.btn('DAVOM ETISH', 'primary', 'data-go="goal"')}</div>`,
  async enter(el, me) { await M.wait(480); if (me !== OB.run) return; if (DOMBI.voice === 'off') await OB.talk(1200, me); else await M.wait(1200);   // with a voice, the bubble itself makes him talk
    if (me === OB.run) OB.dombi.enum('mood').value = 'happy'; } });
// ---------- 2 · Goal ----------
OB.add('goal', { bar: 0,
  html: () => `<div class="obbody">${OB.guide('Ingliz tili sizga nima uchun kerak?')}<div class="opts">${[['backpack', 'Maktab'], ['notepad', 'IELTS'], ['plane', 'Sayohat'], ['briefcase', 'Ish'], ['heart', 'O\'zim uchun']].map(([ic, l]) =>
      `<button class="p3d tile gopt" data-in><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${l}</span><span class="ck"><img src="${ICON}glyph-check-white.png" alt=""></span></span></button>`).join('')}</div></div>
    <div class="obbot" data-in>${OB.btn('DAVOM ETISH', 'disabled', 'data-go="level"')}</div>`,
  enter(el) { OB.choose(el, $$('.gopt', el), () => { OB.dombi.enum('mood').value = 'happy'; }); } });
// ---------- 3 · Your level ----------
OB.add('level', { bar: 1,
  html: () => `<div class="obbody">${OB.guide('Ingliz tilini qanchalik bilasiz?')}<div class="opts" style="gap:12px">${[['sprout', 'Men yangiman', 'Ingliz tilini noldan boshlayman'], ['plant', 'Biroz bilaman', 'Baribir 1-bo\'limdan — tez o\'tasiz']].map(([ic, t, b]) =>
      `<button class="p3d tile gopt lvl" data-in><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${t}<small>${b}</small></span></span></button>`).join('')}</div></div>
    <div class="obbot" data-in>${OB.btn('DAVOM ETISH', 'disabled', 'data-go="achieve"')}</div>`,
  enter(el) { OB.choose(el, $$('.gopt', el), (o) => { M.punch($('img', o), 1.25, 240); OB.dombi.enum('mood').value = 'happy'; }); } });
// ---------- 4 · What you'll achieve ----------
OB.add('achieve', { bar: 2,
  html: () => `<div class="obbody">${OB.guide('30 kunda mana shularga erishasiz!')}${[['coffee-kafeda', 'Kafeda buyurtma bera olasiz', 'Salomlashish, buyurtma, narx so\'rash'], ['bubble-phrases', '40+ iborani ayta olasiz', 'Ovoz chiqarib, o\'z talaffuzingiz bilan'],
      ['flame-streak', 'Har kungi odat hosil qilasiz', 'Kuniga 10 daqiqa, mehribon eslatmalar']].map(([ic, t, b]) => `<div class="outcome" style="opacity:0"><img src="${ICON}${ic}.png" alt=""><span><b>${t}</b><small>${b}</small></span></div>`).join('')}</div>
    <div class="obbot" data-in>${OB.btn('DAVOM ETISH', 'primary', 'data-go="confidence"')}</div>`,
  async enter(el, me) { OB.dombi.enum('mood').value = 'proud';                                  // the three outcomes drop in one by one, each icon bounces
    for (const [i, o] of $$('.outcome', el).entries()) { await M.wait(i ? 260 : 650); if (me !== OB.run) return; o.style.opacity = 1; M.popIn(o, { duration: 260 }); SND.appear(); M.wait(140).then(() => M.punch($('img', o), 1.3, 240)); }
    await M.wait(400); if (me === OB.run) M.shine($('.obbot .btn', el)); } });
// ---------- 5 · Confidence survey ----------
OB.add('confidence', { bar: 3,
  html: () => `<div class="obbody">${OB.guide('Ingliz tilida gapirganda o\'zingizga qanchalik ishonasiz?')}<div class="opts">${[['face-pleading', 'Umuman ishonmayman'], ['face-dizzy', 'Biroz qo\'rqaman'], ['face-smile', 'O\'rtacha'], ['face-grin', 'Ancha ishonaman'],
      ['face-starstruck', 'Juda ishonaman']].map(([ic, l], i) => `<button class="p3d tile gopt conf" data-in><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${l}</span><span class="num">${i + 1}</span></span></button>`).join('')}</div></div>
    <div class="obbot" data-in>${OB.btn('DAVOM ETISH', 'disabled', 'data-go="mic"')}</div>`,
  enter(el) { OB.choose(el, $$('.gopt', el), (o, i) => { M.punch($('img', o), 1.35, 260); OB.dombi.enum('mood').value = ['wink', 'smirk', 'happy', 'happy', 'laugh'][i]; }); } });   // Dombi answers the mood, never sad
