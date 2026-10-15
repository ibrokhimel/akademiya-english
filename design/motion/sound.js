// Sound for the lab: plays the chosen set (design/sound/final) on the same beats as the motion.
// The small interface sounds (tap, pick, wheel tick, tab, sheet, switch...) come from one family (design/sound/families),
// chosen in the tool bar, so the whole set can be swapped at once; the big sounds stay the owner's picks.
// Rules from docs/ideas/sound-plan.md: one sound per beat, nothing while the mic is listening, frequent sounds quiet.
//   SND.play(name, { step, volume, once })   step = semitones up (combo, tiles) · once = ignore a repeat inside this many ms
//   SND.hit(name, ms, { ok })                play so that the sound's loud moment lands ms from now (for sounds that build up first)
//   SND.appear(ms, ok)                       a soft rising tick for one of several things arriving one after another, ms from now
//   SND.mic(true | false)                    mic on: the blip, then silence while listening · mic off: sound is allowed again
//   SND.cut()                                stop the long sounds and the ones still waiting (when a screen is left)
//   SND.deg(i)                               the i-th step of a major scale, for sounds that climb
//   SND.busy                                 true while a reward or a jingle is sounding (a small sound may choose to keep quiet)
//   SND.meter()                              for the sync check only: a level bar in the corner that a screen recording can read
//   SND.useFamily(id)                        swap the family of small sounds ('sine', 'piano', 'material', 'clicks', or 'picks' for none)
//   SND.taps = { start(name, lead), cut() }  for haptic.js: told when a sound's moment comes (lead = ms until its loud moment) and when the long sounds are cut
const SND = (() => {
  const BASE = '/design/sound/final/', FAM = '/design/sound/families/', buf = {}, meta = {}, fams = [], fbuf = {}, last = {}, live = new Set(), waiting = new Set(), log = [];
  const ctx = new (window.AudioContext || window.webkitAudioContext)(), bus = ctx.createGain(), master = ctx.createGain(); bus.connect(master); master.connect(ctx.destination);
  let on = true, vol = 1, listening = false;                                                  // vol 1 = the levels in sounds.json, as the app will play them
  let tap = null;                                                                           // haptic.js listens here: the taps in the hand ride on the sounds' beats
  let fam = null, famId = 'sine', oneKey = true;                                              // the family in use ('picks' = none: the owner's first picks, new moments silent) · shift the picks into the family's key
  try { on = localStorage.getItem('lab-sound') !== 'off'; vol = +(localStorage.getItem('lab-level') || 1); famId = localStorage.getItem('lab-family') || famId; oneKey = localStorage.getItem('lab-onekey') !== 'off'; } catch (e) {}
  const level = () => { master.gain.value = on ? vol * vol : 0; }; level();
  const wake = () => { if (ctx.state !== 'running') ctx.resume(); };                       // browsers only start sound after a tap or a key
  addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
  const decode = async (url) => ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const useFamily = async (id) => { const f = fams.find((x) => x.id === id) || null;
    if (f && !f.loaded) { await Promise.all(Object.values(f.sounds).flatMap((s) => s.files.map(async (x) => { fbuf[f.id + '/' + x.file] = await decode(FAM + f.id + '/' + x.file); }))); f.loaded = true; }
    fam = f; famId = f ? f.id : 'picks'; };
  const ready = Promise.all([fetch(BASE + 'sounds.json').then((r) => r.json()).then((j) => Promise.all(j.sounds.map(async (s) => { meta[s.name] = s; buf[s.name] = await decode(BASE + s.file); }))),
    fetch(FAM + 'families.json').then((r) => r.json()).then((j) => { fams.push(...j.families); return useFamily(famId); })]);
  const ALSO = { nothing: 'mic-off' };                                                       // with no family, "nothing heard" keeps the mic's closing sound

  function play(name, o = {}) {
    const now = performance.now(), prev = log[log.length - 1]; let entry = { name, t: Math.round(now), step: o.step || 0 };
    if ((name === 'tick' || name === 'roll' || name === 'appear') && prev && prev.name === name && !prev.skipped && !listening) { prev.n = (prev.n || 1) + 1; entry = {}; } else log.push(entry);     // a run of ticks is one line in the log
    if (listening) { entry.skipped = 'mic'; return; }
    if (o.once && last[name] && now - last[name] < o.once) { entry.skipped = 'repeat'; return; }
    last[name] = now;
    if (tap) tap.start(name, o.lead || 0);                                                // the moment has come, heard or not (sound off, no file, sound still asleep): its tap goes with it
    const fs = fam && fam.sounds[name]; let b, volume, step = o.step || 0;
    if (fs) { const f = fs.files[fs.i = ((fs.i || 0) + 1) % fs.files.length]; b = fbuf[fam.id + '/' + f.file]; volume = f.volume; step += fs.step; }                // variants take turns
    else { const real = buf[name] ? name : ALSO[name]; b = buf[real]; volume = b && meta[real].volume; if (fam && oneKey) step += fam.tune[real] || 0; }
    if (!b) { entry.skipped = Object.keys(buf).length ? 'none' : 'not loaded'; return; }
    if (ctx.state !== 'running') { entry.skipped = 'asleep'; return; }                    // before the first tap: do not queue sounds up
    const src = ctx.createBufferSource(), g = ctx.createGain(), full = volume * (o.volume == null ? 1 : o.volume), skip = Math.min(o.skip || 0, b.duration);
    src.buffer = b; src.playbackRate.value = Math.pow(2, step / 12); src.connect(g); g.connect(bus);
    if (skip) { g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(full, ctx.currentTime + 0.02); } else g.gain.value = full;   // joined part-way: a short fade, no click
    src.start(0, skip);
    const item = { src, g, long: b.duration > 1, big: !fs && b.duration > 0.6 }; live.add(item); src.onended = () => live.delete(item);
  }
  // A sound that builds up first (a harp run, a roll before the hit) is started early, so its loud moment and the picture's beat are the same instant.
  // If there is less time than the build-up needs, the sound is joined part-way so the loud moment still lands on the beat.
  function hit(name, ms, o = {}) {
    const mine = !(fam && fam.sounds[name]), tune = mine && fam && oneKey ? fam.tune[name] || 0 : 0;
    const lead = mine ? ((meta[name] || {}).hit || 0) / Math.pow(2, ((o.step || 0) + tune) / 12) : 0, wait = ms * M.slow - lead;
    if (wait <= 0) return play(name, { ...o, skip: -wait / 1000, lead: ms * M.slow });      // lead: how long until the loud moment, for the tap that lands on it
    const t = setTimeout(() => { waiting.delete(t); if (!o.ok || o.ok()) play(name, { ...o, lead }); }, wait); waiting.add(t);
  }
  // Things arriving one after another: a soft tick each, a step higher every time; a pause starts a new run.
  // Keeps quiet under a reward or a jingle, and never ticks faster than the ear can count.
  let apAt = 0, apI = 0;
  function appear(ms = 0, ok) {
    const go = () => { const now = performance.now(); if ((ok && !ok()) || [...live].some((i) => i.big) || now - apAt < 35) return;
      apI = now - apAt > 450 ? 0 : Math.min(apI + 1, 7); apAt = now; play('appear', { step: deg(apI) }); };
    if (ms > 0) { const t = setTimeout(() => { waiting.delete(t); go(); }, ms * M.slow); waiting.add(t); } else go();
  }
  // fade out the long sounds in 120 ms (a jingle must not ring on over the next screen), and drop the ones that have not started yet
  const cut = () => { waiting.forEach(clearTimeout); waiting.clear(); if (tap) tap.cut();
    live.forEach((i) => { if (!i.long) return; i.g.gain.cancelScheduledValues(ctx.currentTime); i.g.gain.setTargetAtTime(0, ctx.currentTime, 0.04); try { i.src.stop(ctx.currentTime + 0.2); } catch (e) {} }); };
  let micRun = 0;
  function mic(open, quiet) { const me = ++micRun;
    if (open) { listening = false; play('mic-on'); setTimeout(() => { if (me === micRun) listening = true; }, 30); }       // the blip is let through, everything after it is not
    else if (listening && !quiet) { listening = false; play('mic-off'); } else listening = false; }

  // ---- beats that are the same on every page ----
  // main buttons (not tiles, audio buttons or the mic: those have their own sound or none)
  addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('.p3d, .node'); if (!b || b.matches('.tile, .audio, .rate, .promo, .scard, .cscard, .pcard') || b.closest('.mic')) return;
    if (b.matches('.disabled')) { if (fam) play('nothing'); return; }                          // a greyed-out button answers with the family's soft "not now"
    play('button'); }, true);
  // anything that becomes the picked one
  new MutationObserver((list) => { for (const m of list) { const had = (m.oldValue || '').split(/\s+/).includes('sel'); if (!had && m.target.classList.contains('sel') && !m.target.matches('.word')) { play('pick', { once: 40 }); return; } } })
    .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  // the feedback sheets (a fallback: where the answer is judged before the sheet, the page plays the sound at that moment)
  const up = M.sheetUp; M.sheetUp = (el) => { if (el.classList.contains('correct')) play('right', { once: 700 }); else if (el.classList.contains('fix')) play('not-right', { once: 700 }); return up(el); };
  // gold bits landing on a counter: one tick each, a step higher every time
  if (typeof flyTo === 'function') { const fly = flyTo; window.flyTo = (from, to, n, onArrive, host) => fly(from, to, n, (i) => { play('count', { step: deg(i) }); onArrive(i); }, host); }
  // a number counting up: a few soft ticks that slow down with it (never under a jingle)
  { const cu = M.countUp; let lastRoll = 0;
    M.countUp = (el, to, ms = M.T.countUp) => { const from = +el.textContent || 0, t0 = performance.now(), dur = ms * M.slow; let shown = from;
      const f = (now) => { const k = Math.min((now - t0) / dur, 1), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        if (v !== shown && now - lastRoll > 55 && ![...live].some((i) => i.long)) { lastRoll = now; play('roll'); } shown = v; if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f); return cu(el, to, ms); }; }
  // leaving a screen in the lab stops its jingle
  addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('.side .act, #side .act')) cut(); }, true);

  // ---- the switch in the tool bar ----
  addEventListener('DOMContentLoaded', () => { const tools = document.querySelector('.tools'); if (!tools) return;
    const b = Object.assign(document.createElement('button'), { className: 'tool', id: 'tSound', textContent: 'Sound' }); b.setAttribute('aria-pressed', on);
    b.onclick = () => { on = !on; b.setAttribute('aria-pressed', on); level(); try { localStorage.setItem('lab-sound', on ? 'on' : 'off'); } catch (e) {} };
    const l = document.createElement('label'); l.className = 'tool'; l.id = 'tLevel'; l.style.cssText = 'display:flex;align-items:center;gap:8px';
    l.innerHTML = 'Volume <input type="range" min="0" max="150" step="5" style="width:90px;accent-color:var(--violet)"><b style="min-width:42px;font-variant-numeric:tabular-nums"></b>';
    const r = l.querySelector('input'), n = l.querySelector('b'), show = () => { n.textContent = Math.round(vol * 100) + '%'; };     // 100% = the levels the app will use
    r.value = vol * 100; show(); r.oninput = () => { vol = r.value / 100; show(); level(); try { localStorage.setItem('lab-level', vol); } catch (e) {} };
    // which family plays the small sounds, and whether the picks are shifted into its key
    const fl = document.createElement('label'); fl.className = 'tool'; fl.id = 'tFamily'; fl.style.cssText = 'display:flex;align-items:center;gap:8px';
    fl.innerHTML = 'Small sounds <select style="font:inherit;font-weight:800;color:var(--violet);background:none;border:0;outline:0;cursor:pointer"></select>'; const sel = fl.querySelector('select');
    const k = Object.assign(document.createElement('button'), { className: 'tool', id: 'tKey', textContent: 'One key' }); k.setAttribute('aria-pressed', oneKey);
    k.onclick = () => { oneKey = !oneKey; k.setAttribute('aria-pressed', oneKey); try { localStorage.setItem('lab-onekey', oneKey ? 'on' : 'off'); } catch (e) {} };
    ready.then(() => { sel.innerHTML = fams.map((f) => `<option value="${f.id}" title="${f.about}">${f.name}</option>`).join('') + '<option value="picks">My first picks</option>'; sel.value = famId; });
    sel.onchange = async () => { await useFamily(sel.value); try { localStorage.setItem('lab-family', famId); } catch (e) {} play('pick'); };
    tools.append(b, l, fl, k); });
  const deg = (i) => [0, 2, 4, 5, 7, 9, 11, 12, 14, 16][Math.max(0, Math.min(i, 9))];          // steps of a major scale, in semitones

  // ---- for check-sync.js: what is sounding right now, drawn where a screen recording can read it ----
  function meter() {
    const an = ctx.createAnalyser(); an.fftSize = 512; bus.connect(an); const data = new Float32Array(an.fftSize);
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:288px;height:16px;background:#000';
    box.innerHTML = '<i style="position:absolute;left:0;top:0;height:16px;width:0;background:#f0f"></i><i style="position:absolute;left:264px;top:0;width:24px;height:16px;background:#000"></i>';
    document.body.appendChild(box); const [bar, lamp] = box.children;
    const tick = () => { an.getFloatTimeDomainData(data); let pk = 0; for (const v of data) pk = Math.max(pk, Math.abs(v));
      bar.style.width = Math.round(Math.max(0, Math.min(1, (20 * Math.log10(pk || 1e-6) + 64) / 64)) * 256) + 'px';              // 4 px per dB, full width = 0 dB
      lamp.style.background = live.size ? '#0f0' : '#000'; requestAnimationFrame(tick); }; tick();
  }
  return { ctx, out: bus, play, hit, appear, mic, cut, deg, meter, ready, log, meta, useFamily, get family() { return famId; }, get listening() { return listening; }, get busy() { return [...live].some((i) => i.big); }, set taps(t) { tap = t; } };   // busy: a reward or a jingle is sounding, small sounds should wait their turn
})();
window.SND = SND;
