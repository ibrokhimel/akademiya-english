// The real Gemini calls, behind one small object so the tests can hand the server a fake instead.
import { GoogleGenAI } from '@google/genai';

export const MODELS = { live: 'gemini-3.8-live', liveFallback: 'gemini-2.5-flash-native-audio-latest', text: 'gemini-3.8-flash', tts: 'gemini-3.8-flash-tts' };

export function makeGemini(apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  return {
    // a short-lived token the browser uses to open the Live socket itself; `constraints` = { uses, expireTime, liveConnectConstraints }
    async token(constraints) { const t = await ai.authTokens.create({ config: constraints }); return t.name; },
    // the text model; `parts` = [{ text }] or [{ inlineData: { mimeType, data } }, { text }]; with json: true the reply is parsed
    async flash(parts, { json = false, system } = {}) {
      const r = await ai.models.generateContent({ model: MODELS.text, contents: [{ role: 'user', parts }],
        config: { ...(system ? { systemInstruction: system } : {}), ...(json ? { responseMimeType: 'application/json' } : {}) } });
      return json ? JSON.parse(r.text) : r.text;
    },
    // speech from the TTS model: base64 PCM (24 kHz). The TTS models take no system instruction, so the style rides in the prompt.
    async tts(text, voice, style) {
      const prompt = `### DIRECTOR'S NOTES (do not read aloud)\nStyle: ${style}\n\n#### TRANSCRIPT (speak only this)\n${text}`;
      const r = await ai.models.generateContent({ model: MODELS.tts, contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
      return r.candidates[0].content.parts[0].inlineData.data;
    },
  };
}
