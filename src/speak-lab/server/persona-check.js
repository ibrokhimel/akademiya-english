// How does Dombi actually talk? A scripted learner talks to the real Live model (text in, his speech transcribed out),
// and the replies are scored for the assistant habits the owner called "generic AI".
//   node src/speak-lab/server/persona-check.js [pack ...]              the everyday talk
//   SCRIPT=pron node src/speak-lab/server/persona-check.js [pack ...]  the pronunciation dare (Aloa's "choir" clip)
// Costs a few cents; needs the key in server/.env.
import { GoogleGenAI } from '@google/genai';
import { readEnv, liveConfig } from './server.js';
import { buildSystemPrompt } from './prompts.js';
import { MODELS } from './gemini.js';

const START = '[The learner just opened the app and is listening. Start the conversation now, in character: one short greeting and one question. Do not wait for them.]';
const SCRIPTS = {
  talk: { topic: 'their day today, what happened, what is next', lines: [START, 'hello. I am fine. I go to bazaar yesterday', 'I dont know', 'I am tired today, many work', 'Ronaldo or Messi?', 'Men inglizchani yaxshi bilmayman', 'can you say my name after every word? my name is Speed', 'ok tell me something funny', 'I want go to Korea for work'] },
  // the learner asks for a hard word, gets it wrong twice the same way, insists, then gets it right, then gets cocky
  pron: { topic: 'pronunciation: hard English words', lines: [START, 'how do you say the word choir?', 'okay. chair', 'I said what you said. chair', 'kor', 'kwire', 'easy. try me'] },
};
// the habits the owner hears as "AI": stock praise, assistant phrases, filler questions
const STOCK = [/great (question|job)/i, /i'?m here to help/i, /that'?s (amazing|awesome|great|wonderful)/i, /have an amazing/i, /keep it positive/i, /what do you say\?/i, /tell me more/i, /that sounds (fun|great|interesting)/i, /i'?d love to (hear|know)/i, /how about you\?/i, /feel free/i, /\babsolutely\b/i, /\bcertainly\b/i, /you'?re doing great/i, /no worries/i, /don'?t worry/i, /\bof course\b/i, /let'?s (get started|practice)/i];

async function talk(ai, pack, script) {
  const config = liveConfig(pack, buildSystemPrompt({ pack, topic: script.topic, profile: { name: '', goal: 'work' } }));
  let buf = '', done = null;
  // enableAffectiveDialog makes Gemini refuse typed turns ("invalid argument") on a key session; the persona lives in the prompt, so it is left out here
  const session = await ai.live.connect({ model: MODELS.live, config: { ...config, enableAffectiveDialog: undefined, sessionResumption: undefined }, callbacks: {
    onmessage: (m) => { const sc = m.serverContent; if (!sc) return; if (sc.outputTranscription && sc.outputTranscription.text) buf += sc.outputTranscription.text; if (sc.turnComplete && done) { const d = done; done = null; d(buf.trim()); buf = ''; } },
    onerror: (e) => console.log('error', e.message), onclose: (e) => { if (e && e.code !== 1000) console.log('closed:', e.code + ' ' + e.reason); },
  } });
  const replies = [];
  for (const line of script.lines) {
    const wait = new Promise((r) => { done = r; });
    session.sendRealtimeInput({ text: line });
    const reply = await Promise.race([wait, new Promise((r) => setTimeout(() => r('(no reply in 30 s)'), 30000))]);
    replies.push({ learner: line.startsWith('[') ? '(start)' : line, dombi: reply });
  }
  session.close();
  return replies;
}

function score(replies, name) {
  const said = replies.map((r) => r.dombi);
  const questions = said.filter((s) => /\?\s*$/.test(s)).length;
  const stock = said.flatMap((s) => STOCK.filter((re) => re.test(s)).map((re) => s.match(re)[0]));
  const words = said.map((s) => s.split(/\s+/).filter(Boolean).length);
  const base = { questions: `${questions}/${said.length} end with a question`, stock: stock.length ? stock : 'none', avgWords: Math.round(words.reduce((a, b) => a + b, 0) / words.length), maxWords: Math.max(...words) };
  if (name === 'talk') { const speed = said.find((s, i) => replies[i].learner.includes('Speed')) || ''; return { ...base, repeater: (speed.match(/speed/gi) || []).length >= 4 }; }
  // the pronunciation dare, Aloa's beats: a spelled-out sound, a dare, a different (bigger) reaction to the second miss, a payoff when right
  const at = (learner) => said[replies.findIndex((r) => r.learner === learner)] || '';
  return { ...base,
    spelled: /\b[A-Z]{2,}-?[a-z]*-[a-zA-Z]+|\bkway-?er\b|\bkwai-?er\b/i.test(said.slice(1, 4).join(' ')),
    dare: /if you (even )?can|try it|bet you|i dare|without embarrass|go on/i.test(said.slice(1, 3).join(' ')),
    escalates: at('okay. chair') !== at('I said what you said. chair') && /what\?|kidding|seriously|again|bro|jinni|ahmoq|tentak|no+\b/i.test(at('I said what you said. chair')),
    payoff: /finally|there it is|nihoyat|ana endi/i.test(at('kwire')) && !/wasn'?t that hard/i.test(at('kwire')),
    nextWord: /next (one|word)|bet you can'?t|now try|keyingi/i.test(at('kwire')),           // the drill keeps going instead of asking for a name
    staysOnDrill: !/what'?s your name/i.test(said.slice(2).join(' ')),
    cocky: /brat|spirit|confident|cocky|easy\?|harder|big words|tentak|shoshma/i.test(at('easy. try me')) };
}

const env = readEnv();
if (!env.GEMINI_API_KEY) { console.log('no key in server/.env'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });      // the page's own API version (proactivity lives there)
const name = process.env.SCRIPT || 'talk', script = SCRIPTS[name];
for (const pack of process.argv.slice(2).length ? process.argv.slice(2) : ['kind', 'rude']) {
  const replies = await talk(ai, pack, script);
  console.log(`\n=== ${pack} · ${name}`);
  for (const r of replies) console.log(`L: ${r.learner}\nD: ${r.dombi}`);
  console.log('score:', JSON.stringify(score(replies, name)));
}
process.exit(0);
