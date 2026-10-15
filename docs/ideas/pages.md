# LOCKED — MVP Pages (English app)

**Status:** Locked · **Date locked:** 2026-10-09 · **Roadmap item:** #26
**Design tool:** Figma (Claude builds the design system and screens in the owner's Figma)
**Related:** [product-definition.md](product-definition.md) · [lesson-template.md](lesson-template.md) ·
[progress-system.md](progress-system.md) · [extra-features.md](extra-features.md)

## Decisions

| Question | Decision |
|---|---|
| Navigation | 3 tabs: 🏠 Learn · 📈 Progress · 👤 Profile |
| Account | Created **after Lesson 1** (try first, then save progress) |
| "I know some English" in the MVP | Starts at **Unit 1** like everyone (placement test comes after the MVP) |
| Tapping a lesson | Opens a **lesson start sheet** with the skill goal + Start |

## Flow

```
FIRST OPEN
Welcome → Goal → "I'm new / I know some" → Prediction → Confidence survey
→ Mic explainer → Mic check → Voice consent → Reminder → Lesson 1 → Create account
MAIN APP — 🏠 Learn · 📈 Progress · 👤 Profile
Path → Lesson start sheet → Lesson → Mistakes round → Finish screens
     → Checkpoint → Trophy + reaction → (Level up 🎉)
```

## Pages

**A. Onboarding** — 1 Welcome · 2 Goal (School · IELTS · Travel · Work · Just for me) · 3 Your level
("I'm new" / "I know some") · 4 Prediction · 5 Confidence survey (1–5) · 6 Mic explainer → phone prompt ·
7 Mic check ("Say Hello") · 8 Voice consent ("Only you can listen to your recordings") · 9 Reminder time →
notification prompt · 10 Create account (after Lesson 1; sign-in method in #29).

> **Onboarding locked (2026-10-10):** 1 Welcome (Dombi waving, "Akademiya English", BOSHLASH / KIRISH)
> → **1b Meet Dombi** ("Salom! Men Dombiman.", Duolingo's "Hi there! I'm Duo!" screen) → 2 Goal → 3 Your level →
> **4 What you'll achieve** (Duolingo-style: "30 kunda mana shularga erishasiz!" + 3 outcomes: order at a café,
> 40+ phrases out loud, a daily habit) → 5 Confidence survey → **6 Mic explainer** (Dombi with a small mic badge: "Mikrofonni yoqamiz" — "Mashqlarda ovoz chiqarib gapirasiz. Javobingizni eshitishim uchun mikrofon kerak.", why the mic is
> needed, then MIKROFONNI YOQISH → the phone's permission prompt; "Hozir emas" = lessons work without speaking). Dombi is the guide on every
> step. Then **7 Mic check** (no card — Dombi himself listens, sound bars under him; button off until heard) →
> **7b heard you** (Dombi celebrates, green "Hello!" chip) → **8 Voice consent** (Dombi's 3 promises: only you hear it,
> delete any time, hear your progress; two equal buttons, no dark pattern) → **9 Reminder time** (time wheel, 19:00)
> → Lesson 1 → **10 Create account, name first** ("Sizni nima deb chaqiray?" then Google / Apple / phone; Dombi uses
> the name afterwards). **Whole onboarding (1–10) locked 2026-10-10.** Not picked: 1B, 1C, 3½ loader, 4A, 4C, 7A Mic card,
> 7C-as-own-page, 8A, 8C, 9B, 9C, 10A, 10B. Also locked: **1L Log in** + **1L·b Account not found** (KIRISH
> with no account → "start fresh", the chosen sign-in is reused on page 10).

**B. 🏠 Learn** — 11 Path: 🔥 streak, 💬 "things you can say", unit banners, lesson circles (done / current /
locked), Checkpoint per unit, replay finished lessons, "Speaking is off · Turn on" pill · 12 Lesson start sheet.

> **Path design locked 2026-10-10 — "Path H"** (Pencil: `pendev/Akademiya English.pen`, storyboard → Path variations).
> Duolingo's winding-path layout, measured 1:1 (ovals 71×66 = 57px face + 9px edge; 4-segment ring 96px around the
> current lesson), in Akademiya style: violet unit banner with phrase-list book, coral current oval, Duolingo greys
> for locked ovals (#E5E5E5 face / #B7B7B7 edge / #6E6E82 icons — darker than Duolingo's #AFAFAF so they read clearly), lesson-type icons (🎙 speaking, ★ lesson,
> 🎧 listening, 💬 conversation), unit trophy = Checkpoint, unit art beside the path, 3 icon-only tabs.
> Stats row: level · 🔥 streak · 💬 phrases (🍎 Apples after MVP). Icons come from Rive (file "test", artboards `icon/*`).
> **After MVP:** the unit-art spot becomes the **companion pet**; ideas H2 (progress ring + talking character +
> "Yana ayting" + next-unit preview), H3 (café world background) and H4 (unit-colour locked ovals) are parked there.
>
> **Lesson-loop design choices (2026-10-10):** start = bottom sheet (A) · speaking exercises = tutor face — a
> character asks you directly, mic below (C, Speak-style) · combo moment "3 ta ketma-ket! 🔥" after 3/5/10 correct
> (1.5 s, Rive) · lesson result = Dombi cheering with confetti, three stat tiles that count up, then the phrases,
> each with ▶ (redesigned 2026-10-13 to fit the lesson-done sound; it replaced "phrases first, stats small"). Greys = Duolingo neutral
> #E5E5E5 / #B7B7B7 across the whole design system.

**C. Lesson** — 13 Lesson screen (✕, progress bar, combo, exercise, Check/Continue, "Can't speak now",
🐢 slow audio) · 14 Feedback panel (Correct / correct answer + 💡 Uzbek explanation) · 15 Quit lesson? ·
16 Mistakes round · 17 New thing you can SAY 🎉 · 18 Lesson result (Dombi + confetti, accuracy / time spoken / phrases tiles, the phrases, gold MUKAMMAL! badge on a perfect lesson) ·
19 Streak update (first lesson of the day).

> **Lesson-loop screens locked (2026-10-10):** 13 E1 Meet It · E4 Tile Builder · E9 Echo Line as drafted; 15 Quit =
> Dombi (calm, no sad face, no guilt); 16 Mistakes round = Dombi thinking above "Xatolar ustida ishlaymiz"; 17 New thing
> you can SAY = Dombi celebrating above the phrase card; 19 Streak update = Sunday-first week, frozen day = Rive
> frozen-streak with ice tick, plain line "Ertaga yana bitta dars — seriya 7 kun bo'ladi." Copy rule: plain everyday
> Uzbek (no Russian borrowings like "plitka" — say "so'zlarni tanlab javob berasiz").

**D. Checkpoint & level-up** — 20 Checkpoint start · 21 Checkpoint player · 22 Checkpoint result
(trophy + 🙂/😄/🤩) · 23 Level up 🎉.

> **Checkpoint design choices (2026-10-10):** start = gold bottom sheet with the 5 story steps in a row (20A) ·
> player = same green progress bar as lessons + small step chip "3/5 · Narxini so'rang" (21B) · result = trophy
> shelf — the new trophy lands next to earlier ones, waiter's reaction as a badge on it (22B) · level up = big
> level number + "what you can do now" list (23A). The reaction is **set by mistakes** (0–1 🤩 · 2–4 😄 · 5+ 🙂),
> never chosen by the learner and never a sad face.
> Icon contrast rule: no yellow/gold icon on a gold fill (use white + gold ring); grey glyphs = #6E6E82.

**E. 📈 Progress** — 24 Progress (level, prediction, streak + freeze, things you can say, stats: lessons,
phrases, minutes spoken, days active, unit trophies) · 25 Things I can say (▶ native, ▶ your voice if
recorded, practise again) · 26 Streak calendar.

> **Progress design locked (2026-10-10):** 24 = **B "Can say" first** — violet hero with the big count + newest 3
> phrases with ▶, "see all", streak card (🔥 count + Sunday-first mini week, frozen day = Rive `frozen-streak`
> with an ice tick) → tap opens 26, level strip, stats (minutes spoken · lessons · days active).
> 25 = phrases grouped by unit, ▶ native, coral "Mening ovozim" chip only where recorded, mic = practise again.
> 26 = full-screen **streak calendar** (Duolingo-style, Sunday first): orange practised days joined by a thin
> band, ice-blue frozen days inside the band, red-orange today, plain grey other days; stats "days practised /
> freezes used"; "Seriya maqsadi" 7-day goal bar; freeze explainer. No Friends tab / share / Streak Society in MVP.
> Icons on a violet fill use the inverted "on violet" version (white bubble, violet dots).

**F. 👤 Profile** — 27 Profile (name, goal, joined, level) · 28 Settings (sound, reminder time, dark mode,
speaking on/off, voice recordings: permission + delete all, privacy info, delete account, log out).

> **Settings design locked (2026-10-10):** 28 = grouped list — *Umumiy* (sound effects, dark mode, reminder 19:00,
> goal) · *Gapirish* (speaking on/off + "turn off where you can't use the mic", Voice recordings ›) · *Hisob*
> (privacy, log out, delete account in red, last). 28b Voice recordings = "only you can hear them" note, "save my
> voice" toggle, saved clips (▶ + delete each), red "delete all recordings" button. Glyphs: gear = Settings,
> moon = dark mode, logout = log out (drawn 2026-10-10, approved). **27 Profile LOCKED 2026-10-10 (designed by the owner):** banner (white round ••• + gear buttons), avatar, name, level,
> bio, goal card, friends count + add-friend button (friends + requests only — no followers), pet-outfit promo, overview
> (streak · phrases · league · Apples), friend streaks, personal records (scroll), awards grid, tiny version line.
> 27b other person's profile: back + ••• (report/block), read-only goal, no promo / friend streaks / version / NEW tags.
> 27c friend button states: Add → Request sent (grey) · Accept (violet, they asked first) · Friends (green).

**G. Pop-ups & states** — 29 Feedback form · 30 Confidence survey again (~2 weeks) · 31 Problem states
(no internet, mic blocked, speech recognition unavailable, error).

> **Pop-ups & states locked (2026-10-10):** 29 tester feedback sheet over the current screen (Dombi, 4 problem
> chips, text, screenshot on, YUBORISH) + 29b thank-you toast · 30 confidence again after ~2 weeks (same 5 faces,
> small "1-kuni" tag on the day-1 answer) + 30b result only if it went up (2 → 4, never a sad screen) · 31a no internet
> (auto-retry) · 31b mic blocked (3 numbered steps → Settings, or continue without speaking) · 31c speech recognition
> unavailable (answer by choosing words instead) · 31e general error ("Bu sizning aybingiz emas", retry / report).
**31d Fallback page** (LOCKED 2026-10-10): any button for a feature that isn't built yet opens "Bu bo'lim hali
yaratilmoqda" (sprout art, back to lessons, give feedback); any wrong or old link opens the same template as "Bu sahifa
topilmadi" (back to home, report the problem). Profile social = **friends + friend requests only** (no followers or
following).

**Not in the MVP:** shop, pet, achievements, scenes, leaderboards, voice comparison screen, weekly summary,
paywall, placement test.

**Wording changed 2026-10-14 (storyboards, light and dark):** Dombi's four reworded lines are now in the locked screens
1b, 4, 5 and 9 ("Salom! Men Dombiman." · "30 kunda mana shularga erishasiz!" · "Ingliz tilida gapirganda o'zingizga
qanchalik ishonasiz?" · "Har kuni soat nechada eslatay? Kuniga bir martagina eslataman."), and page 30 asks the same
question the same way ("2 hafta o'tdi! Endi gapirganda o'zingizga qanchalik ishonasiz?"). Why each changed:
sound-plan.md §6. Left as it was: the small line "Kuniga 10 daqiqa, mehribon eslatmalar" on screen 4.

## Dark mode (LOCKED 2026-10-12)

**Palette: C · Charcoal** (picked by the owner from three options: Violet night, Slate, Charcoal).

| Token | Light | Dark |
|---|---|---|
| `bg` (screen) | #FFFFFF | #121214 |
| `card` (cards, sheets, tiles) | #FFFFFF | #1B1B1F |
| `surface` | #F6F6FA | #242429 |
| `grey` (borders, locked faces) | #E5E5E5 | #34343B |
| `grey-edge` (3D edge) | #B7B7B7 | #26262B |
| `text` | #2B2B3C | #F4F4F6 |
| `text-muted` | #8A8AA0 | #9C9CA6 |
| `violet-soft` | #EFEBFF | #26214A |
| `green-soft` / `red-soft` / `gold-soft` | #E3F9EA / #FFE8EA / #FFF4D1 | #17352A / #3A1D22 / #383014 |
| `dombi-body` / `-edge` / `-hand` | #2B2B3C / #17171F / #45455A | #5A5A7A / #3A3A54 / #8686A8 (same as Rive `dark`) |

- The brand colours (violet, coral, gold, green, red, orange) are the same in both modes.
- The file has one theme switch, `mode` = `light` or `dark`. Every screen colour is a variable (68 in
  total), so a frame with `theme: {mode: "dark"}` turns dark with no other change. The full list of
  values is in the Pencil file's variables.
- Dark glyph icons swap to their white versions through the `on-light` / `on-dark` switches.
- **Where it is in the file:** dark copies of every storyboard, both profile pages, the Learn timeline
  and both component sheets, to the right of the light ones (same height on the canvas, 13,000 px to
  the right). Their names end in "· Dark".
- **Checked:** the light design is pixel-identical to before the work (18 frames compared). All 83 dark
  screens, the 2 profile pages and both component sheets were looked at one by one.
- **Quit-lesson sheet (2026-10-12):** the face on "Darsni tark etasizmi?" is now the `Dombi / 80 / default`
  component, in the sheet component itself, so it is right in both modes. The old emoji icon is hidden
  inside the component, not deleted.
- **Profile variation 27 · A removed (2026-10-12):** the locked Profile is the owner's own design, so the
  "Duolingo-style profile" variation was deleted from the light and dark storyboards. B and C remain.
- **Left as it is:** "Path G — Duolingo exact copy" is a reference screen.

**Token added 2026-10-13:** `red-deep` (#C02A3D) is the edge of the danger button (O'CHIRISH). The owner found the old edge
(`red-edge`, #D63445) too close to the button's red. `red-edge` stays for red text and the wrong-answer tiles.

## Exercise states — MVP (designed 2026-10-12, waiting for the owner's check)

Storyboard **"Exercises — every state (MVP)"** in the Pencil file, below the light storyboards, with a dark
copy at the same height on the dark side. 26 new screens. Start states of E1, E4 and E9 stay as pages 13a–13c.

| Exercise | New screens |
|---|---|
| E1 Meet It | Listening · Text shown · Correct (the English text appears) · Can't speak now → word tiles |
| E2 Say What You See | Start · Listening · Correct · Not right → correct answer · Can't speak now → word tiles |
| E4 Tile Builder | Start (nothing placed) · Correct + optional read-aloud |
| E6 What Happened? | Listening · Picture picked · Correct (conversation text appears) · Not right → correct answer |
| E9 Echo Line | Start · Listening · Correct · Speaking off (Echo is skipped, toast + "Gapirish o'chiq" pill) |
| E13 Tap the Mistake | Start · Word picked · Correct · Not right → correct answer |
| E13 Tap the gap | Start · Gap picked · Correct |

Decisions made while drawing (all from the locked exercise rules):
- **E6 and E13 are pick-then-check** (owner's choice, 2026-10-12): a tap picks the answer in violet and can be
  changed; TEKSHIRISH is grey until something is picked, then checks it. Exercise rule 6 was changed to match.
- **A mistake never says "wrong".** It shows the "To'g'ri javob" sheet with the Uzbek line; in E13 the
  picked word turns red and the real mistake green.
- **Speaking off:** E1 and E2 switch to word tiles; the "HOZIR GAPIRA OLMAYMAN" link under the button
  becomes the "Gapirish o'chiq · YOQISH" pill.
- Sample content comes from the locked lessons: trap T2 (*A orange juice* → *An*) and T7 (*How much this?*
  → *is*), and the Lesson 6 café dialogue.

### Lesson pictures (started 2026-10-12, waiting for the owner's check)

The pictures in E1, E2 and E6 were emoji placeholders. Real pictures are drawn in the same style as the
illustrated icons, by `design/icons/build_lesson_pics.py` (SVG in `design/icons/lesson/`, PNG in
`pendev/icons-r2/lesson-*.png`), and sit on the Icons board as "Lesson picture / ..." components.

- **Drawn:** tea, orange juice, water, sandwich, samsa, salad. Coffee reuses the existing coffee icon.
- **Used in:** the E2 and E6 screens of the exercise storyboard, light and dark.
- **All 39 pictures of the 15 lessons are drawn (2026-10-14):** 33 were added. Unit 1: hello, morning, aziz, malika,
  name-ask, uzbekistan, tashkent, where, how, fine, and-you, handshake, goodbye, see-you. Unit 2: price-ask, sugar,
  no-sugar, no-thanks, here-you-are, thanks. Unit 3: water-ask, yes, no, this, that, this-one, tshirt-red, tshirt-blue,
  colour-like, sizes, too-big, tshirt-small, bag. Two people come back in them: Aziz (violet top) and Malika (coral top).
  - Built by `python build_lesson_pics.py` then `node lesson_png.js` in `design/icons/` (parts in `lesson_pic_parts.py`,
    `lesson_pics_people.py`, `lesson_pics_things.py`). All of them on a light and a dark tile: `design/icons/lesson-sheet.png`.
  - In Pencil: components "Lesson picture / ..." in three new rows on the Icons board.
  - Numbers and prices are not pictures: the lesson shows them as large text ("1 2 3 4 5", "10 000 so'm").
  - The weaker ones, to look at first: handshake (can read as a fist clasp), sugar and no-sugar (cubes could be dice),
    no-thanks (close to the waving-hand icon), too-big (reads as a coat as much as a T-shirt), sizes (small in the tile).
- **Aziz and Malika are animated (2026-10-14).** The owner saw the lessons page and said "nobody's mouth is moving".
  Two things were behind it. The page never told the waiter and the seller to talk (a mistake in the page, fixed), and
  Aziz and Malika, who say 84 of the 107 lines, were still pictures. They are now Rive characters on the waiters' rig:
  artboards `Aziz` and `Malika` (192x192), state machine `Waiter`, the same controls (`talking`, `viseme`, `correct`,
  `wrong`, `dark`). Drawn like their lesson pictures (his violet top and short dark hair, her coral top, bun and
  earrings), with white eyes and pupils. Built by `node waiter_rig.js rig z|m`, `waiter_idle.js`, `waiter_act.js` in
  `design/rive/`; runtime file `design/rive/out/waiters.riv`; the file before this is in
  `design/rive-backups/2026-10-14-before-aziz-malika/`. Checked in the real player: rest, mouth shapes, both reactions,
  dark, and all four speakers photographed while a line plays. Not in a Pencil screen yet.
- The picture tile components on the MVP components sheet keep their emoji default until the pictures
  are approved.
- **Café waiters (2026-10-12).** The cook emoji is replaced by a drawn, animated character. The owner
  kept two: **Waiter A** (young man, vest and bow tie) and **Waiter C** (man with a moustache and a
  do'ppi). Waiter B (a woman) was removed at the owner's request.
  - Rive file "test", artboards `Waiter A` and `Waiter C` (192x192), state machine `Waiter`, shared
    view model `Waiter`. Runtime file: `design/rive/out/waiters.riv`. Test page: `design/rive/waiters.html`.
  - Built by `design/rive/waiter_rig.js` (parts), `waiter_idle.js` (breathing, blinks) and `waiter_act.js`
    (talking, reactions, dark colours, controls). All checked frame by frame in the runtime.
  - Controls for the app: `talking` (true/false) + `viseme` (0-11, same numbers as Dombi's mouth shapes),
    `correct` and `wrong` (triggers), `dark` (true/false).
  - Pencil components `Waiter / A` and `Waiter / C` on the Icons board (light and dark picture each).
    **Waiter A is in every MVP screen** that had the emoji: Echo Line, feedback 14a, Checkpoint start and
    player, the Path H variations, in light and dark. Waiter C is not placed anywhere yet.
  - Board **"Waiters in the screens"** (below the exercise storyboard, dark copy on the dark side): each
    waiter in four poses (idle, talking, right answer, mistake) and in three screens (Echo Line, feedback,
    Checkpoint player). Pose components `Waiter / A|C / talk|grin|hm`; pictures made by
    `design/rive/capture_waiter_png.js` from the runtime.
  - Still emoji: the waiter inside the after-MVP components (Scene dialogue, Character reaction).
- The lesson pictures are not imported into the Rive file yet (the icons' master copy).
- Waiter C is now the seller of Unit 3 in the lesson files (voice "seller"); he is not placed in a Pencil screen yet.

Not drawn yet: full screens for the 10 after-MVP exercises (their bodies are in "After-MVP components").
