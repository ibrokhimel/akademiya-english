// The Profile tab: 27 Profile (the owner's locked design; motion from the lab's profile.js), 28 Settings and 28b Voice recordings
// (Pencil "Storyboard · Profile & settings"; controls from the lab's controls.js).
//   renderProfile(host, ctx) -> cleanup        settingsPage(ctx) -> Promise (closed)        recordingsPage(ctx) -> Promise (closed)
// ctx = { phone, C, events, progress(), settings, set(key, value), now(), shiftDays(n), notReady(), show(name), logOut(), deleteAccount() }
import { dayOf } from '../core/progress.js';
import { People } from './people.js';
import { Rec } from './record.js';

const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
const MONTH = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const dshort = (t) => { const d = new Date(t); return `${d.getDate()}-${MON[d.getMonth()]}`; };
const dlong = (t) => `${dshort(t)}, ${new Date(t).getFullYear()}`;
export const GOALS = { school: ['backpack', 'Maktab', 'Darslar va imtihonlar'], ielts: ['notepad', 'IELTS', 'Imtihonga tayyorlanish'], travel: ['plane', 'Sayohat', 'Kafe, do\'kon, ...'],
  work: ['briefcase', 'Ish', 'Hamkasblar bilan gaplashish'], self: ['heart', 'O\'zim uchun', 'Kundalik suhbatlar'] };
const btn = (label, cls = 'primary', extra = '') => `<button class="p3d btn ${cls}"${extra}><span class="face">${label}</span></button>`;
const scaleOf = (phone) => phone.getBoundingClientRect().width / phone.offsetWidth || 1;          // the phone is drawn smaller than 390 on a small window
const park = (c) => { const p = document.querySelector('#park'); if (c && p) { c.className = ''; c.style.cssText = ''; p.appendChild(c); } };

// ---------- what the events say: records and awards ----------
function factsOf(ctx) {
  const lessons = ctx.events.filter((e) => e.type === 'lesson').slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  const days = [...new Set(lessons.map((e) => dayOf(e.at)))].sort();
  let best = 0, bestEnd = null, run = 0, prev = null;                       // the longest run of days in a row
  for (const d of days) { const p = prev && new Date(new Date(d + 'T12:00').getTime() - 864e5); run = prev && dayOf(p) === prev ? run + 1 : 1; prev = d; if (run >= best) { best = run; bestEnd = d; } }
  const perfect = lessons.filter((e) => e.mistakes === 0 || e.accuracy === 100), early = lessons.filter((e) => new Date(e.at).getHours() < 8), fixed = lessons.filter((e) => e.mistakes > 0);
  let spoken = 0, minuteAt = null; for (const e of lessons) { spoken += e.spokenMs || 0; if (!minuteAt && spoken >= 60000) minuteAt = e.at; }
  const lvCps = new Set(ctx.C.units.map((u) => u.checkpoint).filter((c) => c.levelUp).map((c) => c.id)), lvAt = (lessons.find((e) => lvCps.has(e.id)) || {}).at;
  const p = ctx.progress(), last = lessons.length ? lessons[lessons.length - 1].at : null;
  return { lessons, best, bestEnd, perfect, early, fixed, minutes: Math.floor(spoken / 60000), minuteAt, lvAt, p, last };
}
function awardsOf(f) {
  // icon, colour, soft colour, goal, name, how many, when it was first earned
  return [['target', 'var(--green)', 'var(--green-soft)', 5, 'Xatosiz yakun', f.perfect.length, (f.perfect[0] || {}).at], ['hands-up', '#F25CA2', 'var(--tile-pink)', 10, 'Do\'stona', 0, null],
    ['bell', 'var(--gold-edge)', 'var(--gold-soft)', 10, 'Erta turuvchi', f.early.length, (f.early[0] || {}).at], ['studio-mic', 'var(--violet)', 'var(--violet-soft)', 10, 'Gapiruvchi', f.minutes, f.minuteAt],
    ['bulb-tip', 'var(--coral)', 'var(--coral-soft)', 10, 'Xato ovchisi', f.fixed.length, (f.fixed[0] || {}).at], ['crown', 'var(--gold-edge)', 'var(--gold-soft)', 1, 'Afsona', f.p.level, f.lvAt]];
}

// ---------- 27 · Profile ----------
export function renderProfile(host, ctx) {
  const s = ctx.settings || {}, f = factsOf(ctx), name = (s.name || '').trim() || 'Siz', joined = (f.lessons[0] || {}).at || s.joined || ctx.now();
  const recs = [['tile-orange', 'flame-streak', f.best, 'Eng uzun seriya', f.bestEnd ? dlong(f.bestEnd + 'T12:00') : '—'], ['tile-gold', 'sparkles', f.perfect.length, 'Mukammal darslar', f.perfect.length ? dlong(f.perfect[f.perfect.length - 1].at) : '—'],
    ['tile-grey', 'bubble-phrases', f.p.phrases, 'Iboralar', f.last ? dlong(f.last) : '—']];
  const now = ctx.now().getTime(), aw = awardsOf(f);
  host.innerHTML = `<div class="pg27"><div class="pf-scroll">
    <div class="pf-status"></div>
    <div class="pf-banner"><button class="p3d pf-rbtn" data-a="more" style="left:292px"><span class="face"><img src="${ICON}glyph-more-violet.png" alt=""></span></button>
      <button class="p3d pf-rbtn" data-a="gear" style="left:338px"><span class="face"><img src="${ICON}glyph-gear-violet.png" alt="" style="width:26px;height:26px"></span></button>
      <span class="date">${MONTH[new Date(joined).getMonth()]} ${new Date(joined).getFullYear()}</span></div>
    <div class="pf-body">
      <div class="pf-ident"><div class="pf-avatar">${name[0].toUpperCase()}</div><div class="pf-name rv">${name}</div><div class="pf-lv rv"><img src="${ICON}level-badge.png" alt="">${f.p.level}-daraja</div></div>
      ${s.bio ? `<div class="pf-bio rv">${s.bio}</div>` : ''}
      <div class="pf-goal rv"></div>
      <div class="pf-social rv"><div class="cnt"><b>0</b><small>Do'stlar</small></div>
        <button class="p3d pf-fbtn" data-a="friend"><span class="face"><img src="${ICON}glyph-user-violet.png" alt="">DO'ST QO'SHISH</span></button>
        <button class="p3d pf-fbtn sq" data-a="friend"><span class="face"><img src="${ICON}glyph-phone-violet.png" alt=""></span></button></div>
      <div class="p3d pf-promo rv"><span class="face"><span class="row"><span class="txt">Darslar bilan hayvoningizga yangi kiyim oling!<span class="days"><img src="${ICON}glyph-timer-white.png" alt="">10 KUNDA</span></span>
        <span class="art"><img class="hat" src="${ICON}top-hat.png" alt=""><img class="scarf" src="${ICON}scarf.png" alt=""></span></span>
        <button class="p3d see" data-a="promo"><span class="face">KO'RISH</span></button></span></div>
      <div class="pf-h13 rv">UMUMIY KO'RINISH</div>
      <div class="pf-over rv">${[['flame-streak', f.p.streak.count, ' kun'], ['bubble-phrases', f.p.phrases, ' ibora'], ['medal-silver', null, 'Liga yo\'q'], ['apple-currency', 0, ' olma']].map(([ic, n, t]) =>
        `<div${n == null ? ' class="soft" data-a="league"' : ''}><img src="${ICON}${ic}.png" alt=""><span>${n == null ? '' : `<b data-to="${n}">${n}</b>`}${t}</span></div>`).join('')}</div>
      <div class="pf-h13 rv">DO'STLAR BILAN SERIYA</div><div class="pf-fstreaks rv">${'<i data-a="friend">+</i>'.repeat(5)}</div>
      <div class="pf-h13 rv">SHAXSIY REKORDLAR</div>
      <div class="pf-records rv">${recs.map(([c, ic, n, t, d]) => `<div class="pf-rec"><div class="t"><u style="background:var(--${c})"></u><img src="${ICON}${ic}.png" alt=""><b>${n}</b></div><b>${t}</b><small>${d}</small></div>`).join('')}</div>
      <div class="pf-h13 rv">MUKOFOTLAR</div>
      <div class="pf-awards">${aw.map(([ic, c, soft, goal, t, n, at]) => `<div class="pf-award rv${n > 0 ? '' : ' locked'}" style="--ac:${c};--ac-soft:${soft}"><div class="t"><u></u><img src="${ICON}${ic}.png" alt="">
        <div class="n"><b>${n}</b></div>${n > 0 && at && now - new Date(at).getTime() < 2 * 864e5 ? '<span class="new">YANGI</span>' : ''}</div><b>${t}</b><small>${Math.min(n, goal)} / ${goal}</small></div>`).join('')}</div>
      <div class="pf-ver rv">Akademiya English · sinov versiyasi</div>
    </div></div></div>`;
  const q = (sel) => host.querySelector(sel), qa = (sel) => [...host.querySelectorAll(sel)], scroll = q('.pf-scroll'), banner = q('.pf-banner'), avatar = q('.pf-avatar');
  let alive = true; const timers = [], anims = [];
  const paintGoal = () => { const [ic, t, sub] = GOALS[(ctx.settings || {}).goal] || GOALS.self;
    q('.pf-goal').innerHTML = `<img src="${ICON}${ic}.png" alt=""><span><b>${t}</b><small>${sub}</small></span><i>O'ZGARTIRISH</i>`; };
  paintGoal();
  qa('.p3d').forEach((b) => M.pressable(b));
  const act = { more: () => ctx.notReady(), friend: () => ctx.notReady(), promo: () => ctx.notReady(), league: () => ctx.notReady(),
    gear: async () => { await settingsPage(ctx); if (alive) { paintGoal(); } } };
  qa('[data-a]').forEach((el) => el.addEventListener(el.classList.contains('p3d') ? 'pointerup' : 'click', (e) => { e.stopPropagation(); act[el.dataset.a](); }));
  q('.pf-goal').onclick = () => { M.punch(q('.pf-goal'), 1.03, 160); goalSheet(ctx).then((k) => { if (k && alive) paintGoal(); }); };

  // sections fade up the first time they come into view; the overview numbers count up
  const seen = new WeakSet();
  const reveal = (el, delay = 0) => { if (seen.has(el)) return; seen.add(el); M.fadeUp(el, 12, 240, delay);
    if (el.classList.contains('pf-over')) el.querySelectorAll('[data-to]').forEach((b) => { const to = +b.dataset.to; if (M.reduce || !to) return; b.textContent = 0; M.wait(delay + 120).then(() => { if (alive) M.countUp(b, to, 600); }); });
    const tag = el.querySelector('.new'); if (tag) { tag.style.opacity = 0; M.wait(delay + 260).then(() => { if (!alive) return; tag.style.opacity = 1; M.popIn(tag); }); } };
  const io = new IntersectionObserver((es) => { let i = 0; es.forEach((e) => { if (e.isIntersecting) reveal(e.target, i++ * 60); }); }, { root: scroll, threshold: 0.15 });
  // the opening: the avatar pops, the sections in view tick in 60 ms apart
  if (!M.reduce) M.anim(avatar, [{ scale: '.6', opacity: 0 }, { scale: '1.08', opacity: 1, offset: 0.6 }, { scale: '1' }], { duration: 320 });
  requestAnimationFrame(() => { if (!alive) return; const r = scroll.getBoundingClientRect(); let i = 0;
    qa('.rv').forEach((e) => { const b = e.getBoundingClientRect(); if (b.top < r.bottom) { SND.appear(140 + i * 60, () => alive); reveal(e, 140 + i++ * 60); } });
    qa('.rv').forEach((e) => io.observe(e)); });
  SND.play('pop', { volume: 0.7 });
  // scrolling: the banner moves at 40 % of the scroll, the avatar shrinks a little
  scroll.addEventListener('scroll', () => { if (M.reduce) return; const y = scroll.scrollTop; banner.style.transform = `translateY(${y * 0.4}px)`; avatar.style.scale = Math.max(0.78, 1 - y / 600); }, { passive: true });
  // always alive: the hat and the scarf sway, a gold twinkle visits an earned award every 2.8 s
  const sway = (el, a, ms) => { if (M.reduce) return; const base = parseFloat(getComputedStyle(el).rotate) || 0; const an = el.animate([{ rotate: `${base - a}deg` }, { rotate: `${base + a}deg` }], { duration: ms, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); an.playbackRate = 1 / M.slow; anims.push(an); };
  sway(q('.hat'), 4, 1850); sway(q('.scarf'), 3, 2300);
  const earned = qa('.pf-award:not(.locked)'), twk = People.fx && People.fx.twinkle, tc = People.canvas && People.canvas.twinkle;
  if (earned.length && twk && tc) { tc.className = 'pf-twk'; tc.style.cssText = ''; q('.pf-awards').appendChild(tc); twk.color('color').value = GOLD; let last = -1;
    timers.push(setInterval(() => { if (M.reduce || !alive) return; let i; do { i = Math.floor(Math.random() * earned.length); } while (earned.length > 1 && i === last); last = i;
      const a = earned[i], t = a.querySelector('.t'); tc.style.left = (a.offsetLeft + t.offsetLeft - 25) + 'px'; tc.style.top = (a.offsetTop + t.offsetTop - 14) + 'px'; twk.trigger('fire').trigger(); }, 2800)); }
  return () => { alive = false; io.disconnect(); timers.forEach(clearInterval); anims.forEach((a) => a.cancel()); if (tc && tc.parentElement && host.contains(tc)) park(tc); };
}

// ---------- small pieces: a bottom sheet, a dialog, a toggle, a segmented switch ----------
function sheet(phone, html) {
  const w = document.createElement('div'); w.className = 'pgsheet'; w.innerHTML = `<div class="pf-shade"></div><div class="pf-sheet"><div class="pf-handle"></div>${html}</div>`; phone.appendChild(w);
  const shade = w.querySelector('.pf-shade'), el = w.querySelector('.pf-sheet'); let open = true;
  SND.play('whoosh'); M.anim(shade, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
  M.anim(el, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] : [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' });
  const close = async () => { if (!open) return; open = false; SND.play('close'); M.anim(shade, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    await M.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' }); w.remove(); if (w.onclosed) w.onclosed(); };
  shade.onclick = close; el.querySelectorAll('.p3d').forEach((b) => M.pressable(b));
  return { el, close, wrap: w };
}
function dialog(phone, { icon, title, text, yes, cls = 'primary', no = 'BEKOR QILISH' }) {
  return new Promise((res) => {
    const w = document.createElement('div'); w.className = 'pgsheet';
    w.innerHTML = `<div class="pf-shade"></div><div class="dialog">${icon ? `<img src="${ICON}${icon}.png" alt="">` : ''}<b>${title}</b><p>${text}</p>${btn(yes, cls, ' data-y')}${btn(no, 'secondary', ' data-n')}</div>`; phone.appendChild(w);
    const shade = w.querySelector('.pf-shade'), dlg = w.querySelector('.dialog'); dlg.style.pointerEvents = 'auto'; let done = false;
    SND.play('pop'); M.anim(shade, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
    M.anim(dlg, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, scale: '.9' }, { opacity: 1, scale: '1.02', offset: 0.7 }, { opacity: 1, scale: '1' }], { duration: 220, fill: 'forwards' });
    const end = async (v) => { if (done) return; done = true; SND.play('close'); M.anim(shade, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      await M.anim(dlg, [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.96' }], { duration: 140, easing: EASE.in, fill: 'forwards' }); w.remove(); res(v); };
    dlg.querySelectorAll('.p3d').forEach((b) => M.pressable(b)); dlg.querySelector('[data-y]').addEventListener('pointerup', () => end(true)); dlg.querySelector('[data-n]').addEventListener('pointerup', () => end(false)); shade.onclick = () => end(false);
  });
}
const toggleHTML = (on, key) => `<div class="toggle${on ? ' on' : ''}" data-k="${key}"><i${on ? ' style="translate:20px 0"' : ''}></i></div>`;
// the knob slides and stretches, the track changes colour (lab: controls.js)
function bindToggle(t, onChange) {
  const knob = t.querySelector('i');
  t.onclick = (e) => { e.stopPropagation(); const on = !t.classList.contains('on'); t.classList.toggle('on', on); SND.play(on ? 'switch-on' : 'switch-off');
    const from = on ? 0 : 20, to = on ? 20 : 0; knob.style.translate = `${to}px 0`;
    M.anim(knob, M.reduce ? [{ translate: `${from}px 0` }, { translate: `${to}px 0` }] : [{ translate: `${from}px 0`, scale: '1 1' }, { translate: `${(from + to) / 2}px 0`, scale: '1.18 .92', offset: 0.5 }, { translate: `${to}px 0`, scale: '1 1' }], { duration: 180, easing: EASE.std });
    onChange(on); };
}
// the pill slides under the chosen word
function bindSeg(seg, onPick) {
  const thumb = seg.querySelector('.thumb'), btns = [...seg.querySelectorAll('button')];
  const place = (b, animate) => { const from = { left: thumb.style.left || '4px', width: thumb.style.width || b.offsetWidth + 'px' }; thumb.style.left = b.offsetLeft + 'px'; thumb.style.width = b.offsetWidth + 'px';
    if (animate) M.anim(thumb, [from, { left: b.offsetLeft + 'px', width: b.offsetWidth + 'px' }], { duration: 180, easing: EASE.std }); };
  btns.forEach((b) => { b.onclick = (e) => { e.stopPropagation(); if (b.classList.contains('on')) return; SND.play('seg'); btns.forEach((o) => o.classList.remove('on')); b.classList.add('on'); place(b, true); onPick(b.dataset.v); }; });
  const first = () => place(btns.find((b) => b.classList.contains('on')) || btns[0], false); requestAnimationFrame(first); document.fonts.ready.then(first);
}
// a whole page over the phone that slides in from the right; resolves when its back arrow takes it away
function page(phone, cls, title, inner) {
  const el = document.createElement('div'); el.className = cls; el.innerHTML = `<div class="pf-top"><button class="back"><img src="${ICON}glyph-chevron-left-grey.png" alt=""></button><b>${title}</b></div>${inner}`; phone.appendChild(el);
  M.anim(el, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 250, easing: EASE.std, fill: 'backwards' }); SND.play('next');
  let closer; const closed = new Promise((r) => { closer = r; });
  el.querySelector('.back').onclick = async () => { SND.play('back'); await M.anim(el, M.reduce ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' }); el.remove(); closer(); };
  return { el, closed };
}

// the five goals, as on onboarding screen 2
export function goalSheet(ctx) {
  return new Promise((res) => {
    const cur = (ctx.settings || {}).goal; let picked = null;
    const sh = sheet(ctx.phone, `<h3>Ingliz tili sizga nima uchun kerak?</h3><div class="pf-opts">${Object.entries(GOALS).map(([k, [ic, t]]) =>
      `<button class="p3d tile pf-opt${k === cur ? ' sel' : ''}" data-g="${k}"><span class="face"><img src="${ICON}${ic}.png" alt=""><span class="lb">${t}</span><span class="ck"><img src="${ICON}glyph-check-white.png" alt=""></span></span></button>`).join('')}</div>`);
    sh.wrap.onclosed = () => res(picked);
    sh.el.querySelectorAll('.pf-opt').forEach((o) => o.addEventListener('pointerup', async () => {
      sh.el.querySelectorAll('.pf-opt').forEach((x) => x.classList.toggle('sel', x === o)); M.punch(o, 1.04); M.pop(o.querySelector('.ck'), VIOLET);
      picked = o.dataset.g; ctx.settings.goal = picked; ctx.set('goal', picked); await M.wait(380); sh.close(); }));
  });
}

// ---------- 28 · Settings ----------
export function settingsPage(ctx) {
  const s = ctx.settings || (ctx.settings = {}), row = (ic, label, right, extra = '', sub = '') => `<div class="pf-row"${extra}><img src="${ICON}${ic}.png" alt=""><span class="lb">${label}${sub ? `<small>${sub}</small>` : ''}</span>${right}</div>`;
  const link = (ic, label, a, val = '', cls = '') => `<button class="pf-row${cls}" data-a="${a}"><img src="${ICON}${ic}.png" alt=""><span class="lb">${label}</span>${val ? `<span class="val" data-v="${a}">${val}</span>` : ''}${cls ? '' : `<img class="chev" src="${ICON}glyph-chevron-right-grey.png" alt="">`}</button>`;
  const goalName = () => (GOALS[s.goal] || GOALS.self)[1], today = () => `Bugun: ${dlong(ctx.now())}`;
  const { el, closed } = page(ctx.phone, 'pg28', 'Sozlamalar', `<div class="pf-body">
    <div class="pf-h">UMUMIY</div>
    <div class="pf-group">${row('glyph-speaker-grey', 'Ovozli effektlar', toggleHTML(s.sound !== false, 'sound'))}${row('glyph-moon-grey', 'Tungi rejim', toggleHTML(!!s.dark, 'dark'))}
      ${link('glyph-bell-grey', 'Eslatma vaqti', 'reminder', s.reminder || '19:00')}${link((GOALS[s.goal] || GOALS.self)[0], 'Maqsad', 'goal', goalName())}</div>
    <div class="pf-h">GAPIRISH</div>
    <div class="pf-group">${row('glyph-mic-grey', 'Gapirish mashqlari', toggleHTML(s.speaking !== false, 'speaking'), '', 'Mikrofon ishlatib bo\'lmaydigan joyda vaqtincha o\'chiring')}${link('glyph-shield-grey', 'Ovoz yozuvlari', 'voice')}${row('glyph-wave-grey', 'Inglizcha ovozlar', `<div class="seg"><i class="thumb"></i><button data-v="uk"${s.cast !== 'us' ? ' class="on"' : ''}>Britancha</button><button data-v="us"${s.cast === 'us' ? ' class="on"' : ''}>Amerikacha</button></div>`)}</div>
    <div class="pf-h">HISOB</div>
    <div class="pf-group">${link('glyph-lock-grey', 'Maxfiylik', 'privacy')}${link('glyph-logout-grey', 'Chiqish', 'logout')}${link('glyph-trash-red', 'Hisobni o\'chirish', 'delete', '', ' red')}</div>
    <div class="pf-h">SINOV UCHUN<small>Bu bo'lim faqat sinov versiyasida bor.</small></div>
    <div class="pf-group test">${row('glyph-list-grey', 'Hamma darslar ochiq', toggleHTML(!!s.openAll, 'openAll'))}
      ${row('glyph-timer-grey', 'Sanani surish', '', '', `<span data-today>${today()}</span><span class="pf-days"><button data-d="1">+1 kun</button><button data-d="14">+14 kun</button><button data-d="0">Bugun</button></span>`)}
      ${link('glyph-info-grey', 'Oynalarni ko\'rish', 'windows')}${link('glyph-replay-grey', 'Boshidan boshlash', 'restart', '', ' red')}</div>
  </div>`);
  const q = (sel) => el.querySelector(sel);
  el.querySelectorAll('.toggle').forEach((t) => bindToggle(t, (on) => { const k = t.dataset.k; s[k] = on;
    if (k === 'dark') { document.body.classList.add('themefade'); setTimeout(() => document.body.classList.remove('themefade'), 320); }
    ctx.set(k, on); }));
  bindSeg(q('.seg'), (v) => { s.cast = v; ctx.set('cast', v); });
  el.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => { M.punch(b, 1.1, 160); ctx.shiftDays(+b.dataset.d); q('[data-today]').textContent = today(); M.punch(q('[data-today]'), 1.06, 180); }; });
  const act = {
    reminder: () => { const sh = sheet(ctx.phone, `<h3>Har kuni soat nechada eslatay?</h3><div class="pf-wheelwrap"><div class="wheel"><div class="sel"></div><div class="list"></div></div></div>${btn('SAQLASH', 'primary', ' data-save')}`);
      const at = DAY.indexOf(s.reminder || '19:00'), w = timeWheel(sh.el.querySelector('.wheel'), DAY, at < 0 ? DAY.indexOf('19:00') : at, scaleOf(ctx.phone));
      sh.el.querySelector('[data-save]').addEventListener('pointerup', async () => { s.reminder = w.value; ctx.set('reminder', w.value); q('[data-v="reminder"]').textContent = w.value; M.pop(sh.el.querySelector('.sel'), VIOLET); SND.play('reminder'); await M.wait(300); sh.close(); }); },
    goal: async () => { const k = await goalSheet(ctx); if (k) { q('[data-v="goal"]').textContent = goalName(); q('[data-a="goal"] > img').src = `${ICON}${GOALS[k][0]}.png`; } },
    voice: () => recordingsPage(ctx),
    privacy: () => ctx.notReady(),
    logout: async () => { if (await dialog(ctx.phone, { title: 'Hisobdan chiqasizmi?', text: 'Qaytib kirganingizda natijalaringiz joyida bo\'ladi.', yes: 'CHIQISH' })) ctx.logOut(); },
    delete: async () => { if (await dialog(ctx.phone, { icon: 'trash', title: 'Hisobni o\'chirasizmi?', text: 'Hamma natijalar, seriya va ovoz yozuvlari butunlay o\'chadi. Buni qaytarib bo\'lmaydi.', yes: 'O\'CHIRISH', cls: 'danger' })) { await Rec.clear(); ctx.deleteAccount(); } },
    windows: () => { const L = [['feedback', 'glyph-message-grey', 'Fikr bildirish (29)'], ['confidence', 'glyph-star-grey', 'Ishonch savoli (30)'], ['offline', 'glyph-wifi-off-grey', 'Internet yo\'q (31a)'], ['micBlocked', 'glyph-mic-off-grey', 'Mikrofon yopiq (31b)'],
        ['speech', 'glyph-wave-grey', 'Nutq tanilmayapti (31c)'], ['error', 'glyph-info-grey', 'Nimadir buzildi (31e)'], ['notReady', 'glyph-timer-grey', 'Hali tayyor emas (31d)']];
      const sh = sheet(ctx.phone, `<h3>Oynalarni ko'rish</h3><div class="pf-list">${L.map(([k, ic, t]) => `<button data-w="${k}"><img src="${ICON}${ic}.png" alt=""><span>${t}</span><img src="${ICON}glyph-chevron-right-grey.png" alt=""></button>`).join('')}</div>`);
      sh.el.querySelectorAll('[data-w]').forEach((b) => { b.onclick = async () => { await sh.close(); ctx.show(b.dataset.w); }; }); },
    restart: async () => { if (!await dialog(ctx.phone, { icon: 'trash', title: 'Boshidan boshlaysizmi?', text: 'Hamma natijalar, seriya va ovoz yozuvlari o\'chadi.', yes: 'HA, BOSHIDAN', cls: 'danger' })) return;
      if (await dialog(ctx.phone, { title: 'Rostdan ham?', text: 'Buni qaytarib bo\'lmaydi.', yes: 'O\'CHIRISH', cls: 'danger' })) { await Rec.clear(); ctx.deleteAccount(); } },
  };
  el.querySelectorAll('button[data-a]').forEach((b) => { b.onclick = () => act[b.dataset.a](); });
  return closed;
}

// ---------- 28b · Voice recordings ----------
export function recordingsPage(ctx) {
  const s = ctx.settings || (ctx.settings = {});
  const { el, closed } = page(ctx.phone, 'pg28b', 'Ovoz yozuvlari', `<div class="pf-body">
    <div class="pf-note"><img class="ic-dark" src="${ICON}glyph-shield-dark.png" alt="">Yozuvlaringizni faqat siz eshitasiz. Ular hech kimga yuborilmaydi.</div>
    <div class="pf-group"><div class="pf-row"><img src="${ICON}glyph-mic-grey.png" alt=""><span class="lb">Ovozimni saqlash<small>Ba'zi gapirish savollarida ovozingiz saqlanadi — keyin taraqqiyotingizni eshitasiz</small></span>${toggleHTML(s.saveVoice !== false, 'saveVoice')}</div></div>
    <div class="pf-h" data-count>SAQLANGAN YOZUVLAR · 0</div><div class="pf-recs"></div></div>
    <div class="pf-foot" style="display:none">${btn('BARCHA YOZUVLARNI O\'CHIRISH', 'danger', ' data-all')}</div>`);
  const q = (sel) => el.querySelector(sel), list = q('.pf-recs'), foot = q('.pf-foot');
  let rows = [];
  const empty = () => `<div class="pf-empty">${s.saveVoice !== false ? 'Hali yozuv yo\'q. Darslarda gapirganingizda ovozingiz shu yerga saqlanadi.' : 'Ovozingiz saqlanmayapti.'}</div>`;
  const count = () => { const n = list.querySelectorAll('.pf-vrow').length; q('[data-count]').textContent = `SAQLANGAN YOZUVLAR · ${n}`; foot.style.display = n ? '' : 'none'; if (!n && !list.querySelector('.pf-empty')) { list.innerHTML = empty(); M.fadeUp(list.firstChild, 6, 200); } };
  const fold = (r, delay = 0) => M.anim(r, [{ height: r.offsetHeight + 'px', marginBottom: '10px', opacity: 1, borderWidth: '2px', paddingTop: '12px', paddingBottom: '12px' },
    { height: '0px', marginBottom: '0px', opacity: 0, borderWidth: '0px', paddingTop: '0px', paddingBottom: '0px' }], { duration: 180, delay: delay * M.slow, easing: EASE.std, fill: 'forwards' });
  bindToggle(q('.toggle'), (on) => { s.saveVoice = on; ctx.set('saveVoice', on); const e = list.querySelector('.pf-empty'); if (e) e.outerHTML = empty(); });
  Rec.list().then((all) => {
    rows = all; if (!all.length) { count(); return; }
    list.innerHTML = all.map((r) => { const p = ctx.C.P[r.phraseId]; return `<div class="pf-vrow" data-id="${r.phraseId}"><button class="play"><img class="ic-dark" src="${ICON}glyph-play-dark.png" alt=""><span class="bars"><i></i><i></i><i></i></span></button>
      <span class="tx"><b>${p ? p.en : r.phraseId}</b><small>Mening ovozim · ${dshort(r.at)}</small></span><button class="del"><img class="ic-dark" src="${ICON}glyph-trash-dark.png" alt=""></button></div>`; }).join('');
    list.querySelectorAll('.pf-vrow').forEach((r, i) => { M.fadeUp(r, 10, 220, i * 40);
      const play = r.querySelector('.play'), img = play.querySelector('img'), bars = play.querySelector('.bars');
      play.onclick = async () => { M.punch(play, 1.1, 160); let w = null;
        await Rec.play(r.dataset.id, { onStart: () => { img.style.opacity = 0; bars.style.opacity = 1; w = M.waves(bars); } });
        if (w) w.forEach((a) => a.cancel()); bars.style.opacity = 0; img.style.opacity = 1; };
      r.querySelector('.del').onclick = async () => { await Rec.remove(r.dataset.id); SND.play('close'); await fold(r); r.remove(); count(); }; });
    count();
  });
  q('[data-all]').addEventListener('pointerup', async () => {
    if (!await dialog(ctx.phone, { icon: 'trash', title: 'Ovoz yozuvlarini o\'chirasizmi?', text: 'Hamma yozuvlar butunlay o\'chadi. Buni qaytarib bo\'lmaydi.', yes: 'O\'CHIRISH', cls: 'danger' })) return;
    await Rec.clear(); const all = [...list.querySelectorAll('.pf-vrow')];
    await Promise.all(all.map((r, i) => { SND.appear(i * 70 + 1); return fold(r, i * 70); })); all.forEach((r) => r.remove()); count();
  });
  M.pressable(q('[data-all]'));
  return closed.then(() => Rec.stop());
}
