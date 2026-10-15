// Speaking exercises from start to finish: E1 Meet It, E2 Say What You See, E9 Echo Line.
(async () => {
  const body = $('#body'), sOk = $('#sOk'), sNo = $('#sNo');
  const mic = await W.mic();
  const wc = Object.assign(document.createElement('canvas'), { width: 224, height: 224 }); document.body.appendChild(wc);
  const waiter = await M.rive(wc, 'Waiter A', 'Waiter'); wc.remove();
  const setDark = () => { waiter.boolean('dark').value = document.body.classList.contains('dark'); }; setDark(); document.addEventListener('lab-dark', setDark);
  const bar = W.progress($('#fill'), $('#combo'), 35);
  $$('#dock .btn').forEach((b) => M.pressable(b));
  const COFFEE = ['Can', 'I', 'have', 'a', 'coffee?'];
  const EX = {
    e1: { kicker: 'YANGI IBORA', task: 'Tinglang va qaytaring', words: COFFEE, bad: 4, tip: '“Can I have…” — muloyim so\'rash. “Give me” qo\'pol eshitiladi.' },
    e2: { kicker: 'AYTING', task: 'Siz qahva xohlaysiz. Ofitsiantga ayting.', words: COFFEE, bad: 4, tip: '“Can I have…” — muloyim so\'rash. “Give me” qo\'pol eshitiladi.' },
    e9: { kicker: 'QAYTARING', task: 'Ofitsiantdan keyin qaytaring', words: ['Anything', 'else?'], bad: 1, tip: '“Anything else?” — “Yana biror narsa kerakmi?”',
          say: [[5, 110], [3, 70], [4, 90], [10, 90], [4, 80], [3, 90], [0, 60], [5, 110], [5, 70], [3, 130]], split: 6 },   // mouth shapes; the second word starts at shape 6
  };
  const ORDER = ['e1', 'e2', 'e9']; let name = 'e1', run = 0, done = false, textOn = false;
  const resultHTML = '<div class="result" style="opacity:0;display:none"><div class="lbl">SIZ AYTDINGIZ:</div><div class="words"></div><div class="hint" style="display:none">To\'q sariq so\'zni bosing — tinglang va qaytaring.</div></div>';
  const head = (e) => `<div class="hd"><div class="kicker">${e.kicker}</div><div class="task">${e.task}</div></div>`;
  const pict = (h) => `<div class="pict" style="height:${h}px"><img src="${ICON}coffee-kafeda.png" alt=""></div>`;

  // words appear one by one; with `ms` they also light up in time with the sound
  async function showWords(box, words, me, ms = 0) {
    box.innerHTML = words.map((w) => `<span>${w}</span>`).join(''); const per = ms ? ms / words.length : 90;
    for (const s of [...box.children]) { if (me !== run) return; s.style.opacity = 1; M.fadeUp(s, 6, 160); if (ms) s.classList.add('now'); await M.wait(per); s.classList.remove('now'); }
  }
  // the waiter says his line: mouth shapes in time, the play button shows bars, each word lights as he says it
  async function waiterSays(me) {
    const e = EX.e9, line = $$('.bubble .line span', body), btn = $('.bubble .audio', body), total = e.say.reduce((a, s) => a + s[1], 0);
    W.play(btn, total); waiter.boolean('talking').value = true;
    for (const [i, [v, ms]] of e.say.entries()) { if (me !== run) break; waiter.number('viseme').value = v; line.forEach((s, k) => s.classList.toggle('now', k === (i < e.split ? 0 : 1))); await M.wait(ms); }
    waiter.boolean('talking').value = false; line.forEach((s) => s.classList.remove('now'));
  }

  async function mount(n, first) {
    name = n; const e = EX[n], me = ++run; done = false; textOn = false; W.ready($('#dock .check'), false);
    $$('#side [data-e]').forEach((b) => b.classList.toggle('on', b.dataset.e === n));
    const el = document.createElement('div'); el.className = 'ex';
    el.innerHTML = head(e) + (n === 'e1' ? `${pict(130)}<div class="meaning">“Menga qahva bera olasizmi?”</div><div class="phraseline"></div>
        <div class="audiorow">${W.audioHTML('big', 'speaker-white')}${W.audioHTML('slow', 'slow-violet')}</div>${resultHTML}<div class="michold"></div><button class="textlink">Matnni ko'rsatish</button>`
      : n === 'e2' ? `${pict(150)}<div class="hintchip" style="opacity:0"><img src="${ICON}bulb-tip.png" alt="">Can I …</div>${resultHTML}<div class="michold"></div>`
      : `<div class="charline"><div class="avatar" style="opacity:0"></div><div class="bubble" style="opacity:0">${W.audioHTML('sm', 'speaker-violet')}<div class="line">${e.words.map((w) => `<span>${w}</span>`).join('')}</div></div></div>${resultHTML}<div class="michold"></div>`);
    body.appendChild(el); $('.michold', el).appendChild(mic.el); mic.idle(false, 'Bosib gapiring');
    $$('.audio', el).forEach((b) => M.pressable(b));
    if (!first && !M.reduce) { M.anim($('.hd', el), [{ opacity: 0, translate: '70px 0' }, { opacity: 1, translate: '0 0' }], { duration: T.exSlide, fill: 'both' });
      [...el.children].slice(1).forEach((c, i) => M.anim(c, [{ opacity: 0, translate: '70px 0' }, { opacity: getComputedStyle(c).opacity, translate: '0 0' }], { duration: T.exSlide, delay: (90 + i * T.stagger) * M.slow, fill: 'backwards' })); }
    await M.wait(first ? 200 : 420); if (me !== run) return;
    if (n === 'e1') {
      const big = $('.audio.big', el), slow = $('.audio.slow', el), link = $('.textlink', el), line = $('.phraseline', el);
      M.popIn($('.pict', el), { duration: 240 });
      const say = (btn, ms) => { if (textOn) showWords(line, e.words, run, ms); return W.play(btn, ms); };
      big.addEventListener('pointerup', () => say(big, 1600)); slow.addEventListener('pointerup', () => say(slow, 2600));
      link.onclick = () => { textOn = !textOn; link.textContent = textOn ? 'Matnni yashirish' : 'Matnni ko\'rsatish';
        if (textOn) say(big, 1600); else M.fadeOut(line, 0, 140).then(() => { line.innerHTML = ''; line.getAnimations().forEach((a) => a.cancel()); }); };
      await M.wait(260); if (me !== run) return; await W.play(big, 1600); if (me !== run) return;          // the phrase is heard first, with no text
    } else if (n === 'e2') {
      M.popIn($('.pict', el), { duration: 240 });
      await M.wait(700); if (me !== run) return; const h = $('.hintchip', el); h.style.opacity = 1; M.popIn(h);
    } else {
      const av = $('.avatar', el), bub = $('.bubble', el); av.appendChild(wc); wc.style.cssText = 'width:56px;height:56px;display:block';
      av.style.opacity = 1; M.popIn(av); await M.wait(120); if (me !== run) return; bub.style.opacity = 1; M.popIn(bub);
      $('.audio', bub).addEventListener('pointerup', () => { if (!waiter.boolean('talking').value) waiterSays(run); });
      await M.wait(320); if (me !== run) return; await waiterSays(me); if (me !== run) return;
    }
    if (!done) { mic.idle(true); SND.play('turn'); }                                                       // your turn
  }

  // ---- you speak ----
  async function speak(kind) {
    if (done || mic.busy) return; const me = run, e = EX[name], el = $('.ex:last-child', body);
    const got = await mic.speak(kind !== 'silent'); if (me !== run || got !== 'heard') return;
    done = true; const card = $('.result', el), ok = kind === 'right';
    // the controls make room for what you said
    const hide = $$('.audiorow, .textlink, .hintchip', el); await Promise.all(hide.map((h) => M.fadeOut(h, 0, 120))); hide.forEach((h) => { h.style.display = 'none'; });
    if (name === 'e1') showWords($('.phraseline', el), e.words, me);                                       // the English text appears for the first time
    card.style.display = 'flex'; await W.result(card, e.words, ok ? -1 : e.bad); if (me !== run) return;
    if (name === 'e9') waiter.trigger(ok ? 'correct' : 'wrong').trigger();
    if (ok) { bar.right(); M.pop(card, GREEN); SND.play('right'); await M.wait(150); W.sheetShow(sOk); }
    else { bar.wrong(); SND.play('not-right'); const hint = $('.hint', card); hint.style.display = 'block'; M.fadeUp(hint, 6, 180);
      const chip = $('.chipw.retry', card); chip.onclick = () => { M.punch(chip, 1.12, 180); if (name === 'e9') waiterSays(run); };
      $('.ans', sNo).textContent = e.words.join(' '); $('.tiptext', sNo).textContent = e.tip; await M.wait(350); W.sheetShow(sNo); }
  }
  async function next(to) {
    W.sheetHide(sOk); W.sheetHide(sNo); const old = $('.ex:last-child', body); run++; waiter.boolean('talking').value = false;
    if (old) { await M.anim(old, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-90px 0' }], { duration: 180, easing: EASE.in, fill: 'forwards' }); old.remove(); }
    mount(to || ORDER[(ORDER.indexOf(name) + 1) % ORDER.length], false);
  }
  M.pressable(mic.btn, () => speak('right'));
  $$('#dock .next').forEach((b) => b.addEventListener('pointerup', () => next()));
  $('#dock .check').addEventListener('pointerup', () => M.shake($('#dock .check'), 4, T.shakeSmall));
  $('#cant').onclick = () => { M.punch($('#cant'), 1.05, 160); next(); };
  $$('#side [data-e]').forEach((b) => b.onclick = () => next(b.dataset.e));
  $$('#side [data-s]').forEach((b) => b.onclick = () => speak(b.dataset.s));
  await M.initPop(); await mount('e1', true); window.labReady = true;
})();
