// Wires each demo on the page to the motion primitives in motion.js.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ctl = (id, map) => $$(`#${id} .ctl button`).forEach((b) => b.onclick = () => map[b.dataset.a]());
const GREEN = 0xFF3DCB6C, GOLD = 0xFFFFC93C, VIOLET = 0xFF7B5CFF;

// ---- lab tools ----
const toggle = (id, fn) => { const b = $(id); b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); fn(on); }; };
toggle('#tDark', (on) => document.body.classList.toggle('dark', on));
toggle('#tSlow', (on) => { M.slow = on ? 4 : 1; document.documentElement.style.setProperty('--slow', M.slow); });
toggle('#tReduce', (on) => { M.reduce = on; });

// every plain button on the page presses
$$('.btn:not(.check):not(#mainBtn), .audio').forEach((b) => M.pressable(b));

// ---- the check button: grey until something is picked, then ready (colour + one shine) ----
function setReady(btn, ready) {
  if (ready === !btn.classList.contains('disabled')) return;
  btn.classList.toggle('disabled', !ready); btn.classList.toggle('primary', ready);
  if (ready) M.wait(T.colour).then(() => { if (!btn.classList.contains('disabled')) M.shine(btn); });
  else $$('.sheen', btn).forEach((s) => s.getAnimations().forEach((a) => a.cancel()));
}
function checkButton(btn, onCheck) {
  M.pressable(btn, () => { if (btn.classList.contains('disabled')) M.shake(btn, 4, T.shakeSmall); else onCheck(); });
}

// ---- main button ----
{
  const b = $('#mainBtn'); let timer = 0;
  const loop = () => { clearInterval(timer); timer = setInterval(() => { if (!b.classList.contains('disabled')) M.shine(b); }, T.shineEvery * M.slow); };
  checkButton(b, loop);                                           // a tap restarts the 5 s wait
  ctl('dMain', { ready: () => { setReady(b, true); loop(); }, disable: () => { setReady(b, false); clearInterval(timer); }, shine: () => M.shine(b) });
}

// ---- answer tiles and picture tiles: pick, then check ----
function pickAndCheck(id, popTarget = (t) => t) {
  const root = $(`#${id} .stage`), tiles = $$('.tile', root), check = $('.check', root), right = +root.dataset.correct;
  let picked = -1, locked = false;
  tiles.forEach((t, i) => M.pressable(t, () => {
    if (locked) return;
    tiles.forEach((o) => { o.classList.remove('sel'); if (o !== t) o._setRest(0); });
    picked = i; t.classList.add('sel'); t._setRest(-2); setReady(check, true);
  }));
  checkButton(check, async () => {
    if (locked) return; locked = true;
    const t = tiles[picked]; t.classList.remove('sel'); t._setRest(0);
    if (picked === right) { t.classList.add('ok'); M.punch(t); M.pop(popTarget(t), GREEN); SND.play('right'); }
    else { t.classList.add('no'); M.shake(t); SND.play('not-right'); await M.wait(120); tiles[right].classList.add('ok'); }
    setReady(check, false);
  });
  ctl(id, { reset: () => { locked = false; picked = -1; tiles.forEach((t) => { t.classList.remove('sel', 'ok', 'no'); t._setRest(0); }); setReady(check, false); } });
}
pickAndCheck('dAnswer');
pickAndCheck('dPicture', (t) => $('.pic', t));

// ---- Tile Builder ----
{
  const WORDS = ['orange', 'please.', 'A', 'An', 'juice,', 'tea'], RIGHT = ['An', 'orange', 'juice,', 'please.'];
  const line = $('#bLine'), bank = $('#bBank'), check = $('#dBuilder .check'); let locked = false;
  const rects = () => new Map($$('.word', line).map((t) => [t, t.getBoundingClientRect()]));
  const settle = (before) => before.forEach((r, t) => { if (t.isConnected && t.parentNode === line) M.flyFrom(t, r, { arc: false, ms: T.tileClose }); });
  function build() {
    line.innerHTML = ''; bank.innerHTML = ''; locked = false; setReady(check, false);
    WORDS.forEach((w) => {
      const t = document.createElement('button'); t.className = 'p3d tile word'; t.innerHTML = `<span class="face">${w}</span>`; bank.appendChild(t);
      M.pressable(t, async () => {
        if (locked) return;
        const from = t.getBoundingClientRect(), before = rects();
        if (t.parentNode === bank) {                                // bank -> line, a grey slot stays behind
          const slot = t.cloneNode(true); slot.classList.add('used'); t._slot = slot; bank.replaceChild(slot, t); line.appendChild(t);
          await M.flyFrom(t, from); M.land(t); SND.play('tile', { step: SND.deg(line.children.length - 1) });   // each tile lands one step higher
        } else { t._slot.replaceWith(t); settle(before); SND.play('tile', { step: -5, volume: 0.6 }); await M.flyFrom(t, from); }   // line -> back to its slot (lower, softer)
        setReady(check, line.children.length > 0);
      });
    });
  }
  checkButton(check, async () => {
    if (locked) return; locked = true;
    const tiles = $$('.word', line), ok = tiles.length === RIGHT.length && tiles.every((t, i) => t.textContent === RIGHT[i]);
    if (ok) { SND.play('right'); for (const t of tiles) { t.classList.add('ok'); M.punch(t, 1.06); await M.wait(T.wave); } M.pop(line, GREEN); }
    else { SND.play('not-right'); tiles.forEach((t, i) => { if (t.textContent !== RIGHT[i]) { t.classList.add('no'); M.shake(t); } }); }
    setReady(check, false);
  });
  ctl('dBuilder', { reset: build }); build();
}

// ---- Tap the mistake ----
{
  const sent = $('#mSent'), check = $('#dMistake .check'), WORDS = ['A', 'orange', 'juice,', 'please.'], BAD = 0, FIX = 'An';
  let picked = -1, locked = false;
  function build() {
    sent.innerHTML = ''; picked = -1; locked = false; setReady(check, false);
    WORDS.forEach((w, i) => { const s = document.createElement('span'); s.className = 'mword'; s.textContent = w; sent.appendChild(s);
      s.onclick = () => { if (locked) return; $$('.mword', sent).forEach((o) => o.classList.remove('sel')); s.classList.add('sel'); picked = i; setReady(check, true); }; });
  }
  checkButton(check, async () => {
    if (locked) return; locked = true; setReady(check, false);
    const words = $$('.mword', sent), w = words[picked]; w.classList.remove('sel');
    if (picked !== BAD) { w.classList.add('no'); M.shake(w); SND.play('not-right'); await M.wait(120); words[BAD].classList.add('ok'); return; }
    w.classList.add('ok'); SND.play('right');
    const strike = document.createElement('i'); strike.style.cssText = 'position:absolute;left:4px;right:4px;top:50%;height:3px;border-radius:2px;background:var(--green-edge);transform-origin:0 50%';
    w.appendChild(strike);
    await M.anim(strike, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 200, fill: 'forwards' });
    await M.wait(160);
    await M.anim(w, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 8px' }], { duration: 110, easing: EASE.in, fill: 'forwards' });
    w.textContent = FIX;
    await M.anim(w, [{ opacity: 0, translate: '0 -14px' }, { opacity: 1, translate: '0 0' }], { duration: 200, fill: 'forwards' });
    M.land(w); M.pop(w, GREEN);
  });
  ctl('dMistake', { reset: build }); build();
}

// ---- Tap the gap ----
{
  const sent = $('#gSent'), check = $('#dGap .check'), RIGHT = 1; let picked = -1, locked = false, breath = [];
  function build() {
    breath.forEach((a) => a.cancel()); breath = []; picked = -1; locked = false; setReady(check, false);
    sent.innerHTML = 'How <span class="gap">+</span> much <span class="gap">+</span> this?';
    $$('.gap', sent).forEach((g, i) => {
      const a = g.animate([{ scale: '1' }, { scale: '1.09' }], { duration: T.glow / 2, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 300 });
      a.playbackRate = 1 / M.slow; if (M.reduce) a.cancel(); breath.push(a);
      g.onclick = () => { if (locked) return; $$('.gap', sent).forEach((o, k) => { o.classList.remove('sel'); if (!M.reduce) breath[k].play(); });
        g.classList.add('sel'); breath[i].cancel(); M.punch(g, 1.12, 160); picked = i; setReady(check, true); };
    });
  }
  checkButton(check, async () => {
    if (locked) return; locked = true; setReady(check, false);
    const gaps = $$('.gap', sent), g = gaps[picked]; breath.forEach((a) => a.cancel());
    if (picked !== RIGHT) { g.classList.remove('sel'); g.style.cssText = 'background:var(--red-soft);border-color:var(--red);color:var(--red-edge)'; M.shake(g); SND.play('not-right'); return; }
    SND.play('right'); const other = gaps[1 - picked];
    M.anim(other, [{ width: '40px', opacity: 1, marginLeft: '0px' }, { width: '0px', opacity: 0, marginLeft: '-8px' }], { duration: T.tileClose, easing: EASE.std, fill: 'forwards' })
      .then(() => other.remove());
    const w = document.createElement('span'); w.className = 'mword ok'; w.textContent = 'is'; g.replaceWith(w);
    await M.anim(w, [{ opacity: 0, translate: '0 -14px' }, { opacity: 1, translate: '0 0' }], { duration: 200, fill: 'forwards' });
    M.land(w); M.pop(w, GREEN);
  });
  ctl('dGap', { reset: build }); build();
}

// ---- progress bar + combo (also used by the phone demo) ----
function progressBar(fill, comboEl, start = 30) {
  let pct = start, combo = +comboEl.textContent || 0;
  fill.style.width = pct + '%';
  const grow = (to) => { const from = pct; pct = Math.min(to, 100); fill.style.width = pct + '%';
    M.anim(fill, [{ width: from + '%' }, { width: Math.min(pct + 2.5, 100) + '%', offset: 0.7 }, { width: pct + '%' }], { duration: T.barGrow }); M.shine(fill); };
  return {
    right(step = 14) { grow(pct + step); combo++; comboEl.textContent = combo; M.punch(comboEl, 1.3, 180);
      if (combo >= 5) fill.classList.add('gold');
      if (pct >= 100) M.wait(T.barGrow).then(() => M.pop(fill, combo >= 5 ? GOLD : GREEN, 'end'));
      return combo; },
    get pct() { return pct; },
    wrong() { grow(pct + 4); combo = 0; comboEl.textContent = 0; fill.classList.remove('gold'); },
    reset() { pct = start; combo = 0; comboEl.textContent = 0; fill.classList.remove('gold'); fill.style.width = pct + '%'; },
  };
}
{ const bar = progressBar($('#pFill'), $('#pCombo')); ctl('dBar', { right: () => bar.right(), wrong: () => bar.wrong(), reset: () => bar.reset() }); }

// ---- feedback sheets ----
const Sheets = {
  async show(el) { el._up = true; M.sheetUp(el);
    const badge = $('.badge', el), tip = $('.tipbox', el);
    if (badge) { badge.style.opacity = 0; await M.wait(60); badge.style.opacity = 1; M.popIn(badge); }
    if (tip) M.fadeUp(tip, 8, 200, 80); },
  hide(el) { if (el._up) { el._up = false; return M.sheetDown(el); } },
};
ctl('dSheet', { ok: () => { Sheets.hide($('#sNo')); Sheets.show($('#sOk')); }, no: () => { Sheets.hide($('#sOk')); Sheets.show($('#sNo')); },
  hide: () => { Sheets.hide($('#sOk')); Sheets.hide($('#sNo')); } });

// ---- toast and tip ----
ctl('dToast', {
  toast: async () => { const t = $('#toast'); SND.play('pop'); await M.anim(t, [{ opacity: 0, translate: '0 -20px' }, { opacity: 1, translate: '0 0' }], { duration: T.toastIn, fill: 'forwards' });
    await M.wait(T.toastHold); M.fadeOut(t, -12, T.toastOut); },
  tip: () => { SND.play('pop'); M.popIn($('#uztip')); },
});

// ---- audio buttons: the icon turns into moving bars while the sound plays ----
$$('.audio').forEach((b) => b.addEventListener('pointerup', async () => {
  const bars = $('.bars', b), img = $('img', b); if (!bars || b._playing) return; b._playing = true;
  img.style.opacity = 0; bars.style.opacity = 1; const w = M.waves(bars);
  await M.wait(+b.dataset.ms); w.forEach((a) => a.cancel()); bars.style.opacity = 0; img.style.opacity = 1; b._playing = false;
}));

// ---- mic ----
(async () => {
  const mic = $('#mic'), btn = $('.p3d', mic), cap = $('.cap', mic), halo = $('.halo', mic), bars = $('.bars', mic), dots = $('.dots', mic), glyph = $('.g-mic', mic);
  const res = $('#micResult'), wordsEl = $('.words', res);
  const check = Object.assign(document.createElement('img'), { src: '/pendev/icons-r2/glyph-check-white.png' }); check.style.opacity = 0; $('.face', btn).appendChild(check);
  const fx = $('canvas', mic), voice = await M.rive(fx, 'FX Voice');
  let glow, wave = [], bounce = [], busy = false, run = 0; const draw = voiceBars([...bars.children], 30);
  const say = (text) => { cap.textContent = text; M.anim(cap, [{ opacity: 0 }, { opacity: 1 }], { duration: 140 }); };
  const state = (s) => { mic.classList.remove('listening', 'thinking', 'heard'); if (s) mic.classList.add(s);
    glyph.style.opacity = s ? 0 : 1; bars.style.opacity = s === 'listening' ? 1 : 0; dots.style.opacity = s === 'thinking' ? 1 : 0; check.style.opacity = 0;
    fx.style.opacity = s === 'listening' || s === 'heard' ? 1 : 0;      // the voice rings only show while listening and for the check draw
    wave.forEach((a) => a.cancel()); bounce.forEach((a) => a.cancel()); wave = []; bounce = []; if (glow) glow.cancel(); glow = null; };
  const idle = () => { state(null); say('Bosib gapiring'); glow = M.glow(halo); voice.number('amp').value = 0; };
  async function speak(kind, real = false) {                                                        // real: the mic button itself was pressed, so the real mic listens
    if (busy) return; busy = true; const me = ++run; res.style.opacity = 0;
    SND.mic(true); state('listening'); say('Tinglayapman…');                                             // the blip, then nothing may play while the mic listens
    const got = await hearVoice({ n: 3, ms: 1500, loud: kind !== 'silent', real, alive: () => me === run, onLevel: (level, bands) => { voice.number('amp').value = level * 100; draw(level, bands); } });
    if (me !== run) return; if (got !== 'heard') kind = 'silent';
    SND.mic(false, kind === 'silent');
    if (kind === 'silent') { SND.play('nothing'); idle(); say('Eshitmadim. Yana bir bor ayting'); M.anim(btn, [{ translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }], { duration: 300, easing: EASE.sine }); busy = false; return; }
    state('thinking'); say('Tekshiryapman…');
    bounce = [...dots.children].map((d, i) => { const a = d.animate([{ translate: '0 2px' }, { translate: '0 -5px' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 110 }); a.playbackRate = 1 / M.slow; return a; });
    await M.wait(600); if (me !== run) return;
    state('heard'); say('Eshitdim!'); voice.trigger('heard').trigger(); M.punch(btn, 1.06);
    M.wait(700).then(() => { if (me === run) { check.style.opacity = 1; fx.style.opacity = 0; } });
    const WORDS = ['A', 'tea,', 'please.'];
    wordsEl.innerHTML = WORDS.map((w) => `<span class="chipw">${w}</span>`).join(''); M.fadeUp(res, 10, 200);
    await M.wait(260);
    for (const [i, c] of [...wordsEl.children].entries()) { if (me !== run) return;
      if (kind === 'retry' && i === 1) c.classList.add('retry'); else { c.classList.add('good'); M.punch(c, 1.1, 160); SND.appear(); }
      await M.wait(90); }
    busy = false;
  }
  M.pressable(btn, () => speak('say', true));
  ctl('dMic', { say: () => speak('say'), retry: () => speak('retry'), silent: () => speak('silent'), reset: () => { run++; busy = false; res.style.opacity = 0; SND.mic(false, true); idle(); } });
  idle();
})();

M.initPop().then(() => { window.labReady = true; });
window.Lab = { setReady, checkButton, progressBar, Sheets, GREEN, GOLD };
