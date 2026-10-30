// The Gemini Live session: a short-lived token from our server, then the browser talks to Gemini itself.
// connectLive({ server, pack, topic, profile, mic, handlers }) -> { sendAudio(Int16Array), sendText(text), activityStart(), activityEnd(), setMic(mode, lines), close() }
// mic: 'auto' (Gemini detects speech) or 'hold' (the page sends activity start / end: hold-to-talk)
// handlers: onAudio(Int16Array) · onCaption(text, final) · onLearnerText(text, final) · onInterrupted() · onTurnComplete() · onToolCall(name, args) · onClose(reason) · onOpen()
// Test-only options: sdk (the SDK module), getToken(body), waits (reconnect delays), connectTimeoutMs.
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

export async function connectLive({ server = CFG.SERVER, pack, voice = '', topic = '', profile = {}, mic = 'auto', handlers: H, sdk: sdkIn = null, getToken = null, waits = null, connectTimeoutMs = CFG.CONNECT_TIMEOUT_MS }) {
  const { GoogleGenAI } = sdkIn || (await loadSdk());
  const token = getToken || ((body) => fetchToken(server, body));
  const delay = waits ? (n) => waits[n] ?? null : nextReconnect;
  // `current` is the one live socket; messages and closes from any other socket are ignored, so a closed socket can never reopen itself
  let current = null, closedByUs = false, handle = null, attempt = 0, reconnecting = false, lastConfig = null, micMode = mic, probing = false;

  const stats = {}, bump = (k) => { stats[k] = (stats[k] || 0) + 1; };           // what kinds of messages came, for the checks and the test bar
  const onMessage = (me, m) => {
    if (me !== current || closedByUs) return;
    const sc = m.serverContent;
    for (const k of Object.keys(m)) bump(k); if (sc) for (const k of Object.keys(sc)) bump('serverContent.' + k);
    if (m.sessionResumptionUpdate) { if (m.sessionResumptionUpdate.resumable && m.sessionResumptionUpdate.newHandle) handle = m.sessionResumptionUpdate.newHandle; }
    if (m.goAway) { dropCurrent(); reconnect(); return; }
    if (m.toolCall && m.toolCall.functionCalls) {
      const responses = m.toolCall.functionCalls.map((f) => { try { H.onToolCall && H.onToolCall(f.name, f.args || {}); } catch (e) { console.error(e); } return { id: f.id, name: f.name, response: { ok: true } }; });
      try { me.s.sendToolResponse({ functionResponses: responses }); } catch (e) { console.error(e); }
    }
    if (!sc) return;
    if (sc.interrupted) H.onInterrupted && H.onInterrupted();
    if (sc.modelTurn && sc.modelTurn.parts) for (const p of sc.modelTurn.parts) if (p.inlineData && p.inlineData.data) H.onAudio && H.onAudio(base64ToPcm(p.inlineData.data));
    if (sc.outputTranscription && sc.outputTranscription.text) H.onCaption && H.onCaption(sc.outputTranscription.text, false);
    if (sc.inputTranscription && sc.inputTranscription.text) H.onLearnerText && H.onLearnerText(sc.inputTranscription.text, false);
    // the learner's line is filed first: it came before the reply it belongs to
    if (sc.turnComplete) { H.onLearnerText && H.onLearnerText('', true); H.onCaption && H.onCaption('', true); H.onTurnComplete && H.onTurnComplete(); }
  };

  function dropCurrent() { const me = current; current = null; if (me && me.s) { try { me.s.close(); } catch {} } }

  async function open() {
    const { token: tok, model, config } = await token({ pack, voice, topic, profile, mic: micMode });
    lastConfig = config;
    const ai = new GoogleGenAI({ apiKey: tok, httpOptions: { apiVersion: CFG.API_VERSION } });
    const cfg = handle ? { ...config, sessionResumption: { handle } } : config;
    const me = { s: null }; let timedOut = false;
    const connect = ai.live.connect({ model, config: cfg, callbacks: {
      onopen: () => { if (me === current) { attempt = 0; H.onOpen && H.onOpen(); } },
      onmessage: (m) => onMessage(me, m),
      onerror: (e) => console.warn('live error', e && e.message),
      onclose: (e) => { if (closedByUs || me !== current) return; if (probing) { current = null; return; } console.warn('live closed', e && e.reason); current = null; reconnect(); },
    } });
    const timeout = new Promise((_, rej) => setTimeout(() => { timedOut = true; rej(new Error('connect timeout')); }, connectTimeoutMs));
    current = me;                                                         // from here its callbacks count
    try { me.s = await Promise.race([connect, timeout]); }
    catch (e) { if (current === me) current = null; connect.then((s) => { try { s.close(); } catch {} }).catch(() => {}); throw e; }
    if (timedOut || closedByUs) { try { me.s.close(); } catch {} current = null; throw new Error('closed'); }
    attempt = 0; H.onOpen && H.onOpen();
  }

  async function reconnect() {
    if (closedByUs || reconnecting) return; reconnecting = true;
    try {
      while (!closedByUs) {
        const wait = delay(attempt++);
        if (wait == null) { H.onClose && H.onClose('lost'); return; }
        await new Promise((r) => setTimeout(r, wait));
        if (closedByUs) return;
        try { await open(); return; } catch (e) { console.warn('reconnect failed', e.message); }
      }
    } finally { reconnecting = false; }
  }

  await open();
  return {
    sendAudio(pcm) { if (current && current.s) try { current.s.sendRealtimeInput({ audio: { data: pcmToBase64(pcm), mimeType: 'audio/pcm;rate=16000' } }); } catch (e) { console.warn(e.message); } },
    activityStart() { if (current && current.s) try { current.s.sendRealtimeInput({ activityStart: {} }); } catch (e) { console.warn(e.message); } },
    activityEnd() { if (current && current.s) try { current.s.sendRealtimeInput({ activityEnd: {} }); } catch (e) { console.warn(e.message); } },
    // a new mic mode: a new token and socket. First the same conversation (resumption handle); if Gemini drops that within a
    // moment, a fresh session that gets the last lines of the talk, so Dombi carries on. Resolves 'resumed' | 'fresh'.
    async setMic(mode, lines = []) {
      micMode = mode === 'hold' ? 'hold' : 'auto'; probing = true; dropCurrent();
      try {
        if (handle) { try { await open(); await new Promise((r) => setTimeout(r, 1500)); if (closedByUs) return 'closed'; if (current) return 'resumed'; } catch (e) { console.warn('resume failed', e.message); } }
        if (closedByUs) return 'closed';                                    // End was pressed during the switch
        handle = null; await open();
        if (lines.length) this.sendText('[The mic mode changed and you reconnected. The talk so far:\n' + lines.join('\n') + '\nCarry on from where you were. Do not mention this note.]');
        return 'fresh';
      } finally { probing = false; }
    },
    sendText(text) { if (current && current.s) try { current.s.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); } catch (e) { console.warn(e.message); } },
    close() { closedByUs = true; dropCurrent(); },
    config: () => lastConfig,
    stats: () => stats,
  };
}
