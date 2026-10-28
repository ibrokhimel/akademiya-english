// The page's pure rules: no DOM, no network, tested in node (rules.test.js).
import { TOPICS } from './config.js';

// topicsFor(goal) -> cards: the learner's goal cards first, then the "just talk" cards; no goal (or "talk") → only the second group
export function topicsFor(goal) {
  const mine = goal && goal !== 'talk' ? TOPICS.filter((c) => c.goal === goal) : [];
  return [...mine, ...TOPICS.filter((c) => !c.goal)];
}

// a feedback card is only worth asking for when the learner said a few words
export function shouldAskFeedback(learnerText, cfg) {
  return (learnerText || '').trim().split(/\s+/).filter(Boolean).length >= cfg.MIN_WORDS_FOR_CARD;
}

// after a dropped socket: wait this long before attempt `attempt` (0-based), or give up (null) after two
export function nextReconnect(attempt) {
  return [500, 1500][attempt] ?? null;
}
