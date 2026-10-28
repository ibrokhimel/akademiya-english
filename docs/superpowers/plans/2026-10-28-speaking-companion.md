# Speaking Companion (free talk with Dombi, browser) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser page where the learner talks to Dombi out loud, hands-free, through Gemini Live, with captions, text feedback cards, Uzbek help buttons, a report at the end, and a memory of the learner.

**Architecture:** The page (`src/speak-lab/`, plain JavaScript like `src/web/`) is served by the existing lab server (`node design/motion/serve.js`, port 8791) so it shares the app's origin and the lab's Dombi, styles, sound and motion. The browser talks to Gemini Live directly over the `@google/genai` web build, with a short-lived token minted by a small Node server (`src/speak-lab/server/`, port 8797) that holds the key, assembles the system prompt from Markdown prompt files, runs the text-model side calls (feedback, explain, slower, report, profile update) and logs every talk. A fake session (`fake.js`) stands in for Gemini in the automated checks.

**Tech Stack:** Browser ES modules, Web Audio (AudioWorklet), `@rive-app/canvas` (already in `design/rive/node_modules`), Node 18+ `http` + `@google/genai`, `node --test`, Playwright (already used by `src/web/checks/`).

**Spec:** `docs/superpowers/specs/2026-10-28-speaking-companion-design.md` (the owner's answers: `docs/superpowers/specs/2026-10-28-speaking-companion-answers.md`)

## Global Constraints

- Plain JavaScript, no framework, no bundler; every file under 500 lines; one responsibility per file.
- Page copy in Uzbek (Latin), like the app (`DAVOM ETISH` style); the test bar in English. All Uzbek strings live in `src/speak-lab/copy.js`, nothing hard-coded elsewhere. Plain copy, no slogans.
- The key never reaches the browser. It is read from `src/speak-lab/server/.env` (`GEMINI_API_KEY=…`), git-ignored.
- Models: the talk `gemini-3.8-live` (fallback `gemini-2.5-flash-native-audio-latest`), text work `gemini-3.8-flash`, slow repeat `gemini-3.8-flash-tts`. Audio in `audio/pcm;rate=16000`, audio out 24 kHz PCM.
- Dombi: cool, confident, never kawaii; "oops" never sad. Moods only (no mouth sync). Rig inputs: `mood` (enum: smirk, happy, laugh, talk, listen, think, surprised, sleepy, wink, proud, focus, confused, oops), `gesture`, `listening`, `talking`, `amp` (0–100), `dark`.
- Six personality packs, Kind default: Kind/Puck, Rude/Zephyr, Funny/Fenrir, Drama/Aoede, Dangasa/Charon, Couple/Leda. No age gate; the Couple prompt keeps boyfriend/girlfriend roleplay for adult accounts only.
- Timers and caps in one config: casual remark after 50 s of silence, Uzbek whisper after 110 s, per-talk cap 15 min, monthly budget $10, no feedback card when the learner said fewer than 3 words, at most one card of each kind per turn.
- Nothing beyond the screens in the spec: start page, talk, report, "What Dombi remembers", test bar.
- Commits: small and frequent, message in plain words, **no `Co-Authored-By` trailer** (CLAUDE.md).

## Review Focus

1. Mic blocked or absent: the talk page shows the Uzbek "mikrofon yopiq" line and a retry, never a blank screen or a console error. (Task 4 check)
2. The socket drops mid-talk (`goAway`, token expiry, Wi-Fi): the page reconnects with the resumption handle; captions and the turn count carry on; after two failed reconnects it ends the talk and still shows a report from what it has. (Task 4 test + Task 9 test)
3. The learner never speaks: the two nudges fire, the cap ends the talk politely, and the report says so (0 stars, "siz gapirmadingiz") instead of inventing phrases. (Task 8 test + Task 9 test)
4. The local server is down or a side call fails: the talk itself continues without cards or buttons' results; End shows the report screen with "hisobot kelmadi" and a retry button. (Task 6 test + Task 9 test)
5. Budget or cap reached: a new talk is refused on the start page with the Uzbek line and the figure; a running talk ends politely at the cap with Dombi's goodbye line, not a cut. (Task 10 test)

---

## File structure

```
src/speak-lab/
  index.html          the page shell: lab css + rive.js + motion.js + sound.js + lab.js, module app.js
  speak.css           desktop layout: top bar, Dombi stage, captions, feedback column, cards
  copy.js             every Uzbek string (export const COPY)
  config.js           timers, caps, card rules, models, packs (export const CFG, PACKS)
  rules.js            pure rules, tested in node: card gating, silence stage, cost, profile merge, report shape
  profile.js          profile + phrasebook in localStorage; seeds from the app's own keys
  audio.js            mic capture (worklet, 16 kHz PCM) + playback queue (24 kHz) + amp meter
  pcm-worklet.js      the AudioWorklet processor
  live.js             the Gemini Live session (token → connect → events); same interface as fake.js
  fake.js             scripted session for the checks (?fake=1)
  dombi.js            Dombi on the stage: moods, listening/talking/amp
  start.js            start page: topic cards, free topic, personality picker
  talk.js             the talk: wires audio + live + dombi + captions + cards + timers + End
  cards.js            caption buttons (explain, slower) and feedback cards, DOM only
  report.js           the report screen
  memory.js           "What Dombi remembers" page with delete
  testbar.js          the test bar
  app.js              router + boot
  prompts/            dombi.md language.md teaching.md safety.md feedback.md explain.md report.md profile.md
                      packs/kind.md rude.md funny.md drama.md dangasa.md couple.md
  rules.test.js       node --test
  checks/talk.js      Playwright: a whole talk in fake mode
  server/
    package.json      @google/genai
    .env              GEMINI_API_KEY (ignored)
    server.js         http on 8797: /health /token /feedback /explain /slower /report /log
    prompts.js        reads prompts/*.md, assembles the system prompt
    gemini.js         the real calls (token, flash text+audio, tts); injectable for tests
    cost.js           seconds → estimate, monthly ledger
    log.js            per-talk folder under server/logs/ (ignored)
    server.test.js    node --test with a fake gemini.js
```

---

### Task 1: Server skeleton with the key and the token

**Files:**
- Create: `src/speak-lab/server/package.json`, `server.js`, `gemini.js`, `server.test.js`
- Modify: `.gitignore` (add `src/speak-lab/server/.env`, `src/speak-lab/server/logs/`, `src/speak-lab/server/node_modules/`)

**Interfaces:**
- Produces: `createServer({ gemini, env }) -> http.Server` in `server.js` (exported, so tests inject a fake `gemini`); routes `GET /health -> {ok:true, model}`, `POST /token {pack, topic} -> {token, model, config}`; `gemini.js` exports `makeGemini(apiKey) -> { token(constraints), flash(parts, {json}), tts(text, voice, style) }`.
- The `config` returned by `/token` is the full Live connect config the browser passes through unchanged: `responseModalities:['AUDIO']`, `speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName` from the pack, `systemInstruction` (Task 2), `inputAudioTranscription:{}`, `outputAudioTranscription:{}`, `enableAffectiveDialog:true`, `proactivity:{proactiveAudio:true}`, `sessionResumption:{}`, `contextWindowCompression:{slidingWindow:{}}`, `tools:[{functionDeclarations:[{name:'set_mood', parameters:{type:'OBJECT', properties:{mood:{type:'STRING'}}}}]}]`. The token is minted with `uses:1`, `expireTime` now+30 min, `liveConnectConstraints:{model, config:{responseModalities, speechConfig, systemInstruction}}`.

- [ ] **Step 1: Write the failing tests** in `server.test.js` (run with `node --test src/speak-lab/server/`): `health reports the model`, `token returns the pack voice and the locked model`, `token refuses an unknown pack with 400`, `missing key refuses /token with 503 and the Uzbek line is not involved (server speaks English JSON)`. Use `createServer({ gemini: fakeGemini, env: { GEMINI_API_KEY: 'k' } })` on port 0 and `fetch`.
- [ ] **Step 2: Run them, expect "createServer is not a function"**
- [ ] **Step 3: Implement** `package.json` (`"type":"module"`, dependency `@google/genai` latest, script `"start":"node server.js"`, `"test":"node --test"`), `gemini.js` with `makeGemini` wrapping `GoogleGenAI` (`authTokens.create`, `models.generateContent`), `server.js` with the routes, CORS for `http://127.0.0.1:8791`, `.env` read by hand (no dotenv), `node server.js` starting on 8797 when run directly.
- [ ] **Step 4: Run the tests, expect PASS**
- [ ] **Step 5: `npm install` in `server/`, copy the owner's key into `server/.env`, start the server, `curl http://127.0.0.1:8797/health`, expect `{"ok":true,...}`; then one real `POST /token {"pack":"kind"}`, expect a token string**
- [ ] **Step 6: Commit** `git add .gitignore src/speak-lab/server` (never `.env`) — "Speak lab server: health and a Live token"

### Task 2: Prompt files and the system prompt

**Files:**
- Create: `src/speak-lab/prompts/dombi.md`, `language.md`, `teaching.md`, `safety.md`, `packs/{kind,rude,funny,drama,dangasa,couple}.md`, `src/speak-lab/server/prompts.js`
- Modify: `server.js` (`/token` uses `buildSystemPrompt`), `server.test.js`

**Interfaces:**
- Produces: `buildSystemPrompt({ pack, profile, topic }) -> string` in `prompts.js`; `profile` is the browser's profile object (`{ name, goal, level, interests[], mistakes[], lastTalk, age? }`).
- Prompt content pinned by the spec: `dombi.md` = identity (Dombi, a round black blob, cool and confident, says he is an AI when asked, speaks first with a question, short turns of 1–3 sentences, a question back more often than not, changes the subject or asks about the learner's life now and then, calls `set_mood` before a reply whose mood changes, recasts the learner's line inside his reply and never says "wrong"); `language.md` = English by default, Uzbek mixed in like a bilingual friend, mostly English when the learner is doing fine, the Uzbek quality rule (everyday Tashkent speech, meaning first, natural word order, no calques), a learner who answers in Uzbek is answered then asked for it in English once; `teaching.md` = judge the level from speech, adjust speed and vocabulary, strictness by level (one gentle recast per turn for a beginner, more for B1+); `safety.md` = no adult content, no personal data beyond name and goal, no self-harm instructions; `packs/*.md` = the six styles from spec §4.8 with the owner's example lines in `rude.md`; `couple.md` carries the under-18 line.

- [ ] **Step 1: Write the failing tests:** `system prompt holds the pack text and the learner's name and goal`, `couple pack keeps romance for adults only when age is under 18` (assert the under-18 sentence is present with `age: 15` and absent with `age: 25`; absent when `age` is missing, since this build has no age), `unknown pack throws`.
- [ ] **Step 2: Run, expect "buildSystemPrompt is not a function"**
- [ ] **Step 3: Write the eight Markdown files and `prompts.js`** (reads the files once at start, concatenates `dombi + pack + language + teaching + safety + a "The learner" block from the profile + "Today's topic: …"`).
- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — "Dombi's prompts: identity, language, teaching, safety and the six packs"

### Task 3: Browser audio: mic in, Dombi out

**Files:**
- Create: `src/speak-lab/audio.js`, `pcm-worklet.js`, `checks/audio.html` (a bare page that starts capture, prints chunk sizes and plays a 1 s tone through the queue)

**Interfaces:**
- Produces: `startMic(onChunk) -> Promise<{ stop(), amp() }>` (requests `getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}})`, resamples to 16 kHz in the worklet, calls `onChunk(Int16Array)` every ~100 ms; `amp()` 0–100); `makePlayer() -> { push(Int16Array), clear(), amp(), onIdle(cb) }` playing 24 kHz PCM gap-free through one `AudioContext`; `pcmToBase64(Int16Array) -> string`, `base64ToPcm(string) -> Int16Array`.

- [ ] **Step 1: Write the failing test** in `rules.test.js`: `pcm base64 round-trips` (an Int16Array of 1000 samples survives `base64ToPcm(pcmToBase64(x))`).
- [ ] **Step 2: Run, expect import error**
- [ ] **Step 3: Implement `audio.js` and `pcm-worklet.js`** (the worklet downsamples from the context rate to 16 kHz by averaging; the player schedules buffers back to back with `AudioBufferSourceNode`s and reports idle when the queue drains).
- [ ] **Step 4: Run, expect PASS; open `http://127.0.0.1:8791/src/speak-lab/checks/audio.html` in Chrome, speak, see chunk sizes of 1600 samples and hear the tone**
- [ ] **Step 5: Commit** — "Speak lab audio: 16 kHz mic chunks and a 24 kHz player"

### Task 4: The Live session, Dombi on stage, and a first talk

**Files:**
- Create: `src/speak-lab/index.html`, `speak.css`, `copy.js`, `config.js`, `live.js`, `fake.js`, `dombi.js`, `talk.js` (first version: captions and End only), `app.js`, `checks/talk.js`
- Modify: `rules.test.js`

**Interfaces:**
- Produces, `live.js`: `connectLive({ server, pack, topic, handlers }) -> Promise<session>` where `handlers = { onAudio(Int16Array), onCaption(text, final), onLearnerText(text, final), onInterrupted(), onTurnComplete(), onToolCall(name, args), onClose(reason) }` and `session = { sendAudio(Int16Array), sendText(text), close() }`. It fetches `POST ${server}/token`, builds `new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion } })` from the web build at `/src/speak-lab/server/node_modules/@google/genai/dist/web/index.mjs`, calls `ai.live.connect({ model, config, callbacks })`, keeps the resumption handle from `sessionResumptionUpdate`, and on `goAway` or a close reconnects once with it (a second failure calls `onClose('lost')`). Tool calls answer at once with `sendToolResponse({ functionResponses:[{ id, name, response:{ ok:true } }] })`.
- Produces, `fake.js`: `connectFake(...)` with the same signature, driven by `window.FAKE = { turns: [{ caption, mood, audioMs }] }`: each learner chunk burst followed by 700 ms of silence plays the next scripted turn (silent PCM of `audioMs`, the caption in two pieces, `set_mood`). `talk.js` picks it when `location.search` has `fake=1`.
- Produces, `dombi.js`: `mountDombi(box, size) -> { mood(name), listening(bool), talking(bool), amp(n) }` using `M.rive(canvas, 'Dombi', 'Dombi')` and `dombiInto` from `lab.js` (same as `src/web/people.js` and `onboarding.js:40-56`).
- Produces, `app.js`: `window.SPEAK = { screen, talk }` for the checks, like `window.APP` in `src/web`.
- `copy.js` first strings: title `Dombi bilan suhbat`, End `TUGATISH`, mic blocked `Mikrofon yopiq. Brauzer sozlamalarida ruxsat bering.`, retry `QAYTA URINISH`, listening `Eshityapman…`, lost `Aloqa uzildi.`
- `config.js` first values: `MODEL`, `FALLBACK_MODEL`, `SERVER:'http://127.0.0.1:8797'`, `PACKS` (id, name in Uzbek, voice), `SILENCE_REMARK_MS:50000`, `SILENCE_WHISPER_MS:110000`, `TALK_CAP_MS:900000`, `MIN_WORDS_FOR_CARD:3`.

- [ ] **Step 1: Write the failing test** in `rules.test.js`: `reconnect policy gives up after two failures` for `nextReconnect(attempt) -> number|null` in `rules.js` (0 → 500 ms, 1 → 1500 ms, 2 → null).
- [ ] **Step 2: Run, expect failure**
- [ ] **Step 3: Implement `rules.js` `nextReconnect`, `live.js`, `fake.js`, `dombi.js`, `talk.js` v1** (mic → `session.sendAudio`; `onAudio` → player; `onCaption` → the caption line under Dombi; `onInterrupted` → `player.clear()`; `onToolCall('set_mood')` → `dombi.mood`; `listening` on while the mic amp is above 6 and Dombi is quiet, `talking` while the player plays, `amp` from whichever is active; mic refusal → the Uzbek line and retry), `index.html` (lang `uz`, the lab's css, `rive.js`, `motion.js`, `sound.js`, `lab.js`, then `app.js`), `speak.css`, `app.js` (boot straight into a talk with pack `kind`, topic `salom` for now; the start page comes in Task 5).
- [ ] **Step 4: Write `checks/talk.js`** (Playwright, `chromium.launch({ args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'] })`, opens `/src/speak-lab/?fake=1`, sets `window.FAKE` with three turns, asserts three captions appear in order, the mood changes to `laugh` on the second, `End` shows a screen with class `.report`); also a second run with `--deny-permission-prompts` style (block the mic via `context.grantPermissions([])`) asserting the `Mikrofon yopiq` line.
- [ ] **Step 5: Run `node src/speak-lab/checks/talk.js`, expect "3 captions, mood laugh, mic-blocked line: ok"**
- [ ] **Step 6: Real run:** start both servers (`node design/motion/serve.js`, `node src/speak-lab/server/server.js`), open `http://127.0.0.1:8791/src/speak-lab/`, talk for two minutes. Note the latency printed in the console. Expected: Dombi speaks first, answers within about a second, stops when cut off.
- [ ] **Step 7: Commit** — "Speak lab: a first live talk with Dombi, captions and a fake session for checks"

### Task 5: Start page, profile and topic cards

**Files:**
- Create: `src/speak-lab/start.js`, `profile.js`
- Modify: `app.js` (router: `start → talk → report`), `copy.js` (card titles, buttons), `config.js` (`TOPICS`), `rules.test.js`

**Interfaces:**
- Produces, `profile.js`: `loadProfile() -> profile`, `saveProfile(profile)`, `seedFromApp(profile, storage) -> profile` (reads `akademiya.name`, `akademiya.goal` ∈ school/ielts/travel/work/self, `akademiya.level`; `self` → goal `talk`), `addPhrases(profile, phrases[]) -> profile` (dedupe by `en`), `resetProfile()`. Storage key `speak.profile`. Profile shape: `{ name:'', goal:'', level:'', interests:[], mistakes:[], lastTalk:'', phrasebook:[{en, uz, date}], talks:0 }`.
- Produces, `start.js`: `startPage(root, { onStart({ pack, topic }) })`; cards from `CFG.TOPICS`: goal group (`ielts`: IELTS 1-qism savollari; `work`: Ish haqida; `travel`: Sayohat; `school`: Maktab) and the "just talk" group (Bugungi kuningiz, Futbol, Memlar va TikTok, K-pop, Inglizchamni roast qil, Nima bo'lsa ham); a text field `yoki o'zingiz yozing`; the pack picker with the six names in Uzbek; `BOSHLASH`.
- `rules.js` gets `topicsFor(goal) -> cards[]` (the goal group first, then the rest; `talk` or empty goal → only the second group).

- [ ] **Step 1: Write the failing tests:** `seedFromApp maps self to talk and keeps a saved name`, `addPhrases does not duplicate a phrase`, `topicsFor puts the goal cards first`.
- [ ] **Step 2: Run, expect failures**
- [ ] **Step 3: Implement `profile.js`, `start.js`, the router in `app.js`** (the talk receives `{ pack, topic, profile }`; `/token` gets `{ pack, topic, profile }` so the prompt knows the learner).
- [ ] **Step 4: Run, expect PASS; extend `checks/talk.js`: open the page, assert the start page has six packs and `BOSHLASH`, pick `Futbol`, start, then the existing talk assertions**
- [ ] **Step 5: Commit** — "Speak lab: start page with topics, packs and the learner's profile"

### Task 6: Feedback cards

**Files:**
- Create: `src/speak-lab/cards.js`, `prompts/feedback.md`
- Modify: `server.js` (`POST /feedback`), `gemini.js` (flash with an audio part), `talk.js`, `rules.js`, `rules.test.js`, `server.test.js`

**Interfaces:**
- Produces, server: `POST /feedback { audio (base64 16 kHz PCM of the learner's last turn), learnerText, dombiText, history:[{who,text}] (last 4), level } -> { better:'', pron:'', level:'' }` (empty strings mean no card); the prompt in `feedback.md` asks for JSON only, the "better" line in English, the pronunciation note in Uzbek naming the word and the sound, nothing when there is nothing real to say.
- Produces, browser: `rules.js` `shouldAskFeedback(learnerText, cfg) -> bool` (≥ `MIN_WORDS_FOR_CARD` words), `cards.js` `mountCards(column) -> { show(kind, text), clear() }` (kinds `better`, `pron`; newest on top; a card fades after 40 s; at most one of each kind per turn). `talk.js` keeps the learner's PCM for the current turn (from the first chunk above the amp floor to `onTurnComplete`'s start) and posts it after each learner turn; a failed call is ignored (no card).

- [ ] **Step 1: Write the failing tests:** server `feedback returns the model's json and empty strings when the model says nothing`; rules `shouldAskFeedback is false under three words`.
- [ ] **Step 2: Run, expect failures**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, expect PASS; extend `checks/talk.js`: the fake server mode (`?fake=1` also makes `talk.js` call a `FAKE.feedback` function instead of the server) returns `{better:'I went to the bazaar yesterday.', pron:''}` once; assert one card with that text and no second card; then a turn where the fake returns a rejected promise and assert the talk continues**
- [ ] **Step 5: Real run: say three clumsy sentences; expect a card within ~3 s of each, in English with an Uzbek note, nothing spoken by Dombi about it**
- [ ] **Step 6: Commit** — "Speak lab: 'say it better' and pronunciation cards from the text model"

### Task 7: Explain in Uzbek and Slower

**Files:**
- Create: `prompts/explain.md`
- Modify: `server.js` (`POST /explain`, `POST /slower`), `gemini.js` (tts), `cards.js` (the two buttons under each caption, the Uzbek explanation under the line), `talk.js`, `copy.js` (`O'ZBEKCHA TUSHUNTIR`, `SEKINROQ`), `server.test.js`

**Interfaces:**
- `POST /explain { line, history } -> { uz }` (explain.md: two or three sentences of natural Tashkent Uzbek on what the line means and why it is said that way; the quality rule from `language.md` is included).
- `POST /slower { line, voice } -> { pcm (base64, 24 kHz) }` via `gemini-3.8-flash-tts` with the director's-notes layout (style: "slow, clear, each word separate, same friendly tone"; the TTS models take no system instruction).
- `talk.js`: while a slow repeat plays, the mic chunks are not sent (so Dombi is not interrupted by his own slow voice through speakers); the player plays the repeat, then the mic resumes.

- [ ] **Step 1: Write the failing tests:** server `explain returns uz text`, `slower returns base64 pcm`.
- [ ] **Step 2: Run, expect failures**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, expect PASS; extend `checks/talk.js`: press `O'ZBEKCHA TUSHUNTIR` on the first caption, assert the explanation text (fake) appears under it; press `SEKINROQ`, assert the player received audio (expose `window.SPEAK.talk.playerPushes`)**
- [ ] **Step 5: Real run: press both on a real line; the explanation reads like a person wrote it; the slow line is the same words, slower**
- [ ] **Step 6: Commit** — "Speak lab: explain in Uzbek and say it slower"

### Task 8: Silence nudges and Dombi's own initiative

**Files:**
- Modify: `talk.js`, `rules.js`, `rules.test.js`, `testbar.js` (create: the test bar with "nudge now" buttons), `copy.js`

**Interfaces:**
- `rules.js` `silenceStage(msSinceLearnerSpoke, msSinceLastNudge, cfg) -> 'none'|'remark'|'whisper'` (remark at ≥ `SILENCE_REMARK_MS`, whisper at ≥ `SILENCE_WHISPER_MS`, each at most once per silence, never while Dombi is talking).
- `talk.js` sends the nudge as a client text turn: remark → `session.sendText('[The learner has been quiet for a while. Say one casual thing to pull them back in, in character.]')`, whisper → `session.sendText('[The learner has been silent for about two minutes. Whisper to them in natural Uzbek: ask gently what is up and offer an easy question.]')`. The timer resets on learner speech (input transcription or amp above the floor).
- `testbar.js`: `mountTestBar(root, talk)` with model name, last latency ms, minutes, cost, mic level, mood, `nudge remark`, `nudge whisper`, `reset memory`.

- [ ] **Step 1: Write the failing test:** `silenceStage gives remark at 50 s, whisper at 110 s, none again right after a nudge`.
- [ ] **Step 2: Run, expect failure**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, expect PASS; extend `checks/talk.js`: with the fake clock (`window.SPEAK.talk.tick(ms)`), advance 50 s, assert a remark nudge was sent, advance to 110 s, assert a whisper nudge; the fake session records `sendText` calls**
- [ ] **Step 5: Real run: stay quiet; hear a remark, then an Uzbek whisper**
- [ ] **Step 6: Commit** — "Speak lab: Dombi speaks up when you go quiet"

### Task 9: End, the report, memory and the phrasebook

**Files:**
- Create: `src/speak-lab/report.js`, `memory.js`, `prompts/report.md`, `prompts/profile.md`
- Modify: `server.js` (`POST /report`), `talk.js`, `app.js`, `profile.js`, `rules.js`, `rules.test.js`, `server.test.js`, `copy.js`

**Interfaces:**
- `POST /report { transcript:[{who,text}], cards:[...], profile, pack, topic } -> { stars:1|2|3, why:'', phrases:[{en,uz}], pron:[''] (≤3), level:'', profileUpdate:{ interests:[], mistakes:[], lastTalk:'' } }` (one flash call, JSON only; `report.md` + `profile.md`). Level words: Zero, Beginner, Elementary, Intermediate, Upper-intermediate.
- `rules.js` `emptyReport(reason) -> report` (0 stars, `why` from `COPY`, no phrases) used when the transcript has no learner line or the call fails; `mergeProfile(profile, update) -> profile` (union of interests and mistakes, capped at 20 each, `lastTalk` replaced, `talks + 1`).
- `report.js` `reportScreen(root, report, { onAgain, onStart })` shows stars, why, phrases (saved on show through `addPhrases`), pron notes, the level, `YANA GAPLASHISH`, `BOSHIGA`; the failed case shows `Hisobot kelmadi.` and `QAYTA URINISH`.
- `memory.js` `memoryScreen(root, profile, { onChange })`: the profile in plain Uzbek sentences, the phrasebook list, a delete per item and `HAMMASINI O'CHIRISH`. Reached from the start page link `Dombi nimani eslaydi`.

- [ ] **Step 1: Write the failing tests:** rules `emptyReport has zero stars and no phrases`, `mergeProfile unions and caps`; server `report returns the model's json`.
- [ ] **Step 2: Run, expect failures**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, expect PASS; extend `checks/talk.js`: End → report with the fake's `{stars:2,...}`; reload the start page and assert the phrasebook on the memory page has the phrase; delete it; assert empty. Second run: End with no learner turns → `siz gapirmadingiz`, 0 stars. Third: the fake report rejects → `Hisobot kelmadi.` and retry works**
- [ ] **Step 5: Commit** — "Speak lab: the report, the phrasebook and what Dombi remembers"

### Task 10: Cost, caps, logs

**Files:**
- Create: `server/cost.js`, `server/log.js`
- Modify: `server.js` (`POST /log`, budget check in `/token`), `talk.js` (seconds in/out, the cap, goodbye), `testbar.js`, `rules.js`, `rules.test.js`, `server.test.js`, `copy.js`, `config.js` (`MONTHLY_BUDGET_USD:10`, `PRICE` per audio second in/out as a config pair the owner updates from Google's price page)

**Interfaces:**
- `rules.js` `estimateCost(secIn, secOut, price) -> usd`; `cost.js` `ledger(dir) -> { add(talk), monthTotal() }` persisted in `server/logs/ledger.json`.
- `POST /log { id, transcript, cards, secIn, secOut, latencies[], interruptions, audio? }` writes `server/logs/<date>-<id>/` (transcript.json, dombi.wav if audio sent, stats.json) and adds to the ledger; `/token` answers `402 { reason:'budget', spent, budget }` when `monthTotal() >= MONTHLY_BUDGET_USD`; the start page shows `Bu oy uchun byudjet tugadi ($spent / $budget).`
- The cap: at `TALK_CAP_MS − 20 s` the browser sends `sendText('[Time is almost up. Say goodbye in character in one or two sentences.]')`; at the cap it ends the talk and opens the report.

- [ ] **Step 1: Write the failing tests:** rules `estimateCost multiplies seconds by price`; server `token refuses with 402 when the ledger is over budget`, `log writes a folder and grows the ledger`.
- [ ] **Step 2: Run, expect failures**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, expect PASS; extend `checks/talk.js`: `window.SPEAK.talk.tick` to the cap, assert the goodbye nudge then the report; fake server returns 402 on token → assert the budget line on the start page**
- [ ] **Step 5: Commit** — "Speak lab: minutes, cost, the monthly budget and talk logs"

### Task 11: Last pass

**Files:**
- Modify: `speak.css`, `talk.js`, `app.js`, `checks/talk.js`; `docs/ideas/tech-stack.md` §0 gets five lines on where the speak lab is and how to start it; `docs/ideas/ai-plan.md` Part 2 gets a dated line that free talk is built in the browser.

- [ ] **Step 1: Dark mode** follows the system like the lab (`document.body.classList` and `dombi` `dark`); Reduce Motion respected through `M.reduce`. Extend `checks/talk.js` with a dark run and a reduce-motion run (Playwright `colorScheme: 'dark'`, `reducedMotion: 'reduce'`), expect no page errors.
- [ ] **Step 2: Run everything:** `node --test src/speak-lab/ src/speak-lab/server/` and `node src/speak-lab/checks/talk.js`, expect all PASS.
- [ ] **Step 3: Owner's ear tests** (spec §6), one per line, recorded in `docs/superpowers/specs/2026-10-28-speaking-companion-answers.md` under "Ear tests": a ten-minute talk feels human · answers within about a second and stops when cut off · Uzbek sounds like Tashkent · the humour lands · the cards help, the pronunciation notes fit his accent · two devices keep talking · the cost of ten minutes.
- [ ] **Step 4: Commit** — "Speak lab: dark mode, Reduce Motion, docs"

---

## Self-review notes

- Spec coverage: §4.1 Task 5 · §4.2 Tasks 4, 6, 7 · §4.3 Task 8 · §4.4 Tasks 2, 5 (copy) · §4.5 Task 2 · §4.6–4.7 Task 9 · §4.8 Tasks 2, 5 · §4.9 Tasks 4, 11 · §5.1 Tasks 1, 4, 10 · §5.2 Tasks 3, 4 · §5.3 Task 4 · §5.4 Task 2 · §5.5 Task 2 · §5.6 Task 10 · §5.7 Tasks 8, 10 · §6 Task 11 · §8 (Navoiy) is a separate task, not in this plan.
- Review Focus 1 → Task 4 check; 2 → Tasks 4 (rules) and 9 (report after loss); 3 → Tasks 8, 9; 4 → Tasks 6, 9; 5 → Task 10.
- Names used across tasks: `connectLive`/`connectFake` share `{ sendAudio, sendText, close }` and the handler names; `rules.js` holds `nextReconnect`, `topicsFor`, `shouldAskFeedback`, `silenceStage`, `emptyReport`, `mergeProfile`, `estimateCost`; `profile.js` holds `loadProfile`, `saveProfile`, `seedFromApp`, `addPhrases`, `resetProfile`.
