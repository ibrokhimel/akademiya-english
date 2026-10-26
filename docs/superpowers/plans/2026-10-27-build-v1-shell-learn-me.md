# Build v1 · Four Tabs, Learn, Me, Lessons with Dombi · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A test APK for the owner's Redmi with the redesigned four-tab app: Learn and Me finished, Speak and Practice showing their designed lists (activities open the "not ready" page), lessons where Dombi helps (pick A), Dombi's three phone levels and the "Kamroq harakat" switch, the redesigned problem states, and dark mode.

**Architecture:** Work in `src/mobile` (Expo SDK 57, expo-router). Screens are rebuilt to match the approved Pencil finals; pure rules (help ladder, Dombi moment/level choice, glad-vs-night) live in `src/core/` as plain JS with `node --test` tests, so they are tested before any screen uses them. Dombi's still poses are PNGs exported from Pencil; a new `Dombi` component chooses Rive or a still image per the moment map and the phone level.

**Tech Stack:** Expo SDK 57, React Native 0.86, expo-router, Reanimated, @rive-app/react-native 0.5.4, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-23-english-redesign-design.md`. Approved designs: `docs/superpowers/specs/2026-10-23-english-redesign-choices.md` (rounds 1–4), `docs/superpowers/specs/2026-10-26-dombi-moment-map.md`, `docs/superpowers/specs/2026-10-26-state-inventory.md`, Pencil `pendev/Akademiya English.pen` sections "Redesign · Tabs" (frame `Final` `Xic9e`), "Redesign · Activities & lessons", "Redesign · Dombi", "Redesign · States".

## Global Constraints

- **Build what is designed, nothing else** (owner, 2026-10-23). Every element on screen comes from an approved Pencil final; layout, copy and icons are read from it (Export `html-css` of a frame is allowed for reading measurements; it is never pasted in as code).
- Uzbek text exactly as in the finals. Lines still waiting for the owner ("Hali yozuv yo'q…", "Suhbat uchun internet kerak…") go in as drawn and are listed in the final message.
- Colours and type only from `src/mobile/src/components/system.ts` (reads `design/system/tokens.json`); no new raw hex in new code.
- Streak: only finished lessons count (already true in `src/core/progress.js` `streakOf`); nothing in v1 changes it.
- Expo: before touching an Expo or React Native API, read the SDK 57 docs (`src/mobile/AGENTS.md`). Use `npx expo install` for packages.
- Every task ends with `npm run typecheck`, `npm run lint`, `npm test` passing in `src/mobile`, and its own commit(s). No `Co-Authored-By` trailer.
- Android builds run through `node scripts/build-android.js` (a hook blocks `gradlew` in Bash; start it from a background command). Never touch the signing folder.
- Reduce Motion (Reanimated `useReducedMotion`) always means Dombi Still and no movement.

## Review Focus

1. **Phone level Still or Reduce Motion:** no Rive view is mounted anywhere; every Dombi moment shows its still pose.
2. **Two misses on the same item, then a right answer:** the help offer appears once, and the counter resets on the next item.
3. **A lesson opened from a cold link** (navigation test): back still lands on the Learn tab with four tabs.
4. **Dark mode** on every new screen, including the help sheet and leave sheet scrims.
5. **Old saved data:** a phone with the current app installed upgrades without losing progress, settings or recordings (new settings keys have defaults).

---

### Task 1: Core rules with tests

**Files:** Create `src/core/dombi.js`, `src/core/help.js`; Modify `src/core/core.test.js`.

**Interfaces — Produces:**
- `stillPoseFor(moment) -> string` and `rigFor(moment) -> {mood, gesture, trigger?, talking?, listening?}` for every moment key in the moment map (`idle`, `guide`, `glad`, `night`, `onboarding`, `emptyTab`, `yourTurn`, `explaining`, `correct`, `notYet`, `helpOffer`, `helpSheet`, `mistakes`, `lessonResult`, `levelUp`, `activityEnd`, `talking`, `listening`, `sceneGuide`, `micOff`, `waiting`).
- `animates(moment, level) -> boolean` — `full`: true; `light`: true only for `onboarding`, `correct`, `notYet`, `lessonResult`, `levelUp`, `activityEnd`; `still`: false.
- `idleMoment({now, lastOpen}) -> 'glad' | 'night' | 'idle'` — glad when the last open was 2+ days ago (glad wins over night, owner round 4); night from 22:00 to 05:00.
- `levelFrom({fps, reduceMotion, userLessMotion, measured}) -> 'full'|'light'|'still'` — reduce motion → still; userLessMotion → still; otherwise the measured level.
- `helpReducer(state, action)` with state `{misses, step, offered}`; actions `miss`, `open`, `next`, `item` (new item resets). `offered` turns true on the 2nd miss of the same item, once.

- [ ] **Step 1:** Write the tests in `core.test.js` (one `test()` per export, with the values above, e.g. `animates('talking','light') === false`, `idleMoment` at 23:30 two days after the last open → `'glad'`, `helpReducer` two `miss` → `offered:true`, then `item` → `{misses:0, step:0, offered:false}`).
- [ ] **Step 2:** Run `node --test src/core/core.test.js` → FAIL (modules missing).
- [ ] **Step 3:** Implement both modules.
- [ ] **Step 4:** Run again → PASS; `npm test` in `src/mobile` passes.
- [ ] **Step 5:** Commit (`Core: Dombi moment rules and the lesson help ladder`).

### Task 2: Dombi component with still poses and phone levels

**Files:** Create `src/mobile/src/components/Dombi.tsx`, `src/mobile/src/lib/dombiLevel.ts`, `src/mobile/assets/dombi/*.png`; Modify `src/mobile/src/data/assets.ts`, `src/mobile/src/lib/store.tsx` (settings `lessMotion: false`, `dombiLevel: 'full'`), `src/mobile/src/app/onboarding.tsx`.

- [ ] **Step 1:** Export every pose the moment map uses from Pencil (`Dombi / 150|80|48 / …` components, PNG at 3×, light and dark variants via a theme-dark copy) into `assets/dombi/`, named `<size>-<pose>[-dark].png`; add them to `assets.ts`.
- [ ] **Step 2:** `Dombi` props `{moment, size}`: reads level from `useDombiLevel()`; if `animates(moment, level)` renders the existing `Actor` with `rigFor(moment)`, else an `Image` of `stillPoseFor(moment)` at the size, dark variant when the theme is dark.
- [ ] **Step 3:** `useDombiLevel()` combines the stored level, `lessMotion` and Reanimated `useReducedMotion()` through `levelFrom`. During onboarding, `useFrameMeter` runs in the background on the screens that already show Dombi and stores `dombiLevel` (thresholds: ≥50 fps full, ≥30 light, else still — the spec leaves the numbers to the builder). No new screen, no waiting.
- [ ] **Step 4:** typecheck, lint, test; commit (`Dombi: still poses and the three phone levels`).

### Task 3: Four tabs

**Files:** Modify `src/mobile/src/app/(tabs)/_layout.tsx`, `src/mobile/src/components/AppTabBar.tsx`, `src/mobile/src/data/assets.ts`, `src/mobile/scripts/navigation.test.mjs`, `src/mobile/src/lib/navigationState.ts`; Create `(tabs)/speak.tsx`, `(tabs)/practice.tsx`, `(tabs)/me.tsx`; Remove `(tabs)/progress.tsx`, `(tabs)/profile.tsx` after their parts move (Task 5).

- [ ] **Step 1:** Add the navigation test cases first: the tab routes are `index, speak, practice, me`; a cold `/recordings` link backs through Settings to the Me tab. Run `npm run test:navigation` → FAIL.
- [ ] **Step 2:** Tab bar labels and icons as in the final tab bar component (`Tab bar / 4 / …`): O'rganish, Gapirish, Mashq, Siz, with the icons from `pendev/icons-r2` that the final uses. Keep the sliding square and drag.
- [ ] **Step 3:** Tests pass; typecheck, lint; commit (`Tabs: four tabs`).

### Task 4: Learn tab

**Files:** Modify `src/mobile/src/app/(tabs)/index.tsx`.

- [ ] **Step 1:** Rebuild to the final `Learn · Final` `rFH5C` and `Learn · First time` `SlFQT`: tab header with the two stat pills, the next-lesson hero (violet, title, BOSHLASH), the path with the current node in reward yellow, Dombi overlay bottom right (`Dombi moment="idle"` / `glad` / `night` from `idleMoment`), first-time bubble lines as drawn.
- [ ] **Step 2:** typecheck, lint, test; commit (`Learn: redesigned tab`).

### Task 5: Me tab

**Files:** Create/modify `(tabs)/me.tsx`; reuse `components/ProfileDetails.tsx`, `Week` from the old progress screen; Modify `src/app/recordings.tsx` (empty state).

- [ ] **Step 1:** Build to `Me · Final (#27, designed by Ibrokhim)` `ygNRX` and `Me · First time` `uezjU`; settings and account entries as drawn; phrases and calendar reachable as drawn. Test-only parts stay behind `testToolsEnabled` as today.
- [ ] **Step 2:** Recordings empty state as `Me · Recordings · Empty` (Dombi 150 / point, the drawn line).
- [ ] **Step 3:** typecheck, lint, test; commit (`Me: redesigned tab and empty recordings`).

### Task 6: Speak and Practice tabs (lists only)

**Files:** `(tabs)/speak.tsx`, `(tabs)/practice.tsx`.

- [ ] **Step 1:** Build to `Speak · Final` `DOKlj`, `Speak · First time` `V4Uh5`, `Practice · Final` `R3rLh` (daily card is hidden in the final — leave it out), `Practice · First time (C)` `MpuCW`. Every activity row and the conversation start call `showProblem("not-ready")` (the owner's 31d page). Locked rows as drawn.
- [ ] **Step 2:** typecheck, lint, test; commit (`Speak and Practice: tab lists`).

### Task 7: Lessons with Dombi helping (pick A)

**Files:** Modify `src/mobile/src/screens/LessonScreen.tsx`, `src/mobile/src/components/Exercise.tsx`; Create `src/mobile/src/components/HelpSheet.tsx`, `LeaveSheet.tsx`, `AnswerPanel.tsx`.

- [ ] **Step 1:** `AnswerPanel` to `Answer panel / correct` `JfNWZ` and `/ not yet` `RfoaU`: green wash or amber wash, Dombi 48 (`correct` / `notYet` moments), title, one reason line, the existing DAVOM ETISH button and `testID="lesson-next"`.
- [ ] **Step 2:** Dombi overlay in the lesson corner (`Dombi overlay / quiet`); tap opens `HelpSheet` (`mSJbv`): 1 slow replay, 2 first word, 3 Uzbek explanation (the item's existing tip), 4 show the answer; state from `helpReducer`. After the 2nd miss on an item the overlay shows the bubble "Qiyin bo'lyaptimi? Yordam beraymi?" (`A3 · After two misses`).
- [ ] **Step 3:** `LeaveSheet` (`Y6CcM`) on the close button: title and "Shu paytgacha qilganlaringiz saqlanadi.", as drawn.
- [ ] **Step 4:** Speech unavailable in a lesson as `A4 · Speech unavailable` (`pZxRg`).
- [ ] **Step 5:** typecheck, lint, test; commit (`Lesson: Dombi helps, new answer panel and leave sheet`).

### Task 8: Settings switch and problem states

**Files:** Modify `src/mobile/src/app/settings.tsx`, `src/mobile/src/components/ProblemContent.tsx`, `src/mobile/src/lib/problem.ts` (if a choice is added).

- [ ] **Step 1:** "Kamroq harakat" row (pick B) under "Tungi rejim", icon sparkles. Reduce Motion on: switch on, faded, locked, note "Telefoningizda harakat kamaytirilgan.". Measured Still: switch on, can be turned off (owner round 4).
- [ ] **Step 2:** Problem pages as the finals in "Redesign · States": Dombi poses from the inventory; offline text "Suhbat uchun internet kerak. Ulanish qaytishi bilan avtomatik davom etamiz." plus the DARSLARGA QAYTISH button (goes to Learn).
- [ ] **Step 3:** typecheck, lint, test; commit (`Settings and problem states: redesign`).

### Task 9: Dark mode pass and test APK

- [ ] **Step 1:** With `Tungi rejim` on, open every v1 screen in the dev build and compare to the dark finals; fix colours that are not from `system.ts`.
- [ ] **Step 2:** Build the test APK: `npm run android:test-apk` (keeps the owner's data; see `RELEASE.md`). Expected: `.expo/builds/akademiya-test-arm64-v8a,x86_64.apk`.
- [ ] **Step 3:** A fresh reviewer checks the branch against the spec, the finals and the Review Focus; fix Critical and Important findings with a test first where logic is involved.
- [ ] **Step 4:** Commit; give the owner the APK path and the install command from `RELEASE.md`.
