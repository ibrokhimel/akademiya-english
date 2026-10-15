// Motion primitives for the app's components. Every number here is the spec the app code copies.
// Source: docs/ideas/motion-plan.md (tiers, F-effects) and the rive-animation craft rules (snap then hold, ease by direction).
const EASE = {
  out: 'cubic-bezier(.05,.7,.1,1)',     // things arriving
  in: 'cubic-bezier(.3,0,.8,.15)',      // things leaving
  std: 'cubic-bezier(.2,0,0,1)',        // moving from A to B
  back: 'cubic-bezier(.34,1.56,.64,1)', // small overshoot (pops, releases)
  sine: 'cubic-bezier(.37,0,.63,1)',    // loops
};
const T = {                             // durations in ms
  pressDown: 60, pressUp: 140, colour: 120, select: 120,
  punch: 200, shake: 350, shakeSmall: 250, popIn: 220, shine: 600, shineEvery: 5000,
  sheetUp: 260, sheetDown: 180, toastIn: 220, toastHold: 2200, toastOut: 160,
  barGrow: 320, tileFly: 260, tileClose: 180, wave: 60, stagger: 40, exSlide: 250, countUp: 600, glow: 1200,
};
const M = { slow: 1, reduce: false, EASE, T };

M.wait = (ms) => new Promise((r) => setTimeout(r, ms * M.slow));
M.anim = (el, frames, o = {}) => {
  const a = el.animate(frames, { easing: EASE.out, fill: 'none', ...o });
  a.playbackRate = 1 / M.slow;
  return a.finished.catch(() => {});
};
const face = (el) => el.querySelector('.face') || el;

// ---- T0: press. The face drops onto its edge, then springs back. `rest` = resting offset (-2 when selected). ----
M.pressable = (el, onTap) => {
  const f = face(el); const depth = () => parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 4;
  let down = false;
  const to = (y, ms, easing) => {
    const cur = getComputedStyle(f).transform; if (f._pa) f._pa.cancel();             // start from where the face is now
    f._pa = f.animate([{ transform: cur === 'none' ? 'translateY(0px)' : cur }, { transform: `translateY(${y}px)` }], { duration: ms, easing, fill: 'forwards' });
    f._pa.playbackRate = 1 / M.slow;
  };
  el.addEventListener('pointerdown', () => { down = true; to(depth(), T.pressDown, EASE.out); });
  const up = (fire) => { if (!down) return; down = false; to(el._rest || 0, T.pressUp, EASE.back); if (fire && onTap) onTap(el); };
  el.addEventListener('pointerup', () => up(true)); el.addEventListener('pointerleave', () => up(false)); el.addEventListener('pointercancel', () => up(false));
  el._setRest = (y) => { el._rest = y; if (!down) to(y, T.select, EASE.back); };
};
M.tap = async (el) => {                 // a scripted press (used by the demos and the tests)
  const f = face(el), d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 4;
  await M.anim(f, [{ transform: `translateY(${el._rest || 0}px)` }, { transform: `translateY(${d}px)` }], { duration: T.pressDown, fill: 'forwards' });
  await M.anim(f, [{ transform: `translateY(${d}px)` }, { transform: `translateY(${el._rest || 0}px)` }], { duration: T.pressUp, easing: EASE.back, fill: 'forwards' });
};

// ---- F3 shine: a bright band slides across once ----
M.shine = (el) => {
  if (M.reduce) return;
  const f = face(el); let s = f.querySelector('.sheen');
  if (!s) { s = document.createElement('i'); s.className = 'sheen'; f.appendChild(s); }
  return M.anim(s, [{ left: '-50%' }, { left: '120%' }], { duration: T.shine, easing: EASE.sine });
};
// ---- F14 shake: only this element, three fading swings ----
M.shake = (el, amp = 8, ms = T.shake) => M.reduce ? null :
  M.anim(el, [0, -1, 0.75, -0.5, 0.25, 0].map((k) => ({ transform: `translateX(${k * amp}px)` })), { duration: ms, easing: 'linear', composite: 'add' });
// ---- scale punch (correct tile, counters) ----
M.punch = (el, s = 1.08, ms = T.punch) => M.reduce ? null :
  M.anim(el, [{ transform: 'scale(1)' }, { transform: `scale(${s})`, offset: 0.45 }, { transform: 'scale(1)' }], { duration: ms, easing: 'ease-out', composite: 'add' });
// ---- F17 pop in / out ----
M.popIn = (el, o = {}) => M.anim(el, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] :
  [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1.08', offset: 0.6 }, { opacity: 1, scale: '1' }], { duration: T.popIn, fill: 'forwards', ...o });
M.fadeOut = (el, dy = -10, ms = 180) => M.anim(el, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 ${dy}px` }], { duration: ms, easing: EASE.in, fill: 'forwards' });
M.fadeUp = (el, dy = 10, ms = 220, delay = 0) => M.anim(el, [{ opacity: 0, translate: `0 ${dy}px` }, { opacity: 1, translate: '0 0' }], { duration: ms, delay: delay * M.slow, fill: 'both' });
// ---- F15 glow pulse: a ring breathing out from the object (loops until stopped) ----
M.glow = (halo) => {
  if (M.reduce) return { cancel() {} };
  const a = halo.animate([{ transform: 'scale(.92)', opacity: 0.7 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: T.glow, iterations: Infinity, easing: 'ease-out' });
  a.playbackRate = 1 / M.slow; return a;
};
// ---- F16 waves: bars moving while sound plays ----
M.waves = (bars) => [...bars.children].map((b, i) => {
  const h = [26, 34, 20, 30][i % 4], a = b.animate([{ height: '8px' }, { height: h + 'px' }], { duration: 260 + i * 40, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 70 });
  a.playbackRate = 1 / M.slow; return a;
});
// ---- F13 count-up ----
M.countUp = (el, to, ms = T.countUp) => new Promise((res) => {
  const from = +el.textContent || 0, t0 = performance.now(), dur = ms * M.slow;
  const step = (now) => { const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step); else { M.punch(el, 1.25, 180); res(); } };
  requestAnimationFrame(step);
});
// ---- FLIP: move an element from where it was (rect `from`) to where it is now, on a small arc ----
M.flyFrom = (el, from, o = {}) => {
  const to = el.getBoundingClientRect(), dx = from.left - to.left, dy = from.top - to.top;
  if (M.reduce || (!dx && !dy)) return Promise.resolve();
  const lift = o.arc === false ? 0 : -Math.min(26, 10 + Math.abs(dx) * 0.08);
  if (o.arc !== false) { el.style.zIndex = 30; var done = () => { el.style.zIndex = ''; }; }   // a flying tile passes over everything, never behind
  const p = M.anim(el, [{ translate: `${dx}px ${dy}px` }, { translate: `${dx * 0.45}px ${dy * 0.45 + lift}px`, offset: 0.5 }, { translate: '0 0' }],
    { duration: o.ms || T.tileFly, easing: EASE.std });
  return done ? p.then(done) : p;
};
// ---- landing squash (a tile dropping into its slot) ----
M.land = (el) => M.reduce ? null : M.anim(el, [{ scale: '1 1' }, { scale: '1.06 .9', offset: 0.35 }, { scale: '.98 1.04', offset: 0.7 }, { scale: '1 1' }], { duration: 220, easing: 'ease-out' });
// ---- sheets ----
M.sheetUp = (el) => M.anim(el, M.reduce ? [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(0)' }] :      // Reduce Motion: it fades in where it ends up
  [{ transform: 'translateY(100%)' }, { transform: 'translateY(-6px)', offset: 0.72 }, { transform: 'translateY(0)' }], { duration: T.sheetUp, fill: 'forwards' });
M.sheetDown = (el) => M.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: T.sheetDown, easing: EASE.in, fill: 'forwards' });

// ---- Rive effects (the same artboards the app uses) ----
const RIV = '/design/rive/out/waiters.riv';
// A new Rive view shows the runtime's start-up logo for about two seconds, so the canvas stays hidden until that is over.
M.rive = (canvas, artboard, sm = 'State Machine 1') => new Promise((res) => {
  canvas.style.visibility = 'hidden'; setTimeout(() => { canvas.style.visibility = ''; }, 2500);
  const r = new rive.Rive({ src: RIV, canvas, artboard, stateMachines: sm, autoplay: true, autoBind: true,
    layout: new rive.Layout({ fit: rive.Fit.Contain }), onLoad: () => { r.resizeDrawingSurfaceToCanvas(); res(r.viewModelInstance); } });
});
let popVM, popCanvas;
M.initPop = async () => {
  popCanvas = document.createElement('canvas'); popCanvas.className = 'fxpop'; popCanvas.width = popCanvas.height = 400; document.body.appendChild(popCanvas);
  popVM = await M.rive(popCanvas, 'FX Pop');
};
// F1 pop, centred on an element (or on its right end). colour: 0xAARRGGBB
M.pop = (el, colour = 0xFF3DCB6C, at = 'centre') => {
  if (M.reduce || !popVM) return;
  const b = el.getBoundingClientRect();
  popCanvas.style.left = ((at === 'end' ? b.right : b.left + b.width / 2) - 100 + scrollX) + 'px'; popCanvas.style.top = (b.top + b.height / 2 - 100 + scrollY) + 'px';
  popVM.color('color').value = colour; popVM.trigger('fire').trigger();
};
window.M = M;
