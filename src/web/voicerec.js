// The learner's own voice while they answer, for "Mening ovozim" (kept only when they chose to save it; record.js stores it).
//   const clip = await startClip()  ->  { stop() -> Promise<Blob|null> } or null when the browser cannot record
//   closeClips()                    the mic is let go at the end of a lesson, so the browser's "recording" mark goes out
let stream = null;
export async function startClip() {
  if (window.APP_TEST) return window.APP_TEST.clips ? { stop: async () => testClip() } : null;            // the checks: a short made-up sound
  try {
    if (!stream || !stream.active) stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream), parts = []; mr.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); }; mr.start();
    return { stop: () => new Promise((r) => { if (mr.state === 'inactive') return r(null); mr.onstop = () => r(parts.length ? new Blob(parts, { type: mr.mimeType || 'audio/webm' }) : null); mr.stop(); }) };
  } catch (e) { return null; }
}
export function closeClips() { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; }
// 0.6 s of a soft tone as a WAV file
function testClip() {
  const rate = 8000, n = rate * 0.6, b = new DataView(new ArrayBuffer(44 + n * 2)), str = (o, s) => [...s].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); b.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, rate, true); b.setUint32(28, rate * 2, true);
  b.setUint16(32, 2, true); b.setUint16(34, 16, true); str(36, 'data'); b.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) b.setInt16(44 + i * 2, Math.sin(i / rate * 2 * Math.PI * 220) * 3000 * Math.min(1, (n - i) / 800), true);
  return new Blob([b], { type: 'audio/wav' });
}
