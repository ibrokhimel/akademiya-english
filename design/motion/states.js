// Small states: confidence grew (30b), mic blocked (31b), something went wrong (31e), not ready yet (31d).
(async () => {
  const screen = $('#screen'), park = $('#park');
  const cD = Object.assign(document.createElement('canvas'), { width: 460, height: 460 }); park.appendChild(cD);
  const dombi = await M.rive(cD, 'Dombi', 'Dombi');
  const setDark = () => { dombi.boolean('dark').value = document.body.classList.contains('dark'); }; setDark(); document.addEventListener('lab-dark', setDark);
  let run = 0;
  const btn = (label, cls = 'primary', extra = '') => `<button class="p3d btn ${cls} go"><span class="face"><span class="lbl">${label}</span>${extra}</span></button>`;
  const DOTS = '<span class="bdots"><i></i><i></i><i></i></span>';
  function mount(html, cls = '') { run++; park.appendChild(cD); dombi.enum('gesture').value = 'none'; dombi.enum('mood').value = 'smirk';
    screen.innerHTML = `<div class="scr ${cls}">${html}</div>`; $$('.btn', screen).forEach((b) => M.pressable(b)); return run; }
  const show = (el, me, ms, how = 'up') => M.wait(ms).then(() => { if (me !== run) return; el.style.opacity = 1; return how === 'pop' ? M.popIn(el) : M.fadeUp(el, 10, 220); });
  const enterDombi = async (box, size, me) => { dombiInto(cD, box, size); dombi.boolean('hidden').value = true; await M.wait(60); if (me === run) dombi.boolean('hidden').value = false; };

  const SCREENS = {
    // ---------- 30b · your confidence grew (T1) ----------
    async grew() {
      const me = mount(`<div class="status">9:41</div><div class="mid" style="gap:16px"><div class="dbox" style="width:170px;height:170px"></div><div class="h22" style="opacity:0">Ishonchingiz oshdi!</div>
        <div class="p14" style="opacity:0">2 hafta oldin: “Biroz qo'rqaman”. Bugun: “Ancha ishonaman”.</div>
        <div class="grow"><div class="gtile" style="opacity:0"><span>2</span></div><span class="garrow">→</span><div class="gtile" id="gNew" style="opacity:0"><span>2</span></div></div></div>
        <div class="bot" style="opacity:0">${btn('ZO\'R!')}</div>`);
      await enterDombi($('.dbox', screen), 170, me); dombi.enum('mood').value = 'happy';
      show($('.h22', screen), me, 250); show($('.p14', screen), me, 370);
      const [a, b] = $$('.gtile', screen), arrow = $('.garrow', screen);
      await show(a, me, 520, 'pop'); if (me !== run) return;
      await M.anim(arrow, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 260, easing: EASE.std, fill: 'forwards' }); if (me !== run) return;   // the arrow draws itself
      b.style.opacity = 1; await M.popIn(b); if (me !== run) return;
      for (const n of [3, 4]) {                                                                    // the number rolls up to the new one
        const old = $('span', b), neu = document.createElement('span'); neu.textContent = n; b.appendChild(neu);
        M.anim(old, [{ translate: '0 0', opacity: 1 }, { translate: '0 -34px', opacity: 0 }], { duration: 150, easing: EASE.in, fill: 'forwards' }).then(() => old.remove());
        await M.anim(neu, [{ translate: '0 34px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 190, fill: 'forwards' }); if (me !== run) return;
      }
      b.classList.add('up'); M.punch(b, 1.18, 240); M.pop(b, GREEN); SND.play('right'); dombi.enum('mood').value = 'laugh'; dombi.enum('gesture').value = 'celebrate';
      M.wait(1100).then(() => { if (me === run) dombi.enum('mood').value = 'happy'; });               // the laugh settles into the locked pose
      show($('.bot', screen), me, 250); M.wait(800).then(() => { if (me === run) M.shine($('.go', screen)); });
    },
    // ---------- 31b · mic blocked ----------
    async blocked() {
      const me = mount(`<div class="lessonbg"></div><div class="dim2"></div><div class="mbsheet"><div class="handle"></div>
        <div class="mbd"><span class="badge2"><img src="${ICON}glyph-mic-off-muted.png" alt=""></span></div>
        <div class="h22">Mikrofon yopiq</div><div class="p14">Gapirish mashqlari uchun mikrofonga ruxsat kerak:</div>
        <div class="msteps">${['Sozlamalar', 'Akademiya', 'Mikrofon — yoqish'].map((t, i) => `<div><i>${i + 1}</i>${t}</div>`).join('')}</div>
        ${btn('SOZLAMALARNI OCHISH')}<button class="mblink">GAPIRMASDAN DAVOM ETISH</button></div>`);
      dombiInto(cD, $('.mbd', screen), 110);
      await M.wait(300); if (me !== run) return;
      SND.play('whoosh'); M.anim($('.dim2', screen), [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
      M.anim($('.mbsheet', screen), M.reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] :
        [{ transform: 'translateY(105%)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 300, fill: 'forwards' });
      show($('.badge2', screen), me, 380, 'pop');
      for (const [i, r] of $$('.msteps div', screen).entries()) { await M.wait(i ? 110 : 520); if (me !== run) return; SND.play('step', { step: SND.deg(i) }); r.style.opacity = 1; M.fadeUp(r, 6, 180); M.popIn($('i', r)); }   // the steps tick in
      await M.wait(300); if (me === run) M.shine($('.go', screen));
    },
    // ---------- 31e · something went wrong ----------
    async error() {
      const me = mount(`<div class="status">9:41</div><div class="mid" style="gap:14px;padding:0 28px"><div class="dbox" style="width:170px;height:170px"></div>
        <div class="h22" style="opacity:0">Voy, nimadir xato ketdi</div><div class="p14" style="opacity:0">Bu sizning aybingiz emas. Bir oz kutib, qayta urinib ko'ring.</div></div>
        <div class="bot" style="opacity:0">${btn('QAYTA URINISH', 'primary', DOTS)}${btn('XATO HAQIDA XABAR BERISH', 'secondary')}</div>`);
      await enterDombi($('.dbox', screen), 170, me); M.wait(350).then(() => { if (me === run) dombi.enum('gesture').value = 'thinking'; });   // hand to chin, still calm
      show($('.h22', screen), me, 250); show($('.p14', screen), me, 370); show($('.bot', screen), me, 500);
      const b = $('.go', screen), lbl = $('.lbl', b), dots = $('.bdots', b); let trying = false;
      b.addEventListener('pointerup', async () => { if (trying) return; trying = true; lbl.style.opacity = 0; dots.style.opacity = 1; dombi.enum('mood').value = 'think';
        const an = [...dots.children].map((d, i) => { const a = d.animate([{ translate: '0 2px' }, { translate: '0 -5px' }], { duration: 300, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: i * 110 }); a.playbackRate = 1 / M.slow; return a; });
        await M.wait(1200); an.forEach((a) => a.cancel()); dots.style.opacity = 0; lbl.style.opacity = 1; trying = false; if (me !== run) return;
        dombi.enum('gesture').value = 'none'; dombi.enum('mood').value = 'happy'; M.pop(b, GREEN); });                                    // it worked this time
    },
    // ---------- 31d · not ready yet ----------
    async fallback() {
      const me = mount(`<div class="status">9:41</div><button class="xclose"><img src="${ICON}glyph-close-muted.png" alt=""></button><div class="mid" style="gap:14px;padding:34px 32px 0"><div class="art168" style="opacity:0"><img src="${ICON}sprout.png" alt=""></div>
        <div class="h26b" style="opacity:0">Bu bo'lim hali yaratilmoqda</div><div class="p16" style="opacity:0">Tez orada qo'shamiz! Hozircha darslarni davom ettiring — har bir dars sizni oldinga olib boradi.</div></div>
        <div class="bot" style="opacity:0">${btn('DARSLARGA QAYTISH')}${btn('BU HAQDA FIKR BILDIRISH', 'secondary')}</div>`);
      const art = $('.art168', screen), sprout = $('img', art);
      await show(art, me, 150, 'pop'); if (me !== run) return;
      if (!M.reduce) { const a = sprout.animate([{ rotate: '-3deg', scale: '1' }, { rotate: '3deg', scale: '1.07' }], { duration: 1900, direction: 'alternate', iterations: Infinity, easing: EASE.sine }); a.playbackRate = 1 / M.slow; }   // it sways and grows a little
      show($('.h26b', screen), me, 100); show($('.p16', screen), me, 220); show($('.bot', screen), me, 360);
    },
  };
  function pick(name) { $$('#side [data-s]').forEach((b) => b.classList.toggle('on', b.dataset.s === name)); SCREENS[name](); }
  $$('#side [data-s]').forEach((b) => b.onclick = () => pick(b.dataset.s));
  await M.initPop(); pick('grew'); window.labReady = true;
})();
