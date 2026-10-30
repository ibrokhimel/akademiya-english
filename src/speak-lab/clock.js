// The word clock (spec 2026-10-30 in-sync §4.1): when each word of his turn plays, on the performance.now() clock.
// Gemini sends his voice and his words with no word times, so each word gets a natural length from its sounds (`weigh`,
// the lip-sync durations) and they are laid end to end from his first sound at the talk's speaking rate. A quiet gap in
// his real audio pins the word after the nearest pause; a finished turn is fitted to the sound it really had.
// makeClock({ weigh, rate? }) -> { start, text, audio, close, quiet, words, wordAt, startOf, endOf, sentenceOf, sentences, rate }
const WORD = /[\p{L}\p{M}\p{N}'ʻ‘’`ʼ-]+|[.,!?;:…]+/gu, PAUSE_FIND_MS = 400;

export function tokenize(text) {
  const out = [];
  for (const m of (text || '').matchAll(WORD)) {
    if (/^[.,!?;:…]+$/.test(m[0])) { if (out.length) out[out.length - 1].punct += m[0]; continue; }
    if (/[\p{L}\p{N}]/u.test(m[0])) out.push({ text: m[0], punct: '' });          // a lone dash is not a word
  }
  return out;
}

export function makeClock({ weigh, rate: rate0 = 1 }) {
  let startAt = null, audioMs = 0, closed = false, W = [], anchors = [], lay = null;
  const guards = new Map();                                                     // reader -> { t, k }: its last time and word
  const dirty = () => { lay = null; };

  // natural offsets: N[k] = where word k starts with its pauses counted, S[k] = its speech alone
  function layout() {
    if (lay) return lay;
    const n = W.length, N = [0], S = W.map((w) => weigh(w.text, '')), full = W.map((w) => weigh(w.text, w.punct));
    for (let k = 0; k < n; k++) N.push(N[k] + full[k]);
    const anc = [...(anchors.some((a) => a.k === 0) ? [] : [{ k: 0, at: startAt }]), ...anchors.filter((a) => a.k < n)].sort((a, b) => a.k - b.k);
    const start = new Array(n), end = new Array(n);
    anc.forEach((a, i) => {
      const to = i + 1 < anc.length ? anc[i + 1].k : n;
      // the last stretch is fitted to his real sound when the turn is finished (his last pause is not in the audio); while it
      // is still coming in, it runs at the talk's pace but never faster than the sound received so far covers
      let r = rate0;
      if (to < n && anc[i + 1].k > a.k) r = (anc[i + 1].at - a.at) / (N[anc[i + 1].k] - N[a.k]);   // between two known times: an exact fit
      else if (to === n && n > a.k) {
        const nat = N[n] - N[a.k] - (full[n - 1] - S[n - 1]), fit = nat > 0 && audioMs > 0 ? (startAt + audioMs - a.at) / nat : 0;
        if (closed && fit) r = Math.max(0.1, fit); else if (fit > r) r = fit;
      }
      for (let k = a.k; k < to; k++) { start[k] = a.at + (N[k] - N[a.k]) * r; end[k] = start[k] + S[k] * r; }
    });
    return (lay = { start, end, N, S, full });
  }
  const ready = () => startAt != null && W.length > 0;

  return {
    // his first sound for this turn starts at `atMs` (performance.now() time)
    start(atMs) { if (startAt == null) { startAt = atMs; dirty(); } },
    text(cleaned) { W = tokenize(cleaned); dirty(); },
    audio(totalMs) { audioMs = totalMs; dirty(); },
    close() { closed = true; dirty(); },
    // his audio was quiet from..to: the word after the nearest pause starts at `to`, if one is close enough
    quiet(fromMs, toMs) {
      if (!ready()) return;
      const { start } = layout(); let best = null;
      // quiet from before his first word: his first loud sound is where word 0 starts (his audio may open on silence)
      if (fromMs <= start[0]) { if (toMs > start[0]) { anchors = anchors.filter((a) => a.k !== 0).concat({ k: 0, at: toMs }); dirty(); } return; }
      for (let j = 0; j < W.length - 1; j++) {
        if (!/[.,!?;:…]/.test(W[j].punct) || start[j] >= fromMs) continue;    // the pause must come after word j began
        const d = Math.abs(start[j + 1] - toMs);
        if (d <= PAUSE_FIND_MS && (!best || d < best.d)) best = { k: j + 1, d };
      }
      if (!best) return;
      anchors = anchors.filter((a) => a.k !== best.k).concat({ k: best.k, at: toMs }); dirty();
    },
    words() { if (!ready()) return W.map((w, k) => ({ k, ...w, start: null, end: null })); const { start, end } = layout(); return W.map((w, k) => ({ k, ...w, start: start[k], end: end[k] })); },
    startOf(k) { return ready() && k >= 0 && k < W.length ? layout().start[k] : null; },
    endOf(k) { return ready() && k >= 0 && k < W.length ? layout().end[k] : null; },
    // the word playing at time t (-1 before his first word); as time moves forward it never steps back a word, for each
    // reader on its own (the subtitle and the action engine read the clock at different moments)
    wordAt(t, reader = 'show') {
      if (!ready()) return -1;
      const { start } = layout(); let k = -1;
      for (let i = 0; i < start.length && start[i] <= t; i++) k = i;
      const g = guards.get(reader) || { t: -Infinity, k: -1 };
      if (t >= g.t) { k = Math.max(k, g.k); guards.set(reader, { t, k }); }
      return k;
    },
    sentences() {
      const out = []; let from = 0;
      W.forEach((w, k) => { if (/[.!?…]/.test(w.punct) || k === W.length - 1) { out.push({ from, n: k - from + 1, complete: /[.!?…]/.test(w.punct) }); from = k + 1; } });
      return out;
    },
    sentenceOf(k) { return this.sentences().findIndex((s) => k >= s.from && k < s.from + s.n); },
    // how fast he spoke against the natural lengths: a finished turn's measure, carried to his next turn
    rate() {
      if (!closed || !W.length) return rate0;
      const { N, S, full } = layout(), nat = N[W.length] - (full[W.length - 1] - S[W.length - 1]);
      return nat > 0 && audioMs > 0 ? audioMs / nat : rate0;
    },
  };
}
