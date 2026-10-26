// Which Dombi the learner sees at each moment, and whether he moves. No screens here.
// Source: docs/superpowers/specs/2026-10-26-dombi-moment-map.md (owner rounds 3 and 4).
//   stillPoseFor(moment)  ->  '<size>-<pose>' still picture for Light/Still phones
//   rigFor(moment)        ->  what the Rive rig plays on Full (mood, gesture, trigger, talking, listening)
//   animates(moment, level), idleMoment({now, lastOpen}), levelForFps(fps), levelFrom({measured, lessMotion, reduceMotion})

const MAP = {
  idle:         ['80-default',   { mood: 'smirk' }],
  guide:        ['48-talk',      { mood: 'smirk', talking: true }],
  glad:         ['80-wave',      { mood: 'happy', gesture: 'wave' }],
  night:        ['80-sleepy',    { mood: 'sleepy' }],
  onboarding:   ['150-wave',     { mood: 'happy', gesture: 'wave' }],
  emptyTab:     ['150-point',    { mood: 'smirk', gesture: 'point' }],
  yourTurn:     ['80-listen',    { mood: 'listen', listening: true }],
  explaining:   ['80-talk',      { mood: 'smirk', talking: true }],
  correct:      ['48-laugh',     { mood: 'happy', trigger: 'correct' }],
  notYet:       ['48-oops',      { mood: 'smirk', trigger: 'wrong' }],
  helpOffer:    ['80-talk',      { mood: 'smirk', talking: true }],
  helpSheet:    ['48-default',   { mood: 'smirk' }],
  mistakes:     ['150-thinking', { mood: 'think', gesture: 'thinking' }],
  lessonResult: ['150-celebrate', { mood: 'laugh', gesture: 'celebrate' }],
  levelUp:      ['150-proud',    { mood: 'proud', trigger: 'celebrate' }],
  activityEnd:  ['80-happy',     { mood: 'happy' }],
  talking:      ['150-talk',     { mood: 'talk', talking: true }],
  listening:    ['150-listen',   { mood: 'listen', listening: true }],
  sceneGuide:   ['80-default',   { mood: 'smirk' }],
  micOff:       ['80-confused',  { mood: 'confused' }],
  waiting:      ['80-think',     { mood: 'think', gesture: 'thinking' }],
  speakTab:     ['150-happy',    { mood: 'happy' }],
  offline:      ['150-thinking', { mood: 'think', gesture: 'thinking' }],
  error:        ['150-confused', { mood: 'confused' }],
  welcome:      ['150-happy',    { mood: 'happy' }],
  onboardingIdle: ['150-default', { mood: 'smirk' }],
  thanks:       ['48-happy',     { mood: 'happy' }],
  confidenceUp: ['150-happy',    { mood: 'happy', gesture: 'celebrate' }],
};
export const MOMENTS = Object.keys(MAP);

// The spec's Light level: animated only at onboarding, answers and celebrations.
const LIGHT = new Set(['onboarding', 'onboardingIdle', 'welcome', 'correct', 'notYet', 'lessonResult', 'levelUp', 'activityEnd', 'confidenceUp']);

const entry = (m) => { const e = MAP[m]; if (!e) throw new Error('unknown Dombi moment: ' + m); return e; };
export const stillPoseFor = (m) => entry(m)[0];
export const rigFor = (m) => ({ ...entry(m)[1] });
export const animates = (m, level) => { entry(m); return level === 'full' || (level === 'light' && LIGHT.has(m)); };

const DAY = 24 * 60 * 60 * 1000;
// Glad after 2+ days away wins over late at night (owner, round 4). Night is 22:00–05:00.
export function idleMoment({ now, lastOpen }) {
  if (lastOpen && now - lastOpen >= 2 * DAY) return 'glad';
  const h = new Date(now).getHours();
  return h >= 22 || h < 5 ? 'night' : 'idle';
}

export const levelForFps = (fps) => (fps >= 50 ? 'full' : fps >= 30 ? 'light' : 'still');

// lessMotion: undefined = follow the measured level; true = still; false on a phone measured as Still = Light
// (the owner let learners turn the switch off there, round 4). Reduce Motion always means Still.
/** @param {{ measured?: string, lessMotion?: boolean, reduceMotion?: boolean }} [opts] */
export function levelFrom({ measured = 'full', lessMotion, reduceMotion } = {}) {
  if (reduceMotion || lessMotion === true) return 'still';
  if (lessMotion === false && measured === 'still') return 'light';
  return measured;
}
