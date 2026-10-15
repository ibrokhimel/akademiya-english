// Five whole screens: onboarding goal (2), can say (17), result (18), checkpoint result (22), level up (23).
(async () => {
  const phone = $('#phone'), screen = $('#screen');
  const [conf, dombi, rings, dust, twk] = await Promise.all([M.rive($('#fxConf'), 'FX Confetti'), M.rive($('#fxDombi'), 'Dombi', 'Dombi'),
    M.rive($('#fxRings'), 'FX Rings'), M.rive($('#fxDust'), 'FX Dust'), M.rive($('#fxTwk'), 'FX Twinkle')]);
  const setDark = () => { dombi.boolean('dark').value = document.body.classList.contains('dark'); }; setDark(); document.addEventListener('lab-dark', setDark);
  let run = 0;
  // put an effect canvas over an element of the screen (the phone is scaled, so work in phone units)
  const at = (canvas, holder, w, h, dy = 0) => { const p = phone.getBoundingClientRect(), r = holder.getBoundingClientRect(), k = phone.offsetWidth / p.width;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.style.left = ((r.left - p.left + r.width / 2) * k - w / 2) + 'px'; canvas.style.top = ((r.top - p.top + r.height / 2) * k - h / 2 + dy) + 'px'; canvas.style.opacity = 1; };
  const hideFx = () => [$('#fxDombi'), $('#fxRings'), $('#fxDust'), $('#fxTwk')].forEach((c) => { c.style.opacity = 0; });
  const fire = (vm, name = 'fire') => { if (!M.reduce) vm.trigger(name).trigger(); };
  const btn = (label, cls = 'primary') => `<button class="p3d btn ${cls} go"><span class="face">${label}</span></button>`;
  const mount = (html, cls = '') => { run++; hideFx(); dombi.enum('gesture').value = 'none'; dombi.enum('mood').value = 'smirk';
    screen.innerHTML = `<div class="scr ${cls}"><div class="status">9:41</div>${html}</div>`; $$('.btn', screen).forEach((b) => M.pressable(b)); return run; };
  const playBars = async (b) => { const bars = $('.bars', b), img = $('img', b); if (!bars || b._p) return; b._p = true; img.style.opacity = 0; bars.style.opacity = 1; const w = M.waves(bars);
    await M.wait(1200); w.forEach((a) => a.cancel()); bars.style.opacity = 0; img.style.opacity = 1; b._p = false; };

  const SCREENS = {
    // ---------- 2 · choose a goal ----------
    async goal() {
      const OPTS = [['backpack', 'Maktab'], ['notepad', 'IELTS'], ['plane', 'Sayohat'], ['briefcase', 'Ish'], ['heart', 'O\'zim uchun']];
      const me = mount(`<div class="obar"><img src="${ICON}glyph-chevron-left-muted.png" alt=""><div class="steps">${'<i></i>'.repeat(9)}</div></div>
        <div class="obody"><div class="guide"><span class="dph" style="width:80px;height:80px"></span><div class="speech" style="opacity:0">Ingliz tili sizga nima uchun kerak?</div></div>
        <div class="opts">${OPTS.map(([ic, l]) => `<button class="p3d tile gopt" style="opacity:0"><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${l}</span><span class="ck"><img src="${ICON}glyph-check-white.png" alt=""></span></span></button>`).join('')}</div></div>
        <div class="bot">${btn('DAVOM ETISH', 'disabled')}</div>`);
      const step = $('.steps i', screen), opts = $$('.gopt', screen), go = $('.go', screen);
      step.style.background = 'var(--violet)'; step.style.width = '40px';
      M.anim(step, [{ width: '24px', background: 'var(--grey)' }, { width: '40px', background: 'var(--violet)' }], { duration: 260, easing: EASE.std }).then(() => M.shine(step));
      at($('#fxDombi'), $('.dph', screen), 80 * 1.32, 80 * 1.32, -0.071 * 80); dombi.boolean('hidden').value = true; await M.wait(60); if (me !== run) return;
      dombi.boolean('hidden').value = false; dombi.enum('gesture').value = 'wave';
      M.wait(260).then(() => { if (me === run) { $('.speech', screen).style.opacity = 1; M.popIn($('.speech', screen)); if (!DOMBI.talk(dombi, $('.speech', screen).textContent, () => me === run)) SND.play('pop', { volume: 0.6 }); } });
      opts.forEach((o, i) => { M.wait(380 + i * T.stagger).then(() => { if (me === run) { o.style.opacity = 1; M.fadeUp(o, 12, 220); SND.appear(); } }); });
      M.wait(1600).then(() => { if (me === run) dombi.enum('gesture').value = 'none'; });
      opts.forEach((o) => M.pressable(o, () => {
        opts.forEach((x) => { x.classList.remove('sel'); x.style.opacity = x === o ? 1 : 0.55; x._setRest(0); $('.ck', x).style.opacity = 0; });
        o.classList.add('sel'); o._setRest(1); M.punch(o, 1.04); const ck = $('.ck', o); ck.style.opacity = 1; M.popIn(ck); M.pop(ck, VIOLET); dombi.enum('mood').value = 'happy';
        if (go.classList.contains('disabled')) { go.classList.replace('disabled', 'primary'); M.wait(T.colour).then(() => M.shine(go)); }
      }));
    },
    // ---------- 17 · new thing you can say (T2) ----------
    async cansay() {
      const me = mount(`<div class="mid" style="gap:20px"><div style="height:40px"></div><span class="dph" style="width:130px;height:130px"></span>
        <div class="p3d cscard" style="opacity:0"><span class="face"><img class="pp" src="${ICON}party-popper.png" alt=""><span class="k">ENDI AYTA OLASIZ:</span><span class="p">How much is it?</span><span class="m">Bu qancha turadi?</span>
          <button class="listen"><img src="${ICON}glyph-speaker-white.png" alt=""><span class="bars"><i></i><i></i><i></i></span>TINGLASH</button></span></div>
        <div class="note" style="opacity:0">Siz buni endi kafeda ayta olasiz.</div></div><div class="bot" style="opacity:0">${btn('DAVOM ETISH')}</div>`);
      const card = $('.cscard', screen), listen = $('.listen', screen);
      at($('#fxDombi'), $('.dph', screen), 130 * 1.32, 130 * 1.32, -0.071 * 130); dombi.enum('mood').value = 'laugh'; dombi.enum('gesture').value = 'celebrate';
      await M.wait(100); if (me !== run) return; fire(conf, 'medium');
      await M.wait(60); if (me !== run) return;
      card.style.opacity = 1; M.popIn(card, { duration: 300 }); SND.play('new-phrase');
      if (!M.reduce) M.anim($('.pp', card), [{ rotate: '0deg' }, { rotate: '-14deg', offset: 0.3 }, { rotate: '10deg', offset: 0.6 }, { rotate: '0deg' }], { duration: 420, delay: 200 * M.slow, easing: EASE.sine });
      await M.wait(320); if (me !== run) return; at($('#fxTwk'), card, 240, 200, -70); twk.color('color').value = GOLD; fire(twk);
      M.wait(900).then(() => { if (me === run) playBars(listen); });                               // the phrase is spoken once the sparkle is over, never on top of it
      M.fadeUp($('.note', screen), 8, 220, 150); M.fadeUp($('.bot', screen), 10, 220, 300);
      M.wait(700).then(() => { if (me === run) M.shine($('.go', screen)); });
      listen.onclick = () => { M.punch(listen, 1.06, 160); playBars(listen); }; M.pressable(card);
      $('.go', screen).addEventListener('pointerup', () => pick('result'));
    },
    // ---------- 18 · lesson result ----------
    async result(perfect) {
      const P = [['How much is it?', 'Bu qancha turadi?'], ['It\'s too expensive.', 'Bu juda qimmat.'], ['I\'ll take it.', 'Olaman.']];
      const STATS = [['green', 'ANIQLIK', 'glyph-target-green', '<span id="acc">0</span>%'], ['coral', 'GAPIRDINGIZ', 'glyph-mic-coral', '<span id="spoke">0:00</span>'], ['violet', 'IBORALAR', 'glyph-message-violet', '+<span id="phr">0</span>']];
      const me = mount(`<div class="rbody"><span class="dph" style="width:150px;height:150px;margin:5px 0"></span><h3 style="opacity:0">Dars tugadi!</h3>
        ${perfect ? `<div class="pbadge" style="opacity:0"><img src="${ICON}glyph-sparkles-white.png" alt="">MUKAMMAL!</div>` : ''}
        <div class="rstats">${STATS.map(([c, l, ic, v]) => `<div class="rstat ${c}" style="opacity:0"><div class="hd">${l}</div><div class="bd"><img src="${ICON}${ic}.png" alt=""><span class="v">${v}</span></div></div>`).join('')}</div>
        <div class="rk" style="opacity:0">ENDI AYTA OLASIZ:</div>
        ${P.map(([p, m]) => `<div class="prow" style="opacity:0"><button class="p3d audio sm"><span class="face"><img src="${ICON}glyph-speaker-violet.png" alt=""><span class="bars"><i></i><i></i><i></i></span></span></button><span><b>${p}</b><small>${m}</small></span></div>`).join('')}
        </div><div class="bot" style="opacity:0">${btn('DAVOM ETISH')}</div>`);
      const HIT = 1100, dph = $('.dph', screen);                                                   // the beat everything lands on: Dombi's cheer, the confetti, the title
      at($('#fxDombi'), dph, 180 * 1.32, 180 * 1.32, -0.071 * 180); dombi.enum('mood').value = 'happy';
      if (!perfect) SND.hit('lesson-done', HIT + 50, { ok: () => me === run });                         // its roll runs under the counting, its hit is the cheer
      // the three numbers arrive first and count up while the sound builds
      $$('.rstat', screen).forEach((s, i) => M.fadeUp(s, 12, 220, 120 + i * 70));
      await M.wait(300); if (me !== run) return;
      const acc = perfect ? 100 : 92; if (M.reduce) { $('#acc').textContent = acc; $('#phr').textContent = 3; } else { M.countUp($('#acc'), acc, 600); M.countUp($('#phr'), 3, 600); }
      const sp = $('#spoke'), t0 = performance.now(), tick = (now) => { const k = Math.min((now - t0) / (600 * M.slow), 1), s = Math.round(100 * (1 - Math.pow(1 - k, 3)));
        sp.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (k < 1 && me === run) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      const pf = $('.pbadge', screen);
      if (perfect) {                                                                              // T3: the badge slams in gold and lands on the beat, with a short stop
        await M.wait(HIT - 300 - 270); if (me !== run) return; pf.style.opacity = 1; HAP.at('heavy', 270, 'perfect slam');          // in the hand: heavy as the badge lands, then the sound's success on the burst
        if (!M.reduce) await M.anim(pf, [{ scale: '2.6', opacity: 0 }, { scale: '.9', opacity: 1, offset: 0.72 }, { scale: '.9', offset: 0.86 }, { scale: '1' }], { duration: 380, easing: EASE.in }); else await M.wait(270);
      } else await M.wait(HIT - 300);
      if (me !== run) return;
      // the beat
      dombi.enum('mood').value = 'laugh'; dombi.enum('gesture').value = 'celebrate';
      const h3 = $('h3', screen); h3.style.opacity = 1; M.popIn(h3, { duration: 260 });
      if (perfect) { SND.play('perfect'); at($('#fxRings'), dph, 240, 240); rings.color('color').value = GOLD; fire(rings); fire(conf, 'large');
        twk.color('color').value = GOLD; at($('#fxTwk'), pf, 150, 125); fire(twk); [1300, 2600].forEach((ms) => M.wait(ms).then(() => { if (me === run) fire(twk); }));
      } else fire(conf, 'medium');
      // then the phrases, 70 ms apart; each play button bounces as it lands
      M.fadeUp($('.rk', screen), 8, 200, 180);
      $$('.prow', screen).forEach((r, i) => { M.fadeUp(r, 14, 240, 260 + i * 70); M.wait(260 + i * 70 + 160).then(() => { if (me === run) M.punch($('.audio', r), 1.18, 220); });
        const a = $('.audio', r); M.pressable(a); a.addEventListener('pointerup', () => playBars(a)); });
      M.fadeUp($('.bot', screen), 10, 220, 520); M.wait(1100).then(() => { if (me === run) M.shine($('.go', screen)); });
      M.wait(1800).then(() => { if (me === run) { dombi.enum('gesture').value = 'none'; dombi.enum('mood').value = 'happy'; } });      // hands away again once the cheer is over
    },
    perfect() { return SCREENS.result(true); },
    // ---------- 22 · checkpoint result (T3) ----------
    async trophy() {
      const me = mount(`<div class="mid"><div class="trophy" style="opacity:0"><img src="${ICON}trophy-unit.png" alt=""></div>
        <div class="big" style="opacity:0">Kafeda bo'limi tugadi!</div><div class="sub" style="opacity:0">Siz butun suhbatni ingliz tilida o'tkazdingiz.</div>
        <div class="react" style="opacity:0"><div class="l">OFITSIANTNING FIKRI:</div><div class="faces">${['face-smile', 'face-grin', 'face-starstruck'].map((f) => `<span class="fc"><img src="${ICON}${f}.png" alt=""></span>`).join('')}</div>
          <div class="n" style="opacity:0">Ajoyib! Atigi 1 ta xato.</div></div></div><div class="bot" style="opacity:0">${btn('DAVOM ETISH', 'gold')}</div>`, 'cream');
      const tr = $('.trophy', screen);
      await M.wait(120); if (me !== run) return; tr.style.opacity = 1;
      if (!M.reduce) await M.anim(tr, [{ translate: '0 -420px', scale: '1 1' }, { translate: '0 0', scale: '.96 1.06' }], { duration: 340, easing: EASE.in });
      if (me !== run) return;
      // landing: squash, 100 ms hit-stop, dust, rings, confetti
      if (!M.reduce) M.anim(tr, [{ scale: '1.14 .84' }, { scale: '1.14 .84', offset: 0.28 }, { scale: '.95 1.07', offset: 0.6 }, { scale: '1.02 .98', offset: 0.82 }, { scale: '1 1' }], { duration: 480, easing: 'ease-out' });
      SND.play('trophy'); at($('#fxDust'), tr, 200, 120, 62); fire(dust); at($('#fxRings'), tr, 240, 240); rings.color('color').value = GOLD; fire(rings); fire(conf, 'large');
      await M.wait(260); if (me !== run) return;
      $('.big', screen).style.opacity = 1; M.popIn($('.big', screen)); M.fadeUp($('.sub', screen), 8, 220, 120); M.fadeUp($('.react', screen), 12, 240, 260);
      at($('#fxTwk'), tr, 240, 200); twk.color('color').value = GOLD; fire(twk);
      await M.wait(760); if (me !== run) return;
      const win = $$('.fc', screen)[2]; win.classList.add('win'); if (!M.reduce) M.anim(win, [{ scale: '.72' }, { scale: '1.12', offset: 0.6 }, { scale: '1' }], { duration: 300 }); M.pop(win, GOLD);
      M.fadeUp($('.react .n', screen), 6, 200, 150); M.fadeUp($('.bot', screen), 10, 220, 250); M.wait(800).then(() => { if (me === run) M.shine($('.go', screen)); });
      $('.go', screen).addEventListener('pointerup', () => pick('level'));
    },
    // ---------- 23 · level up (T3) ----------
    async level() {
      const CAN = [['hand-wave', 'Tanishib, o\'zingizni tanishtirish'], ['coffee-kafeda', 'Kafeda buyurtma berish'], ['cart-dokon', 'Do\'konda narx so\'rash va to\'lash']];
      const me = mount(`<div class="mid"><div style="height:16px"></div><div class="lbadge" style="opacity:0"><span id="lvOld">0</span><span id="lvNew" style="opacity:0">1</span></div>
        <div class="big" style="opacity:0">Yangi daraja!</div><div class="cap" style="opacity:0">1-DARAJA · OMON QOLISH</div>
        <div class="cando" style="opacity:0"><div class="l">ENDI SIZ QILA OLASIZ:</div>${CAN.map(([ic, t]) => `<div class="it" style="opacity:0"><img src="${ICON}${ic}.png" alt="">${t}</div>`).join('')}</div></div>
        <div class="bot" style="opacity:0">${btn('1-DARAJANI BOSHLASH', 'gold')}</div>`, 'violet');
      const scr = $('.scr', screen), badge = $('.lbadge', screen);
      M.anim(scr, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      await M.wait(200); if (me !== run) return;
      badge.style.opacity = 1; if (!M.reduce) M.anim(badge, [{ scale: '0' }, { scale: '1.2', offset: 0.6 }, { scale: '1' }], { duration: 420 }); SND.play('level-up');
      fire(conf, 'fountain');
      await M.wait(220); if (me !== run) return; at($('#fxRings'), badge, 240, 240); rings.color('color').value = GOLD; fire(rings);
      await M.wait(160); if (me !== run) return;
      // the number flips: the old one leaves up, the new one comes from below
      M.anim($('#lvOld'), [{ translate: '0 0', opacity: 1 }, { translate: '0 -50px', opacity: 0 }], { duration: 200, easing: EASE.in, fill: 'forwards' });
      M.anim($('#lvNew'), [{ translate: '0 50px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 260, delay: 80 * M.slow, fill: 'forwards' });
      M.wait(340).then(() => { if (me === run) M.punch(badge, 1.1, 220); });
      await M.wait(260); if (me !== run) return;
      $('.big', screen).style.opacity = 1; M.popIn($('.big', screen)); M.fadeUp($('.cap', screen), 6, 200, 120); M.fadeUp($('.cando', screen), 12, 240, 240);
      $$('.it', screen).forEach((it, i) => M.fadeUp(it, 8, 220, 380 + i * 90));
      M.fadeUp($('.bot', screen), 10, 220, 760); M.wait(1300).then(() => { if (me === run) M.shine($('.go', screen)); });
    },
  };
  function pick(name) { $$('#side .act').forEach((b) => b.classList.toggle('on', b.dataset.s === name)); SCREENS[name](); }
  $$('#side .act').forEach((b) => b.onclick = () => pick(b.dataset.s));
  await M.initPop(); pick('goal'); window.labReady = true; window.pick = pick;
})();
