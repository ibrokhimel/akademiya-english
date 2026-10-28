// The speak lab's numbers and lists, in one place (spec §3, §4.3, §4.8, §5.6).
export const CFG = {
  SERVER: 'http://127.0.0.1:8797',
  SDK: '/src/speak-lab/vendor/genai.js',   // the Gemini SDK bundled for the browser by `npm install` in server/ (esbuild)
  API_VERSION: 'v1alpha',                  // the API version the short-lived tokens connect through
  MODEL: 'gemini-3.8-live', FALLBACK_MODEL: 'gemini-2.5-flash-native-audio-latest',
  SILENCE_REMARK_MS: 50000, SILENCE_WHISPER_MS: 110000,
  TALK_CAP_MS: 900000, GOODBYE_BEFORE_CAP_MS: 20000,
  MIN_WORDS_FOR_CARD: 3, CARD_FADE_MS: 40000,
  MONTHLY_BUDGET_USD: 10,
  // dollars per second of audio, in and out: an estimate from Google's Live pricing (about 25 audio tokens a second;
  // input $3 and output $12 per million tokens as of 2026-10). The owner updates it from the price page; the counter is an estimate.
  PRICE: { inPerSec: 0.000075, outPerSec: 0.0003 },
  MIC_FLOOR: 6,                            // amp below this counts as silence
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

// the six packs: id, name on the page, Gemini voice (the server holds the same voices)
export const PACKS = [
  { id: 'kind', name: 'Mehribon', voice: 'Puck' },
  { id: 'rude', name: "Qo'pol", voice: 'Zephyr' },
  { id: 'funny', name: 'Qiziqchi', voice: 'Fenrir' },
  { id: 'drama', name: 'Dramatik', voice: 'Aoede' },
  { id: 'dangasa', name: 'Dangasa', voice: 'Charon' },
  { id: 'couple', name: 'Asalim', voice: 'Leda' },
];
