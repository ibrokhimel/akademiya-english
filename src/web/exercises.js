// The six exercises of the MVP, as the lab drew them (design/motion: exercises.js, demos.js) and with the lesson files' content.
// Each one fills the exercise area and resolves when the learner has answered:
//   { right, answer, tip, voice }   answer: the correct sentence · tip: one line in Uzbek for the feedback sheet · voice: who says the answer
//   { off: 'nomic' | 'nosr' }       speaking cannot be checked here: the player turns speaking off and shows the item again, with words to build
// ctx: { item, n, lesson, el, mic, ready(on), onCheck(fn), alive(), spoke(ms), speaking, keepVoice?(phraseId, blob) }
import { C, picHTML, NAME, AFTER } from './content.js';
import { say, stop } from './audio.js';
import { People } from './people.js';
import { answerOf, voiceOf, tilesOf, sameTiles, judgeAny } from '../core/text.js';
import { spareTiles, mix } from '../core/session.js';
import { listen, canHear, hearReady } from './hear.js';
import { startClip } from './voicerec.js';

const head = (kicker, task) => `<div class="hd"><div class="kicker">${kicker}</div><div class="task">${task}</div></div>`;
const RESULT = `<div class="result" style="opacity:0;display:none"><div class="lbl">SIZ AYTDINGIZ:</div><div class="recognized" style="display:none"></div><div class="lbl targetlbl" style="display:none">NAMUNA:</div><div class="words"></div><div class="hint" style="display:none">To'q sariq so'zni bosing — tinglang va qaytaring.</div></div>`;
const spans = (text) => text.split(' ').map((w) => `<span>${w}</span>`).join('');
const pict = (pic, h) => `<div class="pict" style="height:${h}px">${picHTML(pic)}</div>`;
// in a checkpoint's story chain the small heading says where the learner is: "3/5 · NARXINI SO'RANG"
const stepOf = (ctx, plain) => (ctx.item.step != null ? `${ctx.item.step + 1}/${ctx.lesson.steps.length} · ${ctx.lesson.steps[ctx.item.step].toUpperCase()}` : plain);
const tipOf = (item, p) => (item.trap ? C.traps[item.trap].why : p ? `“${p.en}” — “${p.uz}”` : '');
const wantsOf = (item) => [answerOf(item, C.P), ...(item.also || []).map((id) => C.P[id].en), ...(item.accept || [])];
const looseOf = (item) => [...new Set([item.p, ...(item.also || [])].filter(Boolean).flatMap((id) => C.P[id].loose || []))];

// ---------- speaking: one turn at the mic ----------
// What the learner said, as text. 'silent': nothing was heard, the mic waits again · 'again': the browser asked for the mic first, press once more ·
// 'unclear': a voice was heard but the recogniser made no words of it
async function hearOnce(ctx, wants) {
  const { mic } = ctx, test = window.APP_TEST;
  if (test) { const t = test.say.length ? test.say.shift() : test.else, clip = ctx.keepVoice && await startClip(); const got = await mic.speak(t !== '', 700);       // the checks: a made-up voice and the words given
    return got === 'heard' ? { alts: [t === true ? wants[0] : t], ms: 700, clip: clip && await clip.stop() } : got; }
  if (!canHear() && await hearReady() === 'none') return { off: 'nosr' };
  const t0 = performance.now(); if (!(await VOICE.open())) return { off: 'nomic' };
  if (performance.now() - t0 > 700) { mic.idle(true); return 'again'; }
  const live = liveWords(ctx), rec = await listen('en-US', live.show), t1 = performance.now(), clip = ctx.keepVoice && await startClip(), got = await mic.speak(true);        // the mic's own level meter decides when the speaker has stopped
  rec.stop(); const blob = clip && await clip.stop(); if (got === null) { live.end(false); return null; }
  const alts = await Promise.race([rec.done, new Promise((r) => setTimeout(() => r([]), 8000))]); live.end(!!(alts && alts.length));
  if (alts === null) return { off: 'nosr' };
  if (!alts.length) return got === 'heard' ? 'unclear' : 'silent';
  return { alts, ms: performance.now() - t1, clip: blob };
}
// While the learner speaks, the words so far appear in the result card ("ESHITYAPMAN…"), grey; the controls make room for them.
// end(kept): kept = the final words follow in the same card; otherwise the card goes and the controls come back.
function liveWords(ctx) {
  const { el } = ctx, card = el.querySelector('.result'); let on = false, hidden = [];
  return {
    show(text) { if (!ctx.alive() || !card) return;
      if (!on) { on = true; hidden = [...el.querySelectorAll('.audiorow, .textlink:not(.skip), .hintchip')].filter((h) => h.style.display !== 'none'); hidden.forEach((h) => { h.style.display = 'none'; });
        card.querySelector('.recognized').style.display = 'none'; card.querySelector('.targetlbl').style.display = 'none';
        card.querySelector('.lbl').textContent = 'ESHITYAPMAN…'; card.querySelector('.hint').style.display = 'none'; card.style.display = 'flex'; card.style.opacity = 1; }
      const box = card.querySelector('.words'); box.replaceChildren(...text.split(/\s+/).filter(Boolean).map((w) => Object.assign(document.createElement('span'), { className: 'chipw live', textContent: w }))); },
    end(kept) { if (!on || !card) return; card.querySelector('.lbl').textContent = 'ESHITILGAN MATN:'; if (!kept) { card.style.display = 'none'; hidden.forEach((h) => { h.style.display = ''; }); } },
  };
}
// The whole turn: wait for a press, listen, show what was said word by word. replay(): says the phrase again (a tap on an orange word).
async function speakTurn(ctx, item, replay) {
  const { mic, el } = ctx, wants = wantsOf(item), card = el.querySelector('.result'); let first = true, unclear = 0, cap = 'Bosib gapiring';
  for (;;) {
    mic.idle(true, cap); if (first) SND.play('turn'); first = false;
    await new Promise((r) => { mic.onTap = r; }); mic.onTap = null; if (!ctx.alive()) return null;
    card.querySelector('.hint').style.display = 'none';
    stop(); const got = await hearOnce(ctx, wants); if (!ctx.alive() || got === null) return null;
    if (got === 'silent') { cap = 'Eshitmadim. Yana bir bor ayting'; continue; }
    if (got === 'again') { cap = 'Bosib gapiring'; continue; }
    if (got === 'unclear') { if (++unclear >= 3) return { off: 'nosr' }; cap = 'Tushunmadim. Yana bir bor ayting'; continue; }      // not a mistake: it is asked again; the third time the lesson goes on with words to build
    if (got.off) return got;
    ctx.spoke(got.ms); const r = judgeAny(wants, got.alts, looseOf(item));
    const hide = [...el.querySelectorAll('.audiorow, .textlink:not(.skip), .hintchip')]; await Promise.all(hide.map((h) => M.fadeOut(h, 0, 120))); hide.forEach((h) => { h.style.display = 'none'; });   // the controls make room for what was said
    card.querySelector('.lbl').textContent = 'ESHITILGAN MATN:';
    const recognized = card.querySelector('.recognized'); recognized.textContent = got.alts[0] || ''; recognized.style.display = 'block'; card.querySelector('.targetlbl').style.display = 'block';
    card.style.display = 'flex'; const box = card.querySelector('.words'); box.innerHTML = r.words.map((w) => `<span class="chipw">${w.text}</span>`).join(''); card.style.opacity = 1; M.fadeUp(card, 10, 200);
    await M.wait(260); if (!ctx.alive()) return null;
    for (const c of [...box.children]) { if (r.right) { c.classList.add('good'); M.punch(c, 1.1, 160); SND.appear(); } else { c.classList.add('retry'); c.onclick = () => { M.punch(c, 1.12, 180); replay(); }; } await M.wait(90); }
    if (!r.right) { const hint = card.querySelector('.hint'); hint.textContent = 'Ibora tasdiqlanmadi. Namunani bosib tinglang va qayta ayting.'; hint.style.display = 'block'; M.fadeUp(hint, 6, 180); } else M.pop(card, GREEN);
    if (r.right && got.clip && item.p && ctx.keepVoice) ctx.keepVoice(item.p, got.clip);                // "Mening ovozim": a good try is kept, when the learner chose to save their voice
    if (r.right) return r;
    ctx.speechRetry?.();
    cap = 'Yana ayting yoki so‘zlarni tanlang';
  }
}
// words appear one by one; with `ms` they light up at the pace of the sound
async function showWords(box, text, ctx, ms = 0) {
  box.innerHTML = spans(text); const list = [...box.children], per = ms ? ms / list.length : 90;
  for (const s of list) { if (!ctx.alive()) return; s.style.opacity = 1; M.fadeUp(s, 6, 160); if (ms) s.classList.add('now'); await M.wait(per); s.classList.remove('now'); }
}

// ---------- E1 Meet It: heard first with no text, then repeated ----------
async function meet(ctx) {
  const { item, el, mic } = ctx, p = C.P[item.p]; let textOn = false;
  el.innerHTML = head('YANGI IBORA', 'Tinglang va qaytaring') + `${pict(p.pic, 130)}<div class="meaning">“${p.uz}”</div><div class="phraseline"></div>
    <div class="audiorow">${W.audioHTML('big', 'speaker-white')}${W.audioHTML('slow', 'slow-violet')}</div>${RESULT}<div class="michold"></div><button class="textlink">Matnni ko'rsatish</button>`;
  el.querySelector('.michold').appendChild(mic.el); mic.idle(false, 'Bosib gapiring');
  const big = el.querySelector('.audio.big'), slow = el.querySelector('.audio.slow'), link = el.querySelector('.textlink'), line = el.querySelector('.phraseline');
  const play = (btn, isSlow) => say(p.voice, p.en, { slow: isSlow, onStart: (ms) => { W.play(btn, ms); if (textOn) showWords(line, p.en, ctx, ms); } });
  [big, slow].forEach((b) => M.pressable(b)); big.addEventListener('pointerup', () => play(big, false)); slow.addEventListener('pointerup', () => play(slow, true));
  link.onclick = () => { textOn = !textOn; link.textContent = textOn ? 'Matnni yashirish' : 'Matnni ko\'rsatish';
    if (textOn) play(big, false); else M.fadeOut(line, 0, 140).then(() => { line.innerHTML = ''; line.getAnimations().forEach((a) => a.cancel()); }); };
  M.popIn(el.querySelector('.pict'), { duration: 240 });
  await M.wait(500); if (!ctx.alive()) return null; await play(big, false); if (!ctx.alive()) return null;            // the phrase is heard first, with no text
  const r = await speakTurn(ctx, item, () => play(big, false)); if (!r || r.off) return r;
  if (!textOn) showWords(line, p.en, ctx);                                                                              // the English text appears for the first time
  return { right: r.right, answer: p.en, tip: tipOf(item, p), voice: p.voice };
}

// ---------- E2 Say What You See: a situation in Uzbek, said from memory ----------
async function sayIt(ctx) {
  const { item, el, mic } = ctx, p = C.P[item.p];
  el.innerHTML = head(stepOf(ctx, 'AYTING'), item.task) + `${pict(item.pic || p.pic, 150)}<button class="textlink hintchip"><img src="${ICON}bulb-tip.png" alt="">Yordam</button>${RESULT}<div class="michold"></div>`;
  el.querySelector('.michold').appendChild(mic.el); mic.idle(false, 'Bosib gapiring'); M.popIn(el.querySelector('.pict'), { duration: 240 });
  el.querySelector('.hintchip').onclick = () => { const hint = el.querySelector('.hintchip'); hint.textContent = p.en.split(' ')[0].replace(/[.,!?]/g, '') + (p.en.trim().includes(' ') ? ' …' : ''); };
  await M.wait(450); if (!ctx.alive()) return null;
  const r = await speakTurn(ctx, item, () => say(p.voice, p.en)); if (!r || r.off) return r;
  return { right: r.right, answer: r.right ? r.want : p.en, tip: tipOf(item, p), voice: p.voice };
}

// ---------- E9 Echo Line: a person says the line, the learner repeats it ----------
async function echo(ctx) {
  const { item, el, mic } = ctx, p = item.p && C.P[item.p], text = answerOf(item, C.P), voice = voiceOf(item, C.P), lead = item.lead;
  el.innerHTML = head('QAYTARING', AFTER[voice]) + `<div class="charline"><div class="avatar" style="opacity:0"></div><div class="bubble" style="opacity:0">${W.audioHTML('sm', 'speaker-violet')}<div class="line"></div></div></div>${RESULT}<div class="michold"></div>`;
  el.querySelector('.michold').appendChild(mic.el); mic.idle(false, 'Bosib gapiring');
  const av = el.querySelector('.avatar'), bub = el.querySelector('.bubble'), line = el.querySelector('.line'), btn = el.querySelector('.audio');
  const show = async (who, words) => { People.put(who, av, 56); line.innerHTML = spans(words); av.style.opacity = 1; M.popIn(av); await M.wait(120); bub.style.opacity = 1; M.popIn(bub); };
  const speak = (who, words) => say(who, words, { mouth: who, words: [...line.children], onStart: (ms) => W.play(btn, ms) });
  M.pressable(btn); btn.addEventListener('pointerup', () => speak(voice, text));
  await M.wait(350); if (!ctx.alive()) return null;
  if (lead) { await show(lead[0], lead[1]); await M.wait(250); await speak(lead[0], lead[1]); if (!ctx.alive()) return null; await M.wait(250);      // the other person speaks first: the line to repeat is the reply
    await M.fadeOut(bub, 0, 120); bub.style.opacity = 0; if (!ctx.alive()) return null; }
  await show(voice, text); await M.wait(300); if (!ctx.alive()) return null; await speak(voice, text); if (!ctx.alive()) return null;
  const r = await speakTurn(ctx, item, () => speak(voice, text)); if (!r || r.off) return r;
  People.vm[voice].trigger(r.right ? 'correct' : 'wrong').trigger();
  return { right: r.right, answer: text, tip: tipOf(item, p) || (item.uz ? `“${text}” — “${item.uz}”` : ''), voice };
}

// ---------- E4 Tile Builder (and Meet It / Say What You See while speaking is off) ----------
async function tiles(ctx) {
  const { item, el } = ctx, p = item.p && C.P[item.p], text = answerOf(item, C.P), voice = voiceOf(item, C.P), wants = wantsOf(item);
  const others = ctx.lesson.items.map((it) => answerOf(it, C.P)).filter((t) => t && t !== text);
  const words = mix([...tilesOf(text), ...(item.ex === 'tiles' ? item.extra : spareTiles(tilesOf(text), others))], ctx.n + text.length);
  const top = item.ex === 'meet' ? head('YANGI IBORA', 'Tinglang va gap tuzing') + `${pict(p.pic, 96)}<div class="meaning">“${p.uz}”</div><div class="audiorow">${W.audioHTML('big', 'speaker-white')}${W.audioHTML('slow', 'slow-violet')}</div>`
    : item.ex === 'say' ? head(stepOf(ctx, 'GAP TUZING'), item.task) : head('GAP TUZING', item.uz || p.uz);
  el.innerHTML = top + `<div class="sentence bline"></div><div class="bbank"></div>`;
  const line = el.querySelector('.bline'), bank = el.querySelector('.bbank'); let locked = false;
  if (item.ex === 'meet') { const [big, slow] = el.querySelectorAll('.audio'), play = (b, s) => say(voice, text, { slow: s, onStart: (ms) => W.play(b, ms) });
    [big, slow].forEach((b) => M.pressable(b)); big.addEventListener('pointerup', () => play(big, false)); slow.addEventListener('pointerup', () => play(slow, true)); M.wait(450).then(() => { if (ctx.alive()) play(big, false); }); }
  const rects = () => new Map([...line.children].map((t) => [t, t.getBoundingClientRect()]));
  for (const w of words) { const t = document.createElement('button'); t.className = 'p3d tile word'; t.innerHTML = `<span class="face">${w}</span>`; bank.appendChild(t);
    M.pressable(t, async () => { if (locked) return; const from = t.getBoundingClientRect(), before = rects();
      if (t.parentNode === bank) { const slot = t.cloneNode(true); slot.classList.add('used'); t._slot = slot; bank.replaceChild(slot, t); line.appendChild(t);       // bank -> line, a grey slot stays behind
        ctx.ready(true); await M.flyFrom(t, from); M.land(t); SND.play('tile', { step: SND.deg(line.children.length - 1) }); }
      else { t._slot.replaceWith(t); before.forEach((r, o) => { if (o.isConnected && o.parentNode === line) M.flyFrom(o, r, { arc: false, ms: T.tileClose }); }); SND.play('tile', { step: -5, volume: 0.6 }); ctx.ready(line.children.length > 0); await M.flyFrom(t, from); } }); }
  await new Promise((r) => ctx.onCheck(r)); if (!ctx.alive()) return null; locked = true; ctx.ready(false);
  const built = [...line.children], said = built.map((t) => t.textContent), right = wants.some((w) => sameTiles(said, w));
  if (right) { for (const t of built) { t.classList.add('ok'); M.punch(t, 1.06); await M.wait(T.wave); } M.pop(line, GREEN); }
  else { const want = tilesOf(text); built.forEach((t, i) => { if (!want[i] || t.textContent.toLowerCase() !== want[i].toLowerCase()) { t.classList.add('no'); M.shake(t); } }); }
  if (right && item.ex === 'tiles' && ctx.speaking && await readAloud(ctx, item, text, voice) === null) return null;
  return { right, answer: text, tip: tipOf(item, p) || (item.uz ? `“${text}” — “${item.uz}”` : ''), voice, hear: right };
}
// After a sentence built right: say it out loud once (optional, never a mistake). The word bank gives way to the mic.
async function readAloud(ctx, item, text, voice) {
  const { el, mic } = ctx, bank = el.querySelector('.bbank');
  await M.fadeOut(bank, 0, 140); bank.style.display = 'none'; if (!ctx.alive()) return null;
  const box = document.createElement('div'); box.className = 'readaloud';
  box.innerHTML = `<div class="ralbl">Endi ovoz chiqarib ayting</div>${RESULT}<div class="michold"></div><button class="textlink skip">O'TKAZIB YUBORISH</button>`; el.appendChild(box);
  box.querySelector('.michold').appendChild(mic.el); M.fadeUp(box, 10, 220);
  const skip = new Promise((r) => { box.querySelector('.skip').onclick = () => r('skip'); });
  let cancelled = false;
  const practice = { ...ctx, alive: () => !cancelled && ctx.alive() };
  for (;;) {
    const r = await Promise.race([speakTurn(practice, { ...item, ex: 'say', also: [], accept: [] }, () => say(voice, text)), skip]);
    if (r === 'skip' || (r && r.off)) { cancelled = true; mic.onTap = null; mic.idle(false); return 'skip'; }
    if (!r) return null;
    if (r.right) { await M.wait(500); return r; }
    // This optional practice hasn't matched. Retry or explicitly skip; never
    // present a mismatching attempt as a successful speaking answer.
  }
}

// ---------- E6 What Happened?: a conversation with no text, one question, three pictures ----------
async function heard(ctx) {
  const { item, el } = ctx, people = [...new Set(item.talk.map(([who]) => who))], order = mix([0, 1, 2], ctx.n + item.q.length);
  el.innerHTML = head('TINGLANG', item.q) + `<div class="talkers">${people.map((who) => `<div class="talker" data-who="${who}"><div class="tav"></div><b>${NAME[who]}</b></div>`).join('')}</div>
    <button class="p3d btn secondary replay" style="opacity:0"><span class="face"><img src="${ICON}glyph-replay-violet.png" alt="">YANA TINGLASH</span></button>
    <div class="row3" style="opacity:0">${order.map((k) => `<button class="p3d tile picture" data-k="${k}"><span class="face"><span class="pic">${picHTML(item.opts[k][0])}</span>${item.opts[k][1]}</span></button>`).join('')}</div>
    <div class="script" style="display:none"><div class="lbl">SUHBAT MATNI:</div>${item.talk.map(([who, text]) => `<div><b>${NAME[who]}:</b> ${text}</div>`).join('')}</div>`;
  const row = el.querySelector('.row3'), opts = [...row.children], replay = el.querySelector('.replay'); let picked = null, locked = false, playing = false;
  for (const t of el.querySelectorAll('.talker')) People.put(t.dataset.who, t.querySelector('.tav'), 92);
  const play = async () => { if (playing) return; playing = true; replay.classList.add('disabled');
    for (const [who, text] of item.talk) { el.querySelectorAll('.talker').forEach((t) => t.classList.toggle('on', t.dataset.who === who)); await say(who, text, { mouth: who }); if (!ctx.alive() || locked) break; await M.wait(280); }
    el.querySelectorAll('.talker').forEach((t) => t.classList.remove('on')); playing = false; replay.classList.remove('disabled'); };
  M.pressable(replay, () => { if (!locked) play(); });
  opts.forEach((t) => M.pressable(t, () => { if (locked) return; opts.forEach((o) => { o.classList.remove('sel'); if (o !== t) o._setRest(0); }); picked = t; t.classList.add('sel'); t._setRest(-2); ctx.ready(true); }));
  await M.wait(450); if (!ctx.alive()) return null; await play(); if (!ctx.alive()) return null;                          // the answers come only after the conversation has been heard once
  row.style.opacity = 1; opts.forEach((t, i) => M.fadeUp(t, 10, 200, i * 60)); replay.style.opacity = 1; M.fadeUp(replay, 6, 200, 200);
  await new Promise((r) => ctx.onCheck(r)); if (!ctx.alive()) return null; locked = true; ctx.ready(false); stop();
  const right = +picked.dataset.k === item.right, good = opts.find((t) => +t.dataset.k === item.right); picked.classList.remove('sel'); picked._setRest(0);
  if (right) { picked.classList.add('ok'); M.punch(picked); M.pop(picked.querySelector('.pic'), GREEN); } else { picked.classList.add('no'); M.shake(picked); await M.wait(120); good.classList.add('ok'); }
  replay.style.display = 'none'; el.querySelector('.talkers').classList.add('small'); const script = el.querySelector('.script'); script.style.display = 'flex'; M.fadeUp(script, 8, 220, 150);   // the conversation's text is shown now
  const label = item.opts[item.right][1] || item.opts[item.right][0].replace(/^text:/, '');
  return { right, answer: label, tip: item.trap ? C.traps[item.trap].why : '' };
}

// ---------- E13 Tap the Mistake, and its "tap the gap" mode ----------
async function fix(ctx) {
  const { item, el } = ctx, gapMode = item.ex === 'gap', rightWords = item.right.split(' ');
  el.innerHTML = head(gapMode ? 'BO\'SHLIQNI TOPING' : 'XATONI TOPING', gapMode ? 'So\'z tushib qolgan joyni bosing' : 'Noto\'g\'ri so\'zni bosing') + `<div class="meaning">${item.ctx}</div><div class="sentence msent"></div>
    <div class="uztip" style="display:none"><img src="${ICON}bulb-tip.png" alt=""><div><b>O'ZBEKCHA IZOH</b>${C.traps[item.trap].why}</div></div>`;
  const sent = el.querySelector('.msent'); let picked = -1, locked = false; const breath = [];
  if (gapMode) sent.innerHTML = item.words.map((w, i) => `<span class="gap" data-i="${i}">+</span><span class="mword plain">${w}</span>`).join('');
  else sent.innerHTML = item.words.map((w, i) => `<span class="mword" data-i="${i}">${w}</span>`).join('');
  const taps = [...sent.querySelectorAll(gapMode ? '.gap' : '.mword')];
  taps.forEach((g, k) => { if (gapMode && !M.reduce) { const a = g.animate([{ scale: '1' }, { scale: '1.09' }], { duration: T.glow / 2, direction: 'alternate', iterations: Infinity, easing: EASE.sine, delay: k * 300 }); a.playbackRate = 1 / M.slow; breath.push(a); }
    g.onclick = () => { if (locked) return; taps.forEach((o, j) => { o.classList.remove('sel'); if (breath[j]) breath[j].play(); }); g.classList.add('sel'); if (breath[k]) breath[k].cancel(); if (gapMode) M.punch(g, 1.12, 160); picked = k; SND.play('pick', { once: 40 }); ctx.ready(true); }; });
  await new Promise((r) => ctx.onCheck(r)); if (!ctx.alive()) return null; locked = true; ctx.ready(false); breath.forEach((a) => a.cancel());
  const want = gapMode ? item.gap : item.bad, right = picked === want, g = taps[picked], tip = el.querySelector('.uztip');
  if (!right) { g.classList.remove('sel'); if (gapMode) { g.style.cssText = 'background:var(--red-soft);border-color:var(--red);color:var(--red-edge)'; M.shake(g); } else { g.classList.add('no'); M.shake(g); await M.wait(120); taps[want].classList.add('ok'); }
    return { right, answer: item.right, tip: C.traps[item.trap].why, voice: voiceOf(item, C.P) }; }
  if (gapMode) { taps.forEach((o, j) => { if (j !== picked) M.anim(o, [{ width: '40px', opacity: 1, marginLeft: '0px' }, { width: '0px', opacity: 0, marginLeft: '-8px' }], { duration: T.tileClose, easing: EASE.std, fill: 'forwards' }).then(() => o.remove()); });
    const w = document.createElement('span'); w.className = 'mword ok'; w.textContent = item.put || rightWords[want].replace(/[.,!?]/g, ''); g.replaceWith(w);                                // the missing word drops into the gap
    await M.anim(w, [{ opacity: 0, translate: '0 -14px' }, { opacity: 1, translate: '0 0' }], { duration: 200, fill: 'forwards' }); M.land(w); M.pop(w, GREEN); }
  else { g.classList.remove('sel'); g.classList.add('ok'); const strike = document.createElement('i'); strike.style.cssText = 'position:absolute;left:4px;right:4px;top:50%;height:3px;border-radius:2px;background:var(--green-edge);transform-origin:0 50%'; g.appendChild(strike);
    await M.anim(strike, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 200, fill: 'forwards' }); await M.wait(160);                                          // the wrong word is struck out, the right one drops in
    await M.anim(g, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 8px' }], { duration: 110, easing: EASE.in, fill: 'forwards' }); g.textContent = rightWords[want];
    await M.anim(g, [{ opacity: 0, translate: '0 -14px' }, { opacity: 1, translate: '0 0' }], { duration: 200, fill: 'forwards' }); M.land(g); M.pop(g, GREEN); }
  tip.style.display = 'flex'; M.fadeUp(tip, 8, 220);                                                                                                                                 // the Uzbek line says why
  return { right, answer: item.right, tip: '', voice: voiceOf(item, C.P), hear: true };
}

export const EX = { meet, say: sayIt, echo, tiles, heard, fix, gap: fix };
// how an item is shown: its own exercise, or the tile builder when speaking is off
export const exerciseFor = (item, way) => (way === 'tiles' ? tiles : EX[item.ex]);
