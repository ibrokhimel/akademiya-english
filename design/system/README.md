# Akademiya design system

One look for Akademiya English and Akademiya Math (decided 2026-10-23). The values live in
[tokens.json](tokens.json); this page says how to use them. Both apps read the same file.
English reads it in `src/mobile/src/components/system.ts`; Math should copy it into `lib/core/theme.dart`.

## What is shared and what is not

| Shared by both apps | Each app's own |
|---|---|
| Font (Nunito), type sizes, weights | Main colour: English violet, Math blue |
| Ink, greys, lines, paper | Mascot (Dombi, Bloub), one family |
| Correct, "not yet", reward and danger colours | Reward rules (separate for now) |
| Button, card and tile shapes, lips, corners | Content and screens |
| Springs and stagger | |
| Icon style, copy rules | |

## Colour

- **One main colour per app.** It goes on primary buttons, selected states, links and the hero card. Nothing else
  in the interface gets its own hue.
- **Reward yellow** is for the next lesson, streaks and rewards. It is the second colour, used for one card per
  screen at most.
- **Green means correct.** Never use it for buttons or decoration outside an answer.
- **"Not yet" is amber, not red.** A wrong answer is part of learning; red is only for deleting things.
- Text is **ink**, secondary text is **muted**. Avoid light grey for anything people need to read.
- Text on a filled card: white on the main colour, ink on reward yellow.

## Type

| Step | Size / line | Weight | Use |
|---|---|---|---|
| display | 34 / 40 | 900 | One big number or headline per screen |
| title | 26 / 32 | 900 | Screen heading |
| heading | 20 / 26 | 900 | Card heading |
| body | 16 / 23 | 700 | Running text |
| small | 14 / 20 | 700 | Captions, hints |
| label | 12 / 16 | 900, caps, +0.8 | Eyebrows above headings |
| button | 16 / 22 | 900, caps, +0.6 | Button text |

Every screen opens with a **title** (or a display number). Do not go below 12; body text is never under 14.

## Shapes

- Buttons: 16 corners, a 4-point lip in the darker tone, the face sinks on press.
- Cards: 20 corners, either a 2-point line or a full fill. Tiles on home screens: 24 corners and a 4-point lip.
- **Fill whole cards with colour** for the one thing that matters most on a screen (next lesson, streak).
  Everything else stays white or paper.
- Spacing uses the steps in `space` (4, 8, 12, 16, 20, 24, 32, 40). Screen side margin is 20.

## Motion

- Everything moves on one of three springs: **gentle** for cards and panels, **snappy** for presses, **bouncy** for
  pops and rewards.
- Lists and tab content arrive one item after another, **45 ms** apart, every time the screen opens.
- The answer panel springs up from the bottom; its icon pops in after it.
- Respect the phone's Reduce Motion setting: no movement, everything shows at once.

## Answer panel

Coloured by result, never grey. Icon, a short title, then one line saying why:

- Correct: green wash, check icon, "Zo'r!" (Math: "Nice work!"), the reason or the phrase and its meaning.
- Not yet: amber wash, bulb icon, the right answer, the reason for the mistake.

## Icons

One style: simple single-colour line icons, in ink, muted or the main colour. Full-colour pictures are for
content (lesson pictures, characters), not for interface controls.

**Exception: the bottom tab bar** keeps the colourful icons drawn in Rive (owner decision, 2026-10-23). The
selected tab shows its label in the main colour on a soft pill. (English still has colour interface icons;
replacing them is a separate step.)

## Copy

Short and literal. Name things by what people see. No slogans.
