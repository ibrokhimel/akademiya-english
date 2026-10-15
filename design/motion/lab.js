// Shared by the lab pages (2 onward): small helpers and the dark / slow / reduce switches.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ICON = '/pendev/icons-r2/';
const GREEN = 0xFF3DCB6C, GOLD = 0xFFFFC93C, VIOLET = 0xFF7B5CFF, CORAL = 0xFFFF6B5B;
{
  const toggle = (id, fn) => { const b = $(id); if (!b) return; b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); fn(on); }; };
  toggle('#tDark', (on) => { document.body.classList.toggle('dark', on); document.dispatchEvent(new CustomEvent('lab-dark', { detail: on })); });
  toggle('#tSlow', (on) => { M.slow = on ? 4 : 1; document.documentElement.style.setProperty('--slow', M.slow); });
  toggle('#tReduce', (on) => { M.reduce = on; });
}
// Dombi's Rive artboard has room around him for hands and tricks: his body is half the canvas, a little below the middle.
// The design's Dombi box has the body at 66 %. This gives the canvas size and offset that put him exactly where a design box of `size` has him.
const dombiFit = (size) => ({ size: size * 1.32, dx: -0.164 * size, dy: -0.231 * size });
function dombiInto(canvas, box, size) { const f = dombiFit(size); box.style.position = 'relative'; box.appendChild(canvas);
  canvas.style.cssText = `position:absolute;width:${f.size}px;height:${f.size}px;left:${f.dx}px;top:${f.dy}px;max-width:none;pointer-events:none`; }
// a main button that shines once when it appears and again every 5 s while it waits
function shineLoop(btn) {
  let timer = setInterval(() => { if (btn.isConnected && btn.offsetParent) M.shine(btn); }, T.shineEvery * M.slow);
  return () => clearInterval(timer);
}
// F8 fly-to-counter: n gold bits arc from one element to another; onArrive runs as each lands
function flyTo(from, to, n, onArrive, host = document.body) {
  if (M.reduce) { for (let i = 0; i < n; i++) onArrive(i); return Promise.resolve(); }
  const h = host.getBoundingClientRect(), k = host.offsetWidth / h.width;          // the phone is scaled
  const pt = (el) => { const r = el.getBoundingClientRect(); return [(r.left + r.width / 2 - h.left) * k, (r.top + r.height / 2 - h.top) * k]; };
  const [x0, y0] = pt(from), [x1, y1] = pt(to);
  return Promise.all([...Array(n)].map(async (_, i) => {
    const d = document.createElement('i'); d.className = 'flydot'; host.appendChild(d);
    const sx = x0 + (Math.random() - 0.5) * 30, sy = y0 + (Math.random() - 0.5) * 20, bend = 40 + Math.random() * 50;
    await M.anim(d, [{ translate: `${sx}px ${sy}px`, scale: '0', opacity: 1 }, { translate: `${sx}px ${sy - 14}px`, scale: '1', offset: 0.18 },
      { translate: `${(sx + x1) / 2 + bend}px ${(sy + y1) / 2 - 20}px`, scale: '1', offset: 0.62 }, { translate: `${x1}px ${y1}px`, scale: '.6', opacity: 1 }],
      { duration: 520, delay: i * 70 * M.slow, easing: EASE.std, fill: 'both' });
    d.remove(); onArrive(i);
  }));
}
// A time wheel like the iPhone's: it turns without end, keeps moving after a flick, and slows to rest exactly on a time.
// One tick for every time that passes the middle, so a fast spin ticks fast. scale = how much the phone is scaled on the page.
const DAY = [...Array(48)].map((_, i) => `${String(i >> 1).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);      // the whole day in half hours: 00:00 ... 23:30
function timeWheel(wheel, times, start = 0, scale = 1) {
  const list = $('.list', wheel), sel = $('.sel', wheel), H = 44, n = times.length, TAU = 320;       // TAU: how long a flick keeps going (ms to lose two thirds of its speed)
  list.innerHTML = times.map((t) => `<div class="opt" style="position:absolute;left:0;right:0;top:0">${t}</div>`).join(''); const opts = $$('.opt', list);
  const MID = sel.offsetTop + (sel.offsetHeight - H) / 2, wrap = (v) => ((v % n) + n) % n, near = (k, p) => wrap(k - p + n / 2) - n / 2;   // near: how many steps time k is from the middle, the short way round
  let pos = start, at = start, goal = start, raf = 0, drag = null;                                     // pos: the time in the middle; it keeps counting past the ends
  const draw = () => { const c = Math.round(pos); if (c !== at) { at = c; SND.play('tick'); }
    opts.forEach((o, k) => { o.style.translate = `0 ${MID + near(k, pos) * H}px`; const far = Math.abs(near(k, c)); o.classList.toggle('on', far === 0); o.classList.toggle('near', far === 1); }); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const glide = (to, tau) => { stop(); goal = to; if (M.reduce) { pos = to; draw(); return; }                 // fast at first, slowing down, landing exactly on a time
    const from = pos, t0 = performance.now(), f = (now) => { pos = to - (to - from) * Math.exp(-(now - t0) / (tau * M.slow)); if (Math.abs(to - pos) < 0.01) pos = to; draw(); raf = pos === to ? 0 : requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); };
  wheel.onpointerdown = (e) => { stop(); drag = { y0: e.clientY, p0: pos, moved: false, pts: [[e.timeStamp, e.clientY]] }; wheel.setPointerCapture(e.pointerId); };   // a finger on the wheel stops it
  wheel.onpointermove = (e) => { if (!drag) return; const dy = (e.clientY - drag.y0) / scale; if (Math.abs(dy) > 4) drag.moved = true; if (!drag.moved) return;
    pos = drag.p0 - dy / H; draw(); drag.pts.push([e.timeStamp, e.clientY]); while (drag.pts.length > 2 && e.timeStamp - drag.pts[0][0] > 90) drag.pts.shift(); };
  wheel.onpointerup = wheel.onpointercancel = (e) => { if (!drag) return; const d = drag; drag = null;
    if (!d.moved) { const hit = document.elementFromPoint(e.clientX, e.clientY), o = hit && hit.closest('.opt'), c = Math.round(pos); return glide(o ? c + near(opts.indexOf(o), c) : c, 70); }   // a tap picks the time under the finger
    const [t1, y1] = d.pts[0], [t2, y2] = d.pts[d.pts.length - 1], still = e.timeStamp - t2 > 60 || t2 === t1;      // held still before letting go: no flick
    const v = still ? 0 : Math.max(-0.06, Math.min(0.06, -(y2 - y1) / scale / H / (t2 - t1)));                     // times per ms at the moment of letting go
    if (Math.abs(v) < 0.0015) glide(Math.round(pos), 70); else glide(Math.round(pos + v * TAU), TAU); };
  wheel.onwheel = (e) => { e.preventDefault(); glide((raf ? goal : Math.round(pos)) + Math.sign(e.deltaY), 70); };
  draw();
  return { opts, get idx() { return wrap(Math.round(pos)); }, get value() { return times[wrap(Math.round(pos))]; } };
}
