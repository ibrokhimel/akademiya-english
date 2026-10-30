// A scripted Gemini for the checks (?fake=1): the same shape as live.js, driven by the check through window.SPEAK.fake.
// window.FAKE = { turns: [{ caption, mood, audioMs } | { chunks: [{ text, audioMs }] }], feedback?, explain?, slower?, report?, token? }
export async function connectFake({ handlers: H }) {
  const F = window.FAKE || { turns: [] };
  if (F.token === 'budget') { const e = new Error('budget'); e.status = 402; e.body = { reason: 'budget', spent: 10.5, budget: 10 }; throw e; }
  let i = 0, closed = false, gen = 0;                                     // gen: a mic switch drops the socket, so the turn on it stops
  const sent = { audioChunks: 0, texts: [], events: [], mic: [] };      // events: activity start / end and mic switches, in order
  const silence = (ms) => { const a = new Int16Array(Math.round(ms * 24)); for (let i = 0; i < a.length; i++) a[i] = Math.round(Math.sin(i / 24000 * 2 * Math.PI * 220) * 2500); return a; };   // a quiet tone, so the level meter and the mouth have something to follow
  async function play(turn) {
    const g = gen, dead = () => closed || g !== gen;
    if (dead()) return;
    if (turn.chunks) {                                                        // a check controls which words arrive with which sound
      let total = 0;
      for (const c of turn.chunks) { if (dead()) return; H.onAudio && H.onAudio(silence(c.audioMs)); H.onCaption && H.onCaption(c.text, false); total += c.audioMs; await new Promise((r) => setTimeout(r, 120)); }
      await new Promise((r) => setTimeout(r, Math.max(0, total - 120 * turn.chunks.length) + 150));
      if (dead()) return;
      H.onLearnerText && H.onLearnerText('', true); H.onCaption && H.onCaption('', true); H.onTurnComplete && H.onTurnComplete(); return;
    }
    const words = (turn.caption || '').split(' '), half = Math.ceil(words.length / 2);
    H.onAudio && H.onAudio(silence((turn.audioMs || 600) / 2)); H.onCaption && H.onCaption(words.slice(0, half).join(' ') + ' ', false);
    await new Promise((r) => setTimeout(r, 120));
    H.onAudio && H.onAudio(silence((turn.audioMs || 600) / 2)); H.onCaption && H.onCaption(words.slice(half).join(' '), false);
    await new Promise((r) => setTimeout(r, (turn.audioMs || 600) + 150));
    H.onLearnerText && H.onLearnerText('', true); H.onCaption && H.onCaption('', true); H.onTurnComplete && H.onTurnComplete();
  }
  const api = {
    next() { if (i < F.turns.length) return play(F.turns[i++]); },         // Dombi's next scripted turn
    learner(text) { H.onLearnerText && H.onLearnerText(text, false); },      // what Gemini heard the learner say
    interrupt() { H.onInterrupted && H.onInterrupted(); },
    drop() { H.onClose && H.onClose('lost'); },
    sent,
  };
  window.SPEAK = window.SPEAK || {}; window.SPEAK.fake = api;
  setTimeout(() => { H.onOpen && H.onOpen(); api.next(); }, 200);           // Dombi speaks first
  return {
    sendAudio() { sent.audioChunks++; },
    activityStart() { sent.events.push('start'); },
    activityEnd() { sent.events.push('end'); },
    setMic(mode, lines) { gen++; sent.events.push('mic:' + mode); sent.mic.push({ mode, lines }); return new Promise((r, rej) => setTimeout(() => (F.setMicFail ? rej(new Error('switch failed')) : r('resumed')), 150)); },
    sendText(t) { sent.texts.push(t); if (/almost up/.test(t)) setTimeout(() => play({ caption: 'Xayr! Keyingi safar davom etamiz.', mood: 'happy', audioMs: 2500 }), 200); },   // the goodbye is spoken, like Gemini would
    close() { closed = true; },
    config: () => ({ fake: true }),
  };
}
