# Dombi in sync: voice, subtitles, mouth and held actions: design

Date: 2026-10-30. Builds on `2026-10-30-dombi-action-engine-design.md` (the catalog, the word list, the director, the
living layer). Code lives in `src/speak-lab/` (the browser speak lab) and the Rive rig in `design/rive/`.

## 1. Why

The engine built earlier makes Dombi act, but each action plays once for its fixed length (0.5-2.5 s) and he goes back to
idle, at most one action per sentence. He says "I'm freezing, it's so cold today" and shivers once on "freezing", then sits
still for the rest of the line. The owner: "dombi can not just emote once and that's it, that would be static or just
boring, you gotta hold the timing as well."

Two bugs the owner saw in the old version:
- **The mouth stopped working.** Likely cause, found in the rig: the state machine layer `Mouth` (index 7) sits above
  `PlayOnce` (index 12) and `Face`; a lower layer wins a shared property, and most moves key the mouth shape, so while a move
  plays its mouth beats his talking mouth. Also the mouth today is a stand-in: a shape every ~95 ms picked from loudness,
  not from the words (`talk.js`, `SHAPES`).
- **Action names in the subtitles**, like `[jump]`. `cleanCaption` (`rules.js`) now strips `[...]`, `<...>` and `{...}`,
  but not `*jumps*` or `(laughs)`. The owner has never heard a tag spoken aloud, only seen it.

## 2. Goals, non-goals, anti-goals

Goals
- His voice, the subtitles, his mouth and his actions all run on one clock and never drift apart.
- The subtitles show each word as he says it, the current word lit.
- Real lip sync: mouth shapes from the words he says, now (not later).
- An action can be **held**: a shiver keeps going until the sentence ends or the topic changes; a dance keeps going while
  he is still on that topic; a face holds until the idea ends.
- Several actions in one line, each on its own word ("gasp on *what*, angry face held, head shake on *no*").
- Between actions he keeps small talking motion, so he is never frozen while he speaks.
- His mouth never freezes while his voice plays.

Non-goals
- No change to what Gemini says, the packs, the mic switch or the living layer's idle/listening behaviour.
- Not every move becomes holdable now: 30 first (§4.6), the rest stay play-once and their face carries the hold.
- No phone build in this work; the browser speak lab is the target.

Anti-goals (a failure even if it technically works)
- Subtitles running ahead of or behind his voice, or showing anything that is not a spoken word.
- A held action that outlives the thing he is talking about, or keeps going after he stops talking.
- Constant busy motion: actions stacked so densely he looks nervous. Dombi is cool, never kawaii, never sad.
- His voice ever waiting for an action, the director or the clock (nothing is awaited on the audio path, as today).

## 3. Decided by the owner (2026-10-30)

1. A held move lasts until its sentence ends or the topic changes.
2. Several actions in one of his lines are fine.
3. Small talking motion between actions: yes.
4. "Emojis" meant the action names that showed in the subtitles; there is no emoji art.
5. Dances keep going while he stays on the topic.
6. Subtitles in time with his voice, the current word lit: yes.
7. Tags were only ever seen, never heard.
8. His mouth keeps talking during every move; moves that need the mouth wait for a pause; real lip sync now.
9. Split the 30 best moves into start / repeating middle / end first, the rest later.
10. The director planning the whole line (~0.5 s later, a small cost per line) is fine.

## 4. How it works

### 4.1 The word clock (one clock for everything)

Gemini Live sends his voice as audio chunks and his words as a text stream (`outputTranscription`), with no word times.
A new module (`src/speak-lab/clock.js`, pure, unit-tested) gives every word of his turn a start and end time on the audio
player's clock:

- Each word gets a weight from its sounds: the lip-sync engine's own durations (`design/rive/talk/engine.js`: stressed
  vowel 170 ms, plosive 70 ms …; comma pause 220 ms, sentence pause 420 ms) summed per word.
- The audio received so far for the turn is spread over the words received so far in proportion to their weights; when
  text runs ahead of audio, the words past the audio are provisional and get re-timed as more audio arrives.
- Correction: a quiet gap in his actual audio (player amplitude under the floor for 150 ms or more) is matched to the
  nearest punctuation pause, and the words after it are re-anchored there.
- Everyone asks the clock "which word is playing now" and "when does word k start / end". It replaces `wordTime` in
  `actions/rules.js` (today a plain words-over-audio split with a fixed 590 ms offset; that offset goes once the clock
  measures real playback time).

### 4.2 Subtitles

- The live caption shows his words as he says them: a word appears when the clock reaches it, the word playing now is lit,
  earlier words stay in normal colour. The finished line in the transcript (with its Explain / Slower buttons) is the full
  cleaned text, as today.
- Tag cleaning, in `cleanCaption`: keep today's rules; add `*...*` and `_..._`; remove `(...)` only when everything inside
  is a stage direction (a catalog id or word, or a short list: laughs, sighs, giggles, whispers, gasps, sings, coughs,
  clears throat). Normal brackets like "(in Uzbek)" stay. A word the subtitles hide is also skipped by the clock, the lip
  sync and the word list.

### 4.3 Lip sync

- Mouth shapes come from the words: `design/rive/talk/engine.js` turns text into a timed viseme track (EN/UZ/RU rules,
  CMUdict for English). Each word's visemes are fitted into that word's slot on the clock; the rig already takes
  `viseme` 0-11.
- A loudness gate on top: while his audio is quiet for more than ~80 ms the mouth goes to rest (0), so it never flaps over
  silence; a barge-in (`interrupted`) closes it within ~100 ms.
- Rive: the `Mouth` layer becomes the lowest layer (it wins), and it keys the mouth **only while `talking` is true**; its
  not-talking state keys nothing, so faces and moves show their own mouths when he is quiet.
- Catalog actions marked `mouth: true` (sneeze, tea, gum, ROFL, shush, evil laugh …) still play only in a pause, as today,
  and never hold. While one plays the app sets `talking` false (his voice is quiet then), so the Mouth layer lets go and the
  move's own mouth shows.
- `player.amp()` today reports the loudness of the last chunk received, not of the sound playing now; the gate and the
  clock's quiet-gap correction need the loudness of what is playing, so the player measures that.

### 4.4 Beats: the plan for a line

A **beat** is one action placed on his line: `{ action, word, until }`, where `until` is one of
`word:<k>` (ends on that word), `sentence` (ends with the sentence), `topic` (keeps going into later sentences until the
director drops it or a new beat replaces it). Faces and moves are separate tracks: a face beat and a move beat may overlap;
two move beats may not (the new one replaces the held one).

- **Word list** (instant, as today): a match places a beat on its word with `until: sentence`.
- **Director** (Flash-Lite, `POST /direct`): still called per clause, so its beats land while the words are still ahead of
  his voice; it now sees the whole line so far plus the clause it plans, and answers a short plan for that clause, up to 3
  beats, plus `keep` for whether a running `topic` hold still fits. A `word:<k>` end is given as the word's text and means
  its last occurrence in the clause. New answer shape:
  `{"beats":[{"action":"shiver","word":"freezing","until":"sentence"}],"keep":true}`. `director.md` is rewritten to ask
  for this; its tone rules stay (prefer nothing over a weak pick, never repeat the recent list, "big" only at real peaks).
- Rules (replacing the one-per-sentence rule in `decide`): at most 3 beat starts per sentence; at least ~700 ms between two
  beat starts; never the same action twice in a row (a family variant instead, as today); "big" moves keep their
  every-few-turns limit; a director beat that arrives after its word was spoken is dropped, or moved to the end of the turn
  if it is a mouth action (as today).
- Every hold ends at the latest when: its `until` is reached, a new move beat starts, the learner barges in, his turn's
  voice ends (plus a ~300 ms tail), or a safety cap of 10 s.

### 4.5 Holding, in the app

- `dombi.fire(rig, ms)` grows a held form: `hold(rig)` starts it, `release()` ends it. For a holdable move it fires the
  trigger and sets a new view-model boolean `hold` true; release sets `hold` false and the move plays its end part. For a
  face it sets the mood and keeps it until release (today's `faceHeld` timer, with the end time coming from the clock).
- A move that is not holdable plays once, and its matching face (the move's family face, e.g. a cold face for shiver's
  family, chosen by the builder per family) holds for the rest of the beat instead.
- The living layer stays paused while a beat holds, as `fire` pauses it today, and it no longer picks catalog moves while
  he talks: the beats and the talking motion (§4.7) are his only motion then, under one spacing budget.

### 4.6 Holding, in Rive

- For each holdable move: `once/<name>` (start, as today) → `hold/<name>` (a seamless loop) while `hold` is true →
  `end/<name>` → `once/idle`. Today's `once/<name>` exit is split at a loopable point; the end part brings him back to the
  neutral pose exactly as today's tail does.
- A new move trigger during a hold cuts straight to the new move's start (150 ms blend), not through the old end.
- First 30: dance, wiggleDance, robotDance, headbang, airGuitar, applause, cheer, laughHard, drumroll, shiver, phoneScroll,
  lookAround, readBook, writeNote, magnify, chinRub, headScratch, impatient, armsCrossed, fingerWag, boxing, doubleFlex,
  dozeOff, sweat, steam, hideFace, sneakyLook, wobbleJelly, bounceBall, yesYes. The catalog marks them `hold: true`.
- Built with the builder scripts (`design/rive/dombi_*.js`, Rive MCP), filmed and checked like every batch, then marked
  keep / redo by the owner on `src/speak-lab/actions.html` (which gets a "hold" button that starts and releases a hold).

### 4.7 Talking motion between beats

- While he talks and no move beat holds, small motion on the clock's stressed words: a slight nod, a small head tilt, a hand
  beat. At most one every ~600 ms, never the same twice in a row, softer than any catalog move.
- Rive: a new trigger `beat` with 3 short variants (~250-400 ms), in its own layer that keys only a new wrapper group the
  other layers do not touch, so it never fights a move, the sway or the breath.

### 4.8 Talk log

The talk log (`timing.json`) gets the clock's word times, every beat (placed / held / released / dropped, with its word and
`until`), and the viseme track, so a talk can be checked after the fact.

## 5. Checks

- Unit tests (node --test): the clock (weights, re-timing as audio arrives, quiet-gap correction), beat rules (spacing, max
  per sentence, replace, every way a hold ends), tag cleaning (the new cases and "(in Uzbek)" kept), the director's new
  answer shape parsed and bad answers ignored.
- Browser checks in `src/speak-lab/checks/` with the fake Gemini: the lit word follows the audio within ~100 ms; a hold
  started on "freezing" releases at the sentence end; a `topic` hold carries into the next sentence and ends on a new beat;
  the mouth moves through a whole line while a move plays; no tag text ever reaches the screen; a barge-in ends every hold.
- The existing acting / mic / talk checks and the 55 unit tests keep passing.
- Rive: each of the 30 filmed (start, a few loops, end) and the owner marks them.

## 6. Cost

The director is called per clause as today; its answer gets longer (up to 3 beats), so a little more output per call on
Flash-Lite. No other new calls. Lip sync and the clock run in the browser.

## 7. Left to the builder

- The exact weight and correction maths in the clock, within §4.1.
- How CMUdict reaches the browser (bundled file, size kept reasonable) and how `engine.js` is shared with `src/speak-lab`.
- The loop points and end parts of the 30 moves, and the face each non-holdable family holds.
- The three `beat` motions and the wrapper group they own.
- Exact numbers: spacing (~700 ms), max beats (3), quiet gate (~80 ms), tail (~300 ms), cap (10 s), all in `config.js`.

## 8. My calls (for the owner to check)

- Subtitles reveal word by word as spoken (rather than showing the whole sentence faded with the word lit).
- `(...)` is only removed when it holds a stage direction, so real brackets survive.
- A new move during a hold cuts straight in instead of playing the old move's end first.
- A move that cannot hold yet carries the hold with its family's face.
- The 30 first holdable moves listed in §4.6 (teaSip left out: it uses his mouth, so it never holds).
- The director stays per clause (seeing the whole line so far), so its beats arrive before their words are spoken.
- The living layer stops picking moves while he talks; beats and talking motion replace it.
- A 10 s cap on any hold.
