# LOCKED IDEA — Live Scene Simulations (English app)

**Status:** Locked core concept · **Date locked:** 2026-10-08
**Product:** English-learning app for Uzbek- and Russian-speaking learners

---

> **Scope:** this file designs **one activity type** — the Scene. Other activities in the app are
> designed separately. **Art style is NOT decided yet** — to be chosen later.

## The idea in one sentence

The learner walks to a place in a **top-down** town view, sees a **situation shot** that sets the
goal, then the camera **switches to 1st person** and the character talks *to the learner*. The
learner **speaks or types** their line ("I'd like a cup of coffee, please"), and the character
**reacts with AI** to whatever they say. It is the case-based study method turned into a lived
experience.

## Camera flow (locked 2026-10-08 — replaces the 3rd→1st person video)

```
1. 🗺️ TOP-DOWN        Learner walks through the town to the place (e.g. café door)
2. 🎬 SITUATION SHOT   One wide still picture with small motion; states the goal
                      ("You're hungry. Order lunch.") + one short overheard model
                      exchange (audio + subtitles) so the learner hears an example
3. 👁️ FIRST PERSON     Character faces the learner (head & shoulders) and talks → learner speaks
```

- The top-down town can double as the **course map** (each building = a unit).
- One location can host many scenes (café: breakfast, coffee, wrong-order complaint).
- Minimal assets: town tiles + walking sprite · one illustration per location · one front-facing
  bust per character with ~5 expressions (idle, listening, thinking, talking, reacting).
- Keep **one art style** across all three views; characters must be recognisable in every view.
- 🤔 "Thinking" expression covers AI reply time instead of a loading spinner.

## Why it is strong

1. **Modelling → doing** — "watch first, then do it yourself" is proven skill teaching; seeing the
   full exchange first lowers fear.
2. **Rehearsal for real life** — memory is tied to situation; words learned "at the counter" come
   back at a real counter.
3. **Case-Based Preview, upgraded** — same pedagogy as the existing CBP, but lived, not read;
   emotion boosts memory.
4. **Kills speaking fear** — an AI waiter never laughs; unlimited retries.
5. **Marketing power** — a 15-second clip of the scene sells the app.

## How a scene works

```
1. ARRIVE    (top-down → situation shot)  Walk to the place; goal shown; overheard model exchange
2. PREPARE   (~30s)        3 key chunks ("I'd like…", "Can I have…", "How much is…")
3. YOUR TURN (1st person)  Character speaks to the learner → learner speaks/types
                           → AI reacts naturally and RECASTS mistakes (no "wrong!")
4. TWIST                   Unexpected change ("Sorry, no more cappuccino") → learner adapts
5. REPLAY                  Same scene, harder level, fewer hints
6. RESULT                  Goal ⭐ · mistakes explained in Uzbek/Russian · new words → FSRS review
```

## Help ladder (so beginners never freeze)

- **Level 1:** choose the line from 3 options, then say it
- **Level 2:** sentence starter — "I'd like a ___, please"
- **Level 3:** free speech — AI reacts to anything
- **Always:** 💡 hint button + Uzbek/Russian "whisper" ("Say that you want coffee")

## Locked decisions

- **Format:** illustrated/animated characters + AI dialogue + AI voice
  (not filmed video — can't react freely; not realistic AI video avatars — too costly / laggy / uncanny).
  Exact art style: **to be decided later**.
- **Differentiation** (the idea alone is not new — Duolingo Adventures, Praktika, Speak exist):
  - Uzbek/Russian hints, whispers and mistake explanations
  - Local, goal-relevant scenes (Korea visa interview, UK seasonal-work interview, IELTS speaking room, bazaar, café)
  - Real pedagogy inside the scene: recasts, twists, replays, spaced review
- **Freshness:** replay twists, goals with stakes, recurring characters who remember the learner.

## Known risks / must-test early

| Risk | Note |
|---|---|
| Latency | Character reply must be ≈ ≤1s after learner stops speaking |
| Speech recognition | Must understand Uzbek/Russian accents without auto-"fixing" the errors we want to teach |
| Cost per minute | ASR + LLM + TTS — cap free usage (e.g. 3 scenes/day) |
| Content scale | Needs a scene template + AI-assisted production pipeline |
| Novelty fade | Twists, stakes, recurring characters |
| Child safety | Moderate AI replies; privacy for minors |

## Ratings (honest assessment)

Teaching value **9/10** · user love **9/10** · marketing **10/10** · build difficulty **8/10 (hard)** · cost risk **7/10**

## Role in the teaching system (locked 2026-10-08)

Scenes are the **core of the curriculum**, not the whole of it (task-based learning). Each unit is
designed **backwards from a scene goal**; the scene decides what words, listening and grammar come
before it. Supporting methods: chunks, listening, shadowing, recasts, Uzbek/Russian grammar contrast,
spaced review (FSRS).

## Lesson structure (locked 2026-10-08)

Duolingo's lesson mechanics, with the scene as the real skill check:

```
UNIT: "At the café"
├── Lesson 1 (≈3 min)  phrases: I'd like / Can I have      → pass by finishing
├── Lesson 2 (≈3 min)  listening + shadowing               → pass by finishing
├── Lesson 3 (≈3 min)  mini grammar in Uzbek/Russian + recall → pass by finishing
├── Review   (≈2 min)  personal mistakes + spaced words
└── 🎬 SCENE (4–5 min) do the task with the AI character    → pass by DOING it
```

- **Copy from Duolingo:** 2–5 min lessons, pass by finishing, one clear path, celebration screen,
  "one more lesson" loop. Copy mechanics only — never their look, owl or characters.
- **Do differently:**
  - **No hearts / energy** — mistakes never block learning (free tier limits AI scenes instead)
  - ~~Learner chooses session size~~ — removed 2026-10-09: no minutes question; learners continue or stop as they like
  - Kind streaks + 60-second **"quick win"** lessons for tired days
  - **Micro-scenes** (one exchange) inside normal lessons so speaking happens daily
  - Cliffhanger lesson endings · daily "scene of the day" · skip-ahead test for strong learners

## Rewards (locked 2026-10-08 — replaces stars)

- **In the moment — character reaction** (✅ confirmed by owner as the favourite): 🙂 "Thanks!" (with hints) → 😄 "Great, have a nice day!"
  (few hints) → 🤩 "Wow, your English is amazing!" (free speech + twist handled)
- ~~Passport stamps~~ — **removed by the owner 2026-10-09.**

## Achievement ideas (not final — achievements are decided after the MVP, see progress-system.md)

Reward real skill and habits, not taps.

- **Skill:** First Words (first scene finished by speaking) · Regular Customer (café ×3 with different
  twists) · No Hints Needed · Twist Master (10 twists) · Day 1 vs Day 30 (first progress recording)
- **Habit:** 7 / 30 / 100-day streaks · Night Owl / Early Bird (same time 5 days running)
- **Hidden (surprises):** e.g. make a character laugh, handle a twist on the first try

## First step (MVP)

Build **5 polished scenes** — café, shop, taxi, hotel, job interview — with animated characters,
the help ladder and twists. Test with 20–30 real learners. Measure:

1. Do they finish the scene?
2. Do they come back tomorrow?
3. Do they speak more confidently?

If yes → build the scene-production system and scale.
