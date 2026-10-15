// Onboarding screens 6, 7, 7b, 8, 9, 10, then the flow starts.
// ---------- 6 · Mic explainer ----------
OB.add('mic', { bar: 4,
  html: () => `<div class="obmid" style="gap:18px"><span class="dph" style="width:190px;height:190px"><span class="micbadge" style="opacity:0"><i></i><img src="${ICON}studio-mic.png" alt=""></span></span>
    <div class="h24" data-in>Mikrofonni yoqamiz</div><div class="p15" data-in>Mashqlarda ovoz chiqarib gapirasiz. Javobingizni eshitishim uchun mikrofon kerak.</div></div>
    <div class="obbot" data-in>${OB.btn('MIKROFONNI YOQISH', 'primary', 'id="micOn"')}<button class="oblink" data-go="promise">HOZIR EMAS</button></div>`,
  async enter(el, me) { const badge = $('.micbadge', el); await OB.show(badge, me, 480, 'pop'); if (me !== OB.run) return;
    const glow = M.glow($('i', badge));                                                         // the mic badge pulses
    $('#micOn', el).addEventListener('pointerup', async () => { VOICE.open(); glow.cancel();        // the browser asks for the mic here, as the phone will
      M.pop(badge, CORAL); M.punch(badge, 1.2, 220); OB.dombi.enum('mood').value = 'happy'; await M.wait(420); if (me === OB.run) OB.go('listen'); }); } });
// ---------- 7 · Mic check: Dombi listens ----------
OB.add('listen', { bar: 5,
  html: () => `<div class="obmid" style="gap:16px"><div class="h26" data-in>Menga “Hello!” deng</div><span class="dph" style="width:190px;height:190px"></span>
    <div class="vbars" data-in>${'<i></i>'.repeat(7)}</div><div class="p15" style="font-size:14px;font-weight:800" data-in>Tinglayapman…</div></div>
    <div class="obbot" data-in>${OB.btn('DAVOM ETISH', 'disabled')}<button class="oblink" data-go="promise">HOZIR GAPIRA OLMAYMAN</button></div>`,
  enter(el, me) { const d = OB.dombi, draw = voiceBars($$('.vbars i', el), 40); d.boolean('listening').value = true; SND.mic(true); let turn = 0, made = false;
    const show = (level, bands) => { d.number('amp').value = level * 100; draw(level, bands); };          // the bars and Dombi follow the voice
    // With the mic it waits for a real "Hello!" and moves on by itself. The lab's button (or a tap on the bars) plays a made-up one.
    const hear = (real) => { const mine = ++turn; made = !real;
      hearVoice({ n: 5, ms: 1100, real, keep: true, alive: () => me === OB.run && mine === turn, onLevel: show }).then((got) => { if (me !== OB.run || mine !== turn) return;
        if (got === 'heard') OB.go('heard'); else if (real) hear(true); }); };
    OB.hello = () => { if (me === OB.run && !made) hear(false); };
    $('.vbars', el).onclick = OB.hello; show(0, []);
    VOICE.open().then((ok) => { if (ok && me === OB.run && !made) hear(true); }); } });
// ---------- 7b · Heard you ----------
OB.add('heard', { bar: 5,
  html: () => `<div class="obmid" style="gap:16px"><span class="dph" style="width:170px;height:170px"></span><div class="h26" style="opacity:0">Zo'r! Sizni eshitdim</div>
    <div class="hello" style="opacity:0"><img src="${ICON}glyph-check-green.png" alt="">“Hello!”</div><div class="p15" style="opacity:0">Mikrofon ishlayapti — endi gapirib o'rganamiz.</div></div>
    <div class="obbot" style="opacity:0">${OB.btn('DAVOM ETISH', 'primary', 'data-go="promise"')}</div>`,
  async enter(el, me) { const d = OB.dombi; d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate';
    OB.show($('.h26', el), me, 150, 'pop'); await OB.show($('.hello', el), me, 320, 'pop', true); if (me !== OB.run) return; M.pop($('.hello', el), GREEN); SND.play('right');
    OB.show($('.p15', el), me, 140); OB.show($('.obbot', el), me, 280); M.wait(700).then(() => { if (me === OB.run) M.shine($('.obbot .btn', el)); }); } });
// ---------- 8 · Dombi's promise ----------
OB.add('promise', { bar: 6,
  html: () => `<div class="obbody">${OB.guide('Ovozingiz faqat sizniki. Va\'da beraman:')}${[['lock', 'Faqat siz eshitasiz', 'Hech kim — hatto biz ham — tinglamaydi'], ['trash', 'Istalgan vaqtda o\'chirasiz', 'Sozlamalar → Ovoz yozuvlari'],
      ['sparkles', 'Taraqqiyotingizni eshitasiz', '1-kun va 30-kun ovozingizni solishtiring']].map(([ic, t, b]) => `<div class="promise" style="opacity:0"><span class="tile"><img src="${ICON}glyph-${ic}-violet.png" alt=""></span><span><b>${t}</b><small>${b}</small></span></div>`).join('')}</div>
    <div class="obbot" data-in>${OB.btn('OVOZIMNI SAQLASH', 'primary', 'data-go="reminder"')}${OB.btn('SAQLAMASDAN DAVOM ETISH', 'secondary', 'data-go="reminder"')}</div>`,
  async enter(el, me) { for (const [i, r] of $$('.promise', el).entries()) { await M.wait(i ? 150 : 650); if (me !== OB.run) return; r.style.opacity = 1; M.fadeUp(r, 10, 220); M.popIn($('.tile', r), { duration: 260 }); SND.appear(); } } });   // the three promises tick in
// ---------- 9 · Reminder time ----------
OB.add('reminder', { bar: 7,
  html: () => `<div class="obbody">${OB.guide('Har kuni soat nechada eslatay? Kuniga bir martagina eslataman.')}<div class="wheelwrap" data-in><div class="wheel"><div class="sel"></div><div class="list"></div></div></div></div>
    <div class="obbot" data-in>${OB.btn('ESLATMANI YOQISH', 'primary', 'id="remOn"')}<button class="oblink" data-go="name">HOZIR EMAS</button></div>`,
  enter(el, me) { const wheel = $('.wheel', el), w = timeWheel(wheel, DAY, DAY.indexOf('19:00'), 0.75);   // the phone is drawn at 75 %
    $('#remOn', el).addEventListener('pointerup', async () => { M.punch($('.sel', wheel), 1.05, 200); M.punch(w.opts[w.idx], 1.15, 220); M.pop($('.sel', wheel), VIOLET); OB.dombi.enum('mood').value = 'happy'; SND.play('reminder');   // this is how the reminder will sound
      await M.wait(480); if (me === OB.run) OB.go('name'); }); } });
// ---------- 10 · What should Dombi call you? ----------
OB.add('name', { bar: null,
  html: () => `<div class="obbody">${OB.guide('Sizni nima deb chaqiray?')}<input class="namefield" data-in placeholder="Ismingiz" autocomplete="off" spellcheck="false"><div class="lbl12" data-in>KEYIN HISOBNI SAQLANG:</div>
    ${[['<span class="ico">G</span>', 'GOOGLE ORQALI'], ['<span class="ico">A</span>', 'APPLE ORQALI'], [`<img src="${ICON}glyph-phone-dark.png" alt="">`, 'TELEFON RAQAM']].map(([ic, l]) => `<button class="p3d signin" data-in><span class="face">${ic}${l}</span></button>`).join('')}</div>
    <div class="obbot" data-in><button class="oblink">KEYINROQ</button></div>`,
  async enter(el, me) { const d = OB.dombi, f = $('.namefield', el); let said = false;
    const sayName = async () => { if (said || !f.value.trim()) return; said = true; await (DOMBI.talk(d, f.value.trim(), () => me === OB.run) || OB.talk(520, me)); if (me === OB.run) d.enum('mood').value = 'happy'; };   // Dombi says your name
    f.onblur = sayName; f.onkeydown = (e) => { if (e.key === 'Enter') f.blur(); };
    $$('.signin', el).forEach((b) => M.pressable(b, () => { M.pop(b, GREEN); d.enum('mood').value = 'laugh'; d.enum('gesture').value = 'celebrate'; M.wait(1600).then(() => { if (me === OB.run) d.enum('gesture').value = 'none'; }); }));
    await M.wait(700); if (me !== OB.run) return; f.focus({ preventScroll: true });
    await M.wait(600); if (me !== OB.run || f.value) return;
    for (const ch of 'Aziz') { f.value += ch; await M.wait(110); if (me !== OB.run) return; }                // types itself if you do not
    await M.wait(350); if (me === OB.run) sayName(); } });

$('#sayHello').onclick = () => { if (OB.cur !== 'listen') OB.go('listen'); else if (OB.hello) OB.hello(); };
OB.start();
