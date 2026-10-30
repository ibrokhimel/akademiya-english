# Dombi action engine: design

Status: draft for the owner's approval, 2026-10-30. Builds on the speak lab (`docs/superpowers/specs/2026-10-28-speaking-companion-design.md`, code in `src/speak-lab/`).

## 1. Why

The owner's words: plain talk with Dombi is boring ("shunchaki suhbat, i dont like them"). Dombi sits in one place and only his face changes, so the talk feels like a voice with a sticker. Aloa's characters act. The owner wants Dombi to:

- act out what **he** says (talks about samsa, eats one; says "fight me", fists up; FINALLY, a dance),
- do random stuff on his own and move around, "not just sit in one place",
- keep doing his random stuff while the learner talks, in a listening way,
- grow to a big catalog of emotes (100–200 was the owner's number) without the engine changing.

Gemini Live can't pick the actions itself: the voice model speaks anything it writes. Our `set_mood` tool was read aloud, and in one talk on 28 Oct it put tags like `[smirk]` in front of its lines. That talk was before the tool was removed; there are none in the six logged talks since.

## 2. Goals, non-goals, anti-goals

**Goals**
- G1. Acting: while Dombi talks, an action from the catalog plays on the word it belongs to.
- G2. Living: when nothing is being acted, he fidgets, plays and travels around the stage, with weighted randomness that never repeats the same thing twice in a row.
- G3. While the learner talks he keeps living, but only in small listening moves (tilt, nod, lean in, eyes on them).
- G4. A mic switch: automatic (hands-free, as now) or hold-to-talk.
- G5. The catalog is data. Adding an emote = drawing it in Rive + one catalog entry. Nothing else changes.
- G6. Version 1 runs on the 56 actions the owner already approved on `src/speak-lab/actions.html`.

**Non-goals (this version)**
- Reacting to the learner's words (they say something dumb, he facepalms). The owner chose "acting out what he says" first.
- Scenes, the phone app, touch interactions (those live on `design/rive/play.html`).
- A vector database. One cheap model call with the whole catalog in it is enough until the catalog passes about 1,000 entries.

**Anti-goals: it fails, even if it technically works, when**
- he moves all the time and it gets tiring or pulls the eye off the words,
- he travels or does something loud while the learner is mid-sentence,
- every line gets an action, or the same action comes twice in a row,
- an action is late: it lands after the sentence it belonged to,
- picking an action slows his voice down by even a little (the voice never waits for the engine),
- he speaks or shows a tag (`[smirk]`, `<...>`),
- anything cutesy (Dombi stays cool, never kawaii; see memory `pet-dombi`).

## 3. Decided by the owner

- An engine first, before more emotes. Gemini decides the actions.
- Acting out **his** lines comes first.
- He does random stuff and moves around the screen.
- He keeps living while listening, in a listening flavour.
- A mic switch: auto-detect or hold-to-talk, on the start screen and also during the talk (accepting a reconnect that might cost some of the talk).
- Claude builds every animation in Rive through the Rive connection. The owner judges each one on the actions page (keep / redo).
- All 56 existing rig actions are approved (16 of them remade on 29 Oct, commit a0f5ef7).

## 4. How it works

```
Gemini Live ──audio──▶ player ──▶ speakers
     │
     └─captions (arrive ahead of the audio)──▶ ACTING: word list (instant) + director (Flash, per sentence)
                                                   │ picks {action, word}
                                                   ▼
                     scheduler: lands it when that word plays, keeps the budget
                                                   │
LIVING: weighted random picker (by state: idle / listening / talking) ──▶ Dombi on the stage
                                                   │                        (Rive triggers / enums
                                                   │                         + page moves his canvas)
```

### 4.1 The catalog (`src/speak-lab/actions/catalog.js`)

One entry per action:

| Field | Meaning |
|---|---|
| `id` | e.g. `eat`, `trickSpin`, `play:sleep`, `gesture:point`, `mood:surprised` |
| `rig` | how to fire it: trigger name, or enum + value (`play`, `gesture`, `mood`) |
| `family` | one of about 15 (below) |
| `kind` | `once` (plays and ends), `loop` (runs until stopped, with a max time), `face` (a mood) |
| `ms` | how long it takes (loops: how long the engine keeps it) |
| `use` | one line for the director: when it fits ("he talks about food or eating") |
| `words` | instant-match words, English and Uzbek ("samsa", "plov", "ovqat", "eat", "hungry") |
| `mouth` | true if it uses his mouth (eat, wake's yawn): never while he is talking |
| `big` | true for the loud ones (celebrate, dress, trickShades): rare |
| `life` | weight in the living layer per state, 0 = acting only |
| `talk` | false for touch-only actions (held, pet, wind, back, tapped): never used in a talk |

Draft families for the 56 (the builder finalises the table):

| Family | Actions |
|---|---|
| celebrate | celebrate, clap, correct, gesture celebrate, mood happy / laugh / proud |
| show-off | trickSpin, trickFlick, trickShades, smug, dress, grow, mood wink |
| surprise | mood surprised, hop, land |
| think | mood think / confused, gesture thinking |
| annoyed | poke2, poke3, shook, mood focus |
| dizzy | dizzy |
| food | eat |
| lazy | play sleep, wake, play warm, mood sleepy |
| greet | gesture wave |
| explain | gesture point |
| oops | mood oops, ahem, wrong |
| listen | mood listen, idle nod / lean-back, play peek |
| move | play walk, hop, land |
| offer | play highfive, playoff |
| touch-only | held, pet, wind, back, tapped, poke1 |

### 4.2 Acting

1. **Word list (instant, free).** As his caption streams in, each new word is checked against every catalog entry's `words`. A match schedules that action.
2. **Director (Gemini Flash, per clause).** When the caption reaches a clause end (`,` `.` `!` `?`, or 8 words without one), the page sends the server (`POST /direct`): the learner's last line, Dombi's sentence, the personality pack, the last few actions played, and the catalog's `id` + `use` lines. It answers JSON `{ "action": id | null, "word": "the word it lands on", "strength": "small" | "big" }`. The prompt lives in `src/speak-lab/prompts/director.md`. Flash picks the family-level idea; when the family has several actions, code picks one it hasn't just used.
3. **Late answers.** If the director answers after its word has played, the action lands at the next pause in his turn (the gap between two of his sentences) if that pause is still inside the same turn; otherwise it is dropped. The voice never waits for the director. The build measures how often answers are late (the talk logs get caption and audio timestamps for this); if most are, the fallback is a faster model or calling on fewer words, not waiting.
4. **Timing.** Captions arrive ahead of the sound. The page knows how much audio is queued in the player when a caption piece arrives. The action is scheduled for "arrival time + queued audio", adjusted by where the word sits in the piece. This is my plan; the build measures the real offset on the talk logs and corrects it.
5. **Budget** (my call, tuned by the owner's eye): at most one acted action per sentence; a `big` one at most once every three of his turns; never the same action twice in a row.
6. **Mouth actions** (eat, the wake yawn) can't play over his talking mouth. They land in the pause right after the sentence that named them: he says "Chorsu samsa is the best", then bites. That counts as on time; "late" means after his next sentence has started. Body-only actions land on the word itself.
7. **The prompt side.** `dombi.md` gets a short part: he has a body and hands and uses them, and sometimes says so ("hold on, this needs a dance"). He never describes actions in brackets.

### 4.3 Living

- A picker in the page runs every 3–8 s (random). It picks by state:
  - **idle** (between turns, silence): anything with a `life` weight: fidgets (look-around, weight-shift, nod), small plays (trickFlick, smug), rarely a big surprise (sleep for a few seconds, a trick), and **travel**.
  - **listening** (the learner is talking): only listening moves: mood listen, nod, lean, peek, eyes on them. No travel, nothing loud.
  - **talking** (he is talking, nothing acted): only small gestures (point, thinking, wink).
- **Travel.** The page moves his canvas across the stage (a CSS transform, eased), with the `walk` loop while moving and `land` on arrival. A few spots: left, centre, right, and peeking in at the stage edge (`play peek`). Only in the idle state. The captions stay where they are.
- **Packs tint the weights:** Dangasa sleeps and yawns more, Drama does the big ones more, Kind stays calmer, Rude does annoyed and smug more.
- **Acting always wins.** The living picker pauses while an acted action plays and starts again after it.
- **The rig's own life stays, its random breaks hand over.** Breathing, sway, blinks and eye darts stay in Rive as they are. The rig's Idle layer also picks breaks on its own (look-around, weight-shift, hop, lean-back, nod, every 8–17 s), and the Listen layer leans in when `listening` is on. Those breaks get view-model triggers and a `directed` switch: when the page drives, the Idle layer's own random breaks stop, so every bigger move comes from one picker with one budget and one no-repeat rule. This is a small Rive change on top of the 56 actions.
- **Reduce Motion:** no travel, half as many actions, no `big` ones.

### 4.4 Mic switch

- Two modes, picked on the start screen and remembered in the profile: **Avto** (now) and **Bosib gapirish** (hold to talk).
- Hold to talk: a big button at the bottom of the talk screen, and the space bar on a desktop. Only while it is held is the mic sent. Pressing it while Dombi talks stops his voice (barge-in), like now.
- It can also be switched during the talk (owner's call, 2026-10-30): a small toggle in the talk's top bar.
- Gemini side: automatic speech detection is turned off in the Live config, and the page sends "activity start" on press and "activity end" on release. The mode is locked into the session's token, so switching during a talk fetches a new token and reconnects (expected about half a second).
  - First try: resume the same conversation with the resumption handle under the new mode.
  - If Gemini refuses that, start a fresh session and send it the last few lines of the transcript as context, so Dombi carries on rather than starting over. The owner accepted that he may lose some of the talk in this case.
  - Which of the two happens is confirmed in the build.
- Bonus: in hold-to-talk his own voice from the speakers can never cut him off.

### 4.5 Captions guard

Anything in `[...]` or `<...>` is removed from his captions and from the saved transcript. It's insurance; the tags haven't come back since the tool was removed.

### 4.6 New emotes

- After the engine works on the 56: a first batch of five, made in Rive by Claude and judged on the actions page: **spit, dance, facepalm, fists up ("fight me"), eye-roll**. The owner named spit and dancing; the other three are my picks for the lines he says most.
- Then props (tea, football, phone), in batches. Each new emote is one Rive animation + one catalog entry.
- Rive rules from the existing rig: one-shots go in the PlayOnce layer and end on `once/idle`; loops go in Play; each action plays whole on its own (the 16 redone ones showed what goes wrong otherwise).

## 5. Checks

- Unit tests (`node --test`): word matching (English, Uzbek, word boundaries); scheduler budget, cooldown, no-repeat, mouth rule (lands in the pause after the sentence), late answers (next pause in the turn, else dropped); living picker by state and pack; captions guard.
- Playwright on the fake session (`?fake=1`): a scripted line "Chorsu samsa is the best. Fight me." makes `eat` play in the pause after "best" and fists-up-style actions land on their word; a learner-talking stretch fires only listening moves; hold-to-talk sends start/end and no audio when released.
- A director check on the real Flash, like `persona-check.js`: 20 sample lines with an expected family each. The score is how many it gets right, how many it leaves empty, and how fast it answers.
- The owner's eye decides the feel: a talk with acting + living on, then tuned.

## 6. Cost

One small Flash call per sentence of his (about 1–1.5k tokens in, 30 out). I expect a fraction of a cent per minute. The build measures it against the $10 budget and shows it in the cost line.

## 7. Left to the builder

The exact catalog table, word lists, weights, picker timing, travel spots, director prompt wording, file split inside `src/speak-lab/actions/`, and how the timing offset is measured.

## 8. My calls (for the owner to check)

- Reading "shunchaki suhbat, i dont like them" as "plain talk with a still Dombi is boring", not as a request to remove the free-talk mode.
- Flash as the director, called per clause; a late pick lands at the next pause in his turn, else dropped.
- Mouth actions (eat) land in the pause right after the sentence that named them.
- The rig keeps its own breathing, blinks and eye darts; its random idle breaks become triggers the page fires.
- The budget numbers in 4.2.5 and the 3–8 s living tick.
- Travel only between turns, never while the learner talks.
- The first emote batch: spit, dance, facepalm, fists up, eye-roll.
- Captions stay put while Dombi travels.
