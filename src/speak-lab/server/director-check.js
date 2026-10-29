// How well does the director (gemini-3.5-flash-lite, MODELS.director) pick Dombi's actions? 20 lines of his, each with the families that would fit
// (null = no action is right). Prints hits, wrong picks, nulls, timing and tokens per call. Costs well under a cent.
//   node src/speak-lab/server/director-check.js        (needs the key in server/.env; MODEL=… and THINK=0 try other settings)
import { GoogleGenAI } from '@google/genai';
import { readEnv, DIRECTOR } from './server.js';
import { MODELS } from './gemini.js';
import { CATALOG } from '../actions/catalog.js';

const LINES = [
  ['I could eat ten plov right now', ['food']], ['wait, let me think about that', ['think']], ['you nailed it, finally!', ['celebrate']],
  ['ugh, stop poking me', ['annoyed']], ["watch this, I'm way too cool for this", ['show-off']], ["I'm so sleepy, honestly", ['lazy']],
  ['my head is spinning after that bus ride', ['dizzy']], ['hello hello, welcome back', ['greet']], ['look at this one right here', ['explain']],
  ['oops, my bad, I said it wrong', ['oops']], ['high five for that, bro', ['celebrate', 'offer']], ['no way, are you serious?', ['surprise', 'annoyed']],
  ["it's freezing in here today", ['lazy']], ['anyway, where were we', ['oops', null]], ['I just woke up, give me a second', ['lazy']],
  ['so what did you eat for breakfast', ['food', null]], ['tell me about your weekend', [null]], ['Messi is better, not even close', [null, 'show-off']],
  ["that's a secret, don't tell anyone", ['listen', null]], ["I'm the coolest blob in Tashkent", ['show-off']],
];
const family = new Map(CATALOG.map((e) => [e.id, e.family]));
const env = readEnv();
if (!env.GEMINI_API_KEY) { console.log('no key in server/.env'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const rows = [], times = [], tokens = [];
for (const [said, want] of LINES) {
  const t0 = Date.now();
  const r = await ai.models.generateContent({ model: process.env.MODEL || MODELS.director, contents: [{ role: 'user', parts: [{ text: `Personality: rude\nThe learner just said: ""\nDombi is saying: "${said}"\nRecent actions (never again): none` }] }],
    config: { systemInstruction: DIRECTOR, responseMimeType: 'application/json', ...(process.env.THINK === '0' ? { thinkingConfig: { thinkingBudget: 0 } } : process.env.THINK ? { thinkingConfig: { thinkingLevel: process.env.THINK } } : {}) } });
  times.push(Date.now() - t0); const u = r.usageMetadata || {}; tokens.push([u.promptTokenCount || 0, u.candidatesTokenCount || 0]);
  let j = {}; try { j = JSON.parse(r.text); } catch {}
  const fam = j.action ? family.get(j.action) || 'unknown' : null;
  rows.push({ said, action: j.action || null, word: j.word || '', fam, ok: want.includes(fam) });
}
for (const x of rows) console.log(`${x.ok ? 'ok  ' : 'MISS'} ${x.said.padEnd(44)} -> ${x.action || 'null'}${x.word ? ' @' + x.word : ''} (${x.fam})`);
const sorted = [...times].sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)];
const tin = Math.round(tokens.reduce((a, t) => a + t[0], 0) / tokens.length), tout = Math.round(tokens.reduce((a, t) => a + t[1], 0) / tokens.length);
console.log(`hits ${rows.filter((x) => x.ok).length}/${rows.length} · nulls ${rows.filter((x) => !x.action).length} · unknown ids ${rows.filter((x) => x.fam === 'unknown').length}`);
console.log(`time median ${med} ms, max ${sorted[sorted.length - 1]} ms · tokens per call ~${tin} in, ~${tout} out`);
process.exit(0);
