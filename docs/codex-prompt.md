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

## Steps (stop after each one so the owner can try it in the simulator)
1. **Launch screen.** Add `expo-splash-screen` with the two images above, light and dark. Run
   `npx expo run:ios` and show the app opening.
2. **Test B: listen, then speak** (tech-stack.md §4). One test screen: play a lesson clip (e.g. "A coffee,
   please.") with Dombi's mouth moving to its mouth-shape timeline, then start speech recognition straight away
   with `expo-speech-recognition`. Show the words heard live on screen, and log the start delay and how often
   loudness arrives. The real question is whether the iPhone's own recogniser understands the owner's Uzbek accent
   on the lesson phrases; that needs a real iPhone, so say so when the simulator can't answer it. Report what you
   found before going on.
3. **The screens, in the browser version's order** (tech-stack.md §0, steps 2–8): one lesson start to finish,
   all lessons and checkpoints, the Learn page, onboarding, Progress/Profile/Settings, pop-ups and problem screens,
   then a pass over dark mode, Reduce Motion and picking up after the app is closed. Save progress on the phone
   (`expo-sqlite`, the same list of events the browser version keeps).

## Rules
- Work on a branch (`phone-app`), never on `main`. Many **small commits**, one per finished piece, each with a
  clear message. Push when a step is done.
- Don't change `src/web/`, `src/core/` rules or `src/content/` unless something is truly broken. If it is, say
  what and why first.
- Light and dark mode on every screen; respect Reduce Motion.
- Dombi is a round black blob with two white pill eyes and a centred smile. Never make him cute or kawaii, and
  don't redraw him: use the Rive file.
- After each step: run `npx tsc --noEmit` and `npx expo lint`, run the app in the simulator and take a
  screenshot, and tell the owner in a few plain sentences what to try. Don't say something works until you have
  seen it run.
- If a step needs the owner (a real iPhone, a permission, a choice), stop and ask in one short question.
