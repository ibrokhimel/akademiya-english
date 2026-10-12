# 2: Case studies of app animation (Duolingo first)

Research for Akademiya English: a speaking app for Uzbekistan, designed in Pencil and animated in Rive. Its mascot is **Dombi**, a flat 2D round black blob with white pill eyes, a smirk, and circle hands that only appear for gestures. Dombi is cool, never kawaii.

Researched 2026-10-10. Sources are listed at the end.

**How to read this file**
- **Sourced:** stated in a primary or named secondary source, with a source number in brackets like [3].
- **(inferred):** my reconstruction from watching the shipped app, general practice, or reasoning. Timings in the beat tables are almost all inferred. Duolingo has never published frame timings for its celebration screens.
- **Steal this:** the concrete takeaway for Dombi and Akademiya.

---

## 0. Ten things to remember

1. **Duolingo animates characters from small modular parts plus a Rive State Machine, not from pre-baked clips.** Lily's video-call rig gets 64+ idle variations from 8 head × 8 body animations, and the file is under 1 MB [2].
2. **Lip sync is driven by data, not keyframed.** TTS audio goes through Duolingo's own speech recognition and pronunciation models, which return a timing for every phoneme. Each phoneme maps to a viseme, and a mouth state set of "20+ mouths" per character runs in parallel with the body states [1].
3. **Thinking time is acted out.** While the AI processes, Lily tilts her head or looks like she's pondering, so latency reads as intentional [2]. This is the most directly useful pattern for Dombi's "thinking" state.
4. **Restraint is part of character.** Duolingo toned Lily's eyes down because "if Lily opened her eyes too wide, people were like, 'Why is she so happy?'" [2]. A deadpan character must stay deadpan when it celebrates. That is exactly Dombi's brief.
5. **Celebrations escalate on purpose.** A correct answer gets a small per-character reaction. Several correct in a row gets a mid-lesson interstitial. A streak milestone gets a full transformation, where Duo becomes a phoenix and milestones are treated like video-game power-ups [3][4].
6. **Wrong answers are muted, not punished.** The banner slides up gently, shows the correct answer, plays a short descending tone, and the progress bar still advances a little [7][9]. In 2025 Duolingo moved from hearts (a penalty) toward energy (a reward), saying it wants learners to "focus on things you're getting right" [10].
7. **Sound, haptics and motion are one composition.** Apple's rules are causality, harmony and utility. Apple Pay's success is "two simple taps" in the same tempo as the checkmark and the sound. Even small added latency between visual and feedback "completely" breaks the illusion [11].
8. **Voice-AI orbs share one grammar.** Idle breathes. Listening follows the smoothed mic amplitude. Thinking is a self-driven holding loop, not audio-driven. Speaking follows the output amplitude. Barge-in returns to listening at once. The listening visual must be honest and appear only while the mic is really open [13][14][15].
9. **Animate less as frequency rises.** An animation seen for the hundredth time becomes a "cognitive burden" [12]. Big beats should be rare, and per-answer beats should be short.
10. **Every animation needs a "beat" even with the sound off.** This is one of Duolingo's five motion principles (feel something, rhythm, play with expectations, be intentional, get to the point), via a secondhand LinkedIn summary [8].

---

## 1. How Duolingo uses Rive

### 1.1 The facts Duolingo has published

| Topic | What is known | Source |
|---|---|---|
| Why Rive | "File sizes were compact and plugged in neatly with Duolingo's app architecture, and the handoff from animator to engineer was seamless." The State Machine was the deciding feature: it "allowed us to programmatically control which animation states are called, how they are called, and how they transition and blend together." | [1] |
| Scale problem | Ten World Characters (Duo, Lily, Zari, Oscar, Junior, Eddy, Lin, Vikram, Bea, Falstaff), 40+ languages and 100+ courses. Hand-animating lip sync was "completely out of the question." | [1] |
| Mouth shapes | "20+ mouths designed for everyone." Each character has its own drawing of each viseme to match their personality. The viseme set was "designed based on linguistic features." The blog diagram shows the blending logic with 4 mouths. | [1] |
| State architecture | There are separate states for the body or pose and for the mouth: "These states have to run at the same time as the states for the character animation!" In Rive terms these are parallel State Machine layers (inferred mapping). | [1] |
| Timing pipeline | Generate TTS, run it through in-house ASR and pronunciation models, and get a timing for each word and phoneme. Map each phoneme to a viseme. A "factory" generates timings for all course content, with tooling to audit and correct them. The client receives audio plus timing data, which is "much less than sending down a little movie." | [1] |
| Idle | Head nods, blinking, and eyebrow movement. | [1] |
| Reactions | After a challenge, the result (correct or incorrect) moves the character into a final reaction state. Tapping a word makes the character say and animate it. If the learner answers before the character finishes talking, it stops. | [1] |
| Export | Each character's State Machine is exported as one runtime file and handed to engineering. Targets are Android, iOS and Web. | [1] |
| Lily (Video Call, 2024) | Modular parts. Jasmine Vahidsafa compares it to risograph printing: eyes, brows and mouth are layered into one expression. Head and body are separate nested artboards. **8 head idles × 8 body idles = 64+ neutral variations.** Inputs are "named logically for developers." There are event-triggered expressions: leaning in (intrigued), squinting or a head shake (confused), a raised brow and nod (impressed), and an exaggerated eye-roll (unimpressed). Latency is masked with a head tilt or "pondering." The file is under 1 MB. Quote: "We don't need 50 separate animations when we can blend just a few perfectly." | [2] |
| Lily tuning | Wide eyes made her look too happy, so the expressions were dialled back to keep her deadpan personality. | [2] |
| Rig system | A Duolingo employee's LinkedIn post names "Maker," the system behind in-lesson characters. It uses reusable Rive rigs and also powers Video Call. This is secondhand and could not be opened directly. | [16] |
| Team | Duolingo acquired the animation studios Gunner (2022) and Hobbes (2024), and reportedly Animade (2026; one source, unverified). That makes motion an in-house discipline. | [16] |
| Character design for animation | Duo is "basically just a body with wings": big eyes, a distinctive body shape and detached feet. The human cast is built from the same basic shapes. | [4] |
| Correct-answer moments | Each character has a unique animation that plays "anytime a learner answered an exercise correctly." Mid-lesson interstitials reward "answering a number of exercises correctly in a row." | [4] |

### 1.2 Rive mechanics that make this possible (from Rive docs)

| Feature | Fact | Use for Dombi |
|---|---|---|
| Layers | A layer plays one state at a time. Multiple layers play at once. **Layers lower in the list win** when they animate the same property. [17] | Layers: `body` (idle, react), `eyes` (blink, look), `mouth` (visemes), `hands` (gestures), `fx` (glow or particles). Put mouth and eyes below body so they override it. |
| State types | Single animation; **1D blend** driven by one number; **Additive/Direct blend** driven by several numbers. 1D blend mixing is "non-linear and additive", so test it. [18] | 1D blend `amp` from 0 to 100 for the listening and speaking squash. Direct blend for the eye look direction (x, y). |
| Any State | A state reachable from anywhere. [18] | `react_correct`, `react_wrong` and `gesture_*` triggers from Any State. |
| Exit state | Stops that layer. Useful with multiple layers. [18] | The hands layer exits when no gesture is playing, so hands disappear. |
| Transitions | Default duration 0, with an example of 0.2 s. Linear by default, with cubic available. Exit Time can be a time or a %. Conditions are ANDed. **Randomize Exit with weights** (3:1 = 75/25). "Allow exit during transition" makes a transition interruptible. "Pause source when exiting." [19] | Random idle selection: from `idle_base`, use weighted exits to `idle_look`, `idle_blink2`, `idle_smirk_shift` and similar. Make every reaction interruptible so barge-in works. |
| Events | Open URL and Audio types (General is deprecated). Fired from timelines (Report Event), states, transitions or listeners. [20] | Fire Audio events on the impact frame of reactions. Fire named events the app can map to haptics (inferred runtime pattern). |
| Data binding | View-model data drives the state machine. The runtime reacts when bound values change. [21] | Bind `xp`, `streak` and `combo` numbers to the counters in the celebration artboards. |
| Nested artboards | Lily's head and body are separate nested artboards [2]. Artboards keep components modular [21]. | Make Dombi's eyes their own artboard with its own state machine, reused at every size, including tiny Dombi in toasts. |

### 1.3 Inferred Duolingo character State Machine (reconstruction)

```
Layer BODY   : Entry -> Idle(base loop) --random weighted--> IdleVariant[1..n] -> back
                Any -> Talk(body bob) while isTalking
                Any -> React_Correct (trigger) -> Idle
                Any -> React_Incorrect (trigger) -> Idle
Layer MOUTH  : Entry -> Rest ; viseme number input -> 20+ mouth poses (single states or a blend)
Layer EYES   : Blink loop with random exit timing; brows driven by expression input
Inputs       : isTalking(bool), viseme(number 0..N), correct(trigger), incorrect(trigger),
               lookX/lookY(number) (inferred), expression(number) (inferred)
```
(inferred: Duolingo has not published input names. The structure follows [1] and [2].)

### Steal this (Rive)
- **Modular over monolithic:** 8 body idles × 8 eye idles × a random smirk shift gives Dombi hundreds of idles cheaply.
- Keep the **mouth on its own layer**, driven by one number input `viseme`. With Dombi's tiny smirk mouth, 6–8 shapes are enough (see section 5.4). Duolingo needed 20+ because its characters have big, readable mouths.
- **Name inputs for developers** (`isListening`, `amp`, `viseme`, `correct`, `wrong`, `gesture`).
- Budget the **file at under 1 MB**, as Lily did.
- **Tone down peaks.** Dombi's "happy" should be a smirk widening and a short hop, not wide sparkly eyes.

---

## 2. Duolingo's celebration sequences, beat by beat

Duolingo has not published timings for these. The tables below come from repeated observation of the shipped app plus general practice, so **every timing is (inferred)** unless a source is cited. Sound and haptic columns are also inferred. Duolingo has no public haptics documentation, and the only sound description is third-party [9].

### 2.1 Correct answer (the most frequent beat, ~50×/day for an active learner)

| Beat | Time | What moves | Easing | Particles | Sound / haptic |
|---|---|---|---|---|---|
| 1. Press CHECK | 0 ms | The 3D button face drops onto its darker edge, about 4 px [7] | ~100 ms ease [7] | none | light tap (inferred) |
| 2. Verdict | ~0–50 ms | The green feedback sheet slides up from the bottom: icon, "Great!" or similar | ease-out, ~200 ms (inferred from [7]) | none | **bouncy rising chime** [9]; success haptic (inferred) |
| 3. Character reaction | ~100–900 ms | The lesson character plays its own correct-answer animation [4] | anticipation, then overshoot (inferred) | none | none |
| 4. Progress bar | ~150–500 ms | The top bar fill extends, with a highlight sheen sweeping along it | ease-out ~300 ms [7] | none | none |
| 5. Combo label (if ≥ threshold) | after the bar | "N IN A ROW" flag appears above the bar and the bar colour intensifies (inferred) | pop scale 0.8→1.05→1 (inferred) | small sparkle (inferred) | none |
| 6. Wait for CONTINUE | user-driven | — | — | — | — |

### 2.2 Combo / "in a row" interstitial

Sourced fact: mid-lesson interstitials reward several correct answers in a row [4]. The rest is (inferred).

| Beat | Time | What moves | Easing | Particles | Sound / haptic |
|---|---|---|---|---|---|
| 1. Screen swap | 0–250 ms | The exercise slides out and a full-screen character vignette slides in | ease-in-out | none | whoosh |
| 2. Character performs | 250–1500 ms | The character does a personality move (Duo dances, Lily deadpans, Eddy flexes) plus a line like "5 in a row!" | spring | confetti or shapes, sometimes | jingle |
| 3. Auto-advance or tap | ~1.5–2.5 s | Next exercise | — | — | — |

### 2.3 Lesson complete

2025: Duolingo shipped "fresh animations for... lesson-end screens" [5]. Earlier write-ups mention "lively illustrations and character confetti" [6]. Beats are (inferred).

| Beat | Time | What moves | Easing | Particles | Sound / haptic |
|---|---|---|---|---|---|
| 1. Last answer resolves | 0 | The bar reaches 100% and flashes | ease-out | none | correct chime |
| 2. Transition | 0–400 ms | Lesson UI clears and the background colour washes in | ease-in-out | none | rising swell |
| 3. Hero | 400–1600 ms | Duo or a character jumps into frame and celebrates. Title appears: "Lesson complete!" | spring with overshoot | confetti burst behind the character | **fanfare** (the signature lesson-complete jingle) |
| 4. Stat cards | 1.2–2.4 s, staggered ~120 ms | 2–3 cards (Total XP, Accuracy/"Amazing", Time) pop in one after another | scale 0.6→1.08→1, then settle | none | a tick per card |
| 5. Number count-up | inside each card, ~600 ms | XP counts up from 0 | ease-out (fast then slow) | none | counter ticks, haptic ticks (inferred) |
| 6. CTA | ~2.5 s | CONTINUE button enables (it can be visible earlier but disabled) | fade/slide | — | — |
| 7. Follow-on screens | next taps | Streak extension, daily-quest progress, league position, any of which may follow | — | — | — |

### 2.4 Streak extension (first lesson of the day)

Sourced: the 2022 redesign made milestones feel like video-game "power-ups". Duo becomes a rising phoenix "with a flame surrounding him," and the transformation begins in flight. The team rejected candle, s'mores and beaker flames as not universal. The old version, with Duo holding number balloons, was "cute, but not quite celebratory enough, energy-wise." "Timing is everything in animation": multiple rough passes refined "the overall rhythm and energy." A share card was added. Early metrics showed more streaks kept [3]. The idle-flame CSS reconstruction below comes from [7] (illustrative, not official): idle loop 2 s, scale 1.05, rotate 2°; at-risk loop 0.8 s, ±3°, scale 1.1, saturate 1.3.

Daily streak +1 (non-milestone). (inferred)

| Beat | Time | What moves | Easing | Particles | Sound / haptic |
|---|---|---|---|---|---|
| 1. Grey to lit | 0–300 ms | A greyed flame icon ignites: the colour floods from the bottom up | ease-out | small embers | whoosh/ignite |
| 2. Number roll | 300–900 ms | Old number rolls up and out, new number rolls in (odometer). Big numeral | spring settle | none | tick, then a satisfying "thunk" |
| 3. Week row | 900–1500 ms | Today's dot in the weekday row fills with a flame or check, left-to-right stagger | pop | tiny sparkle | soft pings |
| 4. Copy | ~1.5 s | "You're on fire!" or "Streak extended!" | fade-up | — | — |

Milestone (7, 30, 100, 365…). Beat structure from [3]; timing is (inferred).

| Beat | Time | What moves | Easing | Particles | Sound / haptic |
|---|---|---|---|---|---|
| 1. Anticipation | 0–500 ms | Duo crouches or begins to fly; the screen darkens | slow-in | none | rising drone |
| 2. Transformation | 500–1500 ms | Flames envelop Duo, who becomes a phoenix | fast, snappy | fire particles | whoosh, then a hit |
| 3. Reveal | 1.5–2.5 s | Big milestone number with glow | overshoot | embers rising | fanfare, strong haptic |
| 4. Share | after | Share card ("I just reached a … streak!") | slide-up | — | — |

### 2.5 League promotion and chests

Sourced: leagues are weekly 30-person boards and the top finishers are promoted (third-party [22]). The chest experience was redesigned in 2025 to be "a more delightful experience to open" [5]. Beats are (inferred).

| Beat | Time | What moves | Easing | Particles | Sound / haptic |
|---|---|---|---|---|---|
| Promotion 1 | 0–600 ms | The old league badge shrinks or slides away and the new gem-shaped badge drops in | anticipation, spring | glints | rising chime |
| Promotion 2 | 600–1400 ms | Badge shines (specular sweep) and the league name types or fades in | ease-out | sparkles | sparkle sound |
| Chest 1 | 0–400 ms | Chest wobbles (anticipation) once or twice | ease-in-out | none | rattle |
| Chest 2 | 400–700 ms | Lid bursts open, with light rays and squash/stretch on the chest | snappy | burst | pop |
| Chest 3 | 700–1500 ms | Reward (gems, XP boost) flies up and counts into the HUD | arc, ease-out | trail | coin ticks, haptic per tick |

### 2.6 Perfect lesson

Sourced: after a perfect lesson, harder exercises follow and "Eddy" now cheers you on [5]. The rest is (inferred): perfect lessons get a special stat card, an extra badge or a different character pose. Expect an amplified version of 2.3 with a distinct colour (gold).

### Steal this (celebrations)
- **A three-tier escalation ladder.** Tier 1, per answer: about 1 s, chime, bar fill. Tier 2, combo: about 2 s, a Dombi gesture with hands. Tier 3, lesson end or streak: about 3 s, the full hero beat. Milestones get a unique transformation, as Duo got the phoenix.
- **Count numbers up**, and tick a haptic every N units, not every unit.
- **Stagger stat cards** about 100–150 ms apart and let them settle with a small overshoot.
- **A power-up metaphor for milestones.** Dombi could gain a temporary visible "mode" (a cool glow outline, sunglasses-like eye shape change, or hands-in-pockets swagger). Keep it cool: no balloons.
- **A share card** at milestones, with Uzbek, Russian and English copy.

---

## 3. Wrong-answer feedback without punishment

| Element | Duolingo behaviour | Source |
|---|---|---|
| Colour | Red sheet (#ff4b4b), described as "not scary red." Same layout as the green sheet. | [7] (reconstruction) |
| Motion | Slides up 200 ms ease-out, the same motion as the correct sheet. No shake of the whole screen (inferred). | [7] |
| Content | Shows **the correct solution** with a "GOT IT" button, so a mistake becomes a teaching moment. | [7] |
| Sound | A "deflated, descending tone" that discourages without causing anxiety. | [9] |
| Progress | The progress bar still advances a little after a wrong answer. | [7] (reconstruction) |
| Character | The character goes to an "incorrect" reaction state [1]. "Frustrated" Duo appears only after several wrong in a row [7]. Lily's "dismissive slow-clap" is comedic, not cruel [6][23]. | [1][6][7][23] |
| Re-try | Missed items come back later in the lesson (well known; inferred mechanism). | (inferred) |
| System | 2025: hearts gave way to energy, framed as "rewarding correct answers rather than punishing mistakes." | [10] |

### Steal this (wrong answers)
- **The same motion, a different colour and pitch.** Use a symmetrical structure so wrong never feels like a different, scarier world.
- **Dombi's wrong reaction is a smirk-shrug, not sadness.** Eyes go half-lidded and one circle hand pops out palm-up, about 600 ms. Humour does the work, as Lily's slow-clap does.
- **Never shake the screen** for a wrong answer. A tiny horizontal shake of the answer chip only (3 cycles, about 4 px, about 250 ms) is fine.
- **For speaking exercises**, highlight the mispronounced word and offer "listen + retry" right away. Speaking anxiety is higher than tapping anxiety.
- **A descending two-note tone**, short and soft, and a single soft haptic (or none). Save the stronger haptic for success.

---

## 4. Other apps with standout motion

### 4.1 Apple Pay success / Apple audio-haptics [11]
- The checkmark, sound and haptic were designed together. The sound had to be "not too serious, and it's clearly a confirmation", and candidates that were "too happy and frivolous" or "too harsh" were rejected.
- The haptic is "two simple taps." Haptic and sound are "mini-compositions" whose two "instruments" don't play the same notes but **play in the same tempo**.
- The Apple Watch crown: "the motion team changed the animation so it snaps to the sound and the haptics." Sometimes motion is retimed to fit the audio, not the other way round.
- Ghost-haptic priming: people often miss the first of a series of taps, so a primer tap "wakes up the skin."
- **Steal this:** design the correct-answer chime and haptic as a two-hit motif (tap-tap) synced to Dombi's hop: the takeoff and the landing.

### 4.2 Apple Activity rings closing
- Closing a ring triggers a celebratory "fireworks" animation on Watch. Users miss it when it fails to play, which shows how much people value it [24].
- When the ring overlaps past 100% it shows the overflow lap with a darker shadow at its tip (well-known UI; inferred description).
- **Steal this:** a **closing-loop** visual for the daily goal, a ring that closes around Dombi. Show overflow beyond the goal, not a cap.

### 4.3 Animoji / Memoji
- TrueDepth tracks "more than 50 muscle movements" to drive the characters in real time [25].
- What makes it impressive: zero latency mirroring. The character feels alive because it copies *you*.
- **Steal this:** **mirroring during listening.** While the learner speaks, Dombi's body can pulse with *their* amplitude. This "I'm with you" signal is the core of the voice-orb pattern.

### 4.4 Headspace [26]
- 150+ characters and about 80 minutes of in-app animation (Nexus Studios). Visual analogies explain abstract ideas.
- Rounded geometric bodies, a strong brand palette, simple eyes and mouth as brand constants, and slow steady pacing that matches meditation.
- **Steal this:** keep the **face constants** (pill eyes, smirk) identical across every pose so Dombi always reads instantly. Use **slower pacing** for calm moments such as breathing before a speaking task.

### 4.5 Finch [27]
- The pet metaphor: the bird's wellbeing mirrors your self-care, and it works without instructions.
- Completing a task gives immediate visible responses: the bird gains energy or plays a joyful animation.
- The tone is low-pressure, with no shaming. That counters streak anxiety.
- A critique: onboarding asks too much before you meet the bird. Let users meet the character first.
- **Steal this:** **meet Dombi first, customise later.** Dombi should react within the first 10 seconds of onboarding.

### 4.6 Calm / Apple Breathe [28]
- Breathe is a flower of overlapping circles that expands and contracts. One "spread" value drives the whole animation.
- **Steal this:** a single 1D blend input (`breath` from 0 to 1) can drive Dombi's breathing idle. Reuse it as a "calm down before you speak" exercise.

### 4.7 Supercell / game "juice" [29][30]
- "Juice it or lose it" (GDC 2012) took a plain Breakout clone and made it compelling with tweening, screen shake, particles, sound and floating text.
- Practical numbers: screen shake 50–300 ms with decaying amplitude, and hit-stop 0.05–0.1 s.
- The counterpoint (Folmer Kelly, GDC Europe): over-juicing hurts immersion and believability.
- The Clash Royale chest: anticipation (the timer wait), then a burst open, then rewards revealed one by one by rarity (well-known flow; [30] covers mechanics only). Pacing the reveal builds suspense.
- **Steal this:** use **hit-stop**, a 60–80 ms freeze on Dombi's landing frame in the tier-3 celebration. Reveal rewards **one at a time**.

### 4.8 Monument Valley [31]
- Sound, animation, visual effects, colour and gradients work together as one piece (Harry Nesbitt).
- The world "turns on a dime." Tapping a crank swings walkways 90°: direct, mechanical satisfaction.
- The team chose elegance over difficulty and cut puzzles that weren't elegant.
- **Steal this:** **direct manipulation feels best.** Let the learner drag or press-and-hold to "wake" Dombi before a speaking task.

### 4.9 Linear / interaction craft (Rauno Freiberg's "Invisible Details") [12]
- Interruptible: you can reverse a gesture mid-animation.
- Spatial consistency: animations show where things come from.
- Motion keeps the momentum and angle of the throw.
- Frequency: frequent actions get less or no animation ("cognitive burden after seeing the same animation for the hundredth time").
- Respond to input instantly and layer the animation on top.
- **Steal this:** all reactions are **interruptible** (Rive "allow exit during transition"). The per-answer beat stays at 1 s or less, and the tap or press responds in under 100 ms.

### 4.10 Spotify Wrapped [32]
- 2025 Wrapped was built in Rive as reusable "story card" components driven by real user data. They handle text length, localisation and late changes without a rebuild.
- Results: 300M+ users engaged and 630M+ shares (Spotify earnings, quoted by Rive).
- **Steal this:** build the weekly or monthly progress recap as **data-bound Rive cards**. Text length matters: Uzbek and Russian strings are often 30–40% longer than English (inferred).

### 4.11 Google Gemini [33]
- Gradients with "sharp, almost opaque leading edges that diffuse at the tail" act as pointers that carry direction and energy.
- Each animation has a defined start and end that mirrors the user's action. Inner movement suggests "active thinking and synthesis."
- The gradient ripples in response to voice.
- "When a system is hard to approach, the design must be soft."
- **Steal this:** Dombi's thinking state can have an **inner motion** (eyes looking up and to the side and drifting) instead of a spinner.

### 4.12 Siri (Apple Intelligence) [34]
- Edge-lit glow that "adapts in response to the sound of your voice." It enters from the side when the button is held and from the bottom when triggered by voice. It originates where the action happened.
- **Steal this:** the **mic button is where Dombi's listening glow starts**, with the glow spreading from the tapped button to Dombi.

### 4.13 Grok companions (Ani) [35]
- A 3D character with voice, lip sync and expressions that react to the conversation. An affection score (−10 to +15) unlocks new animations.
- **Steal this (carefully):** unlock **new Dombi gestures** as progress rewards. Skip the romance or affection framing.

---

## 5. AI voice / orb patterns, and how to apply them to a blob mascot

### 5.1 The shared grammar [13][14][15]

| State | Driver | Typical visual | Notes |
|---|---|---|---|
| Idle | time | slow breathing scale (~1.00↔1.02, 3–4 s), gentle colour drift | sleep or asleep state optional [14] |
| Listening | **mic amplitude** (0–1), smoothed | scale or displacement follows the voice; glow brightens | must be honest: only while the mic is really open [13] |
| Thinking | self-driven loop | distinct holding animation: rotation, inner swirl, pulsing | "masks model latency honestly" [13]. Lily's head tilt [2] |
| Speaking | **output amplitude** (0–1) | pulses with TTS, often with a different colour or shape from listening | Deepgram reads mic and agent playback volume every frame [15] |
| Barge-in | interrupt detected | immediate return to listening | state machine swaps the instant an interrupt is detected [13] |

Implementation notes:
- Smooth the amplitude. Raw amplitude jitters, and "an orb that twitches reads as broken" [14]. Use an attack of about 30–60 ms and a release of about 150–250 ms (inferred).
- Accessibility: announce "Listening / Thinking / Speaking" in a live region, show a static state under reduced motion, and never make the orb the only control [14].
- Ask for mic permission only after an explicit user action [13].
- Performance: shaders are the most expensive option. Cap the pixel ratio, halve the frame rate, pause offscreen, and provide a static fallback [14]. Rive vectors avoid most of this.
- ChatGPT's Advanced Voice uses a floating blue orb that "pulses as ChatGPT listens," with a fluid sky-blue and white animation [36]. OpenAI has not published official state specs.

### 5.2 Dombi as the orb (proposal; inferred design)

Dombi *is* the orb: a round black blob. That is a rare advantage, because the voice-AI grammar maps directly onto the character without a separate widget.

| State | Dombi body | Eyes | Mouth | Hands | Extra |
|---|---|---|---|---|---|
| Idle | breath 1D blend; random weighted idles (look around, slow blink, smirk shift) | random blink every 2–6 s | smirk | hidden | — |
| Ready / your turn | small lean toward the learner | eyes widen slightly and look at the mic | neutral | hidden | mic button glow starts |
| **Listening** | squash/stretch driven by the **learner's** smoothed amplitude (scale Y ±4%, X ∓2%) | eyes look *down* toward the mic and stay half-focused | closed | maybe one hand cupped to the side ("I'm listening") on the first listen only | thin outer rim glow (the app's accent colour) whose brightness follows amplitude |
| Thinking | slow side-to-side tilt (Lily's head tilt) | eyes look up and to the side and drift | small "hmm" mouth | one hand to chin (only if thinking lasts over ~1.2 s) | no spinner |
| Speaking | gentle bob driven by **TTS** amplitude | eyes at the learner | **viseme layer** | gestures fire on emphasis words if the script has tags | — |
| Barge-in | instant (≤100 ms) blend to listening | eyes snap back to the mic | close | hands away | — |
| Correct | hop: anticipation squash → stretch up → landing squash with hit-stop | eyes happy-squint (the pill tilted) | smirk widens | thumbs up or a "nice" point | chime + haptic tap-tap on takeoff and landing |
| Wrong | small shrug | half-lidded | flat smirk | one palm-up hand | descending tone, single soft haptic |

### 5.3 Listening has two honest signals
1. **Mic-open signal:** the rim glow, which is on only while recording.
2. **Heard-you signal:** the amplitude squash. If the amplitude stays at 0 for over 1.5 s while recording, Dombi tilts its head ("can't hear you"). This turns silence into a cue instead of a frozen UI. (inferred)

### 5.4 Viseme set for a small smirk mouth (inferred)
Duolingo uses 20+ visemes [1] for characters with large mouths. Dombi's mouth is small, so it should collapse to about **7 shapes**:
`rest (smirk) · A/a (open) · E/i (wide) · O/u (round) · M/B/P (closed press) · F/V (bite) · L/TH/D (tongue hint)`.
Map the TTS viseme IDs (Azure, Polly and others emit about 15–22) onto these 7 with a lookup table, and hold each shape for at least ~60 ms to avoid flicker.

---

## 6. Haptics and sound paired with animation

### 6.1 Principles (Apple WWDC19 "Designing Audio-Haptic Experiences") [11]
- **Causality:** it must be obvious what caused the feedback.
- **Harmony:** "things should feel the way they look, the way they sound." Sync matters: added latency killed the bouncing-ball illusion.
- **Utility:** "use moderation. Don't add sound and haptics just because you can." Too much "will diminish the value of what's really important."
- The two parameters are **intensity** (strength) and **sharpness** (low is round or soft, high is crisp or mechanical). For a sharp transient, use a chime with a sharp attack. For smooth sounds, use a continuous haptic that ramps.
- "Imagine using your app for the very first time… then imagine using it 100 times more."

### 6.2 Proposed audio-haptic map for Akademiya (inferred, built on the principles)

| Event | Visual | Sound | Haptic (iOS / Android) | Frequency |
|---|---|---|---|---|
| Button press | 3D face drops 4 px | soft click (or none) | light impact / `KEYBOARD_TAP` | very high, so keep it minimal |
| Mic open | rim glow on | short rising blip | light transient, sharp 0.6 | high |
| Mic close (auto end) | glow fades | short falling blip | none | high |
| Correct | Dombi hop | two-note rising chime | **tap-tap** synced to takeoff and landing (success notification) | high |
| Wrong | Dombi shrug | two-note descending, soft | single soft transient, sharp 0.2 (or none) | medium |
| Combo (5 in a row) | gesture + label pop | short arpeggio | medium impact | medium |
| Count-up ticks | numbers rolling | ticks every 5 XP | selection ticks, capped at ~10 per count | low |
| Lesson complete | hero beat + confetti | fanfare (~1.5 s) | rising continuous ramp (~400 ms) ending in a heavy transient on the hit-stop frame | low |
| Streak milestone | transformation | bigger fanfare | rumble ramp, then a strong double hit | rare |

Rules:
- Sound and haptic **share the motion's tempo** (Apple Pay rule).
- **Retime the animation to the sound's hit** when needed (the Watch crown rule).
- Respect the device mute switch and an in-app sound toggle. Haptics should have their own toggle. Learners in classrooms or on buses in Tashkent will often have sound off, so every beat must read silently. That is Duolingo's "every animation should have a beat even without sound" principle [8].
- Fire sounds from **Rive Audio events** on the exact frame [20]. Map named events to platform haptics in app code (inferred integration).

---

## 7. Do and don't for Dombi

**Do**
- Use modular layers (body, eyes, mouth, hands, fx) with random weighted idles.
- Act out thinking (tilt, look up). No spinners.
- Drive the listening squash from smoothed mic amplitude, and only while the mic is open.
- Escalate in three tiers. Make each milestone unique.
- Keep correct and wrong symmetrical in motion. Wrong is humour plus the answer.
- Sync motion, sound and haptics to one tempo. Every beat must work with the sound off.
- Make everything interruptible (barge-in, fast taps).
- Keep the file under 1 MB per character file.

**Don't**
- Wide sparkly eyes, blush or hearts (kawaii). Duolingo itself toned Lily down [2].
- Shake the screen on errors.
- Animate frequent actions heavily ("100th time" rule).
- Show a listening animation while the mic is off.
- Pre-render lip sync as video. Send audio plus viseme timings instead [1].

---

## Sources

1. Duolingo Blog, "How Duolingo Animates Its World Characters" (Vahidsafa & Lenzo, 2022-11-10): https://blog.duolingo.com/world-character-visemes/
2. Rive Blog, "Duolingo's AI-powered Video Call brings Lily to life": https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
3. Duolingo Blog, "You're on fire! Or, how we brought the streak milestone to life" (Hartfelder, 2022-01-21): https://blog.duolingo.com/streak-milestone-design-animation/
4. Duolingo Blog, "Building character": https://blog.duolingo.com/building-character/
5. Duolingo Blog, "2025 Duolingo Highlights": https://blog.duolingo.com/product-highlights/
6. 60fps Design, "Fun in Every Frame": https://60fpsdesign.substack.com/p/fun-in-every-frame
7. Blake Crosley, Duolingo design guide (illustrative CSS reconstruction, not official): https://blakecrosley.com/guides/design/duolingo
8. Duolingo "Inside Design Studio #3" LinkedIn summary of the five motion principles (secondhand, could not open directly): https://co.linkedin.com/in/felipe-quintero-a3487b167
9. Out of Scope newsletter, on Duolingo's correct and wrong sounds: https://out-of-scope-product.beehiiv.com/p/duolingo-has-it-venmo-has-it-even-slack-has-it-your-product-doesn-t
10. Aftermath, on Duolingo gamification and the hearts-to-energy change: https://aftermath.site/duolingo-gamification
11. Apple WWDC19 Session 810, "Designing Audio-Haptic Experiences": https://developer.apple.com/videos/play/wwdc2019/810
12. Rauno Freiberg, "Invisible Details of Interaction Design": https://rauno.me/craft/interaction-design
13. vp0, voice interrupt and voice UI animation guides: https://vp0.com/blogs/voice-interrupt-animation-react-native.md and https://vp0.com/blogs/ai-pin-voice-interface-animation-swiftui
14. 21st.dev, "React voice orb components": https://21st.dev/blog/react-voice-orb-components
15. Deepgram, Browser Agent React UI (orb reads input and output volume): https://developers.deepgram.com/docs/browser-agent-react-ui
16. Duolingo acquisitions: Gunner https://investors.duolingo.com/news-releases/news-release-details/duolingo-acquires-gunner-accelerate-product-brand-development ; Hobbes https://duolingo.gcs-web.com/node/9911/pdf ; the "Maker" system is mentioned in a LinkedIn "Inside Design Studio #5" post (https://vn.linkedin.com/in/htn2892, secondhand)
17. Rive Docs, State Machine Layers: https://rive.app/docs/editor/state-machine/layers
18. Rive Docs, States: https://rive.app/docs/editor/state-machine/states
19. Rive Docs, Transitions: https://rive.app/docs/editor/state-machine/transitions
20. Rive Docs, Events: https://rive.app/docs/editor/events/overview
21. Rive Blog, "How state machines work in Rive": https://framer.rive.app/blog/how-state-machines-work-in-rive
22. Deconstructor of Fun, Duolingo Leagues: https://duolingo.deconstructoroffun.com/mechanics/leagues
23. Apple Developer, "Behind the Design: Duolingo" (2023): https://developer.apple.com/news/?id=jhkvppla
24. Apple Community threads on Activity ring fireworks: https://discussions.apple.com/thread/252009834
25. Inverse, "iPhone X's Animoji Scans 50 Facial Muscles": https://inverse.com/article/36374-apple-new-animoji-ios11
26. Nexus Studios, Headspace case study: https://nexusstudios.com/work/headspace-case-study/ ; LBB, Moth × Headspace: https://www.lbbonline.com/news/moth-does-mindfulness-for-headspace-and-netflix-animated-series
27. Pratt IxD, Finch design critique: https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/
28. Lou Franco, Apple Watch Breathe animation tutorial: https://app-o-mat.com/article/watchkit/apple-watch-app-animation-tutorial
29. Wayline, Game Feel and Juice (on "Juice it or lose it", GDC 2012): https://www.wayline.io/learn/game-feel/1 ; Slicker, "Game Feel in Pygame" (shake timings): https://slicker.me/python/game_feel_pygame.htm
30. Game Developer, "Deconstructing Clash Royale": https://www.gamedeveloper.com/business/deconstructing-clash-royale
31. The Ringer, Monument Valley 10th anniversary: https://www.theringer.com/2024/04/3/video-games/monument-valley-10-year-anniversary-ustwo-mobile-gaming-apple-ios ; Pocket Gamer.biz, "Stairway to heaven": https://www.pocketgamer.biz/stairway-to-heaven-the-making-of-monument-valley
32. Rive Blog, "Spotify used Rive for Spotify Wrapped 2025": https://rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025
33. 9to5Google, Gemini gradient design (2026-01-17): https://9to5google.com/2026/01/17/gemini-gradient-design/
34. 9to5Mac, "New Apple Intelligence Siri looks different": https://9to5mac.com/2024/11/03/new-apple-intelligence-siri-looks-different-works-the-same/
35. CyberLink, Grok Ani guide: https://www.cyberlink.com/blog/trending-topics/4066/grok-ani
36. TechRadar, ChatGPT Advanced Voice on desktop: https://www.techradar.com/computing/artificial-intelligence/openai-launch-chatgpt-advanced-voice-mode-on-desktop-and-now-pcs-and-macs-can-join-the-conversation ; Croma: https://croma.com/unboxed/chatgpt-gets-an-advanced-voice-mode-openai-confirms
37. Rive Blog, Brilliant.org case study (Lottie vs Rive: state machine and file size): https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations
38. Duolingo Blog, "Shape language: Duolingo's art style": https://blog.duolingo.com/shape-language-duolingos-art-style/

### Gaps (could not verify)
- Duolingo's real celebration timings, particle counts and haptic patterns: none are published. Section 2's timings are inferred.
- The Duocon 2023 animation talk: not found.
- The exact input names in Duolingo's state machines: unpublished.
- Official ChatGPT, Gemini or Siri state specs (colours, curves): unpublished.
- Calm's breathing animation: no design write-up was found.
