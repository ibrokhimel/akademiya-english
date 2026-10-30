# Build v1.1 · Dombi's Touch Play on the Phone · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dombi's finger interactions, approved on 2026-10-11 and built only in the browser playground, work in the phone app: hold to pick up, carry, drop, throw, tap pokes, double-tap tricks, rub to pet, sleep after 22 s and tap to wake, eyes follow the finger, dizzy when shaken while held.

**Why:** owner, 2026-10-27: "the dombi's interactions which we designed a long time ago like holding to pick it up and etc these are not working". Cause: the app's Rive file already has every trigger (`hop`, `land`, `poke1–3`, `trickSpin/Flick/Shades`, `dizzy`, `ahem`, `wake`, enum `play`, numbers `swing`/`squish`, `lookX/Y`), but the app never had the touch code (`Actor` is `pointerEvents="none"`; the physics live only in `design/rive/play.html`).

**Architecture:** The playground's rules become a pure state machine in `src/core/touch.js` with node tests (timings and thresholds copied from `play.html`). In the app, a `DombiPlay` component wraps the corner Dombi: gesture-handler events go into the state machine, Reanimated moves him, and the resulting Rive triggers/values go to the rig through a small handle added to `Actor`.

**Tech Stack:** Expo SDK 57, react-native-gesture-handler, Reanimated, @rive-app/react-native 0.5.4, expo-haptics, Node test runner.

**Spec:** `docs/ideas/motion-plan.md` §8 (touch interactions, locked 2026-10-11) and `design/rive/play.html` (the reference behaviour). Owner answers 2026-10-27: finger interactions first; on phones showing still pictures, Dombi comes alive while touched.

## Global Constraints

- Behaviour and numbers exactly as `play.html`: hold ≥ 300 ms with < 10 px movement → pick up; press moving > 12 px within 300 ms → pet; tap < 300 ms and < 12 px → poke; two taps < 300 ms apart → trick (never the same twice running); pokes reset after 4 s; 4th poke → `play = back` for 3 s; release faster than 900 px/s → throw; shake = 5 direction changes within 900 ms while held, 2.6 s cooldown → `dizzy`; bounce when landing faster than 700 px/s (×0.42); walk home at 95 px/s; idle 22 s → `play = sleep`, a tap → `wake`.
- Where (locked 2026-10-11, option B "everywhere"): tabs = `all`; in a lesson with an exercise active = `nocarry` (taps, pokes, tricks, petting only).
- Still pictures (Light or Still level, not Reduce Motion): a touch switches to the animated rig until he has been idle for 2 s, then back to the picture. Reduce Motion: no touch play; he stays a picture.
- Phone-sensor interactions (tilt, phone shake, blow, pinch, feed a word, high-five, talk while held) are out of scope for v1.1.
- Haptics as in the playground (`buzz` patterns) via expo-haptics. No new UI beyond Dombi himself.
- Every task: `npm run typecheck`, `npm run lint`, `npm test` in `src/mobile`; small commits; no `Co-Authored-By`.

## Review Focus

1. A tap on Dombi that also has an `onPress` (the lesson help) — a single tap still opens help; poke counting must not swallow it. Ruling to make: in a lesson, a single tap opens help and also counts as a poke.
2. Carrying while the tab scrolls or the tab bar is dragged: Dombi's gesture wins only when the touch starts on him.
3. Leaving the screen while he is carried or flying: he is back home and calm on return.
4. Still-picture phone: after play he returns to the picture; the rig is unmounted again.
5. Reduce Motion turned on mid-play: he stops and shows the picture.

---

### Task 1: Touch rules with tests

**Files:** Create `src/core/touch.js`; Modify `src/core/core.test.js`.

**Produces:** `touchStart(now)`, `touchReducer(state, event) -> { state, effects }` where events are `{type:'down'|'move'|'up'|'tick', t, x, y, vx?, vy?, rule:'all'|'nocarry'}` and effects are a list of `{fire: trigger} | {play: value} | {haptic: pattern} | {mode}`; `stepBody(body, dt, floor, homeX)` for falling, bouncing and walking home.

- [ ] **Step 1:** Tests for every threshold above (e.g. down then up at 120 ms, 4 px → `poke1`; two taps 200 ms apart → one trick, then a different trick next time; down held 320 ms → `hop` + `play: held` only when rule is `all`; up at 1000 px/s → mode `flying`; 5 sign changes in 800 ms while held → `dizzy`; 22 s of ticks → `play: sleep`, then tap → `wake`).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. **Step 5:** Commit (`Core: Dombi touch rules from the playground`).

### Task 2: Rig handle on Actor

**Files:** Modify `src/mobile/src/components/Actor.tsx`.

- [ ] **Step 1:** `Actor` accepts `rigRef` and fills it with `{ fire(name), play(value), num(name, v), bool(name, v) }` once its view-model instance exists; existing props unchanged.
- [ ] **Step 2:** typecheck, lint, test; commit (`Actor: handle for touch play`).

### Task 3: DombiPlay in the app

**Files:** Create `src/mobile/src/components/DombiPlay.tsx`; Modify `src/mobile/src/components/TabChrome.tsx` (DombiOverlay uses it), `src/mobile/src/screens/LessonScreen.tsx` (rule `nocarry`), `src/mobile/src/components/Dombi.tsx` (`awake` override).

- [ ] **Step 1:** Gesture layer on Dombi (Pan + Tap with gesture-handler); events go to `touchReducer`; effects drive the rig, haptics and a Reanimated position (absolute, can leave the corner while carried/flying, `stepBody` per frame, home = his corner spot).
- [ ] **Step 2:** Still-picture phones: first touch sets `awake`, which makes `Dombi` render the rig; 2 s idle clears it. Reduce Motion: gestures disabled.
- [ ] **Step 3:** typecheck, lint, test; commit (`Dombi: touch play on the tabs and in lessons`).

### Task 4: Review and test APK

- [ ] **Step 1:** A fresh reviewer checks the branch against `play.html`, motion-plan §8 and the Review Focus; fix real findings.
- [ ] **Step 2:** `npm run android:test-apk`; give the owner the APK path and the install command.
