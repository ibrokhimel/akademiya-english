// The Progress tab: page 24 (locked variant B, "can say" first), page 25 "Ayta oladiganlarim" and page 26, the streak calendar.
// Pencil: Screen 24 · B, Screen 25, Screen 26. Motion from the lab's progress page (design/motion/progress.js).
//   renderProgress(host, ctx)  -> cleanup()       fills the Progress tab and plays its opening
//   thingsICanSay(ctx)         -> Promise          page 25, over everything; ends when the learner goes back
//   streakCalendar(ctx)        -> Promise          page 26, the same way
// ctx = { phone, C, events, progress(), now(), rec?: { has(id), play(id) }, practise?(id) }
import { say, stop } from './audio.js';
import { streakOf, dayOf } from '../core/progress.js';

const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];                                       // weeks start on Sunday
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const LEVEL_LESSONS = 18;                                                                      // level 1 = the 15 lessons and 3 checkpoints of the MVP
const unitName = (u) => u.name.replace('!', '');
const lessonsOf = (C) => Object.fromEntries(C.units.flatMap((u) => [...u.lessons.map((l) => [l.id, { ...l, unit: u }]), [u.checkpoint.id, { ...u.checkpoint, unit: u, checkpoint: true }]]));
const lessonEvents = (events) => events.filter((e) => e.type === 'lesson');
const playHTML = `<button class="play"><img src="${ICON}glyph-speaker-violet.png" alt=""><span class="bars"><i></i><i></i><i></i></span></button>`;
const roll = (el, to, ms = T.countUp) => { if (M.reduce || !to) { el.textContent = to; return; } el.textContent = 0; return M.countUp(el, to, ms); };
const flicker = (el) => { const a = el.animate([{ scale: '1 1' }, { scale: '1.04 .95' }], { duration: 420, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); a.playbackRate = 1 / M.slow; if (M.reduce) a.cancel(); return a; };
const breathe = (el) => { const a = el.animate([{ scale: '1', opacity: 1 }, { scale: '1.2', opacity: 0.35 }], { duration: T.glow / 2, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); a.playbackRate = 1 / M.slow; if (M.reduce) a.cancel(); return a; };
const listen = (btn, p) => { M.punch(btn, 1.1, 160); say(p.voice, p.en, { onStart: (ms) => W.play(btn, ms) }); };

// the phrases the learner can say, in course order: [{ unit, phrases: [p] }]
function canSay(ctx) {
  const done = new Set(lessonEvents(ctx.events).map((e) => e.id));
  return ctx.C.units.map((u) => ({ unit: u, phrases: u.lessons.filter((l) => done.has(l.id)).flatMap((l) => (l.new || []).map((id) => ctx.C.P[id]).filter(Boolean)) })).filter((g) => g.phrases.length);
}
// the newest phrases: from the most recently finished lessons, in their lesson order
function newest(ctx, n = 3) {
  const L = lessonsOf(ctx.C), out = [], seen = new Set();
  for (const e of lessonEvents(ctx.events).slice().sort((a, b) => (a.at < b.at ? 1 : -1))) {
    const l = L[e.id]; if (!l || l.checkpoint) continue;
    for (const id of l.new || []) { if (out.length < n && !seen.has(id) && ctx.C.P[id]) { seen.add(id); out.push(ctx.C.P[id]); } }
    if (out.length >= n) break;
  }
  return out;
}
// every day a freeze covered: the streak as it stands now, then as it stood at the end of each earlier lesson day (latest first).
// One freeze a week: a week the current streak already used keeps that day, so the calendar agrees with the streak number.
const weekStart = (day) => { const [y, m, d] = day.split('-').map(Number), x = new Date(y, m - 1, d); x.setDate(d - x.getDay()); return dayOf(x); };
export function frozenDays(events, now) {
  const ls = lessonEvents(events), days = [...new Set(ls.map((e) => dayOf(e.at)))].sort().reverse(), out = new Set(), weeks = new Set();
  const take = (set) => { for (const f of set) { const w = weekStart(f); if (!weeks.has(w)) { weeks.add(w); out.add(f); } } };
  take(streakOf(ls, now).frozen);
  for (const d of days) { const [y, m, dd] = d.split('-').map(Number); take(streakOf(ls.filter((e) => dayOf(e.at) <= d), new Date(y, m - 1, dd, 23, 59)).frozen); }
  return out;
}
// "1-daraja: 2-noyabr": when level 1 comes at the learner's pace so far
function prediction(ctx, p) {
  if (p.level >= 1) return '';
  const ls = lessonEvents(ctx.events), n = new Set(ls.map((e) => e.id)).size, active = new Set(ls.map((e) => dayOf(e.at))).size;
  if (!n) return '1-daraja: —';
  const days = Math.ceil((LEVEL_LESSONS - n) / (n / active)), d = new Date(ctx.now()); d.setDate(d.getDate() + days);
  return `1-daraja: ${d.getDate()}-${MONTHS[d.getMonth()].toLowerCase()}`;
}
// a page that slides in over everything and slides out when it is closed
function sheetPage(ctx, cls, html) {
  const el = document.createElement('div'); el.className = cls; el.innerHTML = html; ctx.phone.appendChild(el); SND.play('next');
  if (!M.reduce) M.anim(el, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 300, easing: EASE.std });
  let done; const closed = new Promise((r) => { done = r; });
  const close = async () => { if (el._closing) return; el._closing = true; stop(); SND.play('back');
    if (!M.reduce) await M.anim(el, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: 220, easing: EASE.in, fill: 'forwards' });
    (el._stop || []).forEach((f) => f()); el.remove(); done(); };
  return { el, close, closed };
}

// ---------- 24 · Progress ----------
export function renderProgress(host, ctx) {
  const p = ctx.progress(), ls = lessonEvents(ctx.events), news = newest(ctx), loops = [];
  const units = ctx.C.units.filter((u) => p.done[u.checkpoint.id]).length;
  const mins = Math.ceil(ls.reduce((s, e) => s + (e.spokenMs || 0), 0) / 60000), lessons = new Set(ls.map((e) => e.id)).size, active = new Set(ls.map((e) => dayOf(e.at))).size;
  const dot = (d) => d.state === 'done' ? `<span class="dot done"><img src="${ICON}glyph-check-white.png" alt=""></span>`
    : d.state === 'frozen' ? `<span class="dot frozen"><img class="ice" src="${ICON}frozen-streak.png" alt=""><img class="ic2" src="${ICON}glyph-check-ice.png" alt=""></span>`
    : `<span class="dot">${d.state === 'today' ? '<i class="tring"></i>' : ''}</span>`;
  const today = dayOf(ctx.now());
  host.innerHTML = `<div class="pg24">
    <div class="hero"><div class="k">NATIJALAR</div><div class="big"><b class="n">${p.phrases}</b><span>ta narsani ingliz<br>tilida ayta olasiz</span></div></div>
    <div class="pgb"><div class="lbl">ENG YANGILARI</div>
      ${news.length ? news.map((ph) => `<div class="prow" data-id="${ph.id}">${playHTML}<span><b>${ph.en}</b><small>${ph.uz}</small></span></div>`).join('')
        : '<div class="empty">Birinchi darsdan keyin iboralaringiz shu yerda chiqadi.</div>'}
      ${p.phrases ? `<button class="all">HAMMASINI KO'RISH (${p.phrases})</button>` : ''}
      <button class="scard"><img class="fl" src="${ICON}flame-streak.png" alt=""><span class="cnt">${p.streak.count}</span>
        <span class="wk">${p.streak.week.map((d) => `<span class="d${d.day === today ? ' today' : ''}">${DAYS[new Date(d.day + 'T12:00').getDay()]}${dot(d)}</span>`).join('')}</span>
        <img class="chev" src="${ICON}glyph-chevron-right-grey.png" alt=""></button>
      <div class="lvl"><div class="row"><b>${p.level}-daraja · ${units}/3 bo'lim</b><small>${prediction(ctx, p)}</small></div><div class="track"><div class="fill"></div></div></div>
      <div class="stats">${[['studio-mic', mins, 'daqiqa'], ['book-phrase-list', lessons, 'dars'], ['calendar', active, 'faol kun']].map(([ic, v, l]) => `<div><img src="${ICON}${ic}.png" alt=""><b>${v}</b><small>${l}</small></div>`).join('')}</div>
    </div></div>`;
  const q = (s) => host.querySelector(s), qa = (s) => [...host.querySelectorAll(s)];
  // opening: the big number rolls up, the rows arrive 40 ms apart, the bar grows, the numbers count up
  roll(q('.hero .n'), p.phrases);
  const rows = [...qa('.prow, .empty'), q('.all'), q('.scard'), q('.lvl'), q('.stats')].filter(Boolean);
  rows.forEach((r, i) => { M.fadeUp(r, 12, 220, 80 + i * T.stagger); if (i < 4) SND.appear(80 + i * T.stagger); });
  const pct = p.level >= 1 ? 100 : Math.round(lessons / LEVEL_LESSONS * 100), fill = q('.lvl .fill'); fill.style.width = pct + '%';
  if (!M.reduce) M.anim(fill, [{ width: '0%' }, { width: pct + '%' }], { duration: 700, delay: 200 * M.slow, easing: EASE.std, fill: 'backwards' });
  qa('.stats b').forEach((b, i) => { const to = +b.textContent; b.textContent = M.reduce ? to : 0; M.wait(260 + i * 60).then(() => roll(b, to, 500)); });
  loops.push(flicker(q('.scard .fl'))); const ring = q('.tring'); if (ring) loops.push(breathe(ring));
  // taps
  qa('.prow').forEach((r) => { const b = r.querySelector('.play'); b.onclick = () => listen(b, ctx.C.P[r.dataset.id]); });
  const all = q('.all'); if (all) all.onclick = () => { M.punch(all, 1.06, 160); thingsICanSay(ctx); };
  const sc = q('.scard'); sc.onclick = () => { M.punch(sc, 1.03, 160); streakCalendar(ctx); };
  return () => { loops.forEach((a) => a.cancel()); stop(); };
}

// ---------- 25 · Ayta oladiganlarim ----------
export function thingsICanSay(ctx) {
  const groups = canSay(ctx), total = groups.reduce((n, g) => n + g.phrases.length, 0), rec = ctx.rec;
  const { el, close, closed } = sheetPage(ctx, 'pg25', `<div class="top"><button class="back"><img src="${ICON}glyph-chevron-left-grey.png" alt=""></button>
      <span><b>Ayta oladiganlarim</b><small>${total} ta ibora · ${groups.length} bo'lim</small></span></div>
    <div class="scroll"><div class="pgb">${groups.length ? groups.map((g) => `<div class="uh"><img src="${ICON}${g.unit.icon}.png" alt=""><span>${unitName(g.unit).toUpperCase()}</span><i></i><span>${g.phrases.length}</span></div>
      ${g.phrases.map((ph) => `<div class="row" data-id="${ph.id}">${playHTML}<span class="tx"><b>${ph.en}</b><small>${ph.uz}</small>
        ${rec && rec.has(ph.id) ? `<button class="mine"><img src="${ICON}glyph-user-coral.png" alt="">Mening ovozim ▶</button>` : ''}</span>
        <button class="again"><img src="${ICON}glyph-mic-violet.png" alt=""></button></div>`).join('')}`).join('')
      : '<div class="empty">Birinchi darsdan keyin iboralaringiz shu yerda chiqadi.</div>'}</div></div>`);
  const items = [...el.querySelectorAll('.uh, .row, .empty')];
  items.forEach((r, i) => { M.fadeUp(r, 12, 220, 180 + Math.min(i, 12) * T.stagger); if (i < 6) SND.appear(180 + i * T.stagger); });
  el.querySelectorAll('.row').forEach((r) => { const ph = ctx.C.P[r.dataset.id], b = r.querySelector('.play'), mine = r.querySelector('.mine'), again = r.querySelector('.again');
    b.onclick = () => listen(b, ph);
    if (mine) mine.onclick = () => { stop(); M.punch(mine, 1.08, 160); rec.play(ph.id); };
    again.onclick = () => { M.punch(again, 1.15, 180); if (ctx.practise) ctx.practise(ph.id); }; });
  el.querySelector('.back').onclick = close;
  return closed;
}

// ---------- 26 · Seriya: the streak calendar ----------
export function streakCalendar(ctx) {
  const now = ctx.now(), today = dayOf(now), p = ctx.progress(), ls = lessonEvents(ctx.events);
  const practised = new Set(ls.map((e) => dayOf(e.at))), frozen = frozenDays(ctx.events, now);
  const sun = (() => { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); return dayOf(d); })();
  const usedThisWeek = [...frozen].some((f) => f >= sun && f <= today);
  const count = p.streak.count, goal = Math.max(7, Math.ceil((count + (count % 7 === 0 && count ? 1 : 0)) / 7) * 7), left = goal - count;
  let shown = new Date(now.getFullYear(), now.getMonth(), 1);
  const { el, close, closed } = sheetPage(ctx, 'pg26', `<div class="top"><button class="x"><img src="${ICON}glyph-close-grey.png" alt=""></button><b>Seriya</b><i></i></div>
    <div class="scroll"><div class="pgb">
      <div class="month"><b></b><button class="prev"><img src="${ICON}glyph-chevron-left-grey.png" alt=""></button><button class="next"><img src="${ICON}glyph-chevron-right-grey.png" alt=""></button></div>
      <div class="tiles"><div class="tile"><span class="ck"><img src="${ICON}glyph-check-white.png" alt=""></span><span><b class="np">0</b><small>Mashq qilingan kun</small></span></div>
        <div class="tile"><img src="${ICON}ice-freeze.png" alt=""><span><b class="ice nf">0</b><small>Muzlatish ishlatildi</small></span></div></div>
      <div class="cal"><div class="wds">${DAYS.map((d) => `<span>${d}</span>`).join('')}</div><div class="grid"></div></div>
      <div class="goal"><div class="hd"><b>Seriya maqsadi</b><span>${count} / ${goal} kun</span></div>
        <div class="box"><div class="line"><img src="${ICON}calendar.png" alt=""><div class="bar"><div class="fill"></div></div><img src="${ICON}calendar.png" alt=""></div>
        <small>${left === 1 ? `Yana 1 kun — ertaga ${goal} kunlik maqsadga yetasiz!` : `Yana ${left} kun — ${goal} kunlik maqsadga yetasiz!`}</small></div></div>
      <div class="freeze"><img src="${ICON}ice-freeze.png" alt=""><span>${usedThisWeek ? '<b>Bu haftaning muzlatishi ishlatildi</b><small>Yangisi yakshanba kuni beriladi.</small>'
        : '<b>1 ta muzlatish tayyor</b><small>Haftasiga 1 ta bepul. Bir kun o\'tkazib yuborsangiz, seriyangizni o\'zi saqlaydi.</small>'}</span></div>
    </div></div>`);
  const q = (s) => el.querySelector(s), grid = q('.grid'), first = [...practised, ...frozen].sort()[0];
  function month(animate) {
    const y = shown.getFullYear(), m = shown.getMonth(), n = new Date(y, m + 1, 0).getDate(), off = shown.getDay(), key = (d) => dayOf(new Date(y, m, d));
    const mark = (d) => d >= 1 && d <= n && (practised.has(key(d)) || frozen.has(key(d)));
    q('.month b').textContent = `${MONTHS[m]} ${y}`;
    q('.next').classList.toggle('off', y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth()));
    q('.prev').classList.toggle('off', !first || key(1) <= first);
    let html = ''; const cells = Math.ceil((off + n) / 7) * 7;
    for (let c = 0; c < cells; c++) { const d = c - off + 1, col = c % 7;
      if (col === 0) html += '<div class="wrow">';
      if (d < 1 || d > n) html += '<div class="cd"></div>';
      else { const k = key(d), cls = practised.has(k) ? 'p' : frozen.has(k) ? 'f' : '', isToday = k === today;
        const l = col > 0 && mark(d) && mark(d - 1), r = col < 6 && mark(d) && mark(d + 1);
        const band = l || r ? `<span class="bd" style="left:${l ? 0 : 23}px;width:${(l ? 23 : 0) + (r ? 23 : 0)}px"></span>` : '';
        html += `<div class="cd ${cls}${isToday ? ' t' + (cls ? '' : ' not') : ''}">${band}${cls || isToday ? `<i>${d}</i>` : d}</div>`; }
      if (col === 6) html += '</div>';
    }
    grid.innerHTML = html;
    const np = [...Array(n)].filter((_, i) => practised.has(key(i + 1))).length, nf = [...Array(n)].filter((_, i) => frozen.has(key(i + 1))).length;
    roll(q('.np'), np, 400); roll(q('.nf'), nf, 400);
    if (!animate || M.reduce) return;
    SND.play('unfold', { step: 0 });                                                        // the month unfolds: days pop in, the bands draw left to right
    [...grid.querySelectorAll('.cd i')].forEach((c, i) => M.anim(c, [{ scale: '.6', opacity: 0 }, { scale: '1', opacity: 1 }], { duration: 180, delay: (100 + i * 22) * M.slow, fill: 'backwards' }));
    [...grid.querySelectorAll('.cd')].forEach((c, i) => { const b = c.querySelector('.bd'); if (b) M.anim(b, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 160, delay: (160 + i * 22) * M.slow, easing: EASE.std, fill: 'backwards' }); });
    M.wait(650).then(() => grid.querySelectorAll('.cd.f i').forEach((c) => M.shine(c)));      // frozen days: one quick frost shine
  }
  month(true);
  const fill = q('.goal .fill'), pct = Math.round(count / goal * 100); fill.style.width = pct + '%';
  if (!M.reduce) M.anim(fill, [{ width: '0%' }, { width: pct + '%' }], { duration: 700, delay: 300 * M.slow, easing: EASE.std, fill: 'backwards' });
  [q('.tiles'), q('.goal'), q('.freeze')].forEach((r, i) => M.fadeUp(r, 10, 220, 120 + i * 60));
  q('.prev').onclick = () => { shown = new Date(shown.getFullYear(), shown.getMonth() - 1, 1); SND.play('tab'); month(true); };
  q('.next').onclick = () => { shown = new Date(shown.getFullYear(), shown.getMonth() + 1, 1); SND.play('tab'); month(true); };
  q('.x').onclick = close;
  return closed;
}
