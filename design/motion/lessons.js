// Page 11: every lesson item, to read and to hear. Reads the app's own lesson files (src/content) and sound clips (src/content/audio).
// A line plays when pressed: its words light up in time and the speaker's mouth follows. All four speakers are Rive characters on one rig
// (design/rive/waiter_rig.js): the waiter, the seller, Aziz and Malika. Nothing here is an app screen.
(async () => {
  const C = '/src/content/', get = (f) => fetch(C + f).then((r) => r.json()), esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const [ph, tr, ...units] = await Promise.all([get('phrases.json'), get('traps.json'), get('unit-1.json'), get('unit-2.json'), get('unit-3.json')]);
  const P = Object.fromEntries(ph.phrases.map((p) => [p.id, p])), TRAP = Object.fromEntries(tr.traps.map((t) => [t.id, t]));
  const casts = await get('audio/cast.json').catch(() => null); let cast = casts && casts.use, index = {};
  try { const c = localStorage.getItem('lab-cast'); if (casts && casts.casts[c]) cast = c; } catch (e) {}
  const loadCast = async () => { index = cast ? (await get(`audio/${cast}/index.json`)).clips : {}; };
  await loadCast();
  // the same rules as src/content/check.js: the text an item makes, who says it, the file it is in
  const answer = (it) => it.p ? P[it.p].en : it.en || it.line || it.right;
  const voiceOf = (it) => it.voice || (it.p && P[it.p].voice) || (ph.phrases.find((p) => p.en === answer(it)) || {}).voice || 'malika';
  const slug = (t) => t.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const NAME = { aziz: 'Aziz', malika: 'Malika', waiter: 'The waiter', seller: 'The seller' };
  const EX = { meet: 'MEET IT', heard: 'WHAT HAPPENED?', fix: 'TAP THE MISTAKE', gap: 'TAP THE GAP', echo: 'ECHO LINE', tiles: 'TILE BUILDER', say: 'SAY WHAT YOU SEE' };

  // ---- the speaker in the corner ----
  const CAN = { waiter: $('#cA'), seller: $('#cC'), aziz: $('#cZ'), malika: $('#cM') }, BOARD = { waiter: 'Waiter A', seller: 'Waiter C', aziz: 'Aziz', malika: 'Malika' }, vm = {};
  for (const who of Object.keys(CAN)) vm[who] = await M.rive(CAN[who], BOARD[who], 'Waiter');
  const setDark = () => Object.values(vm).forEach((v) => { v.boolean('dark').value = document.body.classList.contains('dark'); }); setDark(); document.addEventListener('lab-dark', setDark);
  const face = (who) => { for (const k of Object.keys(CAN)) CAN[k].classList.toggle('show', k === who); $('#nWho').textContent = NAME[who] || '—'; };

  // ---- play one clip ----
  const buf = {}; let run = 0, live = null;
  const load = (f) => buf[cast + f] || (buf[cast + f] = fetch(`${C}audio/${cast}/${f}`).then((r) => r.arrayBuffer()).then((b) => SND.ctx.decodeAudioData(b)));
  const stop = () => { run++; if (live) { try { live.stop(); } catch (e) {} live = null; } $$('.line.playing').forEach((l) => l.classList.remove('playing')); $$('.w.now').forEach((w) => w.classList.remove('now')); Object.values(vm).forEach((v) => { v.boolean('talking').value = false; }); };
  async function play(el) {
    stop(); const me = run, c = index[el.dataset.f], part = c && (el.dataset.slow ? c.slow : c); if (!part) return;
    if (SND.ctx.state !== 'running') await SND.ctx.resume();
    const b = await load(el.dataset.f + (el.dataset.slow ? '.slow.wav' : '.wav')); if (me !== run) return;
    const src = SND.ctx.createBufferSource(), g = SND.ctx.createGain(); src.buffer = b; g.gain.value = part.volume; src.connect(g); g.connect(SND.out); src.start(); live = src;
    face(c.voice); $('#tWho').textContent = c.text + (el.dataset.slow ? '  (slow)' : ''); el.classList.add('playing');
    const v = vm[c.voice], words = $$('.w', el.dataset.slow ? el.previousElementSibling : el), t0 = performance.now(); if (v) v.boolean('talking').value = true;      // the slow button lights the words of its line
    let shown = -1; const tick = () => { if (me !== run) return; const t = performance.now() - t0;
      if (v) { let shape = 0; for (const [at, s] of part.mouth) { if (at > t) break; shape = s; } if (shape !== shown) v.number('viseme').value = shown = shape; }      // a new shape is written once, not on every frame
      part.words.forEach(([, a, z], i) => { if (words[i]) words[i].classList.toggle('now', t >= a && t < z + 60); });
      if (t < part.ms) requestAnimationFrame(tick); }; tick();
    await new Promise((r) => { src.onended = r; }); if (me === run) stop();
  }
  // a line that can be heard: the text, and a small turtle for the slow one
  const line = (voice, text, slowToo = true) => { const f = `${voice}/${slug(text)}`, has = index[f];
    return `<button class="line${has ? '' : ' nofile'}" data-f="${f}"><span class="pl"><img src="${ICON}glyph-play-white.png" alt=""></span><span>${text.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}</span></button>`
      + (slowToo && has ? `<button class="line slow" data-f="${f}" data-slow="1">slow</button>` : ''); };
  const pic = (p) => p.startsWith('text:') ? `<span class="pic">${esc(p.slice(5))}</span>` : `<span class="pic"><img src="${ICON}${p.startsWith('icon:') ? p.slice(5) : 'lesson-' + p}.png" alt="" onerror="this.parentNode.classList.add('none');this.parentNode.textContent='${esc(p)}'"></span>`;
  const tilesOf = (t) => t.replace(/[.,!?]/g, '').split(/\s+/);

  // ---- one item ----
  function item(it, i, steps) {
    const p = it.p && P[it.p], v = voiceOf(it), tags = [it.review ? '<span class="tag">REVIEW</span>' : '', it.use ? '<span class="tag use">USE</span>' : '', it.step != null ? `<span class="tag step">${it.step + 1}/5 · ${esc(steps[it.step])}</span>` : '', it.trap ? `<span class="tag trap">${it.trap} · ${esc(TRAP[it.trap].name)}</span>` : ''].join('');
    let body = '';
    if (it.ex === 'meet') body = `${pic(p.pic)}<div><div class="uz">${esc(p.uz)}</div><div class="muted">heard first with no text; the learner repeats it</div></div>${line(v, p.en)}`;
    if (it.ex === 'heard') body = `<div class="talk">${it.talk.map(([who, text]) => `<div><small>${who}</small>${line(who, text, false)}</div>`).join('')}</div><div class="uz">${esc(it.q)}</div>
      <div class="opts">${it.opts.map(([pc, label], k) => `<span class="opt${k === it.right ? ' right' : ''}">${pic(pc)}${esc(label)}</span>`).join('')}</div>`;
    if (it.ex === 'fix' || it.ex === 'gap') { const words = it.words.map((w, k) => `${it.ex === 'gap' && k === it.gap ? '<span class="hole"></span>' : ''}<span class="${it.ex === 'fix' && k === it.bad ? 'bad' : ''}">${esc(w)}</span>`).join('') + (it.ex === 'gap' && it.gap === it.words.length ? '<span class="hole"></span>' : '');
      body = `<div class="uz">${esc(it.ctx)}</div><div class="sent">${words}</div><span class="muted">→</span>${line(v, it.right)}<div class="why">${esc(TRAP[it.trap].why)}</div>`; }
    if (it.ex === 'echo') body = `${it.lead ? `<div class="talk"><div><small>${it.lead[0]}</small>${line(it.lead[0], it.lead[1], false)}</div></div>` : ''}${line(v, answer(it))}<span class="muted">${esc(p ? p.uz : it.uz)} · said by ${NAME[v]}, the learner repeats</span>`;
    if (it.ex === 'tiles') body = `<div class="uz">${esc(p && !it.uz ? p.uz : it.uz)}</div><div>${tilesOf(answer(it)).map((w) => `<span class="tl">${esc(w)}</span>`).join('')}${it.extra.map((w) => `<span class="tl x">${esc(w)}</span>`).join('')}</div>${line(v, answer(it), false)}`;
    if (it.ex === 'say') body = `${pic(it.pic || p.pic)}<div class="uz">${esc(it.task)}</div>${line(v, p.en)}${(it.also || it.accept) ? `<span class="muted">also right: ${[...(it.also || []).map((id) => P[id].en), ...(it.accept || [])].map(esc).join(' · ')}</span>` : ''}`;
    return `<div class="item"><span class="n">${i + 1}</span><div class="kind">${EX[it.ex]}${tags}</div><div class="bodyx">${body}</div></div>`;
  }
  function show(l, u) {
    stop(); $$('#lnav button').forEach((b) => b.classList.toggle('on', b.dataset.id === l.id)); try { localStorage.setItem('lab-lesson', l.id); } catch (e) {}
    const cp = !l.n, news = (l.new || []).map((id) => P[id]);
    $('#lmain').innerHTML = `<div class="lhead"><small>${cp ? `CHECKPOINT · UNIT ${u.unit}` : `LESSON ${l.n} · ${esc(l.skill)}`}</small><b>${esc(l.title)}</b><span>${l.items.length} items${l.trap ? ` · trap ${l.trap}: ${esc(TRAP[l.trap].name)}` : ''}${cp ? ' · story: ' + l.steps.map(esc).join(' → ') : ''}</span></div>
      ${news.length ? `<h2 style="margin-top:0">New in this lesson</h2><div class="newrow">${news.map((p) => `<div class="card">${pic(p.pic)}<div>${line(p.voice, p.en)}<span class="uz">${esc(p.uz)}</span></div></div>`).join('')}</div><h2>The lesson</h2>` : ''}
      ${l.items.map((it, i) => item(it, i, l.steps)).join('')}`;
  }
  const all = units.flatMap((u) => [...u.lessons.map((l) => [l, u]), [u.checkpoint, u]]);
  $('#lnav').innerHTML = units.map((u) => `<h2>Unit ${u.unit} · ${esc(u.name)}</h2>${u.lessons.map((l) => `<button data-id="${l.id}"><i>${l.n}</i>${esc(l.skill)}</button>`).join('')}<button class="cp" data-id="${u.checkpoint.id}"><i>✓</i>Checkpoint</button>`).join('');
  const open = (id) => { const hit = all.find(([l]) => l.id === id) || all[0]; show(...hit); };
  $('#lnav').onclick = (e) => { const b = e.target.closest('button'); if (b) { open(b.dataset.id); scrollTo({ top: 0 }); } };
  $('#lmain').onclick = (e) => { const b = e.target.closest('.line'); if (b) (b.classList.contains('playing') ? stop : play)(b); };
  const sel = $('#tCast select'); sel.innerHTML = casts ? Object.entries(casts.casts).map(([k, n]) => `<option value="${k}">${n}</option>`).join('') : '<option>none built</option>'; if (cast) sel.value = cast;
  sel.onchange = async () => { stop(); cast = sel.value; try { localStorage.setItem('lab-cast', cast); } catch (e) {} await loadCast(); open(($('#lnav button.on') || {}).dataset.id); };
  let first = 'l1'; try { first = localStorage.getItem('lab-lesson') || first; } catch (e) {}
  open(first); window.LESSONS = { play, stop, index: () => index, vm }; window.labReady = true;
})();
