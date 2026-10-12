# 4. Particle effects and "juice" for Akademiya English

Research brief for an AI agent designing feedback effects (to be built in Rive).
Brand: flat 2D, rounded rects / circles / rounded triangles, no outlines, no gradients.
Palette: violet #7B5CFF, coral, gold #FFC800-ish, green, ice blue #5BC8F5, orange flame.
Mascot: Dombi, a black round blob with white pill eyes (cool, not kawaii).

Conventions in this file:
- Phone reference frame is 390 x 844 pt (iPhone 14/15 class). Distances are in pt, speeds in pt/s,
  times in ms. 60 fps assumed; 1 frame = 16.7 ms.
- "(inferred)" = my synthesis or a value tuned from experience, not stated by a source.
- "(knowledge)" = well-known value quoted from general knowledge where the page I fetched was not readable.

---

## 0. TL;DR for the designing agent

1. Juice is layered and staggered: flash -> ring -> burst -> linger. Offsets of 60-150 ms between
   layers read as "responsive but legible"; firing all at t=0 reads as one undifferentiated flash
   (dev.to "The reward moment is the product").
2. Escalate in tiers. Correct answer = small (no confetti). Lesson complete = medium. Perfect /
   level up / milestone streak = large. Confetti is reserved for medium and above.
3. Particles must move *toward meaning*: away from the source in a burst, then toward the counter
   (XP, streak, gems). The eye should end on the number that changed.
4. Keep it short. Small effects finish in <= 600 ms; large ones peak inside 1.2 s and are fully
   gone by 2.5-3.5 s. Never block input while particles play (Apple HIG Motion).
5. Flat shapes only: circles, pills, rounded squares, rounded diamonds, 4-point "twinkle" made from
   two crossed pills. Avoid concave star polygons from SVG import (crashed our Rive importer).
6. 2-3 hues per effect, pulled from the palette, plus white as a "spark" accent. Colour = meaning
   (gold = XP/reward, orange = streak, ice blue = freeze, violet = brand/level, green = correct).
7. Wrong answers get no celebratory particles. Use a short horizontal shake of the answer element,
   coral colour state, REJECT/error haptic, and a soft sound. No screen shake on the whole UI.
8. Reduce Motion: drop all travelling particles, screen motion, scale overshoot and shake; keep
   colour change, opacity cross-fades, counters (instant or fast), haptics and sound.
9. Budget: <= 40 live particles for small, <= 120 for large on a phone; one burst system at a time
   plus at most one ambient emitter.
10. Pair every visual beat with exactly one haptic and one sound, matched in intensity and sharpness
    (Apple HIG Playing haptics).

---

## 1. Particle vocabulary and parameters

### 1.1 Core vocabulary (engine-neutral)

| Term | Meaning | Unity name | Godot CPUParticles2D name (default) | canvas-confetti name |
|---|---|---|---|---|
| Count / amount | Particles per burst or alive at once | Max Particles, Burst count | `amount` (8) | `particleCount` (50) |
| Burst vs stream | All at once vs continuous emission | Emission > Bursts vs Rate over Time | `explosiveness` 0..1 (0 = stream, 1 = burst) | one call = burst; call per frame = stream |
| Emission shape | Point, circle, ring, line, rect area | Shape module | `emission_shape` (point) | `origin` point only |
| Direction / angle | Centre direction of launch | Shape rotation | `direction` (1,0) | `angle` (90 = up) |
| Spread | Cone half/full width around direction | Shape angle | `spread` (45 deg, half-angle) | `spread` (45 deg, full width) |
| Initial speed | Launch speed range | Start Speed | `initial_velocity_min/max` (0/0) | `startVelocity` (45 px/frame) |
| Gravity | Constant acceleration (usually down) | Gravity Modifier | `gravity` (0, 980 px/s^2) | `gravity` (1 -> 3 px/frame) |
| Drag / damping | Velocity loss over time | Limit Velocity > Drag | `damping_min/max` (0) | `decay` (0.9 per frame) |
| Drift / wind | Constant sideways push | Force over Lifetime | `linear_accel`, `tangential_accel` | `drift` (0) |
| Lifetime | Time each particle exists | Start Lifetime | `lifetime` (1.0 s), `lifetime_randomness` (0) | `ticks` (200 frames ~ 3.3 s) |
| Start size / scale | Initial size range | Start Size | `scale_amount_min/max` (1/1) | `scalar` (1 ~ 10 px piece) |
| Size over life | Curve multiplying size across lifetime | Size over Lifetime | `scale_amount_curve` | none (constant) |
| Rotation / spin | Start angle and angular velocity | Start Rotation, Rotation over Lifetime | `angle_min/max`, `angular_velocity_min/max` | `tiltAngle` +0.1 rad/frame, `wobble` |
| Colour over life | Gradient across lifetime | Color over Lifetime | `color_ramp`, `hue_variation` | none |
| Fade | Alpha ramp, usually at end | Color over Lifetime alpha | colour ramp alpha | alpha = 1 - progress (linear) |
| Randomness | Per-particle variation of every param | "Random Between Two Constants" | `randomness` (0) | built in (see 1.2) |
| Seed | Same/different randomisation each play | Auto Random Seed | `seed`, `use_fixed_seed` | `Math.random` each fire |
| Simulation space | Particles follow the emitter or stay put | Simulation Space local/world | `local_coords` (false) | world (canvas) |

Sources: Unity Main module docs; Godot CPUParticles2D class reference (defaults extracted from
`doc/classes/CPUParticles2D.xml`); canvas-confetti `src/confetti.js`.

Note on spread: Godot's `spread` is a half-angle (45 = 90 deg cone). canvas-confetti's `spread` is
the full cone (45 = +/-22.5 deg). Always state which one in a spec. In this doc, **spread = full cone**.

### 1.2 canvas-confetti defaults (read from source, `src/confetti.js`)

```
particleCount: 50
angle: 90            // degrees, 90 = straight up
spread: 45           // full cone width, degrees
startVelocity: 45    // px per frame
decay: 0.9           // velocity multiplier per frame (drag)
gravity: 1           // multiplied by 3 internally -> +3 px/frame downward
drift: 0             // px/frame sideways
ticks: 200           // frames of life (~3.3 s at 60 fps)
x: 0.5, y: 0.5       // origin, fraction of viewport
shapes: ['square', 'circle']   // 'star' also built in
zIndex: 100
colors: ['#26ccff','#a25afd','#ff5e7e','#88ff5a','#fcff42','#ffa62d','#ff36ff']
disableForReducedMotion: false // comment in source: "probably should be true, but back-compat"
scalar: 1
flat: false          // true disables the 3D tilt/wobble
```

Per-particle randomisation in `randomPhysics()`:
- velocity = startVelocity * 0.5 + random * startVelocity -> 0.5x..1.5x (22.5..67.5 px/frame by default)
- angle = angle +/- spread/2, uniform
- wobble phase random 0..10, wobbleSpeed 0.05..0.11 rad/frame (wobble radius 10 * scalar px)
- tiltAngle 0.25pi..0.75pi, then +0.1 rad/frame (the "paper flipping" look)
- colour = `colors[i % colors.length]` (round-robin, so the mix is even)
- shape = random pick from `shapes`

Per-frame update in `updateFetti()`:
- x += cos(a) * v + drift; y += sin(a) * v + gravity*3; v *= decay
- alpha = 1 - tick/ticks (linear fade over the whole life)

What that means physically (inferred from the maths):
- With decay 0.9 total launch travel ~ v / (1 - 0.9) = 10v -> 225..675 px. Most travel happens in the
  first ~20 frames (330 ms): v is 12% of start after 20 frames.
- Gravity is *not* accelerating: it is a constant +3 px/frame (180 px/s) fall. That is why
  confetti looks like it floats down like paper. Copy this: real paper confetti has terminal velocity.
- Linear alpha over 3.3 s means pieces are half-transparent by 1.6 s. For a UI, a later, faster fade
  reads crisper (see 1.4).

Official demo presets (from the repo's `index.html`):

| Preset | Settings |
|---|---|
| Basic cannon | particleCount 100, spread 70, origin.y 0.6 |
| Random direction | angle 55..125, spread 50..70, particleCount 50..100, origin.y 0.6 |
| Realistic look (5 layered fires, total 200) | 25% spread 26 startVelocity 55; 20% spread 60; 35% spread 100 decay 0.91 scalar 0.8; 10% spread 120 startVelocity 25 decay 0.92 scalar 1.2; 10% spread 120 startVelocity 45. origin.y 0.7 |
| Stars | spread 360, ticks 50, gravity 0, decay 0.94, startVelocity 30, gold colours FFE400/FFBD00/E89400/FFCA6C/FDFFB8; 40 stars scalar 1.2 + 10 circles scalar 0.75; fired 3 times at 0/100/200 ms |
| Fireworks | 15 s; every 250 ms two bursts at random x (0.1-0.3, 0.7-0.9); startVelocity 30, spread 360, ticks 60; count = 50 * timeLeft/duration |
| Snow | particleCount 1 per frame, startVelocity 0, ticks 200..500, white circles, gravity 0.4..0.6, scalar 0.4..1, drift -0.4..0.4 |
| School pride | 2 particles per frame from each side, angle 60/120, spread 55, origin.x 0/1, 2 colours |
| Emoji | shapeFromText, scalar 2, spread 360, ticks 60, gravity 0, decay 0.96, startVelocity 20; 30 big + 5 + 15 small circles |

Key lesson from "Realistic look": one burst = several sub-emitters with different spread, speed,
decay and size. Narrow-fast core + wide-slow halo + a few big slow pieces. That layering is what
stops a burst looking like a uniform cone.

Key lesson from "Stars": the sparkle look = no gravity, high drag (0.94), short life (50 frames
~0.8 s), 360 deg spread, fired 3x at 100 ms intervals. Three small pops beat one big pop.

### 1.3 Converting web px/frame to Rive / pt units (inferred)

- canvas-confetti px are CSS px, which equal iOS pt.
- px/frame x 60 = pt/s. startVelocity 45 -> 2700 pt/s nominal, but with decay 0.9 the *effective*
  displacement is what matters: ~450 pt average, ~70% of it in the first 200 ms.
- In a keyframed Rive timeline, fake drag with an ease-out curve (cubic-bezier(0.16, 1, 0.3, 1),
  "easeOutExpo" (knowledge)) on the launch position, then a separate linear or ease-in Y track for
  the fall. Split X/Y tracks give the arc for free.

### 1.4 Default recipes per effect (phone, 390 x 844 pt)

All counts are per trigger. Speed = initial launch speed for a physics emitter; "travel" = where the
particle ends up, which is what you key in a Rive timeline. Size = longest side.

#### A. Confetti burst (lesson complete / perfect / level up)

| Param | Medium (lesson complete) | Large (perfect / level up) |
|---|---|---|
| Emission | 2 cannons at bottom-left & bottom-right corners, or 1 point behind the hero | 2 cannons + 1 top "rain" band |
| Count | 40-60 | 80-120 (spread over 2-3 waves) |
| Direction / spread | 60 deg and 120 deg, spread 55 (side cannons) or 90 deg spread 70 (centre) | as medium + top rain spread 360, speed ~0 |
| Travel | 300-500 pt (to roughly 60-80% screen height) | same, second wave 20% shorter |
| Drag | strong: 85% of travel done in first 250 ms | same |
| Gravity / fall | constant fall 120-200 pt/s after apex (paper terminal velocity) | same |
| Lifetime | 1.6-2.2 s | 2.2-3.0 s |
| Size | 8-14 pt (rects 8x14, circles 8-10) | add 10% "hero" pieces at 16-18 pt |
| Spin | 180-720 deg/s; fake 3D flip by scaling X 1 -> -1 -> 1 every 300-600 ms | same |
| Wobble | sideways sine 6-10 pt amplitude, 0.8-1.6 Hz | same |
| Colour | 3 hues (e.g. violet, gold, coral) + ~10% white | add green or ice blue only if it carries meaning |
| Fade | alpha 1 until 70% of life, then to 0 over the last 30% | same |
| Waves | 1 | 3 waves at 0 / 250 / 600 ms, each ~1/3 of count |

Based on canvas-confetti defaults/presets; the late-fade curve and size in pt are (inferred).

#### B. Sparkle / twinkle (ambient on hero, gems, perfect badge)

| Param | Value |
|---|---|
| Emission | Rect or circle area hugging the object (+10-20 pt outside its bounds) |
| Mode | Stream, low rate: 3-6 spawned per second, 3-8 alive at once |
| Speed | 0-10 pt/s (essentially stationary), no gravity |
| Lifetime | 500-900 ms each |
| Size | 6-14 pt 4-point twinkle (two crossed pills) or 4-6 pt dot |
| Scale over life | 0 -> 1.0 at 35% (ease-out back) -> 0 at 100% (ease-in) |
| Rotation | start 0 or 45 deg, spin 45-90 deg over life |
| Colour | white or pale gold on dark; gold on light; 1 hue + white |
| Fade | none needed; the scale-to-zero is the fade |
| Randomness | position random, size +/-40%, lifetime +/-30% |

Derived from canvas-confetti "Stars" preset (gravity 0, high drag, short life) plus classic UI
twinkle practice (inferred).

#### C. Star pop on correct answer (small tier)

| Param | Value |
|---|---|
| Emission | Point = centre of the answered tile or the check icon |
| Count | 6-10 (do not exceed 12) |
| Spread | 360 deg, evenly distributed angles + random jitter +/-15 deg |
| Travel | 40-80 pt (stay within ~1.5x the tile's radius) |
| Easing | ease-out (drag), 90% of travel in first 180 ms |
| Gravity | 0 (or tiny 20-40 pt/s) |
| Lifetime | 350-500 ms |
| Size | 6-10 pt rounded diamond / circle / short pill pointing outward |
| Scale over life | 1.0 -> 0.0, ease-in, starting at 40% of life |
| Colour | green + white (or green + gold); 2 hues max |
| Extras | 1 ring (see H) at 0 ms; tile scale punch 1.0 -> 1.08 -> 1.0 in 180 ms |

(inferred; scale anchored on stars preset and "seasoning not meal" advice.)

#### D. Coin / XP fly-to-counter

| Param | Value |
|---|---|
| Emission | Source = the XP number or chest; destination = XP counter in header |
| Count | 5-12 tokens (count is symbolic, not 1 per XP) |
| Phase 1 burst | tokens pop out radially 30-60 pt, 150-220 ms, ease-out, small random rotation |
| Hold | 40-100 ms hover (anticipation) |
| Phase 2 flight | quadratic bezier to the counter, control point above the midpoint (arc height 60-140 pt); ease-in at launch, ease-out into the counter |
| Flight time | 450-700 ms each |
| Stagger | 40-80 ms between tokens (fly_to_target example: 60 ms stagger, 1000 ms total) |
| Scale | 1.0 at launch -> 0.6-0.7 on arrival (perspective toward the HUD) |
| Arrival | each hit: counter scale punch 1.0 -> 1.15 -> 1.0 (120 ms), +N ticks, light haptic on the first and last only |
| Counter | rolls up over the flight window, finishing with the last token |
| Colour | gold token (circle with a white pill highlight), 1 hue + white |
| Trail | optional 2-3 fading dots behind each token, 30% opacity |

Sources: fly_to_target docs (60 ms stagger, bezier/parabolic paths); arc + ease-in/out advice from
coin-pickup tween guidance; counter punch (inferred).

#### E. Streak flame embers

| Param | Value |
|---|---|
| Emission | Line or small ellipse at the base/upper half of the flame |
| Mode | Stream during the streak screen; 6-12 per second, 8-15 alive |
| Direction | up (angle 90), spread 30-40 |
| Speed | 60-140 pt/s, decreasing (drag) |
| Gravity | negative (buoyancy) -20 to -60 pt/s^2, or simply constant upward drift |
| Wobble | sideways sine 4-8 pt, 1.5-3 Hz (flicker) |
| Lifetime | 600-1100 ms |
| Size | 3-7 pt circles / short pills aligned to velocity |
| Scale over life | 1.0 -> 0.2 |
| Colour over life | gold/yellow -> orange flame -> coral (warm shift), alpha 1 -> 0 over last 40% |
| On +1 increment | one-shot burst of 12-20 embers upward, speed x2, plus flame scale punch |

Duolingo idle flame (third-party CSS reconstruction): 2 s loop scaling 1 -> 1.05 and rotating up to
2 deg; "at risk" state: 0.8 s loop, scale to 1.1, +/-3 deg. Use as a reference for idle vs urgent.

#### F. Snow / ice frost ("streak freeze used")

| Param | Value |
|---|---|
| Phase 1 frost-in | ice tint/shape grows over the flame or calendar day, 250-400 ms |
| Burst | 10-16 ice shards: small rounded diamonds and pills, 360 deg, travel 30-70 pt, 300-450 ms, ease-out, no gravity |
| Linger | snow stream: 1 flake per 80-120 ms, 6-10 alive, speed 20-50 pt/s down, drift +/-15 pt/s, life 1.2-2.0 s |
| Size | flakes 3-6 pt circles; shards 6-10 pt |
| Spin | shards 90-270 deg/s; flakes none |
| Colour | ice blue #5BC8F5 + white (+ pale ice tint); 1 hue + white |
| Fade | flakes fade over the last 40%; shards scale to 0 |

Based on canvas-confetti "Snow" preset (startVelocity 0, gravity 0.4-0.6, scalar 0.4-1,
drift -0.4..0.4, white circles); Duolingo uses a blue snowflake in the calendar and a melting ice
block for refills (deconstructoroffun). Shard burst values (inferred).

#### G. Dust puff on landing (Dombi lands, a card drops in, a badge slams)

| Param | Value |
|---|---|
| Emission | Line along the contact edge, width = 60-80% of the object width |
| Count | 6-10 |
| Direction | sideways and slightly up: two cones at 160-180 deg and 0-20 deg, spread 20 |
| Travel | 20-50 pt, strong drag |
| Lifetime | 300-450 ms |
| Size | 8-16 pt circles, grow 1.0 -> 1.4 while fading |
| Colour | neutral: brand-tinted light grey or 15-20% violet tint on light bg; never a celebration hue |
| Fade | alpha 0.6 -> 0, ease-out |
| Pair with | object squash 1.0 -> (1.12 x, 0.88 y) -> 1.0 over 150-200 ms |

(inferred; squash with volume preservation per game-feel guidance.)

#### H. Glow ring / shockwave

| Param | Value |
|---|---|
| Shape | Circle *stroke* is an outline; on a no-outline brand use a filled ring = big circle minus inner circle, or a filled circle that fades (no stroke) |
| Start radius | 0.6-0.8x the object radius |
| End radius | 1.6-2.2x (small tier), 2.5-4x (large tier) |
| Ring thickness | start 6-10 pt, thinning to 1-2 pt at end |
| Duration | 300-450 ms, ease-out (cubic or expo) |
| Alpha | 0.8 -> 0 (linear or ease-in) |
| Colour | tier colour at 60-80% opacity; or white on a coloured hero |
| Count | 1 for small; 2 for large, second 120 ms later and 20% smaller |

Brand note (inferred): "no gradients" means do not fake glow with radial blur. Use 2-3 concentric
flat circles at decreasing opacity (e.g. 20% / 12% / 6%) instead. That is still flat.

#### I. "Level up" fountain

| Param | Value |
|---|---|
| Emission | Point or short line under the level badge |
| Mode | 900 ms burst-stream (explosiveness ~0.3): 60-90 particles emitted over 900 ms |
| Direction | up, spread 30-45 |
| Speed | 500-800 pt/s (reaches 250-400 pt high), then falls under gravity 900-1200 pt/s^2 |
| Lifetime | 1.2-1.8 s |
| Size | 8-14 pt, mix of rounded rects, circles, rounded diamonds |
| Spin | 180-540 deg/s |
| Colour | violet + gold + white (brand + reward); 2 hues + white |
| Accompany | badge anticipation squash (0.92) 120 ms -> pop to 1.2 -> settle 1.0; ring x2; sparkle linger 1.5 s |

(inferred; fountain shape mirrors canvas-confetti "realistic" layered cone but upward and with real
accelerating gravity so it reads as a fountain, not floating paper.)

### 1.5 Randomness rules (inferred, consistent with all engines above)

- Randomise *every* particle on at least: angle, speed (+/-50%), size (+/-30-40%), lifetime
  (+/-20-30%), start rotation (0-360), spin direction (50/50 sign, Unity "Flip Rotation").
- Keep *colour distribution even* (round-robin like canvas-confetti), randomise *order*.
- Use a fresh seed per play (Unity Auto Random Seed). In a hand-keyed Rive timeline, build
  3-4 variant timelines and pick one at random (Rive Formula Converter `ceil(random(0,N))` pattern
  from the Rive "holiday spinning loader" data-binding tutorial).
- Avoid perfectly even angles for bursts > 8 particles; jitter +/-10-15 deg so it does not look like a
  clock face.

---

## 2. Composition rules

### 2.1 The layer stack (front to back in time)

| Order | Layer | Job | Typical start | Typical length |
|---|---|---|---|---|
| 0 | Anticipation | wind-up: squash, dim, tiny pull-back | -120..0 ms | 80-150 ms |
| 1 | Flash | tells "now"; full-object brighten or white overlay at 40-70% | 0 ms | 60-120 ms |
| 2 | Scale punch | the object itself pops | 0 ms | 150-250 ms |
| 3 | Ring / shockwave | marks the centre, expands outward | 0-40 ms | 300-450 ms |
| 4 | Burst | the energy, radial particles | 40-80 ms | 350-900 ms |
| 5 | Payload | number / text / counter updates | 120-200 ms | 300-800 ms |
| 6 | Linger | sparkles, embers, falling confetti | 300+ ms | 0.6-2 s |
| 7 | Settle | everything returns to rest; UI ready | - | input never blocked |

The 0 / 80 / 140 ms offsets for spark / fountain / count-up and the "60-150 ms band" come from the
dev.to reward-moment breakdown (total ~400 ms for a reward tap). Anticipation, action,
follow-through framing is standard VFX timing. Specific per-layer lengths are (inferred).

### 2.2 Beat timelines

**Small: correct answer (total <= 600 ms)**
```
t=0     tap/answer accepted; tile turns green; haptic success-light; "ding" sound
t=0     tile scale 1.00 -> 1.08 (90 ms, ease-out) -> 1.00 (110 ms, ease-in-out)
t=20    ring from tile centre, 0.7x -> 1.8x radius, 320 ms, alpha 0.7 -> 0
t=60    6-10 star pops, 40-80 pt, 400 ms
t=120   feedback banner slides up (Duolingo: translateY 100% -> 0 in 200 ms ease-out)
t=600   all particles gone; CONTINUE enabled from t=0 (never wait)
```

**Medium: lesson complete (total ~2.2 s visible, interactive from ~600 ms)**
```
t=0     screen transition in; Dombi enters (anticipation squash)
t=200   Dombi lands: dust puff + squash; haptic impact-medium
t=350   flash on the "Lesson complete" card (white overlay 50% -> 0, 100 ms)
t=350   ring x1 (2.5x), confetti side cannons 2 x 25 pieces
t=500   stat chips (XP, accuracy, time) stagger in, 80 ms apart
t=700   XP tokens fly to counter (8 tokens, 60 ms stagger, 550 ms each); counter rolls
t=1300  last token lands: counter punch; haptic success
t=1300+ confetti falls/fades until ~2.2 s; sparkles on Dombi optional
```

**Large: perfect lesson / level up / milestone (peak inside 1.2 s, gone by ~3.5 s)**
```
t=0     dim backdrop 0 -> 40% (150 ms), hero badge appears at 0.6 scale
t=0     badge anticipation: 0.6 -> 0.55 (120 ms)
t=120   pop: 0.55 -> 1.2 (180 ms ease-out-back) -> 1.0 (200 ms); flash; haptic impact-heavy
t=140   ring x2 (0 and +120 ms), fountain or 3-wave confetti (0 / 250 / 600 ms)
t=400   title text scales in 0.9 -> 1.0 with fade
t=700   counter/level number rolls; each step a selection tick (cap ~10 ticks)
t=1200  sparkle linger starts (6-8 alive), confetti waves falling
t=1200  haptic success (notification) once
~3500   last confetti fades; sparkles keep a slow ambient loop while the screen is open
```

### 2.3 Directing the eye

- Bursts emanate from the thing that caused the reward; trails end at the thing that changed
  (counter, flame, level badge). Final motion = arrival at the counter + its punch. (inferred, from
  coin fly-to-counter conventions)
- Asymmetric confetti cannons (bottom corners shooting inward-up at 60/120 deg) frame the centre
  instead of covering it (canvas-confetti "school pride" pattern).
- Brightest/warmest colour + largest scale = the payload. Particles are smaller and lower-contrast
  than the hero number.
- Stagger sub-elements 50-100 ms apart (stat chips, tokens) so the eye "reads" them in order
  (fly_to_target 60 ms stagger; motion.dev/anime.js stagger utilities).

### 2.4 Readability and safe zones (inferred)

- Never let particles pass in front of the primary button or answer text *at full opacity*. Either
  render particles behind the bottom CTA layer, or fade particles to <= 30% in a 120 pt band above
  the bottom edge.
- Confetti behind the hero card, not over the number. Over text: max 20% of particles, small.
- No particle larger than 18 pt in a functional area; "hero" pieces only above the fold.
- Keep the area within 12 pt of any text glyph clear for the first 400 ms of a burst.

### 2.5 How many particles is too many (phone)

| Tier | Max alive at once | Max emitters | Max duration |
|---|---|---|---|
| Small | 12-20 | 1 burst + ring | 600 ms |
| Medium | 40-60 | 2 bursts + 1 linger | 2.2 s |
| Large | 100-120 (absolute cap 150) | 3 bursts + 1 linger | 3.5 s (ambient loop allowed, <= 8 alive) |
| Ambient (idle screens) | 3-8 | 1 | loop, pause when off-screen |

(inferred. canvas-confetti's own default is 50 and its "realistic" preset is 200 on a desktop-sized
viewport; scale down ~40% for a 390 pt wide phone.) Mobile limits are fill rate/overdraw, not
particle count per se (playbooks VFX guide summary): many *small* opaque flat shapes are cheap;
a few *large* translucent overlapping ones are expensive.

### 2.6 Performance and battery

- Prefer bursts over endless emitters; cap max particles per effect (Unity UI VFX tutorial summary).
- Stop/destroy the system when the last particle dies (canvas-confetti, SwiftUI guide: remove dead
  particles so they do not leak memory). In Rive: state machine returns to an empty "idle" state
  with nothing animating, so the runtime can stop advancing.
- Ambient loops pause when the screen is not visible (Unity Culling Mode "Pause" equivalent).
- Avoid full-screen translucent overlays animating every frame (overdraw). Flash = small area.
- Limit simultaneous animations; Lottie guidance: limit concurrent players, test on low-end Android.
- Offer an effects-off/quality switch for every effect (playbooks VFX guide).

### 2.7 Reduced motion (what to drop, what to keep)

Rules: WCAG 2.3.3 (AAA) says interaction-triggered motion must be disable-able unless essential;
respect the OS setting (`prefers-reduced-motion`, iOS Reduce Motion, Android "Remove animations").
Colour and opacity changes that do not change apparent size/position are *not* motion. Apple HIG:
"make motion optional", never the only channel; supplement with haptics and audio.

| Drop | Keep / replace with |
|---|---|
| Travelling particles (confetti, fountains, embers, coins flying) | A static badge/sticker fading in (opacity only) |
| Scale punch / overshoot / squash | Instant state change or 150 ms cross-fade |
| Screen or element shake | Colour change (coral) + icon + text |
| Rings expanding | A soft opacity pulse in place (no size change) |
| Counter roll with motion | Number cross-fade to final value (or fast count-up, no movement) |
| Parallax, camera moves | Nothing |
| Ambient sparkle loops | Static sparkle glyphs, no animation |
| — | Haptics and sound unchanged (they are the reward channel now) |

The SwiftUI confetti guide recommends exactly this: when Reduce Motion is on, skip the burst and
show a calm confirmation such as a single checkmark animation. canvas-confetti ships
`disableForReducedMotion` but defaults it to false only for back-compat.

Flash safety (WCAG 2.3.1): never more than 3 flashes per second; a flash is a >= 10% luminance
swing. Keep flashes single and small-area. Avoid saturated red flashing entirely. Consecutive
correct answers must not chain into rapid flashes.

---

## 3. Flat-design particle shapes for a rounded geometric brand

### 3.1 Shape kit

| Shape | Construction (all flat fill, no stroke) | Use |
|---|---|---|
| Dot | circle 3-10 pt | sparkle core, embers, snow, filler confetti |
| Pill | rounded rect, radius = half the short side, ratio 1:2.5-3 | confetti strip, motion streaks, ember aligned to velocity |
| Rounded square | rect, corner radius 25-35% of side | confetti chip |
| Rounded diamond | rounded square rotated 45 deg, optionally scaled Y 1.3 | "star" substitute, gem shard, ice shard |
| 4-point twinkle | two pills crossed at 90 deg (long 1.0, short 0.25-0.3 of length), same colour, union | sparkle, "shine" glints |
| Rounded triangle | triangle with 20-30% corner radius | brand-echo confetti piece |
| Filled ring | big circle minus concentric smaller circle (boolean) or two circles stacked bg-coloured hole | shockwave |
| Arc / crescent | circle minus offset circle | confetti curl, motion hint |
| Half-pill "streak" | pill with one end at 0 width (taper) | trail behind flying tokens |
| Brand mini-icons | tiny flame, snowflake (6 pills radiating), XP gem, check | themed bursts (streak, freeze, XP) |

Safe-shape rules (inferred, plus our importer crash):
- Build stars from *convex* parts (pills, rounded diamonds) instead of a single concave polygon. A
  concave star path crashed our Rive SVG importer; rounded diamonds were the fix.
- If a 5-point star is truly needed, prefer Rive's native procedural star/polygon shape (with corner
  radius) over an imported SVG path (inferred; avoids the importer).
- Keep all particle shapes symmetric so random rotation never looks "wrong side up".
- Minimum 3 pt: smaller than that disappears on @3x screens in motion.

### 3.2 Colour rules

- 2-3 hues per effect + white (white counts as light, not a hue). canvas-confetti's default
  7-colour rainbow is the "generic" look to avoid for a brand.
- Colour encodes meaning (inferred mapping for this brand):

| Meaning | Primary | Secondary | Accent |
|---|---|---|---|
| Correct answer | green | white | (gold) |
| XP / reward / coins | gold #FFC800 | orange | white |
| Streak +1 | orange flame | gold | coral |
| Streak freeze | ice blue #5BC8F5 | white | violet (sparingly) |
| Level up / brand moment | violet #7B5CFF | gold | white |
| Lesson complete | violet | gold | coral |
| Perfect lesson | gold | violet | green |
| Mic "heard you" | violet | ice blue | — |
| Wrong answer | coral (state colour only, no particles) | — | — |

- Duolingo reference: yellow #FFC800 = XP, rewards and celebration; green = correct; red #FF4B4B
  = incorrect ("not scary red"); pink = special events (blakecrosley Duolingo guide).
- On dark backgrounds (Dombi black, dark mode), lighten particles ~10-15% and lean on white sparks.
  On light backgrounds, avoid pale gold/white particles: they vanish.
- Never introduce gradients. Fake depth with 2 flat tones: a lighter "highlight" pill on a coin, a
  darker underside on a rounded square (inferred).
- Flipping confetti: alternate the face colour with a 15% darker shade of the same hue at the
  scaleX = 0 crossing. Reads as "back of the paper" without a gradient (inferred).

---

## 4. Feedback taxonomy for a learning app

### 4.1 Intensity tiers

| Tier | Duration | Particles | Screen-level | Haptic | Sound |
|---|---|---|---|---|---|
| T0 Acknowledge | 80-150 ms | none | press state, colour | selection / light | soft click (optional) |
| T1 Small | <= 600 ms | 6-20, local | element punch, ring | success-light (impact light or CONFIRM) | short bright "ding" |
| T2 Medium | 1.5-2.5 s | 40-60 | card entrance, counters, Dombi reaction | impact medium + success | 2-3 note rising chime |
| T3 Large | 2.5-3.5 s | 80-120 | dim backdrop, hero badge, fountain/waves | impact heavy + success | fanfare (<= 2 s) |
| T4 Rare/legendary | 3-5 s, skippable | 120 + bespoke | custom Dombi animation, unique palette | custom pattern | unique sting |

### 4.2 Event table

| Event | Tier | Visual recipe | Do not |
|---|---|---|---|
| Correct answer | T1 | tile green + punch, ring, 6-10 star pops (C), banner up | confetti, screen shake, blocking |
| Combo 3 in a row | T1+ | as correct + small "x3" chip pops near the progress bar, 12 pops, gold accent | full-screen anything |
| Combo 5 in a row | T2- | "x5" chip + progress bar flash + 20 sparkle/ember burst from the bar's head; Dombi nod | confetti |
| Combo 10 in a row | T2 | "x10" chip with ring x2, progress bar shimmer sweep (flat bright band moving across), 30-40 particles from bar | interrupt flow; must stay < 1.2 s |
| Mic "heard you" | T0 | mic button: violet level-ring pulses following voice amplitude; on capture end, ring contracts + light tick | celebration colours before scoring |
| Wrong answer | T0/T1 neutral | coral state, answer tile horizontal shake 3 cycles, 8-10 pt, 300-400 ms, decaying; banner with correct solution; REJECT/error haptic; soft low tone | particles, red flashing, screen shake, sad mascot overacting |
| Lesson complete | T2 | timeline 2.2 medium, confetti A medium, XP fly (D) | auto-advance before the user can read the numbers |
| Perfect lesson | T3 | T2 + gold palette, "Perfect" badge pop, sparkle linger B, wave confetti | reuse exact lesson-complete look |
| Streak +1 | T2 | flame grows + embers burst (E), counter flips N -> N+1 with punch, day dot fills | blue/cold colours |
| Streak milestone (7/30/100/365) | T3-T4 | bespoke Dombi + flame transformation, fountain, share card | identical to daily +1 |
| Streak freeze used | T2 calm | frost-in over the missed day, ice shard burst + snow linger (F), freeze count decrements with a "melt" | celebratory confetti (it's a save, not a win) |
| Level up | T3 | fountain (I), badge pop, level number roll | — |
| Checkpoint trophy | T3 | trophy drop + dust puff (G) + ring x2 + gold confetti waves | — |
| Gem/chest reward | T2-T3 | chest anticipation shake (small, 2-3 cycles) + glow rings + coin burst + fly-to-counter | infinite chest loop |

Wrong-answer rule: shaking a *single element* sideways is a widely understood "no" gesture (the
password-field shake) and is fine; shaking the *screen/camera* reads as damage/punishment and is
wrong for a learning UI (inferred). Duolingo keeps errors gentle: soft "wrong" sound, "not scary"
red, the correct solution shown, and the progress bar still advances slightly
(blakecrosley guide). Duolingo's tone guide: celebrate success with exclamation points, be gentle
and encouraging after mistakes.

### 4.3 Avoiding habituation (staying fresh)

Evidence: hedonic adaptation means repeated identical rewards stop feeling rewarding; irregular
rewards sustain engagement longer than predictable ones (vendor-level claims, treat as directional).
Duolingo uses variable rewards (record-breaking notices, variable gems, random bonuses) and saves
custom full-screen animations for landmark streak days (7/30/100/365) while ordinary days get the
standard counter tick-up. A redesigned day-7 phoenix animation reportedly lifted day-7 retention by
1.7% (deconstructoroffun). Duolingo cut the "number balloons" milestone concept because it was
"cute, but not quite celebratory enough, energy-wise", and said timing was "as important to the
success" as the design (Duolingo blog).

Tactics (inferred, built on the above):
1. Escalation ladder: frequent events stay small; rare events get big. Never give T3 to an event that
   happens > 1x per lesson.
2. Micro-variation: 3-4 variants per T1/T2 effect (direction bias, palette order, shape mix,
   Dombi reaction), chosen at random, never the same twice in a row.
3. Rarity spikes: ~1 in 8-12 correct answers gets a slightly bigger pop or a Dombi wink (variable
   ratio), not more often.
4. Progression inside a lesson: combo effects grow 3 -> 5 -> 10; pitch of the correct "ding" rises
   a semitone per combo step (classic game technique, inferred) and resets on a miss.
5. Context-themed sets: holiday/event palettes swap colours only, keep timing (Duolingo uses pink
   for special events).
6. Shorten with familiarity: after the first N lesson completions, skip the intro beat; always allow
   tap-to-skip on T3/T4 (Apple HIG: don't make people wait on repeated animation).
7. Keep the payload honest: effects scale with actual achievement (accuracy, streak length), so the
   big ones mean something.

---

## 5. Screen-level juice beyond particles

### 5.1 Technique table

| Technique | Typical values | Use for | Avoid |
|---|---|---|---|
| Scale punch | 1.0 -> 1.08-1.15 -> 1.0, 150-250 ms; overshoot easing easeOutBack cubic-bezier(0.34, 1.56, 0.64, 1) (knowledge) | tiles, counters, badges, buttons on success | text paragraphs; frequent taps at > 1.1 |
| Squash and stretch | keep area constant: (1.12, 0.88) -> (0.95, 1.05) -> (1, 1), 150-220 ms | Dombi landing/jumping, dropping cards | rigid UI chrome |
| Anticipation | 80-150 ms opposite move: scale 0.92-0.95 or 4-8 pt pull-back | before a pop, a chest open, a level badge | correct-answer T1 (delay feels laggy) |
| Hit-stop / freeze | 2-5 frames (33-83 ms); 50-100 ms on heavy hits; Unity example 0.08 s | the instant a perfect/level-up badge locks in | anything per-answer; it reads as lag in UI (inferred) |
| Screen shake | trauma model: trauma 0..1, shake = trauma^2, noise-driven, decays 0.5/s; max offset 20 px, max angle 10 deg (Bevy example) | almost never in this app; maybe 2-4 pt, 150 ms on a T4 trophy slam | wrong answers, any reading moment; Reduce Motion |
| Element shake ("no") | +/-8-10 pt horizontal, 3 cycles, 300-400 ms, decaying | wrong answer tile only | whole screen |
| Counter roll-up | 400-900 ms, ease-out (fast then slow); cap ~10-15 visible steps; final punch | XP, gems, streak, accuracy | > 1.2 s, or blocking continue |
| Progress bar overshoot | fill to target + 3-6% then settle back over 150-250 ms (ease-out-back) | answer correct; Duolingo bar width transition 300 ms ease-out | wrong answers (fill plainly) |
| Progress bar shimmer | flat light band (white 30%) sweeping L -> R, 500-700 ms | combo 5/10, checkpoint | constant looping |
| Colour flash | white overlay 40-70% -> 0 in 80-120 ms, small area | instant of success on a hero | > 3/s; large full-screen white |
| Dim backdrop | 0 -> 30-50% black, 150-200 ms | T3 hero moments | T1 |
| Banner slide | translateY 100% -> 0, 200 ms ease-out | answer feedback (Duolingo) | bouncy overshoot on error banner |
| Button press | top face sinks 4 pt, 100 ms; brightness 0.95 | every 3D button (Duolingo) | — |
| Idle life | flame 2 s loop scale 1 -> 1.05, rotate 2 deg; urgent 0.8 s, 1.1, +/-3 deg | streak flame, Dombi breathing | sustained oscillation near the reading area |

Hit-stop and shake values: wayline Game Feel lesson (50-100 ms), game-feel skill pages (2-5 frames,
Unity 0.08 s / timeScale 0.05), Bevy 2D screen-shake example constants (trauma decay 0.5/s,
exponent 2, max angle 10 deg, max translation 20 px, noise speed 20). Trauma + Perlin noise
originates from Squirrel Eiserloh's GDC talk "Math for Game Programmers: Juicing Your Cameras With
Math". The rest is (inferred) except where tied to the Duolingo guide.

Why screen shake is wrong for this UI (inferred, aligned with Apple HIG Motion): shake reads as
impact/damage, hurts legibility of the text the learner is reading, is a vestibular trigger, and
the HIG warns that excessive motion can make people "feel disconnected or physically uncomfortable".
Keep shake to single elements and to T4 slams at <= 4 pt.

### 5.2 Easing cheat sheet (knowledge; standard values)

| Name | cubic-bezier | Use |
|---|---|---|
| easeOutCubic | (0.33, 1, 0.68, 1) | general entrances, particle launch |
| easeOutQuart | (0.25, 1, 0.5, 1) | counters, banners |
| easeOutExpo | (0.16, 1, 0.3, 1) | fake drag on bursts, rings |
| easeOutBack | (0.34, 1.56, 0.64, 1) (overshoot c1 = 1.70158) | punches, badge pops, bar overshoot |
| easeInBack | (0.36, 0, 0.66, -0.56) | anticipation, exit |
| Material standard | (0.2, 0, 0, 1) | UI transitions |
| Material emphasized decelerate | (0.05, 0.7, 0.1, 1) | hero enter |

Material 3 duration tokens (knowledge): short 50-200 ms (step 50), medium 250-400 ms, long
450-600 ms, extra-long 700-1000 ms. Small feedback lives in "short", T2 beats in "medium/long".

### 5.3 Haptics pairing

Principles (Apple HIG Playing haptics):
- Use system patterns by their documented meaning; be consistent so people learn the mapping.
- Match intensity and sharpness of the haptic to the intensity and sharpness of the animation.
- Prefer short haptics for discrete events; avoid overuse ("the best haptic experience is one that
  people may not be conscious of, but miss when it's turned off").
- Make haptics optional; don't let them interfere with camera/mic. **Important for us:** do not fire
  haptics while the mic is recording (speak-first app) (inferred from the HIG rule).

iOS:
- UINotificationFeedbackGenerator: `.success` (task completed), `.warning`, `.error` (failed).
- UIImpactFeedbackGenerator: `.light`, `.medium`, `.heavy` (collision weight), `.rigid` (hard),
  `.soft` (flexible).
- UISelectionFeedbackGenerator: `selectionChanged()` for values changing (counter ticks, pickers).
- Call `prepare()` shortly before to cut latency.

Android:
- `View.performHapticFeedback(HapticFeedbackConstants.X)` is the recommended first choice; it
  respects system settings and needs no VIBRATE permission. Constants describe *function*:
  `CONFIRM` (success, "short and light"), `REJECT` (failure, "might be a stronger feedback"),
  `VIRTUAL_KEY` / `VIRTUAL_KEY_RELEASE` (press/release). Docs warn `createOneShot`/`createWaveform`
  are often too loud for routine feedback. CONFIRM/REJECT are API 30+ (knowledge); fall back to
  `VIRTUAL_KEY` / `LONG_PRESS` on older devices. `CLOCK_TICK` / `TEXT_HANDLE_MOVE` suit counter ticks
  (knowledge).

| Event | iOS | Android |
|---|---|---|
| Button press | impact `.light` or `.soft` | VIRTUAL_KEY (+ RELEASE) |
| Correct answer | notification `.success` (or impact `.light` if success feels too strong per answer) | CONFIRM |
| Wrong answer | notification `.error` (or `.warning` for gentler) | REJECT |
| Combo 5/10 | impact `.medium` at the chip pop | CONFIRM |
| Counter tick | selection, throttled to <= 10-15 per roll | CLOCK_TICK |
| Coin lands | impact `.light` on first and last only | CLOCK_TICK |
| Dombi lands / trophy slam | impact `.medium` / `.heavy` (or `.rigid` for metal trophy) | CONFIRM / custom short |
| Lesson complete | `.success` at the payload beat | CONFIRM |
| Level up / perfect | `.heavy` at pop + `.success` at settle | CONFIRM x2, 150 ms apart |
| Streak freeze | impact `.soft` (cushioned save) | CONFIRM |
| Mic "heard you" | none during recording; `.light` once recording ends | VIRTUAL_KEY_RELEASE |

### 5.4 Sound pairing (inferred unless noted)

- Each visual beat = at most one sound; sound starts within one frame of the visual beat.
- Duolingo pairs each successful answer with a bell sound (Prototypr analysis: works like
  clicker training); incorrect gets a soft "wrong" sound.
- Correct: short bright "ding" (< 400 ms), high register. Combo: same ding pitched up 1 semitone
  per step, reset on a miss.
- Wrong: soft, low, short (< 300 ms), never a buzzer.
- Coins/XP: tiny ticks per arrival with slight random pitch (+/-50 cents) so repeats do not sound
  mechanical; final "cha-ching" on the last.
- Counter roll: ticks synced to steps, capped like haptics.
- T3: 1-2 s fanfare whose peak lines up with the badge pop (t=120 ms).
- Streak: warm whoosh + crackle; freeze: crystalline shimmer.
- Respect the silent switch and in-app sound toggle; visuals and haptics must still work alone.

---

## 6. Implementation notes for Rive (no files touched; guidance only)

- Rive's editor has no classic particle-system panel; three routes (inferred from Rive docs/blog):
  1. **Hand-keyed timelines**: each particle is a shape with keyed position (split X/Y for arcs),
     scale and opacity. Make 3-4 variant timelines per effect for randomness. Best for <= 20 pieces
     (T1) and for exact art direction.
  2. **Data binding Lists + Formula converters**: a list of particle artboard instances, with
     listeners setting properties through `random()` converters (Rive "holiday spinning loader"
     tutorial uses `ceil(random(0,14))` to pick a random variant from a Solo). Good for T2.
  3. **Scripting (Luau Node/Layout scripts)**: TeamRive published a "Particle Emitter" library, "a
     small, self contained particle system for Rive node and layout scripts" that draws through the
     scripts' 2D renderer (community file 28062, demo `particle-demo.riv`). Best for T3 confetti,
     fountains, embers, snow where counts are 40-120. Verify its exposed params in the editor.
- Expose effect *intensity* as a view-model number (0 = off/reduced, 1 = small, 2 = medium,
  3 = large) and a `reducedMotion` boolean, so the app, not the .riv, decides the tier.
- One trigger input per event (correct, comboStep, lessonComplete, ...); state machine returns to an
  idle state with nothing animating so the runtime can sleep.
- Convex shapes only for imported SVGs; prefer native ellipse/rectangle/polygon/star shapes with
  corner radius.

---

## 7. Do / Don't

**Do**
- Layer and stagger (60-150 ms between layers).
- Start bursts where the action happened; end motion on the counter that changed.
- Use 2-3 meaningful hues + white; flat shapes; corner radii everywhere.
- Fade late (last 30-40% of life) and shrink to zero for crisp endings.
- Make paper confetti fall at near-constant speed; make fountains/embers use real acceleration.
- Randomise angle, speed, size, lifetime, rotation, spin sign; use variants.
- Keep CONTINUE usable immediately; allow tap-to-skip on big moments.
- Pair each beat with one haptic + one sound of matching weight.
- Ship a reduced-motion version of every effect at the same time as the full one.

**Don't**
- Confetti on every correct answer (it becomes noise; SwiftUI guide: fire only on earned wins).
- Celebration particles, red flashes or screen shake on a wrong answer.
- Particles over the CTA or the text being learned.
- Gradient glows, blurred bloom, outlines on particles.
- Concave imported star paths (importer crash).
- More than ~120 live particles, or full-screen translucent layers animating.
- Same exact animation for daily and milestone events.
- Haptics during mic recording; > 3 flashes per second; > 1.2 s blocking on any T1/T2 moment.

---

## 8. Sources

1. canvas-confetti source (defaults, randomPhysics, updateFetti): https://raw.githubusercontent.com/catdad/canvas-confetti/master/src/confetti.js
2. canvas-confetti README: https://github.com/catdad/canvas-confetti
3. canvas-confetti demo presets (realistic, stars, fireworks, snow, school pride): https://raw.githubusercontent.com/catdad/canvas-confetti/master/index.html
4. Godot CPUParticles2D class reference: https://docs.godotengine.org/en/stable/classes/class_cpuparticles2d.html (defaults from https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/CPUParticles2D.xml)
5. Unity Particle System Main module: https://docs.unity3d.com/Manual/PartSysMainModule.html
6. Apple HIG, Playing haptics: https://developer.apple.com/design/human-interface-guidelines/playing-haptics
7. Apple HIG, Motion: https://developer.apple.com/design/human-interface-guidelines/motion
8. Apple UIImpactFeedbackGenerator.FeedbackStyle: https://developer.apple.com/documentation/uikit/uiimpactfeedbackgenerator/feedbackstyle
9. Android, Add haptic feedback to events: https://developer.android.com/develop/ui/views/haptics/haptic-feedback
10. WCAG 2.2 Understanding 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
11. WCAG 2.2 Understanding 2.3.1 Three Flashes or Below Threshold: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
12. web.dev, prefers-reduced-motion: https://web.dev/articles/prefers-reduced-motion
13. GDC Vault, "Juice It or Lose It" (Jonasson & Purho, GDC Europe 2012): https://www.gdcvault.com/play/1016487/Juice-It-or-Lose
14. Wayline, Game Feel: the juice toolbox (hit-stop 50-100 ms, shake/particles/tweens): https://www.wayline.io/learn/game-feel/1
15. Game-feel skill page (hit-stop 2-5 frames, Unity 0.08 s): https://skills.sh/gamedev-skills/awesome-gamedev-agent-skills/game-feel
16. Bevy 2D screen shake example (trauma constants): https://bevy.org/examples/camera/2d-screen-shake/
17. Unity Perlin camera shake (credits Eiserloh's GDC talk for trauma + Perlin): https://github.com/baratgabor/Unity3D-PerlinCameraShake
18. dev.to, "The reward moment is the product" (0/80/140 ms, 60-150 ms band): https://dev.to/patilrb/the-reward-moment-is-the-product-43h6
19. SwiftUI confetti cannon guide (restraint, Reduce Motion fallback): https://vp0.com/blogs/confetti-cannon-swiftui-package
20. playbooks.com VFX realtime skill summary (anticipation, overdraw, off switch): https://playbooks.com/skills/omer-metin/skills-for-antigravity/vfx-realtime
21. Unity VFX & game-feel polish lesson (cap particles, bursts over emitters): https://gamineai.com/courses/build-complete-indie-game-unity-2026/lessons/lesson-10-vfx-and-game-feel-polish
22. fly_to_target Flutter package (coin preset, 60 ms stagger, bezier paths): https://pub.dev/packages/fly_to_target
23. motion.dev stagger: https://motion.dev/docs/stagger
24. Duolingo blog, streak milestone animation: https://blog.duolingo.com/streak-milestone-design-animation/
25. Duolingo mechanics, streaks (deconstructoroffun): https://duolingo.deconstructoroffun.com/mechanics/streaks
26. Blake Crosley, Duolingo design guide (colours, banner/bar timings, flame loops): https://blakecrosley.com/guides/design/duolingo
27. Duolingo tone guide: https://design.duolingo.com/writing/tone
28. Prototypr, Duolingo UX habits (bell sound per correct answer): https://blog.prototypr.io/forming-good-learning-habits-with-duolingo-ux-5ccbc86293f4
29. uxdesign.cc, Duolingo engagement and retention techniques: https://uxdesign.cc/duolingo-analyzing-all-engagement-and-retention-techniques-3e73b79120cf
30. Hedonic adaptation (learningloop): https://learningloop.io/plays/psychology/hedonic-adaptation
31. RealtimeVFX forum, "VFX for mobile games and app (aka the juice)": https://realtimevfx.com/t/vfx-for-mobile-games-and-app-aka-the-juice/10766
32. Core Games reward chest animation challenge (Hearthstone pre-reveal glow): https://forums.coregames.com/t/content-challenge-reward-chest-animation/2112
33. Rive Scripting docs (Particle Emitter example): https://rive.app/docs/scripting
34. Rive community "Particle Emitter" library: https://rive.app/community/files/28062-particle-librar/
35. Rive blog, holiday spinning loader with data binding (random() converter, Lists, Solos): https://rive.app/blog/build-a-holiday-spinning-loader-with-data-binding
36. Rive state machines (data-binding-driven transitions): https://rive.app/docs/runtimes/react/state-machines
37. LottieFiles runtime troubleshooting (cleanup, concurrency): https://docs.lottiefiles.com/en/runtimes/best-practices/troubleshooting
38. iMessage screen effects list (confetti, fireworks, balloons, lasers, celebration): https://www.digitaltrends.com/phones/how-to-send-imessages-with-effects/
39. NN/g, Animation duration and motion characteristics: https://www.nngroup.com/articles/animation-duration/
40. Material 3 motion tokens: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs (values quoted from knowledge; page not machine-readable)

Gaps: no public Supercell/King UI-VFX talk with numbers was found; Duolingo publishes no particle,
haptic or celebration-timing specs (Duolingo numbers here are third-party reconstructions). The
"Art of Screenshake" (Vlambeer) talk has no fetchable transcript; its points are reflected only
through the general hit-stop/shake sources above.
