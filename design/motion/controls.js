// Sheets and controls: toggles, text field, segmented switch, rating form, time wheel, sheets, dialog, loading, offline.
(async () => {
  const ctl = (id, map) => $$(`#${id} .ctl button`).forEach((b) => b.onclick = () => map[b.dataset.a]());
  const ready = (btn, on) => { btn.classList.toggle('disabled', !on); btn.classList.toggle('primary', on); if (on) M.wait(T.colour).then(() => M.shine(btn)); };
  const toast = async (el, hold = T.toastHold) => { SND.play('pop'); await M.anim(el, [{ opacity: 0, translate: '0 -20px' }, { opacity: 1, translate: '0 0' }], { duration: T.toastIn, fill: 'forwards' });
    if (hold) { await M.wait(hold); M.fadeOut(el, -12, T.toastOut); } };
  $$('.btn').forEach((b) => M.pressable(b));

  // ---- toggle: the knob slides and stretches, the track changes colour ----
  $$('.toggle').forEach((t) => {
    const knob = $('i', t); if (t.classList.contains('on')) knob.style.translate = '20px 0';
    t.onclick = () => {
      const on = !t.classList.contains('on'); t.classList.toggle('on', on); SND.play(on ? 'switch-on' : 'switch-off');
      const from = on ? 0 : 20, to = on ? 20 : 0; knob.style.translate = `${to}px 0`;
      M.anim(knob, M.reduce ? [{ translate: `${from}px 0` }, { translate: `${to}px 0` }] :
        [{ translate: `${from}px 0`, scale: '1 1' }, { translate: `${(from + to) / 2}px 0`, scale: '1.18 .92', offset: 0.5 }, { translate: `${to}px 0`, scale: '1 1' }], { duration: 180, easing: EASE.std });
      if (t.id === 'darkToggle') { document.body.classList.add('themefade'); $('#tDark').click(); setTimeout(() => document.body.classList.remove('themefade'), 320); }
    };
  });

  // ---- text field ----
  {
    const f = $('#field'), check = $('#dField .check'); let typing = 0;
    f.oninput = () => { f.classList.remove('ok', 'no'); ready(check, f.value.trim().length > 0); };
    const judge = () => { if (check.classList.contains('disabled')) return M.shake(check, 4, T.shakeSmall);
      if (f.value.trim().toLowerCase() === 'coffee') { f.classList.add('ok'); M.punch(f, 1.05); M.pop(f, GREEN, 'end'); SND.play('right'); } else { f.classList.add('no'); M.shake(f); SND.play('not-right'); }
      ready(check, false); f.blur(); };
    check.addEventListener('pointerup', judge); f.onkeydown = (e) => { if (e.key === 'Enter') judge(); };
    const type = async (word) => { const me = ++typing; f.value = ''; f.classList.remove('ok', 'no'); f.focus();
      for (const ch of word) { await M.wait(90); if (me !== typing) return; f.value += ch; f.oninput(); } };
    ctl('dField', { right: () => type('coffee'), wrong: () => type('cofee'), reset: () => { typing++; f.value = ''; f.classList.remove('ok', 'no'); ready(check, false); } });
  }

  // ---- segmented switch: the pill slides under the chosen word ----
  {
    const seg = $('#seg'), thumb = $('.thumb', seg), btns = $$('button', seg);
    const place = (b, animate) => { const from = { left: thumb.style.left || '4px', width: thumb.style.width || b.offsetWidth + 'px' };
      thumb.style.left = b.offsetLeft + 'px'; thumb.style.width = b.offsetWidth + 'px';
      if (animate) M.anim(thumb, [from, { left: b.offsetLeft + 'px', width: b.offsetWidth + 'px' }], { duration: 180, easing: EASE.std }); };
    btns.forEach((b) => b.onclick = () => { if (!b.classList.contains('on')) SND.play('seg'); btns.forEach((o) => o.classList.remove('on')); b.classList.add('on'); place(b, true); });
    document.fonts.ready.then(() => place(btns[0], false));
  }

  // ---- rating + feedback form ----
  {
    const form = $('#form'), rating = $('#rating'), send = $('#form .check'); let picked = 0;
    rating.innerHTML = [1, 2, 3, 4, 5].map((n) => `<button class="p3d rate"><span class="face">${n}</span></button>`).join('');
    const rates = $$('.rate', rating);
    rates.forEach((r, i) => M.pressable(r, () => { rates.forEach((o) => o.classList.remove('sel')); r.classList.add('sel'); M.punch(r, 1.1, 180); picked = i + 1; ready(send, true); }));
    send.addEventListener('pointerup', async () => {
      if (send.classList.contains('disabled')) return M.shake(send, 4, T.shakeSmall);
      await M.wait(120);
      await M.anim(form, [{ opacity: 1, scale: '1', translate: '0 0' }, { opacity: 0, scale: '.9', translate: '0 -40px' }], { duration: 220, easing: EASE.in, fill: 'forwards' });
      toast($('#thanks'));
    });
    ctl('dForm', { reset: () => { form.getAnimations().forEach((a) => a.cancel()); rates.forEach((o) => o.classList.remove('sel')); picked = 0; ready(send, false); } });
  }

  // ---- reminder time wheel: turns without end, keeps moving after a flick (timeWheel in lab.js) ----
  timeWheel($('#wheel'), DAY, DAY.indexOf('19:00'));

  // ---- bottom sheet (quit the lesson) ----
  {
    const sheet = $('#qsheet'), back = $('#dQuit .backdrop'); let open = false;
    dombiInto($('canvas', sheet), $('.qdombi', sheet), 80);
    M.rive($('canvas', sheet), 'Dombi', 'Dombi').then((d) => { const set = () => { d.boolean('dark').value = document.body.classList.contains('dark'); }; set(); document.addEventListener('lab-dark', set); });
    const show = () => { if (open) return; open = true; back.style.pointerEvents = 'auto';
      SND.play('whoosh'); M.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
      M.anim(sheet, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] :
        [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' }); };
    const hide = () => { if (!open) return; open = false; back.style.pointerEvents = 'none'; SND.play('close');
      M.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      M.anim(sheet, [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' }); };
    back.onclick = hide; $('.btn', sheet).addEventListener('pointerup', hide); $('.leave', sheet).onclick = hide;
    ctl('dQuit', { open: show, close: hide });
  }

  // ---- dialog, then the rows collapse one by one ----
  {
    const dlg = $('#dialog'), back = $('#dDialog .backdrop'), recs = $('#recs');
    const fill = () => { recs.innerHTML = ['Hello!', 'A coffee, please.', 'How much is it?', 'Thank you! Goodbye!'].map((t, i) =>
      `<div class="rec"><img src="${ICON}glyph-play-violet.png" alt="">${t}<small>${12 - i * 3}-okt</small></div>`).join(''); };
    const show = () => { back.style.pointerEvents = dlg.style.pointerEvents = 'auto'; SND.play('pop'); M.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
      M.anim(dlg, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, scale: '.9' }, { opacity: 1, scale: '1.02', offset: 0.7 }, { opacity: 1, scale: '1' }], { duration: 220, fill: 'forwards' }); };
    const hide = () => { back.style.pointerEvents = dlg.style.pointerEvents = 'none'; SND.play('close'); M.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      return M.anim(dlg, [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.96' }], { duration: 140, easing: EASE.in, fill: 'forwards' }); };
    $('.secondary', dlg).addEventListener('pointerup', hide); back.onclick = hide;
    $('.danger', dlg).addEventListener('pointerup', async () => {
      await hide(); const rows = $$('.rec', recs);
      await Promise.all(rows.map((r, i) => (SND.appear(i * 70 + 1), M.anim(r, [{ height: '52px', marginBottom: '8px', opacity: 1, borderWidth: '2px' }, { height: '0px', marginBottom: '0px', opacity: 0, borderWidth: '0px' }],
        { duration: 180, delay: i * 70 * M.slow, easing: EASE.std, fill: 'forwards' }))));
      toast($('#deleted'));
    });
    ctl('dDialog', { open: show, reset: fill }); fill();
  }

  // ---- loading: shimmer, then the content fades up in a short stagger ----
  {
    const sk = $$('#skel > .sk, #skel > .skrow'), real = $$('#skel .real > *');
    ctl('dLoad', {
      load: () => { sk.forEach((s) => M.anim(s, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' })); real.forEach((r, i) => M.fadeUp(r, 10, 220, 80 + i * T.stagger)); },
      reset: () => [...sk, ...real].forEach((e) => e.getAnimations().forEach((a) => a.cancel())),
    });
  }

  // ---- offline ----
  {
    const t = $('#offToast'), card = $('#problem'), icon = $('img', card), btn = $('.btn', card), lbl = $('.lbl', btn), dots = $('.bdots', btn); let online = true, pulse, trying = false;
    const go = (off) => { online = !off;
      if (off) { toast(t, 0); if (!M.reduce) { pulse = icon.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: 1000, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); pulse.playbackRate = 1 / M.slow; } }
      else { M.fadeOut(t, -12, T.toastOut); if (pulse) pulse.cancel(); } };
    btn.addEventListener('pointerup', async () => {
      if (trying) return; trying = true; lbl.style.opacity = 0; dots.style.opacity = 1;
      const b = [...dots.children].map((d, i) => { const a = d.animate([{ translate: '0 2px' }, { translate: '0 -5px' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 110 }); a.playbackRate = 1 / M.slow; return a; });
      await M.wait(1100); b.forEach((a) => a.cancel()); dots.style.opacity = 0; lbl.style.opacity = 1; trying = false;
      if (online) M.pop(btn, GREEN); else M.shake(card, 5, T.shakeSmall);
    });
    ctl('dOffline', { offline: () => go(true), online: () => go(false) });
  }

  await M.initPop(); window.labReady = true;
})();
