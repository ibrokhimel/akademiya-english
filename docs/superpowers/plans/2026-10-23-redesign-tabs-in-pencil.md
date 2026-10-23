# Redesign · The Four Tabs in Pencil · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design the four new tabs of Akademiya English (Learn, Speak, Practice, Me) in Pencil, with 2–3 versions of each for the owner to choose from, then finish the chosen versions with their first-time and dark states.

**Architecture:** All work happens in the existing file `pendev/Akademiya English.pen` through the Pencil MCP, inside one new section frame. Shared pieces (tab bar, Dombi guide bubble) become reusable components first; each tab is then drawn as three options from those pieces and the file's existing components. A small checker snippet, run through the Pencil MCP, enforces the design system's measurable rules before anything is shown to the owner.

**Tech Stack:** Pencil (pencil.dev) app + `pencil` MCP (`get_app_state`, `execute`, `read_skill`); Node 20 for the export and review helpers; git.

**Spec:** `docs/superpowers/specs/2026-10-23-english-redesign-design.md` (read it first). Design system: `design/system/README.md` and `design/system/tokens.json`.

This is plan 1 of several. It covers only the tab designs. Activity screens, Dombi's states and phone levels, remaining states, and the code build each get their own plan after the owner has picked these designs.

## Global Constraints

- Design file: `pendev/Akademiya English.pen`. Before Task 1, read the Pencil skill (`read_skill()`, then `read_skill({ path: "execute.md" })`).
- Phone frame: 390 × 844, white background token, status bar and the new tab bar included.
- Colours: only `$` variables, never raw hex (the file has a `mode` theme axis, light/dark; raw hex will not switch).
- Type steps only (from `tokens.json`): 34/40 900, 26/32 900, 20/26 900, 16/23 700, 14/20 700, 12/16 900 caps +0.8, button 16/22 900 caps +0.6. Nothing under 12.
- One main colour (English violet `#7B5CFF`), reward yellow for at most one card per screen, green only for "correct", amber for "not yet".
- Icons in interface controls: the single-colour glyph components (`Glyph / … / dark|grey|violet|white`). Colourful icons are for content only.
- Dombi: reuse the existing Dombi components (`Dombi / 48 / default` `a9Evh`, `Dombi / 80 / *`, `Dombi / 150 / *` poses). Never cute, never sad.
- The lesson path design "Path H" is locked: take it from "Screen 11 · Path" (`H1iNNd`) in "Storyboard · Lesson loop", never from the old frame "Learn — Timeline" (`lWoch`).
- All interface text in Uzbek, short and literal, no slogans. Every new line goes on the copy list for the owner's check.
- Not a copy of Akademiya Math: no tile grid that mirrors Math's Today screen, no blue/yellow/black Math look.
- **Save safety:** never delete children of a reusable component that has instances (build a new component and swap instead). After each task, save and confirm the file size on disk changed (see "Saving" below). Don't ask the owner to save.

### Saving (used by every task's last steps)

From PowerShell: read the foreground window title first. If it isn't Pen, Claude, a terminal or an editor (for example a game or a video), don't switch windows; skip the save and say so in one line. Otherwise tap ALT with `keybd_event`, `SetForegroundWindow` on the `Pen` process window, confirm the foreground process is Pen, send `^s`, return focus, then compare `(Get-Item 'pendev/Akademiya English.pen').Length` and `LastWriteTime` with the values before. If the Windows Search panel is in front, send ESC first. After a risky edit, look for `auto-save-failed` in `C:\Users\User\AppData\Roaming\Pen\logs\main.log`.

## Review Focus

1. **Long Uzbek labels** ("Mashq qilish", "Ayta oladiganlarim", place names) must fit a 360-wide phone without clipping. Every tab task runs the checker on a 360-wide duplicate too.
2. **A brand-new learner** with no lessons done sees Speak, Practice and Me empty. Every tab task draws its first-time state, with Dombi pointing to lesson 1.
3. **Dark mode:** every screen gets its dark copy 13,000 px to the right, and the checker runs on both.
4. **Later growth:** the course will grow from 3 units to about 48. Speak's place list and Practice's activity list must still work with many places or long progress lists; each option shows a scrolled state with at least 6 places or rows.
5. **Phones that only show a still Dombi:** each tab must look complete with a still Dombi pose (no animation). Options use still poses from the existing components, so they are what the Still level shows.

---

### Task 1: Checker snippet and section frame

**Files:**
- Create: `design/system/pencil-check.js`. A Pencil `execute` snippet; the frame id goes in the first line as `const FRAME = "<id>";`.
- Create: `design/redesign/README.md` (what the section holds, and how to run the checker).
- Modify: `pendev/Akademiya English.pen` (new top-level section frame).

**Interfaces:**
- Produces: `pencil-check.js`. When run with `FRAME` set, it returns `{ frame, width, violations: [{ nodeId, rule, detail }] }`. The rules:
  - `small-text`: font size under 12.
  - `off-scale`: a text whose size/weight pair is not in the type steps.
  - `raw-colour`: a fill or stroke that is a hex value rather than a `$` variable.
  - `width`: frame width not 390 or 360.
  - `no-dombi`: no instance of any `Dombi / …` component inside the frame.
  - `two-heroes`: more than one node filled with the reward-yellow variable.
- Produces: section frame `Redesign · Tabs` (placed clear of all existing top-level frames). Later tasks put everything inside it, in rows named `Learn`, `Speak`, `Practice`, `Me`.

- [ ] **Step 1: Write the checker**, walking the frame's descendants. Read sizes, weights, fills, strokes and component references through the API documented in `execute.md`.
- [ ] **Step 2: Prove it catches problems.** Run it on "Screen 11 · Path" (`H1iNNd`). Expected: at least one `off-scale` or `small-text` violation and no crash.
- [ ] **Step 3: Prove it passes clean work.** In the new section, draw a 390-wide fixture frame `Check fixture` with one 26/900 title, one 16/700 body text, a `Dombi / 48 / default` instance, and only variable colours. Run the checker. Expected: `violations: []`. Delete the fixture.
- [ ] **Step 4: Save** (see Saving) and confirm the file size changed.
- [ ] **Step 5: Commit**

```bash
git add design/system/pencil-check.js design/redesign/README.md "pendev/Akademiya English.pen"
git commit -m "Redesign: Pencil design checker and the Tabs section"
```

### Task 2: Pattern references

**Files:**
- Modify: `pendev/Akademiya English.pen` (frame `References` in `Redesign · Tabs`).

**Interfaces:**
- Produces: a `References` frame with four columns (Learn, Speak, Practice, Me). Each holds 3–5 notes: the pattern, the app it comes from, and one line on why it fits a speaking-first app for Uzbek learners. Notes and simple sketches only; no copied screenshots. The options in Tasks 4–7 cite these notes by number (L1, S2…).

- [ ] **Step 1: Study** language-learning and practice apps with strong hub and profile screens (for example Speak, Praktika, Busuu, Babbel, Duolingo, Elsa) through the web, and note patterns for: a practice hub, a conversation picker, a daily challenge, a profile and progress screen. Akademiya Math may be listed only as a quality bar, never as a pattern source.
- [ ] **Step 2: Write the notes** into the `References` frame, numbered L1…, S1…, P1…, M1….
- [ ] **Step 3: Save and commit**

```bash
git add "pendev/Akademiya English.pen"
git commit -m "Redesign: pattern references for the four tabs"
```

### Task 3: Shared components (tab bar, Dombi guide, tab header)

**Files:**
- Modify: `pendev/Akademiya English.pen` (new components in `Redesign · Tabs`, row `Shared`).

**Interfaces:**
- Consumes: glyph components `Glyph / home`, `Glyph / mic`, `Glyph / target`, `Glyph / user` (grey and violet variants); `Dombi / 48 / default` (`a9Evh`); `Pet bubble` (`TJqNq`) as a starting point for the bubble shape only.
- Produces three new reusable components:
  - `Tab bar / 4 / <tab>`, four variants (`learn`, `speak`, `practice`, `me`): 390 wide; icon plus a label in 12/900 caps; the selected tab uses violet with a violet-wash pill and the others grey. Labels: **O'RGANISH · GAPIRISH · MASHQ · MEN**, all on the copy list.
  - `Dombi guide / small`: `Dombi / 48` with a bubble to his right; bubble text 14/700, at most 2 lines at 240 px wide.
  - `Tab header`: a 26/900 title on the left, stat pills on the right (reusing `Pill / Streak / Active` `M1m8o` and `Pill / Phrases` `xwWt3`).

- [ ] **Step 1: Build `Tab bar / 4`** with its 4 variants as new components. The old `Tab item` (`KCHYG`) stays untouched.
- [ ] **Step 2: Build `Dombi guide / small` and `Tab header`.**
- [ ] **Step 3: Check.** Put one instance of each on a 390 test frame and run `pencil-check.js`. Expected: `violations: []` (the Dombi guide supplies the Dombi instance). Make a dark copy and run it again with the same expectation.
- [ ] **Step 4: Save and commit**

```bash
git add "pendev/Akademiya English.pen"
git commit -m "Redesign: four-tab bar, Dombi guide bubble and tab header components"
```

### Task 4: Learn tab, three options

**Files:**
- Modify: `pendev/Akademiya English.pen` (row `Learn`: frames `Learn · A`, `Learn · B`, `Learn · C`, each 390 × 844, plus a `· 360` duplicate of each).
- Create: `design/redesign/tabs/learn-a.png`, `learn-b.png`, `learn-c.png` (exports).

**Interfaces:**
- Consumes: Task 3 components; Path H nodes (`Lesson node / Done` `ZE5LX`, `Lesson node / Current` `ZJk2L`, `Lesson node / Locked` `Y1pem`, `Lesson node / Checkpoint` `tZiQQ`) placed exactly as in `H1iNNd`.
- Content every option shows: the next-lesson hero card (violet, lesson title in 26/900, start button), the path with the current node in reward yellow, unit separators, Dombi, and the tab bar with Learn selected.
- What makes the options different:
  - **A · Hero above the path:** what was built on 2026-10-23, refined. Dombi's guide bubble sits inside or beside the hero ("Bugun 4 daqiqa yetadi" or similar, on the copy list).
  - **B · Dombi on the path:** a compact `Tab header`. Dombi (`Dombi / 80`) stands next to the current node with a bubble; the hero becomes a slimmer card pinned to the bottom above the tab bar.
  - **C · Places:** each unit opens with a picture banner of its place (café, shop), using the unit icons `Icon / Coffee · Kafeda` `O9PkPM` and `Icon / Cart · Do'kon` `B0Y5e2`. Dombi greets you in the current unit's banner.

- [ ] **Step 1: Draw the three options.**
- [ ] **Step 2: Check.** Run `pencil-check.js` on all six frames (390 and 360). Expected: `violations: []` for each.
- [ ] **Step 3: Export** each 390 frame at 2× to `design/redesign/tabs/learn-*.png` and look at each one. Fix any clipping or overlap, then re-run Step 2.
- [ ] **Step 4: Save and commit**

```bash
git add "pendev/Akademiya English.pen" design/redesign/tabs/learn-*.png
git commit -m "Redesign: Learn tab, three options"
```

### Task 5: Speak tab, three options

**Files:**
- Modify: `pendev/Akademiya English.pen` (row `Speak`: `Speak · A/B/C`, their `· 360` duplicates, `Speak · First time`, `Speak · Many places`).
- Create: `design/redesign/tabs/speak-a.png`, `speak-b.png`, `speak-c.png`, `speak-first-time.png`.

**Interfaces:**
- Consumes: Task 3 components; character pictures `Waiter / A` `YpKhS`, `Waiter / C` `vwHho`, `Lesson picture / aziz` `GsMhW`, `Lesson picture / malika` `WWTui`; `Scene dialogue` `UEM28` and `Character reaction` `DsZyR` for preview ideas; `Voice then vs now` `dp9Gu`.
- Content every option shows:
  - **Talk to a character:** places Kafe (waiter), Do'kon (seller, a still picture), Ko'cha (Aziz, Malika). Each with conversations done/total and a locked state for places not yet started.
  - **Which one did you hear?:** with a sample pair.
  - Dombi and the tab bar with Speak selected.
- What makes the options different:
  - **A · Place cards:** large cards, one per place, with the character picture and a start button.
  - **B · Conversation previews:** each place shows the first two lines of a conversation as chat bubbles; tap to continue.
  - **C · Street:** places as buildings along one street, with Dombi walking you to the next one.
- `Speak · First time`: before lesson 1. Dombi with a bubble pointing to the first lesson; places shown locked.
- `Speak · Many places`: the chosen layout with 6+ places scrolled (Review Focus 4). Draw it for whichever option the owner later picks; for now, for A.

- [ ] **Step 1: Draw the three options, then `First time` and `Many places`.**
- [ ] **Step 2: Check** all frames with `pencil-check.js`. Expected: `violations: []`.
- [ ] **Step 3: Export** to `design/redesign/tabs/speak-*.png` and look at each one; fix, then re-check.
- [ ] **Step 4: Save and commit**

```bash
git add "pendev/Akademiya English.pen" design/redesign/tabs/speak-*.png
git commit -m "Redesign: Speak tab, three options and the first-time state"
```

### Task 6: Practice tab, three options

**Files:**
- Modify: `pendev/Akademiya English.pen` (row `Practice`: `Practice · A/B/C`, `· 360` duplicates, `Practice · First time`, `Practice · Challenge done`).
- Create: `design/redesign/tabs/practice-a.png`, `practice-b.png`, `practice-c.png`, `practice-first-time.png`.

**Interfaces:**
- Consumes: Task 3 components; `Streak week (Sunday first)` `ePpgE`; glyphs for each activity.
- Content every option shows:
  - **Daily challenge:** the screen's single reward-yellow card. It says 3 tasks, about 2 minutes, and that it keeps the streak alive.
  - **Match rush, Catch the sentence, Overheard, Fix it**, each with a short line on what it is and a best score or "done today".
  - Dombi and the tab bar with Practice selected.
- What makes the options different:
  - **A · Challenge plus list:** the yellow challenge card on top, then the four activities as full-width rows.
  - **B · Challenge plus two-by-two:** the challenge card, then four square cards in a 2 × 2 grid with a picture per activity. It must not mirror Math's Today tiles: no lip-under tiles, no mixed tile sizes.
  - **C · Skill groups:** the challenge card, then "Tinglash" (Overheard, Catch the sentence) and "So'zlar" (Match rush, Fix it) as two labelled groups.
- `Practice · First time`: the challenge card is locked until lesson 1; Dombi's bubble says so.
- `Practice · Challenge done`: the challenge card in its done state (check, "Ertaga yangisi"); the streak dot for today filled.

- [ ] **Step 1: Draw the three options and both states.**
- [ ] **Step 2: Check** all frames. Expected: `violations: []`. A `two-heroes` result here means a second yellow card crept in.
- [ ] **Step 3: Export and look; fix, then re-check.**
- [ ] **Step 4: Save and commit**

```bash
git add "pendev/Akademiya English.pen" design/redesign/tabs/practice-*.png
git commit -m "Redesign: Practice tab, three options and its states"
```

### Task 7: Me tab, three options

**Files:**
- Modify: `pendev/Akademiya English.pen` (row `Me`: `Me · A/B/C`, `· 360` duplicates, `Me · First time`).
- Create: `design/redesign/tabs/me-a.png`, `me-b.png`, `me-c.png`, `me-first-time.png`.

**Interfaces:**
- Consumes: Task 3 components; `Streak card` `z12L2`, `Level ring card` `N33mk`, `Achievement / Unlocked` `ug3ea`, `Achievement / Locked` `T04ET`, `Phrase card / Practised` `iCaLS`, `Voice then vs now` `dp9Gu`, `Profile header` `Jmj2h` (as reference).
- Content every option shows:
  - Name and level; streak with the week.
  - "Ayta oladiganlarim" count, linking to the phrase list.
  - Personal records and awards (the ones in `components/ProfileDetails.tsx`; no new achievement list, no currency).
  - My recordings ("Ovozim").
  - Entries for settings and account.
  - Dombi and the tab bar with Me selected.
- What makes the options different:
  - **A · Dombi header:** a short violet header with Dombi beside the name, then sections stacked.
  - **B · Stats first:** a big "things I can say" number (34/900) as the screen's one display number, then streak, records, recordings and settings rows.
  - **C · Two parts:** a segmented switch at the top between "Natijalar" (progress) and "Profil" (profile and settings), using the existing `Segmented` `RdGHL`.
- `Me · First time`: no lessons yet. Dombi's bubble, zeroes shown kindly, awards locked.

- [ ] **Step 1: Draw the three options and the first-time state.**
- [ ] **Step 2: Check** all frames. Expected: `violations: []`.
- [ ] **Step 3: Export and look; fix, then re-check.**
- [ ] **Step 4: Save and commit**

```bash
git add "pendev/Akademiya English.pen" design/redesign/tabs/me-*.png
git commit -m "Redesign: Me tab, three options and the first-time state"
```

### Task 8: Owner review and choices

**Files:**
- Create: `design/redesign/tabs/review.html` (a page showing each tab's options side by side, from the PNG exports; published as a private artifact for the owner).
- Create: `docs/superpowers/specs/2026-10-23-english-redesign-choices.md` (the owner's picks).
- Modify: `design/redesign/README.md` (link the choices).

**Interfaces:**
- Produces: `…-choices.md`, recording per tab the option picked (or the mix, e.g. "B, with A's hero"), any changes requested, and the approved Uzbek copy list (every new line from Tasks 3–7, each marked approved or with its replacement). Task 9 and the build plans read this file.

- [ ] **Step 1: Build the review page** with four sections. Each shows A, B and C side by side at phone size, the pattern notes (L1…) each option uses, and the first-time state underneath. Publish it and give the owner the link.
- [ ] **Step 2: Ask the owner, one tab at a time,** which option they want and what to change. Ask for the copy list check in the same round.
- [ ] **Step 3: Write `…-choices.md`** with their answers, word for word where they gave reasons.
- [ ] **Step 4: Commit**

```bash
git add design/redesign/tabs/review.html docs/superpowers/specs/2026-10-23-english-redesign-choices.md design/redesign/README.md
git commit -m "Redesign: owner's choices for the four tabs"
```

### Task 9: Finish the chosen tabs (light, dark, first time)

**Files:**
- Modify: `pendev/Akademiya English.pen`: frames `Learn · Final`, `Speak · Final`, `Practice · Final`, `Me · Final`; their first-time states; dark copies 13,000 px to the right named `… · Dark`. Losing options move to a row `Not chosen` (kept, not deleted).
- Create: `design/redesign/tabs/final-*.png` (light and dark).

**Interfaces:**
- Consumes: `…-choices.md`.
- Produces: final frames the build plans will cite by name. Also `Speak · Many places` redrawn for the chosen Speak layout, if it differs from A.

- [ ] **Step 1: Apply the owner's choices and changes** to make the four `· Final` frames and their first-time states. Put the approved copy in.
- [ ] **Step 2: Make dark copies** (13,000 px right, `· Dark`) and switch them to the dark mode of the `mode` axis.
- [ ] **Step 3: Check** every final, first-time and dark frame, plus 360 duplicates of the finals. Expected: `violations: []` for all.
- [ ] **Step 4: Export** light and dark to `design/redesign/tabs/final-*.png`; look at each one.
- [ ] **Step 5: Show the owner** the four finals (update the review page) and get a yes; apply small fixes if asked, then re-check.
- [ ] **Step 6: Save, confirm the file size, and commit**

```bash
git add "pendev/Akademiya English.pen" design/redesign/tabs/final-*.png design/redesign/tabs/review.html
git commit -m "Redesign: final four tabs, light, dark and first-time"
```
