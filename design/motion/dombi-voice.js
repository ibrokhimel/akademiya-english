// Dombi's voice. Two kinds, chosen in the tool bar ("Dombi's voice"):
//   a real voice   his lines from files (design/sound/dombi); his mouth follows the sound. Two sorts:
//                    acts    a voice model that is told how to say each line: cool, playful, warm (build_dombi_acted.py)
//                    reads   a plain text-to-speech voice (build_dombi_tts.py)
//   a babble       one short sound for each syllable of the text, made here; used for a line that has no recording (your name)
//   DOMBI.voice                       a real voice's id ('dombi-acted', 'sardor', ...) | 'hum' | 'mumble' | 'blip' | 'bloop' | 'hm' | 'off'
//   DOMBI.say(text)                   plays the text; returns { ms, done } or null when he stays quiet
//   DOMBI.talk(vm, text, alive)       says it and moves the mouth of that Dombi with it; a promise, or null when he stays quiet
// Loaded after sound.js (it plays through the lab's sound switch and volume, and never while the mic listens or over a reward).
const DOMBI = (() => {
  // how each voice makes one syllable. c: audio context · out: where it goes · t: when · s: { vowel, st = semitones away from the voice's home note }
  const env = (c, out, t, peak, attack, len) => { const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + len); g.connect(out); return g; };
  const osc = (c, type, f, t, len) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + len + 0.02); return o; };
  const hz = (base, st) => base * Math.pow(2, st / 12);
  const FORMANT = { a: [730, 1090], e: [530, 1840], i: [300, 2250], o: [570, 840], u: [320, 870] };       // the two tones that make a vowel sound like itself
  const NOTE = { a: 4, o: 7, u: 9, e: 12, i: 14 };                                                          // E4 G4 A4 C5 D5: the five-note scale in C, the key of the Sine family, high enough for a phone's speaker
  // gain: set by measurement so every voice is heard at -33 LUFS, between Not right and the mic's sounds (node check-dombi.js, then tools/measure_dombi.py)
  const VOICES = {
    hum: { name: 'Hum', about: 'soft notes in the key of the other sounds', gain: 0.105, per: 'syllable', make(c, out, t, s) {       // a soft mallet note
        const f = hz(261.63, NOTE[s.vowel] + (s.rise ? 12 : 0)), g = env(c, out, t, 1, 0.006, 0.19); osc(c, 'sine', f, t, 0.19).connect(g);
        const g2 = env(c, out, t, 0.14, 0.004, 0.07); osc(c, 'sine', f * 3, t, 0.07).connect(g2); } },
    mumble: { name: 'Mumble', about: 'a low muffled voice: wa, wo, wu', gain: 1.14, per: 'syllable', make(c, out, t, s) {             // a buzz through the vowel's two tones
        const o = osc(c, 'sawtooth', hz(112, s.st * 0.6), t, 0.1); o.frequency.exponentialRampToValueAtTime(hz(112, s.st * 0.6 - 0.8), t + 0.1);
        const g = env(c, out, t, 1, 0.014, 0.1), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(g);
        FORMANT[s.vowel].forEach((f, k) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = 7; const m = c.createGain(); m.gain.value = k ? 0.6 : 1; o.connect(b); b.connect(m); m.connect(lp); }); } },
    blip: { name: 'Blip', about: 'one short tone per syllable, like an old video game', gain: 0.205, per: 'syllable', make(c, out, t, s) {
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900; lp.connect(env(c, out, t, 1, 0.004, 0.075)); osc(c, 'triangle', hz(294, s.st), t, 0.075).connect(lp); } },
    bloop: { name: 'Bloop', about: 'a small liquid plop per syllable, like a blob talking', gain: 0.16, per: 'syllable', make(c, out, t, s) {
        const o = osc(c, 'sine', hz(300, s.st), t, 0.085); o.frequency.exponentialRampToValueAtTime(hz(300, s.st) * 1.9, t + 0.06); o.connect(env(c, out, t, 1, 0.004, 0.085)); } },
    hm: { name: 'Hm', about: 'one calm "hm" per word: he says little', gain: 0.07, per: 'word', make(c, out, t, s) {
        const o = osc(c, 'sawtooth', hz(196, s.st * 0.5), t, 0.2); o.frequency.exponentialRampToValueAtTime(hz(196, s.st * 0.5 - 1.5), t + 0.2);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.03); g.gain.setValueAtTime(1, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); g.connect(out);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.8; o.connect(lp); lp.connect(g); } },
  };
  let voice = 'dombi-acted'; try { voice = localStorage.getItem('lab-dombi') || voice; } catch (e) {}
  // ---- the real voices ----
  const REAL = '/design/sound/dombi/', real = {}, rbuf = {};                                     // real[id] = { name, about, kind: 'acts' | 'reads', lines: { text: { file, ms, volume } } }
  const ready = fetch(REAL + 'lines.json').then((r) => r.json()).then((j) => j.voices.forEach((v) => { real[v.id] = v; })).catch(() => {}).then(() => { if (voice !== 'off' && !real[voice] && !VOICES[voice]) voice = real['dombi-acted'] ? 'dombi-acted' : 'bloop'; preload(); });      // a remembered voice that is gone
  const load = (v, l) => rbuf[v + l.file] || (rbuf[v + l.file] = fetch(REAL + v + '/' + l.file).then((r) => r.arrayBuffer()).then((b) => SND.ctx.decodeAudioData(b)));
  const preload = (v = voice) => { if (real[v]) Object.values(real[v].lines).forEach((l) => load(v, l)); };      // so the first line does not come late
  // play one recorded line; onLevel(0-1) runs every frame so a mouth can follow it; alive() false stops him mid-word
  const speak = (v, l, onLevel, alive) => load(v, l).then((b) => new Promise((done) => { if (!alive()) return done();
    const c = SND.ctx, src = c.createBufferSource(), g = c.createGain(), an = c.createAnalyser(), data = new Float32Array(1024); src.buffer = b; g.gain.value = l.volume; an.fftSize = 1024;
    src.connect(g); g.connect(SND.out); src.connect(an); let over = false; src.onended = () => { over = true; onLevel(0); done(); }; src.start();
    const tick = () => { if (over) return; if (!alive()) { g.gain.setTargetAtTime(0, c.currentTime, 0.02); try { src.stop(c.currentTime + 0.08); } catch (e) {} return; }
      an.getFloatTimeDomainData(data); let sum = 0; for (const x of data) sum += x * x; onLevel(Math.min(1, Math.sqrt(sum / data.length) * 5)); requestAnimationFrame(tick); }; tick(); }));
  // The text as syllables: one for each vowel, a small gap between words, a longer one at a comma, a breath at the end of a sentence.
  // He says at most 12 syllables: a long line is read, not listened to.
  function plan(text, per = 'syllable') {
    const VOWEL = { a: 'a', e: 'e', i: 'i', o: 'o', u: 'u', 'а': 'a', 'е': 'e', 'и': 'i', 'о': 'o', 'у': 'u' }, UP = { a: 0, o: -2, u: -3, e: 2, i: 4 }; const syl = []; let at = 0, fresh = true;
    for (const ch of text.toLowerCase()) { if (syl.length >= 12) break;
      if (VOWEL[ch]) { if (per === 'syllable' || fresh) { syl.push({ at, vowel: VOWEL[ch], st: UP[VOWEL[ch]] }); at += per === 'word' ? 250 : 105; } fresh = false; }
      else if (ch === ' ') { at += per === 'word' ? 0 : 30; fresh = true; } else if (ch === ',' || ch === '—' || ch === ':') at += 120; else if ('.!?'.includes(ch)) { if (ch === '?' && syl.length) syl[syl.length - 1].rise = true; at += 220; fresh = true; } }
    syl.forEach((s, i) => { s.st += -2 * i / Math.max(1, syl.length - 1) + (s.rise ? 4 : 0); });               // the voice falls a little along the line and lifts on a question
    return { syl, ms: syl.length ? syl[syl.length - 1].at + 200 : 0 };
  }
  const render = (c, out, text, v = voice, t0 = c.currentTime + 0.02) => { const V = VOICES[v], p = plan(text, V.per), g = c.createGain(); g.gain.value = V.gain; g.connect(out); p.syl.forEach((s) => V.make(c, g, t0 + s.at / 1000, s)); return p; };
  function say(text, v = voice, onLevel = () => {}, alive = () => true) {
    if (v === 'off' || SND.listening || SND.busy || SND.ctx.state !== 'running') return null;
    const l = real[v] && real[v].lines[text.trim()]; if (real[v] && !l) v = 'bloop';                // no recording of this line (your name): his babble says it
    if (!l && !VOICES[v]) return null; SND.log.push({ name: 'dombi', t: Math.round(performance.now()), step: 0 });
    if (l) return { ms: l.ms, done: speak(v, l, onLevel, alive) };
    const p = render(SND.ctx, SND.out, text, v); p.done = new Promise((r) => setTimeout(r, p.ms)); return p; }
  // his mouth: with a real voice it opens with the sound; with the babble, one shape per syllable. Closed again when the line is over.
  function talk(vm, text, alive = () => true) { const V = [5, 3, 6, 4, 8, 3, 5, 1, 6, 4]; let i = 0, last = 0;
    const p = say(text, voice, (level) => { if (!alive()) return; vm.number('amp').value = level * 100; const now = performance.now();
      if (level < 0.07) vm.number('viseme').value = 1; else if (now - last > 95) { last = now; vm.number('viseme').value = V[i++ % V.length]; } }, alive);
    if (!p) return null; vm.boolean('talking').value = true;
    if (p.syl) { vm.number('amp').value = 40; p.syl.forEach((s, k) => setTimeout(() => { if (alive()) vm.number('viseme').value = V[k % V.length]; }, s.at)); }
    return p.done.then(() => { if (alive()) { vm.boolean('talking').value = false; vm.number('amp').value = 0; } }); }
  // ---- the choice in the tool bar: changing it lets him say his line once ----
  addEventListener('DOMContentLoaded', () => { const tools = document.querySelector('.tools'); if (!tools) return;
    const l = document.createElement('label'); l.className = 'tool'; l.id = 'tDombi'; l.style.cssText = 'display:flex;align-items:center;gap:8px';
    l.innerHTML = `Dombi's voice <select style="font:inherit;font-weight:800;color:var(--violet);background:none;border:0;outline:0;cursor:pointer"></select>`; const sel = l.querySelector('select');
    ready.then(() => { const opt = ([k, v]) => `<option value="${k}" title="${v.about}">${v.name}</option>`;
      const group = (label, kind) => { const v = Object.entries(real).filter(([, r]) => (r.kind || 'reads') === kind); return v.length ? `<optgroup label="${label}">${v.map(opt).join('')}</optgroup>` : ''; };
      sel.innerHTML = `${group('Acts the words', 'acts')}${group('Reads the words', 'reads')}<optgroup label="Babble">${Object.entries(VOICES).map(opt).join('')}</optgroup><option value="off">Off</option>`; sel.value = voice; });
    sel.onchange = () => { voice = sel.value; try { localStorage.setItem('lab-dombi', voice); } catch (e) {} preload(); say('Salom! Men Dombiman.'); };
    tools.append(l); });
  return { say, talk, plan, render, VOICES, real, ready, get voice() { return voice; }, set voice(v) { voice = v; preload(); } };
})();
window.DOMBI = DOMBI;
