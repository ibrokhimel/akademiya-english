# LOCKED — Lesson Template: How Lessons Mix Exercises (MVP)

**Status:** Locked · **Date locked:** 2026-10-09 · **Roadmap item:** #24
**Related:** [mvp-lessons.md](mvp-lessons.md) · [mistake-engine.md](mistake-engine.md) · [exercises.md](exercises.md) ·
[teaching-methodology.md](teaching-methodology.md)

Uses only the 6 MVP exercises: E1 Meet It · E2 Say What You See · E4 Tile Builder · E6 What Happened? ·
E9 Echo Line · E13 Tap the Mistake (+ Tap the gap).

## Standard lesson (~12 items, ~3–5 min) — recipe Hear → Notice → Say → Use

| Step | Exercises | Count |
|---|---|---|
| 1. HEAR | E1 Meet It (one per new phrase) | 3 |
| | E6 What Happened? (short dialogue with the new phrases) | 1 |
| 2. NOTICE | E13 Tap the Mistake / Tap the gap (the lesson's Uzbek trap) | 1 |
| 3. SAY | E9 Echo Line | 2 |
| | E4 Tile Builder | 2 |
| | 🔁 Review — E4 / E9 / E2 with phrases from earlier lessons, mixed in | 2 |
| 4. USE | E2 Say What You See with an Uzbek situation task — the lesson's main phrase | 1 |
| 🔁 Mistakes | Missed items repeat at the end until correct | 0+ |
| 🎉 Finish | "New thing you can SAY" card | — |

Ladder inside a lesson: meet → recognise in context → repeat → rebuild → say from memory → use.
Never more than 3 of the same exercise in a row; every item under 30 seconds.

## Special cases

| Case | Change |
|---|---|
| Lesson 1 (first ever) | Shorter (~8 items): no review, no trap |
| Lessons with no trap (1, 5) | Tap the Mistake → 1 extra Echo |
| Lesson 15 (fifteen vs fifty) | Trap taught with 2 What Happened? items about prices |
| "Can't speak now" | Echo skipped and saved for later; Meet It and Say What You See → word tiles; lesson still completes |
| Voice recording | With permission, one random speaking item in some lessons is recorded |

## Checkpoint (end of each unit, ~14 items) — a story chain

| Part | Exercises |
|---|---|
| Listen to the whole situation | E6 What Happened? ×2 |
| Fix the unit's traps | E13 ×2 |
| Warm up | E9 Echo ×2 · E4 Tile ×2 |
| Story chain | E2 Say What You See ×5 — one per step (e.g. greet → order → ask the price → pay → goodbye), each with an Uzbek situation task |
| Earlier units | 1–2 items mixed in |
| Finish | Unit trophy + 🙂 / 😄 / 🤩 reaction (based on mistakes); after Unit 3 → 🎉 Level 1 |

No new phrases in a Checkpoint.

## Model example — Lesson 6 "ORDER A DRINK"

| # | Step | Exercise | Content |
|---|---|---|---|
| 1 | Hear | Meet It | ☕ "A coffee, please." |
| 2 | Hear | Meet It | 🍵 "A tea, please." |
| 3 | Hear | Meet It | 🍊 "An orange juice, please." |
| 4 | Hear | What Happened? | Café dialogue → "What did the customer order?" ☕ / 🍵 / 🍊 |
| 5 | Notice | Tap the Mistake | *Siz apelsin sharbati buyurtma qilyapsiz:* "**A** orange juice, please." → An |
| 6 | Say | Echo | Waiter: "Anything else?" → customer: "A tea, please." |
| 7 | Say | Tile Builder | *Menga bitta qahva, iltimos.* → A coffee, please. |
| 8 | Review | Echo | "Nice to meet you." (Unit 1) |
| 9 | Say | Tile Builder | *Menga apelsin sharbati, iltimos.* → An orange juice, please. |
| 10 | Review | Say What You See | 👋 *Ofitsiantga salom bering.* → "Hello!" (Unit 1) |
| 11 | Say | Echo | "An orange juice, please." |
| 12 | Use | Say What You See | ☕ *Siz qahva xohlaysiz. Ofitsiantga ayting.* → "A coffee, please." |
| 🎉 | Finish | | You can now ORDER A DRINK ☕ |

## The lesson files (written 2026-10-14; English and Uzbek lines approved by the owner the same day)

All 15 lessons and the 3 checkpoints are written item by item: 222 items, 49 taught phrases, 107 sound clips.
To read and hear them: motion lab, page 11 (`design/motion/lessons.html`).

| File (`src/content/`) | What is in it |
|---|---|
| `phrases.json` | every taught line once: `id`, `en`, `uz` (the meaning shown in Meet It and in feedback), `pic`, `voice` (who says it), `lesson`, `loose` (names and Uzbek words that count as said whatever the phone heard: Aziz, Malika, Tashkent, samsa, som) |
| `traps.json` | the 9 traps with the Uzbek line shown after a miss |
| `unit-1.json` … `unit-3.json` | the unit's name, its lessons and its checkpoint. A lesson has `skill`, `title`, `new` (phrases it teaches), `trap` and `items` in order |
| `audio/<voices>/…` | the sound clips and their times (sound-plan.md, "The English of the lessons") |
| `check.js` | `node check.js` tests every rule on this page and lists what is missing |

One line per item:

| `ex` | Exercise | What the line holds |
|---|---|---|
| `meet` | E1 Meet It | `p` (the phrase) |
| `heard` | E6 What Happened? | `talk` (who says what), `q` (the question in Uzbek), `opts` (3 answers: picture and Uzbek label), `right` |
| `fix` | E13 Tap the Mistake | `ctx` (Uzbek context line), `words`, `bad` (the wrong word), `right` (the correct sentence), `trap` |
| `gap` | E13 Tap the gap | `ctx`, `words`, `gap` (where the word is missing), `right`, `trap` |
| `echo` | E9 Echo Line | `p`; `lead` when another person speaks first (the waiter: "Anything else?") |
| `tiles` | E4 Tile Builder | `p` and `extra` (the 2 wrong tiles); or a free sentence `en` + `uz`, with `of` = the phrase it practises (number rows) |
| `say` | E2 Say What You See | `p`, `task` (the situation in Uzbek), `also` / `accept` (other answers that are also right), `pic` when it differs from the phrase's |

Marks: `review` (from an earlier lesson), `use` (the lesson's last item), `step` (place in a checkpoint's story chain).
A picture is a lesson picture (`tea`), an icon (`icon:card`) or plain text shown large (`text:10 000 so'm`, `text:S`).

Choices made while writing, for the owner to overrule:

- **Four voices.** Aziz and Malika say the learner's lines and all taught phrases (so two voices are heard from the
  start); the waiter speaks in Unit 2 and the seller in Unit 3.
- **Numbers are spread out.** The locked list puts 1–20 in Lesson 8 and all the tens in Lesson 15. As counting rows of
  five that is too much for one Level 0 lesson, so Lesson 8 teaches 1–10, Lesson 9 adds 11–15 and Lesson 10 adds
  16–20. Lesson 15 keeps both rows of tens. No lesson has more than 4 new lines.
- **What Happened? answers carry a short Uzbek label** under the picture, so a picture alone never has to carry the
  meaning (rule 2, clear cue).
- **Say What You See accepts the other correct ways** the learner already knows ("A coffee, please." / "Can I have a
  coffee?"), so a right answer is never marked as a mistake.
- **The checkpoint's story chain is 5 Say items in a row** (the locked design), the only place more than 3 of one
  exercise follow each other. Checkpoint 3 folds "pay" and "goodbye" into "Sotib oling" to keep 5 steps.
- **Echo lines are said by the person who would say them** (the learner's lines by Aziz or Malika, "Small, medium or
  large?" by the seller). Aziz and Malika have no moving face yet, only their still pictures (see pages.md).

Known gap: the row "One, two, three, four, five." has no review item of its own after Lesson 8; the numbers return
inside every price instead.

## MVP content size

15 lessons × ~12 items + 3 Checkpoints × ~14 items ≈ **220 exercise items**, ~150–200 audio clips —
written by hand (AI may draft, humans approve).
