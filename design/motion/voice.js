// The voice: the mic's level for everything that follows it (the listening bars, the rings round the mic, Dombi).
// Loaded on every page after motion.js.
// VOICE.open() asks the browser for the mic and resolves true when it is given. VOICE.bands(n) = n levels 0-1 across the voice's range, low to high.
const VOICE = (() => {
  let stream = null, ac = null, an = null, buf = null, opening = null;
  const open = () => opening || (opening = (async () => {
    try { stream = await Promise.race([navigator.mediaDevices.getUserMedia({ audio: true }), new Promise((_, no) => setTimeout(() => no(new Error('no answer')), 15000))]);
      ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 1024; an.minDecibels = -85; an.maxDecibels = -25; an.smoothingTimeConstant = 0.5;
      ac.createMediaStreamSource(stream).connect(an); buf = new Uint8Array(an.frequencyBinCount); return true;
    } catch (e) { opening = null; return false; } })());                                          // no mic, or the answer was no: the lab plays a made-up voice instead
  const close = () => { if (stream) stream.getTracks().forEach((t) => t.stop()); if (ac) ac.close(); stream = ac = an = buf = opening = null; };   // the browser's "recording" mark goes out
  const bands = (n) => { an.getByteFrequencyData(buf); const hz = ac.sampleRate / an.fftSize, edge = (i) => 110 * Math.pow(32, i / n) / hz, out = [];   // 110 Hz to 3.5 kHz in steps that are even to the ear
    for (let i = 0; i < n; i++) { const a = Math.floor(edge(i)), b = Math.max(a + 1, Math.floor(edge(i + 1))); let sum = 0; for (let k = a; k < b; k++) sum += buf[k];
      out.push(Math.max(0, Math.min(1, (sum / (b - a) / 255 - 0.3) / 0.5))); }                    // under 0.3 is the room, not a voice
    return out; };
  return { open, close, bands, get on() { return !!an; } };
})();
// Listen once and report on every frame what is heard: onLevel(level 0-1, bands low to high).
// real: use the mic; it ends when the speaker has been quiet for 0.7 s and gives up after 5 s with no voice. Otherwise, or with no mic, a made-up voice of ms.
// Resolves 'heard' or 'silent', or null when alive() says the moment has passed. keep: leave the mic open afterwards.
async function hearVoice({ n = 4, ms = 1500, loud = true, real = false, keep = false, alive = () => true, onLevel }) {
  const mic = real && await VOICE.open(), none = Array(n).fill(0);
  return new Promise((done) => { const t0 = performance.now(); let spoke = 0, quiet = 0, last = t0;
    const end = (r) => { onLevel(0, none); if (mic && !keep) VOICE.close(); done(r); };
    const tick = (now) => { if (!alive()) return end(null); const dt = now - last, age = now - t0; last = now;
      if (mic) { if (!VOICE.on) return end(null); const b = VOICE.bands(n), level = Math.max(...b) * 0.6 + b.reduce((a, v) => a + v, 0) / n * 0.4; onLevel(level, b);
        if (age > 350) { if (level > 0.22) { spoke += dt; quiet = 0; } else quiet += dt; }                   // the first moment does not count: the mic's own "on" sound may still be in the room
        if (spoke < 150 && quiet > 1500) spoke = 0;                                                           // a knock or a cough is not an answer
        if (spoke >= 150 && quiet > 700) return end('heard'); if (!spoke && age > 5000) return end('silent'); if (age > 12000) return end(spoke >= 150 ? 'heard' : 'silent'); }
      else { const t = age / (ms * M.slow); if (t >= 1) return end(loud ? 'heard' : 'silent');
        const level = loud ? Math.max(0, Math.sin(t * Math.PI * 4.2)) * (0.55 + 0.35 * Math.sin(t * 9)) + 0.06 : 0; onLevel(level, none.map((_, i) => level * (0.72 + 0.28 * Math.sin(i * 2.1 + t * 23)))); }
      requestAnimationFrame(tick); };
    requestAnimationFrame(tick); });
}
// Bars that follow the voice. At rest each bar is a dot, as tall as it is wide, and a soft glow runs along the row. The low notes of the voice move the middle bars and the middle rises
// highest; a bar jumps up fast and settles down slower. bars: the elements, left to right · max: the tallest a bar gets, px. Returns draw(level, bands).
function voiceBars(bars, max) {
  const n = bars.length, c = (n - 1) / 2, w = parseFloat(getComputedStyle(bars[0]).width), v = bars.map(() => 0); let last = performance.now();
  bars.forEach((b) => { b.style.borderRadius = w + 'px'; b.style.height = w + 'px'; b.style.flex = 'none'; });
  return (level = 0, bands = []) => { const now = performance.now(), dt = Math.min(now - last, 50), up = 1 - Math.exp(-dt / 35), down = 1 - Math.exp(-dt / 160); last = now;
    bars.forEach((b, i) => { const d = Math.abs(i - c), k = Math.min(bands.length - 1, Math.floor(d)), k2 = Math.min(bands.length - 1, k + 1);
      const band = bands.length ? (i > c ? bands[k] * 0.6 + bands[k2] * 0.4 : bands[k]) : level;           // the right side leans on the next band up, so the two sides are close but not a mirror
      const to = Math.min(1, (band * 0.7 + level * 0.3) * (1 - 0.45 * Math.pow(d / (c || 1), 1.4)) * 1.15);
      v[i] += (to - v[i]) * (to > v[i] ? up : down); b.style.height = (w + (max - w) * v[i]).toFixed(1) + 'px';
      b.style.opacity = v[i] > 0.04 ? 1 : (0.55 + 0.45 * Math.max(0, Math.sin(now / 190 - i * 0.9))).toFixed(2); }); };       // in the quiet a soft glow runs along the dots: it is listening

}
