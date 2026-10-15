// Lesson and checkpoint moments: mistakes round (16), streak (19), checkpoint start sheet (20), checkpoint player (21).
(async () => {
  const screen = $('#screen'), park = $('#park');
  const mk = (w, h) => { const c = Object.assign(document.createElement('canvas'), { width: w, height: h }); park.appendChild(c); return c; };
  const cD = mk(300, 300), cF = mk(192, 248), cE = mk(400, 520), cW = mk(264, 264);
  cF.className = 'fl'; cE.className = 'em';
  const [dombi, flame, embers, waiter] = await Promise.all([M.rive(cD, 'Dombi', 'Dombi'), M.rive(cF, 'Streak Flame'), M.rive(cE, 'FX Embers'), M.rive(cW, 'Waiter A', 'Waiter')]);
  const mic = await W.mic(); park.appendChild(mic.el);
  const setDark = () => { const d = document.body.classList.contains('dark'); dombi.boolean('dark').value = d; waiter.boolean('dark').value = d; }; setDark(); document.addEventListener('lab-dark', setDark);
  let run = 0, onSpeak = null;
  const btn = (label, cls = 'primary') => `<button class="p3d btn ${cls} go"><span class="face">${label}</span></button>`;
  function mount(html, cls = '') { run++; onSpeak = null; [cD, cF, cE, cW, mic.el].forEach((e) => park.appendChild(e)); waiter.boolean('talking').value = false;
    screen.innerHTML = `<div class="scr ${cls}">${html}</div>`; $$('.btn', screen).forEach((b) => M.pressable(b)); return run; }
  const CK = `<img class="ck" src="${ICON}glyph-check-white.png" alt="">`;
  const STEPS = [['hand-wave', 'Salom'], ['coffee-kafeda', 'Buyurtma'], ['money-bag', 'Narx'], ['card', 'To\'lash'], ['hands-up', 'Xayr']];
  const chain = (done, cur) => STEPS.map(([ic], i) => `${i ? `<span class="lnk"><i${i <= done ? ' style="transform:scaleX(1)"' : ''}></i></span>` : ''}<span class="step${i < done ? ' done' : i === cur ? ' cur' : ''}"><img class="ic" src="${ICON}${ic}.png" alt="">${CK}</span>`).join('');
  // the waiter's mouth for a line of about `ms`
  async function talk(ms, me) { const V = [5, 3, 6, 4, 8, 3, 5, 1, 4, 6]; waiter.boolean('talking').value = true;
    for (let t = 0, i = 0; t < ms && me === run; t += 95, i++) { waiter.number('viseme').value = V[i % V.length]; await M.wait(95); } waiter.boolean('talking').value = false; }

  const SCREENS = {
    // ---------- 16 · mistakes round (T1) ----------
    async mistakes() {
      const me = mount(`<div class="status">9:41</div><div class="topbar"><img class="x" src="${ICON}glyph-close-grey.png" alt=""><div class="progress"><div class="fill" style="width:96%"></div></div>
        <div class="combo"><img src="${ICON}flame-streak.png" alt="">3</div></div>
        <div class="mid"><div class="dombibox"></div><div class="divider" style="opacity:0"><img src="${ICON}repeat.png" alt=""><b>Xatolar ustida ishlaymiz</b><small>3 ta savolni yana bir bor ko'ramiz</small></div></div>
        <div class="bot" style="opacity:0">${btn('BOSHLADIK')}</div>`);
      dombiInto(cD, $('.dombibox', screen), 150); dombi.enum('mood').value = 'think'; dombi.enum('gesture').value = 'thinking';
      dombi.boolean('hidden').value = true; await M.wait(60); if (me !== run) return; dombi.boolean('hidden').value = false;
      await M.wait(220); if (me !== run) return; const d = $('.divider', screen);
      SND.play('mistakes'); M.anim(d, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, translate: '70px 0' }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, fill: 'forwards' });
      if (!M.reduce) M.anim($('img', d), [{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 520, delay: 120 * M.slow, easing: EASE.std });
      M.fadeUp($('.bot', screen), 10, 220, 300); M.wait(800).then(() => { if (me === run) M.shine($('.go', screen)); });
    },
    // ---------- 19 · streak +1 (T2) ----------
    async streak() {
      const D = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
      const dot = (i) => i === 0 ? '<span class="dot"></span>' : i === 3 ? `<span class="dot frozen"><img class="ice" src="${ICON}frozen-streak.png" alt=""><img class="ic2" src="${ICON}glyph-check-ice.png" alt=""></span>`
        : i === 6 ? '<span class="dot" id="today"></span>' : `<span class="dot done"><img src="${ICON}glyph-check-white.png" alt=""></span>`;
      const me = mount(`<div class="status">9:41</div><div class="mid"><div class="streakbig" style="opacity:0"><div class="flamebig"></div>
        <div class="cnt"><span class="n"><span id="nOld">5</span><span id="nNew" style="opacity:0">6</span></span>kun!</div>
        <div class="week">${D.map((d, i) => `<span class="day${i === 6 ? ' today' : ''}">${d}${dot(i)}</span>`).join('')}</div>
        <div class="note" style="opacity:0">Ertaga yana bitta dars — seriya 7 kun bo'ladi.</div></div></div><div class="bot" style="opacity:0">${btn('ZO\'R!')}</div>`);
      const box = $('.flamebig', screen); box.append(cE, cF); flame.boolean('lit').value = false;
      const card = $('.streakbig', screen); card.style.opacity = 1; M.popIn(card, { duration: 260 });
      await M.wait(380); if (me !== run) return;
      flame.boolean('lit').value = true; flame.trigger('ignite').trigger(); SND.play('streak'); if (!M.reduce) embers.trigger('fire').trigger();           // the flame lights
      await M.wait(200); if (me !== run) return;
      M.anim($('#nOld'), [{ translate: '0 0', opacity: 1 }, { translate: '0 -30px', opacity: 0 }], { duration: 180, easing: EASE.in, fill: 'forwards' });   // the number flips
      M.anim($('#nNew'), [{ translate: '0 30px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 240, delay: 60 * M.slow, fill: 'forwards' });
      M.wait(300).then(() => { if (me === run) M.punch($('.cnt', screen), 1.16, 220); });
      await M.wait(260); if (me !== run) return;
      const t = $('#today'); t.classList.add('done'); t.innerHTML = `<img src="${ICON}glyph-check-white.png" alt="">`; M.popIn(t.firstChild); M.punch(t, 1.25, 240);   // today's dot fills
      M.fadeUp($('.note', screen), 6, 200, 200); M.fadeUp($('.bot', screen), 10, 220, 350); M.wait(900).then(() => { if (me === run) M.shine($('.go', screen)); });
    },
    // ---------- 20 · checkpoint start sheet (T1) ----------
    async cpstart() {
      const me = mount(`<div class="pathbg"></div><div class="dim"></div><div class="cpsheet"><div class="handle"></div>
        <div class="cphead"><span class="tile"><img src="${ICON}trophy-unit.png" alt=""></span><span><div class="k">NAZORAT NUQTASI · KAFEDA</div><div class="t">Kafedagi bir kun</div></span></div>
        <div class="story"><div class="l">SIZ BU HIKOYANI GAPIRIB O'TASIZ:</div><div class="chain">${chain(0, -1)}</div><div class="names">${STEPS.map((s) => `<span>${s[1]}</span>`).join('')}</div></div>
        <div class="cpmeta"><span><img src="${ICON}glyph-list-grey.png" alt="">14 mashq</span><span><img src="${ICON}glyph-sparkles-grey.png" alt="">Yangi ibora yo'q</span><span><img src="${ICON}glyph-timer-grey.png" alt="">≈ 6 daqiqa</span></div>
        ${btn('BOSHLASH', 'gold')}</div>`);
      const sheet = $('.cpsheet', screen), steps = $$('.step', sheet), links = $$('.lnk i', sheet), names = $$('.names span', sheet);
      names.forEach((n) => { n.style.opacity = 0.35; }); links.forEach((l) => { l.style.background = 'var(--gold)'; });
      await M.wait(250); if (me !== run) return;
      SND.play('whoosh'); M.anim($('.dim', screen), [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
      M.anim(sheet, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] :
        [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' });
      await M.wait(380); if (me !== run) return;
      for (const [i, s] of steps.entries()) {                                                    // the story steps light up one after another
        if (me !== run) return;
        if (i && !M.reduce) M.anim(links[i - 1], [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.6 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 320 });
        if (!M.reduce) M.anim(s, [{ scale: '.7', borderColor: '#FFD04F' }, { scale: '1.14', borderColor: '#FFD04F', offset: 0.55 }, { scale: '1' }], { duration: 260 });
        SND.play('step', { step: SND.deg(i) }); names[i].style.opacity = 1; M.fadeUp(names[i], 4, 160); await M.wait(110);
      }
      await M.wait(200); if (me !== run) return; steps[0].classList.add('cur'); M.punch(steps[0], 1.12, 200); M.shine($('.go', screen));
      $('.go', screen).addEventListener('pointerup', () => pick('player'));
    },
    // ---------- 21 · checkpoint player: one step done, the next one comes in (T1) ----------
    async player() {
      const LINES = [['3/5 · NARXNI SO\'RANG', '“Here\'s your coffee!”', 'Endi narxini so\'rang', 1100], ['4/5 · TO\'LANG', '“It\'s ten thousand som.”', 'Karta bilan to\'lasa bo\'ladimi, deb so\'rang', 1400],
        ['5/5 · XAYRLASHING', '“Sure. Here you are.”', 'Rahmat ayting va xayrlashing', 1200]];
      let at = 0;
      const me = mount(`<div class="status">9:41</div><div class="ptop"><img src="${ICON}glyph-close-grey.png" alt=""><div class="chain">${chain(2, 2)}</div><span style="width:24px"></span></div>
        <div class="pbody"><div class="kchip"><span>${LINES[0][0]}</span></div><div class="wbig"></div><div class="said"><b>${LINES[0][1]}</b><small>${LINES[0][2]}</small></div>
        <div class="michold"></div><button class="link"><img src="${ICON}glyph-mic-off-grey.png" alt="">HOZIR GAPIRA OLMAYMAN</button></div>`);
      $('.wbig', screen).appendChild(cW); $('.michold', screen).appendChild(mic.el); mic.idle(false);
      const steps = $$('.ptop .step', screen), links = $$('.ptop .lnk i', screen), chip = $('.kchip', screen), said = $('.said', screen);
      const turn = async () => { await talk(LINES[at][3], me); if (me === run) { mic.idle(true); SND.play('turn'); } };
      onSpeak = async () => {
        const got = await mic.speak(true); if (me !== run || got !== 'heard') return;
        waiter.trigger('correct').trigger(); SND.play('right');
        const s = steps[at + 2]; s.classList.remove('cur'); s.classList.add('done'); M.popIn($('.ck', s)); M.punch(s, 1.25, 240); M.pop(s, GREEN);          // the step ticks
        if (at + 2 < links.length) M.anim(links[at + 2], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 260, delay: 120 * M.slow, easing: EASE.std, fill: 'forwards' });
        await M.wait(700); if (me !== run) return;
        at++; if (at >= LINES.length) { await M.wait(500); if (me === run) pick('player'); return; }                                                          // (in the app: the result screen)
        const nx = steps[at + 2]; nx.classList.add('cur'); M.punch(nx, 1.2, 220);
        const old = $('span', chip), neu = document.createElement('span'); neu.textContent = LINES[at][0]; chip.appendChild(neu);                              // the step name rolls over
        M.anim(old, [{ translate: '0 0', opacity: 1 }, { translate: '0 -18px', opacity: 0 }], { duration: 180, easing: EASE.in, fill: 'forwards' }).then(() => old.remove());
        M.anim(neu, [{ translate: '0 18px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 220, fill: 'forwards' });
        await M.anim(said, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-30px 0' }], { duration: 150, easing: EASE.in, fill: 'forwards' }); if (me !== run) return;
        $('b', said).textContent = LINES[at][1]; $('small', said).textContent = LINES[at][2]; mic.idle(false);
        await M.anim(said, [{ opacity: 0, translate: '40px 0' }, { opacity: 1, translate: '0 0' }], { duration: 220, fill: 'forwards' }); if (me !== run) return;
        turn();
      };
      M.popIn($('.wbig', screen)); await M.wait(350); if (me !== run) return; turn();
    },
  };
  M.pressable(mic.btn, () => { if (onSpeak) onSpeak(); });
  function pick(name) { $$('#side [data-s]').forEach((b) => b.classList.toggle('on', b.dataset.s === name)); SCREENS[name](); }
  $$('#side [data-s]').forEach((b) => b.onclick = () => pick(b.dataset.s));
  $('#side [data-a="speak"]').onclick = () => { if (onSpeak) onSpeak(); };
  await M.initPop(); pick('mistakes'); window.labReady = true;
})();
