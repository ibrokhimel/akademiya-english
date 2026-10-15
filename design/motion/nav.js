// The Learn page (locked Path H): lesson circles, the numbers at the top, banner, tabs and the lesson start sheet.
(async () => {
  const LESSONS = [                                              // x, y = the circle's place on Screen 11 · Path
    { x: 159.5, y: 212.2, g: 'star', t: 'Ichimlik buyurtma qilish', p: 'A coffee, please.' },
    { x: 112.9, y: 287.5, g: 'mic', t: 'Taom buyurtma qilish', p: 'Can I have a sandwich?' },
    { x: 90.1, y: 373.5, g: 'star', t: 'Narxini so\'rash', p: 'How much is it?' },
    { x: 112.6, y: 458.1, g: 'headphones', t: '“Kerak emas” deyish', p: 'No sugar, please.' },
    { x: 158.8, y: 534.8, g: 'message', t: 'To\'lash va rahmat aytish', p: 'Can I pay by card?' },
  ];
  const CHECKPOINT = { t: 'Nazorat nuqtasi', p: 'Kafedagi bir kun' };
  const path = $('#path'), phone = $('#phone');
  let cur = 0, busy = false, glow, twinkleTimer = 0;

  // locked circles use the design's muted glyphs; the current one shows the same glyph in white
  const glyph = (l, state) => { const hp = l.g === 'headphones';
    const name = state === 'done' ? 'glyph-check-white' : hp ? 'glyph-v1-headphones-muted' : `glyph-${l.g}-${state === 'cur' ? 'white' : 'muted'}`;
    return `<img src="${ICON}${name}.png" alt=""${hp && state === 'cur' ? ' style="filter:brightness(0) invert(1)"' : ''}>`; };
  const stateOf = (i) => i < cur ? 'done' : i === cur ? 'cur' : 'locked';

  // ---- build the circles ----
  const mk = (l, cls = '') => { const n = document.createElement('div'); n.className = 'node ' + cls; n.style.cssText = `left:${l.x}px;top:${l.y}px;--d:9px`; n.innerHTML = '<i class="halo"></i><span class="face"></span>'; path.appendChild(n); return n; };
  const rows = LESSONS.map((l, i) => { const node = mk(l); M.pressable(node, () => { if (i === cur) openSheet(); else if (i > cur) M.shake(node, 4, T.shakeSmall); }); return { node, face: $('.face', node), halo: $('.halo', node), l }; });
  const nextUnit = mk({ x: 228.9, y: 713.9 }); $('.face', nextUnit).innerHTML = `<img src="${ICON}glyph-star-muted.png" alt="">`; M.pressable(nextUnit, () => M.shake(nextUnit, 4, T.shakeSmall));
  const trophy = document.createElement('button'); trophy.className = 'p3d trophyn'; trophy.innerHTML = `<span class="face"><img src="${ICON}trophy-unit.png" alt=""></span>`; path.appendChild(trophy);
  M.pressable(trophy, () => { if (cur >= LESSONS.length) openSheet(); else M.shake(trophy, 4, T.shakeSmall); });

  // the page scrolls so the current circle stays in view
  let scrollY = -196;
  const scrollTo = (ms = 300) => { const y = cur < LESSONS.length ? LESSONS[cur].y : 621; const to = -196 - Math.max(0, y - 500); if (to === scrollY) return;
    M.anim(path, [{ top: scrollY + 'px' }, { top: to + 'px' }], { duration: ms, easing: EASE.std }); path.style.top = to + 'px'; scrollY = to; };
  function paint() {
    rows.forEach((r, i) => { const s = stateOf(i); r.node.className = 'node' + (s === 'locked' ? '' : ' ' + s); r.face.innerHTML = glyph(r.l, s); });
    if (glow) glow.cancel(); glow = cur < LESSONS.length ? M.glow(rows[cur].halo) : null; scrollTo(0);
  }

  // ---- numbers at the top ----
  const sSt = $('#sSt'), sPh = $('#sPh');
  const flame = await M.rive($('canvas', sSt), 'Streak Flame'); flame.boolean('lit').value = true;
  $$('.stat').forEach((s) => s.addEventListener('click', () => M.punch(s, 1.12, 180)));
  const lightStreak = () => { if (!sSt.classList.contains('notyet')) return;
    sSt.classList.remove('notyet'); flame.boolean('lit').value = true; flame.trigger('ignite').trigger(); SND.play('streak');
    const n = $('span', sSt); n.textContent = +n.textContent + 1; M.punch(sSt, 1.16, 220); M.pop($('canvas', sSt), 0xFFFF9F1C); };
  const twk = await M.rive($('#twk'), 'FX Twinkle'); twk.color('color').value = GOLD;

  // ---- the "you finished a lesson" beat (T2, about 1.2 s) ----
  async function finish() {
    if (busy || cur >= LESSONS.length) return; busy = true; closeSheet();
    const was = rows[cur]; if (glow) glow.cancel();
    // 1. the circle turns violet, the check pops in, FX Pop
    was.node.className = 'node done'; was.face.innerHTML = glyph(was.l, 'done'); M.popIn(was.face.firstChild); M.punch(was.node, 1.1); M.pop(was.node, VIOLET);
    await M.wait(150);
    // 2. the new phrases fly to the counter; it bumps as each lands
    const count = $('span', sPh), target = +count.textContent + 3;
    flyTo(was.node, sPh, 5, (i) => { M.punch(sPh, 1.14, 150); if (i % 2 === 0) count.textContent = Math.min(+count.textContent + 1, target); }, phone);
    await M.wait(300);
    cur++; scrollTo();
    await M.wait(150);
    // 3. the next circle unlocks: bounce + shine, then its ring starts
    if (cur < LESSONS.length) {
      const nx = rows[cur]; nx.node.className = 'node cur'; nx.face.innerHTML = glyph(nx.l, 'cur');
      SND.play('unlock'); if (!M.reduce) M.anim(nx.node, [{ scale: '.8' }, { scale: '1.14', offset: 0.55 }, { scale: '1' }], { duration: 340 });
      M.shine(nx.node); await M.wait(340); glow = M.glow(nx.halo);
    } else {                                                    // all five done: the trophy wakes up, the banner shines once
      if (!M.reduce) M.anim(trophy, [{ scale: '.86' }, { scale: '1.12', offset: 0.55 }, { scale: '1' }], { duration: 340 });
      SND.play('unlock'); M.shine(trophy); M.shine($('#banner'));
      const fire = () => { if (!M.reduce) twk.trigger('fire').trigger(); }; fire(); clearInterval(twinkleTimer); twinkleTimer = setInterval(fire, 2600);
    }
    lightStreak(); busy = false;
  }

  // ---- lesson start sheet ----
  const sheet = $('#sheet'), backdrop = $('#backdrop'); let open = false, stopShine = () => {};
  async function openSheet() {
    if (open || busy) return; open = true; const l = cur < LESSONS.length ? LESSONS[cur] : CHECKPOINT;
    $('#shK').textContent = cur < LESSONS.length ? `${cur + 1}-DARS · KAFEDA` : 'NAZORAT NUQTASI · KAFEDA'; $('#shT').textContent = l.t; $('#shP').textContent = l.p;
    backdrop.style.pointerEvents = 'auto'; SND.play('whoosh');
    M.anim(backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
    M.anim(sheet, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] :
      [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' });
    M.fadeUp($('.cansay', sheet), 10, 220, 120); M.fadeUp($('.meta', sheet), 8, 200, 180);
    await M.wait(380); M.shine($('#shStart')); stopShine = shineLoop($('#shStart'));
  }
  function closeSheet() {
    if (!open) return; open = false; stopShine(); backdrop.style.pointerEvents = 'none'; SND.play('close');
    M.anim(backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    M.anim(sheet, [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' });
  }
  backdrop.onclick = closeSheet;
  M.pressable($('#shStart'), closeSheet); M.pressable($('#banner'));
  $$('.audio', sheet).forEach((b) => { M.pressable(b); b.addEventListener('pointerup', async () => {
    const bars = $('.bars', b), img = $('img', b); if (b._p) return; b._p = true; img.style.opacity = 0; bars.style.opacity = 1; const w = M.waves(bars);
    await M.wait(+b.dataset.ms); w.forEach((a) => a.cancel()); bars.style.opacity = 0; img.style.opacity = 1; b._p = false; }); });

  // ---- tabs: the violet pill fades to the chosen icon, the icon hops, the page cross-fades ----
  const other = $('#other');
  $$('#tabs .tab').forEach((t) => t.onclick = () => {
    if (t.classList.contains('on')) return; SND.play('tab');
    $$('#tabs .tab').forEach((o) => o.classList.remove('on')); t.classList.add('on');
    if (!M.reduce) M.anim($('img', t), [{ translate: '0 0' }, { translate: '0 -5px', offset: 0.4 }, { translate: '0 0' }], { duration: 240, easing: EASE.back });
    const name = t.dataset.p; if (name) other.textContent = name;
    M.anim(other, [{ opacity: getComputedStyle(other).opacity }, { opacity: name ? 1 : 0 }], { duration: 150, fill: 'forwards' });
  });

  // ---- side buttons ----
  const acts = {
    finish, sheet: openSheet,
    today: () => { sSt.classList.add('notyet'); flame.boolean('lit').value = false; $('span', sSt).textContent = 6; },
    reset: () => { closeSheet(); clearInterval(twinkleTimer); cur = 0; busy = false; $('span', sPh).textContent = 14; sSt.classList.remove('notyet'); flame.boolean('lit').value = true; $('span', sSt).textContent = 6; paint(); },
  };
  $$('.side .act').forEach((b) => b.onclick = () => acts[b.dataset.a]());
  paint();
  await M.initPop(); window.labReady = true;
})();
