# LOCKED — Exercise Types (English app)

**Status:** Locked · **Date locked:** 2026-10-08
**Related:** [activities.md](activities.md) · [teaching-programme.md](teaching-programme.md) ·
[scene-simulation-concept.md](scene-simulation-concept.md)
**Working prototype:** `src/exercise-lab/` (run: `python -m http.server 5173 --directory src/exercise-lab`)

Activities say *what* is practised; exercises are the actual screens. Content shown is the café-unit sample.

## Design rules (every exercise must pass these)

1. **Real purpose** — it trains what it claims (e.g. text is hidden when the goal is listening).
2. **Clear cue** — the learner always knows what to produce (a task in Uzbek/Russian, not a lone icon).
3. **Fits a phone** — no layouts that need many pictures side by side.
4. **One right answer** — context lines remove ambiguity; choice options contain exactly one correct
   English answer.
5. **Speak first** — the mic is the main input; typing is never a substitute for speaking practice;
   no long typing on a phone (1–3 words max).
6. **Pick, then check** (changed 2026-10-12, owner's choice) — in tap exercises a tap only picks the
   answer (violet) and can be changed; the TEKSHIRISH button checks it, as in Duolingo. The old rule
   was "a tap that is already a decision acts immediately".

## Answer inputs

🗣️ Speak (main) · 👆 Tap (2–3 options) · 🧩 Word tiles · ⌨️ Type (1–3 words only) · ↔️ Match

## The 16 exercise types

| # | Activity | Exercise | How it works | Ladder |
|---|---|---|---|---|
| E1 | Picture Talk | **Meet It** | Listen first: picture + Uzbek/Russian meaning + audio, **no text**. Repeat what you heard; text appears in feedback ("Stuck? Show the text" link). | Intro |
| E2 | Picture Talk | **Say What You See** | A task in Uzbek/Russian ("You want coffee. Tell the waiter.") + picture → say the English phrase. Hint shows only the first words. | Recall |
| E3 | Picture Talk | **Match Rush** | 4 sound buttons (🔊 1–4) ↔ 4 phrases against the clock. Silent mode: Uzbek/Russian ↔ English. | Recognise |
| E4 | Build the Sentence | **Tile Builder** | Uzbek/Russian sentence → build English from tiles (with 2 distractors) → optional read-aloud. | Rebuild |
| E5 | Build the Sentence | **Complete the Chunk** | Picture cue + phrase with a gap → pick from 3 (only one correct English form). | Recognise |
| E6 | Overheard | **What Happened?** | Conversation plays with no text → one question with 3 picture answers → transcript appears. | Recognise |
| E7 | Overheard | **Who Said It?** | Conversation plays → "Who said '…'?" → Waiter / Customer. | Recognise |
| E8 | Overheard | **Missing Word** | Hear the sentence → type the 1 missing word (numbers accepted as digits too). Silent: choose from 3. | Recall |
| E9 | Echo | **Echo Line** | Character says a line → repeat right after → each word green/orange; tap orange to hear it. | Recall |
| E10 | Sound Duel | **Which One?** | Fast rounds: hear "ship" or "sheep" → tap it (8 rounds). Needs sound. | Recognise |
| E11 | Sound Duel | **Say Both** | Say both words of a minimal pair so they sound different. | Recall |
| E12 | Spot the Rule | **Find the Pattern** | 4 examples → guess the rule → 2-line Uzbek/Russian confirmation. | Notice |
| E13 | Fix It | **Tap the Mistake** | Context line (Uzbek/Russian) + sentence with one typical mistake → tap the wrong word. **"Tap the gap" mode** (added 2026-10-09): for missing words, tap the gap where a word is missing. | Recognise |
| E14 | Fix It | **Fix & Say** | Context line + wrong sentence → say the corrected sentence. | Recall |
| E15 | Quick Reply | **Guided Reply** | Waiter's question → choose a reply → say it → waiter reacts. | Use |
| E16 | Quick Reply | **Free Reply** | Say anything to the waiter; AI reacts and corrects by recasting. Ends with 🙂 / 😄 / 🤩. | Use |

## Difficulty ladder

Each phrase climbs **Recognise (tap) → Rebuild (tiles) → Recall (say from memory) → Use (conversation → Scene)**.
The engine moves a phrase up as it is mastered and back down when it is being forgotten.

## Feedback

- **Correct:** short sound + light vibration; sometimes a small character reaction. No generic praise.
- **Mistake (Duolingo-style, updated 2026-10-09):** never says "wrong" or "not yet" — shows the correct answer
  with audio + one-line Uzbek "why" when it is a known pattern, then moves on; the item is asked again at the
  end of the lesson until answered correctly.
- **Almost (speaking):** words coloured green/orange; tap a word to hear it.

## "Can't speak now" (works like Duolingo's)

One tap turns speaking off for the session:

| Exercise type | While speaking is off |
|---|---|
| **Speaking-only** — E9 Echo, E11 Say Both, E15 Guided Reply, E16 Free Reply | Skipped **as a whole** and saved for later |
| **Recall** — E1 Meet It, E2 Say What You See, E14 Fix & Say | Switch to word tiles |

- A "Speaking is off · Turn on" control brings speaking back; saved exercises return.
- A blocked microphone behaves like "Can't speak now".

## Modes

| Mode | Behaviour |
|---|---|
| **Full** | Sound + speaking |
| **Headphones** | Sound on, speaking off → same as "Can't speak now" (Say Both points to Which One?) |
| **Silent** | No sound, no speaking → listening becomes reading; Meet It = read, then build from memory; Which One? unavailable |

## Not final in the prototype

- Free Reply uses simple offline rules; the real app uses an AI model.
- Browser voices and emoji pictures are placeholders (art style not chosen yet).
