// Profile page: built from data, then its motion (load, scroll, awards).
(async () => {
  const scroll = $('#scroll'), body = $('#pbody'), banner = $('#banner');
  const REC = [['tile-grey', 'medal-silver', '#14', 'Eng yuqori liga', '9-okt, 2026'], ['tile-orange', 'flame-streak', '12', 'Eng uzun seriya', '16-sen, 2026'], ['tile-gold', 'sparkles', '23', 'Mukammal darslar', '2-okt, 2026']];
  const AW = [['target', 'var(--green)', 'var(--green-soft)', 5, 'Xatosiz yakun', '2 / 5', 1], ['hands-up', '#F25CA2', 'var(--tile-pink)', 1, 'Do\'stona', '1 / 10', 1], ['bell', 'var(--gold-edge)', 'var(--gold-soft)', 3, 'Erta turuvchi', '1 / 10', 1],
    ['studio-mic', 'var(--violet)', 'var(--violet-soft)', 250, 'Gapiruvchi', '2 / 10', 1], ['bulb-tip', 'var(--coral)', 'var(--coral-soft)', 10, 'Xato ovchisi', '1 / 10', 0], ['crown', 'var(--gold-edge)', 'var(--gold-soft)', 1, 'Afsona', '1 / 10', 0]];
  body.innerHTML = `
    <div class="ident"><div class="avatar2" id="avatar">I</div><div class="name rv">Ibrokhim</div><div class="lvchip rv"><img src="${ICON}level-badge.png" alt="">0-daraja</div></div>
    <div class="bio rv">Hi this is me</div>
    <div class="goalcard rv"><img src="${ICON}plane.png" alt=""><span><b>Sayohat</b><small>Kafe, do'kon, ...</small></span><i>O'ZGARTIRISH</i></div>
    <div class="social rv"><div class="cnt"><b>8</b><small>Do'stlar</small></div>
      <button class="p3d fbtn" id="addf"><span class="face"><img src="${ICON}glyph-user-violet.png" alt=""><span class="lbl">DO'ST QO'SHISH</span></span></button>
      <button class="p3d fbtn sq"><span class="face"><img src="${ICON}glyph-phone-violet.png" alt=""></span></button></div>
    <div class="p3d promo rv"><span class="face"><span class="row"><span class="txt">Darslar bilan hayvoningizga yangi kiyim oling!<span class="days"><img src="${ICON}glyph-timer-white.png" alt="">10 KUNDA</span></span>
      <span class="art"><img class="hat" src="${ICON}top-hat.png" alt=""><img class="scarf" src="${ICON}scarf.png" alt=""></span></span>
      <button class="p3d see"><span class="face">KO'RISH</span></button></span></div>
    <div class="h13 rv">UMUMIY KO'RINISH</div>
    <div class="over rv" id="over">${[['flame-streak', 6, ' kun'], ['bubble-phrases', 14, ' ibora'], ['medal-silver', null, 'Kumush liga'], ['apple-currency', 240, ' olma']].map(([ic, n, t]) =>
      `<div><img src="${ICON}${ic}.png" alt=""><span>${n == null ? '' : `<b data-to="${n}">${n}</b>`}${t}</span></div>`).join('')}</div>
    <div class="h13 rv">DO'STLAR BILAN SERIYA</div><div class="fstreaks rv">${'<i>+</i>'.repeat(5)}</div>
    <div class="h13 rv">SHAXSIY REKORDLAR</div>
    <div class="records rv">${REC.map(([c, ic, n, t, d]) => `<div class="rec2"><div class="t"><u style="background:var(--${c})"></u><img src="${ICON}${ic}.png" alt=""><b>${n}</b></div><b>${t}</b><small>${d}</small></div>`).join('')}</div>
    <div class="h13 rv">MUKOFOTLAR<i>BARCHASI</i></div>
    <div class="awards" id="awards"><canvas class="atw" id="atw" width="300" height="250"></canvas>${AW.map(([ic, c, soft, n, t, p, isNew]) =>
      `<div class="award rv" style="--ac:${c};--ac-soft:${soft}"><div class="t"><u></u><img src="${ICON}${ic}.png" alt=""><div class="n"><b>${n}</b></div>${isNew ? '<span class="new">YANGI</span>' : ''}</div><b>${t}</b><small>${p}</small></div>`).join('')}</div>
    <div class="ver rv">Akademiya English · v0.1.0</div>`;
  $$('.p3d', $('#phone')).forEach((b) => M.pressable(b));
  const avatar = $('#avatar'), awards = $$('.award', body), twk = await M.rive($('#atw'), 'FX Twinkle'); twk.color('color').value = GOLD;

  // ---- sections fade up the first time they come into view; the numbers count up ----
  const seen = new WeakSet();
  const reveal = (el, delay = 0) => { if (seen.has(el)) return; seen.add(el); M.fadeUp(el, 12, 240, delay);
    if (el.id === 'over') $$('[data-to]', el).forEach((b) => { const to = +b.dataset.to; if (M.reduce) return; b.textContent = 0; M.wait(delay + 120).then(() => M.countUp(b, to, 600)); });
    const tag = $('.new', el); if (tag) { tag.style.opacity = 0; M.wait(delay + 260).then(() => { tag.style.opacity = 1; M.popIn(tag); }); } };
  const io = new IntersectionObserver((es) => { let i = 0; es.forEach((e) => { if (e.isIntersecting) reveal(e.target, i++ * 60); }); }, { root: scroll, threshold: 0.15 });
  $$('.rv', body).forEach((e) => io.observe(e));

  // ---- scrolling: banner parallax, the avatar shrinks a little ----
  scroll.addEventListener('scroll', () => { const y = scroll.scrollTop; if (M.reduce) return;
    banner.style.transform = `translateY(${y * 0.4}px)`; const k = Math.max(0.78, 1 - y / 600); avatar.style.scale = k; }, { passive: true });
  // drag to scroll (the wheel works too)
  { let d = null; scroll.addEventListener('pointerdown', (e) => { if (e.target.closest('.records')) return; d = { y: e.clientY, s: scroll.scrollTop }; });
    addEventListener('pointermove', (e) => { if (d) scroll.scrollTop = d.s - (e.clientY - d.y) / 0.75; }); addEventListener('pointerup', () => { d = null; });
    const r = $('.records', body); let h = null; r.addEventListener('pointerdown', (e) => { h = { x: e.clientX, s: r.scrollLeft }; r.style.scrollSnapType = 'none'; });
    addEventListener('pointermove', (e) => { if (h) r.scrollLeft = h.s - (e.clientX - h.x) / 0.75; }); addEventListener('pointerup', () => { if (h) { h = null; r.style.scrollSnapType = ''; } }); }

  // ---- always alive: the hat and scarf sway, a twinkle visits an earned award ----
  const sway = (el, a, ms) => { const base = parseFloat(getComputedStyle(el).rotate) || 0; const an = el.animate([{ rotate: `${base - a}deg` }, { rotate: `${base + a}deg` }], { duration: ms, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); an.playbackRate = 1 / M.slow; };
  sway($('.hat', body), 4, 1850); sway($('.scarf', body), 3, 2300);
  let last = -1; setInterval(() => { if (M.reduce) return; let i; do { i = Math.floor(Math.random() * 4); } while (i === last); last = i;
    const t = $('.t', awards[i]), c = $('#atw'); c.style.left = (awards[i].offsetLeft + t.offsetLeft - 25) + 'px'; c.style.top = (awards[i].offsetTop + t.offsetTop - 14) + 'px'; twk.trigger('fire').trigger(); }, 2800);

  // ---- friend button ----
  { const b = $('#addf'), img = $('img', b), lbl = $('.lbl', b); let sent = false;
    b.addEventListener('pointerup', async () => { const parts = [img, lbl]; sent = !sent;
      await Promise.all(parts.map((e) => M.anim(e, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -10px' }], { duration: 140, easing: EASE.in, fill: 'forwards' })));
      b.classList.toggle('sent', sent); img.src = `${ICON}${sent ? 'glyph-timer-muted' : 'glyph-user-violet'}.png`; lbl.textContent = sent ? 'SO\'ROV YUBORILDI' : 'DO\'ST QO\'SHISH'; if (sent) SND.play('sent');
      parts.forEach((e) => M.anim(e, [{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], { duration: 140, fill: 'forwards' })); }); }

  // ---- moments ----
  const open = () => { scroll.scrollTop = 0; $$('.rv', body).forEach((e) => { e.getAnimations().forEach((a) => a.cancel()); seen.delete(e); e.style.opacity = 0; });
    if (!M.reduce) M.anim(avatar, [{ scale: '.6', opacity: 0 }, { scale: '1.08', opacity: 1, offset: 0.6 }, { scale: '1' }], { duration: 320 });
    const r = scroll.getBoundingClientRect(); let i = 0; $$('.rv', body).forEach((e) => { const b = e.getBoundingClientRect(); if (b.top < r.bottom) { SND.appear(140 + i * 60); reveal(e, 140 + i++ * 60); } }); SND.play('pop', { volume: 0.7 }); };      // the avatar pops, the sections tick in
  const newAward = async () => { const a = awards[4], t = $('.t', a);
    const sr = scroll.getBoundingClientRect(), ar = a.getBoundingClientRect(), k = scroll.offsetHeight / sr.height;                 // the phone is scaled
    scroll.scrollTo({ top: scroll.scrollTop + (ar.top - sr.top) * k - 240, behavior: 'smooth' }); SND.hit('award', 650); await M.wait(650);
    M.punch(t, 1.18, 260); M.pop($('u', t), CORAL); M.shine($('u', t)); const n = $('.n b', a); n.textContent = +n.textContent + 1; M.punch(n, 1.3, 220);
    if (!$('.new', a)) { const tag = Object.assign(document.createElement('span'), { className: 'new', textContent: 'YANGI' }); t.appendChild(tag); await M.wait(160); M.popIn(tag); } };
  const acts = { open, award: newAward, top: () => scroll.scrollTo({ top: 0, behavior: 'smooth' }) };
  $$('.side .act').forEach((b) => b.onclick = () => acts[b.dataset.a]());
  await M.initPop(); open(); window.labReady = true;
})();
