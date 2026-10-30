# Dombi in sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dombi's voice, subtitles, mouth and actions run on one word clock; actions are planned per line and held.

**Architecture:** A pure word clock (`clock.js`) times every word of his turn on the audio player's clock. The subtitle
view, a text-driven lip sync (`lipsync.js`, built on `design/rive/talk/engine.js`) and a beat engine (rewritten
`actions/engine.js`) all read it. The director returns a short plan of beats. Rive gains a winning Mouth layer, a `hold`
boolean with start / loop / end parts for 30 moves, and a `beat` trigger for small talking motion.

**Tech Stack:** browser ES modules, Node `node --test`, Playwright checks with the fake Gemini, Rive via the local Rive MCP
(`design/rive/rive_client.js`), Gemini Flash-Lite director on the speak-lab server.

**Spec:** `docs/superpowers/specs/2026-10-30-dombi-in-sync-design.md`

## Global Constraints

- Nothing is awaited on the audio path: his voice never waits for the clock, lip sync, an action or the director.
- Every number lives in `src/speak-lab/config.js`: `BEAT_GAP_MS: 700`, `BEATS_PER_SENTENCE: 3`, `MOUTH_GATE_MS: 80`,
  `HOLD_TAIL_MS: 300`, `HOLD_CAP_MS: 10000`, `QUIET_GAP_MS: 150`, `TALK_BEAT_GAP_MS: 600`. `ACT_OFFSET_MS` is removed.
- Files stay under 500 lines. Code reads like the code around it (short comments saying why, no frameworks).
- Commits are small, one per task or less; never a `Co-Authored-By` trailer (the owner's CLAUDE.md).
- Dombi is cool: never kawaii, never sad, never busy-nervous. Copy is plain.
- Unit tests: `node --test src/speak-lab/rules.test.js src/speak-lab/actions/rules.test.js src/speak-lab/server/server.test.js src/speak-lab/clock.test.js src/speak-lab/lipsync.test.js`
  (the last two are new). Browser checks need `node design/motion/serve.js` on 8791:
  `node src/speak-lab/checks/{acting,mic,talk,sync}.js` (`sync.js` is new).
- Rive work: back up `design/rive/out/waiters.riv` to `design/rive-backups/<date>-before-<what>/` first; `export_file`
  never overwrites, so delete the stale scratchpad `test.riv` before exporting, then copy it over `out/waiters.riv`.

## Review Focus

1. Text far ahead of audio, or audio ahead of text: the lit word never jumps backwards and never runs past the sound. (Task 2 test.)
2. A barge-in while a move is held: the hold ends at once and the mouth closes within ~100 ms. (Tasks 7 and 9.)
3. Words the rules don't know (Uzbek, numbers, "IELTS", emoji, a lone dash): no throw, a sensible weight, a mouth shape or rest. (Task 3 test.)
4. A malformed director answer (not an array, 10 beats, unknown action, junk `until`, a word not in the clause). (Task 6 test.)
5. CMUdict not loaded yet (slow load, or the page opened from `file://`): the mouth still moves on the fallback rules. (Task 3 test.)

---

### Task 1: Tag cleaning

**Files:** Modify `src/speak-lab/rules.js` (`cleanCaption`); Test `src/speak-lab/rules.test.js`.

**Interfaces:** Produces `cleanCaption(text) -> string` (same name, wider rules) and `STAGE_WORDS: Set<string>`.

- [ ] **Step 1: Write the failing test**

```js
test('cleanCaption drops stars, underscores and stage-direction brackets, keeps real brackets', () => {
  assert.equal(cleanCaption('Wow *jumps* that is it'), 'Wow that is it');
  assert.equal(cleanCaption('so _shrugs_ fine'), 'so fine');
  assert.equal(cleanCaption('Ha (laughs) okay'), 'Ha okay');
  assert.equal(cleanCaption('(clears throat) Right.'), 'Right.');
  assert.equal(cleanCaption('Say it (in Uzbek) now'), 'Say it (in Uzbek) now');
  assert.equal(cleanCaption('a half tag *jum'), 'a half tag');          // still arriving: hidden until it closes
  assert.equal(cleanCaption('[jump] go'), 'go');                         // today's rules stay
});
```

- [ ] **Step 2: Run it.** Expected: FAIL on the first assertion.
- [ ] **Step 3: Implement.** `STAGE_WORDS` = laughs, laughing, sighs, giggles, whispers, gasps, sings, coughs, clears throat,
  plus every catalog id and word (import `CATALOG`). A `(...)` is removed only when every word in it, lower-cased and
  stripped of punctuation, is in `STAGE_WORDS` (multi-word entries matched as phrases). An unclosed `*` or `_` hides the
  rest, like an unclosed `[`.
- [ ] **Step 4: Run all unit tests.** Expected: PASS (55 + 1).
- [ ] **Step 5: Commit** `Speak lab: subtitles drop *actions* and stage directions in brackets`.

### Task 2: The word clock and the playing loudness

**Files:** Create `src/speak-lab/clock.js`, `src/speak-lab/clock.test.js`; Modify `src/speak-lab/audio.js` (`makePlayer`).

**Interfaces:**
- Produces `makeClock({ weigh }) -> { start(atMs), text(cleaned), audio(totalMs), close(), quiet(fromMs, toMs), words(), wordAt(t), startOf(k), endOf(k), sentenceOf(k), sentences() }`.
  `words()` -> `[{ k, text, punct, start, end }]` on the `performance.now()` clock; `wordAt(t)` -> index (-1 before the first).
  `weigh(word: string, punct: string) -> ms` is injected (Task 3 gives the real one; tests use `w => w.length * 60`).
- Produces on the player: `levelAt(t) -> 0..100` (loudness of what plays at performance time `t`, from a 20 ms envelope
  kept per pushed chunk) and `playNow() -> performance time of the sound now playing`. `amp()` returns `levelAt(now)`.

- [ ] **Step 1: Write the failing tests** (in `clock.test.js`, with `weigh = (w, p) => w.length * 60 + (/[.!?]/.test(p) ? 420 : /,/.test(p) ? 220 : 0)`):
  - `longer words get longer slots`: text "I am freezing." -> `endOf(2)-startOf(2) > endOf(0)-startOf(0)`.
  - `a closed turn ends exactly with its sound`: `start(1000); text('Hi there.'); audio(900); close()` -> `endOf(1) === 1900 ± 1`.
  - `text ahead of audio never moves a played word`: record `wordAt(t)` at increasing `t` while feeding text first then
    audio in steps; the sequence never decreases and never exceeds the last word whose start ≤ `start + audio so far`.
  - `audio ahead of text`: `audio(3000)` before any text, then text arrives: word 0 starts at `start`, not later.
  - `a quiet gap re-anchors the next sentence`: two sentences; `quiet(gapFrom, gapTo)` near the first full stop -> the
    second sentence's first word starts at `gapTo ± 1`.
  - `wordAt is -1 before start and the last word after the end`.
- [ ] **Step 2: Run them.** Expected: FAIL ("Cannot find module clock.js").
- [ ] **Step 3: Implement `makeClock`.** Words come from `tokenize` semantics (word + trailing punct). Natural times =
  cumulative `weigh`. While open, the rate is 1 (natural) unless the audio so far is longer than the natural time of the
  text so far, then the text is stretched to the audio; on `close()` the whole turn is scaled to fit the audio exactly.
  A `quiet` gap snaps the nearest punctuation pause (within ±400 ms of its estimate) to the gap and re-times the words
  after it from there; earlier words keep their times. A word's time, once its start is in the past, is never moved earlier.
- [ ] **Step 4: Player.** In `push`, compute 20 ms RMS windows (0..100 like today's peak scale) and store
  `{ at: start time in performance ms, levels }`; `levelAt` looks it up; `clear()` drops the envelope.
- [ ] **Step 5: Run all unit tests.** Expected: PASS.
- [ ] **Step 6: Commit** `Speak lab: a word clock for his turn, and the loudness of what is playing`.

### Task 3: Lip sync from the words

**Files:** Create `src/speak-lab/lipsync.js`, `src/speak-lab/lipsync.test.js`.

**Interfaces:**
- Consumes `buildTrack, visemeAt, tokenize` from `../../design/rive/talk/engine.js` (relative import works in Node and on 8791).
- Produces `loadDict() -> Promise<object|null>` (dynamic import of `/design/rive/node_modules/cmu-pronouncing-dictionary/index.js`,
  `null` on failure; start it when the talk screen mounts), `langOf(word, dict) -> 'en'|'uz'|'ru'`,
  `weighWord(word, punct, dict) -> ms` (the clock's `weigh`), and
  `makeLipsync({ clock, levelAt, dict: () => dict, cfg }) -> { at(t) -> viseme 0..11 }`.

- [ ] **Step 1: Write the failing tests:**
  - `weighWord uses the sounds: "freezing" > "it"; a full stop adds 420, a comma 220`.
  - `langOf: Cyrillic -> ru; o' g' sh ch with q or x -> uz ("qo'shiq", "xayr"); a CMUdict word -> en; unknown Latin -> en`.
  - `at(t) inside a loud word gives that word's visemes in order; between words in a pause gives 0`.
  - `quiet for longer than MOUTH_GATE_MS gives 0 even inside a word; a 40 ms dip does not`.
  - `no dictionary: English still gets shapes from the fallback rules` (dict `null`).
  - `odd words never throw and return a number 0..11`: "IELTS", "2026", "🔥", "-", "".
- [ ] **Step 2: Run them.** Expected: FAIL (module missing).
- [ ] **Step 3: Implement.** Per word, `buildTrack(word, langOf(word), { dict })` cached by text; its segs are scaled into
  the clock's `[startOf(k), endOf(k)]`; the gate holds the last 80 ms of `levelAt` samples (`MOUTH_GATE_MS`).
- [ ] **Step 4: Run all unit tests.** Expected: PASS.
- [ ] **Step 5: Commit** `Speak lab: lip sync from his words`.

### Task 4: Live subtitles, the clock and lip sync in the talk

**Files:** Modify `src/speak-lab/talk.js`, `src/speak-lab/rules.js` (`captionHtml`), `src/speak-lab/speak.css`; Test `rules.test.js`.

**Interfaces:** Consumes Tasks 1-3. Produces `captionHtml(words, k) -> string` (words `0..k` HTML-escaped and space-joined
with their punctuation, word `k` in `<span class="now">`; `k < 0` -> `''`), and `T.clock`, `T.lipsync` on the talk object.

- [ ] **Step 1: Failing test** `captionHtml shows words up to k with k lit, escapes HTML`:
  `captionHtml([{text:'Hi',punct:','},{text:'<b>',punct:''}], 1) === 'Hi, <span class="now">&lt;b&gt;</span>'`; `k=-1 -> ''`.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3:** implement `captionHtml`; run, PASS.
- [ ] **Step 4: Wire it in `talk.js`.** One clock per turn of his (new on his first audio or caption after a turn
  ended or a cut); `onAudio` -> `clock.audio`; `onCaption` -> `clock.text(cleanCaption(capText))`; final -> `clock.close()`.
  Replace the `SHAPES` interval with a `requestAnimationFrame` loop (stops on `ended`) that, while he talks, sets
  `.cap.live` innerHTML to `captionHtml(clock.words(), clock.wordAt(player.playNow()))`, sets
  `T.dombi.viseme(T.lipsync.at(player.playNow()))` when it changed (counting `T.mouthMoves`), and reports quiet gaps of
  `QUIET_GAP_MS`+ in `player.levelAt` to `clock.quiet`. Mood words (`moodFor`) are read on the words up to the lit one.
  The live line no longer shows text that has not been spoken; the filed line on final stays the full cleaned text.
  `.cap.live .now` gets the lit colour from the existing caption styles.
- [ ] **Step 5: Run unit tests and `checks/talk.js`, `checks/mic.js`.** Expected: PASS (update any assertion in those
  checks that read the live caption before the words were spoken, and say so in the commit).
- [ ] **Step 6: Commit** `Speak lab: subtitles and his mouth follow his voice word by word`.

### Task 5: Rive, the mouth wins while he talks

**Files:** Create `design/rive/dombi_mouth_layer.js`; Modify `design/rive/out/waiters.riv`.

- [ ] **Step 1:** Back up `out/waiters.riv`. Inspect the `Mouth` layer (`queryStateMachine`): its states, what each keys,
  and how it reads `talking` / `viseme`.
- [ ] **Step 2: Implement the builder:** move `Mouth` to the bottom of the layer list (it wins); its not-talking state keys
  nothing (an empty state), so faces and moves show their own mouths when he is quiet; talking states key only the mouth
  shape. Idempotent like the other builders.
- [ ] **Step 3: Verify in the runtime** (the scratchpad `frame.js` / `sheet-wide.js` pattern on `actions.html`): with
  `talking=true` and `viseme` stepping 1..9, fire `dance` and `shiver` -> the mouth follows the viseme through the move;
  with `talking=false`, `mood=laugh` and `sneeze` show their own mouths. Film it and look.
- [ ] **Step 4: Run** `checks/acting.js` and the scratchpad `actions-check.js` (`missing: []`, only the 2 known console lines).
- [ ] **Step 5: Commit** `Dombi: the mouth layer wins while he talks`.

### Task 6: The director plans beats

**Files:** Modify `src/speak-lab/server/server.js` (`POST /direct`), `src/speak-lab/prompts/director.md`; Test `server/server.test.js`.

**Interfaces:** Request adds `line` (his whole line so far) beside `said` (the clause). Response:
`{ beats: [{ action, word, until }], keep: boolean, turn }`, where `until` is `'sentence' | 'topic' | 'word:<text>'`.

- [ ] **Step 1: Failing test** `direct returns at most 3 sanitized beats`: the fake Flash answers
  `{beats:[{action:'shiver',word:'freezing',until:'sentence'},{action:'tapped',word:'x'},{action:'moonwalk'},{action:'gasp',word:'what',until:'banana'},{action:'dance',word:'party',until:'word:tonight'},{action:'nod',word:'yes',until:'topic'}],keep:'yes'}`
  -> `beats` = shiver/sentence, gasp/sentence (junk `until` becomes `sentence`), dance/`word:tonight`; touch-only and
  unknown dropped; capped at 3; `keep === false` unless the answer's `keep === true`; `turn` echoed. Also: `beats` not an
  array -> `[]`; a beat with a word not in `said` keeps `word: ''` (the engine places it at "now").
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3:** implement; rewrite `director.md` for the new shape: up to 3 beats for the
  clause, the line so far for context, `until` meanings, `keep` for a running topic hold, and today's rules (prefer
  nothing, never the recent list, big only at real peaks).
- [ ] **Step 4: Run unit tests**, then `node src/speak-lab/server/director-check.js` against the real Flash-Lite and read
  its picks for the sample lines. Expected: valid shape, sensible beats.
- [ ] **Step 5: Commit** `Speak lab: the director plans up to three beats a clause`.

### Task 7: Beats and holds in the engine

**Files:** Modify `src/speak-lab/actions/rules.js`, `actions/engine.js`, `actions/catalog.js` (`hold: true` on the 30),
`actions/stage.js`/`rules.js` (`livePick`), `src/speak-lab/dombi.js`; Test `actions/rules.test.js`.

**Interfaces:**
- Produces in `rules.js`: `beatOk({ e, at, starts, lastId, turn, lastBigTurn, reduce }, cfg) -> 'go'|'skip'|'pause'`
  (replaces `decide`: ≥ `BEAT_GAP_MS` from every start in `starts`, ≤ `BEATS_PER_SENTENCE` in the sentence, never `lastId`,
  big rule kept, mouth -> `'pause'`), and `holdEnd({ until, k, clock, voiceEndAt, startedAt }, cfg) -> ms` (the earliest of:
  the `until` word's end / the sentence's end / `Infinity` for topic; `voiceEndAt + HOLD_TAIL_MS`; `startedAt + HOLD_CAP_MS`).
- Produces on `dombi`: `hold(rig, holdable) -> handle` and `release(handle)`; a move sets VM boolean `hold` true/false
  (only if holdable; otherwise it plays once and its family face holds); a face holds until release.
  `fire(rig, ms)` stays for the living layer. `talkingOff(ms)` drops `talking` while a mouth action plays.
- `makeActing({ dombi, clock, player, cfg, ... })`: same outward methods; `apply(plan)` takes the Task 6 shape; a word-list
  match is a beat with `until: 'sentence'`; a new move beat releases the held move; `keep:false` releases a topic hold;
  `interrupted()`, `stop()` and the learner's barge-in release everything.
- `livePick` returns `null` for state `talking`.

- [ ] **Step 1: Failing tests** (replace the `decide` / `wordTime` / caption-lead tests that no longer apply):
  - `beatOk: three beats in a sentence, the fourth skipped; two starts 500 ms apart -> skip; 700 -> go`.
  - `holdEnd: sentence end; word end; topic runs to voice end + 300; never past start + 10 s`.
  - `engine: shiver on "freezing" holds from that word to the sentence end` (fake clock and dombi recording hold/release times).
  - `engine: a topic hold carries into the next sentence and ends when a new move beat starts`.
  - `engine: keep:false ends a topic hold`.
  - `engine: interrupted() releases every hold at once`.
  - `engine: a face beat and a move beat overlap; two move beats never do`.
  - `livePick returns null while he talks`.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3:** implement. **Step 4: Run all unit tests.** Expected: PASS.
- [ ] **Step 5: Commit** `Speak lab: beats on the word clock, held until their sentence or topic ends`.

### Task 8: Rive, holds and talking beats (owner review gate)

**Files:** Create `design/rive/dombi_holds.js`; Modify `design/rive/dombi_ids.json`, `dombi_machine_ids.json`,
`out/waiters.riv`, `src/speak-lab/actions.html` (a hold button per holdable move: press starts, press again releases).

- [ ] **Step 1:** Back up. Add VM boolean `hold` and trigger `beat` (the clash guard from `dombi_emotes6.js` first).
- [ ] **Step 2: Holds.** For each of the 30 in spec §4.6: pick a loop window inside today's `once/<name>`; build
  `hold/<name>` (that window, looping seamlessly) and `end/<name>` (from the window's end to neutral). Wire
  `once/<name> -> hold/<name>` at its window start when `hold` is true, `hold/<name> -> end/<name>` when `hold` is false,
  `end/<name> -> once/idle` at 100 %; the existing play-once path stays for `hold` false.
- [ ] **Step 3: Beats.** A wrapper group no other layer keys, around what the beat moves; a `Talk` layer with
  `beat` -> one of 3 variants (nod, small tilt, hand beat; 250-400 ms, Randomize Exit) -> rest.
- [ ] **Step 4: Film** each hold (start, three loops, end) and the beats; fix anything that pops, sinks or covers his eyes.
- [ ] **Step 5: Run** `actions-check.js`, `checks/acting.js`. **Commit** `Dombi: thirty moves can hold, and small talking beats`.
- [ ] **Step 6: Owner marks** the 30 holds on `actions.html` (keep / redo); redo before Task 10 closes.

### Task 9: Talking motion

**Files:** Modify `src/speak-lab/actions/rules.js` (`talkBeats`), `actions/engine.js`, `dombi.js` (`beat()`); Test `actions/rules.test.js`.

**Interfaces:** `talkBeats(words, { heldUntil, cfg }) -> number[]` word indices that get a beat: stressed or long words
(weight above the line's median), at least `TALK_BEAT_GAP_MS` apart, none while a move holds; never two in a row on the
same word pattern. The engine fires `dombi.beat()` at those words' starts.

- [ ] **Step 1: Failing tests:** gap respected; none inside `heldUntil`; an empty line -> `[]`.
- [ ] **Step 2: Run** (FAIL), **implement**, **run** (PASS). **Step 3: Commit** `Speak lab: small talking beats between actions`.

### Task 10: The sync check and the talk log

**Files:** Create `src/speak-lab/checks/sync.js`; Modify `talk.js` (log), `fake.js` only if a turn shape is missing.

- [ ] **Step 1: Write `checks/sync.js`** (fake Gemini, 8791) asserting: the lit word follows the played audio within
  100 ms (compare `clock.wordAt(playNow)` with the chunk the word arrived in); "I am freezing, it is so cold today." ->
  `shiver` held from "freezing" to the sentence end (`T.acting.log`); a `topic` hold carries into the next sentence and
  ends on a new beat; `T.mouthMoves` rises during a held move; no `[`, `*`, `(laughs)` ever in `.cap.live`; a cut mid-hold
  releases within 150 ms.
- [ ] **Step 2: Run it.** Expected: `sync: ok`. Fix the code (not the check) until it passes.
- [ ] **Step 3: Talk log** gets `clock` (word times), every beat with `placed / held / released / dropped`, its word and
  `until`, and the viseme changes; `checks/talk.js` asserts they are present.
- [ ] **Step 4: Run everything:** all unit tests, `acting`, `mic`, `talk`, `sync`, `actions-check.js`.
- [ ] **Step 5: Commit** `Speak lab: a sync check, and the talk log keeps word times and beats`.
