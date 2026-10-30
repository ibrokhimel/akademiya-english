// The page's pure rules: no DOM, no network, tested in node (rules.test.js).
import { TOPICS } from './config.js';
import { COPY } from './copy.js';
import { CATALOG } from './actions/catalog.js';

// the report when there is nothing to report: the learner never spoke ('silent'), or the server's report call failed ('failed')
export function emptyReport(reason) {
  return { stars: 0, why: reason === 'failed' ? COPY.reportFailed : COPY.reportSilent, phrases: [], pron: [], level: '', profileUpdate: null, failed: reason === 'failed' };
}

// what Dombi remembers after a talk: interests and mistakes are unioned and capped at 20, the last talk's summary replaces, talks + 1
export function mergeProfile(profile, update = {}) {
  const union = (a, b) => [...new Set([...(a || []), ...(b || [])].map((s) => String(s).trim()).filter(Boolean))].slice(0, 20);
  return { ...profile, interests: union(profile.interests, update.interests), mistakes: union(profile.mistakes, update.mistakes),
    lastTalk: update.lastTalk ? String(update.lastTalk) : profile.lastTalk, level: update.level || profile.level, talks: (profile.talks || 0) + 1 };
}

// topicsFor(goal) -> cards: the learner's goal cards first, then the "just talk" cards; no goal (or "talk") → only the second group
export function topicsFor(goal) {
  const mine = goal && goal !== 'talk' ? TOPICS.filter((c) => c.goal === goal) : [];
  return [...mine, ...TOPICS.filter((c) => !c.goal)];
}

// silence: a casual remark after SILENCE_REMARK_MS of nothing from the learner, an Uzbek whisper after SILENCE_WHISPER_MS,
// each once per silence (`stage` = the last nudge sent in this silence), never while Dombi is talking
export function silenceStage({ quietMs, stage, dombiTalking }, cfg) {
  if (dombiTalking) return 'none';
  if (quietMs >= cfg.SILENCE_WHISPER_MS && stage !== 'whisper') return 'whisper';
  if (quietMs >= cfg.SILENCE_REMARK_MS && stage === 'none') return 'remark';
  return 'none';
}

// Dombi's face from his own words (the voice model reads a tool call out loud, so no tool): laugh, surprised, think, proud, oops, else happy
export function moodFor(text) {
  const t = (text || '').toLowerCase();
  if (/\b(ha-?ha|haha|lol|lmao|kulgili|xa-?xa)\b|😂|🤣/.test(t)) return 'laugh';
  if (/\b(finally|nihoyat|there it is)\b/.test(t)) return 'proud';                           // the drill's payoff
  if (/\b(wow|no way|whoa|voy|really\?|seriously\?|what\?!|are you kidding)|😱|!\?/.test(t)) return 'surprised';
  if (/\b(hmm+|let me think|o'ylab|wait|so\.\.\.)\b|\.\.\./.test(t)) return 'think';
  if (/\b(proud|nailed|perfect|zo'r|barakalla|yaxshi|great job|well done|exactly)\b/.test(t)) return 'proud';
  if (/\b(oops|my bad|sorry|kechirasan|kechir)\b/.test(t)) return 'oops';
  return 'happy';
}

// words that, alone in round brackets, are a stage direction and not his speech: (laughs), (clears throat), (dance)
export const STAGE_WORDS = new Set(['laughs', 'laughing', 'sighs', 'giggles', 'whispers', 'gasps', 'sings', 'coughs', 'clears throat',
  ...CATALOG.flatMap((e) => [e.id.replace(/^\w+:/, ''), ...e.words])].map((w) => w.toLowerCase()));
const stageOnly = (inner) => { const t = inner.toLowerCase().replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return STAGE_WORDS.has(t) || (!!t && t.split(' ').every((w) => STAGE_WORDS.has(w))); };

// what the voice model sometimes writes but must never show: [smirk], <speaker_set_mood>{…}</speaker_set_mood>, *jumps*,
// _shrugs_, (laughs); real brackets like "(in Uzbek)" stay. A tag still arriving (an open [ < * _ with no close yet) hides
// everything after it until it closes
export function cleanCaption(text) {
  return (text || '').replace(/<[^>]*>/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/\*[^*]*\*/g, ' ').replace(/_[^_]*_/g, ' ')
    .replace(/\(([^)]*)\)/g, (m, inner) => (stageOnly(inner) ? ' ' : m)).replace(/[[<*_].*$/, '').replace(/\s+/g, ' ').trim();
}

// the mic goes to Gemini all the time while Dombi is quiet; while he talks only a clearly loud learner gets through, so his own
// voice from the speakers cannot cut him off
export function sendMic({ amp, dombiTalking }, cfg) {
  return !dombiTalking || amp >= cfg.BARGE_IN_FLOOR;
}

// a feedback card is only worth asking for when the learner said a few words
export function shouldAskFeedback(learnerText, cfg) {
  return (learnerText || '').trim().split(/\s+/).filter(Boolean).length >= cfg.MIN_WORDS_FOR_CARD;
}

// the cost of a talk, in dollars, from seconds of audio in and out and the price per second (config PRICE)
export function estimateCost(secIn, secOut, price) {
  return Math.round(((secIn || 0) * price.inPerSec + (secOut || 0) * price.outPerSec) * 1e6) / 1e6;
}

// after a dropped socket: wait this long before attempt `attempt` (0-based), or give up (null) after two
export function nextReconnect(attempt) {
  return [500, 1500][attempt] ?? null;
}
