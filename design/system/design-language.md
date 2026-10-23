# Akademiya design language

How Akademiya English and Akademiya Math look, move, sound and talk. This page explains the thinking and the rules;
the exact values live in [tokens.json](tokens.json) and the short rule sheet is [README.md](README.md). When this
page and the tokens disagree, the tokens win.

Written 2026-10-23 from: the shared tokens, Math's Flutter code (`app/lib/core/theme.dart`, `motion.dart`,
`tile.dart`, `lip_button.dart`, `haptics.dart`, `sfx.dart`, `particles.dart`, `tile_transition.dart`), English's
redesign specs (`docs/superpowers/specs/2026-10-23-*`) and the owner's decisions recorded during design rounds.

---

## 1. One family, two apps

Both apps are one company's products and should feel like it: same font, same shapes, same springs, same kind of
mascot, same way of telling you that you got something right. Each app keeps one colour of its own and its own
content.

| Shared by both | Each app's own |
|---|---|
| Nunito, the type scale and weights | Main colour: English **violet** `#7B5CFF`, Math **blue** `#2E7CF6` |
| Ink, greys, lines, paper, dark mode | Mascot: Dombi (English), Bloub (Math), siblings of one family |
| Correct, "not yet", reward and danger colours | Reward rules (Math has hearts, English never blocks learning) |
| Lip buttons, cards, tiles, corners | Screens and content |
| Three springs, 45 ms stagger, Reduce Motion rule | |
| Icon style, copy rules, answer panel | |

**English is not a violet reskin of Math.** Same language, different screens. Math is the quality bar (finished,
full, every screen cared for), not a template to copy.

---

## 2. The principles

These are the reasons behind every rule further down. When a case is not covered, decide by these.

1. **One thing matters per screen.** One title, one main action, at most one coloured hero card. Everything else
   is white or paper.
2. **Colour has a job.** A hue appears only when it means something: the app's colour means "this is the action",
   yellow means "your next step / your reward", green means "correct". Decoration never gets a hue.
3. **Big and bold.** Heavy weights (700 for text, 900 for headings), large sizes, high contrast ink on white.
   Nothing people need to read is light grey or under 12 points.
4. **Things are solid.** Buttons and tiles sit on a darker lip and sink when pressed, like real keys. No soft
   drop shadows, no glass on content, no gradients on controls.
5. **Everything moves on a spring.** Nothing jumps and nothing slides linearly. Things arrive one after another,
   react to touch and settle back.
6. **Mistakes are part of learning.** A wrong answer is "not yet", amber, calm, with the reason. Red is for
   deleting and hanging up, never for an answer. No buzzer sounds.
7. **The mascot is a companion, not a decoration.** Dombi and Bloub are on the main screens, react to what the
   learner does, and never guilt-trip.
8. **Plain words.** Short literal headings, everyday Uzbek, no slogans.
9. **Nothing invented.** Every element on a screen comes from somewhere: the built app, an owner design, the
   plan or an owner answer. If it has no source, it is not added.

---

## 3. Colour

### 3.1 Roles

| Role | Light | Dark | Used for |
|---|---|---|---|
| App main | violet `#7B5CFF` / blue `#2E7CF6` | same | Primary buttons, selected states, links, progress, the hero card |
| App lip | `#5A3FD9` / `#1F5CC9` | same | The lip under main-colour buttons and tiles |
| App wash | `#EFEBFF` / `#E8F0FE` | | Selected option fill, the tab bar's selected square |
| App wash line | `#C9BDFF` / `#CFDDF8` | | Outline of a selected option |
| Ink | `#14161B` | `#F4F4F6` | All text people read |
| Muted | `#6B6F7B` | `#A3A5B2` | Secondary text |
| Faint | `#9A9DA8` | `#6A6C78` | The least important marks; never for text people must read |
| Line / line lip | `#E6E7EB` / `#CDD0D7` | `#2E2F37` / `#202127` | Card outlines, quiet buttons' lip |
| Paper | `#F4F5F7` | `#1B1C22` | Quiet tiles, grouped areas |
| Surface | `#FFFFFF` | `#121318` | Screen and card background |
| Reward yellow | `#FFCB2E`, lip `#E0A800` | lip `#B88A00` | Next lesson, streak, rewards |
| Correct green | `#1DB45A`, lip `#14904A`, wash `#E3F6EA` | `#2BC56A`, wash `#14321F` | Correct answers only |
| Not yet amber | `#F29D0C`, wash `#FFF1DC`, text `#A35F00` | `#F5A623`, wash `#33240F` | Wrong answers |
| Danger red | `#E5394A` | `#FF5A6A` | Delete, end a call |

### 3.2 Rules

- **One main colour per app.** Nothing else in the interface gets its own hue.
- **Yellow is the second colour**, for one card per screen at most (the next lesson or the streak).
- **Green only with a correct answer.** Not for buttons, badges or decoration elsewhere.
- **Amber, never red, for a wrong answer.**
- **Text on a fill:** white on the main colour and on dark fills; ink on yellow and on washes. Math computes this
  (`onColor`: luminance above 0.45 gets ink), English follows the same rule by hand.
- **Fill whole cards** for the one thing that matters most on a screen. Everything else stays white or paper.
- **Colour inside content is separate from interface colour.** In Math a purple (`grape`) and coral mark
  quantities inside math objects only; they never appear on buttons or as an error colour. English pictures
  (`pendev/icons-r2`) keep their own colours.

### 3.3 Dark mode

Both apps have one. Surfaces go near-black (`#121318`), paper lifts slightly (`#1B1C22`), lines darken, lips get
darker than the face just as in light mode. The main colours and reward yellow stay the same; correct and not-yet
get brighter text and dark washes. Ink on yellow stays ink in dark mode. The live conversation screen in English
is always dark.

---

## 4. Type

One font: **Nunito**, rounded and friendly, heavy weights only (700, 800, 900).

| Step | Size / line | Weight | Use |
|---|---|---|---|
| display | 34 / 40 | 900 | One big number or headline per screen |
| title | 26 / 32 | 900 | Screen heading |
| heading | 20 / 26 | 900 | Card heading |
| body | 16 / 23 | 700 | Running text |
| small | 14 / 20 | 700 | Captions, hints |
| label | 12 / 16 | 900, CAPS, +0.8 | Eyebrows above headings ("2-BO'LIM · KAFEDA · 2-DARS") |
| button | 16 / 22 | 900, CAPS, +0.6 | Button text |

- Every screen opens with a **title** or a **display** number.
- Body is 16. Nothing is under 12. Body text is never under 14.
- Sizes are design points on a 390-wide phone; English scales them with the screen (`type(step, d)` in
  `src/mobile/src/components/system.ts`).
- Numbers use a non-breaking thin space for thousands: `27 000 so'm` (Math's `formatAmount`).

---

## 5. Shape and depth

The look comes from flat colour plus a **lip**: a strip of the darker tone under a shape, so it reads as a solid
object you can press.

| Element | Corners | Depth | Notes |
|---|---|---|---|
| Button | 16 | 4 pt lip in the darker tone | Face sinks onto the lip when pressed; label moves with it |
| Card | 20 | 2 pt line, or a full fill | White with a line by default; filled only for the hero |
| Tile (home screens) | 24 | 4 pt lip | The whole tile is one tap target |
| Pill / chip | 999 | none or line | Selection pills, HUD pill in lessons |
| Lesson path node | round | 9 pt lip | |

- No blurred drop shadows. Depth is the lip.
- Pressed: the face drops by the lip height and the lip disappears; the press also springs the scale to about
  0.94 and back with a little overshoot (`PressSpring`).
- Selected option: app wash fill, wash-line outline, label in the main colour.

### Spacing and layout

- Spacing steps: **4, 8, 12, 16, 20, 24, 32, 40**. No other gaps.
- Screen side margin: **20**.
- Designs are drawn at **390** wide and must also fit **360**.
- English: scroll content ends with about **110 pt** of empty space so the last item clears Dombi and the tab bar.

---

## 6. Components

### Buttons

- **Primary:** main colour face, darker lip, white CAPS label, full width (Math: a Rive `button.riv` driven by a
  view model).
- **Secondary / quiet:** white or paper face, line lip, ink label.
- **Try again (Math):** yellow face, ink label.
- **Danger:** red, only for delete and ending a live call ("Tugatish", round).
- One primary button per screen.

### Tiles

Flat fill with a 4 pt lip, 24 corners, 18 pt padding. Quiet (paper), main colour, yellow and ink variants. In
Math a screen opened from a tile **grows out of that tile** and shrinks back into it when closed, like an app
opening from its icon (`tile_transition.dart`).

### Cards

White, 20 corners, 2 pt line. The hero card is a full fill (main colour or yellow). English's Learn tab opens
with the next-lesson hero card.

### Answer panel

Springs up from the bottom after an answer; its icon pops in after it. Coloured by result, never grey. Icon, a
short title, then one line saying why.

- **Correct:** green wash, check icon, "Zo'r!" (Math: "Nice work!"), then the reason or the phrase and its meaning.
- **Not yet:** amber wash, bulb icon, the right answer, the reason for the mistake.

### Tab bar

| | English | Math |
|---|---|---|
| Tabs | Learn · Speak · Practice · Me | Math's own set |
| Look | Icons only, no labels; the selected icon sits in a rounded square with the main-colour wash and outline | Floating liquid-glass bar: a clear droplet rides on the open tab, its icon and label turn blue; the droplet swells and follows a swipe |
| Icons | Rive icons: home, studio mic, dumbbell, profile | Math's set |

Glass is used for the floating bar only, never for content.

---

## 7. Motion

The motion kit is the same in both apps (Math: `core/motion.dart`; English: `springs` and `STAGGER_MS` in
`system.ts`).

### Springs

| Spring | Mass / stiffness / damping | Use |
|---|---|---|
| gentle | 1 / 170 / 18 | Cards, panels, entrances, layout settling |
| snappy | 1 / 520 / 26 | Following the finger: press and release |
| bouncy | 1 / 380 / 13 | Pops, a value going up, a correct answer, rewards |

### The moves

- **Entrance:** each item rises about 14 pt, grows from 0.92 and fades in on the gentle spring, **45 ms** after
  the one before, capped at 8 steps so long lists don't drag. It plays every time a screen or tab opens.
- **Press:** scale to 0.94 on snappy, back to 1 on bouncy.
- **Bump:** a number or badge that changes grows briefly and settles back.
- **Count up:** totals (XP, gems, scores) count to the new value instead of jumping.
- **Shake:** a wrong answer shakes sideways a few shrinking swings and comes to rest.
- **Squash:** a piece that lands squashes wider and lower and springs back up.
- **Sway:** characters and lively objects sway around their base and bob slowly, each on its own phase so
  neighbours never move in step. The resting pose is the middle of the sway.
- **Answer panel:** springs up from the bottom, icon pops after.
- **Tile open (Math):** the next screen grows out of the tapped tile.

### Reduce Motion

When the phone asks for less motion: no movement, everything shows at once, characters are still images. In
English this also forces Dombi to the **Still** level (see 9).

---

## 8. Feedback: sound, touch, particles

Every reaction is three layers that fire together: what you see, what you hear, what you feel. Each layer has its
own switch in Settings.

| Moment | Sound | Haptic | Visual |
|---|---|---|---|
| Tap a tile, tab, pill, choice | short, quiet | crisp tick | press spring |
| Main button, correct answer | short, quiet | light tap | bouncy pop, sparkle burst |
| Not yet | calm, never a buzzer | firmer tap, never harsh | shake, amber panel |
| Lesson done, streak lit, level up, badge | short, quiet | three beats: strong, medium, light | confetti over the screen |

- Sounds are short and quiet, mix with the mascot's voice, follow the silent switch, and fail silently: a missing
  sound never stops a lesson.
- **Sparkle** colours: yellow, main colour, white, yellow lip. **Confetti** may add green and red. Particles sit
  above everything, never take a tap and clear themselves.
- Feedback is built in Rive where it is animation (characters, particles, buttons); every interactive component
  is designed in all its states (default, pressed, selected, correct, not yet, listening) so a state
  machine can move between them.

---

## 9. Mascots

Dombi (English) and Bloub (Math) are both **black round blobs**. The owner's decision (2026-10-23) is that they
become **siblings of one family**: one style and rig, clearly different from each other. Until that redesign, each
keeps its current look.

### Character rules (Dombi's, to carry into the family)

- Simple and cool, suits teens and adults. **Never kawaii:** no blush, no anime eyes, no tongue.
- Tall white pill eyes, a plain centred smile (the off-centre smirk only on wink and proud faces).
- Hands are two plain circles, hidden by default, shown only for gestures (wave, celebrate, think).
- Built natively (Rive for animation, Pencil for design), never pasted PNGs.
- Reacts with face and gestures to answers and celebrations; speaks in short bubbles only when guiding.
- Sleepy late at night, glad when the learner comes back. Never sad, never guilt-tripping.

### Dombi (English)

- Floats as a fixed overlay, bottom right above the tab bar, not part of the scrolling layout. Content scrolls
  under him.
- His bubble opens beside him for about 4 seconds (or until tapped) for greetings, tips and celebrations, then he
  is quiet.
- On **Speak** he is the one you talk to and sits in the middle of the screen in a glow.
- In lessons he sits in the corner; tap him for help steps; after two misses he offers help.
- Adapts to the phone: **Full** (animated everywhere), **Light** (animated at key moments, stills elsewhere),
  **Still** (a still face per mood). Measured quietly in onboarding, re-checked later, overridable in Settings.
- Says "Dombiman". Voice is acted line by line, not babble or flat reading.
- Rig: `design/rive/out/waiters.riv`, view model `Dombi` (13 moods, 5 gestures, 12 mouth shapes, correct / wrong /
  celebrate triggers).

### Bloub (Math)

- The same Bloub everywhere: Today, the Board Tutor, lessons, moments and the home widget.
- The learner can change his body shape and colour, and dress him in one hat, one pair of glasses and one extra
  at a time, bought with gems in Bloub's room (`domain/bloub_style.dart`).

---

## 10. Icons and pictures

- Use the app's own icon set, drawn in Rive and exported to `pendev/icons-r2`.
  - **Colourful icons** for things: flame, phrase bubble, coffee, cart, trophy, bulb, studio mic.
  - **Single-colour glyphs** for small controls: `glyph-<name>-<dark|grey|violet|white>` (arrows, lock, settings,
    close).
- A missing icon is drawn in Rive in the same style. No icons from another set.

---

## 11. Lesson and game screens

### Math: game-engine rules

- **One stage per screen**: a soft, light stage the tools and objects sit on.
- **Numbers sit on the objects**, not in captions beside them.
- **One HUD pill** per screen, on top.
- **No text over art.**

### English: exercise rules

- An exercise trains what it says it trains (listen first, not read-then-say).
- The learner always has a clear cue for what to produce.
- It fits a small phone (four sound buttons, not five pictures against five phrases).
- Exactly one right answer; ambiguous items get a context line.
- **Speak first.** "Can't speak now" turns speaking off for the session in one tap: speaking-only exercises are
  saved for later, recall exercises switch to word tiles. Typing never replaces speaking.
- No double confirmations: a tap that is already a decision acts at once.
- A mistake shows the right answer, moves on, and comes back at the end of the lesson.

---

## 12. Words

- **Short and literal.** Name things by what people see. "Mikrofonni yoqamiz", not a tagline.
- **No slogans:** no "X is the heart of Y", no em-dash taglines, no hype adjectives.
- **Everyday Uzbek**, not Russian borrowings or jargon ("so'zlarni tanlab javob berasiz", not "plitkalar").
- The mascot explains the concrete reason in first person.
- End screens show the result in one plain line.
- New Uzbek lines are checked by the owner or a native speaker before they ship.
- Math writes English as the source text and translates to Uzbek (Latin) and Russian. English's interface is
  Uzbek only for now.

---

## 13. How a screen gets made

1. **Design first, in Pencil** (`pendev/Akademiya English.pen`). New work uses only the `ds-` variables.
2. For an important screen, draw **2–3 clearly different versions** side by side. The owner picks or mixes.
3. Check every frame with `design/system/pencil-check.js` (rules: `small-text`, `off-scale`, `raw-colour`,
   `old-variable`, `width`, `no-dombi`, `two-heroes`). `total: 0` passes.
4. Check by eye:
   - one clear main action
   - a large title
   - at most one coloured hero card
   - the mascot present
   - nothing under 12, body 16
   - dark mode works
   - fits 360 wide
   - every element has a source
5. Design every state: first time, empty, loading, offline, error, dark.
6. Build screen by screen and check on the phone.

---

## 14. Where the apps differ today

Known gaps between the shared tokens and what Math's code does now. Math is meant to copy `tokens.json` into
`lib/core/theme.dart`; until then:

| Thing | Tokens | Math today |
|---|---|---|
| Card corners | 20 | 18 (`Shapes.radius`) |
| Heading size | title 26 / heading 20 | 24 (`headlineSmall`) |
| Body weight | 700 | 600 (`bodyMedium`) |
| Label | 12, 900 | 13, 900, faint grey |
| Purple | English's main colour | `grape #7C4DFF`, a quantity colour in Math objects |
| Tab bar | — | Glass droplet with labels; English: icons only in a rounded square |
| Wrong-answer limits | — | Math has hearts; English never blocks learning (owner: separate for now) |

The `grape` / violet overlap matters once both apps share a family look: a learner who uses both will see
English's main colour as a content colour in Math.
