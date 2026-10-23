# Akademiya English redesign: design

Date: 2026-10-23. Status: approved by the owner in chat.

## Why

The owner put Akademiya English next to Akademiya Math (the same company's Flutter app) on the same phone. Math
feels like a real, finished product: many things to open and explore, every screen laid out with care. English
feels like a demo: one lesson path, a thin Progress page and a mostly empty Profile. The owner wants English to
feel just as complete and carefully made, **without copying Math**. "Fun" here means that: a full, polished,
real-feeling app, not game mechanics for their own sake.

The full side-by-side comparison (screens, animation clips, tables) is at
https://claude.ai/artifact/52VkvTsYffsxPogHNufvjx.

## Goals

1. Four tabs, each with real things to do: **Learn · Speak · Practice · Me**.
2. Seven new activities outside lessons (listed below), so a learner has reasons to open the app besides the next
   lesson.
3. **Dombi on every main screen**, adapting to how well the phone can animate him.
4. Every screen designed first in Pencil, chosen by the owner, then built.
5. All screens follow the shared Akademiya design system (`design/system/`).

## Non-goals (for this redesign)

- New lesson content. The course stays at 3 units, 15 lessons, 3 checkpoints, 49 phrases. Growing the content is
  the next project after this one.
- Accounts, payments, leagues, a shop or currency.
- Building the live AI conversation. It is **designed now** (see the Speak tab below) and built later, through the
  shared Akademiya server.
- Russian interface.
- The Bloub/Dombi "one family" mascot redesign. Dombi keeps his current look here; the family redesign is a
  separate project.

## Anti-goals (would count as failure even if it works)

- Looking like a reskin of Math: same tiles, same layout, same screens with violet instead of blue.
- Hearts or anything that blocks learning after mistakes. English's reward rules stay separate from Math's for now
  (owner decision 2026-10-23, may change later).
- Dombi that is cute, sad or guilt-tripping, or that makes a low-end phone stutter.
- Games whose verdict is unreliable (e.g. judging free speech with the phone's recogniser).
- Slogan copy. Text is short, literal, plain Uzbek.

## Constraints

- Phone app: Expo SDK 57 / React Native, `src/mobile`. Android is the test platform (owner's Redmi
  25028RN03A); iOS later. The browser version (`src/web`) is not part of this redesign.
- Interface language: Uzbek only. All new Uzbek text needs the owner's or a native speaker's check.
- Content available: 49 phrases (`src/content/phrases.json`), 3 units with lesson items and conversation lines
  (`src/content/unit-*.json`), 9 Uzbek-speaker traps (`src/content/traps.json`), 214 recorded clips per accent
  (UK/US) with slow versions and word timings (`src/content/audio/`), 331 pictures (`pendev/icons-r2`).
- Speech: Android's built-in recogniser (expo-speech-recognition). It is reliable only for short, known answers.
- Dombi is a Rive rig in `design/rive/out/waiters.riv` (artboards Dombi, Aziz, Malika, Waiter A, Waiter C) with a
  `Dombi` view model: 13 moods, 5 gestures, 12 mouth shapes, triggers for correct/wrong/celebrate. Shown in the
  app by `src/mobile/src/components/Actor.tsx`. Dombi's spoken voice exists only as 8 acted Uzbek onboarding lines.
- A frame meter already exists: `src/mobile/src/lib/useFrameMeter.ts` (built for "Test A").
- Design tool: Pencil (pencil.dev), file `pendev/Akademiya English.pen`, edited through the Pencil MCP. Save safety
  rules apply (a design was lost once): save and check the file size after changes; never delete component
  children.
- Shared design system: `design/system/tokens.json` and `README.md` (type scale, colours, springs, answer panel,
  icon rule). English reads it via `src/mobile/src/components/system.ts`.
- Work lands as many small commits on the English repo, never one large commit.

## Decisions made by the owner

### Tabs (four)

| Tab | Contains |
|---|---|
| **Learn** | Next-lesson hero card (built 2026-10-23), the lesson path, unit checkpoints. |
| **Speak** | Live voice conversation with Dombi, like ChatGPT's voice mode (owner, 2026-10-23, as planned in `docs/blueprint/chapters-ai.js` and `companion-pet.md`): free conversation on any topic, guided conversation, and role-play situations (café, street, shop; the scripted "Talk to a character" is the offline first version of role-play). Which one did you hear? stays as a smaller entry. |
| **Practice** | Daily challenge; Match rush; Catch the sentence; Overheard; Fix it. |
| **Me** | Today's Progress and Profile merged: streak and week, things I can say, achievements, recordings, settings. |

(The four-tab set and the merged Me tab were proposed by Claude; the owner accepted them.)

### The seven activities (Karaoke was proposed and removed by the owner)

1. **Talk to a character** (Speak). A short scripted conversation in a real place: café (waiter), shop (seller),
   street (Aziz, Malika). The character says a line; the learner answers aloud with one of the phrases they have
   learned; the character reacts and the conversation moves on. Answers are checked like lesson `say` items (known
   accepted answers). Tiles are the fallback when speaking is off or fails.
2. **Which one did you hear?** (Speak). Pairs of sounds that are hard for Uzbek speakers (v/w, ship/sheep,
   fifteen/fifty, th/t). Hear one, tap which; then optionally say both.
3. **Daily challenge** (Practice). Three mixed tasks, about 2 minutes, a new set each day, drawn from what the
   learner has already learned.
4. **Match rush** (Practice). Match English and Uzbek (or picture) pairs against the clock.
5. **Catch the sentence** (Practice). Hear a sentence, tap its words in order (the existing tile mechanics).
6. **Overheard** (Practice). Replay the lesson conversations (the existing `heard` exercise) with their question.
7. **Fix it** (Practice). Correct a typical Uzbek-speaker mistake, built on the 9 traps.

Deferred, with reasons: Describe it and Tongue twisters (the recogniser can't judge them fairly), Mini stories,
Word rain, Memory flip, Spell it (need new content), The Scene (its own project).

### Dombi everywhere

- Dombi appears on every main screen (Learn, Speak, Practice, Me), in lessons, in result moments, and on empty and
  error screens.
- **In lessons he helps (owner, 2026-10-23):** he is the one who offers help when the learner is stuck, for example
  a hint, a slower replay, or a short Uzbek explanation after a miss, building on the existing "Help ladder"
  component in the design file. Designed in the lesson-screens plan, after the tabs.
- He speaks in short Uzbek text bubbles when guiding (welcome back, a tip, "this one is new") and reacts with face
  and gestures, without words, to answers and celebrations (owner confirmed). He is sleepy late at night and glad
  when the learner returns after a break. He never guilt-trips. Every main screen design leaves room for a bubble;
  the bubble lines are a set of Uzbek copy that a native speaker checks.

### What keeps the streak

- Finishing a lesson or the day's **Daily challenge** keeps the streak alive. Other activities are extra practice and
  do not count toward the streak (owner decision). The streak logic in `core/progress.js` and the Me tab must reflect
  this.

### Dombi adapts to the phone

- During onboarding, the app measures in the background how smoothly the phone draws Dombi, and places the phone
  in one of three levels:
  - **Full:** animated Dombi everywhere (idle, blinks, lip-sync, reactions).
  - **Light:** animated only at key moments (onboarding, answers, celebrations); still images of his poses
    elsewhere.
  - **Still:** still images only, a different face per mood; no animation cost.
- The level is saved on the phone.
- Claude's additions: the app re-checks and steps down a level if the phone struggles later; a setting lets the
  learner turn animation down by hand; the phone's Reduce Motion setting always means Still.

### Design first, then build

- Every screen is designed in Pencil before any code. For each important screen Claude draws 2–3 clearly different
  versions side by side; the owner picks or mixes; Claude refines.
- Order: the four tabs first; then the activity screens; then Dombi's states and the three device levels; then
  every remaining state (first time, empty, loading, offline, error, dark mode).
- Before showing a screen, Claude checks it against: one clear main action, a large title, at most one coloured
  hero card, Dombi present, no text under 12, body text 16, dark mode works, fits a 360-wide phone.
- Claude studies well-made apps for patterns (practice hubs, games, profiles), never copying screens. Math is a
  quality bar, not a template.
- For key screens, an optional clickable preview on the owner's phone before the real build.
- After approval, building happens screen by screen with checks on the phone, as done on 2026-10-23.

## Calls made by Claude after the builder review

These were settled without the owner; the owner can overturn any of them.

- **Which one did you hear? needs a small word list.** None of the sound pairs exist in the current audio. A list of
  about 20 pairs (v/w, ship/sheep, th/t, fifteen/fifty and similar) is written for it and voiced with the same
  neural voices as the lesson clips. The owner checks the list. This small list is allowed despite the "no new
  content" non-goal, because the approved activity can't work without it.
- **"Say both" is not judged.** The learner records both words and hears them next to the native voice. No right or
  wrong verdict, because the recogniser can't reliably tell such pairs apart.
- **Talk to a character starts from existing lines.** The first conversations reuse each unit's recorded
  conversation lines, with the learner taking one side and answering with learned phrases. New lines are written
  only where a conversation needs a joining line, kept to a few per place, voiced the same way, and checked by the
  owner.
- **The seller is a still picture** for now (there is no seller artboard in the Rive rig). Characters on this screen
  appear as pictures or their existing artboards; Dombi sits small on the screen as the guide.
- **When Speak and Practice open.** Both tabs are visible from the start. Each activity works with the units the
  learner has started. Before the first lesson they show a designed empty state with Dombi pointing to lesson 1.
- **Achievements in Me** are the existing personal records and awards (`components/ProfileDetails.tsx`). No new
  achievement list and no currency in this redesign.

## Left to the builder

- How activities store progress (extend the existing event list in `lib/storage.ts`, following its pattern).
- How the Daily challenge picks tasks, and how often a sound pair or match set repeats.
- The exact frame-rate thresholds for the three Dombi levels, and how long the onboarding measurement runs, as long
  as it is invisible to the learner and adds no waiting.
- The still images of Dombi's poses (exported from the Rive rig or drawn in Pencil).
- Where Dombi sits on each screen, within the chosen designs.
- Which existing routes (`/phrases`, `/calendar`, `/recordings`, `/settings`, `/account`) become sections of Me and
  which stay separate screens reached from it.
- New audio for Talk to a character lines that don't exist yet: generate with the same neural voices and pipeline
  as the current lesson clips.
