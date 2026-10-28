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
  MIC_FLOOR: 6,                            // amp below this counts as silence
};

// the six packs: id, name on the page, Gemini voice (the server holds the same voices)
export const PACKS = [
  { id: 'kind', name: 'Mehribon', voice: 'Puck' },
  { id: 'rude', name: "Qo'pol", voice: 'Zephyr' },
  { id: 'funny', name: 'Qiziqchi', voice: 'Fenrir' },
  { id: 'drama', name: 'Dramatik', voice: 'Aoede' },
  { id: 'dangasa', name: 'Dangasa', voice: 'Charon' },
  { id: 'couple', name: 'Asalim', voice: 'Leda' },
];
