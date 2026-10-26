# Build v2 · Practice Activities · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The four Practice activities work as designed in round 2: Match rush (Juftini top), Catch the sentence (Gapni tut), Overheard (Eshitib qoldim) and Fix it (Xatoni tuzat), opened from the Practice tab instead of the "not ready" page.

**Architecture:** Activities reuse the lesson `Player` and `Exercise` (answer panel, Dombi help, combo flame, leave sheet) with item lists picked by new pure rules in `src/core/practice.js` from lessons the learner has finished. `Player` gains three options: `leaveText`, `onFinish(stats)` and an activity kicker. `Exercise` gains two modes the lessons don't have: Catch's listen-first tiles and Fix it's "say it fixed". Match rush is a new timed game with its own rules in `src/core/match.js`. A shared `ActivityEnd` screen draws the owner's pick B (Catch end, round 4).

**Tech Stack:** Expo SDK 57, expo-router, Reanimated, existing `Player`/`Exercise`, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-23-english-redesign-design.md` (the seven activities; "When Speak and Practice open"; practice does not count toward the streak). Designs: Pencil "Redesign · Activities & lessons" → "Practice activities": Match rush `aZXxk` (M1–M5), Catch `PCVsq` (C1–C5), Overheard `g9NUQ` (O1–O4), Fix it `w1UGhw` (X1–X6), with dark rows. Round 4: Catch end layout B. Owner's round 2 verdicts: Match rush and Catch OK; Overheard and Fix it not marked.

## Global Constraints

- Build what is drawn; copy from the frames (kickers, titles, leave lines). Leave lines: Match "Bu urinish hisobga olinmaydi."; Catch "{n} tadan {k} tasi qildingiz. Natija saqlanmaydi."; Overheard and Fix it "Bu mashq saqlanmaydi. Keyin boshidan boshlaysiz.".
- Content only from lessons the learner has finished (spec). No new content.
- Practice never counts toward the streak and never writes a `lesson` event (`streakOf` unchanged). Match rush keeps its best score in settings (`matchBest`).
- Answer panel, Dombi, help sheet and dark mode as in lessons. Every task ends with typecheck, lint, `npm test`, a commit; no `Co-Authored-By`.

## Review Focus

1. **Only one lesson done:** every activity still has enough items, or its row stays locked with the existing lock look.
2. **Match rush time running out mid-tap:** the last tap after 0 s does not count; the end screen shows the right number.
3. **Leaving mid-activity:** nothing is saved, the lesson resume is untouched (`quiet` Player).
4. **Speech off / mic unavailable in Fix it's say step:** tiles fallback (X5) as drawn.
5. **Dark mode** of the new screens.

---

### Task 1: Rules with tests

**Files:** Create `src/core/practice.js`, `src/core/match.js`; Modify `src/core/core.test.js`.

**Produces:**
- `practiceItems(kind, units, done, { n, rand }) -> Item[]` for `catch` (tiles items with `listen: true`, 5), `overheard` (heard items, 5), `fixit` (each fix item followed by its say-it-fixed item `{ ex: 'say', fix: true, wrong, right, ctx }`, 3 pairs). Only lessons in `done`.
- `practiceCounts(units, done) -> { catch, overheard, fixit, match }` for the Practice list lines.
- `matchStart(pool, { rand, now }) -> state` (4 audio cards, 4 phrase cards, 60 s), `matchReducer(state, { type: 'audio'|'phrase'|'tick', i?, t })` → pairs found, wrong flash, refill, `done` at 60 s (taps after the end ignored).

- [ ] **Step 1:** Tests: only done lessons are used; catch items have `listen`; fixit alternates fix → say; a right pair adds 1 and refills that pair; a wrong pair flashes and adds nothing; a tap at 60.1 s is ignored; counts with one lesson done.
- [ ] **Step 2:** FAIL → implement → PASS; commit (`Core: practice item rules and Match rush`).

### Task 2: Player and Exercise options

**Files:** Modify `src/mobile/src/screens/LessonScreen.tsx` (Player: `leaveText`, `onFinish`, `kicker`), `src/mobile/src/components/Exercise.tsx` (listen-first tiles: kicker "TUTIB OLING", title "Eshitgan gapingizni yig'ing", audio bar, no text — C1; say-it-fixed: kicker "TUZATIB AYTING", title "Gapni to'g'rilab ayting", card "BU GAPDA BITTA XATO BOR" with the wrong sentence, mic, tiles when speaking is off — X4/X5).

- [ ] **Step 1:** Add the options; lessons unchanged (navigation and existing tests still pass).
- [ ] **Step 2:** typecheck, lint, test; commit (`Player and Exercise: activity options`).

### Task 3: Catch, Overheard, Fix it screens and the end screen

**Files:** Create `src/mobile/src/app/activity/[kind].tsx`, `src/mobile/src/components/ActivityEnd.tsx`; Modify `src/mobile/src/app/(tabs)/practice.tsx` (rows open `/activity/catch|overheard|fixit`; lines use `practiceCounts`), `src/mobile/src/lib/navigationState.ts` (parent: practice tab), `scripts/navigation.test.mjs`.

- [ ] **Step 1:** Navigation test first: a cold `/activity/catch` link backs to the Practice tab. FAIL → implement → PASS.
- [ ] **Step 2:** `ActivityEnd` = C4 pick B: Dombi 80 happy centred, "MASHQ TUGADI", "{n} tadan {k} tasi to'g'ri", DAVOM ETISH → Practice tab.
- [ ] **Step 3:** typecheck, lint, test; commit (`Practice: Catch, Overheard and Fix it`).

### Task 4: Match rush

**Files:** Create `src/mobile/src/app/activity/match.tsx` (or the `match` kind in `[kind].tsx`), `src/mobile/src/components/MatchRush.tsx`; Modify `src/mobile/src/lib/store.tsx` (`matchBest?: number`).

- [ ] **Step 1:** M1 start (60 s / 4 juft tiles, best line, Dombi bubble "Bir daqiqa. Tayyormisiz?", BOSHLASH), M2 play (time bar, 4×2 cards, audio plays on tap), M3 wrong pair (amber), M4 time up ("{n} juft topdingiz", "Oldingi eng yaxshi natija: {b} juft." and Dombi "Yangi rekord!" only when beaten), M5 leave sheet.
- [ ] **Step 2:** typecheck, lint, test; commit (`Practice: Match rush`).

### Task 5: Review and test APK

- [ ] **Step 1:** Fresh reviewer against the frames, the spec and the Review Focus; fix real findings (tests first for logic).
- [ ] **Step 2:** `npm run android:test-apk`; give the owner the path.
