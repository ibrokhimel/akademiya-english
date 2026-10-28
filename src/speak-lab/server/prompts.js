// Builds the Live system prompt from the Markdown files in src/speak-lab/prompts/, so the owner edits the words, not code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'prompts');
const read = (name) => fs.readFileSync(path.join(DIR, name), 'utf8').trim();
const GOALS = { ielts: 'IELTS', work: 'work', travel: 'travel', school: 'school', talk: 'just talking' };

let cache = null;
function load() {
  if (cache) return cache;
  const packs = {};
  for (const f of fs.readdirSync(path.join(DIR, 'packs'))) if (f.endsWith('.md')) packs[f.slice(0, -3)] = read(path.join('packs', f));
  return (cache = { dombi: read('dombi.md'), language: read('language.md'), teaching: read('teaching.md'), safety: read('safety.md'), packs });
}

// the "<!-- under18 --> … <!-- /under18 -->" block stays only for a learner the app knows is under 18
function ageGate(text, age) {
  const re = /<!-- under18 -->([\s\S]*?)<!-- \/under18 -->/g;
  return text.replace(re, (_, inner) => (typeof age === 'number' && age < 18 ? inner.trim() : '')).trim();
}

function learnerBlock(p = {}, topic = '') {
  const lines = ['# The learner'];
  lines.push(p.name ? `- Name: ${p.name}. Use it now and then, not every turn.` : '- You do not know their name yet. Ask for it early, once, casually.');
  lines.push(p.goal ? `- Why they learn English: ${GOALS[p.goal] || p.goal}. Steer towards it when it fits.` : '- You do not know why they learn English. Ask once, casually.');
  if (p.level) lines.push(`- Level last time, your guess: ${p.level}.`);
  if (p.interests && p.interests.length) lines.push(`- Things they like: ${p.interests.join(', ')}.`);
  if (p.mistakes && p.mistakes.length) lines.push(`- Mistakes they keep making: ${p.mistakes.join('; ')}. Listen for them and recast.`);
  if (p.lastTalk) lines.push(`- Last time you talked: ${p.lastTalk}`);
  lines.push(topic ? `\nToday's topic: ${topic}. Start there, wander if the talk wants to.` : '\nNo topic chosen: pick something from what you know about them, or ask what is on their mind.');
  return lines.join('\n');
}

// one of the side-call prompts (feedback.md, explain.md, report.md …), read once
const files = {};
export const promptFile = (name) => (files[name] ||= read(name));

export function buildSystemPrompt({ pack, profile = {}, topic = '' }) {
  const P = load();
  if (!P.packs[pack]) throw new Error('unknown pack: ' + pack);
  return [P.dombi, ageGate(P.packs[pack], profile.age), P.language, P.teaching, P.safety, learnerBlock(profile, topic)].join('\n\n');
}
