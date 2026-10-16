# Prompt for Codex (paste everything below the line)

Run Codex on the Mac, inside `~/Documents/akademiya-english` (see [mac-setup.md](mac-setup.md) first: Xcode,
Homebrew, the clone and `npm ci` must already be done).

---

You are building the phone app for **Akademiya English**, a speaking-first English course for Uzbek speakers
(13+). The whole MVP already works as a **browser version**. Your job is to rebuild it as a real iOS app in
`src/mobile/` (Expo SDK 57, React Native), step by step, and run it in the iPhone simulator.

## Read first
- `src/mobile/AGENTS.md`: Expo rules. Expo changes every release, so read the SDK 57 docs, never your memory.
  Add packages only with `npx expo install`.
- `docs/ideas/tech-stack.md`: §0 (build order and what the browser version does), §3 (the chosen libraries),
  §4 (the two test builds).
- `docs/roadmap.md`: where the project stands.

## Sources of truth (copy, don't invent)
- **Behaviour, screens, Uzbek text:** the browser version in `src/web/`. Run it with
  `node design/motion/serve.js` and open `http://127.0.0.1:8791/src/web/`. Every screen, word and animation the
  phone app shows must match it. Never write new UI text; the Uzbek lines are approved as they are.
- **Rules (lessons, checking answers, streak, level, progress):** `src/core/` (plain JS, with `core.test.js`).
  Reuse it; don't rewrite the logic.
- **Lessons and audio:** `src/content/` (unit JSON files, phrases, traps, and `audio/` with normal and slow
  clips, word times and mouth shapes, British and American sets; the learner picks in Settings).
- **Dombi and other animations:** `design/rive/out/waiters.riv` (artboards `Dombi`, the waiters, the `FX ...`
  effects, `Streak Flame`). See how `src/web/people.js` and `design/motion/motion.js` drive them.
- **Sounds:** `design/sound/final/`. **Icons and lesson pictures:** `pendev/icons-r2/`.
- **App icon:** already done (`src/mobile/assets/icon*.png`, `android-icon-*.png`, wired in `app.json`).
- **Launch screen images:** `src/mobile/assets/splash-light.png` and `splash-dark.png` (Dombi and the name,
  transparent background, made at 4x, so about 293 pt wide). Background `#FFFFFF` light, `#121214` dark.
- The design file (`pendev/Akademiya English.pen`) only opens in the Pencil app. You don't need it: the
  browser version already matches it.

## Steps (three milestones: stop only there so the owner can try it)
1. **Launch screen.** Add `expo-splash-screen` with the two images above, light and dark. Run
   `npx expo run:ios` and show the app opening.
2. **Test B: listen, then speak** (tech-stack.md §4). One test screen: play a lesson clip (e.g. "A coffee,
   please.") with Dombi's mouth moving to its mouth-shape timeline, then start speech recognition straight away
   with `expo-speech-recognition`. Show the words heard live on screen, and log the start delay and how often
   loudness arrives. The real question is whether the iPhone's own recogniser understands the owner's Uzbek accent
   on the lesson phrases; that needs a real iPhone, so say so when the simulator can't answer it.
   **Milestone 1: stop here and report what you found.** If the iPhone's recogniser isn't good enough, the
   fallback is already decided: send the recorded answer to the Whisper server on the owner's PC
   (`POST /stt` with the sound, answer `{"text": ...}`; see `src/web/hear.js` for how the browser version uses it).
3. **One lesson, start to finish** (Lesson 6, every exercise, feedback sheets, "can't speak now", the mistakes
   round, the new-phrase card, the result). **Milestone 2: stop here and show it.**
4. **The rest, in the browser version's order** (tech-stack.md §0, steps 3–8): all lessons and checkpoints, the
   Learn page, onboarding, Progress/Profile/Settings, pop-ups and problem screens, the phone-only pieces (real
   daily reminder, haptics, mic permission), then a pass over dark mode, Reduce Motion and picking up after the app
   is closed. Save progress on the phone (`expo-sqlite`, the same list of events the browser version keeps) and
   send it to the local server when it can be reached. **Milestone 3: stop at the end and show everything.**
5. **Android, after the iPhone works:** build the same code for Android on the Mac (emulator) and fix what differs.

## Decided with the owner (tech-stack.md §0b, don't reopen these)
- **iPhone first**; Android only after step 4.
- **Lessons and audio are built into the app** from `src/content/`. No downloading content.
- **Server = PocketBase on the owner's PC**, reached over the home Wi-Fi (Claude sets it up on the PC and gives
  you the address). It keeps accounts, progress events, settings, voice recordings, feedback and usage numbers.
  If it can't be reached, the app keeps working from the phone's own saved data.
- **Sign-in = a simple test account** (email and password in PocketBase). Keep the Google and Apple buttons as
  designed but leave them "not ready yet" for now.
- **Speech fallback = Whisper on the owner's PC** (above). Phone and PC are on the same Wi-Fi; local network
  addresses must be allowed in the app (iOS asks the learner for local network access once).
- The PC's address, the ports, the collections and their rules are in `docs/local-servers.md` (ready). The
  servers only run while the owner has `node server/start.js` open on the PC: if one doesn't answer, ask the owner
  to start it rather than working around it.

## Rules
- Work on a branch (`phone-app`), never on `main`. Many **small commits**, one per finished piece, each with a
  clear message. Push when a step is done.
- Don't change `src/web/`, `src/core/` rules or `src/content/` unless something is truly broken. If it is, say
  what and why first.
- Light and dark mode on every screen; respect Reduce Motion.
- Dombi is a round black blob with two white pill eyes and a centred smile. Never make him cute or kawaii, and
  don't redraw him: use the Rive file.
- Keep going between milestones without waiting. After every piece: run `npx tsc --noEmit` and
  `npx expo lint`, run it in the simulator and look at a screenshot. Don't say something works until you have
  seen it run. At each milestone, tell the owner in a few plain sentences what to try.
- If a step needs the owner (a real iPhone, a permission, a choice), stop and ask in one short question.
