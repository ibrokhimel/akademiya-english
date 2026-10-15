# LOCKED IDEA — Companion Pet (English app)

**Status:** Concept locked · **Date locked:** 2026-10-09 · **Design:** later (with art style #27 and characters #28)
**Roadmap item:** #36
**Origin:** owner's idea

## The idea

A **small pet** lives on top of the app, on **every screen**:

- It stays on screen while pages change — it is not part of any page.
- **On the Learn path** it has a home spot: the unit-art place beside the path (decided 2026-10-10 with the
  locked Path H). There it can talk in a speech bubble, like the "talking waiter" idea in Path H2.
- It **moves around and wanders** like a small pet.
- **Tap or hold** it → it plays an animation (reacts, plays).
- **Double-tap** it → it **listens** and acts as a **voice AI assistant**: helps the learner navigate,
  answers questions about the app.
- If the learner asks something like **"Can we practise speaking?"** → it takes them to a
  **speaking practice page** where they **talk with the pet about any topic**, in a live voice
  conversation (like ChatGPT voice mode).

## Notes to handle in design (not decisions yet)

- It must never cover buttons or exercise content; it can rest or "sleep" in a corner during exercises.
- A way to hide or mute it.
- The open "talk about any topic" practice uses live AI voice → costs money per minute; it fits the
  Premium "unlimited speaking" feature, with limited free use.
- MVP excludes AI conversation, so the AI assistant and live speaking practice come **after the MVP**.
  Whether a simple non-AI pet appears in the MVP is still open.
- ~~Pet design, name and personality are decided later with the art style.~~ → decided 2026-10-10, see below.

## Dombi — the pet (LOCKED 2026-10-10)

- **Name: Dombi** — from Uzbek *do'mboq* ("chubby, round"); the Uzbek version of a cute "Blob"-style name.
- **Look:** a round **black blob** (body `#2B2B3C`, darker bottom edge `#17171F`), two **tall white pill eyes**,
  a plain centred **smile** (it was an off-centre smirk until 2026-10-15, when the owner asked for "a normal face"; the smirk stays on the wink and proud faces). Cool and confident for teens + adults — **not kawaii**: no blush,
  no anime ∩∩ eyes, no tongue. Style follows the "cute AI agent" trend (GrokBot, Jolly, Mico) but simpler.
- **Hands:** two plain circles, one shade lighter (`#45455A`), **hidden by default** — they only pop in for
  gestures: wave (one up), celebrate (both up), thinking (hand at the chin). Later: point, thumbs-up.
- **Also the onboarding guide** — he replaces the chef placeholder on every onboarding screen and introduces
  himself ("Salom! Men Dombiman."). The café **waiter** stays a separate scene character.
- **Files:** Rive artboard `Dombi` (the animated rig; the old static `pet/*`, `dombi/*`, `char/*`, `bot/*` artboards were
  deleted 2026-10-11, their SVG sources stay in `design/icons/`) · Pencil components `Dombi / …` (board "Pet preview ·
  black (2D)"; all 65 Dombi drawings use the curved mouth since 2026-10-11: a native `mouth` path, the old bar + tick
  rects are hidden, not deleted) · source `design/icons/dombi_rig.js`.
- **Expressions (drafted 2026-10-10, #28):** smile (default, still named `smirk` in the files) · happy · laugh · talk · listen · think · surprised ·
  sleepy (Z's) · wink · proud (flat lids) · focus (angled lids) · confused · oops (after a mistake: awkward grin, never
  sad) + gesture poses wave · celebrate · thinking · point. Built only from rounded rects/circles: eyes change height,
  body-coloured lids cut into them, mouth = smirk bar + corner ticks or an open pill, the face can tilt.
  One source: `design/icons/dombi_rig.js` → SVGs `characters-dombi/`, Rive artboards `dombi/*`, Pencil components
  `Dombi / 150 / <expression>` (board "Pet preview", section "Dombi · expressions").
- **Mouth (Duolingo style, option A picked 2026-10-10):** one round-capped curved line (smirk = swoosh rising on the
  right) or one solid shape (laugh/talk = white D, surprised = "o") — no more bar + tick "L". In Rive: `mouthLine`
  (open stroke path, 3 free vertices) + `mouthShape` (closed fill, 3 vertices); every mood keys their points, so moods
  morph (the smirk bends into a smile, an open mouth grows out of the line). Geometry: `MOUTHS` in `dombi_rig.js`.
  **Single-shape mouth (2026-10-11):** the separate line + fill crossfaded on every switch (line shrank to a dot while
  the shape grew from one = a "flash"). Now ONE closed path `mouthShape` (3 free vertices) with a white fill AND a 7 px
  round stroke: closed mouths are zero-area paths the stroke draws as a line, open mouths are D/ovals. Every switch is
  a pure 3-point morph. Model: `design/icons/mouth_geo.js` (also used by the SVG sheets). Talking pacing: ≥70 ms per
  shape, morphs 75 ms (50 ms into closed lips), 120 ms back to the mood.
- **Engine (built 2026-10-10):** Rive artboard **`Dombi`** (component) = one native rig (root → squash → body + face →
  eyes/lids/mouth parts; hands and Z's outside the squash) and **one state machine `Dombi`** with layers that each own
  their parts: Body (3.6 s breath) · Sway (9.1 s lean) · Eyes (random blinks 3.5/5/6.5 s, 1-in-6 double) · Face (one
  full pose per mood, 150 ms blend) · Hands (hidden = tucked behind the body at the shoulder; they slide out from behind. Shoulder pivots
  `armL`/`armR` → rotate an arm to swing the hand on an arc; `handRFront` is a front-drawn twin for poses in front of the
  body, e.g. thinking: the hand reaches out from behind, swaps to the twin, then moves to the chin).
  "Alive" layers (2026-10-10): **Gaze** (eyes group glances: 8 holds of 0.9–2.6 s, 50 ms darts, weighted random,
  left↔right "reading") and **Idle** (random rests of 8/12/17 s, then a break: look-around, weight shift, tiny hop,
  lean back, nod) on a new `lean` group, so they never touch face/hands/eyes timelines. Hierarchy now: root (Sway owns its
  rotation) → **act** (gesture body acting: jump/lean/squash, keyed only in hands/* timelines, neutral at frame 0) → lean (Idle)
  → squash (Body/breath) → body + face. Owner animated hands/wave and hands/celebrate (celebrate retouched by Claude:
  moved to `act`, squash instead of sinking, faster jump easing, ends home). Wave retouched: swings are armR rotation
  around the shoulder (decaying), not straight x/y moves. Artboard is **260×230** (root at 130,200) so gestures fit.
  Every gesture = intro (one-shot) → `hands/<g>-loop` idle (celebrate: hands pump; thinking: chin taps; point: small
  jab; wave: hand stays put away) until `gesture` changes; Hands layer uses direct transitions (no Any State). Since 2026-10-10 the
  owner hand-animates in the Rive editor — Rive is the master; don't re-run the build scripts over it. App controls = view model
  **`Dombi`**: `mood` (enum, 13 faces) · `gesture` (none/wave/celebrate/thinking/point) · `listening` · `talking` ·
  `viseme` · `amp` · `lookX/lookY` · triggers `correct` / `wrong` / `celebrate` (out: `gestureDone`) — the last ones are
  placeholders for the animation pass. Build scripts + preview: `design/rive/` (`dombi_engine.js` rig, `dombi_machine.js`
  machine, `node serve.js` → preview page, `capture_preview.js` checks it in the real web runtime).
- **Talking engine (2026-10-11):** 10 talking mouths covering English, Uzbek and Russian (research: viseme report,
  Rhubarb/Oculus/Azure sets): 0 REST (= the default smile) · 1 MBP · 2 FV · 3 TEETH (t d n s z k g q x r) · 4 EE (i y) · 5 EH (e, uz a, l)
  · 6 AA · 7 OH (uz o, ru о) · 8 OO (u w, uz o') · 9 SH_R (sh ch j, en r) · 10 TH (th: small relaxed opening, top
  edge dips — added 2026-10-11 because th as the wide TEETH lens read like a grin) + 11 UH (schwa). Rive layer **Mouth** (top
  priority): `talking` + `viseme` → 45 ms morphs; talking off → back to the mood's mouth. Text engine
  `design/rive/talk/engine.js` (EN via CMUdict, UZ/RU by rules; timing + smoothing: merge <45 ms, MBP ≥70 ms, clusters
  keep the most visible lip shape, h takes the next vowel). Test page `design/rive/talk.html` (Edge for the Uzbek voices
  Madina/Sardor). Production plan: pre-render lesson audio + timings (forced alignment / Azure viseme events), like Duolingo.
- **Reactions, listening, presence (2026-10-11)** — all checked frame by frame in the web runtime:
  - `correct` trigger (1.2 s): eyes snap wide → dip → pop → 80 ms hold → one hand out from behind with a small shake →
    smile → settle. `wrong` trigger (0.9 s): quick blink, 4° tilt, flat "hm" mouth, back to the mood — no sad face.
    `tapped` (also fired by clicking his body): squash-pop + wide eyes. Layer **Reactions** on group `react`.
  - `listening` bool → lean in, eyes on the learner, slow nod; `amp` < 6 for 1.5 s → "can't hear you" head tilt until
    sound returns. `amp` (0–100) is also data-bound to group `voice`: body +5 % tall / −3 % wide with the voice (use
    it for the learner's mic while listening and for his own voice while talking). Layer **Listen** on group `listen`.
  - `looking` bool + `lookX`/`lookY` (−100…100 → ±6 px, data-bound to group `look`): the app points his eyes; the
    random Gaze layer parks while `looking` is on.
  - `hidden` bool → exit (squash, shrink to nothing at his feet) / enter (pop up with stretch + landing squash); no
    opacity fade (it revealed the hands tucked behind the body). Layer **Presence** on group `stage`.
  - Mood entrances: every `face/<mood>` has a short accent on top of the 150 ms blend (eyes squash/pop, lids drop
    from above, tilt overshoot, Z's pop in). Motivated blinks: `blink` trigger; fired automatically on every mood
    change; the three big random glances blink as the eyes land.
  - Hierarchy: stage → root (Sway) → act (gestures) → react → listen → voice (amp) → lean (Idle) → squash (breath) →
    body + face → look (lookX/Y) → eyes (Gaze x/y, blink scale). Layers: Body, Sway, Eyes, Face, Hands, Gaze, Idle,
    Mouth, Reactions, Listen, Presence. Preview with all controls: `design/rive/preview.html`.
  - **Still to do:** big celebrations with particles (lesson complete, streak, level up, combo), dark-mode Dombi.
- **Touch interactions (2026-10-11):** hold & carry, throw, poke escalation, tricks, petting, feeding words, high-five,
  sleep/wake, pinch, tilt, phone shake, blow, hide & peek, drop zones. Layers **Play** (enum `play`) and **PlayOnce**
  (17 triggers) on groups `pose` / `once`; data-bound `swing`, `squish`, `stretch` on groups `carry` / `gum`.
  Full table: `docs/ideas/motion-plan.md` §8. Playground: `design/rive/play.html`.
  **Where he can be touched — LOCKED 2026-10-11: everywhere.** During an exercise taps, pokes, tricks, petting and the
  high-five work; carrying, throwing, feeding and pinching are locked until the exercise ends.
- **Full-app extras (2026-10-11):** hat slot + doppi (enum `hat`, trigger `dress`), pet growth (`grow`), dark mode
  (bool `dark`, layers **Outfit** and **Theme**). Layer list: Body, Sway, Eyes, Face, Hands, Gaze, Idle, Mouth, Reactions,
  Listen, Presence, Play, PlayOnce, Outfit, Theme. Hierarchy: stage → carry → gum → root → pose → once → act → react →
  listen → voice → lean → squash → body + face (+ hat).
- **Open:** the café waiters are designed and animated (2026-10-12, see pages.md); other scene characters are not designed yet; more outfits are art only; sound design.
