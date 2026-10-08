# LOCKED — Teaching Programme (English app)

**Status:** Locked · **Date locked:** 2026-10-08
**Related:** [scene-simulation-concept.md](scene-simulation-concept.md) · [activities.md](activities.md)

> **Updated 2026-10-09:** lessons are no longer "daily" — learners do as many lessons as they want; see
> [teaching-methodology.md](teaching-methodology.md) §3. Wording below is updated to match.

## Core promise (Idea 1)

> **"Every lesson leaves you with one new thing you can actually SAY out loud."** (lessons ≈3–5 min; do as many as you like)

- Every lesson ends with one real ability, e.g. "You can now **ORDER A DRINK** ☕".
- End-of-lesson card: the new phrase (no own-voice playback here — see teaching-methodology.md §10).
- Each skill is added to the learner's **"Things I can say"** list.
- On listening/grammar days the skill can be "Today you can **UNDERSTAND** …".
- Skills must feel useful, never babyish.
- Why: competence is the strongest motivator (SDT); every session ends in a clear win;
  matches CEFR "can-do" statements; "100 days = 100 things you can say" is easy to market.

## Unit order

A unit = a sequence of lessons, each one "can-say" skill, that build up to the Scene (Checkpoint in the MVP).

```
UNIT 3: AT THE CAFÉ ☕
Lesson 1 → You can ORDER A DRINK        "I'd like a coffee, please."
Lesson 2 → You can ASK THE PRICE        "How much is it?"
Lesson 3 → You can ASK ABOUT FOOD       "Is it spicy?"
Lesson 4 → You can CHANGE YOUR ORDER    "Actually, can I have tea instead?"
Lesson 5 → You can PAY AND SAY GOODBYE  "Can I pay by card? Thanks, bye!"
Unit end → 🎬 SCENE (MVP: 🔁 Checkpoint), using everything from Lessons 1–5
```

## The engine — three layers

### Layer 1 — SAME for everyone (human-owned)
- Units and their order
- Each lesson's skill and its **title**
- The Scene at the end of each unit

Why: quality control, logical build-up, classes/friends/parents can follow the same path,
and lessons can be tested and improved with data.

### Layer 2 — DIFFERENT per learner (smart engine, rule-based at launch)
- **Exercise choice** inside each day, driven by:
  - **Memory** — words about to be forgotten (FSRS)
  - **Mistakes** — personal Uzbek/Russian error patterns (he/she, articles, "three book", "th")
  - **Weak skills** — more of the learner's weakest activity type
- **Starting point** — placement test; skip-ahead for strong learners
- **Review** — due words + past mistakes mixed in
- **Help level** — the Scene's help ladder adapts
- **Mode** — full / headphones / silent changes which activities appear

### Layer 3 — AI (live, limited)

| AI DOES ✅ | AI DOES NOT ❌ |
|---|---|
| Characters react to what the learner actually says | Rename lessons or skills |
| Gentle corrections (recasts) | Write new lessons on its own |
| Pick the example version matching the learner's goal (from human-approved options) | Change unit order |
| Pronunciation scoring, mistake-pattern detection | Write grammar explanations live |

Example: skill "ORDER A DRINK" is fixed; the setting adapts to goal —
travel → London café · work in Korea → office canteen · school student → school canteen.

## Content rule — "AI drafts, humans approve"

> AI may help **produce** content behind the scenes (sentence variants, Fix It items, goal-specific
> example versions, translations). **Nothing reaches learners until a human checks and approves it.**
> Titles, skills, unit order and explanations stay human-owned.

Rule: **humans write or approve everything.**

Why: hand-writing everything does not scale for a small team (hundreds of units, Uzbek + Russian
versions); fully AI-made content caused quality complaints and public backlash for Duolingo (2025).

## Comparison with Duolingo

| | Duolingo | Akademiya |
|---|---|---|
| Fixed path | ✅ | ✅ |
| Personal exercise choice | By difficulty (Birdbrain) | Difficulty **+ Uzbek/Russian mistake patterns** |
| Spaced repetition | HLR model | FSRS |
| Lesson goal | Themes / word sets | **One "can-say" skill per day** |
| Live AI conversation | Mostly paid tier | Core of the Scene |
| AI content | Heavily AI-generated at scale | AI drafts, humans approve |
| Learner's language support | Generic | Uzbek/Russian-specific explanations and mistakes |
