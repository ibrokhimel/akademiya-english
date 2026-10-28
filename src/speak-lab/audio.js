// Mic in and Dombi out. The mic gives 16 kHz 16-bit mono chunks for Gemini Live; the player plays Gemini's 24 kHz PCM gap-free.
const IN_RATE = 16000, OUT_RATE = 24000;

export function pcmToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function base64ToPcm(b64) {
  const s = atob(b64), bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return new Int16Array(bytes.buffer, 0, bytes.length >> 1);
}

const WORKLET = new URL('./pcm-worklet.js', import.meta.url).href;
let ctx = null;
export const audioContext = () => (ctx ||= new AudioContext());

// startMic(onChunk) -> { stop(), amp() }: echo cancellation on (hands-free with speakers), ~100 ms chunks of 16 kHz PCM, amp 0–100
export async function startMic(onChunk) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
  const ac = audioContext(); await ac.resume();
  await ac.audioWorklet.addModule(WORKLET);
  const src = ac.createMediaStreamSource(stream), node = new AudioWorkletNode(ac, 'pcm-capture', { processorOptions: { inRate: ac.sampleRate, outRate: IN_RATE } });
  let amp = 0;
  node.port.onmessage = (e) => { if (e.data.amp != null) amp = e.data.amp; if (e.data.pcm) onChunk(new Int16Array(e.data.pcm)); };
  src.connect(node);                                                   // the worklet keeps the graph alive without reaching the speakers
  return { stop() { node.port.onmessage = null; src.disconnect(); node.disconnect(); stream.getTracks().forEach((t) => t.stop()); }, amp: () => amp };
}

// makePlayer() -> { push(Int16Array), clear(), amp(), onIdle(cb), playing() }: buffers scheduled back to back on one clock
export function makePlayer() {
  const ac = audioContext();
  let at = 0, sources = new Set(), last = 0, idleCb = null, gain = ac.createGain(); gain.connect(ac.destination);
  const tick = () => { if (sources.size === 0 && idleCb) idleCb(); };
  return {
    push(int16) {
      const buf = ac.createBuffer(1, int16.length, OUT_RATE), ch = buf.getChannelData(0);
      let peak = 0; for (let i = 0; i < int16.length; i++) { ch[i] = int16[i] / 32768; const a = Math.abs(ch[i]); if (a > peak) peak = a; }
      if (sources.size === 0) { const n = Math.min(120, ch.length); for (let i = 0; i < n; i++) ch[i] *= i / n; }   // a 5 ms fade-in at the start of a stream: no click
      if (gain.gain.value < 1) { gain.gain.cancelScheduledValues(ac.currentTime); gain.gain.setValueAtTime(1, ac.currentTime); }
      last = Math.min(100, Math.round(peak * 140));
      const s = ac.createBufferSource(); s.buffer = buf; s.connect(gain);
      const now = ac.currentTime; if (at < now + 0.02) at = now + 0.02;                   // a little lead so the first chunk is never late
      s.start(at); at += buf.duration; sources.add(s); s.onended = () => { sources.delete(s); if (sources.size === 0) { last = 0; tick(); } };
    },
    // stopping mid-word: a 25 ms fade instead of a cut, then the sources go
    clear() {
      const old = [...sources]; sources.clear(); at = 0; last = 0; if (!old.length) return;
      const t = ac.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + 0.025);
      for (const s of old) { s.onended = null; try { s.stop(t + 0.03); } catch {} }
      if (idleCb) idleCb();
    },
    amp: () => (sources.size ? last : 0),
    playing: () => sources.size > 0,
    onIdle(cb) { idleCb = cb; },
  };
}
