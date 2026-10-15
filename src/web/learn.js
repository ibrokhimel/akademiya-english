// The Learn page: the locked Path H design (Pencil "Screen 11 · Path", lab page design/motion/nav.html), with the real progress.
// The three units sit one under another on one scrolling path; the banner at the top shows the unit in view.
//   showLearn(phone, screen, { p, before, after, ctx, tab, tabs })  ->  { lesson, tab } | { refresh: true, tab }
//     tabs: { progress(host), profile(host) } draw those tabs (each returns a cleanup); ctx: the app's (settings, set(), progress())
// `after` = the lesson just finished and `before` = the progress before it: the page opens as it was and plays the "lesson done" beat.
import { C } from './content.js';
import { say, stop } from './audio.js';
import { People } from './people.js';
import { thingsICanSay } from './progresspage.js';

const SECTION = 600;                                                   // one unit's height on the path
const SPOTS = [[159.5, 16.2, 'star'], [112.9, 91.5, 'mic'], [90.1, 177.5, 'star'], [112.6, 262.1, 'headphones'], [158.8, 338.8, 'message']];      // the design's circles, from the path's top
const TROPHY = [206.2, 425.4], ART = [253.9, 168.9], STARS = [262, 267];
// the checkpoint's five story steps, short enough for the chain (icon, name)
const STEPS = { c1: [['hand-wave', 'Salom'], ['lesson-aziz', 'Ism'], ['lesson-uzbekistan', 'Qayerdan'], ['lesson-how', 'Hol-ahvol'], ['hands-up', 'Xayr']],
  c2: [['hand-wave', 'Salom'], ['coffee-kafeda', 'Buyurtma'], ['money-bag', 'Narx'], ['card', 'To\'lash'], ['hands-up', 'Xayr']],
  c3: [['hand-wave', 'Salom'], ['cart-dokon', 'So\'rash'], ['lesson-sizes', 'O\'lcham'], ['money-bag', 'Narx'], ['lesson-bag', 'Xarid']] };
const btn = (label, cls = 'primary', id = '') => `<button class="p3d btn ${cls}"${id ? ` id="${id}"` : ''}><span class="face">${label}</span></button>`;
const minutes = (l) => Math.max(2, Math.round(l.items.length * 20 / 60));
const glyph = (g, state) => { const hp = g === 'headphones';
  const name = state === 'done' ? 'glyph-check-white' : hp ? 'glyph-v1-headphones-muted' : `glyph-${g}-${state === 'cur' ? 'white' : 'muted'}`;
  return `<img src="${ICON}${name}.png" alt=""${hp && state === 'cur' ? ' style="filter:brightness(0) invert(1)"' : ''}>`; };

export function showLearn(phone, screen, { p, before, after, ctx, tab = 'learn', tabs: tabsDraw }) {
  return new Promise((pick) => {
    const units = C.units, shown = before || p;                         // the page opens as it was before the lesson, then moves on
    let alive = true, glow = null, twinkle = 0, busy = !!after, unhook = () => {};
    const done = (v) => { if (!alive) return; alive = false; unhook(); clearInterval(twinkle); if (glow) glow.cancel(); stop(); People.home(); pick(v); };

    screen.innerHTML = `<div class="scr learnpage"><div class="learn">
      <div class="stat lv"><img src="${ICON}level-badge.png" alt=""><span>A${shown.level}</span></div>
      <div class="stat st${shown.streak.today ? '' : ' notyet'}"><span class="flm"></span><span class="n">${shown.streak.count}</span></div>
      <div class="stat ph"><img src="${ICON}bubble-phrases.png" alt=""><span class="n">${shown.phrases}</span></div>
      <button class="p3d ubanner" id="banner"><span class="face"><span class="txt"><span class="k"></span><span class="t"></span></span>
        <span class="book"><img src="${ICON}book-phrase-list.png" alt=""></span></span></button>
      <div class="path"><div class="pathin">${units.map((u, i) => section(u, i)).join('')}
        <div class="udiv" style="top:${units.length * SECTION - 74}px"><i></i><span>Keyingi bo'lim tez orada</span><i></i></div>
        <div class="node last" style="left:${SPOTS[0][0]}px;top:${units.length * SECTION + 16}px;--d:9px"><span class="face"><img src="${ICON}glyph-lock-muted.png" alt=""></span></div></div></div>
      <button class="spill"><img src="${ICON}glyph-mic-off-violet.png" alt="">GAPIRISH O'CHIQ · <b>YOQISH</b></button>
      <div class="tabbar"><div class="tab" data-t="learn"><img src="${ICON}tab-home.png" alt=""></div><div class="tab" data-t="progress"><img src="${ICON}tab-progress.png" alt=""></div><div class="tab" data-t="profile"><img src="${ICON}tab-profile.png" alt=""></div></div>
    </div>
    <div class="otherpage" data-t="progress"></div><div class="otherpage" data-t="profile"></div>
    <div class="backdrop"></div>
    <div class="startsheet"><div class="handle"></div><div class="hd"><div class="k"></div><div class="t"></div></div>
      <div class="cansay"><div class="l">BU DARSDAN KEYIN AYTA OLASIZ:</div><div class="p"><button class="p3d audio sm"><span class="face"><img src="${ICON}glyph-speaker-violet.png" alt=""><span class="bars"><i></i><i></i><i></i></span></span></button><span class="pp"></span></div></div>
      <div class="meta"></div>${btn('BOSHLASH', 'primary', 'shStart')}</div>
    <div class="dim"></div><div class="cpsheet"></div></div>`;
    const q = (s) => screen.querySelector(s), qa = (s) => [...screen.querySelectorAll(s)], path = q('.path'), pathin = q('.pathin'), banner = q('#banner');
    const all = units.flatMap((u) => [...u.lessons.map((l, k) => ({ ...l, unit: u, k })), { ...u.checkpoint, checkpoint: true, unit: u }]);
    const byId = Object.fromEntries(all.map((l) => [l.id, l])), nodeOf = (id) => pathin.querySelector(`[data-id="${id}"]`);

    function section(u, i) {
      const y0 = i * SECTION;
      return `${i ? `<div class="udiv" style="top:${y0 - 74}px"><i></i><span>${u.unit}-BO'LIM · ${u.name.replace('!', '').toUpperCase()}</span><i></i></div>` : ''}
        ${u.lessons.map((l, k) => `<div class="node" data-id="${l.id}" style="left:${SPOTS[k][0]}px;top:${y0 + SPOTS[k][1]}px;--d:9px"><i class="halo"></i><span class="face"></span></div>`).join('')}
        <button class="p3d trophyn" data-id="${u.checkpoint.id}" style="left:${TROPHY[0]}px;top:${y0 + TROPHY[1]}px"><span class="face"><img src="${ICON}trophy-unit.png" alt=""></span><span class="tick"><img src="${ICON}glyph-check-white.png" alt=""></span></button>
        <div class="unitart" style="left:${ART[0]}px;top:${y0 + ART[1]}px"><img src="${ICON}${u.icon}.png" alt=""></div>
        <div class="ustars" style="left:${STARS[0]}px;top:${y0 + STARS[1]}px"><b>★</b><b>★</b><b>★</b></div>`;
    }
    // paint every circle and trophy from a progress state
    function paint(st) {
      for (const l of all) { const n = nodeOf(l.id), s = st.state(l.id);
        if (l.checkpoint) { n.classList.toggle('done', s === 'done'); n.classList.toggle('ready', s === 'cur'); continue; }
        n.className = 'node' + (s === 'locked' ? '' : ' ' + s); n.querySelector('.face').innerHTML = glyph(SPOTS[l.k][2], s); }
      if (glow) glow.cancel(); glow = null;
      const cur = st.current && byId[st.current];
      if (cur && !cur.checkpoint) glow = M.glow(nodeOf(cur.id).querySelector('.halo'));
      clearInterval(twinkle); if (cur && cur.checkpoint) trophyTwinkle(nodeOf(cur.id));
    }
    // the slow gold twinkles on a trophy that is ready
    function trophyTwinkle(t) { const c = People.canvas.twinkle, fx = People.fx.twinkle; c.className = 'twk'; c.style.cssText = `left:${t.offsetLeft - 50}px;top:${t.offsetTop - 43}px`; pathin.appendChild(c);
      fx.color('color').value = GOLD; const fire = () => { if (!M.reduce) fx.trigger('fire').trigger(); }; fire(); twinkle = setInterval(fire, 2600); }

    // ---- the banner follows the unit in view; the page scrolls to the current circle ----
    const setBanner = () => { const u = units[Math.min(units.length - 1, Math.max(0, Math.floor((path.scrollTop + path.clientHeight / 2 + 74) / SECTION)))];      // the unit in the middle of the view
      if (banner._u === u) return; banner._u = u; q('.ubanner .k').textContent = `${u.unit}-BO'LIM · ${u.name.replace('!', '').toUpperCase()}`; q('.ubanner .t').textContent = u.checkpoint.title; };
    path.addEventListener('scroll', setBanner);
    const target = (id) => { const n = id && nodeOf(id); return n ? Math.max(0, n.offsetTop - 230) : pathin.scrollHeight; };
    const scrollTo = (id, ms = 300) => { const to = target(id); if (!ms || M.reduce) { path.scrollTop = to; return M.wait(0); }
      const from = path.scrollTop, t0 = performance.now(), dur = ms * M.slow;
      return new Promise((r) => { const step = (now) => { const k = Math.min((now - t0) / dur, 1); path.scrollTop = from + (to - from) * (1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); }); };
    paint(shown); scrollTo(after ? after.id : shown.current, 0); setBanner();

    // ---- the numbers at the top ----
    const sSt = q('.stat.st'), sPh = q('.stat.ph'), flame = People.flame; q('.flm').appendChild(People.canvas.flame); People.canvas.flame.style.cssText = '';
    flame.boolean('lit').value = shown.streak.today;
    qa('.stat').forEach((s) => s.addEventListener('click', () => M.punch(s, 1.12, 180)));
    async function lightStreak() { sSt.classList.remove('notyet'); flame.boolean('lit').value = true; flame.trigger('ignite').trigger(); SND.play('streak');
      const n = sSt.querySelector('.n'); n.textContent = p.streak.count; M.punch(sSt, 1.16, 220); M.pop(People.canvas.flame, 0xFFFF9F1C); }

    // ---- circles, trophies and the sheets ----
    for (const l of all) { const n = nodeOf(l.id);
      M.pressable(n, () => { if (busy) return; if (p.open(l.id)) (l.checkpoint ? openCheckpoint : openSheet)(l); else M.shake(n, 4, T.shakeSmall); }); }
    M.pressable(q('.node.last'), () => M.shake(q('.node.last'), 4, T.shakeSmall));
    const back = q('.backdrop'), sheet = q('.startsheet'), dim = q('.dim'), cps = q('.cpsheet'); let open = null, stopShine = () => {};
    const up = (el) => M.anim(el, M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] :
      [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' });
    function openSheet(l) {
      if (open) return; open = { el: sheet, shade: back }; const ph = C.P[(l.new || [])[0]], isDone = p.state(l.id) === 'done';
      sheet.querySelector('.k').textContent = `${l.n}-DARS · ${l.unit.name.replace('!', '').toUpperCase()}`; sheet.querySelector('.t').textContent = l.title; sheet.querySelector('.pp').textContent = ph ? ph.en : '';
      sheet.querySelector('.meta').innerHTML = `<span><img src="${ICON}glyph-list-grey.png" alt="">${l.items.length} mashq</span><span><img src="${ICON}glyph-${ctx.settings.speaking ? 'mic' : 'mic-off'}-grey.png" alt="">${ctx.settings.speaking ? 'Gapirish bor' : 'Gapirishsiz'}</span><span><img src="${ICON}glyph-timer-grey.png" alt="">≈ ${minutes(l)} daqiqa</span>`;
      const go = q('#shStart'); go.querySelector('.face').textContent = isDone ? 'TAKRORLASH' : 'BOSHLASH'; go.onpointerup = () => { if (open) done({ lesson: byId[l.id], tab: 'learn' }); };
      const play = sheet.querySelector('.audio'); play.onpointerup = () => { if (ph) say(ph.voice, ph.en, { onStart: (ms) => W.play(play, ms) }); };
      back.style.pointerEvents = 'auto'; SND.play('whoosh'); M.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' }); up(sheet);
      M.fadeUp(sheet.querySelector('.cansay'), 10, 220, 120); M.fadeUp(sheet.querySelector('.meta'), 8, 200, 180);
      M.wait(380).then(() => { if (open && open.el === sheet) { M.shine(go); stopShine = shineLoop(go); } });
    }
    // 20 · the checkpoint sheet: gold, with the five story steps lighting up one after another
    async function openCheckpoint(l) {
      if (open) return; open = { el: cps, shade: dim }; const S = STEPS[l.id], CK = `<img class="ck" src="${ICON}glyph-check-white.png" alt="">`;
      cps.innerHTML = `<div class="handle"></div><div class="cphead"><span class="tile"><img src="${ICON}trophy-unit.png" alt=""></span><span><div class="k">NAZORAT NUQTASI · ${l.unit.name.replace('!', '').toUpperCase()}</div><div class="t">${l.title}</div></span></div>
        <div class="story"><div class="l">SIZ BU HIKOYANI GAPIRIB O'TASIZ:</div><div class="chain">${S.map(([ic], i) => `${i ? '<span class="lnk"><i></i></span>' : ''}<span class="step"><img class="ic" src="${ICON}${ic}.png" alt="">${CK}</span>`).join('')}</div>
        <div class="names">${S.map((s) => `<span>${s[1]}</span>`).join('')}</div></div>
        <div class="cpmeta"><span><img src="${ICON}glyph-list-grey.png" alt="">${l.items.length} mashq</span><span><img src="${ICON}glyph-sparkles-grey.png" alt="">Yangi ibora yo'q</span><span><img src="${ICON}glyph-timer-grey.png" alt="">≈ ${minutes(l)} daqiqa</span></div>
        ${btn(p.state(l.id) === 'done' ? 'TAKRORLASH' : 'BOSHLASH', 'gold', 'cpStart')}`;
      const go = q('#cpStart'); M.pressable(go); go.addEventListener('pointerup', () => { if (open) done({ lesson: byId[l.id], tab: 'learn' }); });
      const steps = [...cps.querySelectorAll('.step')], links = [...cps.querySelectorAll('.lnk i')], names = [...cps.querySelectorAll('.names span')];
      names.forEach((n) => { n.style.opacity = 0.35; }); links.forEach((k) => { k.style.background = 'var(--gold)'; });
      dim.style.pointerEvents = 'auto'; SND.play('whoosh'); M.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' }); up(cps);
      await M.wait(380);
      for (const [i, s] of steps.entries()) { if (!open || open.el !== cps) return;
        if (i && !M.reduce) M.anim(links[i - 1], [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.6 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 320 });
        if (!M.reduce) M.anim(s, [{ scale: '.7', borderColor: '#FFD04F' }, { scale: '1.14', borderColor: '#FFD04F', offset: 0.55 }, { scale: '1' }], { duration: 260 });
        SND.play('step', { step: SND.deg(i) }); names[i].style.opacity = 1; M.fadeUp(names[i], 4, 160); await M.wait(110); }
      await M.wait(200); if (!open || open.el !== cps) return; steps[0].classList.add('cur'); M.punch(steps[0], 1.12, 200); M.shine(go);
    }
    function closeSheet() { if (!open) return; const { el, shade } = open; open = null; stopShine(); stop(); shade.style.pointerEvents = 'none'; SND.play('close');
      M.anim(shade, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      M.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }], { duration: 200, easing: EASE.in, fill: 'forwards' }); }
    back.onclick = closeSheet; dim.onclick = closeSheet; M.pressable(q('#shStart')); M.pressable(sheet.querySelector('.audio'));

    // ---- tabs: the violet pill moves to the chosen icon, the icon hops, the page cross-fades; Progress and Profile are drawn when opened ----
    const tabs = qa('.tab'), pages = qa('.otherpage'); let cleanup = null, curTab = 'learn';
    function showTab(t, quiet) {
      curTab = t; tabs.forEach((o) => o.classList.toggle('on', o.dataset.t === t));
      const icon = tabs.find((o) => o.dataset.t === t).querySelector('img'); if (!quiet && !M.reduce) M.anim(icon, [{ translate: '0 0' }, { translate: '0 -5px', offset: 0.4 }, { translate: '0 0' }], { duration: 240, easing: EASE.back });
      if (cleanup) { cleanup(); cleanup = null; }
      pages.forEach((pg) => { const on = pg.dataset.t === t; pg.style.pointerEvents = on ? 'auto' : 'none'; if (on) { pg.innerHTML = ''; if (tabsDraw && tabsDraw[t]) cleanup = tabsDraw[t](pg) || null; }
        M.anim(pg, [{ opacity: getComputedStyle(pg).opacity }, { opacity: on ? 1 : 0 }], { duration: quiet ? 0 : 150, fill: 'forwards' }); });
      screen.querySelector('.scr').dataset.tab = t;
    }
    tabs.forEach((t) => { t.onclick = () => { if (!t.classList.contains('on') && !busy) { SND.play('tab'); showTab(t.dataset.t); } }; });
    showTab(tab, true);
    // "speaking is off · turn on" and the other settings change while the page is open
    const spill = q('.spill'); spill.style.display = ctx.settings.speaking ? 'none' : ''; spill.onclick = () => { M.punch(spill, 1.05, 160); ctx.set('speaking', true); };
    const onSet = (e) => { const { k, v } = e.detail;
      if (k === 'speaking') { spill.style.display = v ? 'none' : ''; if (!v) M.popIn(spill); }
      if (k === 'openAll') { p = ctx.progress(); paint(p); } };
    const onRefresh = () => done({ refresh: true, tab: curTab });
    document.addEventListener('akademiya-settings', onSet); document.addEventListener('akademiya-refresh', onRefresh);
    unhook = () => { document.removeEventListener('akademiya-settings', onSet); document.removeEventListener('akademiya-refresh', onRefresh); if (cleanup) cleanup(); cleanup = null; };
    M.pressable(banner, () => { if (!busy) thingsICanSay(ctx); });                                    // the book on the banner: everything you can say (25)

    // ---- the "lesson done" beat (T2, about 1.2 s): circle → check, phrases fly up, the next circle opens, the flame lights ----
    async function finish() {
      const l = byId[after.id], was = before.state(l.id), n = nodeOf(l.id);
      await M.wait(350);
      if (was !== 'done') {
        if (glow) glow.cancel();
        if (l.checkpoint) { n.classList.remove('ready'); n.classList.add('done'); clearInterval(twinkle); document.querySelector('#park').appendChild(People.canvas.twinkle); M.popIn(n.querySelector('.tick')); M.punch(n, 1.1); M.pop(n, GOLD); }
        else { n.className = 'node done'; n.querySelector('.face').innerHTML = glyph(SPOTS[l.k][2], 'done'); M.popIn(n.querySelector('.face img')); M.punch(n, 1.1); M.pop(n, VIOLET); }
        await M.wait(150);
        if (p.phrases > before.phrases) { const c = sPh.querySelector('.n'), from = +c.textContent, add = p.phrases - before.phrases;
          await flyTo(n, sPh, 5, (i) => { M.punch(sPh, 1.14, 150); c.textContent = from + Math.round(add * (i + 1) / 5); }, phone); }
        else await M.wait(300);
        if (p.current) { await scrollTo(p.current); await M.wait(80); const nx = byId[p.current], m = nodeOf(nx.id); SND.play('unlock');
          if (nx.checkpoint) { m.classList.add('ready'); if (!M.reduce) M.anim(m, [{ scale: '.86' }, { scale: '1.12', offset: 0.55 }, { scale: '1' }], { duration: 340 }); M.shine(m); M.shine(banner); trophyTwinkle(m); }
          else { m.className = 'node cur'; m.querySelector('.face').innerHTML = glyph(SPOTS[nx.k][2], 'cur');
            if (!M.reduce) M.anim(m, [{ scale: '.8' }, { scale: '1.14', offset: 0.55 }, { scale: '1' }], { duration: 340 }); M.shine(m); await M.wait(340); glow = M.glow(m.querySelector('.halo')); } }
        if (p.level > before.level) { const lv = q('.stat.lv span'); lv.textContent = 'A' + p.level; M.punch(q('.stat.lv'), 1.16, 220); }
      }
      if (p.streak.today && !before.streak.today) lightStreak();
      else if (p.streak.count !== before.streak.count) sSt.querySelector('.n').textContent = p.streak.count;
      paint(p); busy = false;
    }
    if (after) finish().catch((e) => { console.error(e); paint(p); busy = false; });
    if (window.APP) window.APP.learn = { ready: () => !busy };
  });
}

