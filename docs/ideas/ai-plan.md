# AI Plan (English app)

**Roadmap item:** #15 AI as the core
**Status:** MVP AI scope **LOCKED** 2026-10-09 · After-MVP plan **proposed, to be confirmed later**
**Related:** [product-definition.md](product-definition.md) (MVP scope) · [companion-pet.md](companion-pet.md) ·
[teaching-methodology.md](teaching-methodology.md)

---

## Part 1 — MVP AI scope (LOCKED)

> **The MVP uses one AI piece only: speech recognition — the phone's built-in, free speech recognition
> (iOS / Android).** Everything else in the MVP is hand-made content + simple code.

| Piece | In the MVP |
|---|---|
| Speech recognition | ✅ Built-in phone recognition, for E1 Meet It, E2 Say What You See, E9 Echo Line |
| Speaking feedback | Simple: compare what was heard with the expected phrase → green/orange words (as in the prototype) |
| Lesson audio | ~100–200 audio files made once (AI voice or a real person) — not a live AI feature |
| Lessons | Fixed, hand-made, fixed order; earlier words reused **when writing the lessons** |
| Mistakes | Repeat at the end of the lesson until correct (simple code) |
| Uzbek mistake explanations | Written by hand for each E13 item |
| Level prediction | Simple calculation |
| Voice recordings (random questions, with permission) | Just saving audio files |
| Content writing | The team may use ChatGPT/Claude as a tool; not part of the app |

**Why:** almost zero AI cost, faster to build, fewer things that can break — the lesson from the last
app, which was never released.

**The one thing to test:** does built-in recognition understand **Uzbek-accented English** well enough?
The 20–30 learner test answers this. If not, choose a better provider in roadmap #30.

**Not in the MVP:** pronunciation scoring, FSRS memory engine, smart lesson builder, mistake detection in
speech, fluency/confidence scores, pet assistant, conversations, scenes, any live generative AI.

---

## Part 2 — After-MVP AI plan (PROPOSED — not confirmed)

**Navigation update, 2026-10-23:** the owner confirmed a dedicated **AI Speaking** main tab
for the full application, alongside Learn, Progress and Profile. Free conversation,
guided topics and situational roleplays have a direct entrance there; Dombi is an
additional shortcut. Providers, costs, exact modes and the remaining AI proposals below
still require their own implementation and decisions.

**Built 2026-10-28:** free talk with Dombi runs in the browser on Gemini Live (`src/speak-lab/`), with the six
personality packs, text feedback cards, Uzbek explanations, silence nudges, a report and a memory. Design:
[2026-10-28-speaking-companion-design.md](../superpowers/specs/2026-10-28-speaking-companion-design.md). Scenes
stay planned. Navoiy is dropped as Dombi's voice (a Gemini voice from now on); his eight app lines are still
the old clips until they are re-made.

### Three kinds of AI

| Kind | Does | Cost per use |
|---|---|---|
| 🎧 Speech AI | Hears, scores and speaks | Low–medium |
| 🧠 Smart algorithms | Decides what to show and when | ~Free |
| 💬 Generative AI (LLM) | Talks and writes freely | Highest, biggest risk |

### Learner-facing

| # | Feature | Kind |
|---|---|---|
| 1 | Accent-tolerant speech recognition (provider chosen by real accuracy) | 🎧 |
| 2 | Pronunciation scoring per sound (th, w/v, ship/sheep) | 🎧 |
| 3 | Fluency metrics — speed, pauses ("You speak 40% faster than Day 1") | 🎧 |
| 4 | Speaking confidence score | 🎧 |
| 5 | Placement test scoring from a spoken answer | 🎧 |
| 6 | FSRS memory engine | 🧠 |
| 7 | Smart lesson builder — mistakes, weak skills, recycled words | 🧠 |
| 8 | Uzbek mistake detection in speech/text (human-written rules, AI-assisted later) | 🧠 |
| 9 | Weekly summary + "most improved" | 🧠 |
| 10 | Best time for reminders | 🧠 |
| 11 | 🐾 Pet voice assistant (navigation, questions) | 💬 |
| 12 | 🐾 Free speaking practice with the pet, any topic (Premium unlimited) | 💬 |
| 13 | 🎬 Scene characters, limited by the scene script | 💬 |
| 14 | Recasts in conversation | 💬 |
| 15 | "How do I say…?" — say it in Uzbek, get the English phrase (depends on Uzbek recognition quality) | 💬 |
| 16 | Personal phrasebook from conversations | 💬 |
| 17 | Pet memory — name, goal, interests (privacy rules) | 💬 |

### Team-facing ("AI drafts, humans approve")

Content drafting · AI quality checker against the 6 exercise design rules · voice production ·
art and animation help · mistake mining from real learner errors · confusing-exercise finder ·
support assistant.

### Where AI is never used

Course map, unit order, lesson titles, can-say skills · grammar explanations (humans write a bank; AI may
only pick from it) · any fixed content without human approval · grading tap/tile/match exercises ·
final art · prices, payments, account decisions.

### Proposed AI rules (to confirm)

1. AI only where it adds real value — reacting to what this learner said or did.
2. Humans approve everything fixed; live AI only for conversation and reactions.
3. Short replies (1–2 sentences).
4. Safe for 13+: topic limits, no personal-data requests, no romance/adult topics, output checks.
5. Honest: the pet says it is an AI; scores are "estimates", never "official".
6. Fast: conversation replies start within ~1 second (thinking animation covers the wait).
7. Cost-aware: pre-make what can be pre-made; free-plan limits on live AI.
8. Works without AI: lessons still run if AI or internet fails.
9. Private: voice recordings need consent, can be deleted, extra care for under-18s.
10. Never "fix" the learner's mistakes by accident — speech recognition must hear what was actually
    said (normal recognition auto-corrects "three book" to "three books").

### Biggest risks

Uzbek-accent recognition · auto-correction hiding mistakes · live AI cost · reply speed ·
safety for teens · weak Uzbek speech recognition for "How do I say…?".
