# Speaking companion: free talk with Dombi (browser first)

**Status:** draft for the owner's approval · **Date:** 2026-10-28
**Source:** the owner's answers to the 35-question page (2026-10-28) and the Gemini tests made the same day
**Related:** [ai-plan.md](../../ideas/ai-plan.md) (after-MVP AI, "AI Speaking" tab) ·
[companion-pet.md](../../ideas/companion-pet.md) (Dombi) · [scene-simulation-concept.md](../../ideas/scene-simulation-concept.md)
(scenes stay planned, not built here) · [tech-stack.md](../../ideas/tech-stack.md) §0 (browser first) ·
[sound-plan.md](../../ideas/sound-plan.md) (Dombi's old voice)

---

## 1. What this is

The **AI Speaking** part of Akademiya English, built in the browser first: a live voice conversation with Dombi
about any topic, with the feel of Aloa. The learner picks a topic (or types one), Dombi starts talking, the
learner answers out loud, Dombi reacts at once, teases, jokes, recasts mistakes inside his reply, and mixes
Uzbek in like a bilingual friend. At the end: stars, new phrases, pronunciation notes.

**Why now.** On 2026-10-28 the owner's Gemini key was tested: Gemini Live answers in well under a second, the
voices act (laughs, whispers, sighs, panic), and the owner confirmed that three Uzbek and mixed clips in the
Puck and Zephyr voices sound like a Tashkent speaker ("Uzbek sounds right", 2026-10-28). The old Navoiy voice
is dropped: "the navoiy literally sucks" (owner).

**The bar.** Aloa (the feel: fast, funny, human) and GoPrep's Preppy on ielts.gg (an Uzbek product with daily
AI speaking practice).

## 2. Goals, non-goals, anti-goals

**Goals**
1. It feels like a real, fun person. The owner's first failure test: "it sounds like AI instead of a real human."
2. Dombi answers within about a second, can be cut off mid-sentence, and listens hands-free.
3. His Uzbek is fluent and careful: words chosen by meaning and placement in Uzbek, never a word-for-word
   translation of English.
4. It teaches without breaking the flow: recasts in speech; "say it better" and pronunciation notes as text.
5. Dombi remembers the learner from the first talk.
6. The browser version proves all of this before anything goes into the phone app.

**Non-goals for this build** (planned, not built): scenes, the town and scene characters · the help ladder ·
typing instead of speaking · call mode · free-tier minute limits · the iPhone (https) · the lessons using
Gemini instead of Whisper · recurring characters · shadow mode · twists and stakes · mistakes going into
lesson review · a daily call · the confidence check · Day 1 vs Day 30 recordings.

**Anti-goals** (a failure even if it works): a school-teacher tone · a chatbot that answers in paragraphs ·
correcting every sentence out loud · careful, boring, safe-sounding replies · Uzbek that reads like Google
Translate · a kawaii Dombi · screens or buttons beyond the ones listed here (no invented UI).

## 3. Constraints

| Constraint | Detail |
|---|---|
| Where it runs | This PC only, Chrome or Edge, full desktop width. Not phone-sized in this version. |
| The key | Never in the page. A small local server on this PC holds it (the same shape as the real app's server later). |
| Money | A paid Gemini key with a small monthly budget (amount: owner). A per-talk cap and a minutes-and-cost counter on screen. |
| Code | Plain JavaScript like `src/web/` (no framework). Files under 500 lines. Reuse the lab's pieces: the Rive Dombi, `sound.js`, `motion.js`, the component styles. |
| Age | The product is for 13+ (locked). No romance for under-18s. |
| Dombi | Cool, confident, never kawaii; "oops", never sad (locked 2026-10-10). |
| Voice | A Gemini voice. Navoiy is dropped (owner, 2026-10-28). |
| Lives at | `src/speak-lab/` as a standalone page in the app's style; plugged into the app as the AI Speaking tab once it works. |

## 4. The experience

### 4.1 Start page: pick a topic
- A short list of topic cards, in two groups: **for your goal** (from the saved goal: IELTS Part 1 questions,
  job talk, travel, school) and **just talk** (your day, football, memes and TikTok, K-pop, "roast my English",
  "surprise me"). Plus one text field: *"or type anything"*. Builder picks the first 12 cards; the owner edits later.
- A **personality** picker (§4.8) and **Start**. The learner's name and goal come from the profile (§4.7). When
  the page is served next to the existing browser app (same origin), it reads the app's saved name, goal and
  "I'm new / I know some" answer; the goal "self" means "just talk". Only when those are absent does Dombi
  ask for them in the talk itself, never with a form. Levels are named in the app's own words (Zero,
  Beginner, Elementary, Intermediate, Upper-intermediate), not CEFR codes.

### 4.2 The talk
- **Dombi opens.** He speaks first with a question, so there is never a silent screen (owner: yes).
- **Hands-free.** The mic is open the whole time; no button to hold. The learner can **interrupt** him
  mid-sentence and he stops (owner: yes). Two devices left facing each other will talk to each other; that is
  fine and expected.
- **On screen:** Dombi large in the middle with live moods (listening, thinking, talking, laugh, surprised,
  oops, proud…); **captions** of what he says under him. Not shown: the learner's transcript, chat bubbles,
  a timer, hint buttons, typing (owner's answers 24 and 34).
- **On each caption, two buttons:** *Explain in Uzbek* (a short, natural Uzbek explanation of that line
  appears under it) and *Slower* (he says that line again, slowly).
- **Feedback cards** appear quietly beside him after the learner's turn, as text, never spoken:
  **Say it better** (one native line for what the learner just said) and **Pronunciation** (one note, only when
  there is something real to say: "th sounded like z in *think*"). At most one card of each per turn; none when
  the learner said fewer than three words. Dombi himself only **recasts**: he repeats the learner's line the
  right way inside his own reply and never says "wrong".
- **End** button, top right, always visible. Minutes used and the estimated cost sit next to it (test build
  only).

### 4.3 Dombi on his own
- **Silence.** If the learner says nothing for about 45–60 s, Dombi makes a casual remark on his own ("You
  bored or what?", "Still there?"). After about 90–120 s he **whispers in Uzbek** (owner: "like 1 or 2 minutes").
  Both timers live in a config file.
- **His own initiative.** Now and then he changes the subject, asks something about the learner's life, or
  brings up a meme, like a real person would. The system prompt asks for it; no timer needed beyond the
  silence ones.

### 4.4 Language
- English by default. **Uzbek is mixed in freely, like a bilingual friend** (owner): a word, a joke, a quick
  explanation, the whisper. When the learner is doing fine, it stays mostly English.
- **Uzbek quality rule** (goal 3), written into every prompt that produces Uzbek: everyday Tashkent speech,
  meaning first, natural word order, no calques from English. This is the owner's second failure test.
- When the learner answers in Uzbek (a beginner will), Dombi answers the point, then asks for it in English
  once; he does not nag. This rule lives in `teaching.md`.
- Russian: not in this build.
- **Copy on the page.** The app's own pages are in Uzbek (`DAVOM ETISH`, `O'ZGARTIRISH`…), so the page's labels,
  topic cards, the report and the "What Dombi remembers" page are in Uzbek too; only the test bar is English.
  On the feedback cards the "say it better" line is in English (it is the line to say) with its note in Uzbek.
  The English names in this document are for reading, not the final labels. *Assumption, flagged for the owner.*

### 4.5 Level and strictness
- Dombi judges the level from how the learner speaks and adjusts on his own (owner): short, simple, slower,
  more Uzbek for a beginner; full speed, slang and harder questions for B1+.
- **How much he corrects is set by that level** (owner: "Dombi decides by level"): a beginner gets one gentle
  recast per turn at most and few cards; a B1+ learner gets recasts, "say it better" and pronunciation notes.

### 4.6 After the talk: the report
One screen: **stars (1–3)** with one line on why · **new phrases** from the talk, saved to the phrasebook ·
**pronunciation notes** (at most 3) · the level Dombi thinks the learner is at. Then *Talk again* / *Start page*.
No score history, no charts in this build.

### 4.7 Memory and the phrasebook
- **Profile**, kept in the browser: name, goal, interests Dombi picked up, level estimate, recurring mistakes,
  a two-line summary of the last talk, and the **phrasebook** (phrase, meaning in Uzbek, date).
- Dombi gets the profile at the start of every talk, so he remembers ("How was the match?"). After each talk a
  text model updates it.
- A **"What Dombi remembers"** page: the profile in plain words, the phrasebook as a list, and a delete button
  for any item or everything. This is also the privacy control.

### 4.8 Personalities
The owner wants the personality choosable, "just like Aloa". Each pack is a Gemini voice plus a style sheet.
The six packs are the owner's (named in his "Speaking feature design" session, 2026-10-27, confirmed
2026-10-28: "Yes, those six"); the voices are my call:

| Pack | Voice | Style, in the owner's words where he gave them |
|---|---|---|
| **Kind** (default) | Puck | "explains it kindly"; warm, patient, still Dombi: cool, never kawaii |
| **Rude** | Zephyr | "makes fun of the user": "qanaqa *i want two tea* jinni, yana sen buni qilaman uni qilaman deysan. *I want a tea, please* bo'ladi, ahmoq" plus rude Uzbek phrases; the learner picks it on purpose, it is never the default |
| **Funny** | Fenrir | jokes, memes, "some funny uzbek phrase" |
| **Drama** | Aoede | everything is a tragedy or a triumph; sighs, gasps, over-the-top reactions |
| **Dangasa** | Charon | lazy, slow, can't be bothered, yawns, "keyin qilamiz" |
| **Couple** | Leda | "hella kind like a couple, like asalim": sweet, affectionate, pet names |

- Every pack knows memes and TikTok and the learner's goal (owner: 16). Humour, slang and teasing are the same
  for everyone (owner: 15, "same for all"); the Rude pack's insults are the owner's own examples and stay as
  written for everyone, since the learner chooses that pack.
- **No age gate on picking a pack** (owner, 2026-10-28: "no need for age restriction, put the rizz for 13+ as
  well"). Every pack is open to everyone, and this test build has no age switch at all. One line stays in the
  Couple pack's prompt, and it is Claude's condition, not the owner's choice: with an account under 18 (the
  signup age, in the real app) the pack is sweet, doting and full of pet names, but never a boyfriend or
  girlfriend roleplay; with an adult account it can flirt. Everything else is identical for teens and adults.
- The pack's style sheet is a prompt file (§5.4); the owner edits the wording himself.

### 4.9 Screen layout (desktop)
Top bar: topic · personality · minutes and cost (test) · **End**. Middle: Dombi, large, on the lab's background,
captions under him with the two buttons. Right column: the feedback cards, newest on top, fading after a
while. Dark mode follows the system, as in the lab. The builder uses the lab's existing styles and
components; no new visual language and nothing beyond this list.

## 5. How it works

### 5.1 Parts

```
Browser (src/speak-lab/)  ──WebSocket──▶  Gemini Live  (the talk: audio in, audio out, captions)
       │
       └──HTTP──▶  Local server (src/speak-lab/server/, Node, holds the key)
                      ├─ mints a short-lived Live token for the browser
                      ├─ feedback: learner's turn audio + transcripts → gemini-3.8-flash → {better, pron, level}
                      ├─ explain in Uzbek, the report, the profile update → gemini-3.8-flash
                      ├─ "Slower": gemini-3.8-flash-tts, same voice, slow (my call; Live if the voice mismatches)
                      └─ logs minutes and an estimated cost per talk
```

- **Why the browser talks to Gemini directly:** lowest latency, and the same shape the phone app will use. If
  short-lived tokens are not available on the owner's key, the server proxies the socket instead.
- **Models** (all on the key as of 2026-10-28): the talk `gemini-3.8-live`, fallback
  `gemini-2.5-flash-native-audio-latest`; text work `gemini-3.8-flash`; slow repeat `gemini-3.8-flash-tts`.
- **The key** is read from a file outside git (`src/speak-lab/server/.env`, ignored). The browser never sees it.
  The builder copies it there from the owner's key file once; the file is listed in `.gitignore` before the
  first commit.
- **Transcripts kept.** Each talk's transcript, Dombi's audio and the feedback cards are saved under the
  server's log folder, so the owner can re-listen and the prompts can be fixed from real talks. "Reset Dombi's
  memory" clears them.
- **A fake Gemini** for the page's automated checks (the project's habit: `src/web/checks/`): a no-key mode
  that plays scripted turns, so the checks cost nothing. Real-key runs are the owner's ear tests (§6).

### 5.2 The talk, in detail
- Audio in: the mic at 16 kHz, 16-bit PCM, mono, through an AudioWorklet; echo cancellation and noise
  suppression on (hands-free with speakers means Dombi hears himself otherwise). Audio out: 24 kHz PCM
  played through a queue; the queue is dropped the moment Live reports an interruption.
- Live settings: automatic speech detection (Gemini decides when the learner stopped), input **and** output
  transcription (captions and the feedback need both), the model's emotion-aware and proactive-speech
  settings where the API offers them, session resumption and context compression so a talk can run past the
  socket's time limit without Dombi forgetting.
- Latency is measured per turn: from the end of the learner's speech to Dombi's first audio. It is shown in
  the test bar and logged.

### 5.3 Dombi's moods
The model is given one tool, `set_mood(mood)`, and the prompt asks it to call it before speaking when the mood
changes (laugh, surprised, proud, oops, think…). *Listening* and *talking* come from the audio state, not the
model; `amp` from both the mic and his own voice drives the body bounce the rig already has. If tool calls
prove unreliable in Live, the fallback is a small keyword heuristic on the captions. Mouth sync comes later
(owner: moods only).

### 5.4 Prompts
Markdown files in `src/speak-lab/prompts/`, so the owner can edit them without touching code: `dombi.md`
(identity and the shared rules), one file per personality pack, `language.md` (the Uzbek quality rule),
`teaching.md` (recasts, level, strictness), `safety.md`, `feedback.md`, `explain.md`, `report.md`,
`profile.md`. The talk's system prompt = identity + pack + language + teaching + safety + the profile.
Reply style: short turns (one to three sentences), a question back more often than not, humour.

### 5.5 Safety
From the proposed AI rules (ai-plan.md): no adult content, no personal-data requests beyond name and goal, no
boyfriend/girlfriend roleplay with an under-18 account (§4.8), Dombi says he is an AI when asked, scores are "Dombi's guess". The
model's safety settings stay at their defaults.

### 5.6 Cost
Rough estimate, to be replaced by the counter: a 10-minute talk should cost cents, not dollars. The server
counts audio seconds in and out and shows the estimate; the per-talk cap (default 15 minutes) ends the talk
politely. The monthly budget is a config value ($10 until the owner names a figure); the server refuses a new
talk once the month's estimate passes it.

### 5.7 Test bar (test build only)
Model name · latency of the last turn · minutes and cost · mic level · current mood ·
"nudge now" buttons for the two silence timers · "reset Dombi's memory".

## 6. What the browser version must prove

The owner's checks, in his own words where he gave them:
1. A ten-minute talk feels like talking to a person, not an AI; it is fun.
2. Dombi starts answering within about a second; cutting him off works.
3. His Uzbek sounds like a Tashkent speaker, not a translation.
4. The humour, memes and teasing land.
5. The feedback cards help and do not annoy; the pronunciation notes are right for the owner's own accent.
6. Two devices facing each other keep a conversation going.
7. The cost of a ten-minute talk is known.

Logged for each talk: latency per turn, minutes, estimated cost, interruptions, cards shown.

## 7. Planned for later (not built here)
Scenes and the town (the locked concept stands) · help ladder · call mode · café ambience · Dombi's own day
(sleepy at night, hyped on a streak) · the one-sound drill · free minutes and Premium · recurring characters ·
lessons on Gemini instead of Whisper (owner: "try Gemini for everything", a separate task) · the iPhone over
https · moving into the app as the AI Speaking tab · the phone app.

## 8. Navoiy: dropped
Dombi's voice is a Gemini voice from now on. What Navoiy made is still in use today: Dombi's eight spoken
Uzbek lines (`design/sound/dombi/dombi-acted/`, listed in `design/sound/dombi/lines.json`) play in the browser
app's speech bubbles (`design/motion/dombi-voice.js`, default voice `dombi-acted`) and are bundled into the
phone app (`src/mobile/src/data/assets.ts`, `metro.config.js`, `scripts/generate-assets.js`). Deleting the
folder alone would silence Dombi there.

So the removal is two steps, as a **separate task** after this build: (1) re-make the eight lines with
Dombi's Gemini voice (TTS with directions, loudness to the lab's level, the mouth-timing arrays the phone
carries, regenerate the phone assets), then (2) delete the Navoiy build scripts (`design/sound/tools/navoiy_run.py`,
`design/sound/build_dombi_acted.py`), the old clips and the Navoiy lines in `sound-plan.md`. Until step 1 is
done the app keeps playing the old clips. The lesson audio does not use Navoiy and is untouched.
*Flagged for the owner: do step 1 at all, and when.*

## 9. Left to the builder
- The exact Live API message shapes, the token endpoint and reconnects: check the current docs; the API
  moves fast.
- `set_mood` tool versus the caption heuristic (§5.3), and "Slower" as TTS versus Live (§5.1): try, keep what
  sounds right.
- The first 12 topic cards and the first wording of the personality packs.
- Timer values, the per-talk cap and the card rules go in one config file.
- Layout details inside the lab's styles.

## 10. Calls I made (the owner can overturn any of them)
- No age gate on any pack; the Couple pack's prompt keeps romance for adult accounts only (§4.8). The voices per pack; Puck for Kind.
- Dombi's eight app lines are re-made with the Gemini voice after the companion works, not before (§8).
- The monthly Gemini budget starts as a config value of $10 until the owner names a figure (§5.6).
- Feedback is text, never spoken; recasts are the only spoken correction (§4.2).
- "Slower" uses the TTS model with the same voice (§5.1).
- The profile and phrasebook live in the browser for now, with a page to see and delete them (§4.7).
- The personality packs and their voices (§4.8).
- Silence timers 45–60 s and 90–120 s (§4.3).
- The per-talk cap of 15 minutes (§5.6); the monthly budget is a config value the counter shows against.
- The page reads the app's saved name, goal and level when it is served next to the app (§4.1).
- Transcripts and Dombi's audio are kept on the server's log folder; a fake Gemini runs the automated checks (§5.1).
- A learner who answers in Uzbek is answered, then asked for English once (§4.4).
- The page's copy is in Uzbek like the app; the test bar is English (§4.4).
- Navoiy's clips stay in the app until the eight lines are re-made with the Gemini voice, as a separate task (§8).
- The owner's answers are kept beside this design: [2026-10-28-speaking-companion-answers.md](2026-10-28-speaking-companion-answers.md).
