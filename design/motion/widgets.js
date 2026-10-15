// Reusable live pieces for the full-screen pages (6 onward): mic, audio button, progress bar, sheets, check button.
// Every Rive view is made once, when the page loads, and then moved to where it is needed (see motion.js: start-up logo).
const W = {};

W.ready = (btn, on) => { if (on === !btn.classList.contains('disabled')) return; btn.classList.toggle('disabled', !on); btn.classList.toggle('primary', on);
  if (on) M.wait(T.colour).then(() => { if (!btn.classList.contains('disabled')) M.shine(btn); }); };

// audio button: the icon becomes moving bars while the sound plays. Returns a promise that ends with the sound.
W.play = async (btn, ms) => { const bars = $('.bars', btn), img = $('img', btn); if (!bars || btn._p) return; btn._p = true;
  img.style.opacity = 0; bars.style.opacity = 1; const w = M.waves(bars);
  await M.wait(ms); w.forEach((a) => a.cancel()); bars.style.opacity = 0; img.style.opacity = 1; btn._p = false; };
W.audioHTML = (cls, glyph) => `<button class="p3d audio ${cls}"><span class="face"><img src="${ICON}glyph-${glyph}.png" alt=""><span class="bars"><i></i><i></i><i></i>${cls === 'big' ? '<i></i>' : ''}</span></span></button>`;

// progress bar + combo number (same behaviour as page 1)
W.progress = (fill, comboEl, start = 30) => { let pct = start, combo = +comboEl.textContent || 0; fill.style.width = pct + '%';
  const grow = (to) => { const from = pct; pct = Math.min(to, 100); fill.style.width = pct + '%';
    M.anim(fill, [{ width: from + '%' }, { width: Math.min(pct + 2.5, 100) + '%', offset: 0.7 }, { width: pct + '%' }], { duration: T.barGrow }); M.shine(fill); };
  return { right(step = 12) { grow(pct + step); combo++; comboEl.textContent = combo; M.punch(comboEl, 1.3, 180); if (combo >= 5) fill.classList.add('gold'); return combo; },
    wrong() { grow(pct + 4); combo = 0; comboEl.textContent = 0; fill.classList.remove('gold'); } }; };

W.sheetShow = async (el) => { el._up = true; M.sheetUp(el); const badge = $('.badge', el), tip = $('.tipbox', el);
  if (badge) { badge.style.opacity = 0; await M.wait(60); badge.style.opacity = 1; M.popIn(badge); } if (tip) M.fadeUp(tip, 8, 200, 80); };
W.sheetHide = (el) => { if (el._up) { el._up = false; return M.sheetDown(el); } };

// ---- mic: one widget, four states. listen(ms, loud) plays a made-up voice through the FX Voice rings. ----
W.mic = async () => {
  const el = document.createElement('div'); el.className = 'mic';
  el.innerHTML = `<div class="ring"><i class="halo"></i><canvas width="400" height="400"></canvas>
    <button class="p3d"><span class="face"><img class="g-mic" src="${ICON}glyph-mic-white.png" alt=""><span class="bars"><i></i><i></i><i></i><i></i></span>
      <span class="dots" style="opacity:0"><i></i><i></i><i></i></span><img class="g-ok" src="${ICON}glyph-check-white.png" alt="" style="opacity:0"></span></button></div><div class="cap"></div>`;
  const btn = $('.p3d', el), cap = $('.cap', el), halo = $('.halo', el), bars = $('.bars', el), dots = $('.dots', el), glyph = $('.g-mic', el), ok = $('.g-ok', el), fx = $('canvas', el);
  document.body.appendChild(el); const voice = await M.rive(fx, 'FX Voice'); el.remove();
  let glow, wave = [], bounce = [], run = 0, pressed = 0, draw = null;
  btn.addEventListener('pointerdown', () => { pressed = performance.now(); });                 // a real press on the mic listens with the real mic
  const say = (text) => { cap.textContent = text; M.anim(cap, [{ opacity: 0 }, { opacity: 1 }], { duration: 140 }); };
  const state = (s) => { el.classList.remove('listening', 'thinking', 'heard'); if (s) el.classList.add(s);
    glyph.style.opacity = s ? 0 : 1; bars.style.opacity = s === 'listening' ? 1 : 0; dots.style.opacity = s === 'thinking' ? 1 : 0; ok.style.opacity = 0;
    fx.style.opacity = s === 'listening' || s === 'heard' ? 1 : 0;
    wave.forEach((a) => a.cancel()); bounce.forEach((a) => a.cancel()); wave = []; bounce = []; if (glow) glow.cancel(); glow = null; };
  const api = { el, btn, busy: false,
    idle(turn = true, text = 'Bosib gapiring') { run++; api.busy = false; SND.mic(false, true); state(null); say(text); voice.number('amp').value = 0; if (turn) glow = M.glow(halo); },
    // returns 'heard' or 'silent'; the caller decides what the words were
    async speak(loud = true, ms = 1500) {
      if (api.busy) return null; api.busy = true; const me = ++run;
      SND.mic(true); state('listening'); say('Tinglayapman…'); draw = draw || voiceBars([...bars.children], 30);   // the blip, then nothing may play while the mic listens
      const real = performance.now() - pressed < 1000;                                         // the lab's own buttons play a made-up voice instead
      const got = await hearVoice({ n: 3, ms, loud, real, alive: () => me === run, onLevel: (level, bands) => { voice.number('amp').value = level * 100; draw(level, bands); } });
      if (me !== run) return null; loud = got === 'heard';
      SND.mic(false, !loud);
      if (!loud) { SND.play('nothing'); api.idle(true, 'Eshitmadim. Yana bir bor ayting'); M.anim(btn, [{ translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }], { duration: 300, easing: EASE.sine }); return 'silent'; }
      state('thinking'); say('Tekshiryapman…');
      bounce = [...dots.children].map((d, i) => { const a = d.animate([{ translate: '0 2px' }, { translate: '0 -5px' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 110 }); a.playbackRate = 1 / M.slow; return a; });
      await M.wait(600); if (me !== run) return null;
      state('heard'); say('Eshitdim!'); voice.trigger('heard').trigger(); M.punch(btn, 1.06);
      M.wait(700).then(() => { if (me === run) { ok.style.opacity = 1; fx.style.opacity = 0; } });
      api.busy = false; return 'heard';
    } };
  return api;
};

// "SIZ AYTDINGIZ" card: the words light up one by one. bad = index of the word that was off (or -1).
W.result = async (card, words, bad = -1) => { const box = $('.words', card);
  box.innerHTML = words.map((w) => `<span class="chipw">${w}</span>`).join(''); card.style.opacity = 1; M.fadeUp(card, 10, 200);
  await M.wait(260);
  for (const [i, c] of [...box.children].entries()) { if (i === bad) c.classList.add('retry'); else { c.classList.add('good'); M.punch(c, 1.1, 160); SND.appear(); } await M.wait(90); } };
window.W = W;
