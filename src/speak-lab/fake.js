// A scripted Gemini for the checks (?fake=1): the same shape as live.js, driven by the check through window.SPEAK.fake.
// window.FAKE = { turns: [{ caption, mood, audioMs }], feedback?, explain?, slower?, report?, token? }
export async function connectFake({ handlers: H }) {
  const F = window.FAKE || { turns: [] };
  if (F.token === 'budget') { const e = new Error('budget'); e.status = 402; e.body = { reason: 'budget', spent: 10.5, budget: 10 }; throw e; }
  let i = 0, closed = false;
  const sent = { audioChunks: 0, texts: [] };
  const silence = (ms) => { const a = new Int16Array(Math.round(ms * 24)); for (let i = 0; i < a.length; i++) a[i] = Math.round(Math.sin(i / 24000 * 2 * Math.PI * 220) * 2500); return a; };   // a quiet tone, so the level meter and the mouth have something to follow
  async function play(turn) {
    if (closed) return;
    if (turn.mood) H.onToolCall && H.onToolCall('set_mood', { mood: turn.mood });
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
    sendText(t) { sent.texts.push(t); if (/almost up/.test(t)) setTimeout(() => play({ caption: 'Xayr! Keyingi safar davom etamiz.', mood: 'happy', audioMs: 2500 }), 200); },   // the goodbye is spoken, like Gemini would
    close() { closed = true; },
    config: () => ({ fake: true }),
  };
}
