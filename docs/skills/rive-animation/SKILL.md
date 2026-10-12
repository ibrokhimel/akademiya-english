---
name: rive-animation
description: Use when designing or building any animation, motion, micro-interaction, character acting, lip sync, particles, confetti, celebration, feedback juice, haptics/sound pairing, or Rive state machine / scripting work — especially for Akademiya English's mascot Dombi and its UI. Covers craft numbers (timing, easing, springs, squash, blinks, idles), Duolingo-grade case studies, Rive technical recipes (layers, view models, Randomize Exit, components, solos, feathering, Luau scripting) and particle systems in Rive.
---

# Rive animation (craft + Rive + particles)

Built 2026-10-10 from four sourced research reports (≈2,400 lines, 150+ sources). This file is the
working summary and the map. **The references are the source of truth**; read only the ones the task
needs. Anything marked "(inferred)" in them is a reasoned recommendation, not a quoted fact.

| Task | Read |
|---|---|
| Timing, easing, springs, squash, blinks, eye darts, idles, lip-sync shapes, acting "cool", hit-stop, cheap-animation mistakes | `references/craft.md` (§8 = one-screen Dombi card) |
| How Duolingo builds characters/celebrations in Rive, beat-by-beat tables, wrong-answer tone, voice-orb states, audio-haptic map | `references/case-studies.md` |
| State machines, property leaks, view models / data binding, RN/Flutter runtime code, components, solos, constraints, bones, feathering, particles in Rive, Luau API, lip sync wiring, gotchas | `references/rive-tech.md` |
| Particle vocabulary + default parameters per effect, layer stack, tiers, event table, shapes/colour, reduced motion, haptics/sound | `references/particles-juice.md` |
| Lip sync: viseme sets (Rhubarb/Oculus/Azure), EN/UZ/RU phonemes → 10 Dombi mouths, browser G2P rules, phoneme timing, speechSynthesis sync | `references/visemes-lipsync.md` (engine: `design/rive/talk/engine.js`, test page `design/rive/talk.html`) |
| Raw Rive scripting API (renderer, paint, path, artboards, dataValue, interfaces) and community particle scripts | `references/rive-api/*.txt / *.lua` |

---

## 1. The ten rules that make animation impressive (not cheap)

1. **Snap → hold.** Fast move (100–200 ms), then a still hold (0.6–2 s). Constant motion reads nervous/cheap. This is also *the* "cool, not cute" signature.
2. **Nothing starts on the same frame.** Eyes lead, body follows 40–125 ms later, mouth/hands accent 2–4 frames after the body peaks. Never twin (mirror) left/right.
3. **Ease by direction.** Enter = ease-out `(0.05, 0.7, 0.1, 1)`; exit = ease-in `(0.3, 0, 0.8, 0.15)`; standard `(0.2, 0, 0, 1)`; idle loops = sine in-out. Never linear (except shakes and hold-keyed snaps).
4. **Springs over back-easing** for anything interruptible. Bounce 0.15 settle (ζ .85), 0.3 pop (ζ .7), 0.4 max at peaks, >0.5 = kawaii/toy.
5. **Squash keeps area** (scaleX = 1/scaleY), pivot at the **bottom**. Dombi: ≤5 % routine, 10–20 % only at 1–2 peaks per lesson.
6. **Anticipation → action → hold (hit-stop) → settle.** Hit-stop: correct 60–100 ms, lesson end 120–180 ms, milestone 200–300 ms. Change the face at the start/end of a move, never mid-air.
7. **Layer the reward, staggered 60–150 ms:** anticipation → flash → punch → ring → burst → payload (number) → linger. Firing all at t=0 reads as one blob. The eye must end on the number that changed.
8. **Escalate in tiers, keep low tiers restrained.** Contrast, not absolute size, makes the top tier land. Animate less as frequency rises ("the 100th time" rule).
9. **Never loop identically.** Random blink intervals (2.5–6 s; cool 4–7 s), incommensurate cycles (e.g. 3.7 s / 9.1 s / 23 s), weighted random idle breaks every 8–20 s, never the same break twice.
10. **One tempo for motion + sound + haptic** (Apple: causality, harmony, utility). Every beat must still read with sound off. Respect Reduce Motion (drop travel/scale/shake/particles, keep colour, opacity, haptics, sound).

## 2. Units and conversions
- Literature counts frames at **24 fps → 1 f ≈ 42 ms**. Rive renders at 60/120 Hz and keys in frames of the timeline's fps — **think in ms, convert per timeline fps**. (At 60 fps: 6 f = 100 ms.)
- UI durations: press 50–80 · select 100–150 · banner 200–250 · screen 250–350 · big pop 400–500 ms. Exits shorter than entrances. Stagger 30–75 ms/item, ≤800 ms total.

## 3. Dombi spec (mascot of Akademiya English)
Look and rules: memory `pet-dombi`; rig source `C:\Users\User\Documents\akademiya_apps\design\icons\dombi_rig.js`
(13 expressions + 4 hand poses as override sets on one BASE pose; also drives SVGs, Rive `dombi/*` artboards
and Pencil `Dombi / 150 / *` components). Cool and confident — **never kawaii, never sad, hands hidden by default.**

| Behaviour | Spec |
|---|---|
| Breath | 3.2–4.0 s (±10 %), scaleY +1.5 %/X −1.5 %, inhale 40 % / exhale 60 %, eyes ride up 2–3 f late |
| Sway | rot ±0.5–1°, x ±1–2 px, incommensurate periods |
| Blink | random 4–7 s; close ~70 ms / hold 0–40 / open ~110 ms; pill → Y 0.1 + X +5–10 %; 15–20 % doubles; slow smug blink 125/200/170 ms; force a blink on head turns >10° and expression changes |
| Eye dart | 33–50 ms travel, 80 % on first frame, 1 px overshoot + 40–80 ms settle; hold 0.6–2.5 s; eyes translate as whole pills (≤25 % of eye width) |
| Talk | Rhubarb A–F + X mapped onto the bar mouth (see craft §4.2 / case-studies §5.4, ~7 shapes); keep the off-centre smirk pivot in every viseme; lead audio 40–80 ms; M/B/P hold ≥80 ms; drop visemes <40 ms; interrupt → rest in 80–120 ms |
| Listen | only while the mic is really open; squash follows smoothed mic amplitude (attack 30–60 ms, release 150–250 ms, Y ±4 %); eyes toward the mic; silence >1.5 s → head tilt "can't hear" |
| Think | Lily's trick: act out latency — eyes up-side, slow tilt, hand to chin only if >1.2 s; no spinner |
| Correct (T1) | eyes snap +8 % → dip Y 0.94 (80 ms) → pop Y 1.06 (100 ms) → **hold 80 ms** → one hand pops (spring 0.3, 250 ms) → smirk widens → settle → hand out ~1.2 s. 6–10 local star pops, no confetti |
| Wrong | no particles, no screen shake, no sad face: quick blink, 4° tilt, flat "hm" mouth, back to neutral <700–900 ms; only the answer tile shakes (±6–10 pt, 3 cycles, 300–400 ms) |
| Celebrate (T2+) | full hop (anticipation squash → stretch → land squash + hit-stop), both hands, laugh face *on landing*, confetti behind |
| Long idle (>20–30 s) | a cool fidget (glance at watch / shrug), then sleepy Z's much later; never nag |

## 4. Rive architecture (decisions)
- **One state machine, several layers** (multiple SMs per artboard may lose runtime support). Layers **lower in the list win** on shared properties — give every property exactly one owner layer.
  Suggested Dombi layers: Body/idle (Randomize Exit hub) · Reactions (Any State + triggers → one-shots → Empty) · Face (additive blend or per-enum states) · Eyes (blink + gaze joystick/blends) · Hands (gesture enum, hidden by default) · Mouth (visemes, lowest so speech wins) · FX.
- **Property leaks are the #1 bug:** unkeyed properties keep their last value after a state change. Key the neutral value of *every* property a layer touches at frame 0 of *every* state in that layer, or route one-shots back through a Neutral state. (dombi_rig.js's full-pose model exists for exactly this: generate keys for all parts every time.)
- **Drive with View Models, not inputs** (inputs and General Events are deprecated): enums `mood`/`gesture`, numbers `viseme`/`amp`/`lookX`/`lookY`, bool `talking`/`listening`, triggers `correct`/`wrong`/`celebrate`, and output triggers (`gestureDone`, `sfx*`) fired by state actions for the app.
- **Random idles:** Randomize Exit with weights on a hub state + Exit Time 100 % back to the hub.
- Transitions: give reactions 0.1–0.2 s cubic, **Allow exit during transition** (barge-in), Exit Time 100 % to finish one-shots. Any-State transitions need triggers (a condition that stays true re-enters every frame → "exceeded max iterations").
- **Solos** for discrete swaps (mouth shapes, eye states, hand poses) — bind the active index to a VM number for frame-by-frame visemes.
- Squash on the blob: scale a body group with origin at bottom-centre; bones bound to path vertices only for jelly wobble.
- **Feathering** (glow, soft shadow) needs the Rive Renderer (RN always; Flutter `Factory.rive`; web `webgl2`, not canvas); fill rule Clockwise.
- Only Components + the default artboard export. Keep each character file <1 MB (Lily is).

## 5. Particles in Rive (no built-in emitter)
Pick by size of moment:
| Option | Use for | Notes |
|---|---|---|
| **D. Hand-keyed burst component** + 3 variants via Randomize Exit | T1 star pops, rings, small sparkles (≤20 pieces) | cheapest, no scripting, fully designable — **default for small effects** |
| **A. Luau Node script, pure draw** (pooled; Path/Paint built once in `init`, never allocate in `draw`) | confetti, embers, snow, 40–150 pieces | start from TeamRive's official **Particle Library** (community file #28062) or the pooled ConfettiBurst in `references/rive-tech.md` §5.2; community confetti.lua allocates per frame — don't copy that |
| **B. Script instancing an `Input<Artboard>` prefab** | designer-owned pieces with their own little animation | each instance runs a full artboard + SM: keep ≤20–40 |
| C. Artboard List + Number-to-List converter + Follow Path | no-code rings/orbits | per-item index for offsets |
| E. `drawImageMeshInstanced` | hundreds of raster sprites | breaks the flat-vector look; dust/snow only |

Shapes: flat and **convex** only — dots, pills, rounded squares, rounded diamonds, twinkle = two crossed pills (a concave star crashed our Rive SVG importer). 2–3 palette hues + white; colour = meaning (gold reward, orange streak, ice freeze, violet level/brand, green correct). Glow = stacked flat circles or feather.
Budgets: ≤40 alive for small, ≤120–150 for large, one burst system + one ambient emitter at a time; small effects done in ≤600 ms, large peak inside 1.2 s and gone by 2.5–3.5 s; never block input.
canvas-confetti defaults (reference feel): count 50, spread 45°, startVelocity 45 px/f ×(0.5–1.5), decay 0.9/f, gravity 1 (≈ steady +3 px/f fall), ticks 200 (~3.3 s). Per-effect pt/ms tables (confetti, sparkle, star pop, XP fly-to-counter, embers, frost, dust, ring, level-up fountain) are in `particles-juice.md` §1.4.

## 6. Feedback tiers (Akademiya)
| Tier | Moments | Length | Particles | Haptic |
|---|---|---|---|---|
| T0 | press, select, mic heard | 80–150 ms | none | selection/light |
| T1 | correct answer, combo 3 | ≤600 ms | 6–20 local | light / success |
| T2 | combo 5/10, lesson complete, streak +1, freeze used (calm, ice) | 1.5–2.5 s | 40–60 | medium + success |
| T3 | perfect lesson, level up, checkpoint trophy | 2.5–3.5 s | 80–120 | heavy + success |
| T4 | streak milestones 7/30/100/365 | 3–5 s, skippable | bespoke | custom |
Full event table with "do not" column: `particles-juice.md` §4.2. Sound/haptic map: `case-studies.md` §6.2. No haptics while the mic records. Combo chimes rise a semitone per step (capped). 3–4 random variants per effect; rare bigger pops.

## 7. Working with the Rive MCP (this machine)
- Client: `scripts/rive.js` (copy also in the session scratchpad): `node rive.js list | schema <tool> | call <tool> '<json>'` (or `@args.json`; `FULL=1` for long output). Editor server: `http://127.0.0.1:9791/mcp`; the Rive editor must be open with the file active (`session_info`).
- Keyframes: `animation_editor` → `modifyKeyFrames { animationId, add:[{objectId, propertyKey, frame, value, interpolationType: hold|linear|cubic|elastic, cubicParams{x1,y1,x2,y2}}] }`. Get property keys with `query_property_keys` (don't guess); values use editor units (opacity/scale %, rotation degrees).
- A new artboard already has a "Timeline" and a default SM: rename the timeline to the first animation instead of creating new ones; build extra layers/states with `createStateMachineLayers` / `createStates` / `createTransitions` / `createConditions`.
- **Verify every time:** `simulateStateMachine` (proves states/transitions fire; doesn't render), then `capture_artboard` at several times/states and look at the PNGs. Never claim an animation works from the object tree alone.
- SVG instances imported via `assets_tool addSvgInstance` are static art — to animate parts, build native parametric shapes (`path_editor createParametricShapes`: rectangle with cornerRadius, ellipse) named per part, in a group hierarchy: root (bottom-centre origin: jump) → squash group (scale) → body + face group (tilt) → eyes/lids/mouth parts; hands and FX outside the squash group.
- Scripts: `manage_scripts` create → `text_editor` edit → `recompile_all_scripts` → `script_diagnostics` (source of truth) → `read_console` (only frames that already ran). Don't call `markNeedsUpdate()` in `update`; store VMs on `self`; `Input<Trigger>` default is the handler function.
- Export the runtime file with `export_file` (.riv). `.rev` backup export is refused on the user's plan — export a .riv snapshot instead, and prefer additive work (new artboards) over editing existing ones.
- Quirks found 2026-10-10: `group_editor` ignores x/y (set keys 13/14 afterwards); keys: x 13, y 14, rotation 15, scaleX 16, scaleY 17, opacity 18, rect width 20 / height 21 / radius 31, animation fps 56 / duration 57 (frames) / loop 59, transition flags 152 (exitTime 4, exitTime% 8, earlyExit 32) / duration 158 (ms) / exitTime 160 / interpolation 349 (cubic = 2) / randomWeight 537, state flags 536 (1 = Randomize Exit). `get_artboard_hierarchy` depth cuts deep children silently. `simulateStateMachine` cannot drive **enum** properties — verify those in the real runtime instead.
- **`focusArtboard` needs `{ artboardId }`** (not `id`): with the wrong key it returns an error string and silently stays on the old artboard, so timelines/state machines land on the wrong artboard. `listViewModels` does not list a view model until it is bound — keep the `createViewModels` result. Instance values: `listViewModelInstances`, then `set_property_values` key 555 on the instance property. A new artboard's default state must be an `idle` timeline (create it FIRST, or retarget Entry via transition key 151).
- **One-shots must be interruptible on the way back:** a trigger fired while a one-shot is blending back to idle is LOST unless that return transition has "allow exit during transition" (flag 32). Set flags 4|8|32 on every `X -> idle`.
- **One-shots and persistent poses go in separate layers** (persistent = enum + Any State; one-shots = triggers -> idle). An Any-State transition whose enum condition stays true would cut a one-shot off in the same layer. Idle states key only the props no other layer owns, so everything else is handed back.
- Deep rigs: `get_artboard_hierarchy` stops listing children past its depth (the Dombi rig is 16 deep) — use `query_objects { objectIds, depth }` per shape instead.
- Touch interactions: app does physics, Rive acts (`design/rive/play.html`, table in `docs/ideas/motion-plan.md` §8). Throw speed must come from the finger's last ~90 ms, not from the lagging body.
- **Baked particles** (no scripting): simulate physics in JS and write keyframes — `design/rive/fx_bake.js` (canvas-confetti model; adaptive sampling; ~19k keys ≈ +250 KB). Effects: FX Pop / FX Confetti (medium, large, fountain) / FX Embers. Full plan: `docs/ideas/motion-plan.md`; composed moments: `design/rive/moments.html`.
- **Never crossfade two objects for one morphing feature** (e.g. a stroke-line mouth and a fill-shape mouth): opacity blends + collapsing geometry read as a flash on every switch. Use ONE path with fill + round stroke (zero-area path = line) and morph its vertices (`design/icons/mouth_geo.js`). Lip-sync floor: ≥70 ms per shape, 50–75 ms morphs.
- **Flash/flicker test:** record in-page with a rAF loop (canvas crop → `toDataURL` + white-pixel area per frame), not Playwright screenshots (~85 ms apart). `design/rive/capture_flash2.js` does it; a flash = a one-frame dip/spike in the area series.
- **Runtime check (the real proof):** the Dombi engine in `C:\Users\User\Documents\akademiya_apps\design\rive\` has `preview.html` (+ `@rive-app/canvas@2.42.2` in node_modules) and `capture_preview.js` (Playwright plays the exported .riv, sets VM enums, screenshots frames). Unpaid exports show a ~3 s "RIVE" splash at load — wait past it. Rig/machine builders there (`dombi_engine.js`, `dombi_pose.js`, `dombi_machine.js`) are the template for adding new states: generate keys from `dombi_rig.js` poses.

## 8. Process for a new animation
1. Name the moment's **tier** and its single idea (staging). Decide what the eye should land on.
2. Write the beat sheet in ms (anticipation, action, hold, settle; layers offset 60–150 ms) + sound + haptic + reduced-motion fallback **before** keying.
3. Block key poses (pose-to-pose) from the rig model; key every owned property in every state.
4. Add overlap (eyes lead, hands late), springs on settles, holds; then randomness/variants.
5. Verify: simulate the SM, capture frames, compare to the beat sheet; check the 100th-viewing test and the sound-off test.
6. Show the user captures (or a frame strip / GIF) for approval before wiring the next moment.
