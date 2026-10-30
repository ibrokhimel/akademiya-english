# Redesign · Activity and Lesson Screens in Pencil · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design every screen behind the new tabs (the seven activities, the Speak conversation modes, the daily challenge) and the lesson screens with Dombi helping, by adapting the owner's existing exercise designs, then let the owner choose where a real choice exists.

**Architecture:** All work is in `pendev/Akademiya English.pen`, in a new section "Redesign · Activities & lessons". The owner's existing, locked exercise designs are the base: each activity screen starts as a copy of the matching existing screen and changes only what the redesign requires (the shared answer panel, Dombi as an overlay or helper, the shared header and design-system colours where the screen is new). New screens are drawn only where nothing exists. The checker `design/system/pencil-check.js` gates new and changed screens; untouched parts of the owner's copied designs keep their own styling.

**Tech Stack:** Pencil + `pencil` MCP; Node for exports; git.

**Spec:** `docs/superpowers/specs/2026-10-23-english-redesign-design.md`. Choices so far: `docs/superpowers/specs/2026-10-23-english-redesign-choices.md`. Design system: `design/system/README.md`.

This is plan 2. Plan 3 is Dombi's states and the three phone levels; after that, the build plans.

## Global Constraints

- Lesson from round 1: the owner prefers their own designs over redraws. **Copy the existing screen and change only what the redesign needs.** Never redraw a screen that already exists.
- Sources (do not edit these originals; copy them):
  - "Storyboard · Exercises — every state (MVP)" `MYKem` (E1 Meet It, E2 Say What You See, E4 Tile Builder, E6 What Happened?, E9 Echo Line, E13 Tap the Mistake / Tap the gap), dark `A5iK7`.
  - "Storyboard · Exercises — every state (after MVP)" `vlPVv` (E3 Match Rush, E5, E7, E8 Missing Word, E10 Which One?, E11 Say Both, E12, E14 Fix & Say, E15 Guided Reply, E16 Free Reply), dark `A9bCt`.
  - "Storyboard · Lesson loop" `t0ihH2` (main flow, locked), "Storyboard · Lesson result — redesign ideas" `q6mTEc`.
  - After-MVP components "D · Scenes" (`Scene dialogue` `UEM28`, `Help ladder` `j3ERN`, `Character reaction` `DsZyR`) and "Pet assistant panel" `OJtfj`, `Pet bubble` `TJqNq`.
  - Round 1 finals in "Redesign · Tabs" → "Final" (tab bar, header, Dombi overlay `IdIvY` / quiet `S9cqrF`, answer panel rules).
- Answer panel everywhere: green wash for correct, amber "not yet" wash for a miss, never grey, never red; title, then one line of reason (design system README).
- Dombi: overlay on screens that are not about talking to him; in lessons he is the helper (spec, owner 2026-10-23). In conversations he is the partner.
- Icons only from `pendev/icons-r2`. Interface text in Uzbek, short and literal; every new line goes on the copy list.
- Saving: as in plan 1 (the save script checks the window in front; never switch away from a game or video).

## Review Focus

1. **Speaking fails** (no mic permission, nothing heard, recogniser unsure): every speaking screen shows its fallback (tiles or "try again"), never a dead end. Each activity task draws its "speech unavailable" state.
2. **Wrong answer twice** in a row: the help offer appears; the screen never blames the learner.
3. **Very long Uzbek or English lines** (a 6-word reply, a long trap explanation) fit at 360 wide.
4. **Leaving mid-activity**: each activity has a leave sheet that says whether progress is kept.
5. **Dark mode** of every new or changed screen.

---

### Task 1: Section and source board

**Files:** `pendev/Akademiya English.pen` (new section "Redesign · Activities & lessons", frame `Sources`).

- [ ] **Step 1:** Create the section. In `Sources`, place one small copy per activity of the existing screen it will be built from, labelled with the activity name and the source row (table below). This is the map the rest of the plan follows.

| Activity / screen | Built from |
|---|---|
| Match rush | E3 Match Rush |
| Which one did you hear? | E10 Which One? + E11 Say Both (say-both step not judged) |
| Catch the sentence | E4 Tile Builder (listening start, no text) |
| Overheard | E6 What Happened? |
| Fix it | E13 Tap the Mistake + E14 Fix & Say |
| Talk to a character (situation) | Scene dialogue + Help ladder + E15 Guided Reply |
| Guided conversation | E15 Guided Reply inside the live-call screen |
| Free conversation | E16 Free Reply inside the live-call screen |
| Daily challenge | new: start card, 3 tasks reusing the above, result |
| Lesson screens | Lesson loop main flow + MVP exercise rows |

- [ ] **Step 2: Save and commit** (`Redesign: activities source board`).

### Task 2: Lesson screens with Dombi helping — three helper options

**Files:** row `Lessons` in the section; exports `design/redesign/activities/lesson-help-a|b|c.png`.

The lesson screen is the Lesson loop exercise screen (E2 Say What You See, mid-exercise) with the round-1 answer panel. Three ways for Dombi to help, each drawn on the same exercise, with the help steps: 1 slow replay, 2 first word, 3 Uzbek explanation, 4 show the answer (from the Help ladder):

- **A · Dombi in the corner:** Dombi overlay (quiet) at bottom right; tapping him opens the help steps as a sheet; after a miss he shows a short bubble.
- **B · Help ladder above the answer:** a "Yordam" pill under the task; each tap reveals the next step in a Dombi bubble inline; Dombi small at the left of the bubble.
- **C · Dombi in the answer panel:** after a miss, the amber panel has Dombi at its left saying the reason, with a "Yana yordam" link for the next step.

Also for each option: the state after two misses (help offered automatically) and the "speech unavailable" state.

- [ ] **Step 1:** Copy the source screen three times; draw A, B, C and their two extra states. Run the checker on every new or changed frame: `violations: []`.
- [ ] **Step 2:** Export, look, fix, save, commit (`Redesign: lesson help options`).

### Task 3: Speak activities

**Files:** row `Speak activities`; exports `design/redesign/activities/speak-*.png`.

- Situation (Talk to a character): start (place, character, goal "Choy buyurtma qiling"), conversation turn (character line + your turn with mic and tiles fallback), help step, character reaction, end (what you said, stars).
- Guided conversation and Free conversation: the live-call screen (round 1) in three states each: listening, Dombi speaking with captions, help/hint shown; plus a short end summary ("Siz 6 ta gap aytdingiz") and the topic chooser.
- Which one did you hear?: pick screen, right/not-yet, say-both step (record, compare to the native voice, no verdict), end.

- [ ] **Step 1:** Build each from its source (Task 1 table); add speech-unavailable and leave-sheet states. Checker: `violations: []`.
- [ ] **Step 2:** Export, look, fix, save, commit (`Redesign: Speak activity screens`).

### Task 4: Practice activities and the daily challenge

**Files:** row `Practice activities`; exports `design/redesign/activities/practice-*.png`.

- Match rush: start (best score), play, time-up result.
- Catch the sentence, Overheard, Fix it: play screens from their sources, right/not-yet, end.
- Daily challenge — two options for its flow:
  - **A · Three in a row:** a progress strip "1/3" on top, the three tasks one after another, then a result with the streak kept.
  - **B · Challenge card hub:** a screen with three task cards that tick off as you finish them, then the result.

- [ ] **Step 1:** Build each; leave sheet and first-time state where relevant. Checker: `violations: []`.
- [ ] **Step 2:** Export, look, fix, save, commit (`Redesign: Practice activity screens and daily challenge`).

### Task 5: Owner review

**Files:** `design/redesign/activities/review.html` (same picking page as round 1, with the db capability), `docs/superpowers/specs/2026-10-23-english-redesign-choices.md` (append).

- [ ] **Step 1:** Publish a review page: lesson help A/B/C and daily challenge A/B to pick; every other activity shown once with an "OK / change" note box; the new Uzbek lines with OK / Change.
- [ ] **Step 2:** Read the owner's answers from the page; append them to the choices file; commit.

### Task 6: Finish and review

- [ ] **Step 1:** Apply the owner's picks and notes; make dark copies of every final screen; checker on all.
- [ ] **Step 2:** A fresh reviewer checks the final exports against the spec and design system; fix real findings.
- [ ] **Step 3:** Save, export, update the review page, commit (`Redesign: final activity and lesson screens`).
