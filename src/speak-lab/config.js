// The speak lab's numbers and lists, in one place (spec §3, §4.3, §4.8, §5.6).
export const CFG = {
  SERVER: 'http://127.0.0.1:8797',
  SDK: '/src/speak-lab/vendor/genai.js',   // the Gemini SDK bundled for the browser by `npm install` in server/ (esbuild)
  API_VERSION: 'v1alpha',                  // the API version the short-lived tokens connect through
  CONNECT_TIMEOUT_MS: 15000,               // a socket that has not opened by then is given up (the page shows the server line and a retry)
  CAP_GRACE_MS: 15000,                     // after the cap, Dombi's goodbye gets this long to play before the talk is ended anyway
  MODEL: 'gemini-3.8-live', FALLBACK_MODEL: 'gemini-2.5-flash-native-audio-latest',
  SILENCE_REMARK_MS: 50000, SILENCE_WHISPER_MS: 110000,
  TALK_CAP_MS: 900000, GOODBYE_BEFORE_CAP_MS: 20000,
  MIN_WORDS_FOR_CARD: 3, CARD_FADE_MS: 40000,
  MONTHLY_BUDGET_USD: 10,
  // dollars per second of audio, in and out: an estimate from Google's Live pricing (about 25 audio tokens a second;
  // input $3 and output $12 per million tokens as of 2026-10). The owner updates it from the price page; the counter is an estimate.
  // directPerCall: one director call (flash-lite, ~920 tokens in, ~20 out, measured by server/director-check.js), priced as an estimate
  PRICE: { inPerSec: 0.000075, outPerSec: 0.0003, directPerCall: 0.0001 },
  MIC_FLOOR: 6,                            // amp below this counts as silence
  BARGE_IN_FLOOR: 22,                      // while Dombi talks, only mic sound above this is sent (his own voice from the speakers stays under it)
  // the action engine (docs/superpowers/specs/2026-10-30-dombi-action-engine-design.md)
  CLAUSE_WORDS: 8,                         // the director is asked at each , . ! ? or after this many words without one
  BIG_EVERY_TURNS: 3,                      // a big action (celebrate, dress, shades, sleep) at most once in this many of his turns
  MOUTH_AFTER_MS: 250,                     // a mouth action (eat, yawn) plays this long after the sentence that named it
  ACT_OFFSET_MS: 590,                      // captions run ahead of his voice: measured on a real talk (2026-10-29, median of 31, middle half 450–990 ms)
  LIFE_MIN_MS: 3000, LIFE_MAX_MS: 8000,    // his own moves come every 3–8 s (twice as far apart with Reduce Motion)
  TRAVEL_WEIGHT: 2,                        // how often an idle move is a walk to another spot, against the catalog's idle weights (~17)
  WALK_PX_PER_S: 160,                      // walking speed across the stage
  LISTEN_HOLD_MS: 1500,                    // the learner counts as talking until this long after their last sound or word
};

// topic cards: `goal` cards show first for a learner with that goal; the rest are for everyone. `topic` is what Dombi is told.
export const TOPICS = [
  { id: 'ielts1', goal: 'ielts', name: 'IELTS 1-qism savollari', topic: 'IELTS Speaking Part 1: ask the typical questions (home, work or study, hobbies, daily routine) one at a time and push for longer answers', emoji: '🎓' },
  { id: 'ielts2', goal: 'ielts', name: 'IELTS 2-qism: bir mavzu', topic: 'IELTS Speaking Part 2: give a cue card topic, let them talk for a minute, then follow-up questions', emoji: '🗂️' },
  { id: 'work', goal: 'work', name: 'Ish haqida', topic: 'their work or the job they want: what they do, a typical day, a problem at work', emoji: '💼' },
  { id: 'interview', goal: 'work', name: 'Ish suhbati savollari', topic: 'common job interview questions, one at a time, as a friendly practice', emoji: '🤝' },
  { id: 'travel', goal: 'travel', name: 'Sayohat', topic: 'travel: where they want to go, a trip they took, airports and hotels', emoji: '✈️' },
  { id: 'school', goal: 'school', name: 'Maktab', topic: 'school life: subjects, teachers, friends, exams', emoji: '🏫' },
  { id: 'day', name: 'Bugungi kuningiz', topic: 'their day today, what happened, what is next', emoji: '☀️' },
  { id: 'football', name: 'Futbol', topic: 'football: teams, players, the last match, their own playing', emoji: '⚽' },
  { id: 'memes', name: 'Memlar va TikTok', topic: 'memes, TikTok trends, what is funny online right now', emoji: '📱' },
  { id: 'kpop', name: 'K-pop', topic: 'K-pop and Korean dramas, favourite groups and songs', emoji: '🎤' },
  { id: 'roast', name: 'Inglizchamni roast qil', topic: 'roast their English: tease them about their mistakes and make them fix each one on the spot', emoji: '🔥' },
  { id: 'surprise', name: "Nima bo'lsa ham", topic: '', emoji: '🎲' },
];

// the voices the learner can pick, apart from the personality: Gemini's prebuilt voices, with who they sound like
export const VOICES = [
  { id: 'Puck', who: 'erkak', name: 'quvnoq' },
  { id: 'Fenrir', who: 'erkak', name: "jo'shqin" },
  { id: 'Charon', who: 'erkak', name: 'chuqur' },
  { id: 'Orus', who: 'erkak', name: "qat'iy" },
  { id: 'Zephyr', who: 'ayol', name: 'yorqin' },
  { id: 'Leda', who: 'ayol', name: 'yosh' },
  { id: 'Aoede', who: 'ayol', name: 'yengil' },
  { id: 'Kore', who: 'ayol', name: 'jiddiy' },
];

// the six packs: id, name on the page, Gemini voice used when no voice was picked (the server holds the same voices)
export const PACKS = [
  { id: 'kind', name: 'Mehribon', voice: 'Puck' },
  { id: 'rude', name: "Qo'pol", voice: 'Zephyr' },
  { id: 'funny', name: 'Qiziqchi', voice: 'Fenrir' },
  { id: 'drama', name: 'Dramatik', voice: 'Aoede' },
  { id: 'dangasa', name: 'Dangasa', voice: 'Charon' },
  { id: 'couple', name: 'Asalim', voice: 'Leda' },
];
