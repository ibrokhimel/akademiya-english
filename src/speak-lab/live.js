// The Gemini Live session: a short-lived token from our server, then the browser talks to Gemini itself.
// connectLive({ server, pack, topic, profile, handlers }) -> { sendAudio(Int16Array), sendText(text), close() }
// handlers: onAudio(Int16Array) · onCaption(text, final) · onLearnerText(text, final) · onInterrupted() · onTurnComplete() · onToolCall(name, args) · onClose(reason) · onOpen()
import { CFG } from './config.js';
import { pcmToBase64, base64ToPcm } from './audio.js';
import { nextReconnect } from './rules.js';

let sdk = null;
const loadSdk = async () => (sdk ||= await import(CFG.SDK));

async function fetchToken(server, body) {
  const r = await fetch(server + '/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'token ' + r.status); e.status = r.status; e.body = j; throw e; }
  return j;
}

export async function connectLive({ server = CFG.SERVER, pack, topic = '', profile = {}, handlers: H }) {
  const { GoogleGenAI } = await loadSdk();
  let session = null, closedByUs = false, handle = null, attempt = 0, lastConfig = null;

  const onMessage = (m) => {
    const sc = m.serverContent;
    if (m.sessionResumptionUpdate) { if (m.sessionResumptionUpdate.resumable && m.sessionResumptionUpdate.newHandle) handle = m.sessionResumptionUpdate.newHandle; }
    if (m.goAway) { closeSocket(); return reconnect(); }
    if (m.toolCall && m.toolCall.functionCalls) {
      const responses = m.toolCall.functionCalls.map((f) => { try { H.onToolCall && H.onToolCall(f.name, f.args || {}); } catch (e) { console.error(e); } return { id: f.id, name: f.name, response: { ok: true } }; });
      try { session.sendToolResponse({ functionResponses: responses }); } catch (e) { console.error(e); }
    }
    if (!sc) return;
    if (sc.interrupted) H.onInterrupted && H.onInterrupted();
    if (sc.modelTurn && sc.modelTurn.parts) for (const p of sc.modelTurn.parts) if (p.inlineData && p.inlineData.data) H.onAudio && H.onAudio(base64ToPcm(p.inlineData.data));
    if (sc.outputTranscription && sc.outputTranscription.text) H.onCaption && H.onCaption(sc.outputTranscription.text, false);
    if (sc.inputTranscription && sc.inputTranscription.text) H.onLearnerText && H.onLearnerText(sc.inputTranscription.text, false);
    if (sc.turnComplete) { H.onCaption && H.onCaption('', true); H.onLearnerText && H.onLearnerText('', true); H.onTurnComplete && H.onTurnComplete(); }
  };

  function closeSocket() { const s = session; session = null; if (s) { try { s.close(); } catch {} } }

  async function open() {
    const { token, model, config } = await fetchToken(server, { pack, topic, profile });
    lastConfig = config;
    const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: CFG.API_VERSION } });
    const cfg = handle ? { ...config, sessionResumption: { handle } } : config;
    let opened = false;
    session = await ai.live.connect({ model, config: cfg, callbacks: {
      onopen: () => { opened = true; attempt = 0; H.onOpen && H.onOpen(); },
      onmessage: onMessage,
      onerror: (e) => console.warn('live error', e && e.message),
      onclose: (e) => { if (closedByUs) return; console.warn('live closed', e && e.reason); session = null; reconnect(); },
    } });
    return opened;
  }

  async function reconnect() {
    const wait = nextReconnect(attempt++);
    if (wait == null) { H.onClose && H.onClose('lost'); return; }
    await new Promise((r) => setTimeout(r, wait));
    try { await open(); } catch (e) { console.warn('reconnect failed', e.message); reconnect(); }
  }

  await open();
  return {
    sendAudio(pcm) { if (session) try { session.sendRealtimeInput({ audio: { data: pcmToBase64(pcm), mimeType: 'audio/pcm;rate=16000' } }); } catch (e) { console.warn(e.message); } },
    sendText(text) { if (session) try { session.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); } catch (e) { console.warn(e.message); } },
    close() { closedByUs = true; closeSocket(); },
    config: () => lastConfig,
  };
}
