# Akademiya English — Roadmap

**Last updated:** 2026-10-16
**Visual view:** [roadmap.html](roadmap.html) (open in a browser; update it together with this file)
**Order of work:** A → B → C → D → E → F → G. Item numbers are permanent IDs, so they are not in order
inside each area.

Legend: ✅ done (locked) · ⏳ in progress · 🟡 proposed, not locked · ❌ not started

**Next up:** the owner sets up the Mac ([mac-setup.md](mac-setup.md)) and, once, lets phones reach the PC
(network → Private, then Allow; [local-servers.md](local-servers.md)). Then Codex builds the phone app (#42) from
[codex-prompt.md](codex-prompt.md): the launch screen, then test B (does the iPhone understand the owner's accent?),
then the screens. Everything else before the build is done: design, decisions, and the PC's local servers.

## A. Product foundation

| # | Item | Status | File |
|---|---|---|---|
| 11 | Product definition — speaking-first app for Uzbekistan, pillars, business model | ✅ | [ideas/product-definition.md](ideas/product-definition.md) |
| 12 | Target audience — everyone 13+, every level zero → B2, Uzbek first | ✅ | [ideas/product-definition.md](ideas/product-definition.md) |

## B. Teaching method

| # | Item | Status | File |
|---|---|---|---|
| 3 | Teaching programme — core promise, unit structure, 3-layer engine, content rule | ✅ | [ideas/teaching-programme.md](ideas/teaching-programme.md) |
| 2 | Activities — 9 + Scene, anti-boredom and anti-"AI slop" rules | ✅ | [ideas/activities.md](ideas/activities.md) |
| 4 | Exercise types — 16 + rules, ladder, feedback, can't-speak, modes | ✅ | [ideas/exercises.md](ideas/exercises.md) |
| 5 | Exercise prototype | ✅ | `src/exercise-lab/` |
| 8 | Uzbek support fades by level (0–4) | ✅ | [ideas/product-definition.md](ideas/product-definition.md) |
| 13 | Full teaching methodology — 8 principles, structure, recycling, Duolingo-style mistakes, no "daily" lessons | ✅ | [ideas/teaching-methodology.md](ideas/teaching-methodology.md) |
| 6 | Lesson recipe — Hear → Notice → Say → Use | ✅ | [ideas/teaching-methodology.md](ideas/teaching-methodology.md) |
| 7 | Course stages — First steps → Survive → Live → Connect → Achieve | ✅ | [ideas/teaching-methodology.md](ideas/teaching-methodology.md) |
| 9 | Progress proof — voice recorded in random questions (with permission) + after 30 days, random compare, weekly summary | ✅ | [ideas/teaching-methodology.md](ideas/teaching-methodology.md) |

## C. Core features

| # | Item | Status | File |
|---|---|---|---|
| 1 | Scene activity — camera flow, help ladder, reactions, achievements | ✅ | [ideas/scene-simulation-concept.md](ideas/scene-simulation-concept.md) |
| 36 | Companion pet — wanders on every screen; double-tap = voice AI assistant + live speaking practice (design later) | ✅ concept | [ideas/companion-pet.md](ideas/companion-pet.md) |
| 14 | Teaching methodology as a feature — covered by teaching-methodology, exercises, activities and progress files | ✅ covered | [ideas/teaching-methodology.md](ideas/teaching-methodology.md) |
| 15 | AI as the core — MVP = built-in speech recognition only; after-MVP AI plan proposed | ✅ MVP part | [ideas/ai-plan.md](ideas/ai-plan.md) |
| 16 | Gamification — MVP package; Apples 🍎 currency + shop after MVP | ✅ | [ideas/gamification.md](ideas/gamification.md) |
| 17 | Progress system — MVP progress screen + "Things I can say" list locked; achievements decided after MVP | ✅ MVP part | [ideas/progress-system.md](ideas/progress-system.md) |
| 18 | Extra features — 11 MVP extras (reminder, slow audio, feedback, analytics, account, settings, dark mode, mic check, consent, survey, replay) + voice privacy promise | ✅ | [ideas/extra-features.md](ideas/extra-features.md) |

## D. Teaching content

| # | Item | Status |
|---|---|---|
| 19 | Full course map — 48 units, Level 0 (= MVP, 3 units) → B2 + goal tracks | ✅ [ideas/course-map.md](ideas/course-map.md) |
| 20 | Lesson "can-say" skills — MVP's 15 lessons locked; later units after MVP | ✅ MVP [ideas/mvp-lessons.md](ideas/mvp-lessons.md) |
| 21 | Placement test — after MVP (MVP: "I'm new" / "I know some") | ❌ |
| 22 | Mistake engine content — MVP: 9 Uzbek traps + 12 Tap the Mistake items; Russian later | ✅ MVP [ideas/mistake-engine.md](ideas/mistake-engine.md) |
| 23 | Scene scripts and template — after MVP | ❌ |
| 24 | How lessons mix exercises — lesson template, Checkpoint story chain, Lesson 6 model | ✅ [ideas/lesson-template.md](ideas/lesson-template.md) |
| 37 | Lesson scripts — all 15 lessons and 3 checkpoints item by item (222 items, 49 phrases), with a checker; the owner looked at the Uzbek lines 2026-10-14 ("looking alright") | ✅ `src/content/` · [ideas/lesson-template.md](ideas/lesson-template.md) |
| 38 | Lesson audio — every English line at normal and slow speed, with word times and mouth shapes; British and American voice sets both kept; each learner picks in Settings → Gapirish → Inglizcha ovozlar (owner, 2026-10-15) | ✅ `src/content/audio/` · [ideas/sound-plan.md](ideas/sound-plan.md) |

## E. Pages and design

| # | Item | Status |
|---|---|---|
| 25 | Every element — design system reviewed + cleaned 2026-10-10: one button set, one glyph set, Dombi + shared components (guide row, bottom sheet, streak week/dots, calendar day, iOS alert), 10 new tokens (Dombi, ice, gold-soft…), unique names, retired pieces in Archive, canvas reorganized (Library left, app flow right) | ✅ | `pendev/Akademiya English.pen` |
| 26 | Every page — 31 MVP pages and pop-ups, 3 tabs, account after Lesson 1 | ✅ [ideas/pages.md](ideas/pages.md) |
| 27 | Visual design / mockups — ALL 31 MVP screens locked 2026-10-10 (Path H, lesson loop, Checkpoint, Progress, Profile, Settings, onboarding + log in, pop-ups & states, fallback); pet = Dombi; **dark mode (Charcoal palette) for every screen and component, 2026-10-12**; **app icon (option A: Dombi peeking in on violet; light, dark and tinted) and launch screen, 2026-10-15** | ✅ | `pendev/Akademiya English.pen` |
| 28 | Characters — Dombi (13 faces, talking, touch, dark mode), the two waiters, and Aziz and Malika (2026-10-14) are drawn and animated; Dombi's default face is a centred smile since 2026-10-15 (the smirk stays on wink and proud); the town map is after the MVP | ✅ MVP part [ideas/companion-pet.md](ideas/companion-pet.md) |
| 39 | Lesson pictures — all 39 pictures of the 15 lessons, light and dark; waiting for the owner's check | 🟡 [ideas/pages.md](ideas/pages.md) |
| 40 | Motion, sound and taps — every component and screen moving in the browser lab (11 pages), the 20 chosen sounds + one family of small sounds, a tap in the hand for each, Dombi's voice (acted, line by line) | ✅ [ideas/motion-plan.md](ideas/motion-plan.md) · [ideas/sound-plan.md](ideas/sound-plan.md) |

## F. Technology

| # | Item | Status | File |
|---|---|---|---|
| 29 | Tech stack — main choices locked 2026-10-12: Expo (React Native), PocketBase, recordings on the server, sign-in with Google/Apple/phone; two test builds to prove before the phone app | ⏳ | [ideas/tech-stack.md](ideas/tech-stack.md) |
| 41 | Browser version of the app — the whole MVP running in a browser first, for testing (owner, 2026-10-14). 8 steps, all built 2026-10-14: onboarding and log in, the Learn page, all lessons and checkpoints, Progress, Profile, Settings, voice recordings, every pop-up and problem screen, picking up after a reload, at `/src/web/`; Uzbek and English lines approved; the owner played it end to end on 2026-10-15 with no problems | ✅ | [ideas/tech-stack.md](ideas/tech-stack.md) §0 |
| 42 | Phone app (Expo) — built by Codex on the Mac (owner, 2026-10-16): Mac setup steps and the Codex prompt written, app icon and launch screen images in `src/mobile/assets/`; the local servers on the PC (PocketBase for accounts, progress and recordings; Whisper for speech) set up and checked 2026-10-16; next the launch screen, test B, then the screens in the browser version's order | ⏳ | [ideas/tech-stack.md](ideas/tech-stack.md) |
| 30 | AI pieces — accent speech recognition, voices, scene AI, cost | ❌ | |
| 31 | Smart engine spec — FSRS, mistake tracking | ❌ | |

## G. Business and launch

| # | Item | Status | File |
|---|---|---|---|
| 34 | MVP scope — 3 units, 6 exercises, Level 0 → early 1, Uzbek only | ✅ | [ideas/product-definition.md](ideas/product-definition.md) |
| 32 | Pricing and plans — model locked (freemium + family, Payme/Click/Uzum); prices to test | ⏳ | [ideas/product-definition.md](ideas/product-definition.md) |
| 33 | Privacy and child safety (users 13+) | ❌ | |
| 35 | User testing plan — later; the MVP is internal, not tested with users yet | ❌ | |
