# Dombi Action Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dombi acts out his own lines (word list + a Flash "director"), lives on the stage on his own (fidgets, plays, travels; listening moves while the learner talks), and the mic can run hands-free or hold-to-talk, switchable mid-talk.

**Architecture:** A catalog (data) of the 56 approved rig actions. Pure rules in `src/speak-lab/actions/rules.js` (matching, budget, timing, living picks) tested in node. A browser engine (`actions/engine.js`) that turns Dombi's streaming captions into scheduled Rive firings, plus a living picker and stage travel (`actions/stage.js`). A server route `/direct` asks Gemini Flash for a pick per clause. The Rive rig gets a `directed` switch so the page owns his idle breaks. The mic mode rides in the Live config; switching reconnects with the resumption handle.

**Tech Stack:** Browser ES modules, Web Audio, `@rive-app/canvas` (view model), `@google/genai` (Live + Flash) on the Node server, `node --test`, Playwright (`channel: 'chrome'`) checks, the local Rive editor MCP via `design/rive/rive_client.js`.

**Spec:** `docs/superpowers/specs/2026-10-30-dombi-action-engine-design.md` (approved 2026-10-30). It builds on `docs/superpowers/specs/2026-10-28-speaking-companion-design.md`.

## Global Constraints

- His voice never waits for the engine: no `await` on the director or the scheduler in the audio path (`onAudio`, `player.push`).
- An action lands on its word, or for mouth actions in the pause after the sentence that named it; later than the start of his next sentence = dropped (spec §2 anti-goals, §4.2).
- At most one acted action per sentence; a `big` one at most once every 3 of his turns; never the same action twice in a row (spec §4.2.5).
- No travel and nothing `big` while the learner talks; listening moves only (spec §4.3).
- Reduce Motion (`prefers-reduced-motion`, already read in `app.js`): no travel, half as many living picks, no `big` actions.
- Captions and the saved transcript never show `[...]` or `<...>` (spec §4.5).
- Uzbek page copy lives in `src/speak-lab/copy.js`; numbers in `CFG` (`src/speak-lab/config.js`).
- Dombi stays cool, never kawaii. Rive one-shots end on `once/idle`; each action plays whole on its own.
- No new npm dependencies. Every file stays under 500 lines.
- Tests: `node --test src/speak-lab/rules.test.js src/speak-lab/server/server.test.js src/speak-lab/actions/rules.test.js`. Browser checks: `node src/speak-lab/checks/talk.js` and `node src/speak-lab/checks/acting.js` with `node design/motion/serve.js` running on 8791.
- Many small commits, one per task at least; no `Co-Authored-By` trailer (CLAUDE.md).

## Review Focus

1. **Barge-in mid-action:** the learner cuts Dombi off while actions are scheduled. Expected: every pending firing for that turn is cancelled; nothing plays after `onInterrupted`. Test: Task 5.
2. **End pressed with timers pending:** acting timers, the living picker and travel must stop on `T.end()`; nothing fires into a dead view model. Test: Task 5 and Task 7.
3. **Director answers after the turn ended or for an old turn:** an answer tagged with an old turn id is ignored. Test: Task 6.
4. **Mic switch while Dombi is mid-sentence or the learner is holding:** the switch waits for neither; it clears his audio, sends `activityEnd` if held, reconnects, and the new mode works (or the context fallback runs). Test: Task 8.
5. **Words split across caption pieces** ("sam" + "sa"): matching runs on the sentence text so far, not on the piece. Test: Task 2.

---

### Task 1: Captions guard

**Files:**
- Modify: `src/speak-lab/rules.js` (add `cleanCaption`)
- Modify: `src/speak-lab/talk.js` (`onCaption`: clean before showing, before `moodFor`, and before filing the transcript line)
- Test: `src/speak-lab/rules.test.js`

**Interfaces:**
- Produces: `cleanCaption(text: string) -> string` (exported from `rules.js`).

- [ ] **Step 1: Write the failing test**

```js
test('cleanCaption drops tags in brackets and angle brackets', () => {
  assert.equal(cleanCaption('[smirk] That is my brave jonim!'), 'That is my brave jonim!');
  assert.equal(cleanCaption('<speaker_set_mood>{mood: think}</speaker_set_mood><speaker_audio>Chernobyl, again?'), 'Chernobyl, again?');
  assert.equal(cleanCaption('Choir. KWAI-er. [laughs] Go on.'), 'Choir. KWAI-er. Go on.');
  assert.equal(cleanCaption('no tags here'), 'no tags here');
});
```

- [ ] **Step 2:** `node --test src/speak-lab/rules.test.js` → FAIL (`cleanCaption` is not a function).
- [ ] **Step 3:** Implement: remove `<...>` and `[...]` runs (non-greedy, no nesting), the `{...}` payload left between them, collapse double spaces, trim. In `talk.js` the live caption shows `cleanCaption(capText)`; the filed line and `lastDombi` are cleaned too. A piece that ends inside an open `[` or `<` shows nothing past that bracket until it closes.
- [ ] **Step 4:** Run the unit tests → PASS. Run `node src/speak-lab/checks/talk.js` → all ok.
- [ ] **Step 5: Commit** `git commit -m "Speak lab: tags in brackets never reach the captions or the transcript"`

### Task 2: The catalog and word matching

**Files:**
- Create: `src/speak-lab/actions/catalog.js`
- Create: `src/speak-lab/actions/rules.js`
- Test: `src/speak-lab/actions/rules.test.js`

**Interfaces:**
- Produces:
  - `CATALOG: Entry[]`, with `Entry = { id, rig: { trigger } | { enum: 'play'|'gesture'|'mood', value }, family, kind: 'once'|'loop'|'face', ms, use, words: string[], mouth: bool, big: bool, life: { idle, listening, talking }, talk: bool, packs?: { [pack]: number } }` (spec §4.1 table; families from the spec's draft table).
  - `matchWords(sentenceSoFar: string, catalog) -> [{ id, word, index }]`: index = word position in the sentence; whole-word, case-insensitive, Uzbek apostrophes (`o'`, `g'`, `ʻ`) kept inside words.
  - `clauseEnd(sentenceSoFar: string, wordsSinceLast: number, cfg) -> boolean`: true at `,` `.` `!` `?` or after `cfg.CLAUSE_WORDS` words.
  - `entry(id) -> Entry | undefined`.

- [ ] **Step 1: Write the failing tests**

```js
test('every catalog entry fires something the rig has', () => {
  const RIG = { trigger: ['eat','dizzy','shook','clap','hop','land','smug','snap','ahem','wake','poke1','poke2','poke3','playoff','trickSpin','trickFlick','trickShades','grow','dress','celebrate','correct','wrong','tapped','blink','lookAround','weightShift','idleHop','leanBack','nod'],
    play: ['none','held','walk','pet','peek','warm','sleep','wind','highfive','back'], gesture: ['wave','celebrate','thinking','point'],
    mood: ['smirk','happy','laugh','talk','listen','think','surprised','sleepy','wink','proud','focus','confused','oops'] };
  for (const e of CATALOG) e.rig.trigger ? assert.ok(RIG.trigger.includes(e.rig.trigger), e.id) : assert.ok(RIG[e.rig.enum].includes(e.rig.value), e.id);
  assert.equal(new Set(CATALOG.map((e) => e.id)).size, CATALOG.length);
  for (const id of ['held', 'play:pet', 'play:wind', 'play:back', 'tapped', 'poke1']) assert.equal(entry(id).talk, false, id);
});
test('matchWords finds food and dizziness, whole words only, across pieces', () => {
  assert.deepEqual(matchWords('Chorsu samsa is the best', CATALOG).map((m) => [m.id, m.word]), [['eat', 'samsa']]);
  assert.deepEqual(matchWords('I am still dizzy', CATALOG).map((m) => m.id), ['dizzy']);
  assert.deepEqual(matchWords('samsara', CATALOG), []);
  assert.deepEqual(matchWords("Plov yeymiz", CATALOG).map((m) => m.id), ['eat']);
});
test('clauseEnd at punctuation or after CLAUSE_WORDS words', () => {
  assert.equal(clauseEnd('Chorsu samsa is the best,', 5, { CLAUSE_WORDS: 8 }), true);
  assert.equal(clauseEnd('Chorsu samsa is', 3, { CLAUSE_WORDS: 8 }), false);
  assert.equal(clauseEnd('one two three four five six seven eight', 8, { CLAUSE_WORDS: 8 }), true);
});
```

The five break triggers (`lookAround`, `weightShift`, `idleHop`, `leanBack`, `nod`) arrive in Task 4; the catalog includes them now.

- [ ] **Step 2:** `node --test src/speak-lab/actions/rules.test.js` → FAIL (module not found).
- [ ] **Step 3:** Write `catalog.js` (one entry per approved action + the five breaks; `use` lines in plain English for the director; `words` in English and Uzbek; `mouth: true` for `eat` and `wake`; `big: true` for `celebrate`, `dress`, `trickShades`, `grow`, `play:sleep`; `talk: false` for the touch-only ones) and `matchWords`, `clauseEnd`, `entry` in `actions/rules.js`. Add `CLAUSE_WORDS: 8` to `CFG`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `git commit -m "Speak lab: the action catalog (56 approved actions) and word matching"`

### Task 3: Scheduler rules

**Files:**
- Modify: `src/speak-lab/actions/rules.js`
- Test: `src/speak-lab/actions/rules.test.js`

**Interfaces:**
- Consumes: `CATALOG`, `entry` (Task 2).
- Produces:
  - `decide({ e, actedThisSentence, turn, lastBigTurn, lastId, reduce }, cfg) -> 'word' | 'pause' | 'skip'`: skip if `actedThisSentence`, if `e.id === lastId`, if `e.talk === false`, if `e.big` and (`reduce` or `turn - lastBigTurn < cfg.BIG_EVERY_TURNS`); `'pause'` if `e.mouth`; else `'word'`.
  - `variant(family, { lastId, rand }, catalog) -> Entry`: a random entry of that family that is not `lastId` and has `talk !== false`; `rand` injectable.
  - `wordTime({ turnStartAt, turnAudioMs, k, n, offsetMs }) -> ms`: `turnStartAt + turnAudioMs * k / n + offsetMs` (uniform speech rate; `offsetMs` measured in Task 9).
  - `pauseTime({ sentenceEndAt, moreTextAfter, cfg }) -> ms | 'turn-end'`: `sentenceEndAt + cfg.MOUTH_AFTER_MS` when nothing of the next sentence has arrived yet, else `'turn-end'` (the player's idle).
  - `late({ at, nextSentenceStartAt }) -> bool`.

- [ ] **Step 1: Write the failing tests** (cfg = `{ BIG_EVERY_TURNS: 3, MOUTH_AFTER_MS: 250 }`)

```js
test('decide: one per sentence, no repeats, big ones rare, mouth ones wait', () => {
  const c = { BIG_EVERY_TURNS: 3 };
  assert.equal(decide({ e: entry('dizzy'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'word');
  assert.equal(decide({ e: entry('dizzy'), actedThisSentence: true, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'skip');
  assert.equal(decide({ e: entry('dizzy'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: 'dizzy' }, c), 'skip');
  assert.equal(decide({ e: entry('celebrate'), actedThisSentence: false, turn: 5, lastBigTurn: 4, lastId: '' }, c), 'skip');
  assert.equal(decide({ e: entry('celebrate'), actedThisSentence: false, turn: 7, lastBigTurn: 4, lastId: '' }, c), 'word');
  assert.equal(decide({ e: entry('celebrate'), actedThisSentence: false, turn: 7, lastBigTurn: 0, lastId: '', reduce: true }, c), 'skip');
  assert.equal(decide({ e: entry('eat'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'pause');
  assert.equal(decide({ e: entry('tapped'), actedThisSentence: false, turn: 5, lastBigTurn: 0, lastId: '' }, c), 'skip');
});
test('variant never repeats the last one', () => {
  for (let i = 0; i < 50; i++) assert.notEqual(variant('show-off', { lastId: 'trickSpin', rand: Math.random }, CATALOG).id, 'trickSpin');
});
test('wordTime spreads words evenly over the audio so far', () => {
  assert.equal(wordTime({ turnStartAt: 1000, turnAudioMs: 2000, k: 2, n: 4, offsetMs: 0 }), 2000);
});
test('pauseTime waits for the turn end when the next sentence is already coming', () => {
  assert.equal(pauseTime({ sentenceEndAt: 3000, moreTextAfter: false, cfg: { MOUTH_AFTER_MS: 250 } }), 3250);
  assert.equal(pauseTime({ sentenceEndAt: 3000, moreTextAfter: true, cfg: { MOUTH_AFTER_MS: 250 } }), 'turn-end');
});
test('late once his next sentence has started', () => {
  assert.equal(late({ at: 5000, nextSentenceStartAt: 4800 }), true);
  assert.equal(late({ at: 4700, nextSentenceStartAt: 4800 }), false);
  assert.equal(late({ at: 4700, nextSentenceStartAt: null }), false);
});
```

- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement; add `BIG_EVERY_TURNS: 3, MOUTH_AFTER_MS: 250, ACT_OFFSET_MS: 0` to `CFG`. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `git commit -m "Speak lab: when an action may play, and when it lands"`

### Task 4: Rive, the page takes over his idle breaks

**Files:**
- Modify: `design/rive/dombi_redo.js` (export a `wire(layerName, stateName, trigger, back)` moved from `dombi_redo2.js`; `dombi_redo2.js` imports it)
- Create: `design/rive/dombi_directed.js`
- Modify: `design/rive/out/waiters.riv` (export), `design/rive/dombi_machine_ids.json`

**Interfaces:**
- Produces on the `Dombi` view model: boolean `directed`; triggers `lookAround`, `weightShift`, `idleHop`, `leanBack`, `nod`. With `directed = true` the Idle layer's random breaks stop (breathing, sway, blinks and gaze keep running); each trigger plays that break once and returns to the Idle layer's rest state.

- [ ] **Step 1:** Back up first: `export_file` (.riv) into `design/rive-backups/2026-10-30-before-directed/`.
- [ ] **Step 2:** In `dombi_directed.js`: add the six view-model properties; on every transition in the Idle layer from a rest state (`idle/rest-8s`, `idle/rest-12s`, `idle/rest-17s`) to a break, add the condition `directed == false`; for each break wire `Any --trigger--> idle/<break> --exit 100 %--> idle/rest-8s` with `wire()`. The Idle layer's state names are read from `queryStateMachine`, not typed.
- [ ] **Step 3: Verify in the editor:** `simulateStateMachine` for 600 frames with `directed = true` and no triggers → no break state entered; the same with `nod` fired at frame 60 → `idle/nod` entered once; with `directed = false` → breaks happen as before (compare `transitionsObserved` with an undriven run).
- [ ] **Step 4:** Export the .riv, copy over `design/rive/out/waiters.riv`. Film with the scratchpad `sheet.js` approach (fire each new trigger; one row each) and look at the frames. Run the actions page check: every control loads, no new errors.
- [ ] **Step 5: Commit** `git commit -m "Dombi rig: a directed switch, and his idle breaks as triggers the page fires"`

### Task 5: The acting engine on the word list

**Files:**
- Modify: `src/speak-lab/dombi.js` (add `fire(rig, ms)`, `trigger(name)`, `play(value)`, `directed(on)`)
- Modify: `src/speak-lab/audio.js` (player: `turnAudioMs()` total ms pushed since the last idle, `startedAt()` time the first chunk of the current stream started)
- Create: `src/speak-lab/actions/engine.js`
- Modify: `src/speak-lab/talk.js` (create the engine; feed it captions, sentence ends, interruptions, idle, end)
- Modify: `src/speak-lab/fake.js` (turns may carry `chunks: [{ text, audioMs }]` so a check can control which words arrive when)
- Create: `src/speak-lab/checks/acting.js`

**Interfaces:**
- Consumes: Task 2 and 3 rules; Task 4 triggers.
- Produces: `makeActing({ dombi, player, catalog, cfg, now, reduce, onPick }) -> { caption(textSoFar), sentenceEnd(), turnEnd(), interrupted(), learnerTurn(), stop(), log: [] }`. `onPick(clauseText)` is the hook Task 6 fills (the director call); here it is a no-op. `log` lists `{ id, word, at, how: 'word'|'pause'|'dropped' }` for the checks and the talk log.
- `dombi.fire(rig, ms)`: trigger → fire it; `play`/`gesture` enum → set it, back to `none` after `ms`; `mood` → set it, back to the mood `moodFor` last chose after `ms`.

- [ ] **Step 1: Write the failing check** `checks/acting.js` (fake session, silent mic, same launch as `checks/talk.js`):
  - turn "I am still dizzy from the bus. Chorsu samsa is the best." in two chunks of 900 ms audio → `dizzy` fires within ±150 ms of the time its word plays (from `log`), `eat` fires after `dizzy` and not before the turn's audio ends (`how: 'pause'` or turn-end).
  - turn "Samsa! Samsa again." → `eat` once only (one per sentence, no repeat).
  - a turn whose chunks split a word ("I am still diz" + "zy, bro.") → `dizzy` still fires (matching runs on the sentence so far).
  - interrupt during a turn with `dizzy` scheduled at +600 ms → nothing fires after the interrupt.
  - press End with an action scheduled → no firing after End, no page errors.
- [ ] **Step 2:** Run → FAIL (no `log`, nothing fires).
- [ ] **Step 3:** Implement `engine.js` and the `dombi.js`/`audio.js`/`talk.js`/`fake.js` changes. The engine keeps one timer list per turn and clears it on `interrupted()`, `learnerTurn()` and `stop()`; `talk.js` calls `stop()` inside `T.end`.
- [ ] **Step 4:** `node src/speak-lab/checks/acting.js` → all ok; `node src/speak-lab/checks/talk.js` → all ok; unit tests → PASS.
- [ ] **Step 5: Commit** `git commit -m "Speak lab: Dombi acts out his lines from a word list, on the word"`

### Task 6: The director

**Files:**
- Create: `src/speak-lab/prompts/director.md`
- Modify: `src/speak-lab/server/server.js` (route `POST /direct`), `src/speak-lab/server/server.test.js`
- Modify: `src/speak-lab/actions/engine.js` (`onPick` calls `side('direct', …)` at each clause end; applies the answer through `decide`/`variant`/`late`)
- Create: `src/speak-lab/server/director-check.js`

**Interfaces:**
- Consumes: `CATALOG` (the server imports `../actions/catalog.js` as it already imports `../config.js`).
- Produces: `POST /direct { learner, said, pack, recent: string[], turn } -> 200 { action: id | null, word: string, strength: 'small'|'big', turn }`. `action` is null unless it is a catalog id with `talk !== false`; `turn` is echoed so the page drops answers for an old turn. 503 without a key.

- [ ] **Step 1: Write the failing server tests** (fake gemini whose `flash` returns canned JSON):
  - a valid pick passes through with `turn` echoed;
  - an unknown id or a touch-only id (`tapped`) comes back as `action: null`;
  - the prompt sent to `flash` contains every talkable catalog id and its `use` line, and none of the touch-only ids;
  - 503 without a key.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement the route and `director.md` (input: the learner's last line, Dombi's clause, the pack, the last actions; output JSON only; prefer `null` over a weak pick; pick the family's idea, never a touch-only action). In the engine: one call per clause end, `recent` = last 4 ids; an answer for another `turn` is ignored; `word` is matched in the sentence to get `k`; if `late(...)` it lands at the next pause in the same turn (`pauseTime` with the turn's state) or is dropped and logged `'dropped'`. **Step 4:** Server tests → PASS; acting check extended with `window.FAKE.direct` returning `{ action: 'trickSpin', word: 'cool' }` on "That was cool, bro." → `trickSpin` fires; an answer delayed past the turn → logged `'dropped'`.
- [ ] **Step 5:** `director-check.js` on the real Flash: 20 sample clauses with an expected family each (e.g. "I could eat ten plov right now" → food; "wait, let me think" → think; "you nailed it" → celebrate; "ugh, stop poking me" → annoyed). Prints hits, nulls, wrong families, the median/max time, and the tokens per call (`usageMetadata`). Run it once; record the numbers in the commit message.
- [ ] **Step 6: Cost (spec §6):** set `CFG.PRICE.directPerCall` from the measured tokens and the Flash price; the engine adds it to `state.cost` per director call, so the talk's cost line and the log include it.
- [ ] **Step 7: Commit** `git commit -m "Speak lab: Gemini Flash picks Dombi's actions per clause (director)"`

### Task 7: Living on the stage

**Files:**
- Modify: `src/speak-lab/actions/rules.js` (+ tests)
- Create: `src/speak-lab/actions/stage.js`
- Modify: `src/speak-lab/talk.js`, `src/speak-lab/speak.css` (`.dbox` absolutely placed in `.stage`, transform transitions)
- Modify: `src/speak-lab/actions/engine.js` (`makeActing` takes an optional `stage`; calls `stage.pause()` when it fires, `stage.resume()` after that action's `ms`)
- Modify: `src/speak-lab/checks/acting.js`

**Interfaces:**
- Produces:
  - `livePick({ state: 'idle'|'listening'|'talking', pack, lastId, reduce, rand }, catalog) -> Entry | { travel: spot } | null`: weighted by `e.life[state] * (e.packs?.[pack] ?? 1)`; travel only when `state === 'idle'` and not `reduce`; never `lastId`; never `big` unless idle and not `reduce`; `talk === false` never.
  - `nextLifeMs({ reduce, rand }, cfg) -> ms` between `cfg.LIFE_MIN_MS` and `cfg.LIFE_MAX_MS` (doubled with `reduce`).
  - `mountStage({ stageEl, boxEl, dombi, catalog, cfg, reduce, pack, getState }) -> { pause(), resume(), stop(), log: [] }`: sets `dombi.directed(true)` on mount; each tick asks `livePick`; travel = `play walk`, a CSS transform to the spot over `distance / cfg.WALK_PX_PER_S`, then `play none` + `land`; spots `left 20 %`, `centre 50 %`, `right 80 %`, `edge` (95 % with `play peek` for 3 s).
- Consumes: the acting engine calls `stage.pause()` when it fires and `stage.resume()` when that action's `ms` is over.

- [ ] **Step 1: Write the failing tests:**
  - unit: in `listening` no travel and no `big` across 500 seeded picks; in `idle` with `reduce` no travel; Dangasa picks `play:sleep` more often than Kind over 2,000 seeded picks; never `lastId`.
  - check: learner talking for 6 s (fake `learner()` text + mic state) → only entries with `life.listening > 0` in `stage.log`, no travel; Dombi idle 20 s (`T.tick`-style fake clock or real wait with `LIFE_MIN_MS/MAX_MS` lowered through `window.FAKE.cfg`) → at least one travel and `.dbox` moved; End → `stage.log` stops growing.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement; add `LIFE_MIN_MS: 3000, LIFE_MAX_MS: 8000, WALK_PX_PER_S: 160` to `CFG`. The caption column does not move. **Step 4:** Run → PASS, `checks/talk.js` still ok.
- [ ] **Step 5: Commit** `git commit -m "Speak lab: Dombi lives on the stage: fidgets, plays, travels; listening moves while you talk"`

### Task 8: The mic switch

**Files:**
- Modify: `src/speak-lab/server/server.js` (`liveConfig(pack, system, voice, mic)`; `/token` reads `b.mic`), `server.test.js`
- Modify: `src/speak-lab/live.js` (`connectLive({ …, mic })`; returns also `activityStart()`, `activityEnd()`, `setMic(mode, contextLines)`)
- Modify: `src/speak-lab/fake.js` (records `activity` events and `setMic` calls)
- Modify: `src/speak-lab/start.js`, `src/speak-lab/profile.js` (`mic: 'auto'|'hold'`), `src/speak-lab/app.js`, `src/speak-lab/talk.js`, `src/speak-lab/copy.js`, `src/speak-lab/speak.css`
- Modify: `src/speak-lab/checks/talk.js`

**Interfaces:**
- Produces:
  - `liveConfig(..., mic = 'auto')`: `mic === 'hold'` adds `realtimeInputConfig: { automaticActivityDetection: { disabled: true } }`.
  - `live.activityStart()` / `activityEnd()`: `sendRealtimeInput({ activityStart: {} })` / `({ activityEnd: {} })`.
  - `live.setMic(mode, contextLines)`: drops the socket, opens with a new token for `mode` and the resumption handle; if that open fails, opens without the handle and sends `contextLines` (the last 6 transcript lines) as one text turn: "[The mic mode changed and you reconnected. The talk so far: … Carry on from where you were. Do not mention this note.]". Resolves `'resumed' | 'fresh'`.
  - Copy: `micMode: 'Mikrofon'`, `micAuto: 'Avto'`, `micHold: 'Bosib gapirish'`, `holdToTalk: 'Bosib turib gapiring'`.

- [ ] **Step 1: Write the failing tests:**
  - server: `liveConfig('kind', 's', '', 'hold').realtimeInputConfig.automaticActivityDetection.disabled === true`; `'auto'` has no `realtimeInputConfig`.
  - check (fake): start page shows the two mic options, the choice is saved in the profile; in hold mode no audio chunk is sent until the hold button is pressed; press → `activityStart`, release → `activityEnd`; the space bar does the same; pressing while Dombi talks clears his audio; the top-bar toggle calls `setMic('hold', lines)` with the last lines and the status shows reconnecting, then listening; switching while holding sends `activityEnd` first; switching while Dombi talks clears his audio and cancels his pending actions.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. In `talk.js` the mic callback sends only while `holding` in hold mode (`sendMic` stays for auto). **Step 4:** Run → PASS.
- [ ] **Step 5: Real check:** with the server and a real key, run a short talk in hold mode and switch modes once mid-talk (`checks/live-real.js` gains a `MIC=switch` mode). Record `'resumed'` or `'fresh'` and the reconnect time in the commit message. If the token refuses `realtimeInputConfig`, add it to `liveConnectConstraints.config` and record that.
- [ ] **Step 6: Commit** `git commit -m "Speak lab: hold-to-talk, and switching the mic mode mid-talk"`

### Task 9: His body in the prompt, and timing measured

**Files:**
- Modify: `src/speak-lab/prompts/dombi.md`
- Modify: `src/speak-lab/talk.js` (the talk log gets `timing: [{ t, kind: 'caption'|'audio'|'act', … }]`)
- Modify: `src/speak-lab/server/log.js` (writes `timing.json` next to `transcript.json`)
- Modify: `src/speak-lab/server/persona-check.js` (a `bracket` score: replies containing `[`, `<`)

**Interfaces:**
- Produces: `timing.json` per talk; `CFG.ACT_OFFSET_MS` set from the measurement.

- [ ] **Step 1:** Add to `dombi.md`, under "How a real friend talks": he has a body and hands, acts things out, and now and then says so out loud ("hold on, this needs a dance"), and never describes an action in brackets or as a stage direction.
- [ ] **Step 2:** `node src/speak-lab/server/persona-check.js kind rude` → `bracket: 0` for both, and no rise in `questions`/`stock` against the last run (`9f59db4`).
- [ ] **Step 3:** Log timing; run one real talk of about two minutes; compute the median gap between when an acted word was scheduled and when its audio chunk played; set `ACT_OFFSET_MS` to it (rounded to 10 ms). Record the numbers in the commit message.
- [ ] **Step 4:** Unit tests and both checks → PASS.
- [ ] **Step 5: Commit** `git commit -m "Speak lab: Dombi knows he has a body; acting timing measured and set"`

### Task 10: First new emotes (owner review gate)

**Files:**
- Create: `design/rive/dombi_emotes1.js`
- Modify: `design/rive/out/waiters.riv`, `design/rive/dombi_machine_ids.json`, `src/speak-lab/actions/catalog.js`, `src/speak-lab/actions/rules.test.js` (the rig list in the catalog test)

**Interfaces:**
- Produces: view-model triggers `spit`, `dance`, `facepalm`, `fistsUp`, `eyeRoll`; PlayOnce states `once/<name>` wired with `wire()`; one catalog entry each (`spit` and `facepalm` family `annoyed`/`oops`, `dance` `celebrate` and `big`, `fistsUp` `show-off`, `eyeRoll` `annoyed`), with words ("fight me", "dance", "ugh", "seriously").

- [ ] **Step 1:** Back up the Rive file. Beat sheet per emote in the script's comments (anticipation → action → hold → settle, eyes lead, hands late; skill `rive-animation` §1, §8). `spit` uses a small body-coloured blob that flies out and fades; no liquid, no gross-out.
- [ ] **Step 2:** Build with the `dombi_redo.js` helpers; export; film each as a sheet and look at every frame; fix anything that reads wrong before showing the owner.
- [ ] **Step 3:** The catalog test's rig list gains the five triggers → PASS; acting check: "Fight me." → `fistsUp` on "fight".
- [ ] **Step 4:** The five appear on `src/speak-lab/actions.html` automatically (it reads the file). Ask the owner to mark them keep/redo; redo until all five are kept.
- [ ] **Step 5: Commit** `git commit -m "Dombi: five new emotes (spit, dance, facepalm, fists up, eye-roll)"`
