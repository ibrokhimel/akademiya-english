// How does Dombi actually talk? A scripted learner talks to the real Live model (text in, his speech transcribed out),
// and the replies are scored for the assistant habits the owner called "generic AI".
//   node src/speak-lab/server/persona-check.js [pack ...]      (costs a few cents; needs the key in server/.env)
import { GoogleGenAI, Modality } from '@google/genai';
import { readEnv, liveConfig } from './server.js';
import { buildSystemPrompt } from './prompts.js';
import { MODELS } from './gemini.js';

const LEARNER = process.env.DEBUG ? ["[Start the conversation now: one short greeting and one question.]"] : [
  '[The learner just opened the app and is listening. Start the conversation now, in character: one short greeting and one question. Do not wait for them.]',
  'hello. I am fine. I go to bazaar yesterday',
  'I dont know',
  'I am tired today, many work',
  'Ronaldo or Messi?',
  "Men inglizchani yaxshi bilmayman",
  'can you say my name after every word? my name is Speed',
  'ok tell me something funny',
  'I want go to Korea for work',
];
// the habits the owner hears as "AI": stock praise, assistant phrases, filler questions
const STOCK = [/great (question|job)/i, /i'?m here to help/i, /that'?s (amazing|awesome|great|wonderful)/i, /have an amazing/i, /keep it positive/i, /what do you say\?/i, /tell me more/i, /that sounds (fun|great|interesting)/i, /i'?d love to (hear|know)/i, /how about you\?/i, /feel free/i, /\babsolutely\b/i, /\bcertainly\b/i, /you'?re doing great/i, /no worries/i, /don'?t worry/i, /\bof course\b/i, /let'?s (get started|practice)/i];

async function talk(ai, pack) {
  const config = liveConfig(pack, buildSystemPrompt({ pack, topic: 'their day today, what happened, what is next', profile: { name: '', goal: 'work' } }));
  let buf = '', done = null;
  // enableAffectiveDialog makes Gemini refuse typed turns ("invalid argument") on a key session; the persona lives in the prompt, so it is left out here
  const session = await ai.live.connect({ model: MODELS.live, config: { ...config, enableAffectiveDialog: undefined, sessionResumption: undefined }, callbacks: {
    onmessage: (m) => { if (process.env.DEBUG) console.log('msg', Object.keys(m).join(','), m.serverContent ? Object.keys(m.serverContent).join(',') : ''); const sc = m.serverContent; if (!sc) return; if (sc.outputTranscription && sc.outputTranscription.text) buf += sc.outputTranscription.text; if (sc.turnComplete && done) { const d = done; done = null; d(buf.trim()); buf = ''; } },
    onerror: (e) => console.log('error', e.message), onclose: (e) => console.log('closed:', e && (e.code + ' ' + e.reason)),
  } });
  const replies = [];
  for (const line of LEARNER) {
    const wait = new Promise((r) => { done = r; });
    if (process.env.SEND === 'client') session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: line }] }], turnComplete: true });
    else session.sendRealtimeInput({ text: line });
    const reply = await Promise.race([wait, new Promise((r) => setTimeout(() => r('(no reply in 30 s)'), 30000))]);
    replies.push({ learner: line.startsWith('[') ? '(start)' : line, dombi: reply });
  }
  session.close();
  return replies;
}

function score(replies) {
  const said = replies.map((r) => r.dombi);
  const questions = said.filter((s) => /\?\s*$/.test(s)).length;
  const stock = said.flatMap((s) => STOCK.filter((re) => re.test(s)).map((re) => s.match(re)[0]));
  const words = said.map((s) => s.split(/\s+/).filter(Boolean).length);
  const speed = said.find((s, i) => replies[i].learner.includes('Speed')) || '';
  const repeater = (speed.match(/speed/gi) || []).length >= 4;
  return { questions: `${questions}/${said.length} end with a question`, stock: stock.length ? stock : 'none', avgWords: Math.round(words.reduce((a, b) => a + b, 0) / words.length), maxWords: Math.max(...words), repeater };
}

const env = readEnv();
if (!env.GEMINI_API_KEY) { console.log('no key in server/.env'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });      // the page's own API version (proactivity lives there)
for (const pack of process.argv.slice(2).length ? process.argv.slice(2) : ['kind', 'rude']) {
  const replies = await talk(ai, pack);
  console.log(`\n=== ${pack}`);
  for (const r of replies) console.log(`L: ${r.learner}\nD: ${r.dombi}`);
  console.log('score:', JSON.stringify(score(replies)));
}
process.exit(0);
