# Redesign · Remaining States · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design the last states the redesigned app needs (first time, empty, loading, offline, error, dark mode), and close the items left open by rounds 2 and 3, so every screen the build plans touch is drawn.

**Architecture:** All work is in `pendev/Akademiya English.pen`, in a new section "Redesign · States". The base is the owner's locked designs: "Storyboard · Pop-ups & states" `cgz0k` (29 feedback, 30 confidence again, 31a no internet, 31b mic blocked, 31c speech unavailable, 31d fallback page, 31e general error; dark `k7J8r`), the components `Problem / No internet` `kvbyW`, `Problem / Mic blocked` `MLpsq`, `Problem / Speech unavailable` `cVJXr`, `Problem / Error` `C9RFq5`, `Toast / Offline` `KGfpr`, `Loading skeleton` `vd3iA`, and the round 1–3 finals. Each state starts as a copy of the owner's screen, placed in the redesigned shell (tab bar, header, Dombi from the moment map); only what the redesign requires changes. The checker `design/system/pencil-check.js` gates every new or changed screen.

**Tech Stack:** Pencil + `pencil` MCP; Node for exports; git.

**Spec:** `docs/superpowers/specs/2026-10-23-english-redesign-design.md` ("Dombi everywhere", "When Speak and Practice open", "Design first, then build": "every remaining state (first time, empty, loading, offline, error, dark mode)"). Choices: `docs/superpowers/specs/2026-10-23-english-redesign-choices.md`. Dombi: `docs/superpowers/specs/2026-10-26-dombi-moment-map.md`. Owner's locked states: `docs/ideas/pages.md` section G.

This is plan 4, the last design plan. After it come the build plans.

## Global Constraints

- **No invented UI** (owner, 2026-10-23). Every element has a source: the spec, an existing screen or component, the owner's designs (section G of `pages.md` above all), or an owner answer.
- **Copy, don't redraw.** The owner's 31a–31e and 31d are locked; their wording, steps and buttons stay. Only the shell around them and Dombi change.
- Dombi on every state follows the moment map: waiting = `Dombi / 80 / think` (never a spinner), mic off = `Dombi / 80 / confused`, empty tab before lesson 1 = `Dombi / 150 / point`. Never sad, never blaming ("Bu sizning aybingiz emas" stays).
- Lessons and scripted activities have their content on the phone; the live conversations in Speak need the internet. A state appears only where it can really happen.
- Every final screen has a dark copy (Copy with theme dark; scrims use `$ds-paper` at 0.7 in dark).
- Interface text in Uzbek, short and literal; new lines go on the copy list.
- Saving as in plans 1–3 (never switch away from the window in front; verify the file's write time).

## Review Focus

1. **Offline mid-conversation:** the live call loses the internet. The learner sees what happened and one next step, and what they said is not lost silently.
2. **First open with no internet:** Learn still opens (content is on the phone); Speak shows offline, not an error.
3. **Long Uzbek lines** in the problem states fit at 360 wide with the tab bar.
4. **Dark mode** of every state, including the scrims and the Dombi pose.
5. **Two states at once** (offline and mic blocked): one screen wins, and it is the one whose fix comes first (internet).

---

### Task 1: Section and state inventory

**Files:** `pendev/Akademiya English.pen` (new section "Redesign · States", frame `Inventory`); `docs/superpowers/specs/2026-10-26-state-inventory.md`.

- [ ] **Step 1:** Make the inventory table: one row per state the redesigned app can reach, with *State · Where (redesigned screen) · Exists? (id of the owner's screen/component, or "missing") · What changes*. Rows come only from:

| State | Source |
|---|---|
| First time on each tab (light exists) | round 1 finals `SlFQT`, `V4Uh5`, `lut7s`, `uezjU` |
| Empty lists in Me (recordings, phrases) | Me final `ygNRX`, `Screen 28b · Voice recordings` `WzRRs` |
| Loading (tab content, Dombi's reply in a live call) | `Loading skeleton` `vd3iA`; moment map "Waiting for the server" |
| No internet (31a), on Speak and in a live call | 31a, `Toast / Offline` |
| Mic blocked (31b) | 31b |
| Speech unavailable (31c) | 31c; round 2 mic-off screens |
| General error (31e) | 31e |
| Fallback page (31d A and B) | 31d `j5esma`, `x5Fco6` |
| Feedback (29), confidence again (30) | 29, 30 |

- [ ] **Step 2:** Mark each row: *done* (already redesigned in rounds 1–3), *copy into shell*, or *missing*. Write the .md version. Save and commit (`Redesign: state inventory`).

### Task 2: First time and empty, with dark

**Files:** row `First time & empty`; exports `design/redesign/states/first-time.png`, `first-time-dark.png`, `empty.png`.

- [ ] **Step 1:** Dark copies of the four first-time tabs. For each empty list the inventory marks *copy* or *missing*: copy the owner's screen for that list and set its empty state as Dombi (`Dombi / 150 / point` toward the action that fills it) plus one line and the existing button; the line goes on the copy list.
- [ ] **Step 2:** Checker on every new screen: `violations: []` (owner's untouched parts excepted, as in plan 2). Export, look, save, commit (`Redesign: first-time and empty states`).

### Task 3: Loading, offline, error, fallback

**Files:** row `Problems`; exports `design/redesign/states/problems.png`, `problems-dark.png`.

- [ ] **Step 1:** For each of 31a, 31b, 31c, 31e and 31d (A, B): copy the owner's screen into the redesigned shell of the tab where it appears (per the inventory), with Dombi per the moment map. Loading: the tab skeleton, and in the live call a Dombi `think` state in place of his reply.
- [ ] **Step 2:** Offline in a live call (Review Focus 1): the call screen with `Toast / Offline` and the 31a text; what the learner said stays on screen. Two states at once (Review Focus 5): draw the rule as one note on the board, no extra screen.
- [ ] **Step 3:** Dark copies; checker; export, look, save, commit (`Redesign: problem states in the new shell`).

### Task 4: Items left open by rounds 2 and 3

**Files:** row `Open items`; exports `design/redesign/states/lesson-result.png`, `catch-end.png`.

- **Lesson result:** never redesigned. Show the owner's own ideas side by side, from "Storyboard · Lesson result — redesign ideas" `q6mTEc`: current `S8ulIR`, A `d8MlB`, B `pXsRF`/`q36Qn`, C `D7lff`/`s3aG4`, each with Dombi added per the moment map (`150 / celebrate · laugh face`). The owner picks one.
- **Catch end screen:** the middle is empty since the score card and list were removed. Two layouts of the same content (no new elements): A · result and Dombi moved up under the title; B · the same Dombi (`80 / happy`, per the moment map) moved from the corner to the centre, above the result line.
- **Two questions for the owner, as text choices on the review page (no screens):** which wins when "glad after a break" and "late at night" happen together; on a phone measured as Still, is "Kamroq harakat" shown on and locked (like Reduce Motion) or on and changeable.

- [ ] **Step 1:** Draw the lesson result options and the two Catch layouts; dark copies; checker. Export, save, commit (`Redesign: lesson result options and Catch end`).

### Task 5: Owner review

**Files:** `design/redesign/states/review.html` (same picking page as rounds 1–3, db capability); choices file (append "Round 4").

- [ ] **Step 1:** Publish: lesson result and Catch end to pick; the two questions as choices; every state row OK / Change; new Uzbek lines OK / Change.
- [ ] **Step 2:** Read the answers; append to the choices file; commit.

### Task 6: Finish and review

- [ ] **Step 1:** Apply picks and notes; dark copies of every final; checker on all.
- [ ] **Step 2:** A fresh reviewer checks the states against the spec, `pages.md` section G, the moment map and the Review Focus; fix real findings.
- [ ] **Step 3:** Re-export **after** the last change (round 3 showed stale pictures), update the review page, save, commit (`Redesign: final states`).
