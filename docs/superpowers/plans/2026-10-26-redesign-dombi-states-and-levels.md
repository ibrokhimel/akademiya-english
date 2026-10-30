# Redesign · Dombi's States and the Three Phone Levels · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decide and draw which Dombi the learner sees at every moment of the redesigned app, at each of the three phone levels (Full, Light, Still), and design the one setting that lets the learner turn animation down, so the build plans have nothing left to guess about Dombi.

**Architecture:** All design work is in `pendev/Akademiya English.pen`, in a new section "Redesign · Dombi". The base is what already exists: the 17 Pencil poses `Dombi / 150 / …` (13 faces, 4 gestures), `Dombi / 48 / default`, `Dombi / 80 / …`, the overlays `Dombi overlay / talking` `IdIvY` and `/ quiet` `S9cqrF`, and the Rive rig `Dombi` with its moods, gestures and triggers (`docs/ideas/companion-pet.md`, `docs/ideas/motion-plan.md` §5). Nothing about Dombi's look changes. New drawings are made only where a moment in the map needs a size or pose that has no component yet. The checker `design/system/pencil-check.js` gates every new or changed frame.

**Tech Stack:** Pencil + `pencil` MCP; Node for exports; git.

**Spec:** `docs/superpowers/specs/2026-10-23-english-redesign-design.md` ("Dombi everywhere", "Dombi adapts to the phone", "Left to the builder"). Choices so far: `docs/superpowers/specs/2026-10-23-english-redesign-choices.md`. Design system: `design/system/README.md`, `design/system/design-language.md` (Reduce Motion).

This is plan 3. Plan 4 is the remaining states (empty, loading, offline, error); after that, the build plans.

## Global Constraints

- **No invented UI** (owner, 2026-10-23: "do what i asked you to do and dont add random stuff"). Every element drawn must have a source: the spec, an existing screen or component, the owner's designs, or an owner answer. Where a plan line is vague, take the plainest existing pattern.
- **Copy, don't redraw.** Screens shown here are copies of the round 1 and round 2 finals; only Dombi changes on them.
- Dombi's look is locked (`docs/ideas/companion-pet.md`): black blob, white pill eyes, centred smile, hands hidden except for gestures. Never kawaii, never sad, never guilt-tripping. After a miss he shows `oops` or the `wrong` reaction, never a sad face.
- Moods available (Rive enum `mood` and Pencil `Dombi / 150 / …`): smile (default), happy, laugh, talk, listen, think, surprised, sleepy, wink, proud, focus, confused, oops. Gestures: wave, celebrate, thinking, point.
- The three levels, as the spec words them:
  - **Full:** animated Dombi everywhere (idle, blinks, lip-sync, reactions).
  - **Light:** animated only at key moments (onboarding, answers, celebrations); still images of his poses elsewhere.
  - **Still:** still images only, a different face per mood; no animation cost.
  - The phone's Reduce Motion setting always means Still. The level is measured during onboarding without any screen or waiting; **there is no screen for the measurement.**
- Interface text in Uzbek, short and literal; every new line goes on the copy list for a native speaker.
- Saving: as in plans 1 and 2 (the save script checks the window in front; never switch away from a game or video; verify the file's write time).

## Review Focus

1. **Dark mode:** a black Dombi on a dark screen must still read; every still pose is checked on the dark background with the existing `$dombi-*` variables.
2. **Reduce Motion on, Full-capable phone:** the setting shows Still and says why; nothing on any screen moves.
3. **A moment with no still pose:** every row of the moment map names one existing still pose for Still and Light; no row is left "animated only".
4. **Small sizes:** each face used at 48 px (overlay, guide row) is still tellable from the others; where it is not, the map uses a pose that is.
5. **Sleepy at the wrong time:** sleepy appears only on the Learn tab late at night, never mid-lesson or as a reaction to an answer.

---

### Task 1: Section and the moment map

**Files:** `pendev/Akademiya English.pen` (new section "Redesign · Dombi", frame `Moment map`); `docs/superpowers/specs/2026-10-26-dombi-moment-map.md` (the same table as text, for the build plans).

- [ ] **Step 1:** Create the section. Write the moment map: one row per moment where Dombi appears in the redesign, with columns *Moment · Where (screen) · Full (Rive mood/gesture/trigger) · Light (animated or still) · Still (pose component)*. The rows come only from these sources:

| Moment | Source |
|---|---|
| Idle on a tab (Learn, Speak, Practice, Me) | spec "Dombi everywhere"; motion-plan §5 idle |
| Guide bubble (welcome back, a tip, "this one is new") | spec; `Dombi guide / small` |
| Glad after a break | spec ("glad when the learner returns") |
| Late at night | spec ("sleepy late at night") |
| Onboarding / first time on a screen | motion-plan §5 (enter, wave); spec Light key moment |
| Lesson: your turn to speak | motion-plan §5 (`listening` + `amp`) |
| Lesson: correct / not yet | motion-plan §5 (`correct` / `wrong`); round 2 answer panels |
| Lesson: help offered after two misses, help sheet | round 2 pick A |
| Mistakes round | motion-plan §5 (think + thinking) |
| Lesson result, new thing you can say | motion-plan §5 (laugh + celebrate) |
| Level up, perfect lesson | motion-plan §5 (proud, then celebrate) |
| Speak: Dombi talking with captions, listening | round 2 Guided / Free screens |
| Situation scene: Dombi as the small guide | round 2 Situation screens |
| Activity end screens | round 2 end screens |
| Mic off / speech unavailable | round 2 mic-off screens |
| Waiting for the server | motion-plan §5 (thinking, never a spinner) |
| Empty tab before lesson 1 (pointing to lesson 1) | spec "When Speak and Practice open" (point gesture) |

- [ ] **Step 2:** Mark which rows are Light's key moments (onboarding, answers, celebrations, per the spec) and which are still at Light. Check the Review Focus 3 and 5 rules against the table.
- [ ] **Step 3: Save and commit** (`Redesign: Dombi moment map`).

### Task 2: Still poses at every size the map uses

**Files:** row `Still poses` in the section; exports `design/redesign/dombi/still-poses.png`, `still-poses-dark.png`.

- [ ] **Step 1:** For each pose named in the map's Still column, place the existing component at every size the map uses (150, 80, 48, overlay). Where a size of a needed pose has no component (for example `Dombi / 48 / oops`), make it as a copy of the 150 pose scaled, never a new drawing. List each one made.
- [ ] **Step 2:** Dark copy of the row. Check Review Focus 1 and 4 by eye on the export; where a face is not tellable at 48, change the map to a pose that is and note it.
- [ ] **Step 3:** Checker on the row and its dark copy: `violations: []`. Save, export, commit (`Redesign: Dombi still poses at every size`).

### Task 3: The three levels on real screens

**Files:** row `Levels` in the section; export `design/redesign/dombi/levels.png`.

Three screens from the finals, each shown three times side by side (Full, Light, Still): the Learn tab, the lesson "not yet" moment, the lesson result. Full and Light carry a small grey label under Dombi naming the Rive state that plays ("idle", "`wrong` reaction"); Still shows the still pose from the map. This is a reference for the builder and the owner; it adds nothing to the screens themselves.

- [ ] **Step 1:** Copy the three screens; set Dombi on each copy per the map. Checker: `violations: []`.
- [ ] **Step 2:** Export, look, save, commit (`Redesign: Dombi at the three levels`).

### Task 4: The animation setting — two options

**Files:** row `Setting` in the section; export `design/redesign/dombi/setting-a|b.png`.

The spec asks for "a setting lets the learner turn animation down by hand". It goes on the existing settings screen (copy from "Storyboard · Profile & settings" `h1R3g`, the screen reached from the Me tab final), as one more row in the existing style. Two ways:

- **A · Three choices:** a row "Dombi harakati" with the existing `Segmented` component: "To'liq · Yengil · Rasm". The phone's measured level is pre-selected; the learner can pick a lower one, not a higher one than the phone allows.
- **B · One switch:** a row "Kamroq harakat" with the existing `Toggle`; on means Still.

Each option also in the Reduce Motion state: the row is set to Still and shows one muted line "Telefoningizda harakat kamaytirilgan." Both lines go on the copy list.

- [ ] **Step 1:** Draw A and B with their Reduce Motion states, light and dark. Checker: `violations: []`.
- [ ] **Step 2:** Export, look, save, commit (`Redesign: Dombi animation setting options`).

### Task 5: Owner review

**Files:** `design/redesign/dombi/review.html` (same picking page as rounds 1 and 2, with the db capability); `docs/superpowers/specs/2026-10-23-english-redesign-choices.md` (append "Round 3").

- [ ] **Step 1:** Publish a review page: the moment map with an "OK / change" note per row; the still poses and levels shown once; setting A/B to pick; the new Uzbek lines with OK / Change.
- [ ] **Step 2:** Read the owner's answers; append them to the choices file and the moment map file; commit.

### Task 6: Finish and review

- [ ] **Step 1:** Apply the owner's picks and notes; dark copies of every final frame; checker on all.
- [ ] **Step 2:** A fresh reviewer checks the map, poses and setting against the spec, the Global Constraints and the Review Focus; fix real findings.
- [ ] **Step 3:** Save, export, update the review page, commit (`Redesign: final Dombi states and levels`).
