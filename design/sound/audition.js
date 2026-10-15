// Sound audition page: reads manifest.json, plays candidates, saves likes and notes to picks.json (through serve.js).
// The zipped copy (build_zip.py) is opened as a file with no server: its data comes from manifest.js and likes stay in the browser.
(async () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const alone = !!window.MANIFEST, man = alone ? window.MANIFEST : await (await fetch('manifest.json?' + Date.now())).json();
  let picks = {}; try { if (alone) picks = JSON.parse(localStorage.getItem('sound-picks')) || window.PICKS || {}; else picks = await (await fetch('picks.json?' + Date.now())).json(); } catch (e) { try { picks = JSON.parse(localStorage.getItem('sound-picks') || '{}'); } catch (e2) {} }
  const P = (id) => (picks[id] = picks[id] || { liked: [], note: '' });

  // ---- saving ----
  let saveT = 0; const savedEl = $('#saved');
  const save = () => { clearTimeout(saveT); saveT = setTimeout(async () => { try { localStorage.setItem('sound-picks', JSON.stringify(picks)); } catch (e) {}
    if (alone) { savedEl.textContent = 'Saved in this browser'; return; }
    try { const r = await fetch('picks', { method: 'POST', body: JSON.stringify(picks) }); savedEl.textContent = r.ok ? 'Saved' : 'Not saved'; } catch (e) { savedEl.textContent = 'Saved in this browser only'; } }, 300); };
  const stat = () => { const slots = man.slots.filter((s) => P(s.id).liked.length).length, n = man.slots.reduce((a, s) => a + P(s.id).liked.length, 0);
    $('#stat').textContent = `${n} liked · ${slots} of ${man.slots.length} sounds have a like`;
    man.slots.forEach((s) => { const a = $(`#nav a[data-id="${s.id}"]`), k = P(s.id).liked.length; a.classList.toggle('has', k > 0); $('i', a).textContent = k ? '♥ ' + k : s.items.length; }); };

  // ---- playing ----
  const ctx = new (window.AudioContext || window.webkitAudioContext)(), gain = ctx.createGain(); gain.connect(ctx.destination);
  let cur = null, seq = 0;
  const vol = $('#vol'); const setVol = () => { gain.gain.value = Math.pow(vol.value / 100, 2); if (cur && cur.el) cur.el.volume = gain.gain.value; }; vol.oninput = setVol; setVol();
  const cache = new Map();
  const load = (url) => { if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b))); return cache.get(url); };
  const stop = () => { if (cur) { try { cur.el ? cur.el.pause() : cur.src.stop(); } catch (e) {} cur.card.classList.remove('playing'); cur = null; } };
  // opened as a file, the browser will not hand the sound data to the page, so the zipped copy plays through a plain audio element
  const playFile = async (card, rate, me) => { const el = new Audio(card.dataset.url); el.volume = gain.gain.value; el.preservesPitch = false; el.playbackRate = rate;
    try { await el.play(); } catch (e) { return 0; } if (me !== seq) { el.pause(); return 0; }
    card.classList.add('playing'); cur = { el, card }; el.onended = () => { if (cur && cur.el === el) { card.classList.remove('playing'); cur = null; } }; return card.dataset.ms / 1000 / rate; };
  const play = async (card, rate = 1) => { seq++; const me = seq; stop(); if (alone) return playFile(card, rate, me); if (ctx.state !== 'running') await ctx.resume();
    const buf = await load(card.dataset.url); if (me !== seq) return 0;
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate; src.connect(gain); src.start(); card.classList.add('playing'); cur = { src, card };
    src.onended = () => { if (cur && cur.src === src) { card.classList.remove('playing'); cur = null; } }; return buf.duration / rate; };

  // ---- waveform ----
  const wave = (cv, peaks) => { const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const css = getComputedStyle(document.body); c.fillStyle = css.getPropertyValue('--violet'); const n = peaks.length, bw = w / n;
    peaks.forEach((p, i) => { const bh = Math.max(2, p * h); c.beginPath(); c.roundRect(i * bw + 0.5, (h - bh) / 2, Math.max(1, bw - 1.5), bh, 1); c.fill(); }); };

  // ---- build ----
  const nav = $('#nav'), main = $('#main'); let grp = '';
  for (const s of man.slots) {
    if (s.group !== grp) { grp = s.group; nav.insertAdjacentHTML('beforeend', `<div class="grp">${grp}</div>`); }
    nav.insertAdjacentHTML('beforeend', `<a href="#${s.id}" data-id="${s.id}">${s.name}<i></i></a>`);
    const sec = document.createElement('section'); sec.className = 'slot'; sec.id = s.id;
    sec.innerHTML = `<div class="head"><h3>${s.name}</h3><span class="tag ${s.priority === 'first' ? '' : 'later'}">${s.priority === 'first' ? 'needed for the test build' : 'can wait'}</span></div>
      <p class="when">${s.when}</p><p class="want">Looking for: ${s.want}</p>
      <div class="row"><button class="tool" data-a="all">▶ Play all in a row</button><button class="tool" data-a="liked">▶ Play my likes</button>${s.ladder ? '<button class="tool" data-a="ladder">▶ Last played, rising 5 times</button>' : ''}</div>
      <div class="cards">${s.items.map((it, i) => `<div class="card" data-id="${it.id}" data-url="${it.url}" data-ms="${it.ms}" title="${it.title.replace(/"/g, '&quot;')}">
        <div class="top"><span class="n">${i + 1}</span><span class="nm">${it.title}</span><button class="heart" aria-label="Like">♥</button></div><canvas></canvas>
        <div class="meta"><span class="src">${it.source}</span><span>${it.ms < 1000 ? it.ms + ' ms' : (it.ms / 1000).toFixed(1) + ' s'}</span><span class="lic ${it.lic === 'CC0' ? '' : 'by'}">${it.lic}</span></div></div>`).join('')}</div>
      <textarea placeholder="Notes for this sound (optional)"></textarea>`;
    main.appendChild(sec);
    const cards = $$('.card', sec), st = P(s.id); let last = cards[0], running = 0;
    cards.forEach((c, i) => { wave($('canvas', c), s.items[i].peaks); c.classList.toggle('liked', st.liked.includes(c.dataset.id));
      c.addEventListener('click', (e) => { if (e.target.closest('.heart')) { const on = c.classList.toggle('liked'); st.liked = cards.filter((x) => x.classList.contains('liked')).map((x) => x.dataset.id); stat(); save(); if (on) { last = c; play(c); } return; }
        running++; last = c; play(c); }); });
    const row = async (list) => { const me = ++running; for (const c of list) { if (me !== running) return; c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); const d = await play(c); last = c; await new Promise((r) => setTimeout(r, d * 1000 + 450)); } };
    $$('.row .tool', sec).forEach((b) => b.onclick = async () => { const a = b.dataset.a;
      if (a === 'all') row(cards.filter((c) => c.offsetParent)); else if (a === 'liked') row(cards.filter((c) => c.classList.contains('liked')));
      else { const me = ++running; for (let k = 0; k < 5; k++) { if (me !== running) return; const d = await play(last, Math.pow(2, k / 12)); await new Promise((r) => setTimeout(r, Math.max(d * 1000 * 0.9, 380))); } } });
    const ta = $('textarea', sec); ta.value = st.note || ''; ta.oninput = () => { st.note = ta.value; save(); };
  }
  stat();
  const dark = $('#tDark'), only = $('#tLiked');
  const redraw = () => man.slots.forEach((s) => $$(`#${s.id} .card`).forEach((c, i) => wave($('canvas', c), s.items[i].peaks)));
  dark.onclick = () => { const on = document.body.classList.toggle('dark'); dark.setAttribute('aria-pressed', on); redraw(); };
  only.onclick = () => { const on = document.body.classList.toggle('onlyliked'); only.setAttribute('aria-pressed', on); };
  addEventListener('resize', redraw); addEventListener('keydown', (e) => { if (e.key === 'Escape') { seq++; stop(); } });
  window.auditionReady = true;
})();
