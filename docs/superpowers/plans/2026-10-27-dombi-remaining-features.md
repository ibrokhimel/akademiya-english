# Dombi · Remaining Touch Moves and States · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every Dombi touch move from motion-plan §8 that the app lacks, plus the four moment-map states whose screens exist, work on the phone.

**Architecture:** New rules join the pure touch state machine in `src/core/touch.js` (events in, rig effects out, node tests). The app feeds them from new sources: a screen-wide finger watcher (eyes), the Learn tab's card and flame rects (perch zones), a two-finger pinch, phone sensors (`expo-sensors`), the mic level while he is held (`expo-audio` metering), word tiles dragged onto him (lessons) and the answer panel (high-five). The four states are moment changes on existing screens.

**Tech Stack:** Expo SDK 57, react-native-gesture-handler, Reanimated, @rive-app/react-native, expo-audio, expo-sensors (new), Node test runner.

**Spec:** `docs/ideas/motion-plan.md` §8 (touch table, playground `design/rive/play.html` is the reference behaviour and numbers) and `docs/superpowers/specs/2026-10-26-dombi-moment-map.md`. Owner answers 2026-10-27: mic only while he is held; feed = lesson word tiles; high-five = the 48 px Dombi in the right-answer panel; conversation and scene states wait for their screens. The Rive file (`design/rive/out/waiters.riv`) already has every input used here: `play` = peek · warm · wind · highfive, triggers `eat`, `clap`, `playoff`, `snap`, `shook`, numbers `stretch`, `amp`, `lookX/Y`, boolean `looking`.

## Global Constraints

- Numbers as in `play.html`: eyes `lookX/Y = clamp((p − eye) / 2.2, −100, 100)`, eye = feet − 95 (scaled to size 155→his size), released after 2.5 s; off-screen = let go beyond the screen edge, or a horizontal swipe faster than 2100 px/s → hidden 0.7 s, then slides in from a random side with `looking` toward the middle; peek zone = let go over the top edge of the Learn card (±20 px inside its sides, within 30 px above its top) → sits on it, `play = peek` after 420 ms; warm zone = within 80 px left of the flame → `play = warm`, mood happy; high-five: offered 1 s after a right answer, `play = highfive`, tap the hand (30 px radius) → `clap` + FX Pop, 2.8 s without → `playoff`; pinch: `stretch = clamp((d − d0) × 0.6, 0, 100)`, release → `snap`; phone shake: acceleration > 22 m/s², 1.5 s cooldown → thrown with vx ±(700–1200), vy −(900–1200), `shook` on landing; tilt: gamma beyond ±3° slides him while idle and sets `swing`; blow: mic loud and steady 0.25 s → `play = wind` until it stops; talk: mic level → `amp` (2–100).
- Mic only while a finger holds him (owner): start metering on carry start, stop on release; never in the background. If permission is not granted, talk and blow are silently off.
- Sensors only while a tab with Dombi is focused; none in lessons (rule `perch` keeps lesson behaviour from 2026-10-27).
- Feeding never answers: the tile goes back to its place 3.2 s later; a tile tap still selects as now.
- Reduce Motion: none of these play (as today). Still-picture phones: the rig wakes for them as for other touches.
- Every task: typecheck, lint, `npm test` (mobile) and `node --test src/core/core.test.js`; small commits; no `Co-Authored-By`.

## Review Focus

1. A pinch that starts as a one-finger press: the press must not become a carry or a poke when the second finger lands.
2. A word tile dragged but dropped elsewhere: it returns, nothing is selected, the answer is unchanged.
3. Tapping the high-five hand vs tapping DAVOM ETISH: the button still continues; the hand never blocks it.
4. Mic permission denied, or the mic busy with a speaking exercise: holding him never errors or prompts mid-lesson.
5. Leaving a tab while he is hidden, perched or being shaken by the phone: back home and calm on return (existing focus reset covers the new modes).

---

### Task 1: Touch rules for the new moves

**Files:** Modify `src/core/touch.js`, `src/core/core.test.js`.

**Produces (all through `touchReducer`):** `env.zones?: { peek?: { l, r, top }, warm?: { x } }`; modes `hidden`, `peeking`, `perched`; events `{type:'feed'}`, `{type:'highfive'}` (offer), `{type:'hand'}` (tap on the hand), `{type:'pinch', d}` / `{type:'pinchEnd'}`, `{type:'phoneShake', rand}`, `{type:'tilt', g}`, `{type:'blow', on}`; effects as today plus `{ num: [name, v] }`, `{ looking: bool }`, `{ hidden: bool }`, `{ pop: true }`.

- [ ] **Step 1:** Tests, one per move, with the Global Constraints numbers: let go at x = −20 → mode `hidden`, after 700 ms ticks `peeking` from a side, then idle at home; fast horizontal release 2200 px/s → `hidden`; drop over the peek zone → `land`, then `play: peek` at +420 ms, mode `perched`; drop left of the flame → `play: warm`, `mood: happy`; feed while idle → `fire: eat`, while held → nothing; highfive → after 1000 ms `play: highfive`, `hand` → `fire: clap` + `pop`, no hand for 2800 ms → `fire: playoff`; pinch d0 = 100, d = 200 → `num: ['stretch', 60]`, pinchEnd → `fire: snap`, and a pinch cancels a pending press (no carry, no poke); phoneShake → mode `flying`, landing fires `shook`; tilt 20° while idle → body moves toward the low side and `swing` ≠ 0, ignored while held; blow on while held for 250 ms → `play: wind`, off → `play: held`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement, following `play.html`. **Step 4:** Run → PASS. **Step 5:** Commit (`Touch rules: hide and peek back, perches, feeding, high-five, pinch, phone shake, tilt, blow`).

### Task 2: Eyes, hide and peek, perches on the Learn tab

**Files:** Create `src/mobile/src/components/DombiWatch.tsx` (screen-wide finger watcher: a `View` with `onTouchStart/onTouchMove` that never takes the touch, giving the finger to the Dombi on that screen); Modify `DombiPlay.tsx` (eyes: `looking` + `lookX/Y` from the watcher while idle or perched, cleared 2.5 s after; hidden/peeking drawing; `env.zones`), `src/mobile/src/app/(tabs)/index.tsx` (measure the Learn card and the streak flame in window coordinates and pass them as zones), `TabChrome.tsx` (the flame's spot).

- [ ] **Step 1:** Wire and draw; tabs keep working as before.
- [ ] **Step 2:** typecheck, lint, test; commit (`Dombi: eyes follow your finger, he hides off-screen and peeks back, sits on the Learn card or warms by the flame`).

### Task 3: Pinch, phone shake and tilt

**Files:** Modify `src/mobile/package.json` (`npx expo install expo-sensors`), `DombiPlay.tsx` (RNGH `Gesture.Pinch()` simultaneous with the pan, rule `all` only; `Accelerometer` for shake and `DeviceMotion` gamma for tilt, subscribed only while focused and rule `all`).

- [ ] **Step 1:** Wire. **Step 2:** typecheck, lint, test; `npm run android:test-apk` builds; commit (`Dombi: pinch to stretch, shake or tilt the phone`).

### Task 4: Talk and blow while held

**Files:** Create `src/mobile/src/lib/micLevel.ts` (`startMicLevel(onLevel) -> stop`, expo-audio recorder with metering, permission checked, never prompts if speaking exercises already asked and were refused); Modify `DombiPlay.tsx` (start on carry, stop on release; level → `amp` while held; blow detection → `blow` events).

- [ ] **Step 1:** Wire. **Step 2:** typecheck, lint, test; commit (`Dombi: talk to him or blow at him while you hold him`).

### Task 5: Feed him a word tile in a lesson

**Files:** Modify `src/mobile/src/components/Exercise.tsx` (`Tile`: a pan gesture beside the tap; while dragged it follows the finger; let go over Dombi → `onFeed(word)` and it returns after 3.2 s; elsewhere → returns at once, nothing selected), `LessonDombi.tsx` (registers his window rect for the drop test; `feed` event to DombiPlay; the word shows briefly on him as in the playground), `LessonScreen.tsx` (pass-through).

- [ ] **Step 1:** Wire; tap-to-select unchanged. **Step 2:** typecheck, lint, test; commit (`Lesson: drag a word tile onto Dombi to feed him`).

### Task 6: High-five in the answer panel

**Files:** Modify `src/mobile/src/screens/LessonScreen.tsx` (the right-answer panel's 48 px Dombi gets a rig handle and a hand hit area; `highfive` 1 s after the panel opens; tap the hand → `clap` + FX Pop board; 2.8 s → `playoff`; DAVOM ETISH untouched).

- [ ] **Step 1:** Wire. **Step 2:** typecheck, lint, test; commit (`Answer panel: Dombi offers a high-five after a right answer`).

### Task 7: The four states with screens

**Files:** Modify `LessonScreen.tsx` / `Exercise.tsx` (lesson Dombi moment `yourTurn` while the mic listens; `explaining` while a new phrase's audio plays in a `meet` item), `src/mobile/src/components/MomentMilestones.tsx` (`levelUp`), `src/mobile/src/app/account.tsx` (`waiting` while signing in or creating the account).

- [ ] **Step 1:** Place each Dombi as drawn in its Pencil frame (Level up; Account). If a frame has no Dombi, stop and ask the owner where he goes (no invented UI).
- [ ] **Step 2:** typecheck, lint, test; commit (`Dombi states: listening at the mic, reading a new phrase, proud at level up, thinking while you wait`).

### Task 8: Review, APK, phone test

- [ ] **Step 1:** Fresh reviewer on the branch against `play.html`, motion-plan §8, the moment map and the Review Focus; fix real findings (tests first for rules).
- [ ] **Step 2:** `npm run android:test-apk`, install on the Redmi, try each move with the injector (`Inj.dex`) and screen recordings; tell the owner what works and what does not.
