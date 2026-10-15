// The moments around a lesson, as the lab plays them (design/motion: lessonmoments.js 16, screens.js 17 and 18):
// the mistakes round card, "now you can say", and the lesson result.
import { C } from './content.js';
import { say, stop } from './audio.js';
import { People } from './people.js';

const btn = (label, cls = 'primary') => `<button class="p3d btn ${cls} go"><span class="face">${label}</span></button>`;
const fire = (vm, name = 'fire') => { if (!M.reduce) vm.trigger(name).trigger(); };
const pressed = (root) => new Promise((r) => { const b = root.querySelector('.go'); M.pressable(b); b.addEventListener('pointerup', r, { once: true }); });
const listenRow = (b, voice, text) => say(voice, text, { onStart: (ms) => W.play(b, ms) });

// ---------- 16 · mistakes round: Dombi thinks, the card slides in ----------
export async function mistakesCard(host, count) {
  const el = document.createElement('div'); el.className = 'scr over';
  el.innerHTML = `<div class="status"></div><div class="mid"><div class="dombibox"></div><div class="divider" style="opacity:0"><img src="${ICON}repeat.png" alt=""><b>Xatolar ustida ishlaymiz</b><small>${count} ta savolni yana bir bor ko'ramiz</small></div></div>
    <div class="bot" style="opacity:0">${btn('BOSHLADIK')}</div>`;
  host.appendChild(el); const d = People.putDombi(el.querySelector('.dombibox'), 150); d.enum('mood').value = 'think'; d.enum('gesture').value = 'thinking';
  d.boolean('hidden').value = true; await M.wait(60); d.boolean('hidden').value = false; await M.wait(220);
  const card = el.querySelector('.divider'); SND.play('mistakes');
  M.anim(card, M.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, translate: '70px 0' }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, fill: 'forwards' });
  if (!M.reduce) M.anim(card.querySelector('img'), [{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 520, delay: 120 * M.slow, easing: EASE.std });
  M.fadeUp(el.querySelector('.bot'), 10, 220, 300); M.wait(800).then(() => { if (el.isConnected) M.shine(el.querySelector('.go')); });
  await pressed(el); d.enum('gesture').value = 'none'; d.enum('mood').value = 'smirk'; People.home(); el.remove();
}

// ---------- 17 · now you can say: the lesson's main phrase on a violet card ----------
export async function canSay(phone, screen, lesson) {
  const last = lesson.items[lesson.items.length - 1], p = C.P[last.p]; stop();
  screen.innerHTML = `<div class="scr"><div class="status"></div><div class="mid" style="gap:20px"><div style="height:40px"></div><span class="dph" style="width:130px;height:130px"></span>
    <div class="p3d cscard" style="opacity:0"><span class="face"><img class="pp" src="${ICON}party-popper.png" alt=""><span class="k">ENDI AYTA OLASIZ:</span><span class="p">${p.en}</span><span class="m">${p.uz}</span>
      <button class="listen"><img src="${ICON}glyph-speaker-white.png" alt=""><span class="bars"><i></i><i></i><i></i></span>TINGLASH</button></span></div>
    <div class="note" style="opacity:0">${lesson.title}</div></div><div class="bot" style="opacity:0">${btn('DAVOM ETISH')}</div></div>`;
  const card = screen.querySelector('.cscard'), listen = screen.querySelector('.listen'), d = People.putDombi(screen.querySelector('.dph'), 130);
  d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate';
  await M.wait(100); fire(People.over('confetti', phone), 'medium'); await M.wait(60);
  card.style.opacity = 1; M.popIn(card, { duration: 300 }); SND.play('new-phrase');
  if (!M.reduce) M.anim(card.querySelector('.pp'), [{ rotate: '0deg' }, { rotate: '-14deg', offset: 0.3 }, { rotate: '10deg', offset: 0.6 }, { rotate: '0deg' }], { duration: 420, delay: 200 * M.slow, easing: EASE.sine });
  await M.wait(320); const twk = People.over('twinkle', phone, card, 240, 200, -70); twk.color('color').value = GOLD; fire(twk);
  M.wait(900).then(() => { if (listen.isConnected) listenRow(listen, p.voice, p.en); });                 // the phrase is spoken once the sparkle is over, never on top of it
  M.fadeUp(screen.querySelector('.note'), 8, 220, 150); M.fadeUp(screen.querySelector('.bot'), 10, 220, 300); M.wait(700).then(() => { const g = screen.querySelector('.go'); if (g) M.shine(g); });
  listen.onclick = () => { M.punch(listen, 1.06, 160); listenRow(listen, p.voice, p.en); }; M.pressable(card);
  await pressed(screen); stop(); SND.cut(); d.enum('gesture').value = 'none'; People.home();
}

// ---------- 18 · lesson result: three numbers count up, Dombi cheers on the beat, then the phrases ----------
export async function result(phone, screen, lesson, stats, spokenMs) {
  const perfect = stats.perfect, news = (lesson.new || []).map((id) => C.P[id]), secs = Math.round(spokenMs / 1000);
  const count = lesson.checkpoint ? Object.values(C.P).filter((p) => lesson.unit.lessons.some((l) => l.n === p.lesson)).length : news.length;      // after a checkpoint: every phrase of the unit
  const STATS = [['green', 'ANIQLIK', 'glyph-target-green', '<span id="acc">0</span>%'], ['coral', 'GAPIRDINGIZ', 'glyph-mic-coral', '<span id="spoke">0:00</span>'], ['violet', 'IBORALAR', 'glyph-message-violet', `${lesson.checkpoint ? '' : '+'}<span id="phr">0</span>`]];
  screen.innerHTML = `<div class="scr"><div class="status"></div><div class="rbody"><span class="dph" style="width:150px;height:150px;margin:5px 0"></span><h3 style="opacity:0">${lesson.checkpoint ? 'Zo\'r, uddaladingiz!' : 'Dars tugadi!'}</h3>
    ${perfect ? `<div class="pbadge" style="opacity:0"><img src="${ICON}glyph-sparkles-white.png" alt="">MUKAMMAL!</div>` : ''}
    <div class="rstats">${STATS.map(([c, l, ic, v]) => `<div class="rstat ${c}" style="opacity:0"><div class="hd">${l}</div><div class="bd"><img src="${ICON}${ic}.png" alt=""><span class="v">${v}</span></div></div>`).join('')}</div>
    <div class="rk" style="opacity:0">${news.length ? 'ENDI AYTA OLASIZ:' : lesson.title.toUpperCase()}</div>
    ${news.map((p) => `<div class="prow" style="opacity:0"><button class="p3d audio sm"><span class="face"><img src="${ICON}glyph-speaker-violet.png" alt=""><span class="bars"><i></i><i></i><i></i></span></span></button><span><b>${p.en}</b><small>${p.uz}</small></span></div>`).join('')}
    </div><div class="bot" style="opacity:0">${btn('DAVOM ETISH')}</div></div>`;
  const q = (s) => screen.querySelector(s), HIT = 1100, d = People.putDombi(q('.dph'), 150); let alive = true; d.enum('mood').value = 'happy';     // HIT: the beat everything lands on
  if (!perfect) SND.hit('lesson-done', HIT + 50, { ok: () => alive });
  screen.querySelectorAll('.rstat').forEach((s, i) => M.fadeUp(s, 12, 220, 120 + i * 70));
  await M.wait(300);
  if (M.reduce) { q('#acc').textContent = stats.accuracy; q('#phr').textContent = count; } else { M.countUp(q('#acc'), stats.accuracy, 600); M.countUp(q('#phr'), count, 600); }
  const sp = q('#spoke'), t0 = performance.now(), tick = (now) => { const k = Math.min((now - t0) / (600 * M.slow), 1), s = Math.round(secs * (1 - Math.pow(1 - k, 3)));
    sp.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (k < 1 && alive) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  const pf = q('.pbadge');
  if (perfect) { await M.wait(HIT - 300 - 270); pf.style.opacity = 1; HAP.at('heavy', 270, 'perfect slam');                                        // the gold badge slams in and lands on the beat
    if (!M.reduce) await M.anim(pf, [{ scale: '2.6', opacity: 0 }, { scale: '.9', opacity: 1, offset: 0.72 }, { scale: '.9', offset: 0.86 }, { scale: '1' }], { duration: 380, easing: EASE.in }); else await M.wait(270);
  } else await M.wait(HIT - 300);
  d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate'; const h3 = q('h3'); h3.style.opacity = 1; M.popIn(h3, { duration: 260 });
  const conf = People.over('confetti', phone);
  if (perfect) { SND.play('perfect'); fire(conf, 'large'); const twk = People.over('twinkle', phone, pf, 150, 125); twk.color('color').value = GOLD; fire(twk); [1300, 2600].forEach((ms) => M.wait(ms).then(() => { if (alive) fire(twk); })); }
  else fire(conf, 'medium');
  M.fadeUp(q('.rk'), 8, 200, 180);
  screen.querySelectorAll('.prow').forEach((r, i) => { M.fadeUp(r, 14, 240, 260 + i * 70); const a = r.querySelector('.audio'); M.wait(260 + i * 70 + 160).then(() => { if (alive) M.punch(a, 1.18, 220); });
    M.pressable(a); a.addEventListener('pointerup', () => listenRow(a, news[i].voice, news[i].en)); });
  M.fadeUp(q('.bot'), 10, 220, 520); M.wait(1100).then(() => { if (alive) M.shine(q('.go')); });
  M.wait(1800).then(() => { if (alive) { d.enum('gesture').value = 'none'; d.enum('mood').value = 'happy'; } });                                   // hands away again once the cheer is over
  await pressed(screen); alive = false; stop(); SND.cut(); d.enum('gesture').value = 'none'; d.enum('mood').value = 'smirk'; People.home();
}
