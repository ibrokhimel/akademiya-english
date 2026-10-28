// The speak lab's server: holds the key, mints Live tokens, runs the text-model side calls, logs talks.
//   node server.js   ->  http://127.0.0.1:8797   (the key in ./.env as GEMINI_API_KEY=…)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODELS } from './gemini.js';
import { buildSystemPrompt as buildPrompt, promptFile } from './prompts.js';
import { ledger } from './cost.js';
import { writeTalk } from './log.js';
import { CFG } from '../config.js';

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const history = (h) => (Array.isArray(h) ? h.slice(-4).map((t) => `${t.who === 'dombi' ? 'Dombi' : 'Learner'}: ${str(t.text)}`).join('\n') : '');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8797, ORIGIN = 'http://127.0.0.1:8791';
// the six personality packs and their Gemini voices (spec §4.8)
export const PACKS = { kind: 'Puck', rude: 'Zephyr', funny: 'Fenrir', drama: 'Aoede', dangasa: 'Charon', couple: 'Leda' };

export function readEnv(file = path.join(HERE, '.env')) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m) env[m[1]] = m[2]; }
  return env;
}

// the Live connect config the browser passes through unchanged
export function liveConfig(pack, systemInstruction) {
  return {
    responseModalities: ['AUDIO'],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: PACKS[pack] } } },
    ...(systemInstruction ? { systemInstruction } : {}),
    // the recogniser is told which languages to expect, so Uzbek is not heard as Turkish or Spanish
    inputAudioTranscription: { languageCodes: ['en-US', 'uz-UZ'] }, outputAudioTranscription: { languageCodes: ['en-US', 'uz-UZ'] },
    enableAffectiveDialog: true, proactivity: { proactiveAudio: true },
    sessionResumption: {}, contextWindowCompression: { slidingWindow: {} },
    tools: [{ functionDeclarations: [{ name: 'set_mood', description: 'Show the mood of what you are about to say on your face.',
      parameters: { type: 'OBJECT', properties: { mood: { type: 'STRING', description: 'happy, laugh, think, surprised, proud, oops, wink, confused, sleepy, focus or smirk' } }, required: ['mood'] } }] }],
  };
}

const json = (s, code, body) => { s.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ORIGIN }); s.end(JSON.stringify(body)); };
const readBody = (q) => new Promise((res, rej) => { let d = ''; q.on('data', (c) => { d += c; if (d.length > 30e6) rej(new Error('too big')); }); q.on('end', () => { try { res(d ? JSON.parse(d) : {}); } catch (e) { rej(e); } }); });

export function createServer({ gemini, env, buildSystemPrompt = buildPrompt, logsDir = path.join(HERE, 'logs'), budgetUsd = CFG.MONTHLY_BUDGET_USD }) {
  const hasKey = !!env.GEMINI_API_KEY, book = ledger(logsDir);
  const routes = {
    'GET /health': async () => [200, { ok: true, model: MODELS.live, key: hasKey, monthTotal: book.monthTotal(), budget: budgetUsd }],
    'POST /token': async (b) => {
      if (!hasKey) return [503, { error: 'no key' }];
      if (!PACKS[b.pack]) return [400, { error: 'unknown pack' }];
      const spent = book.monthTotal(); if (spent >= budgetUsd) return [402, { reason: 'budget', spent, budget: budgetUsd }];
      const system = buildSystemPrompt ? buildSystemPrompt({ pack: b.pack, topic: b.topic || '', profile: b.profile || {} }) : null;
      const config = liveConfig(b.pack, system);
      const token = await gemini.token({ uses: 1, expireTime: new Date(Date.now() + 30 * 60e3).toISOString(),
        liveConnectConstraints: { model: 'models/' + MODELS.live, config: { responseModalities: config.responseModalities, speechConfig: config.speechConfig, ...(system ? { systemInstruction: system } : {}) } } });
      return [200, { token, model: MODELS.live, config }];
    },
    // the learner's last turn → "say it better" and one pronunciation note, as text for the cards (spec §4.2)
    'POST /feedback': async (b) => {
      if (!hasKey) return [503, { error: 'no key' }];
      const parts = [];
      if (str(b.audio)) parts.push({ inlineData: { mimeType: 'audio/pcm;rate=16000', data: b.audio } });
      parts.push({ text: `Last turns:\n${history(b.history)}\n\nLearner's last turn as heard: "${str(b.learnerText)}"\nDombi's reply: "${str(b.dombiText)}"\nLevel so far: ${str(b.level) || 'unknown'}` });
      const j = (await gemini.flash(parts, { json: true, system: promptFile('feedback.md') })) || {};
      return [200, { better: str(j.better), pron: str(j.pron), level: str(j.level) }];
    },
    // one of Dombi's lines, explained in natural Uzbek under the caption (spec §4.2)
    'POST /explain': async (b) => {
      if (!hasKey) return [503, { error: 'no key' }];
      if (!str(b.line)) return [400, { error: 'no line' }];
      const uz = await gemini.flash([{ text: `Last turns:\n${history(b.history)}\n\nThe line to explain: "${str(b.line)}"` }], { system: promptFile('explain.md') });
      return [200, { uz: str(uz) }];
    },
    // the end of a talk: stars, the phrases to keep, pronunciation notes, the level, and what Dombi should remember (spec §4.6–4.7)
    'POST /report': async (b) => {
      if (!hasKey) return [503, { error: 'no key' }];
      const lines = Array.isArray(b.transcript) ? b.transcript.map((t) => `${t.who === 'dombi' ? 'Dombi' : 'Learner'}: ${str(t.text)}`).join('\n') : '';
      const cards = Array.isArray(b.cards) ? b.cards.map((c) => `${c.kind}: ${str(c.text)}`).join('\n') : '';
      const text = `Pack: ${str(b.pack)}. Topic: ${str(b.topic) || 'free'}.\nLearner profile: ${JSON.stringify(b.profile || {})}\n\nTranscript:\n${lines}\n\nCards shown:\n${cards || '(none)'}`;
      const j = (await gemini.flash([{ text }], { json: true, system: promptFile('report.md') })) || {};
      const stars = Math.max(1, Math.min(3, Number(j.stars) || 1));
      const phrases = (Array.isArray(j.phrases) ? j.phrases : []).map((p) => ({ en: str(p && p.en), uz: str(p && p.uz) })).filter((p) => p.en).slice(0, 5);
      const pron = (Array.isArray(j.pron) ? j.pron : []).map(str).filter(Boolean).slice(0, 3);
      const u = j.profileUpdate || {};
      return [200, { stars, why: str(j.why), phrases, pron, level: str(j.level), profileUpdate: { interests: Array.isArray(u.interests) ? u.interests.map(str).filter(Boolean) : [], mistakes: Array.isArray(u.mistakes) ? u.mistakes.map(str).filter(Boolean) : [], lastTalk: str(u.lastTalk) } }];
    },
    // the end of a talk: the talk's folder under logs/ and the month's running total
    'POST /log': async (b) => {
      const folder = writeTalk(logsDir, b);
      const { cost, monthTotal } = book.add({ id: b.id, secIn: Number(b.secIn) || 0, secOut: Number(b.secOut) || 0 });
      return [200, { folder, cost, monthTotal, budget: budgetUsd }];
    },
    // the same line again, slowly, in the pack's voice; base64 PCM at 24 kHz
    'POST /slower': async (b) => {
      if (!hasKey) return [503, { error: 'no key' }];
      if (!str(b.line)) return [400, { error: 'no line' }];
      const pcm = await gemini.tts(str(b.line), Object.values(PACKS).includes(b.voice) ? b.voice : PACKS.kind, 'Slow and clear, each word separate, a small pause between phrases, the same friendly tone; the words exactly as written.');
      return [200, { pcm }];
    },
  };
  return http.createServer(async (q, s) => {
    if (q.method === 'OPTIONS') { s.writeHead(204, { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST' }); return s.end(); }
    const route = routes[q.method + ' ' + q.url.split('?')[0]];
    if (!route) return json(s, 404, { error: 'no such route' });
    try { const [code, body] = await route(await readBody(q)); json(s, code, body); }
    catch (e) { console.error(e); json(s, 500, { error: String(e.message || e) }); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const env = readEnv();
  const { makeGemini } = await import('./gemini.js');
  createServer({ gemini: env.GEMINI_API_KEY ? makeGemini(env.GEMINI_API_KEY) : null, env })
    .listen(PORT, '127.0.0.1', () => console.log(`Speak lab server at http://127.0.0.1:${PORT}/ ${env.GEMINI_API_KEY ? '(key loaded)' : '(NO KEY: put GEMINI_API_KEY=… in server/.env)'}`));
}
