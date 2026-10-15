// "All together": one exercise from pick to feedback, the combo page (14c), then the next exercise slides in.
(() => {
  const { setReady, checkButton, progressBar, Sheets, GREEN } = Lab;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const phone = $('#phone'), body = $('#phBody'), dock = $('#phDock');
  const ICON = '/pendev/icons-r2/';
  const EXERCISES = [
    { kicker: 'TINGLANG', task: 'Mijoz nima buyurtma qildi?', right: 1, answer: 'A tea, please.', tip: 'Mijoz choy so\'radi: “A tea, please.”',
      html: `<div class="row3">${[['coffee-kafeda', 'coffee'], ['lesson-tea', 'tea'], ['lesson-orange-juice', 'juice']].map(([f, l]) =>
        `<button class="p3d tile picture"><span class="face"><span class="pic"><img src="${ICON}${f}.png" alt=""></span>${l}</span></button>`).join('')}</div>` },
    { kicker: 'TANLANG', task: 'Siz apelsin sharbati xohlaysiz. Nima deysiz?', right: 2, answer: 'An orange juice, please.', tip: 'So\'z unli tovush bilan boshlansa — an.',
      html: ['A tea, please.', 'A orange juice, please.', 'An orange juice, please.'].map((l, i) =>
        `<button class="p3d tile answer" style="width:100%"><span class="face"><span class="key">${i + 1}</span>${l}</span></button>`).join('') },
  ];
  dock.innerHTML = `
    <div class="sheet bar"><button class="p3d btn disabled check"><span class="face">TEKSHIRISH</span></button></div>
    <div class="sheet correct" style="position:absolute;left:0;bottom:0;transform:translateY(100%)">
      <div class="head"><span class="badge"><img src="${ICON}glyph-check-white.png" alt=""></span><span class="ttl">Zo'r!</span></div>
      <button class="p3d btn green next"><span class="face">DAVOM ETISH</span></button></div>
    <div class="sheet fix" style="position:absolute;left:0;bottom:0;transform:translateY(100%)">
      <div><div class="lbl">To'g'ri javob:</div><div class="ans"></div></div>
      <div class="tipbox"><img src="${ICON}bulb-tip.png" alt=""><span class="tiptext"></span></div>
      <button class="p3d btn primary next"><span class="face">DAVOM ETISH</span></button></div>`;
  const check = $('.check', dock), sOk = $('.sheet.correct', dock), sNo = $('.sheet.fix', dock);
  const bar = progressBar($('#phFill'), $('#phCombo'), 40);
  let n = 0, cur = null, picked = -1, locked = false, pendingCombo = 0;

  // ---- combo page 14c: violet screen, flame, "3 ta ketma-ket!" (T1+, about 1.5 s, a tap skips it) ----
  const combo = document.createElement('div'); combo.className = 'combo14';
  combo.innerHTML = `<div class="track"><i></i></div><div class="mid"><canvas width="400" height="520"></canvas>
    <img class="flame" src="${ICON}flame-streak.png" alt=""><div class="big"></div><div class="sub">Siz to'xtamayapsiz 💪</div></div>`;
  phone.appendChild(combo);
  let embers; M.rive($('canvas', combo), 'FX Embers').then((vm) => { embers = vm; });
  async function comboPage(count) {
    const flame = $('.flame', combo), big = $('.big', combo), sub = $('.sub', combo);
    big.textContent = `${count} ta ketma-ket!`; $('.track i', combo).style.width = bar.pct + '%';
    combo.style.pointerEvents = 'auto';
    const skip = new Promise((r) => { combo.onclick = r; });
    M.anim(combo, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
    SND.play('combo', { step: { 3: 0, 5: 2, 10: 4 }[count] || 0 });                              // brighter at 5 and at 10
    big.style.opacity = 0; sub.style.opacity = 0;
    if (!M.reduce) M.anim(flame, [{ scale: '.3', opacity: 0 }, { scale: '1.15', opacity: 1, offset: 0.6 }, { scale: '1' }], { duration: 300 });
    M.wait(120).then(() => { if (embers && !M.reduce) embers.trigger('fire').trigger(); });
    const flick = flame.animate([{ scale: '1 1' }, { scale: '1.03 .96' }], { duration: 420, direction: 'alternate', iterations: Infinity, easing: M.EASE.sine, delay: 300 * M.slow });
    flick.playbackRate = 1 / M.slow; if (M.reduce) flick.cancel();
    M.wait(80).then(() => M.popIn(big)); M.fadeUp(sub, 8, 200, 200);
    await Promise.race([M.wait(1300), skip]);
    await M.anim(combo, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -16px' }], { duration: 200, easing: M.EASE.in, fill: 'forwards' });
    flick.cancel(); combo.style.pointerEvents = 'none'; combo.onclick = null;
  }

  function enter(first) {
    const ex = EXERCISES[n % EXERCISES.length];
    const el = document.createElement('div'); el.className = 'ex';
    el.innerHTML = `<div class="hd"><div class="kicker">${ex.kicker}</div><div class="task">${ex.task}</div></div>${ex.html}`;
    body.appendChild(el);
    const tiles = $$('.tile', el); picked = -1; locked = false; cur = { el, tiles, ex };
    tiles.forEach((t, i) => M.pressable(t, () => {
      if (locked) return;
      tiles.forEach((o) => { o.classList.remove('sel'); if (o !== t) o._setRest(0); });
      picked = i; t.classList.add('sel'); t._setRest(-2); setReady(check, true);
    }));
    if (first || M.reduce) return;
    // the task comes first, then the answers, 40 ms apart
    M.anim($('.hd', el), [{ opacity: 0, translate: '70px 0' }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, fill: 'both' });
    tiles.forEach((t, i) => M.anim(t, [{ opacity: 0, translate: '70px 0' }, { opacity: 1, translate: '0 0' }],
      { duration: T.exSlide, delay: (90 + i * T.stagger) * M.slow, fill: 'both' }));
  }
  async function leave() {
    const old = cur.el;
    await M.anim(old, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-90px 0' }], { duration: 180, easing: EASE.in, fill: 'forwards' });
    old.remove();
  }
  checkButton(check, async () => {
    if (locked || picked < 0) return; locked = true;
    const { tiles, ex } = cur, t = tiles[picked]; t.classList.remove('sel'); t._setRest(0); setReady(check, false);
    if (picked === ex.right) {
      t.classList.add('ok'); M.punch(t); M.pop($('.pic', t) || t, GREEN); SND.play('right');
      const c = bar.right(15); if ([3, 5, 10].includes(c)) pendingCombo = c;
      await M.wait(120); Sheets.show(sOk);
    } else {
      t.classList.add('no'); M.shake(t); SND.play('not-right'); bar.wrong(); pendingCombo = 0;
      await M.wait(120); tiles[ex.right].classList.add('ok');
      $('.ans', sNo).textContent = ex.answer; $('.tiptext', sNo).textContent = ex.tip; Sheets.show(sNo);
    }
  });
  $$('.next', dock).forEach((b) => M.pressable(b, async () => {
    Sheets.hide(sOk); Sheets.hide(sNo); n++;
    await leave();
    if (pendingCombo) { const c = pendingCombo; pendingCombo = 0; await comboPage(c); }
    enter(false);
  }));
  $('#dPhone .ctl [data-a="combo"]').onclick = () => comboPage(3);
  enter(true);
})();
