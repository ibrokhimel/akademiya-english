// Progress and profile: streak card + calendar, numbers and ring, phrase cards, friend button.
(async () => {
  const ctl = (id, map) => $$(`#${id} .ctl button`).forEach((b) => b.onclick = () => map[b.dataset.a]());
  const loop = (el, frames, o) => { const a = el.animate(frames, { direction: 'alternate', iterations: Infinity, easing: EASE.sine, ...o }); a.playbackRate = 1 / M.slow; if (M.reduce) a.cancel(); return a; };

  // ================= streak card =================
  {
    const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'], TODAY = 6, MISSED = 3;
    const week = $('#week'), num = $('#sNum'), note = $('#sNote');
    week.innerHTML = DAYS.map((d, i) => `<span class="day${i === TODAY ? ' today' : ''}">${d}<span class="dot"><i class="tring"></i><img class="ice" src="${ICON}frozen-streak.png" alt=""><img class="icecheck" src="${ICON}glyph-check-ice.png" alt=""></span></span>`).join('');
    const dots = $$('.dot', week);
    const frostCanvas = Object.assign(document.createElement('canvas'), { width: 240, height: 240 }); dots[MISSED].appendChild(frostCanvas);
    const [flame, embers, frost] = await Promise.all([M.rive($('#scard .fl'), 'Streak Flame'), M.rive($('#scard .em'), 'FX Embers'), M.rive(frostCanvas, 'FX Frost')]);
    let ring;
    const check = (dot) => { const im = Object.assign(document.createElement('img'), { src: ICON + 'glyph-check-white.png', className: 'chk' }); dot.appendChild(im); return im; };
    function reset() {
      dots.forEach((d, i) => { d.className = 'dot' + (i > 0 && i < TODAY ? ' done' : '') + (i === TODAY ? ' today' : ''); $$('.chk', d).forEach((c) => c.remove()); if (i > 0 && i < TODAY) check(d); });
      num.textContent = 6; note.textContent = 'Bugun bitta dars — seriya 7 kun bo\'ladi.'; flame.boolean('lit').value = true;
      if (ring) ring.cancel(); ring = loop($('.tring', dots[TODAY]), [{ scale: '1', opacity: 1 }, { scale: '1.2', opacity: 0.35 }], { duration: T.glow / 2 });
    }
    const done = async () => {                                          // T2: streak +1
      const d = dots[TODAY]; if (d.classList.contains('done')) return;
      d.classList.add('done'); M.popIn(check(d)); M.punch(d, 1.2, 220); if (ring) ring.cancel();
      await M.wait(120); flame.trigger('ignite').trigger(); SND.play('streak'); if (!M.reduce) embers.trigger('fire').trigger();
      await M.wait(180); num.textContent = +num.textContent + 1; M.punch($('.count'), 1.18, 220);
      note.textContent = 'Ertaga yana bitta dars — seriya 8 kun bo\'ladi.'; M.fadeUp(note, 6, 200);
    };
    const freeze = async () => {                                        // T2 calm: a save, not a win
      const d = dots[MISSED]; if (d.classList.contains('frozen')) return;
      d.classList.remove('done'); $$('.chk', d).forEach((c) => c.remove()); SND.hit('freeze', 600);              // the chime rises under the frost and tops as the ice lands
      await M.wait(450); if (!M.reduce) frost.trigger('fire').trigger();
      await M.wait(150); d.classList.add('frozen'); M.popIn($('.ice', d)); M.popIn($('.icecheck', d), { delay: 120 * M.slow });
    };
    // ---- calendar: unfolds under the card; the joining bands draw left to right ----
    const cal = $('#cal'), grid = $('#grid7'); let open = false;
    const P = new Set([1, 2, 3, 5, 6, 8, 9, 10, 11]), F = new Set([7]), NOW = 12, OFFSET = 4;
    grid.innerHTML = DAYS.map((d) => `<div class="wd">${d}</div>`).join('') + [...Array(OFFSET)].map(() => '<div class="cday"></div>').join('') +
      [...Array(31)].map((_, k) => { const n = k + 1, c = P.has(n) ? 'p' : F.has(n) ? 'f' : n === NOW ? 't' : ''; return `<div class="cday ${c}" data-n="${n}">${c ? `<i>${n}</i>` : n}</div>`; }).join('');
    const bands = [];
    for (let row = 0; row < 5; row++) { let start = -1;
      for (let col = 0; col <= 7; col++) { const n = row * 7 + col - OFFSET + 1, on = col < 7 && (P.has(n) || F.has(n) || n === NOW);
        if (on && start < 0) start = col;
        if (!on && start >= 0) { if (col - start > 1) { const b = document.createElement('div'); b.className = 'band'; b.style.cssText = `left:${start * 46 + 4}px;top:${24 + row * 46 + 4}px;width:${(col - start) * 46 - 8}px`; grid.appendChild(b); bands.push(b); } start = -1; } } }
    const toggleCal = async () => {
      open = !open; SND.play('unfold', { step: open ? 0 : -4 }); const h = $('.in', cal).offsetHeight;
      cal.style.height = open ? h + 'px' : '0px';
      M.anim(cal, [{ height: open ? '0px' : h + 'px' }, { height: open ? h + 'px' : '0px' }], { duration: 300, easing: EASE.std });
      if (!open || M.reduce) return;
      bands.forEach((b, i) => M.anim(b, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 260, delay: (120 + i * 90) * M.slow, easing: EASE.std, fill: 'backwards' }));
      $$('.cday > i', grid).forEach((c, i) => M.anim(c, [{ scale: '.6', opacity: 0 }, { scale: '1', opacity: 1 }], { duration: 180, delay: (100 + i * 22) * M.slow, fill: 'backwards' }));
      await M.wait(650); $$('.cday.f > i', grid).forEach((c) => M.shine(c));                       // frozen days: one quick frost shine
    };
    M.pressable($('#scard'), toggleCal);
    ctl('dStreak', { done, freeze, cal: toggleCal, reset });
    reset();
  }

  // ================= numbers and ring =================
  {
    const C = 2 * Math.PI * 59.4, arc = $('#ringArc'), tiles = $('#tiles'); let pct = 60;
    arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C * (1 - pct / 100);
    const DATA = [['grad-cap', 12, 'Darslar'], ['bubble-phrases', 45, 'Iboralar'], ['studio-mic', 96, 'Gapirildi'], ['calendar', 9, 'Faol kunlar']];
    tiles.innerHTML = DATA.map(([ic, v, l]) => `<div class="stile"><img src="${ICON}${ic}.png" alt=""><span><b>${v}</b><small>${l}</small></span></div>`).join('');
    const vals = $$('.stile b', tiles);
    const ringTo = (to, from = pct) => { arc.style.strokeDashoffset = C * (1 - to / 100);
      M.anim(arc, [{ strokeDashoffset: C * (1 - from / 100) }, { strokeDashoffset: C * (1 - to / 100) }], { duration: 700 }); pct = to; };
    const roll = (el, to, ms) => { if (M.reduce) { el.textContent = to; return; } return M.countUp(el, to, ms); };
    const openPage = () => {
      $('#bigCount').textContent = 0; roll($('#bigCount'), DATA[1][1]);
      $('#ringNum').textContent = 0; roll($('#ringNum'), pct, 700); ringTo(pct, 0);
      $$('.stile', tiles).forEach((t, i) => { M.fadeUp(t, 10, 220, 150 + i * 60); vals[i].textContent = 0; M.wait(150 + i * 60).then(() => roll(vals[i], DATA[i][1], 500)); });
    };
    const more = () => { DATA[0][1] += 1; DATA[1][1] += 3; DATA[2][1] += 8; const to = Math.min(pct + 8, 100);
      roll($('#bigCount'), DATA[1][1], 400); roll($('#ringNum'), to, 500); ringTo(to); [0, 1, 2].forEach((i) => roll(vals[i], DATA[i][1], 400)); };
    ctl('dNumbers', { open: openPage, more });
  }

  // ================= phrase cards =================
  {
    const list = $('#plist'), twk = await M.rive($('#ptw'), 'FX Twinkle'); twk.color('color').value = VIOLET;
    const START = [['How much is it?', 'Bu qancha turadi?', 2], ['A coffee, please.', 'Bitta qahva, iltimos.', 3], ['What\'s your name?', 'Ismingiz nima?', 1]];
    const NEW = [['Can I pay by card?', 'Karta bilan to\'lasam bo\'ladimi?'], ['No sugar, please.', 'Shakarsiz, iltimos.'], ['Here you are.', 'Marhamat.']]; let nNew = 0;
    function card([ph, mean, stars], isNew) {
      const c = document.createElement('div'); c.className = 'p3d pcard' + (isNew ? ' new' : '');
      c.innerHTML = `<span class="face"><span class="top"><span><img src="${ICON}coffee-kafeda.png" alt="">KAFEDA</span>${isNew ? '<span class="tag">YANGI</span>' :
        `<span class="stars">${[0, 1, 2].map((i) => `<b class="${i < stars ? 'on' : ''}">★</b>`).join('')}</span>`}</span>
        <span class="ph">${ph}</span><span class="mean">${mean}</span><span class="acts">
        <button class="pchip a"><img src="${ICON}glyph-speaker-violet.png" alt=""><span class="bars" style="position:absolute"><i></i><i></i><i></i></span>Asl</button>
        <button class="pchip s"><img src="${ICON}glyph-user-coral.png" alt="">Siz</button><button class="pchip m"><img src="${ICON}glyph-replay-grey.png" alt="">Mashq</button></span></span>`;
      M.pressable(c);
      $('.pchip.a', c).onclick = async (e) => { const b = e.currentTarget, bars = $('.bars', b), im = $('img', b); if (b._p) return; b._p = true; M.punch(b, 1.08, 160);
        im.style.opacity = 0; bars.style.opacity = 1; const w = [...bars.children].map((x, i) => { const a = x.animate([{ height: '4px' }, { height: [12, 14, 9][i] + 'px' }], { duration: 240 + i * 40, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); a.playbackRate = 1 / M.slow; return a; });
        await M.wait(1300); w.forEach((a) => a.cancel()); bars.style.opacity = 0; im.style.opacity = 1; b._p = false; };
      $('.pchip.s', c).onclick = (e) => M.punch(e.currentTarget, 1.12, 200);
      $('.pchip.m', c).onclick = (e) => { M.punch(e.currentTarget, 1.08, 160); const next = $('.stars b:not(.on)', c); if (!next) return;
        next.classList.add('on'); M.punch(next, 1.5, 240); SND.play('star'); if (!$('.stars b:not(.on)', c)) M.pop($('.stars', c), GOLD); };
      return c;
    }
    const openList = () => { $$('.pcard', list).forEach((c) => c.remove()); START.forEach((d, i) => { const c = card(d); list.appendChild(c); M.fadeUp(c, 12, 220, i * T.stagger); SND.appear(i * T.stagger + 1); }); };
    const add = async () => {
      const before = new Map($$('.pcard', list).map((c) => [c, c.getBoundingClientRect()]));
      const c = card(NEW[nNew++ % NEW.length], true); list.insertBefore(c, $('.pcard', list));
      before.forEach((r, el) => M.flyFrom(el, r, { arc: false, ms: 260 }));
      SND.play('new-phrase'); await M.popIn(c, { duration: 260 }); if (!M.reduce) twk.trigger('fire').trigger();
    };
    ctl('dPhrases', { open: openList, new: add }); openList();
  }

  // ================= friend button =================
  {
    const btn = $('#fbtn'), img = $('img', btn), lbl = $('.lbl', btn); let state = 'add', busy = false;
    const S = { add: ['glyph-user-violet', 'DO\'ST QO\'SHISH'], sent: ['glyph-timer-muted', 'SO\'ROV YUBORILDI'], accept: ['glyph-check-white', 'SO\'ROVNI QABUL QILISH'], friends: ['glyph-check-green', 'DO\'STSIZ'] };
    const paint = (s) => { state = s; btn.className = 'p3d fbtn' + (s === 'add' ? '' : ' ' + s); img.src = `${ICON}${S[s][0]}.png`; lbl.textContent = S[s][1]; };
    const morph = async (s) => {
      if (busy) return; busy = true; const inner = [img, lbl];
      await Promise.all(inner.map((e) => M.anim(e, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -10px' }], { duration: 140, easing: EASE.in, fill: 'forwards' })));
      paint(s); SND.play({ sent: 'sent', accept: 'pop', friends: 'friend' }[s]);
      await Promise.all(inner.map((e) => M.anim(e, [{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], { duration: 140, fill: 'forwards' })));
      if (s === 'friends') { M.punch(img, 1.4, 240); M.pop(btn, GREEN); }
      busy = false;
    };
    M.pressable(btn, () => { if (state === 'add') morph('sent'); else if (state === 'accept') morph('friends'); else M.shake(btn, 3, T.shakeSmall); });
    ctl('dFriend', { incoming: () => morph('accept'), reset: () => paint('add') }); paint('add');
  }

  await M.initPop(); window.labReady = true;
})();
