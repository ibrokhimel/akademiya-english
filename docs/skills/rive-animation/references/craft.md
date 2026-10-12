# 1. Animation craft for Dombi and the UI

Research brief for "Akademiya English". Dombi is a flat 2D round black blob (#2B2B3C) with white pill eyes, an off-centre smirk mouth made of rounded bars, and circle hands that appear only for gestures. The target is "cool and confident" for teens and adults, not kawaii. Build tool: Rive.

Conventions in this file:
- **[S#]** points to the numbered source list at the end.
- **(inferred)** means I derived or recommend it. No source states it outright.
- Frame counts assume **24 fps** unless marked otherwise. Rive runs at display rate (60/120 Hz), so the "ms" column is the one to build with.

---

## 0. Frame and ms conversion (use this everywhere)

| Frames | @24 fps | @30 fps | @60 fps |
|---|---|---|---|
| 1 | 42 ms | 33 ms | 17 ms |
| 2 | 83 ms | 67 ms | 33 ms |
| 3 | 125 ms | 100 ms | 50 ms |
| 4 | 167 ms | 133 ms | 67 ms |
| 6 | 250 ms | 200 ms | 100 ms |
| 8 | 333 ms | 267 ms | 133 ms |
| 12 | 500 ms | 400 ms | 200 ms |
| 18 | 750 ms | 600 ms | 300 ms |
| 24 | 1000 ms | 800 ms | 400 ms |

Rule: animation literature counts frames at 24 fps ("on ones" means a new drawing every frame, "on twos" a new drawing every 2 frames). Convert the number of frames to ms using the 24 fps column. Don't reuse the frame count at 60 fps, or everything will play 2.5× too fast. [S1][S20]

A Dombi-specific note (inferred): Rive interpolates every display frame, so motion is effectively "on ones" at 60 to 120 Hz. Holding a key for one or two 24 fps frames (42 to 83 ms) gives a slightly stepped, hand-made accent. A flat 2D mascot benefits from it. Use it for snaps such as eye darts and blink closes, not for idle drift.

---

## 1. The 12 principles applied to a limbless blob

The Disney principles come from Thomas & Johnston, *The Illusion of Life* (1981) [S1]. For each one below: what it is, how it applies to Dombi, and the numbers to use.

### 1.1 Squash and stretch
- **Rule:** volume is preserved. "If the length of a ball is stretched vertically, its width ... needs to contract correspondingly horizontally." [S1]
- **2D area preservation:** `scaleX × scaleY ≈ 1`. Stretching to Y = 1.20 means X = 1/1.20 = 0.83. For a squash to Y = 0.85, X = 1.18. (Inferred: this is the 2D form of the volume rule. In 3D, `X = 1/√Y` across both X and Z.)
- Too much reads as "mushy" [S21]. *Illusion of Life*: "Mushy action makes a mushy statement." [S22]

| Use on Dombi | scaleY | scaleX | Duration | Notes (inferred unless cited) |
|---|---|---|---|---|
| Idle breath | 1.00 → 1.015 | 1.00 → 0.985 | 3–4 s cycle | Barely visible. Only works if the eyes ride up with the top of the body |
| Speaking emphasis | 1.03 | 0.97 | 80–120 ms in, 200 ms out | On stressed syllables only |
| Correct-answer hop, pre-jump squash | 0.85–0.90 | 1.11–1.18 | 80–120 ms | Anticipation |
| Hop, take-off stretch | 1.10–1.15 | 0.87–0.91 | 60–100 ms | Fast; holds for 2–3 frames only |
| Hop, landing squash | 0.88–0.92 | 1.09–1.14 | 50–80 ms, then spring back | Settle with an underdamped spring, ζ ≈ 0.5–0.6 |
| "Big win" celebration | 0.80 / 1.20 extremes | 1.25 / 0.83 | Same beats, larger | Ceiling for a cool character. Beyond this it reads cartoony |

- **Pivot:** squash from the **bottom** (ground contact), not the centre. If you squash from the centre, the blob floats. (Inferred; standard bouncing-ball practice.)
- **Restraint for "cool":** keep everyday squash at or below 10%. Save 15–20% for the 1 or 2 peak moments per lesson. Contrast is what makes the peak land (see §6.5). [S13]

### 1.2 Anticipation
- Anticipation prepares the audience. It can also be non-physical, like "a character looking off-screen to anticipate someone's arrival." [S1]
- A blob with no limbs anticipates with three tools: a **counter-squash** (it squashes down before rising), a **lean away** (rotate −3° to −6° before moving +), and an **eye lead** (the eyes look at the target 2–4 frames before the body moves).
- Typical sizes (inferred from standard practice):
  - Anticipation ≈ 1/3 to 1/2 of the main action's duration for a deliberate move. A hop of 250 ms has an anticipation of about 100 ms.
  - A **surprise** or hit reaction uses an anticipation of 0 to 1 frame, or none, so it reads as sudden. Williams' *Survival Kit* has dedicated sections on "Surprise anticipations" and "Invisible anticipations". [S20]
- **For a cool character (inferred):** use small, quick anticipations and skip the big wind-ups. A confident character doesn't telegraph. One clean 2–3 frame dip reads as control. A long wind-up reads as eager or childish.

### 1.3 Staging
- Present one idea at a time so it reads unmistakably. Lasseter **locked the camera** in *Luxo Jr.* so that all attention stayed on the characters' acting. [S23]
- For Dombi (inferred):
  - One action at a time. Don't run a gesture, a speech line and a hop at once.
  - Silhouette test: the pose must read when filled flat black. Dombi is already black, so the silhouette is the whole read. Hands must break the outline (sit outside the body edge) to read at all.
  - Eye direction is the strongest staging tool. Where Dombi looks, the user looks. Point the eyes at the UI element being explained.

### 1.4 Straight ahead vs pose to pose
- Pose to pose works better for emotional or acting scenes. Straight ahead works better for fluid physical action. [S1]
- In Rive (inferred): build key poses as keyframes (pose to pose). Then add "straight ahead" life procedurally: springs on follow-through and random offsets on idle.

### 1.5 Follow-through and overlapping action
- Loose parts "continue moving after the character has stopped ... only to be subsequently 'pulled back'". Different parts move at different rates (drag). [S1]
- Dombi has few loose parts, so create overlap from what exists:
  - **Eyes lag the body** by 1–3 frames (40–125 ms) on starts, and overshoot by 1–2 px on stops.
  - **Mouth lags the eyes** by 1–2 frames on expression changes. Never switch the whole face on the same frame.
  - **Hands** pop in after the body pose is set: a delay of 2–4 frames (80–170 ms), then an overshoot to about 110% scale, settling in 120–200 ms.
  - **Body jiggle on stop:** 1–2 decaying oscillations, amplitude 3% → 1% → 0. Spring ζ ≈ 0.4–0.6.
- All values in this list are inferred, built from the principle plus the twinning fix "just a few frames difference will break things up nicely" [S24].

### 1.6 Slow in / slow out (easing)
- More drawings near the extremes, fewer in the middle. [S1]
- Directional rule from NN/g: **ease-out for entering**, **ease-in for exiting**. Ease-in and ease-in-out on entrances "can feel unresponsive". Linear motion looks unnatural. [S4]
- Exception: Dombi's **idle loops** should be ease-in-out (sine) for a smooth, symmetric breath. Only the transitions follow the enter/exit rule. (Inferred)

### 1.7 Arcs
- Natural action follows arcs. Mechanical movement goes in straight lines. Faster objects flatten their arcs. [S1]
- Dombi (inferred): a hop is a parabola, not a vertical line. Head tilts rotate around a pivot near the bottom of the body, so the top sweeps an arc. Eye travel between two targets bows slightly (2–4 px) when slow, and stays straight when it is a dart.

### 1.8 Secondary action
- Supports the main action and must not steal from it. During a dramatic movement, facial changes "go unnoticed", so put them **at the beginning and end** of the move. [S1]
- Dombi: when the body hops, hold the face still during the airborne frames and change the expression on landing. (Inferred, from the same source)

### 1.9 Timing
- Timing is the number of frames for an action. A lighter object reacts faster than a heavier one. Timing "is critical for establishing a character's mood, emotion, and reaction." [S1]
- Fewer in-betweens read as a hard impact. More in-betweens read as sneaking. [S22]
- Williams: "A hard accent bounces back, a soft accent continues". He also covers "stagger timings". [S20] (Section titles only. The contents were not read.)

### 1.10 Exaggeration
- Push the mood so it reads: make a sad character sadder. [S22]
- For a cool character (inferred): exaggerate **timing contrast** (fast snap → long still hold), not **amplitude**. Big amplitude is what makes mascots cute or kawaii. Big timing contrast is what makes them feel confident.

### 1.11 Solid drawing → shape consistency
- For a flat 2D blob this means consistent construction. The eye pills keep their width-to-height ratio under squash, and the mouth bars keep their thickness and round caps under scale. (Inferred) In Rive, counter-scale the stroke or bar thickness, or use non-scaling strokes, so the mouth stays crisp when the body squashes.

### 1.12 Appeal
- "Attitude can be achieved with the simplest of shapes." The silhouette carries the attitude. [S22]
- The flour-sack exercise bans eyes and mouth and still has to show emotions (sad, shy, proud, frightened) purely through pose and timing. That is the exact constraint Dombi lives under when the face is neutral. [S25]
- Lasseter's *Luxo Jr.* lesson: the characters and story come first. A viewer asking "is the big lamp the mother or the father?" proved that a simple object had personality. [S23]

### 1.13 Personality from a ball: practical recipes (inferred, built on S1, S22, S25)
| Attitude | Body | Timing signature |
|---|---|---|
| Confident / proud | Slight stretch (Y 1.03), slight back-lean (−2°), still | Quick move (≤150 ms) → long hold (≥800 ms) |
| Chill / unbothered | Slight squash (Y 0.98), centred | Slow ease-in-out (400–600 ms), minimal overshoot, few blinks |
| Smug | Head tilt 4–8°, one-sided mouth raise, half-lidded eyes (lids at 30–40%) | Move, then a 1–2 s hold, then a single slow blink |
| Impressed (reacting to user) | Small stretch up (Y 1.05), eyes widen 10% | Snap in 100 ms, hold, then a slow nod (2 dips) |
| Disappointed but kind | Squash (Y 0.94), eyes down 3–4 px | Slow (500–700 ms) settle, 1 slow blink, recover |
| Thinking | Eyes up-and-to-side, still body | Eye dart, then 600–1200 ms hold, then a second dart |

---

## 2. Timing tables

### 2.1 UI micro-interaction durations (primary sources)

**Material 3 duration tokens** (material-web tokens v0.192) [S2]

| Token | ms | Token | ms |
|---|---|---|---|
| short1 | 50 | long1 | 450 |
| short2 | 100 | long2 | 500 |
| short3 | 150 | long3 | 550 |
| short4 | 200 | long4 | 600 |
| medium1 | 250 | extra-long1–4 | 700 / 800 / 900 / 1000 (extra-long3 = 900 and extra-long4 = 1000 were read; extra-long1 and extra-long2 follow the 100 ms step, inferred) |
| medium2 | 300 | | |
| medium3 | 350 | | |
| medium4 | 400 | | |

**Material (v1) mobile guidance** [S3]
- Typical transition: **300 ms**. Large or full-screen: **375 ms**. Entering: **225 ms**. Exiting: **195 ms**. Over 400 ms "may feel too slow".
- Tablet: **+30%** (300 → 390 ms). Wearable: **−30%** (300 → 210 ms). Desktop: 150–200 ms.

**MUI implementation of the same** [S5]: shortest 150, shorter 200, short 250, standard 300, complex 375, enteringScreen 225, leavingScreen 195.

**NN/g** [S4]
- Most UI: **100–500 ms**, mostly **100–400 ms**. "It is far more common for animations to be too long than too short."
- Checkbox or toggle feedback: **~100 ms** ("feels immediate").
- Modal or large change: **200–300 ms**.
- Exit shorter than enter: e.g. appear in 300 ms, disappear in 200–250 ms.
- "The more frequent the animation, the more subtle and shorter you'll want it to be."
- "Moving from 250 to 300 ms can feel very different."

**Val Head** [S6]: start in the **200–500 ms** range. Small elements 200–300 ms. Large, bouncy or elastic moves 400–500 ms. "It takes a human 230 ms to visually perceive something."

**Game feel** [S7]: a response time of **≤100 ms** keeps controls feeling real-time (Swink, via secondary sources).

### 2.2 Recommended timing sheet for Akademiya (inferred, built from the above)

| Moment | Duration | Easing / spring |
|---|---|---|
| Button press-down (Duolingo 3D button) | 50–80 ms | ease-out or instant |
| Button release / pop | 120–180 ms | spring ζ 0.6, small overshoot |
| Answer tile select | 100–150 ms | ease-out |
| Correct-answer feedback banner in | 200–250 ms | emphasized-decelerate `(0.05, 0.7, 0.1, 1)` |
| Wrong-answer shake | 300–400 ms total, 3–4 oscillations, ±6–8 px decaying | linear-decay sine |
| Dombi reaction start (after the answer is checked) | 0–80 ms after the banner starts | Overlap the banner; never wait for it to finish |
| Dombi reaction body | 400–900 ms | keyed poses + springs |
| XP counter tick-up | 400–800 ms | ease-out (fast first, slow last digits) |
| Lesson-complete celebration | 1.5–3.0 s total, skippable after 600 ms | staged beats (see §6) |
| Streak or level-up "big moment" | 2.5–4.0 s, skippable | staged beats + hold |
| Stagger between list items | 30–75 ms per item, total cascade ≤500–800 ms, first item at 0 delay | [S8] |
| Screen transition | 250–350 ms | emphasized `(0.2, 0, 0, 1)` |

### 2.3 Easing curves (cubic-bezier)

| Name | Value | Source |
|---|---|---|
| M3 emphasized / standard | `cubic-bezier(0.2, 0, 0, 1)` | [S2] |
| M3 emphasized-decelerate (enter) | `cubic-bezier(0.05, 0.7, 0.1, 1)` | [S2] |
| M3 emphasized-accelerate (exit) | `cubic-bezier(0.3, 0, 0.8, 0.15)` | [S2] |
| M3 standard-decelerate | `cubic-bezier(0, 0, 0, 1)` | [S2] |
| M3 standard-accelerate | `cubic-bezier(0.3, 0, 1, 1)` | [S2] |
| M1/M2 standard ("legacy") | `cubic-bezier(0.4, 0, 0.2, 1)` | [S2][S3][S5] |
| M1/M2 decelerate | `cubic-bezier(0, 0, 0.2, 1)` | [S3] |
| M1/M2 accelerate | `cubic-bezier(0.4, 0, 1, 1)` | [S3] |
| M1/M2 sharp | `cubic-bezier(0.4, 0, 0.6, 1)` | [S3] |
| easeOutBack (overshoot ≈10%) | `cubic-bezier(0.34, 1.56, 0.64, 1)`, the common approximation of Penner's Back with s = 1.70158 | s = 1.70158 is the Phaser default [S9]; the bezier approximation is unverified (inferred) |
| Softer overshoot (~4–5%) | `cubic-bezier(0.25, 1.3, 0.5, 1)` | (inferred, tune by eye) |

Notes:
- An overshoot happens when the bezier's y-values go outside 0–1. [S9]
- **For Dombi, prefer springs over back-easing** for anything that can be interrupted. A bezier restarts from zero velocity, while a spring keeps its velocity. Apple: "This same velocity preservation makes these kind of interruptions feel smooth and natural." [S10]
- In Rive, keyframe interpolation offers linear, hold and custom cubic. The cubic handles take these exact bezier values. (Inferred from general Rive knowledge.)

### 2.4 Springs: how Apple and Google parameterise them

**Apple (WWDC23 "Animate with springs")** [S10]
- Two parameters: **duration** (perceptual) and **bounce** (range −1.0 to 1.0).
- Bounce 0 means "a smooth, gradual change". About **0.15** "doesn't feel very bouncy yet". About **0.30** gives "noticeable bounciness". "Be cautious about using values higher than around **0.4**."
- Conversion given in the session: `mass = 1`, `stiffness = (2π / duration)²`. For damping, the transcript reads as garbled, but the consistent form is `damping = 4π(1 − bounce) / duration` for bounce ≥ 0, which gives the **damping ratio ζ = 1 − bounce**. (Inferred by checking the algebra: ζ = c / (2√k) = [4π(1−b)/d] / [2·2π/d] = 1 − b.)
- SwiftUI presets: `.smooth` (bounce 0), `.snappy` (bounce ≈ 0.15), `.bouncy` (bounce ≈ 0.3), with a default duration of about 0.5 s. (These preset values come from SwiftUI API knowledge and match the transcript's 0.15 / 0.30 guidance. They were not read from a primary page this session.)
- "A spring animation doesn't only mean a bouncy animation." Use springs for continuity of velocity even when there is no bounce. [S10]

**Android SpringForce constants** (AndroidX source) [S11]

| Constant | Value |
|---|---|
| DAMPING_RATIO_HIGH_BOUNCY | 0.2 |
| DAMPING_RATIO_MEDIUM_BOUNCY | 0.5 |
| DAMPING_RATIO_LOW_BOUNCY | 0.75 |
| DAMPING_RATIO_NO_BOUNCY | 1.0 |
| STIFFNESS_HIGH | 10000 |
| STIFFNESS_MEDIUM (default) | 1500 |
| STIFFNESS_LOW | 200 |
| STIFFNESS_VERY_LOW | 50 |

**react-spring presets** (source code) [S12], with ζ computed as friction / (2√tension), mass 1 (inferred arithmetic):

| Preset | tension | friction | ζ ≈ | Feel |
|---|---|---|---|---|
| default | 170 | 26 | 1.00 | critically damped, no bounce |
| gentle | 120 | 14 | 0.64 | soft, slight overshoot |
| wobbly | 180 | 12 | 0.45 | clearly bouncy |
| stiff | 210 | 20 | 0.69 | quick, small overshoot |
| slow | 280 | 60 | 1.79 | overdamped |
| molasses | 280 | 120 | 3.59 | very overdamped |

Josh Comeau: more tension gives snappier motion, more friction gives less bounce, and more mass gives slower motion with more inertia. Most of his spring animations aren't bouncy. [S13]

**Dombi spring presets (inferred)**

| Use | Bounce (Apple) ≈ | ζ | Perceptual duration |
|---|---|---|---|
| Eyes settling after a dart | 0.0–0.1 | 0.9–1.0 | 80–120 ms |
| Body settle after a gesture | 0.15 | 0.85 | 300–400 ms |
| Landing jiggle | 0.3 | 0.7 | 350–450 ms |
| Hands popping in | 0.25–0.35 | 0.65–0.75 | 200–300 ms |
| Celebration peak only | 0.4 | 0.6 | 400–500 ms |
| Never (kawaii territory) | >0.5 | <0.5 | n/a |

---

## 3. Idle animation

### 3.1 Why idles matter, and the robotic-loop problem
- Idles give games personality and act as the "return point" after other animations. Third-person characters get **longer idles "to avoid looking robotic on repeated viewing."** [S14]
- Practitioner figures: idle loops run **90–360 frames**, and a 180-frame loop at 30 fps covers about 2 breaths (≈6 s). The common fix for repetition is **short base loops plus randomly triggered "idle breaks"** (fidgets) and **additive noise layered on top**. Keep big, distinctive moves out of the base loop. [S15]
- Duolingo's Rive World Characters: idle behaviours are **head nods, blinking and eyebrow movement**. Body and mouth states run as **separate, concurrent state machine layers**. [S16]

### 3.2 Breathing
| Parameter | Value | Basis |
|---|---|---|
| Human adult resting breathing | 12–20 breaths/min → 3–5 s per cycle | (general physiology, inferred) |
| Dombi breath cycle | 3.2–4.0 s, randomised ±10% per cycle | (inferred) |
| Inhale : exhale | ~40 : 60 (inhale faster than exhale) | [S15] (DAZ "Life Spark" describes inhale faster than exhale; vendor copy) |
| Amplitude | scaleY +1.0–1.5%, scaleX −1.0–1.5%, Y offset −1 to −2 px at the top | (inferred) |
| Eyes | ride up with the body top, lagging 2–3 frames | (inferred overlap) |

### 3.3 Blinks
**Human reference**
- Blink duration **100–400 ms**, typically 100–150 ms. [S17]
- Rate: mean **16.0 blinks/min** (SD 6.4, range 4–33) in a 98-person study, which is about one every **3.75 s**. Rates drop during reading and screen use. [S18][S17]

**Animator frame timings** (Bloop Animation; fps not stated, read as 24 fps) [S19]

| Blink type | Close | Hold closed | Open | Total @24 fps | Use |
|---|---|---|---|---|---|
| Regular | 2 | 1 | 3 | 6 f ≈ 250 ms | Staring, head move, keeping alive |
| Fast | 2 | 0 | 3 | 5 f ≈ 208 ms | Anxiety, anger, something passing the face |
| Long / slow | 3 | 2 | 4 | 9 f ≈ 375 ms | Long head moves, a change of thought |
| Eye batting | ¾ close in 1 | – | 2 | 3 f | Flirting (not for Dombi) |

Another course gives a "vanilla" blink of **2 frames closing, 1 held, about 8 frames opening** (open ≫ close). [S26] Consensus: **close fast, open slower.**

**When to blink** (Shawn Kelly, Animation Mentor) [S27]
- He calls the rule "blink every two seconds" one of the worst pieces of advice he received.
- Blinks have meaning. They mark a **change of thought or emotion** (Walter Murch: we blink to "edit the film of our lives").
- **Rapid blinking** reads as shy or nervous. **Little or no blinking** reads as angry or intense.
- Blink on a fast head turn, on a big eye-direction change, and to wet the eyes. A head turn "would almost always get us to blink." [S19]

**Dombi blink spec (inferred from the above)**

| Parameter | Value |
|---|---|
| Base interval | random 2.5–6.0 s (uniform or gaussian around 4 s). Never a fixed period |
| Double blink | ~15–20% of blinks. Second blink starts 80–150 ms after the first opens |
| Close | 60–85 ms (≈2 f), ease-in |
| Hold | 0–42 ms |
| Open | 100–125 ms (≈3 f), ease-out |
| Pill-eye shape | Squash the pill to Y ≈ 0.1 (a thin line, not 0), widen X +5–10% at the closed frame. Area preservation reads as a lid |
| Slow "smug" blink | close 125 ms, hold 150–250 ms, open 170 ms. Use deliberately, about 1 per reaction |
| Suppress blinks | during a "stare-down" or a confident hold. Fewer blinks = more intensity [S27] |
| Force a blink | on every head turn > 10°, every big look change, and at the start of each expression change |
| Cool vs cute | Cool: lower rate (every 4–7 s), slower deliberate blinks. Cute or nervous: frequent fast blinks (avoid) |

### 3.4 Eye darts (saccades)
- Animation practice: darts take **1–3 frames**, with about **80% of the travel on the first frame**. Pop to the new pose with **no in-betweens**, then add a **1-frame cushion**. [S28][S29]
- Bloop: darts "usually take 3 frames" (start, transition, end). Shifting the point of interest takes **3–4 frames**. Patterns: **left-right** (reading a partner's eyes), **up-down** (sizing someone up, dismissive), **triangle** (examining the room). [S19]
- Too much movement looks "soft and floaty". Too little looks "dead and lifeless". [S29]
- Big darts often get a blink on top of them. [S28]

**Dombi spec (inferred):**
- Dart: 33–50 ms travel (on a 60 Hz display, 2–3 render frames), then a 40–80 ms settle with ζ ≈ 0.9 and a 1 px overshoot.
- Hold between darts: random 0.6–2.5 s. While "thinking": 2–3 darts in 1.5 s, then a long hold.
- Pupil travel limit: about 25% of the eye width. Dombi's pill eyes can **translate as whole pills** inside an invisible face area, since the blob has no eye sockets.
- When listening to the learner speak: soft gaze toward the learner (camera), small up-down darts every 1–2 s, and slow nods. This reads as attentive, not bored.

### 3.5 Weight shifts and micro-motion
- Layer **2–3 incommensurate sine frequencies** (e.g. 0.27 Hz breath, 0.11 Hz sway, 0.043 Hz lean) so the composite never visibly repeats. The combined period of incommensurate frequencies is effectively infinite. (Inferred; the procedural-noise approach is described in [S15])
- Sway amplitude: rotation ±0.5–1.0°, x-offset ±1–2 px. Anything above ~2° reads as "dancing".
- **Idle breaks** (random, every 8–20 s): look-around, a small stretch, a glance at the UI element the learner should tap, a smirk flick. Pick by weighted random. Never play the same break twice in a row. [S15] + (inferred numbers)
- **Long-idle escalation** (Sonic tapping his foot, Mario falling asleep [S14]): after about 20–30 s of no input, Dombi checks an imaginary watch or shrugs. That's cooler than sleeping. Don't nag. (Inferred)

### 3.6 Anti-loop checklist
- [ ] No two idle parameters share a period.
- [ ] Blink interval is random, not keyed into the loop.
- [ ] The idle break is chosen at random, excluding the last one played.
- [ ] Breath amplitude is varied ±10% per cycle.
- [ ] Eyes and body are offset (overlap) so they never start a move on the same frame.

---

## 4. Talking and lip sync for a minimal mouth

### 4.1 Viseme sets
**Rhubarb Lip Sync** (6 basic + 3 optional; "between six and nine different mouth positions") [S30]

| Shape | Description | Sounds | Preston Blair name |
|---|---|---|---|
| A | Closed, slight lip pressure | P, B, M | MBP |
| B | Slightly open, clenched teeth | most consonants (K, S, T), EE | etc |
| C | Open | EH (men), AE (bat); in-between A/B → D | E |
| D | Wide open | AA (father) | AI |
| E | Slightly rounded, not wider than C | AO (off), ER (bird); in-between C/D → F | O |
| F | Puckered | UW, OW, W | U |
| G (opt) | Upper teeth on lower lip | F, V | FV |
| H (opt) | Tongue raised, between C and D in openness | long L | L |
| X (opt) | Idle/rest, must match the idle drawing | pauses | rest |

- Rhubarb tween rule: make A → C → D and B → C → D look smooth. C and E serve as the bridges. [S30]
- Default output frame rate for `.dat` export: 24. The output always starts at 0.00 s and ends on a closed mouth. [S30]
- Classic Preston Blair charts: around 8–12 core shapes. [S31]
- Duolingo World Characters: **20+ mouths per character**, with a viseme set "designed based on linguistic features". Timings come from in-house speech recognition and pronunciation models (word- and phoneme-level), mapped phoneme → viseme, and drive Rive state machine inputs in sync with audio. The mouth layer runs concurrently with the body layer. [S16]
- Rive has no built-in auto lip sync. Pattern: build viseme states, and drive a number or trigger input from code using timed viseme data (TTS engines such as Azure or Polly emit viseme events). [S32]

### 4.2 Fitting visemes to Dombi's bar mouth (inferred)
Dombi's mouth is rounded bars with an off-centre smirk. Map the visemes to **bar transforms**, not drawn shapes:

| Viseme | Bar treatment |
|---|---|
| X rest | Signature smirk: bar tilted ~6–10°, right end higher, offset right of centre |
| A (MBP) | Smirk bar flattened and slightly shortened (−10% length), "pressed" |
| B (consonant / EE) | Bar widened +15%, thin open gap (two bars 2–3 px apart) |
| C (EH) | Two bars, gap ≈ 25–35% of the mouth width, rounded rect |
| D (AA) | Gap ≈ 50–60%, the open shape becomes a rounded stadium |
| E (AO/ER) | Width −15%, gap ≈ 30%, corners rounded more |
| F (OO/W) | Width −40%, near-circle (pucker), shifted toward the smirk side |
| G (F/V) | Upper bar overlaps the lower (bite), optional |
| H (L) | Skip; reuse C |

- **Keep the off-centre pivot in every viseme** so Dombi talks out of the side of the mouth. This is the single strongest "cool, not cute" lip-sync cue. (Inferred)
- Minimal mascots fake talk with 3–4 shapes (rest, closed, mid, open), cycled on stressed syllables. This is acceptable for long passive narration. Full visemes matter for **teaching pronunciation**, which is this app's core, so use at least the Rhubarb 6 (A–F) + X. (Inferred)

### 4.3 Sync rules
| Rule | Value | Source |
|---|---|---|
| Lead the audio | Open the jaw/mouth **1–2 frames (≈40–80 ms) before** the sound | [S31] |
| Closed shapes (M/B/P) | Must fully close and **hold ≥2 frames (≈80 ms)**; never blend over them | [S31] |
| Don't pose every syllable | Hit the important shapes and blend the rest; the jaw moves far less than you think | [S31] |
| Opening vs closing | Snappy opening, eased closing; a closed mouth often marks the end of a word | [S33] |
| Minimum shape duration | Drop any viseme shorter than about 1 frame @24 (≈40 ms) and merge it into its neighbour | (inferred; prevents flicker) |
| Mute test | Watch with audio off: does it still read as speech? Then watch at half speed to catch drift | [S33] |
| Body accompaniment | Small squash/stretch (≈2–3%) and head tilt on stressed words; blink at phrase boundaries, not mid-word | (inferred, from S27's thought-change blink rule) |
| Interrupt | If the learner taps away, mouth → X within 80–120 ms, eased; never freeze open | (inferred; Duolingo stops the speech "in time" [S16]) |

Implementation note (inferred): pre-shift all viseme timestamps by −60 ms relative to audio start. That's simpler than per-key offsets and implements the "lead by 1–2 frames" rule globally.

---

## 5. Acting: cool, confident, smug vs bouncy-cute

### 5.1 Status in movement (Keith Johnstone, *Impro*, via summaries) [S34]
- **High status:** head held completely still, slow movements, steady eye contact. Holding the head still is a powerful high-status move.
- **Low status:** touching the head or face, fidgeting, "er" fillers, breaking eye contact and then glancing back ("status suicide").
- These are second-hand summaries of the book. The principle is widely used in acting.

### 5.2 Restraint in performance
- "Less is more" in naturalistic performance. Over-animating every syllable doesn't serve the shot. [S35]
- Shawn Kelly: little or no blinking reads as intensity. [S27]
- *Illusion of Life*: "Mushy action makes a mushy statement." Decisive motion reads as a decisive character. [S22]

### 5.3 Translating "cool" into Dombi numbers (inferred synthesis)

| Dimension | Kawaii / bouncy (avoid) | Cool / confident (target) |
|---|---|---|
| Rhythm | Constant motion, many small bounces | **Snap → hold**. Fast move (100–200 ms), then a still hold (0.6–2 s) |
| Overshoot | Bounce 0.4–0.6, 2–3 visible oscillations | Bounce 0–0.2 day-to-day, max 1 visible overshoot |
| Squash/stretch | 15–30% routinely | ≤5% routinely, 10–20% only at peaks |
| Idle motion | Big sway, hopping | Breath only, rotation ≤1°, mostly still |
| Blink rate | Frequent, fast | Every 4–7 s, occasional slow deliberate blink |
| Eyes | Big, round, sparkles, eye-smiles (^ ^) | Pills stay pills. Half-lids (top cut 20–40%) for smug or chill |
| Head tilt | Symmetric "aww" tilts | Asymmetric. Tilt plus one-sided mouth raise |
| Mouth | Wide open "D" grins | Smirk bar. Opens only for speech. The celebratory max is "C" plus a tilt |
| Hands | Waving, clapping (twinned) | One hand at a time: finger-gun, small point, thumbs-up, "OK". Pop in, hold, pop out |
| Reaction to correct | Jumps, confetti, squeals | A nod or a small "I knew you'd get it" point, a half-second hold, a micro-smirk. Big celebration only at lesson end |
| Reaction to wrong | Crying, droopy | Unbothered: a small wince or "hm" tilt, a quick blink, back to neutral in <700 ms. Never sad-face guilt |
| Speed of returning to neutral | Fast, bouncy | Slow, eased (300–600 ms). Confidence doesn't scramble |

### 5.4 Acting beats for a typical Dombi reaction (inferred)
1. **Eyes first** (0 ms): the look or expression change starts in the eyes.
2. **Thought blink** (40–100 ms): optional, marks the "realisation". [S27]
3. **Body pose** (80–150 ms after the eyes): the main action, which is fast.
4. **Mouth or hand accent** (2–4 frames after the body peaks): overlap.
5. **Hold** (500–1500 ms): the "cool" part. Keep it nearly still, with breath only.
6. **Release** (300–500 ms): ease back to idle and blend into the breath phase. No hard cut.

---

## 6. Making reactions feel rewarding

### 6.1 The beat structure
Anticipation → action → impact/hold → follow-through/settle → (secondary reward). Every source on game juice converges on **layered, redundant feedback**: animation + sound + particles + haptics for one event. Jonasson & Purho, "Juice it or lose it": "maximum output for minimum input". [S36][S37]

The Juice toolbox: screen shake (keep it small), hit-stop (freeze frames), particles, tweening/easing, squash & stretch ("a coin that scales up as it is collected reads as satisfying"). [S37]

The juice list from the Jonasson & Purho talk (secondary summary): tweening/easing, squash & stretch, sound, music, particles, screenshake, **eyes that track and blink**, screen flashes. [S38]

Vlambeer's "Art of Screenshake" (Jan Willem Nijman; recreation breakdown): animation → muzzle flash → hit reaction → knockback → camera lerp → screenshake → player knockback → **hit pause** → recoil → permanence (debris stays) → bigger bullets. [S39] (Order and contents come from a third-party recreation's index; no numbers were available.)

### 6.2 Hit-stop / hold frames
| Source | Value |
|---|---|
| Academic study (3DCG action) | Optimal hit-stop **0.1–0.2 s**; slow-motion **0.2–0.4 s** [S40] |
| Practitioner | "Freezing for even **50–100 ms** on a heavy hit makes it feel like it connected" [S37] |
| Unity preset table | Weak 0–0.03 s · Strong 0.05–0.08 s · Critical 0.10–0.15 s [S41] |
| Pixel-art practice | 6–10 frames (heavy), 12–18 frames (boss super) at 60 fps ≈ 100–170 / 200–300 ms [S40] |
| Key rule | "What matters is not the absolute values but the **difference**. The more restrained your weak tier, the harder the strong tier lands. Make everything flashy, and everything becomes ordinary." [S41] |
| Scope | Freeze only the actors involved, not the UI or audio [S40] |

**Translation to a learning app (inferred):** a correct-answer "impact" gets a **60–100 ms hold** on the peak pose of Dombi's reaction, and of the XP chip as it lands, before the settle spring. Lesson-complete gets a **120–180 ms hold** on the peak. Streak milestones get **200–300 ms** on the reveal frame, with the sound hit aligned to the start of the hold.

### 6.3 Overshoot and settle
- Pop-ins: scale 0 → 1.10–1.15 → 0.97 → 1.0 over 250–400 ms. That's the spring at bounce ≈ 0.3, or easeOutBack. (Inferred; matches the Apple 0.3 "noticeable bounciness" guidance [S10].)
- Numbers or counters: overshoot the final value by 0 (never overshoot a number; it reads as a bug), but scale-pulse the label to 1.15 on the final tick. (Inferred)

### 6.4 Stagger and offset
- Item step 30–75 ms, total ≤500–800 ms, first item undelayed. [S8]
- Flutter's cookbook: 50 ms stagger, 250 ms per item. [S8]
- Step ≈ 30–70% of the per-item duration so the items overlap. [S8]
- **Within Dombi:** body → eyes → mouth → hands, each offset 1–3 frames (40–125 ms). Twinning fix: "just a few frames difference will break things up nicely." [S24]

### 6.5 Layering recipe: correct answer (inferred, built from S37, S41, S16)
| t (ms) | Layer | What |
|---|---|---|
| 0 | UI | Check button → green state, haptic light impact |
| 0 | Sound | "Correct" chime (sound is the fastest channel; fire it at t = 0) |
| 30 | UI | Feedback banner slides up, 220 ms, emphasized-decelerate |
| 50 | Dombi | Eyes snap to the learner + slight widen (+8%), 60 ms |
| 90 | Dombi | Anticipation dip (Y 0.94), 80 ms |
| 170 | Dombi | Pop up / nod (Y 1.06), 100 ms |
| 270 | Dombi | **Hold 80 ms** on the peak (mini hit-stop) |
| 270 | Particles | 6–10 small sparks or stars from behind Dombi, 400–600 ms life, ease-out velocity, fade over the last 40% |
| 300 | Dombi | Hand pops in (thumbs-up or point), spring bounce 0.3, 250 ms |
| 350 | Dombi | Smirk widens (mouth bar +10% length, tilt +3°) |
| 350–900 | Dombi | Settle spring (bounce 0.15), then hold |
| ~1200 | Dombi | Hand pops out (150 ms, ease-in), back to idle |

Escalation tiers (the contrast rule from [S41]): **combo 3+** adds a bigger particle burst and a pitch-up on the chime (+1 semitone per combo step, capped). **Lesson complete** gets full-body celebration, a longer hold and a screen-level flash at ≤15% opacity. Keep the everyday tier small so the top tier lands.

### 6.6 Layering recipe: wrong answer (inferred)
- No hit-stop. No shake on Dombi; the shake belongs to the answer tile (±6 px, 3–4 decaying cycles, 300–350 ms).
- Dombi: a quick wince blink (fast blink, 200 ms), head tilt 4°, mouth flattens to "hm", hold 400 ms, ease back over 400 ms.
- Sound: soft, low, short. Never a buzzer for a teen or adult audience.
- Total ≤ 900 ms, so the learner gets straight back to trying.

---

## 7. Common mistakes that make animation look cheap

| Mistake | Why it looks cheap | Fix | Source |
|---|---|---|---|
| Linear easing | Nothing in nature starts or stops instantly | ease-out to enter, ease-in to exit, springs for interruptible moves | [S4][S1] |
| Everything moves at once (all parts start on one frame) | Reads as a "puppet on one string", mechanical | Offset parts 1–3 frames; eyes lead, hands follow | [S1][S24] |
| Twinning (symmetry) | "A little mechanical, a little stiff" | Lead with one side and offset by a few frames; asymmetric poses (Dombi's off-centre smirk is built-in asymmetry; keep it) | [S24][S42] |
| No holds | Constant motion is exhausting and reads as nervous | Snap → hold; let poses read for ≥0.5 s | (inferred) [S22] |
| Over-animation (every syllable, every beat) | Mushy, busy, kills clarity | Hit key shapes only; blend the rest | [S31][S35] |
| Constant identical loop | Viewers spot the repeat → robotic | Random blinks, incommensurate cycles, idle breaks | [S14][S15] |
| Too-long UI animations | Feels like a delay | 100–400 ms for UI; skippable celebrations | [S4][S6] |
| Same intensity for every reward | Nothing feels special | Tiered feedback with restrained low tiers | [S41] |
| Bouncy everything (bounce > 0.4) | Cartoony or kawaii, cheap-toy feel | Bounce ≤0.15 default; 0.3 for pops; 0.4 max at peaks | [S10] |
| Blink every N seconds | Clockwork | Random interval, motivated blinks | [S27] |
| Eyes that never move | "Dead and lifeless" | Saccades every 0.6–2.5 s | [S29] |
| Floaty eye moves | Eased darts look "soft and floaty" | Pop on 1 frame + 1-frame cushion | [S29] |
| Squash from the centre | The character floats, with no ground contact | Pivot at the contact point | (inferred) |
| Volume not preserved | Shape "inflates" | scaleX × scaleY ≈ 1 | [S1] |
| Exaggerated squash on a "cool" character | Undermines the attitude | ≤5% routine | (inferred) |
| Expression changes mid-action | Unnoticed or muddy | Change the face at the start or end of the move | [S1] |
| Ignoring Reduce Motion | Accessibility failure; vestibular users | Respect OS reduce-motion: drop squash, shake, particles; keep crossfades | [S4] |
| Hard cut back to idle | A visible pop | Blend 200–400 ms into the idle state; match the breath phase | (inferred) |

---

## 8. Dombi quick-reference card (all inferred unless cited)

```
FPS math        : frames@24 × 41.7 = ms
Breath          : 3.2–4.0 s, ±10% random, scaleY +1.5% / X −1.5%, inhale 40% / exhale 60%
Sway            : rot ±0.5–1°, x ±1–2 px, incommensurate periods (e.g. 3.7 s, 9.1 s, 23 s)
Blink           : every 2.5–6 s random (cool: 4–7 s); close 2f / hold 0–1f / open 3f [S19];
                  15–20% double; slow-smug blink 125/200/170 ms
Eye dart        : 1–3 f [S28], 80% on frame 1, 1-frame cushion [S29]; hold 0.6–2.5 s
Lip sync        : Rhubarb A–F + X [S30]; lead audio 40–80 ms [S31]; MBP hold ≥80 ms [S31];
                  keep the smirk pivot in every viseme
Squash routine  : ≤5%; peaks 10–20%; pivot bottom; X = 1/Y
Springs         : settle bounce 0.15 (ζ .85); pop 0.3 (ζ .7); max 0.4 [S10]
UI durations    : press 50–80, select 100–150, banner 200–250, screen 250–350 ms [S2][S4]
Easing          : enter (0.05,0.7,0.1,1); exit (0.3,0,0.8,0.15); standard (0.2,0,0,1) [S2]
Hit-stop        : correct 60–100 ms; lesson end 120–180; milestone 200–300 [S40][S41]
Stagger         : 30–75 ms/item, ≤800 ms total [S8]; Dombi parts offset 1–3 f
Reaction beats  : eyes → blink → body → accent → HOLD → ease back
Cool rule       : snap fast, hold still, move less than you want to
```

---

## Sources

- [S1] Wikipedia, "Twelve basic principles of animation" (citing Thomas & Johnston, *The Illusion of Life*, 1981): https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation
- [S2] Material Design 3 motion tokens (material-web, generated tokens v0.192): https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-motion.scss (overview: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [S3] Material Design v1, "Duration & easing": https://m1.material.io/motion/duration-easing.html
- [S4] Nielsen Norman Group, "Executing UX Animations: Duration and Motion Characteristics": https://www.nngroup.com/articles/animation-duration/
- [S5] MUI v4 `transitions.js`: https://app.unpkg.com/@material-ui/core@4.12.4/files/es/styles/transitions.js
- [S6] Val Head, "How fast should your UI animations be?": https://valhead.com/2016/05/05/how-fast-should-your-ui-animations-be/
- [S7] Steve Swink, *Game Feel* (via Wikipedia and secondary sources): https://en.wikipedia.org/wiki/Game_feel ; https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient ; https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-07-Interfaces.pdf
- [S8] Stagger conventions: Flutter staggered menu cookbook https://docs.flutter.dev/cookbook/effects/staggered-menu-animation ; LogRocket https://blog.logrocket.com/css-staggered-animations/ ; react-ui-animate https://react-ui-animate.js.org/docs/animation-modifier/withStagger ; DEV https://dev.to/j3nnning/stagger-animations-with-scss-2k2o
- [S9] Phaser Back easing (overshoot 1.70158): https://docs.phaser.io/api-documentation/namespace/math-easing-back ; cubic-bezier y-range: https://www.cssportal.com/css-cubic-bezier-generator/ ; https://easings.net/
- [S10] Apple WWDC23 "Animate with springs" (session 10158): https://developer.apple.com/videos/play/wwdc2023/10158/
- [S11] AndroidX `SpringForce.java` source: https://raw.githubusercontent.com/androidx/androidx/androidx-main/dynamicanimation/dynamicanimation/src/main/java/androidx/dynamicanimation/animation/SpringForce.java ; guide: https://developer.android.com/develop/ui/views/animations/spring-animation
- [S12] react-spring config presets (source): https://raw.githubusercontent.com/pmndrs/react-spring/main/packages/core/src/constants.ts
- [S13] Josh W. Comeau, "A Friendly Introduction to Spring Physics": https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/
- [S14] Wikipedia, "Idle animation": https://en.wikipedia.org/wiki/Idle_animation
- [S15] Idle-loop practice: Polycount threads https://polycount.com/discussion/comment/2358733/ ; Blender Artists https://blenderartists.org/t/character-breathing/1208159 ; Life Spark (vendor) https://www.renderhub.com/oldhiccup/life-spark
- [S16] Duolingo blog, "World character visemes" (Rive): https://blog.duolingo.com/world-character-visemes
- [S17] Blink duration summaries: https://www.somatechnology.com/blog/thursday-thoughts/fast-average-blink ; https://www.medicalnewstoday.com/articles/323963
- [S18] PMC9899223, blink-rate study (mean 16.04/min): https://pmc.ncbi.nlm.nih.gov/articles/PMC9899223
- [S19] Bloop Animation, "How to animate blinks and eye movement": https://www.bloopanimation.com/blinking-animation/
- [S20] Richard Williams, *The Animator's Survival Kit* (table of contents via catalog): https://bdu.siu.edu.ar/bdu/Record/B-45-63356/TOC ; https://www.awn.com/print/animationworld/animators-survival-kit-most-valuable-how-animate-book-you-will-ever-want-own
- [S21] UW bouncing-ball tutorial ("mushy" squash): https://courses.cs.washington.edu/courses/cse458/OLD_au08/projects/project7/bouncing%20ball/ball.html ; https://design.tutsplus.com/tutorials/animation-for-beginners-how-to-animate-squash-and-stretch--cms-26330
- [S22] Habrador, "The illusion of life, or why you should animate flour sacks": https://blog.habrador.com/2018/02/the-illusion-of-life-or-why-you-should.html
- [S23] Computer History Museum, "Pixar's Luxo Jr.": https://computerhistory.org/blog/pixars-luxo-jr/ ; https://en.wikipedia.org/wiki/Luxo_Jr.
- [S24] Animator Island, "Defining the Art: Twinning": https://www.animatorisland.com/defining-the-art-twinning/
- [S25] BMCC flour sack assignment: https://openlab.bmcc.cuny.edu/ani-260-1300-intro-2d-animation-sp-2021/flour-sack-assignment-extra-credit
- [S26] Blink timing (2 close / 1 hold / ~8 open; general timing chart): https://tyang.myblog.arts.ac.uk/?p=312 ; https://playbooks.com/skills/dylantarre/animation-principles/timing-mastery
- [S27] Shawn Kelly, Animation Mentor newsletter, "Blinks Have Meaning!" (Nov 2005): https://newsletters.animationmentor.com/newsletter/1105/feature_tiptricks.html
- [S28] Eye-dart timing (2–3 frames, 80% on frame 1): https://marianna3dcomputeranimation.myblog.arts.ac.uk/?p=420 ; https://blog.animschool.edu/?p=17
- [S29] Animation Apprentice, "How to animate eye darts": https://www.animationapprentice.org/blog/how-to-animate-eye-darts.html
- [S30] Rhubarb Lip Sync (README): https://github.com/DanielSWolf/rhubarb-lip-sync
- [S31] Pluralsight, "Proven Tips for Animating Believable Lip Sync": https://www.pluralsight.com/resources/blog/software-development/proven-tips-animating-believable-lip-sync ; Toon Boom mouth charts: https://learn.toonboom.com/modules/lip-sync-animation1/topic/mouth-charts1
- [S32] Rive forum, lip sync: https://rive.app/community/forums/support/fsnLLkXUaA62/lip-sync/ftyrdnSzhsd7 ; DEV (Rive viseme pipeline): https://dev.to/uianimation/building-duolingo-style-ai-mascot-animations-with-rive-2446
- [S33] Lip-sync technique roundups: https://www.highonfilms.com/lip-sync-animation-techniques-every-character-animator-should-know/ ; https://www.figma.com/resource-library/lip-sync-animation/
- [S34] Keith Johnstone, *Impro*, status (summaries): https://jamesclear.com/book-summaries/impro ; https://alexanderweichart.de/3_Resources/Impro---Status-Tricks-(book-notes) ; https://performativebafflement.substack.com/p/improv-techniques-to-be-better-at
- [S35] Gnomon, "Subtle Performance Workflow Vol. 1": https://www.thegnomonworkshop.com/blog/subtle-performance-workflow-vol-1/ ; Lupin House restraint course: https://www.skool.com/lupin-house-animation-6588
- [S36] Brad Woods, "Juice" (digital garden; quotes Jonasson & Purho): https://garden.bradwoods.io/notes/design/juice
- [S37] Wayline, "The juice toolbox": https://www.wayline.io/learn/game-feel/1
- [S38] "Juice it or lose it" (Jonasson & Purho, 2012) summaries: https://rpgplayground.com/?p=3339 ; https://gamemaker.io/en/blog/coffee-break-tutorials-juicy-screenshake-dnd
- [S39] "Art of Screenshake" (Jan Willem Nijman) recreation: https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog ; course listing (44 min): https://mywebspace.quinnipiac.edu/jbwarren/archive/2018-410/class-04.html
- [S40] Hit-stop research and practice: IEICE study https://ken.ieice.org/ken/paper/20230315OCSt/eng/ ; SciTePress 2024 https://www.scitepress.org/Papers/2024/124614/124614.pdf ; https://bugnet.io/blog/how-to-fix-hitstop-or-freeze-frame-feeling-off ; https://gamineai.com/blog/pixel-art-combat-fx-hitstop-smear-frames-impact-timing-2026
- [S41] UhiyamaLab, "Game feel primer: hit stop, flash, shake, sound": https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/
- [S42] Animation Mentor on twinning and contrast in poses: https://newsletters.animationmentor.com/newsletter/0307/feature_geek.html

Not reachable or unread this session (claims not used): Vlambeer's original screenshake post (404), Apple HIG Motion page (JS-rendered, body not retrieved), the M3 and M2 spec pages (JS-rendered; the token file was used instead), the wwdcnotes page (404), and the full Survival Kit text.
