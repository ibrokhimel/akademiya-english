# LOCKED — Product Definition (English app)

**Status:** Locked · **Date locked:** 2026-10-08
**Roadmap items:** #8, #11, #12, #34 (and the model part of #32)
**Related:** [teaching-programme.md](teaching-programme.md) · [exercises.md](exercises.md) ·
[activities.md](activities.md) · [scene-simulation-concept.md](scene-simulation-concept.md)

## Background

- **A new, separate app built from scratch.** The earlier Akademiya English app (built from the
  documentation ZIP) failed because it was not designed well from the docs and was never released.
  That ZIP and the Class A / NETS repo are reference only.
- **Lessons applied:** design properly before building · release early and small.
- **Working name:** Akademiya English.

## What the product is

> **Akademiya English is the speaking-first English app for Uzbekistan. Every short lesson (≈3–5 min, as many
> as you like) leaves you with one new thing you can actually say out loud — explained in your own language.**

- **Category:** speaking-first English learning app (AI speaking coach), not a grammar course.
- **The problem:** people in Uzbekistan study English for years but still can't speak — fear of
  mistakes, no one to practise with, apps not made for Uzbek speakers, expensive teachers.
- **What it is NOT:** a grammar textbook · a translator or dictionary · a general AI chatbot ·
  a points game without learning · a school system.

**Three pillars**
1. 🗣️ **Speak from day one** — every lesson ends with saying something out loud.
2. 🇺🇿 **Built for Uzbek (later Russian) speakers** — explanations in your language, a mistake engine
   for the errors your language causes.
3. ⏱️ **A 5-minute habit** — short lessons, kind streaks, visible proof of progress.

## Who it is for

- **Everyone 13+ in Uzbekistan** — one product for teens and adults, like Duolingo.
  Everyday-life content fits every age; differences come from the **goal chosen at signup**
  (school, IELTS, travel, work), not from separate products.
- **Languages:** Uzbek speakers first; Russian speakers in Uzbekistan later (Uzbekistan only).
- **Every level, from zero to B2:**

| Level | Name | CEFR |
|---|---|---|
| 0 | Zero — "I know nothing" | Pre-A1 |
| 1 | Beginner | A1 |
| 2 | Elementary | A2 |
| 3 | Intermediate | B1 |
| 4 | Upper-intermediate (IELTS-ready) | B2 |

- **Privacy for under-18s** to be handled in roadmap #33.

## Teaching for total beginners

- **Listen first** in every exercise; text comes after.
- **All instructions in Uzbek** at Level 0.
- **No grammar terms** — patterns and examples, explained simply in Uzbek.
- **Tiny steps:** single words → 2-word chunks → short phrases. Day 1: "Hello", "Thank you",
  "Hello, I'm ___".
- Tiles and pictures before free speaking; very short lessons (≈3 min) with many wins.

## Uzbek support fades by level (roadmap #8 — locked)

| Level | Uzbek support |
|---|---|
| 0 Zero | Instructions, meanings and explanations all in Uzbek |
| 1 Beginner | Instructions in Uzbek; short English instructions start |
| 2 Elementary | Mostly English instructions; Uzbek explanations for mistakes |
| 3–4 | English; Uzbek only for tricky grammar, on tap |

## Signup and placement

- "I'm new to English" → start at Level 0, no test.
- "I know some English" → short placement test (2–3 min, including a little speaking) → right unit.
- **Prediction at signup (Duolingo-style):** "You'll reach A2 by 15 March" — default pace at signup (no
  "minutes per day" question), then updated from the learner's real pace.

## Scenes and animations (production rule)

- Scenes and animations are **made by hand with AI assistance** ("AI drafts, humans approve") — so they
  look crafted, not generated.
- Use **reusable kits** (characters, backgrounds, props) so each scene doesn't start from zero.

## Making "5 minutes a day" sell (outcomes people pay for)

1. **Goal paths with a finish line** — IELTS Speaking, job interview, travel, school English.
2. **Prediction at signup** — a concrete date for the next level.
3. **Proof of progress** — with permission, voice recorded during random questions, again after ~30 days,
   compare at a random moment;
   end-of-week summary (see teaching-methodology.md §10).
4. **App level certificate** — app-level CEFR result (clearly not official).
5. **Speaking confidence score** — one number that grows weekly.
6. **Parent reports on Telegram** — parents pay for visible results.
7. **Price vs a learning centre** — a fraction of a course, available 24/7.
8. **Unlimited speaking = Premium** — free users get limited speaking practice per day.

## Business model

A business model is the plan for how the app makes money while giving people something worth paying
for: who the customer is, what value they get, how they find it, how we earn, what it costs.

| Part | Decision |
|---|---|
| Main income | **Freemium subscription** — free daily lessons + limited speaking; Premium = unlimited speaking, all units, progress proof, certificate. Monthly + discounted yearly. |
| Extra | **Family plan** (2–6 people) |
| Payments | Payme, Click, Uzum |
| Ads | **None** — they ruin focus and trust |
| B2B (learning centres, schools) | **Later**, not now |
| Partnerships (Uzum, Payme, Beeline, banks) | Later idea |
| Prices | To be set and tested in roadmap #32 |
| MVP | **No payments** — free, to prove learning and retention first |

Why it fits: speaking practice costs money per minute (AI speech), so "unlimited speaking" as the paid
feature means paying users cover the cost of what they use most.

## MVP scope (roadmap #34 — locked)

**Content:** Level 0 → early Level 1, **Uzbek only**.

**3 units:** 1. **Hello!** (greet, introduce yourself — starts from absolute zero) ·
2. **At the café** · 3. **Shopping** (prices, sizes, colours).

**6 exercises:**

| # | Exercise | Why |
|---|---|---|
| E1 | Meet It | Introduces every new phrase, listen first |
| E2 | Say What You See | Speaking from memory — the core skill |
| E4 | Tile Builder | Word order; also the "can't speak" fallback |
| E6 | What Happened? | Listening |
| E9 | Echo Line | Pronunciation |
| E13 | Tap the Mistake | Shows the Uzbek mistake engine |

**In:** simple onboarding (goal + "I'm new" / "I know some") · prediction at signup · lessons →
"New thing you can SAY" card · Uzbek explanations + mistake engine · simple streak ·
"Can't speak now" · simple lesson path · basic progress (days, phrases learned, minutes spoken) ·
MVP gamification package (see [gamification.md](gamification.md)).

**Out (later):** scenes · town · AI conversation · real-life speaking scenarios · Russian · IELTS track ·
leagues · achievements · Headphones/Silent modes · payments · parent reports ·
real placement test.

**AI in the MVP (locked 2026-10-09):** only the phone's built-in speech recognition; everything else is
hand-made content + simple code. See [ai-plan.md](ai-plan.md).

**MVP status (2026-10-09):** an **internal first version** with the first units only (Level 0). It will
**not be published or tested with real users yet** — the 20–30 learner test happens later (roadmap #35).

**Later test goal:** test with 20–30 learners — do they come back the next day, do they speak, do they feel
more confident?
