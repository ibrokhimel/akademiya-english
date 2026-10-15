// The moments between a lesson and the Learn page, as the lab plays them: streak +1 (19, design/motion/lessonmoments.js),
// checkpoint result with the trophy (22) and level up (23) (design/motion/screens.js). Each one waits for its button.
import { People } from './people.js';

const btn = (label, cls = 'primary') => `<button class="p3d btn ${cls} go"><span class="face">${label}</span></button>`;
const fire = (vm, name = 'fire') => { if (!M.reduce) vm.trigger(name).trigger(); };
const pressed = (root) => new Promise((r) => { const b = root.querySelector('.go'); M.pressable(b); b.addEventListener('pointerup', r, { once: true }); });
const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];                               // Sunday first
// who the learner talked to in each checkpoint, for "… FIKRI"
const PARTNER = { c1: 'MALIKANING', c2: 'OFITSIANTNING', c3: 'SOTUVCHINING' };
// what a level lets you do (the lab's list for level 1)
const CAN = { 1: [['hand-wave', 'Tanishib, o\'zingizni tanishtirish'], ['coffee-kafeda', 'Kafeda buyurtma berish'], ['cart-dokon', 'Do\'konda narx so\'rash va to\'lash']] };
const STAGE = { 1: 'OMON QOLISH' };

// ---------- 19 · streak +1: the flame lights, the number flips, today's dot fills ----------
export async function streakScreen(screen, before, after) {
  const dot = (d) => d.state === 'done' ? `<span class="dot done"><img src="${ICON}glyph-check-white.png" alt=""></span>`
    : d.state === 'frozen' ? `<span class="dot frozen"><img class="ice" src="${ICON}frozen-streak.png" alt=""><img class="ic2" src="${ICON}glyph-check-ice.png" alt=""></span>` : `<span class="dot"${d.state === 'today' ? ' id="today"' : ''}></span>`;
  screen.innerHTML = `<div class="scr"><div class="status"></div><div class="mid"><div class="streakbig" style="opacity:0"><div class="flamebig"></div>
    <div class="cnt"><span class="n"><span id="nOld">${before.count}</span><span id="nNew" style="opacity:0">${after.count}</span></span>kun!</div>
    <div class="week">${before.week.map((d, i) => `<span class="day${d.state === 'today' ? ' today' : ''}">${DAYS[i]}${dot(d)}</span>`).join('')}</div>
    <div class="note" style="opacity:0">Ertaga yana bitta dars — seriya ${after.count + 1} kun bo'ladi.</div></div></div><div class="bot" style="opacity:0">${btn('ZO\'R!')}</div></div>`;
  const q = (s) => screen.querySelector(s), box = q('.flamebig'), fl = People.canvas.flameBig, em = People.canvas.embers, flame = People.flameBig;
  fl.className = 'fl'; fl.style.cssText = ''; em.className = 'em'; em.style.cssText = ''; box.append(em, fl); flame.boolean('lit').value = false;
  const card = q('.streakbig'); card.style.opacity = 1; M.popIn(card, { duration: 260 });
  await M.wait(380);
  flame.boolean('lit').value = true; flame.trigger('ignite').trigger(); SND.play('streak'); fire(People.fx.embers);
  await M.wait(200);
  M.anim(q('#nOld'), [{ translate: '0 0', opacity: 1 }, { translate: '0 -30px', opacity: 0 }], { duration: 180, easing: EASE.in, fill: 'forwards' });
  M.anim(q('#nNew'), [{ translate: '0 30px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 240, delay: 60 * M.slow, fill: 'forwards' });
  M.wait(300).then(() => M.punch(q('.cnt'), 1.16, 220));
  await M.wait(260);
  const t = q('#today'); if (t) { t.classList.add('done'); t.innerHTML = `<img src="${ICON}glyph-check-white.png" alt="">`; M.popIn(t.firstChild); M.punch(t, 1.25, 240); }
  M.fadeUp(q('.note'), 6, 200, 200); M.fadeUp(q('.bot'), 10, 220, 350); M.wait(900).then(() => { const g = q('.go'); if (g) M.shine(g); });
  await pressed(screen); People.home();
}

// ---------- 22 · checkpoint result: the trophy drops and lands, then the partner's reaction (set by the mistakes, never sad) ----------
export async function trophyScreen(phone, screen, cp, unit, mistakes) {
  const win = mistakes <= 1 ? 2 : mistakes <= 4 ? 1 : 0;
  const note = mistakes === 0 ? 'Ajoyib! Birorta ham xato yo\'q.' : mistakes === 1 ? 'Ajoyib! Atigi 1 ta xato.' : `${win ? 'Yaxshi!' : 'Uddaladingiz!'} ${mistakes} ta xato.`;
  screen.innerHTML = `<div class="scr cream"><div class="status"></div><div class="mid"><div class="trophy" style="opacity:0"><img src="${ICON}trophy-unit.png" alt=""></div>
    <div class="big" style="opacity:0">${unit.name.replace('!', '')} bo'limi tugadi!</div><div class="sub" style="opacity:0">Siz butun suhbatni ingliz tilida o'tkazdingiz.</div>
    <div class="react" style="opacity:0"><div class="l">${PARTNER[cp.id] || 'SUHBATDOSHINGIZNING'} FIKRI:</div><div class="faces">${['face-smile', 'face-grin', 'face-starstruck'].map((f) => `<span class="fc"><img src="${ICON}${f}.png" alt=""></span>`).join('')}</div>
      <div class="n" style="opacity:0">${note}</div></div></div><div class="bot" style="opacity:0">${btn('DAVOM ETISH', 'gold')}</div></div>`;
  const q = (s) => screen.querySelector(s), tr = q('.trophy');
  await M.wait(120); tr.style.opacity = 1;
  if (!M.reduce) await M.anim(tr, [{ translate: '0 -420px', scale: '1 1' }, { translate: '0 0', scale: '.96 1.06' }], { duration: 340, easing: EASE.in });
  // landing: squash, a short stop, dust, rings, confetti
  if (!M.reduce) M.anim(tr, [{ scale: '1.14 .84' }, { scale: '1.14 .84', offset: 0.28 }, { scale: '.95 1.07', offset: 0.6 }, { scale: '1.02 .98', offset: 0.82 }, { scale: '1 1' }], { duration: 480, easing: 'ease-out' });
  SND.play('trophy'); fire(People.over('dust', phone, tr, 200, 120, 62)); const rings = People.over('rings', phone, tr, 240, 240); rings.color('color').value = GOLD; fire(rings); fire(People.over('confetti', phone), 'large');
  await M.wait(260);
  q('.big').style.opacity = 1; M.popIn(q('.big')); M.fadeUp(q('.sub'), 8, 220, 120); M.fadeUp(q('.react'), 12, 240, 260);
  const twk = People.over('twinkle', phone, tr, 240, 200); twk.color('color').value = GOLD; fire(twk);
  await M.wait(760);
  const f = screen.querySelectorAll('.fc')[win]; f.classList.add('win'); if (!M.reduce) M.anim(f, [{ scale: '.72' }, { scale: '1.12', offset: 0.6 }, { scale: '1' }], { duration: 300 }); M.pop(f, GOLD);
  M.fadeUp(q('.react .n'), 6, 200, 150); M.fadeUp(q('.bot'), 10, 220, 250); M.wait(800).then(() => { const g = q('.go'); if (g) M.shine(g); });
  await pressed(screen); People.home();
}

// ---------- 23 · level up: the badge slams in, the number flips, then what you can do now ----------
export async function levelUp(phone, screen, level) {
  const can = CAN[level] || [];
  screen.innerHTML = `<div class="scr violet"><div class="status"></div><div class="mid"><div style="height:16px"></div><div class="lbadge" style="opacity:0"><span id="lvOld">${level - 1}</span><span id="lvNew" style="opacity:0">${level}</span></div>
    <div class="big" style="opacity:0">Yangi daraja!</div><div class="cap" style="opacity:0">${level}-DARAJA · ${STAGE[level] || ''}</div>
    <div class="cando" style="opacity:0"><div class="l">ENDI SIZ QILA OLASIZ:</div>${can.map(([ic, t]) => `<div class="it" style="opacity:0"><img src="${ICON}${ic}.png" alt="">${t}</div>`).join('')}</div></div>
    <div class="bot" style="opacity:0">${btn(`${level}-DARAJANI BOSHLASH`, 'gold')}</div></div>`;
  const q = (s) => screen.querySelector(s), badge = q('.lbadge');
  M.anim(q('.scr'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  await M.wait(200);
  badge.style.opacity = 1; if (!M.reduce) M.anim(badge, [{ scale: '0' }, { scale: '1.2', offset: 0.6 }, { scale: '1' }], { duration: 420 }); SND.play('level-up');
  fire(People.over('confetti', phone), 'fountain');
  await M.wait(220); const rings = People.over('rings', phone, badge, 240, 240); rings.color('color').value = GOLD; fire(rings);
  await M.wait(160);
  M.anim(q('#lvOld'), [{ translate: '0 0', opacity: 1 }, { translate: '0 -50px', opacity: 0 }], { duration: 200, easing: EASE.in, fill: 'forwards' });
  M.anim(q('#lvNew'), [{ translate: '0 50px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 260, delay: 80 * M.slow, fill: 'forwards' });
  M.wait(340).then(() => M.punch(badge, 1.1, 220));
  await M.wait(260);
  q('.big').style.opacity = 1; M.popIn(q('.big')); M.fadeUp(q('.cap'), 6, 200, 120); M.fadeUp(q('.cando'), 12, 240, 240);
  screen.querySelectorAll('.it').forEach((it, i) => M.fadeUp(it, 8, 220, 380 + i * 90));
  M.fadeUp(q('.bot'), 10, 220, 760); M.wait(1300).then(() => { const g = q('.go'); if (g) M.shine(g); });
  await pressed(screen); People.home();
}
