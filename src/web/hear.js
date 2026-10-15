// What the learner said, as text. The phone app will use the phone's own recogniser.
// In the browser version: first choice is the speech-to-text server on this PC (src/stt/server.py, faster-whisper): the answer is
// recorded and sent there, and while the learner speaks the words so far come back every half second (onPartial).
// The browsers' own recognisers (Chrome, Edge) send the sound to Google or Microsoft, and on this PC they came back empty, so they
// are only the second choice. With neither (Firefox and no server) the lesson builds the answer from words (31c).
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const STT = 'http://127.0.0.1:8795';
let local = false;
// is the server on this PC running? Asked when the app opens and again before every answer while it is not.
export async function hearReady() {
  try { const r = await Promise.race([fetch(STT + '/health', { cache: 'no-store' }), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 2000))]); local = r.ok; } catch (e) { local = false; }
  if (window.APP) window.APP.hearing = local ? 'local' : SR ? 'browser' : 'none';
  return local ? 'local' : SR ? 'browser' : 'none';
}
export const canHear = () => local || !!SR;

// Starts listening now. done: what was understood (best first) · [] when nothing was understood · null when it cannot be used here.
// stop(): the speaker has finished. onPartial(text): the words so far, while the learner is still speaking.
export async function listen(lang = 'en-US', onPartial = () => {}) {
  if (!local) await hearReady();
  return local ? listenLocal(onPartial) : listenBrowser(lang, onPartial);
}

let stream = null;
const post = async (blob, partial) => { const r = await fetch(STT + '/stt' + (partial ? '?partial=1' : ''), { method: 'POST', body: blob }); return (await r.json()).text || ''; };
function listenLocal(onPartial) {
  let stopNow = null, over = false;
  const done = (async () => {
    try { if (!stream || !stream.active) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { return null; }
    const mr = new MediaRecorder(stream), parts = [], type = () => mr.mimeType || 'audio/webm';
    mr.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
    const stopped = new Promise((r) => { mr.onstop = r; }); mr.start(250);                          // a piece every 250 ms, so the words so far can be read while speaking
    // the words so far: every half second, whatever was said until now (one request at a time)
    let sent = 0, busy = false;
    const tick = setInterval(async () => { if (busy || over || parts.length <= sent || parts.length < 3) return; busy = true; sent = parts.length;
      try { const t = await post(new Blob(parts, { type: type() }), true); if (!over && t) onPartial(t); } catch (e) {} busy = false; }, 500);
    await new Promise((r) => { stopNow = r; if (over) r(); }); clearInterval(tick);
    if (mr.state !== 'inactive') mr.stop(); await stopped;
    const blob = new Blob(parts, { type: type() }); if (!blob.size) return [];
    try { const t = await post(blob, false); return t ? [t] : []; }
    catch (e) { local = false; return null; }                                                       // the server went away: the browser's own from now on
  })();
  return { done, stop() { over = true; if (stopNow) stopNow(); } };
}
// the mic is let go at the end of a lesson
export function closeHear() { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; }

function listenBrowser(lang, onPartial) {
  let r; try { r = new SR(); } catch (e) { return { done: Promise.resolve(null), stop() {} }; }
  r.lang = lang; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
  let alts = [], last = '', failed = false, over = false;
  const done = new Promise((res) => {
    r.onresult = (e) => { const out = []; for (const one of e.results) { if (one.isFinal) for (const a of one) out.push(a.transcript); else last = one[0].transcript; } if (out.length) alts = out;
      const now = [...e.results].map((x) => x[0].transcript).join(' ').trim(); if (now) onPartial(now); };
    r.onerror = (e) => { if (['not-allowed', 'service-not-allowed', 'network', 'audio-capture', 'language-not-supported'].includes(e.error)) failed = true; };
    r.onend = () => { over = true; res(failed ? null : alts.length ? alts.filter((a) => a.trim()) : last ? [last] : []); };
  });
  try { r.start(); } catch (e) { return { done: Promise.resolve(null), stop() {} }; }
  return { done, stop() { if (!over) try { r.stop(); } catch (e) {} } };
}
