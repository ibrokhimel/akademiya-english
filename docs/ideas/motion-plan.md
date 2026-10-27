# DRAFT — Motion & Particle Plan (whole app)

**Status:** Approved to build 2026-10-11 ("let's do these for now" — the owner will flag gaps later) · **Date:** 2026-10-11 · **Roadmap:** #28 (characters / animation)
**Related:** [pages.md](pages.md) · [companion-pet.md](companion-pet.md) · [gamification.md](gamification.md)
**Research behind it:** skill `rive-animation` (craft, Duolingo case studies, particles & juice, Rive)

Nothing here is built yet except Dombi's own engine. This plans **every** moving thing first, so we build one
kit and reuse it, instead of inventing an effect per screen.

## 1. Rules for the whole app

| Rule | Why |
|---|---|
| **5 tiers.** T0 touch (80–150 ms, no particles) · T1 small win (≤0.6 s, 6–20 local pieces) · T2 medium (1.5–2.5 s, 40–60) · T3 big (2.5–3.5 s, 80–120) · T4 rare (3–5 s, custom, skippable) | The big moments only feel big if the small ones stay small |
| **Confetti starts at T2.** A correct answer never gets confetti | Duolingo does the same; seen 50× a day it would go stale |
| **Wrong answers: no particles, no screen shake, no sad Dombi.** Only the answer shakes | A mistake is information, not a punishment |
| **Colour means something:** green = correct · gold = reward / XP · orange = streak · ice blue = freeze · violet = level / brand · coral = speaking / mic | The eye learns the code |
| **Flat pieces only:** dots, pills, rounded squares/diamonds, twinkles (two crossed pills), rings. 2–3 colours + white | Matches the art style; no gradients |
| **Particles point at meaning:** burst out from the cause, then end on the number that changed | The reward is the number, not the fireworks |
| **Never block a button.** Everything can be tapped through or skipped after 0.6 s | Speed matters more than show |
| **One sound + one haptic per beat**, same tempo as the motion; every beat must still read with sound off | Apple's rule; many learners keep sound off |
| **3–4 random versions** of each repeating effect; rare bigger version ~1 in 20 | Stops it going stale |
| **Reduce Motion:** drop moving particles, scale pops and shakes; keep colour, fades, counters, haptics, sound | Accessibility |
| **Budget:** ≤40 pieces alive for small effects, ≤120–150 for big; one burst + one ambient effect at a time | Cheap phones |

## 2. The effect kit (build once, reuse everywhere)

| # | Effect | What it looks like | Tier | Used for |
|---|---|---|---|---|
| F1 | **Pop** | ring expands + 8 pieces + 4 white sparks shoot out ~60 pt, 0.5 s | T1 | correct answer, combo, small wins, toggles that matter |
| F2 | **Twinkle** | 3–6 small twinkles appear and vanish around an object, slow | ambient | perfect badge, trophy, new phrase, gold things |
| F3 | **Shine sweep** | a soft bright band slides across a surface once (~0.6 s) | T0 | main button when it becomes ready; progress bar; unlocked node; premium |
| F4 | **Confetti** | medium (2 corner cannons, ~50) · large (3 waves, ~110) | T2 / T3 | lesson complete · perfect lesson, checkpoint |
| F5 | **Fountain** | gold cone shooting up from one point (~90) | T3 | level up |
| F6 | **Embers** | 12–16 orange/gold bits rising and fading | T2 | streak +1, flame |
| F7 | **Frost** | ice shards burst + a few snowflakes drift down | T2 calm | streak freeze used / earned |
| F8 | **Fly-to-counter** | 5–8 gold bits arc from the reward to the counter; counter bumps on each arrival | T2 | XP, phrases count, Apples (later) |
| F9 | **Dust puff** | 5–6 grey-violet puffs out sideways, 0.3 s | T1 | something heavy landing: trophy, badge, Dombi |
| F10 | **Double ring** | two rings, one after the other | T2–T3 | trophy, level badge, milestone |
| F11 | **Voice rings** | coral rings pulsing out of the mic with the learner's voice level | live | mic listening |
| F12 | **Draw-on** | a line draws itself (check mark, underline, path line) | T0–T1 | correct check, path filling to the next lesson, strike-through fix |
| F13 | **Count-up** | number rolls up fast then slows; small bump on the last tick | T1–T2 | XP, accuracy, phrases, streak, level |
| F14 | **Shake** | only that element, sideways, 3 fading swings, 0.35 s | T0 | wrong tile, wrong word, blocked action |
| F15 | **Glow pulse** | soft halo breathing behind an object | ambient | current lesson node, mic when ready, "your turn" |
| F16 | **Speech waves** | 3 small bars or arcs moving next to a speaker | live | audio playing, character speaking |
| F17 | **Bubble pop** | a speech bubble pops in with overshoot, tail last | T1 | new phrase, Dombi's lines, tips |
| F18 | **Sparkle trail** | a few twinkles left behind a moving thing | T2 | trophy flying to the shelf, XP flying |

## 3. Every component (the small stuff, "the button shines")

| Component | Idle / ready | Press / use | Result |
|---|---|---|---|
| **Main button** (Check / Continue) | F3 shine once when it turns from disabled to ready; then again every ~5 s if untouched | face drops 4 px onto its edge (50–80 ms), springs back | colour swaps to green/coral with the feedback panel |
| Secondary / small buttons | — | same press, no shine | — |
| Disabled button | flat, no motion | tiny F14 shake if tapped ("not yet") | — |
| **Answer / picture / word tile** | — | press down; selected = lifts 2 px + violet edge | correct: green + scale punch 1.08 + F1 pop · wrong: coral + F14 shake |
| **Word tile (Tile Builder)** | — | tile flies to the answer line on an arc, the others slide to close the gap | whole line turns green left→right in a wave |
| **Gap slot** | F15 soft pulse while empty | tile lands with a small squash | — |
| **Progress bar** | — | fill grows with overshoot + F3 sheen | combo: bar turns gold, small flame at its head; 100 %: flash + F1 |
| **Combo chip** ("3 ta ketma-ket!") | — | pops in above the bar (F17), holds 1 s, slides away | x5 / x10 bigger, F1 gold |
| **Mic button** | F15 pulse when it's your turn | press → turns coral, F11 voice rings follow the voice | heard: ring closes into a check (F12) · not heard: rings fade, gentle nudge |
| **Audio button / slow 🐢** | — | press; F16 waves while playing | — |
| **Lesson node (path)** | current: F15 glow + the 4-part ring slowly turning; a "START" bubble bobbing | press: 3D drop | done: fills gold with F1 + F12 line drawing to the next node; next node unlocks with a bounce + F3 |
| **Checkpoint trophy node** | locked: grey, still · ready: F2 twinkles | press | won: F10 + F2 |
| **Unit banner** | — | — | unit done: F3 across it |
| **Stat pills** (level · streak · phrases) | — | tap → small bounce | number changes: F13 + bump; streak pill: flame flickers |
| **Tabs** | — | icon does a tiny hop + fills | — |
| **Toggle** | — | knob slides with a squash, colour fills | — |
| **Bottom sheet / dialog** | — | slides up with a soft overshoot, backdrop fades | slides down faster than it came |
| **Toast** | — | drops in, holds, lifts away | — |
| **Text field** | caret | focus: edge turns violet | correct green / wrong coral + F14 |
| **Phrase card** (things I can say) | — | ▶ press: F16 waves | new: F17 + F2 |
| **Streak dots / calendar days** | today's dot: F15 | — | today fills orange with F6; frozen day: F7 |
| **Loading** | skeleton shimmer (F3 looping, slow) | — | content fades up in a short stagger |
| **Dombi** | breathing, blinks, glances, idle breaks | tap: squash-pop | see §5 |

## 4. Every screen and moment

### Onboarding (1–10)
| Screen | Motion |
|---|---|
| 1 Welcome | Dombi **enters** (pop up), waves; title fades up; BOSHLASH button F3 shine |
| 1b Meet Dombi | F17 speech bubble; Dombi talks (mouth) |
| 2 Goal · 3 Level | options stagger in (40 ms apart); chosen one punches + F1 small; others dim |
| 4 What you'll achieve | the 3 outcomes drop in one by one with F17, each with a small icon bounce |
| 5 Confidence | faces: chosen one bounces, Dombi mirrors the mood (smirk → happy) |
| 6 Mic explainer | mic badge on Dombi pulses (F15); after permission: F1 coral |
| 7 Mic check | Dombi **listening** (leans in), F11 rings under him follow the voice; 7b heard: Dombi celebrate + "Hello!" chip F17 + F1 green |
| 8 Voice consent | 3 promises tick in with F12 checks |
| 9 Reminder | time wheel with a soft snap + tick haptic per step; bell icon rings once on confirm |
| 10 Create account | name typed → Dombi says it (talks) + happy; sign-in success: F1 |
| Step bar (top) | segment fills with F3 on each step |

### Learn (11–12)
| Moment | Motion |
|---|---|
| Open the path | scrolls to the current node; node glow (F15); Dombi beside the path idles and **looks at** the current node |
| Come back after a lesson | finished node fills gold (F1) → F12 line draws down the path → next node unlocks (bounce + F3) → Dombi points at it |
| Lesson start sheet | sheet up; skill goal types in; Start button F3 |
| Streak pill, first open today (not done yet) | flame grey and still; after the lesson it lights (see 19) |

### Lesson (13–19)
| Moment | Tier | Motion |
|---|---|---|
| New exercise | T0 | old one slides out left, new one in from the right (250 ms); task text first, options stagger |
| Meet It (new phrase) | T1 | picture pops; phrase appears word by word in time with the audio; F16 waves |
| Correct answer | T1 | tile green + punch · F1 pop (green) at the answer · feedback panel slides up · progress bar grows + F3 · Dombi `correct` · chime + light tap |
| Combo 3 | T1+ | as correct + combo chip, F1 gold near the bar |
| Combo 5 | T2− | chip "5" + bar turns gold + ~20 sparks from the bar's head; Dombi nods |
| Combo 10 | T2 | chip with F10, bar shimmer; Dombi point + wink; still under 1.2 s |
| Wrong answer | T0 | tile coral + F14 shake · panel slides up with the right answer + 💡 tip · Dombi `wrong` · soft low tone + one soft tap · bar still moves a little |
| Speaking: your turn | T0 | mic F15 pulse; Dombi listening |
| Speaking: heard | T1 | F11 rings close into a check; words you said light up green one by one |
| Speaking: not heard | T0 | Dombi "can't hear you" tilt; mic nudges; no red |
| Tap the Mistake: found it | T1 | wrong word gets a strike-through (F12), the fix slides in above it, F1 |
| Quit sheet | T0 | sheet up, Dombi calm (no guilt) |
| Mistakes round start | T1 | divider slides in; Dombi thinking |
| **New thing you can SAY** | T2 | phrase card pops (F17) with F2 twinkles; Dombi celebrate; the phrase is spoken; card then flies to the phrases counter (F8 + F18) |
| **Lesson result** | T2 | three stat tiles arrive and count up (F13) while the sound builds; on its hit, 1.1 s in, Dombi cheers, F4 confetti medium, "Dars tugadi!" pops; then the phrases in a stagger, each ▶ bounces |
| **Perfect lesson** | T3 | F4 large + gold "Perfect" badge slams in (F9 dust + F10) + F2 lingering |
| **Streak +1** | T2 | flame lights and grows, F6 embers, number flips N→N+1 with a bump, today's dot fills orange |
| Streak milestone 7 / 30 / 100 / 365 | T4 | custom Dombi + flame scene, F5 in orange, share card (after MVP) |
| Streak freeze used | T2 calm | frost creeps over the missed day, F7, freeze count ticks down; no confetti (it's a save, not a win) |

### Checkpoint & level-up (20–23)
| Moment | Tier | Motion |
|---|---|---|
| Checkpoint start sheet | T1 | gold sheet up; the 5 story steps light up one after another |
| Step done (player) | T1 | step chip ticks (F12) and the next one slides in |
| **Checkpoint result** | T3 | trophy drops onto the shelf (F9 dust + F10 rings) → F2 twinkles; waiter's reaction badge pops on it; F4 large in gold/violet |
| **Level up** | T3 | screen dims; big number rolls to the new level (F13); F5 fountain; "what you can do now" list staggers in; Dombi proud |

### Progress, Profile, Settings (24–28)
| Moment | Motion |
|---|---|
| Open Progress | big "can say" count rolls up (F13); newest phrases stagger in |
| Streak card | flame flickers gently; tap → card expands into the calendar |
| Streak calendar | orange days draw their joining band left→right (F12); frozen days get a quick frost shimmer |
| Things I can say | ▶ F16 waves; "my voice" chip pulses once when a recording exists |
| Profile | banner parallax on scroll; avatar bounce on load; awards: earned ones have slow F2; new award: F1 + F3 |
| Add friend / request accepted | button morphs (Add → Sent → Friends) with a check draw-on; accepted: F1 green |
| Settings toggles | knob squash; dark mode: the whole screen cross-fades |
| Delete recordings | items collapse upward one by one |

### Pop-ups & states (29–31)
| Moment | Motion |
|---|---|
| Feedback sheet sent | paper-plane style send: sheet shrinks up and away → thank-you toast; Dombi happy |
| Confidence went up (2 → 4) | the two faces side by side, arrow draws (F12), F1; never shown if it went down |
| No internet | wifi icon fades in and out slowly; auto-retry dots; Dombi think |
| Mic blocked | the 3 steps tick in; no red alarm |
| Error | sprout / plant sways gently; Dombi oops |
| Fallback page | sprout grows a little (loop) |

### After MVP (planned, not built now)
Shop purchase (item flips, F8 Apples fly out) · pet outfits (poof swap) · league promotion (F4 + badge) ·
paywall crown (F3 + F2) · scenes (characters talk with the same mouth engine) · achievements (medal slam F9 + F10).

## 5. Dombi's part in each moment (all built already)

| Moment | Dombi |
|---|---|
| Idle anywhere | breathing, blinks, glances, idle breaks |
| Correct / wrong | `correct` / `wrong` reactions |
| Your turn to speak | `listening` + `amp` |
| Explaining / reading a phrase | talking mouth + `amp`; `looking` at the thing he explains |
| Mistakes round | mood think + gesture thinking |
| New thing you can say · lesson result | mood laugh + gesture celebrate |
| Level up / perfect | mood proud, then celebrate |
| Onboarding / new screen | `hidden` → enter; wave |
| Waiting for the server | thinking (never a spinner) |

## 6. How it gets built

| Where | What |
|---|---|
| **Rive artboards** (one file, several artboards) | Dombi (done) · FX Pop (F1) · FX Confetti (F4, F5) · FX Embers (F6) · FX Frost (F7) · FX Twinkle (F2) · FX Rings (F10, F11) · streak flame · trophy · level badge |
| **App code** (cheap, tied to layout) | F3 shine, F8 fly-to-counter, F12 draw-on, F13 count-up, F14 shake, F15 glow, F16 waves, F17 bubble pop, button press, sheets, staggers, screen transitions |
| **Particles** | baked: physics simulated ahead of time and saved as keyframes, so no scripts are needed in the app |

**Suggested build order:** (1) F1 pop + correct/wrong full beat → (2) lesson result: F4 + F13 + F8 → (3) streak: F6 + flame →
(4) level up + checkpoint: F5, F9, F10, trophy → (5) F7 frost, F2 twinkle → (6) component polish (shine, glow, waves).

## 6b. Built so far (2026-10-11)

| Built | Where | Notes |
|---|---|---|
| F1 Pop | Rive artboard **FX Pop** (200×200), VM `FXPop`: trigger `fire`, colour `color` | 3 random versions; ring + 8 pieces + 4 white sparks |
| F4 Confetti medium / large, F5 Fountain | Rive artboard **FX Confetti** (390×844), VM `FXConfetti`: triggers `medium` (2 versions), `large` (3 waves), `fountain` (gold) | 110 pieces, baked physics |
| F6 Embers | Rive artboard **FX Embers** (200×260), VM `FXEmbers`: trigger `fire` | 2 versions |
| F3 shine, F8 fly-to-counter, F13 count-up, F14 shake, F17 pop-in, F2 twinkle (simple) | reference code in `design/rive/moments.html` | to be re-done in the app's own code (#29) |
| Moments wired end to end | `design/rive/moments.html` | correct · wrong · combo 3 · combo 5 · new phrase · lesson complete · perfect lesson · streak +1 · level up |

Baker: `design/rive/fx_bake.js` (physics simulated in JS, written as keyframes; ~19 000 keys; whole .riv ≈ 390 KB).
Level-up backdrop is **violet**, not black: Dombi is black and must stay visible.
**Second batch (2026-10-11):**

| Built | Where | Notes |
|---|---|---|
| F7 Frost | Rive **FX Frost** (200×200), VM `FXFrost`: `fire` | ice ring + 8 shards + snow drifting down; 2 versions |
| F9 Dust puff | Rive **FX Dust** (200×120, floor at y=100), VM `FXDust`: `fire` | 8 puffs out sideways; 2 versions |
| F10 Double ring | Rive **FX Rings** (240×240), VM `FXRings`: `fire`, `color` (gold) | two rings, 150 ms apart |
| F2 Twinkle | Rive **FX Twinkle** (240×200), VM `FXTwinkle`: `fire`, `color` (gold) | 7 four-point twinkles over ~2 s; 2 versions |
| F11 Voice rings + F12 check | Rive **FX Voice** (200×200), VM `FXVoice`: number `amp` (0–100), trigger `heard` | 3 coral rings sized by the live mic level; `heard` = rings close, white check draws itself (over the mic button, which turns green) |
| Streak flame | Rive **Streak Flame** (96×124, base at y=116), VM `StreakFlame`: bool `lit`, bool `risk`, triggers `ignite`, `out`, `repair` | grey + still · flicker loop · ignite pop · at-risk nervous loop · goes out · sputters and relights |
| Moments | `design/rive/moments.html` | speaking · streak freeze used · checkpoint trophy |

**Full app (after-MVP features), built 2026-10-11 so nothing is left for later:**

| Feature | Effect | Where |
|---|---|---|
| Streak milestones 7/30/100/365 | orange/gold fountain | **FX Confetti** trigger `streak` |
| Streak at risk / lost / repaired (24 h repair) | flame states | **Streak Flame** `risk`, `out`, `repair` |
| Apples currency (earned, quest rewards, invites) | 10 apples burst up and fall, then fly to the counter (app code) | **FX Apples** (240×240), VM `FXApples`: `fire` (2 versions) |
| Daily quests / league rewards | chest: shake → open (lid, glow, coins + apples) → stays open → reset | **FX Chest** (240×240), VM `FXChest`: `shake`, `open`, `reset` |
| Shop purchase / outfit swap | cloud poof + twinkles | **FX Poof** (200×200), VM `FXPoof`: `fire` (2 versions) |
| Pet outfits | hat slot on Dombi + first outfit (Uzbek doppi) | Dombi VM enum `hat` = none / doppi, trigger `dress` |
| Pet growth | swells, holds, settles (+ FX Rings violet + FX Twinkle) | Dombi trigger `grow` |
| League promotion, achievements | badge rise / medal slam with FX Rings, FX Dust, FX Twinkle, confetti | moments `league`, `achievement` |
| Dark mode | lighter Dombi (body #5A5A7A) so he reads on a dark screen | Dombi VM bool `dark` |
| Reference UI code | glow pulse (F15), speech waves (F16), path line draw + node unlock (F12) | `moments.html`: yourturn, dombiTalks, pathUnlock |

**Still open (needs art or the real app, not animation work):** the café waiters are now built and animated (2026-10-12, see pages.md, "Café waiters"); other scene characters are not designed
yet — they reuse Dombi's talking engine and mouth model once drawn; more outfits are art only (the hat slot and the
put-on move exist); sound design; the app-code effects get rebuilt in the app's own framework in #29.

## 6c. Component motion lab (started 2026-10-12)

The component motions from §3 are built as a live page, with every component drawn to the Pencil sizes and
tokens (light and dark): `design/motion/` → `node serve.js` → http://127.0.0.1:8791/design/motion/.
The page has slow motion (×4) and a Reduce Motion switch. `motion.js` holds the primitives and one table of
timings; the app code copies those numbers. `node check.js` (and `node check.js dark`) plays every demo in
a real browser and saves pictures for checking.

**Batch 1 — the lesson (built, checked in light and dark):**

| Component | Motion |
|---|---|
| Main button | press: face drops 4 px in 60 ms, back in 140 ms with a small overshoot · turns ready: colour 120 ms + one shine (600 ms), again every 5 s · tapped while grey: small shake (250 ms) |
| Other buttons (secondary, green, danger, small) | same press; small ones drop 3 px; no shine |
| Answer tile, picture tile | pick: violet in 120 ms, lifts 2 px · right: green, punch 1.08 (200 ms), FX Pop · not right: red, shake (350 ms), the right one turns green 120 ms later with no pop |
| Word tile (Tile Builder) | flies to the line on a small arc (260 ms), lands with a squash (220 ms); the others close the gap (180 ms); a grey slot stays in the bank · right: green left to right, 60 ms apart |
| Tap the mistake | pick: violet · right: a line strikes the word (200 ms), the fix drops in from above (200 ms), FX Pop · not right: red + shake, the real mistake turns green |
| Tap the gap | empty gaps breathe (1.2 s) · pick: fills violet · right: the other gap closes (180 ms), the word drops in and lands, FX Pop |
| Progress bar | grows in 320 ms with a 2.5 % overshoot and a shine; combo number bumps; gold from 5 in a row; FX Pop at the end at 100 % |
| Combo moment | the full-screen page 14c: fade in 150 ms, flame pops (300 ms) with FX Embers, text pops 80 ms later, holds about 1.3 s, a tap skips it. Shown after DAVOM ETISH at 3, 5 and 10 in a row |
| Feedback sheets | up in 260 ms with a 6 px overshoot, badge pops 60 ms later, tip fades in 80 ms later; down in 180 ms |
| Toast, Uzbek tip | toast: in 220 ms, holds 2.2 s, out 160 ms · tip: pops in (220 ms) |
| Mic button | your turn: ring breathes out every 1.2 s · listening: coral, FX Voice rings follow the level, bars move · checking: three dots · heard: green, the check draws itself (FX Voice), words light up 90 ms apart · nothing heard: back to violet with a small nudge, no red |
| Audio buttons | press 6 px (big) / 4 px (slow) / 3 px (small); the icon becomes moving bars while the sound plays |
| New exercise | old one leaves to the left (180 ms); the task comes in from the right (250 ms), then the answers 40 ms apart |

Changed from the plan: the combo is the locked full-screen page 14c, not the small chip that §7 used as a default.

**Batch 2 — the Learn page** (`nav.html`): the LOCKED Path H screen (Pencil "Screen 11 · Path") as a live phone, with the
circles at the screen's own positions. A first version was built from the old "Learn — Timeline" frame by mistake and
was replaced on 2026-10-13.

| Piece | Motion |
|---|---|
| Lesson circle | press: drops 9 px (60 ms down, 140 ms back) · locked: press, then a small shake · current: a ring breathes out every 1.2 s |
| Finishing a lesson (T2, about 1.2 s) | circle turns violet, check pops, FX Pop → 5 gold bits fly to the phrases number, which bumps and counts up → the next circle turns coral with a bounce (340 ms) and a shine, its ring starts → the streak flame lights if it was grey |
| All five lessons done | the trophy tile bounces and shines, the banner shines once, gold twinkles on the trophy every 2.6 s; the trophy then opens the checkpoint sheet |
| Numbers at the top | small bounce on tap; count-up with a bump when a number changes |
| Unit banner | press drops 4 px |
| Tabs (icons only) | the violet pill fades to the chosen icon in 120 ms, the icon hops 5 px (240 ms); the page cross-fades in 150 ms |
| Lesson start sheet (Screen 12) | backdrop 200 ms; sheet up in 300 ms with an 8 px overshoot; phrase box and details fade up 120 / 180 ms later; BOSHLASH shines; down in 200 ms |
| The page | scrolls so the current circle stays in view (300 ms) |

**Batch 3 — sheets and controls** (`controls.html`): toggle (knob slides 20 px in 180 ms and stretches; the dark-mode
switch cross-fades the screen in 250 ms) · text field (violet on focus, green + punch, red + shake) · segmented switch
(the pill slides in 180 ms) · rating and feedback form (the form shrinks up and away in 220 ms, then a "Rahmat!" toast) ·
reminder time wheel (follows the finger, snaps in 220 ms) · quit sheet with a live Dombi · dialog (pops from 90 % in
220 ms, leaves in 140 ms) and rows folding away 70 ms apart · loading shimmer (1.4 s), content fading up 40 ms apart ·
offline toast, slow-fading wifi icon, retry button with three dots.

**Batch 4 — progress and profile** (`progress.html`): streak card (flickering flame, breathing ring on today's dot,
"lesson done" with embers and the number bump, "freeze used" with FX Frost) · calendar unfolding under the card with
the joining bands drawing left to right · big number and tiles counting up, level ring drawing in 700 ms · phrase
cards (list 40 ms apart, a new card pops in with twinkles, play bars, stars turning gold) · friend button morphing
between its four states.

**Batch 5 — onboarding and results** (`screens.html`, six moments): 2 choose a goal · 17 new thing you can say ·
18 lesson result · 18 perfect lesson · 22 checkpoint result (trophy drop with squash, dust, rings, large confetti,
waiter's reaction last) · 23 level up (badge slam, rings, confetti fountain, the number flips, the list arrives 90 ms apart).

Screen 18 was redesigned on 2026-10-13 (option A on the Pencil board "Lesson result — redesign ideas"): Dombi on top,
"Dars tugadi!", three stat tiles, then the phrases. Everything lands on one beat 1.1 s in.

Perfect lesson (T3) is the same screen: the number counts to 100 %, a gold "MUKAMMAL!" badge slams in under the title
from 2.6× (380 ms with a 120 ms stop) and lands on the beat, with gold rings behind Dombi, large confetti, and a
twinkle on the badge that comes back at 1.3 s and 2.6 s.

**Batch 6 — speaking exercises** (`exercises.html`): Meet It (the picture pops, the phrase plays with no text, the mic
waits; said right, the English words appear one by one) · Say What You See (the hint chip shows only the first words) ·
Echo Line (the waiter's mouth moves with the sound and each word lights as he says it; he reacts after you repeat) ·
one word off (the word turns orange, tap it to hear it, then the right answer is shown) · nothing heard (the mic
nudges and waits again, no red).

**Batch 7 — lesson and checkpoint moments** (`lessonmoments.html`): 16 mistakes round (Dombi comes in thinking, the
violet card slides in from the right in 250 ms, its arrows turn once) · 19 streak after the lesson (flame lights with
embers, the number flips up by one, today's dot fills with a check, about 1.2 s) · 20 checkpoint start sheet (the path
dims, the sheet slides up, the five story steps light up 110 ms apart) · 21 checkpoint player (the waiter speaks, then
your turn; the step at the top turns green, the line to the next step fills, the next line comes in).

**Batch 8 — onboarding** (`onboarding.html`): the 12 locked screens as one flow with the buttons inside the phone.
Dombi is one Rive view that travels between screens (he moves and resizes in 300 ms, he does not cut). Step bar grows
one piece per screen; options arrive 40 ms apart; the mic screen has a pulsing mic badge; "Menga Hello deng" uses
FX Voice and ends with "Zo'r! Sizni eshitdim"; the reminder wheel follows the finger and snaps.

**Batch 9 — Profile** (`profile.html`): the avatar bounces in (320 ms), sections fade up 60 ms apart the first time
they scroll into view, the four overview numbers count up, the banner moves at 40 % of the scroll speed and the avatar
shrinks a little, the hat and scarf sway, a gold twinkle visits an earned award every 2.8 s, the friend button swaps
its label, and a new award punches with a pop, one shine and a "YANGI" tag.

**Batch 10 — small states** (`states.html`): 30b confidence grew (the old number pops in, the arrow draws itself in
260 ms, the new number rolls up and turns green with a pop, Dombi celebrates) · 31b mic blocked (the lesson dims in
200 ms, the sheet comes up in 300 ms, the three steps tick in 110 ms apart; no red) · 31e something went wrong (Dombi
puts a hand to his chin; QAYTA URINISH shows three dots while it tries) · 31d not ready yet (the sprout sways and
grows a little on a 1.9 s loop).

Every page was played in a real browser in light and dark by its `check-*.js` script, and pages 6–10 were compared
side by side with exports of the locked Pencil screens.

Dombi size rule for the app: the Rive artboard has empty space around Dombi (the body is 50 % of the canvas), while
the design's Dombi box has the body at 66 %. To match a design box of size S, draw the Rive view at 1.32 × S and
shift it left by 0.164 × S and up by 0.231 × S.

**Sound (2026-10-13):** the 20 chosen sounds play in the lab on the motion's beats; see `docs/ideas/sound-plan.md` §5. Small interface sounds come from a switchable family and each has a planned tap in the hand: §6. The reminder time wheel now covers the whole day, turns without end and keeps moving after a flick (same section).

**Listening bars (2026-10-13, asked for by the owner):** the bars shown while the mic listens now follow the real microphone instead of a fixed loop (`design/motion/voice.js`).

- At rest each bar is a dot, exactly as tall as the bar is wide, and a soft glow runs along the row to show it is listening.
- With a voice the bars rise: the low notes of the voice move the middle bars, the middle rises highest, a bar jumps up fast (about 35 ms) and settles slower (about 160 ms). The rings round the mic button and Dombi's listening squash follow the same level.
- A real press on the mic button listens with the real mic and ends when the speaker has been quiet for 0.7 s. With no voice for 5 s it gives the "nothing heard" result.
- The onboarding mic check waits for a real "Hello!" and moves on by itself. The browser asks for the mic when MIKROFONNI YOQISH is pressed.
- The lab's own buttons ("Speak (all right)", "Nothing heard", "Say Hello") still play a made-up voice, and so does everything when there is no mic or the answer was no.
- The lab only knows that a voice was heard, not which words. `node check-voice.js` tests it with a recording given to the browser as its mic.

**Taps in the hand (2026-10-14):** every sound's tap is given on the sound's loud moment (`haptic.js`; the table is in
sound-plan.md §6). The tool bar's Taps switch shows them on a PC.

**Page 11, the lessons (2026-10-14):** `lessons.html` lists all 15 lessons and 3 checkpoints item by item from the app's
own lesson files, with every English line to hear at normal and slow speed, the words lighting up in time and the
waiter's or the seller's mouth following the sound. It is a page for checking the content, not an app screen.

**Not done yet:** the after-MVP pieces (§4) · joining all of this into the browser version of the app
(the plan: tech-stack.md §0), and after that the phone app.

Rule learned: a Rive view shows the runtime's start-up logo for about two seconds when it is created, so every Rive
view must be created when the screen loads and kept hidden until then, never in the middle of a moment.

## 7. Open questions — defaults used until the owner says otherwise

Defaults: (1) shine repeats every ~5 s · (2) pop at the answer tile, Dombi reacts separately · (3) ~~calm chip~~ the full-screen page 14c + gold bar (changed 2026-10-12, see §6c) ·
(4) streak milestones after MVP · (5) motion + haptics first, sound later.


1. **Main-button shine:** once when it becomes ready, or also repeating every ~5 s while it waits (Duolingo repeats)?
2. **Correct-answer pop:** at the answer tile, at Dombi, or both?
3. **Combo style:** chip + gold bar (calm), or a bigger full-width banner at 5 and 10?
4. **Streak milestones (7/30/100):** MVP or after?
5. **Sound:** do we want sounds in the MVP at all, or motion + haptics first?

## 8. Touch interactions (built 2026-10-11) — playground: `design/rive/play.html`

The app does the physics (position, speed); Rive does the acting. Dombi VM additions: enum `play`
(none · held · walk · pet · peek · warm · sleep · wind · highfive · back), numbers `swing` (degrees, jelly swing while
carried / tilt), `squish` (−100…100), `stretch` (0…100, pinch), and one-shot triggers: `hop`, `land`, `smug`, `poke1`,
`poke2`, `poke3`, `eat`, `ahem`, `clap`, `playoff`, `wake`, `snap`, `trickSpin`, `trickFlick`, `trickShades`, `dizzy`, `shook`.

| Interaction | What the app does | What Rive plays |
|---|---|---|
| Hold ~300 ms → hop on | moves him to the finger | `hop`, then `play` = held (lounging, half-lidded, both hands gripping) |
| Carried | spring-follows the finger; sets `swing`, `squish`, `lookX/Y` from the motion | jelly swing around his feet, eyes look where he's going |
| Shaken while held | counts fast direction changes | `dizzy` |
| Let go | gravity, lands on floor / card / by the flame | `land` (80 ms hit-stop, shakes it off), then `play` = walk home |
| Thrown (finger speed > 900 px/s) | ballistic, tumbles (rotation), bounces off edges, lands upright | `land`, then `smug` |
| Drop on a lesson card / by the flame | snaps to the spot | `play` = peek / warm |
| Dragged or swiped off the screen | hides, slides back in from another edge, hops home | eyes look in |
| Tap (poke) | counts pokes within 4 s | `poke1` → `poke2` → `poke3` (hand pushes you away) → `play` = back for 3 s |
| Double-tap | picks a trick, never the same twice | `trickSpin` / `trickFlick` / `trickShades` |
| Rub (press and move at once) | — | `play` = pet, then `ahem` on release |
| Feed a word (drag a word chip onto him) | shows the word on his body, haptic chews | `eat` |
| High-five after a correct answer | offers for 2.8 s; hit-tests the hand | `play` = highfive → `clap` (+ FX Pop) or `playoff` |
| Idle 22 s → sleeps; tap to wake | sets mood sleepy | `play` = sleep → `wake` (one eye first) |
| Talk to it while held | mic level → `amp` | body pulses with your voice |
| Pinch (two fingers / wheel) | sets `stretch` | gum stretch, `snap` on release |
| Phone gravity (owner 2026-10-27, replaces "tilt the phone"; tabs only) | the phone's pull, minus its own movement, is his gravity: he falls to whichever edge is down (sides, top), bounces, lies there, slides along it; a phone lying flat keeps the screen bottom as down; held upright and still 3 s, he walks home; he has weight (owner, same day): every landing faster than 180 pt/s bounces back at 40 % with a squash, and he slides on with momentum | `land`; turned with his feet to the edge; leans while sliding on the floor |
| Shake the phone | impulse, bounces off the edges | `shook` (annoyed look) |
| Blow into the mic | loud and steady 0.25 s | `play` = wind |
| Eye tracking | pointer → `looking` + `lookX/Y` | eyes follow |

**Where he can be touched — LOCKED 2026-10-11: option B, everywhere** (all three options stay built in the playground) (playground: the "Where can he be
touched?" switch + the Home / Lesson / Dombi screen tabs):

| Option | Home | Lesson (exercise active) | Dombi screen |
|---|---|---|---|
| A · Home only | everything | locked, eyes follow | — |
| B · Everywhere | everything | taps, pokes, tricks, petting, high-five; **no** carry / throw / feed / pinch | — |
| C · Dedicated screen | a tap opens his screen | locked, eyes follow | everything |

In app code this is one rule per screen: `all` · `nocarry` · `open` · `none`. Shake and throw are detected from the
finger's own movement (pointer events), so they don't depend on frame rate.
The mic-based ones (talk, blow) are
verified with a fake microphone (`design/rive/test_mic.js`: Chromium plays a wav as the mic): `amp` follows the
syllables while held (2–100) and steady loud noise puts him in the wind pose until it stops. Blow detection is
loudness-only (loud and steady for 0.25 s while idle), so a long shout would also count — tune on a real phone.
