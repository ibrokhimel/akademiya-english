# Sound plan

Started 2026-10-13. Status: research done, 388 options collected, **all 20 sounds chosen by the owner (2026-10-13)** and playing with the animations in the motion lab. First listen by the owner (2026-10-13): most were too loud and some came late against the particles; levels and timing redone the same day (§5). Not yet in the app.

Owner's verdict after the second listen (2026-10-13): the picks are fine for now and can change later, but **this set is not locked and not complete**. Many small interface moments are still silent (his example: no tick while turning the reminder time wheel). A second round for those moments is the open work.

Second round started the same day (§6): the owner wants the app to be as pleasing to the ear as iPhone's own controls. Direction agreed: the small sounds come from **one family**, everything sits in one key, and every sound is planned together with a tap in the hand. Four families were put in the lab to choose from. **The owner chose Sine (2026-10-13, "I guess sine is fine"), so it is the working choice, not a locked one.**
Listening page: `design/sound/` → `node serve.js` → http://127.0.0.1:8792/design/sound/

## 1. What the research says

**Duolingo.** In 2020 the app "barely had sound". The current set was made by one composer (Ambrose Yu) and finished
in 2024–2025: more than 50 sounds, all from the same few instruments (a small synth and a marimba). Their rules:

- One character for every sound: "functional, intuitive, never too serious".
- How often a sound plays decides its size. Common sounds must never wear out; rare ones must feel big.
- Rewards are one family. The combo sounds, the perfect-lesson sound and Duo's voice are all built from the
  correct-answer sound, not separate jingles.
- Settings has two separate switches: sound effects and haptics.

**Other guidance (Google Material, Apple, sound designers).**

| Topic | What they say |
|---|---|
| Length | tap 30–150 ms · confirmation 50–200 ms · most interface sounds under 300 ms · success chime up to about 500 ms · reward stingers 1.2–2.3 s · end-of-lesson 2.7–4 s |
| Pitch | going up = positive, starting · going down = ending, closing · on/off pairs are the same notes reversed |
| Small speakers | a phone plays almost nothing below 300 Hz, so the character must be in the middle and high notes; mono, dry, no long echo |
| Loudness | no published number for app effects; peaks at about −3 dB, and quieter for sounds that play often |
| Repeats | a sound heard hundreds of times a day "must be almost boring"; vary the tone a little, or step along a scale |
| Key | every sound in one musical key, so any two that overlap sound fine together |
| How many | "a typical app needs between five and twelve distinct sounds" |
| No start gap | even a few ms of silence at the start of a file makes the sound feel late |

**Not found:** what Duolingo does with sound while the microphone is on, and any official description of its
correct and incorrect sounds.

## 2. The sounds this app needs

"First" = needed for the first test build. "Later" = can wait.

| # | Sound | When it plays | Length | Character | When |
|---|---|---|---|---|---|
| 1 | Pick | an answer or word tile is picked | 40–80 ms | one soft neutral note, quiet | first |
| 2 | Tile lands | a word tile lands in the sentence line | 50–90 ms | same family as Pick; each tile one step higher | first |
| 3 | Right | the green sheet comes up | 250–400 ms | two bright notes going up; the base sound of the whole set | first |
| 4 | Not right | the "not quite" sheet comes up | 250–350 ms | soft, lower, short step down; quieter than Right; never a buzzer | first |
| 5 | Mic on / off | the mic is pressed, just before it starts listening; and when listening ends | 80–150 ms | short soft rising blip that ends before listening starts; off is the same reversed | first |
| 6 | Lesson done | the lesson result screen | 1.5–2.5 s | short happy phrase that ends on the home note | first |
| 7 | Streak | the flame lights (once a day) | 0.6–1.5 s | warm, soft ignition | first |
| 8 | Combo | the combo page at 3, 5 and 10 in a row | 0.6–1.2 s | Right plus more rising notes, brighter each time | later |
| 9 | New phrase | the "you can now say" card | 0.4–1.2 s | sparkle, reveal | later |
| 10 | Perfect lesson | lesson with no mistakes | 2–3 s | Lesson done with more on top | later |
| 11 | Count | numbers counting up, bits flying to a counter | 50–250 ms | tiny tick or coin | later |
| 12 | Level up | level up screen | 2–3 s | bigger than Lesson done | later |
| 13 | Trophy | checkpoint finished | 2.5–3.5 s | the biggest sound in the app | later |
| 14 | Award | a new award on Profile | 1.2–1.8 s | middle-size, a metal glint | later |
| 15 | Streak freeze | a freeze is used | 0.4–1.2 s | cool, glassy; calm, not sad | later |
| 16 | Button | main button press | 30–60 ms | soft tick with no note | later |
| 17 | Pop | a badge, chip or toast appears | 80–250 ms | small bubble pop | later |
| 18 | Whoosh | a sheet comes up, a tile flies | 100–400 ms | soft air | later, optional |
| 19 | Switch | a toggle is flipped | 60–100 ms | two notes up for on, reversed for off | later |
| 20 | Reminder | the daily reminder | under 1 s | gentle chime | later |

**Always silent:**

- Everything while the microphone is listening (the app would hear itself).
- Streak lost, lesson quit: picture only. The app never punishes.
- Scrolling and typing: a haptic at most. (Tabs and going back were on this line too; since 2026-10-13 they get a small family sound, see §6.)
- The progress bar growing (it rides on Right).
- Loading, offline and error screens.
- Anything that would play over the English audio of a phrase.

## 3. The options (listening page)

`design/sound/` holds a page with every sound above and 13 to 22 options for each (388 in total). Press a card to
hear it and press the heart on the ones you like; likes and notes are saved to `design/sound/picks.json`.
"Play all in a row" plays a whole group, and "rising 5 times" plays one option five times, each a step higher
(for the combo and for tiles).

- Every option is trimmed to start at once and set to the same loudness, so none wins by being louder.
- The options were chosen by name, description and measured length. Nobody has listened to them yet; the owner's
  ear decides.
- On/off sounds (Mic, Switch) play as on, a pause, off.

Where the options come from (all free to use in an app):

| Tag on the card | Meaning | Options | From |
|---|---|---|---|
| CC0 | free for anything, no credit | 181 | Freesound (CC0 only), Kenney, OpenGameArt packs, ObsydianX, akx |
| free | free to use in an app, no credit; the files may not be handed out on their own | 144 | Mixkit, Pixabay, SND, Octave, Shapeforms |
| credit | free, but the maker must be named in the app (CC-BY) | 63 | Google Material sounds, JC Sounds, ViRiX, Cyrex, Little Robot Sound Factory, dev_tones |

Files:

- `manifest.json`: every option with its source page, licence and credit line.
- `candidates/`: the trimmed, levelled copies the page plays. `originals/`: the untouched downloads (not in git).
- `sources/packs-index.json`, `sources/singles-index.json`: the licence record of everything that was downloaded
  (37 packs with about 2,700 sounds, and 235 single sounds).
- `tools/curate.py`: the list of which files were picked for which sound. `build_candidates.py` builds the page's set.
- `node check.js` opens the page in a real browser, decodes every option and tests play, like and save.

Notes on the sources: the Freesound files are the site's preview MP3s (the full-quality originals need a login);
dev_tones may not be used in sound-related apps; the SND terms can change. If a pick comes from one of these, check
its line in the index before it ships.

## 4. The chosen sounds (2026-10-13)

The owner picked one option for every sound. `python -I build_final.py` turns the picks into the app's files:
`design/sound/final/<name>.wav` (16-bit, 44.1 kHz, silence and slow fade-ins trimmed, peak at −3 dB) and
`final/sounds.json` (source, licence, credit, and for the app: `volume`, and `hit` for a sound that builds up first).

| Sound | File | Picked | From | Length |
|---|---|---|---|---|
| Right | `right.wav` | simple celebration 1 | Google Material (credit) | 0.82 s |
| Not right | `not-right.wav` | two notes down, set 9 | JC Sounds (credit) | 0.56 s |
| Pick | `pick.wav` | hover tap | Google Material (credit) | 0.24 s |
| Tile lands | `tile.wav` | drop 004 | Kenney (CC0) | 0.28 s |
| Combo | `combo.wav` | Item Pickup | Joth (CC0) | 0.66 s |
| Mic on / off | `mic-on.wav`, `mic-off.wav` | low swell, set 18 | JC Sounds (credit) | 0.14 s / 0.29 s |
| Lesson done | `lesson-done.wav` | Completion of a level | Mixkit (free) | 2.6 s |
| Perfect lesson | `perfect.wav` | Ethereal fairy win sound | Mixkit (free) | 2.4 s |
| New phrase | `new-phrase.wav` | Twinkle/Sparkle | Pixabay (free) | 1.6 s |
| Count | `count.wav` | gold pickup 1 | Little Robot Sound Factory (credit) | 0.26 s |
| Level up | `level-up.wav` | Cute Level Up 1 | Pixabay (free) | 1.7 s |
| Trophy | `trophy.wav` | Achievement Unlock | Pixabay (free) | 4.2 s |
| Award | `award.wav` | item 2A (the pick was changed from Enharpment after the first build) | ViRiX (credit) | 2.3 s |
| Streak | `streak.wav` | Match Ignite (No Strike) | Freesound (CC0) | 0.85 s |
| Streak freeze | `freeze.wav` | Chime | Freesound (CC0) | 1.3 s |
| Button | `button.wav` | sine tap | SND 01 (free) | 0.01 s |
| Pop | `pop.wav` | Pop Sound | Freesound (CC0) | 0.07 s |
| Whoosh | `whoosh.wav` | swosh 02 | OpenGameArt, qubodup (CC0) | 0.20 s |
| Switch | `switch-on.wav`, `switch-off.wav` | sine toggle | SND 01 (free) | 0.10 s each |
| Reminder | `reminder.wav` | Notification Sound, Soft and Pleasant | Pixabay (free) | 0.80 s |

Still to do with these:

- **Credits.** Four makers must be named in the app (an "About" or "Credits" line): Google Material sounds (CC BY 4.0),
  JC Sounds, UI Utility Pack Vol 1 (CC BY 4.0), Little Robot Sound Factory, Fantasy Sound Effects Library (CC BY 3.0),
  and David McKee (ViRiX) for the Award sound. The exact lines are in `final/sounds.json`.
- **Preview quality.** Streak, Streak freeze and Pop are Freesound's preview MP3s. Fine for the test build; the
  full-quality originals need a free Freesound login.
- **Lengths.** Right is 0.82 s with its tail (the plan asked for 0.25–0.4 s) and Trophy is 4.2 s (plan: 2.5–3.5 s).
  Both can be shortened with a fade if they feel long in use.
- **One key.** The picks come from eight makers. By a rough measurement Right goes A to D, Pick is a D, Tile lands
  is a C and Award is a C chord, so the set is close but not in one key. Tuning is a matter of a step or two for a
  few files, checked by ear.
- **Volumes.** Done by measurement, see "How loud" in §5. Still to be confirmed by ear on the phone.

## 5. Where each sound plays (motion lab, 2026-10-13)

The chosen sounds play in the motion lab (`design/motion/`, http://127.0.0.1:8791/design/motion/) on the same
beats as the animations. `sound.js` holds the player and the beats that are the same everywhere; each page's script
names its own moments. The tool bar has a Sound switch and a volume slider. The browser only allows sound after
the first tap on a page.

| Sound | Plays when |
|---|---|
| Button | a main button, a lesson circle or a small button is pressed (finger down). Not on tiles, audio buttons, the mic, or greyed-out buttons |
| Pick | anything becomes the picked one: answer tile, picture, word in a sentence, gap, onboarding option, rating |
| Tile lands | a word tile lands in the line, each one a step higher on a major scale; going back to the bank is lower and softer |
| Right | the moment the answer turns green (not when the sheet arrives 120 ms later); the checkpoint step ticking; "Zo'r! Sizni eshitdim"; the confidence number turning green |
| Not right | the moment the answer turns red, or the "one word off" result is shown |
| Combo | the combo page appears; 2 semitones higher at 5 in a row, 4 higher at 10 |
| Mic on / off | on: the mic is pressed. Off: listening ends. Nothing else can play in between |
| New phrase | the "you can now say" card pops (screen 17); a new phrase card on the Progress page |
| Lesson done | starts as the result screen arrives (screen 18); its roll runs under the counting numbers and its hit lands 1.1 s in, with Dombi's cheer, the confetti and the title |
| Perfect lesson | the gold "MUKAMMAL!" badge lands, 1.1 s in. It replaces Lesson done on that screen, so until then only the counting ticks are heard |
| Count | each gold bit landing on a counter, climbing a major scale |
| Level up | the level badge slams in |
| Trophy | the trophy lands |
| Award | the new award tile punches |
| Streak | the flame lights (streak screen, streak card, the number at the top of the Learn page) |
| Streak freeze | starts as the missed day empties, rises under the frost, and tops as the ice lands (0.6 s in) |
| Pop | a toast, the Uzbek tip, a dialog |
| Whoosh | a bottom sheet comes up (lesson start, checkpoint start, quit, mic blocked) |
| Switch | a toggle is flipped: on or off |
| Reminder | ESLATMANI YOQISH is pressed, as a preview of how the reminder will sound |

Silent on purpose: the progress bar, tabs, new-exercise slide, the time wheel, sheets going down, the mistakes round,
error and "not ready" screens, and everything while the mic listens.

Rules built into the player:

- The same sound cannot fire twice inside 0.7 s for Right and Not right (the tile and the sheet are one beat).
- Long sounds (over 1 s) fade out in about 0.1 s when the screen is left.
- On screen 17 the English phrase is spoken 0.9 s after the card pops, so it never plays over the sparkle.
- A sound that builds up before its loud moment is started early, so the loud moment and the picture's beat are the same
  instant. `sounds.json` carries that lead as `hit` (ms into the file). Today two sounds have one: Lesson done (1.03 s)
  and Streak freeze (0.55 s). The build script finds it on its own: any sound that takes over a quarter of a second to
  get loud. The app must do the same: start these `hit` ms before the beat.

How loud (redone 2026-10-13 after the owner's first listen: "most of them are too loud"):

- The first volumes were guesses by how often a sound plays. They ignored that the files differ in loudness by up to
  20 dB at the same peak, so bright sounds (Right, New phrase, Level up, Streak freeze) came out far too loud.
- Now every file is measured the way the ear weighs it (ITU-R BS.1770, loudest 200 ms) and `volume` is worked out so the
  sound is heard at a set level for its job. The targets are in `build_final.py` (`LOUD`):
  constant sounds (Button −46, Pick, Tile, Count, Switch, Whoosh −39 to −40, Pop −37) · feedback (Mic −34, Not right −31,
  Right, Combo, Streak, New phrase −28, Streak freeze −29) · rewards (Award, Reminder −27, Level up −26, Lesson done,
  Trophy −25, Perfect lesson −24). All in LUFS.
- Against the first version this is about 9 dB down for Right, 7–10 dB down for the rewards and the mic, 4 dB down for
  the small taps.
- The lab's Volume slider now shows a number. 100% is exactly these levels; it goes to 150%.

How it is checked: every `check-*.js` run prints a line that lists, in order, each sound that fired and each picture
that was taken, so a sound in the wrong place or a missing one shows up without listening.
`node check-sync.js` checks the timing itself: it records each reward moment as a video with a level bar in the corner,
reads the level frame by frame, and saves the frames as a strip (`captures/sync-<moment>.png`) with time and level on
each frame, so the loud moment can be seen against the particles.

What the first listen found and what was changed (2026-10-13): Streak freeze topped 0.36 s after the ice had landed;
Lesson done hit 0.16 s before the twinkle; Award (then "Enharpment", a harp run with 0.7 s of fade-in) peaked 1.1 s after
the tile punched; Mic on was a swell that peaked 0.15 s after the press (now 0.05 s, the slow start is trimmed).
Checked and left as they were: Right, Combo, Count, Streak, New phrase, Perfect lesson, Trophy, Level up all start on
the same frame as their particles.

Known and left for the ear: pressing TEKSHIRISH gives the Button tick on finger-down and Right or Not right on
release, about 0.1 s apart; on the Learn page the Streak sound starts as the last Count tick lands.

## 6. Small sounds as one family, and taps in the hand (2026-10-13)

### Why

What makes iPhone's own controls pleasant, and what we copy:

1. Half of it is touch. A tick on the time wheel comes with a tiny tap in the hand at the same instant.
2. The small sounds are one family: the same material, so nothing sticks out. Our first picks came from eight makers.
3. They are tiny and quiet: mostly 10–60 ms, far under the level of speech.
4. One sound per physical step: each notch of the wheel is one tick, faster when the wheel moves faster.

### The families

A family is one maker's set, designed together. Each one fills all 25 small moments below, so the lab swaps the whole
set at once and the owner picks a family, not single sounds. The big sounds (Right, Not right, Combo, Mic, the rewards,
Streak, Reminder) stay the owner's picks from §4.

| Family | From | Licence | What it is like (by measurement, not yet by ear) |
|---|---|---|---|
| **Sine (chosen)** | SND01 "sine", snd.dev | free for apps, no credit | pure, tiny, electronic. Tap 9 ms, tick 9 ms, button 0.1 s. Closest to the iPhone feel |
| Piano | SND02 "piano", snd.dev | free for apps, no credit | the same set played on a grand piano. Warm and musical, but long: button 0.5 s, tick 0.3 s |
| Material | Google Material sounds | CC BY 4.0, credit needed | soft, rounded, tonal. The family Right and Pick already come from. Its taps are low (around 300 Hz), which small phone speakers play weakly |
| Clicks | Kenney Interface Sounds | CC0 | dry clicks with no pitch of their own, like switches on a device |

Files: `design/sound/families/<family>/<moment>.wav` and `families/families.json` (level and source of every file).
`python -I build_families.py` rebuilds them; which file plays which moment is the `map` of each family in that script.
The four packs are kept whole in `design/sound/originals/packs/` so another file can be swapped in.

### The small moments

The app's sound set is therefore: the picks in `design/sound/final/` for the big sounds, and `design/sound/families/sine/` for the small ones below (the seven small picks in `final/`: Button, Pick, Tile lands, Pop, Whoosh, Switch, Count, are replaced by Sine's).

| Moment | Plays when | Heard at (LUFS) | Tap in the hand |
|---|---|---|---|
| Button | a main or small button is pressed | −46 | light |
| Pick | something becomes the picked one | −40 | selection |
| Tile lands | a word tile lands in the line, a step higher each time | −39 | light |
| Count | a gold bit lands on a counter, rising | −40 | selection, one per bit |
| Wheel tick | one step of the time wheel; one tick for every time that passes the middle, so a fast spin ticks fast | −43 | selection, one per step |
| Arrives | one of several things arriving one after another: a soft tick each, a step higher every time (onboarding screens, option lists, the profile opening, the words you said turning green, rows leaving a list) | −44 | none |
| Number rolls | a number counting up: a few soft ticks that slow down with it | −47 | none |
| Tab | a tab at the bottom is chosen | −43 | selection |
| Two-option control | it changes side | −43 | selection |
| Switch on / off | a toggle is flipped | −39 | light |
| Sheet up | a bottom sheet comes up | −40 | none |
| Close | a sheet or dialog goes away | −41 | none |
| Pop | a toast, tip, dialog or Dombi's speech bubble appears | −37 | none |
| Next / Back | onboarding moves a screen forward or back | −41 | none |
| Calendar | the streak calendar opens (lower when it closes) | −41 | none |
| Step lights | a step of a list lights up, rising (checkpoint story, "how to turn the mic on") | −40 | none |
| Mistakes round | the mistakes round arrives | −39 | none |
| Star | a phrase earns a star | −38 | light |
| Request sent | a friend request is sent | −37 | light |
| Friend | a friend request is accepted | −31 | success |
| Unlock | the next lesson circle unlocks; the trophy wakes up | −33 | medium |
| Your turn | the other voice has finished and the mic starts to glow: it is your turn to speak (two soft rising notes) | −36 | light |
| Nothing heard | the mic heard nothing (plays instead of Mic off); also a press on a greyed-out button | −38 | soft |

Also added in this round: the typed-answer field now plays Right and Not right; Dombi popping up on the first onboarding screen and the profile picture bouncing in play Pop.

The owner asked for the "arrives" ticks after hearing the first version (2026-10-13: "the sounds are not enough, for example things appearing one by one on onboarding's first page"). They keep quiet under a reward or a jingle and while the mic listens, and never come faster than one every 35 ms.

Taps for the big sounds: Right: success · Not right: one soft tap (never the "error" pattern; a mistake is not a
punishment) · Combo: medium · Mic on: light at the press, then nothing until the mic closes · Mic off: light ·
New phrase: success · Lesson done: success, on the hit · Perfect lesson: heavy on the slam, success on the burst ·
Trophy: heavy on the landing · Level up: heavy on the badge slam · Award: medium · Streak: medium as it lights ·
Streak freeze: soft as the ice lands.

Rules for taps: none while the mic records; a tap lands on the same instant as its sound's loud moment; sound and taps
get separate switches in settings.

**Built into the lab 2026-10-14** (`design/motion/haptic.js`, loaded on every page after `sound.js`). Every tap rides on
its sound: when a sound starts, its tap is given at the sound's loud moment, so the two cannot drift apart.

| Tap | In the app (Expo) | Goes with |
|---|---|---|
| selection | `Haptics.selectionAsync()` | Pick, Count (one per bit), Wheel tick (one per step), Tab, Two-option control |
| light | `impactAsync(Light)` | Button, Tile lands, Switch on / off, Star, Request sent, Your turn, Mic on, Mic off |
| soft | `impactAsync(Soft)` | Not right, Nothing heard, Streak freeze (as the ice lands) |
| medium | `impactAsync(Medium)` | Combo, Unlock, Award, Streak |
| success | `notificationAsync(Success)` | Right, Friend, New phrase, Lesson done (on the hit), Perfect lesson (on the burst) |
| heavy | `impactAsync(Heavy)` | Trophy, Level up, the Perfect lesson badge as it slams down |
| none | | Arrives, Number rolls, Sheet up, Close, Pop, Next / Back, Calendar, Step lights, Mistakes round, Reminder |

- A mistake is one soft tap and never anything stronger (checked for a typed and a spoken answer).
- Between Mic on and Mic off no tap is given at all, even one asked for by hand.
- Two taps closer than 25 ms count as one; the stronger wins.
- The **Taps** switch in the tool bar is separate from **Sound**: with the sound off the taps still come. On a PC nothing
  can be felt, so the switch shows each tap as a dot (bigger for a stronger tap) with its name.
- `node check-haptic.js` tests all of the above on the real pages.

Not checked: how any tap feels. In a phone's browser the lab can only give Android's plain vibration, or on an iPhone
one kind of tick (a known trick with a hidden switch control, iOS 17.4 and later, never tried on a real iPhone here).
The six different kinds exist only in the phone app. To try the lab on a phone on the same Wi-Fi:
`node serve.js 8793 lan` in `design/motion/`.

### One key

The picks come from several makers, so they are in different keys. For each family the build script reads the notes of
every pick and finds the shift (at most 3 semitones up or down) that puts them into the family's key; on/off pairs move
together. The lab applies it when "One key" is on.

| Family (key) | Shifts in semitones |
|---|---|
| Sine (C) | Not right −1 · Combo −2 · Mic −2 · Level up +2 · Streak freeze +1 |
| Piano (C) | Not right −2 · Lesson done +2 · Perfect lesson −1 · Level up +2 · Streak freeze +1 |
| Material (D) | Lesson done −3 · Perfect lesson +1 · New phrase +2 · Level up −1 · Trophy −1 |
| Clicks (no pitch) | none |

These shifts come from measured notes, not from listening. A shift also changes a sound's length by up to a fifth.
The switch is there so the owner can compare both ways.

### Dombi's voice (2026-10-13, options for the owner to choose from)

Dombi used to be silent: only his speech bubble popped. Now he says his bubbles in a babble, one short sound for each
syllable of the text, and his mouth moves with it. The sounds are made in the app from the text, not played from files,
so they fit any line and any name. He says at most 12 syllables of a line. He never speaks while the mic listens or
over a reward. With the voice on, the bubble's Pop is not played (the voice is the bubble's sound).

Five voices to choose from, all set by measurement to the same level (−33 LUFS, between Not right and the mic's sounds):

| Voice | What it is |
|---|---|
| Hum | soft mallet notes in the five-note scale of C, the key of the Sine family (E4 to D5). The most musical |
| Mumble | a low muffled voice: a buzz shaped into vowels (wa, wo, wu). The most like speech |
| Blip | one short tone per syllable, like an old video game |
| Bloop | a small liquid plop per syllable, like a blob talking |
| Hm | one calm "hm" per word instead of per syllable: he says little |

All five are kept low and calm on purpose (he is cool, never squeaky), but above 300 Hz so a phone's speaker can play
them. Code: `design/motion/dombi-voice.js`. `node check-dombi.js` renders each voice to a file and
`design/sound/tools/measure_dombi.py` measures it. In the lab: tool bar, "Dombi's voice" (Off brings back the Pop).
**Not chosen yet.** The lab starts on Hum.

**Owner's answer (2026-10-13): Bloop is all right, but what he wants is a real voice that says the words, like
text-to-speech.** So Dombi now has two kinds of voice in the lab:

- **A real voice.** His eight speech-bubble lines are spoken in Uzbek by a text-to-speech voice and kept as files
  (`design/sound/dombi/<voice>/line-N.wav`, `dombi/lines.json`; `build_dombi_tts.py` makes them). His mouth opens with
  the sound itself. Pauses longer than a third of a second are shortened. Every line is set to −28 LUFS: speech carries
  meaning, so it sits above the small sounds.
- **The babble** stays for a line that has no file, which today is only your name after you type it. It uses Bloop.

**Owner's answer to the first real voices (2026-10-13): the voice read "Dombi" as "Domb-uh", and he wants a voice with a
personality, fun to listen to, like the live voice of ChatGPT.** Two things changed.

**"Dombi" is now said right.** The last i of an Uzbek word is said short and loose, so Microsoft's voices read the name
as "Dombe". Where the name stands alone, the text sent to those voices spells it "Dombiy" (`SAY` in
`build_dombi_tts.py`) and the speech bubble keeps "Dombi". Checked with a speech recogniser.

**His lines in everyday Uzbek (owner, 2026-10-13: "make it say Dombiman so it sounds like an Uzbek speaking, and make
sure the texts are natural Uzbek").** Four of the eight lines changed, in the speech bubble and in the voice alike:

| Was | Now | Why |
|---|---|---|
| Salom! Men Dombi. | Salom! Men Dombiman. | the owner's wording: how an Uzbek says "I am Dombi". The i is no longer last, so Microsoft's voices read it as it stands. The acted model dropped the b ("Domiman") in every take, so its text spells it "Dombbiman" (`SAY` in `build_dombi_acted.py`), and a take only counts if the recogniser heard "biman" |
| 30 kunda mana nimalarga erishasiz! | 30 kunda mana shularga erishasiz! | "mana shularga" points at the list under it; "mana nimalarga" reads as a translation |
| Ingliz tilida gapirishga qanchalik ishonasiz? | Ingliz tilida gapirganda o'zingizga qanchalik ishonasiz? | the old one asks how much you believe in speaking; the question is how sure you are of yourself |
| Har kuni qachon eslatay? Kuniga bitta, mehribon eslatma. | Har kuni soat nechada eslatay? Kuniga bir martagina eslataman. | a clock time is asked with "soat nechada"; "mehribon eslatma" is a translated "gentle reminder" |

Unchanged: "Ingliz tili sizga nima uchun kerak?", "Ingliz tilini qanchalik bilasiz?", "Ovozingiz faqat sizniki. Va'da
beraman:", "Sizni nima deb chaqiray?". The wording is by a non-native writer and waits for the owner's yes. Until then
the Pencil storyboards keep the old wording, and so does the small text "mehribon eslatmalar" on the 30-day screen.

**Voices that act.** A plain text-to-speech voice reads. The newer voice models take a direction ("cool, laid-back, a
slight smirk") and perform the line. What exists for Uzbek, checked 2026-10-13:

| Model | Uzbek | How it is directed | What it needs |
|---|---|---|---|
| **Navoiy TTS** (Aisha, Tashkent; open, Apache 2.0) | made for Uzbek | one sentence of direction per line; the sound of the voice is copied from a few seconds of any voice | a graphics card; runs on the owner's PC, no account |
| ElevenLabs Eleven v4 (and v3) | on the list | tags inside the text (`[laughs]`, `[whispers]`), and a new voice can be designed from a description | an account and a key |
| Google Gemini 3.8 Flash TTS | on the list ("Northern Uzbek") | a style written per line, tags, voice design | an account and a key |
| OpenAI gpt-4o-mini-tts | not on its list | a free-text instruction | not tried |
| Microsoft Sardor and Madina | yes | none: they read | what the first voices used |

Navoiy is the one built into the lab now, because it runs here with nothing to sign up for. `build_dombi_acted.py`
makes the lines (the top of that file lists the 7 GB of model files, which live outside the project). How it works:

- **The acting comes from the direction.** Five are used: cool and playful (written for Dombi), dry, happy and warm
  (three of the ten that came with the model). Measured, they do differ: the same line is 100 Hz and flat when calm,
  140 to 150 Hz when happy.
- **The sound of the voice comes from a reference clip.** Dombi's is five seconds of the Sardor voice moved up three
  semitones, body and all, so it is nobody's voice. The same acting can be put into any other voice.
- **Eight takes of every line, the best kept.** A take can lose or repeat a word. Nobody listens during the build, so
  a speech recogniser writes each take down and the one closest to the text wins. The recogniser is weak at Uzbek, so
  this catches a broken take, not a small slip.

Voices in the lab ("Dombi's voice" in the tool bar):

| Group | Voice | What it is |
|---|---|---|
| Acts the words | Cool | laid-back and sure of himself, every line |
| | Playful | cheeky and quick |
| | Dry | a knowing drawl, a little mocking |
| | Acted line by line | each line in the mood that fits: hello cool, the questions playful, "30 kunda" happy, the promise and the reminder warm |
| | Cool, deeper | the cool acting in a grown man's voice |
| | Cool, lighter | the cool acting in a woman's voice |
| Reads the words | Sardor, Madina | Microsoft's two voices, kept to compare |
| Babble | Hum, Mumble, Blip, Bloop, Hm | no words |

The four changed copies of Sardor and Madina from the first round are gone. Every line is at −28 LUFS as before.

Not checked: how any of it sounds. The words are there and "Dombi" ends in an i by the recogniser; whether the acting
is good, and whether Dry is too mocking for a guide who never makes the learner feel wrong, needs the owner's ear.

For the app:
- Lines are made once and shipped as files, so the app needs no connection to speak, and a model that runs on a PC is
  enough. A name cannot be made ahead of time, which is why it stays a babble.
- The reference clip is Microsoft's voice here, which is fine for choosing. The app's reference must be about ten
  seconds of a person who agrees to it (the owner's own voice would do). Moved up, it is still nobody's voice.
- If Navoiy's acting is not enough, Eleven v4 or Gemini 3.8 are the next to try. Both need a key from the owner.
- A Dombi who answers out loud to anything, like a live voice assistant, is a different thing: speech made on a server
  while you wait. Nothing here plans for it.

**Chosen 2026-10-14: "Acted line by line".** The owner: "i like the acted line by line one". Each line is said in the mood
that fits it (hello cool, the questions playful, "30 kunda" happy, the promise and the reminder warm). The lab now starts
on it. The other voices stay in the menu to compare; new lines Dombi gets later are made the same way, each with its own
direction (`BY_LINE` in `build_dombi_acted.py`).

Where he speaks today: every speech bubble in onboarding (and the same bubble on the lab's results page), and your
name after you type it.

### The time wheel (2026-10-13, asked for by the owner)

The reminder wheel behaves like the iPhone's: it covers the whole day in half hours (00:00 to 23:30, starting on 19:00), turns without end (23:30 is followed by 00:00), keeps moving after a flick and slows to rest exactly on a time. A finger on it stops it; a tap on a row picks that row. One helper serves both places it appears (`timeWheel` in `design/motion/lab.js`; `node check-wheel.js` tests flick, slow drag, tap and mouse wheel). The look of the wheel is unchanged.

### In the lab

The tool bar has **Small sounds** (Sine, Piano, Material, Clicks, or "My first picks" = the set before this round, with
the new moments silent) and **One key**. Both are remembered between pages.

Rules built into the player for the small sounds:

- Variants take turns (the wheel tick has 2 to 5 variants per family), so a run of ticks is not one sample repeated.
- A number rolling never ticks under a jingle (the result screen keeps Lesson done alone).
- Onboarding plays no Next after the mic check (the mic's own sounds speak) and neither Next nor the speech-bubble pop
  over the reminder preview.

Checked: all four families fill all 25 moments; dragging the wheel three steps gives three ticks; the ten page checks
list the new sounds in the right places with no page errors.

Places to listen with care, because several sounds come close together:

- Learn page, finishing a lesson: Unlock, then five Count ticks, then Streak, inside about half a second.
- Onboarding, every screen: Button on the press, Next as the screen moves, Pop when Dombi's bubble appears.
- Piano: every sound has a tail, so fast repeats (wheel, tiles) overlap.

## 6b. The English of the lessons (2026-10-14)

Every English line the 15 lessons and 3 checkpoints play is made: 107 lines, each at normal speed and slow (the turtle
button), so 214 clips for one set of voices. What to say comes straight from the lesson files, so a changed lesson and
`build_lessons.py` give the new clips.

**Who speaks.** Four people: Aziz and Malika (the learner's side; they say every taught phrase), the waiter (Unit 2)
and the seller (Unit 3). A set of voices gives each of them a text-to-speech voice. Two sets are built:

| Set | Aziz | Malika | Waiter | Seller |
|---|---|---|---|---|
| **British (in use)** | Ryan | Sonia | Thomas | Thomas, a little lower and slower |
| American | Andrew | Ava | Brian | Christopher |

These are Microsoft's read-aloud voices (the same service as Dombi's first plain voices): free, no account, natural.
They are right for the test version. A released app needs voices it has a licence for, or recordings of people.

**Why British is the default.** The lessons are written in British spelling ("colour"), and the check below came out
clean for the British set only. The owner has not heard either set yet; the lab's lessons page (page 11) switches
between them.

**What is saved for each clip** (`src/content/audio/<set>/index.json`):

| | |
|---|---|
| the sound | 16-bit mono, 24 kHz, silence cut from both ends |
| `volume` | so that every line is heard at −28 LUFS, level with Dombi's lines |
| `words` | when each word starts and ends, so the text lights up word by word |
| `mouth` | mouth shapes in time (the same 0–11 as Dombi and the waiters), from the talking engine fitted into each word's real time; the mouth leads the sound by 60 ms |
| `slow` | the same four things for the slow clip. It is said slower by the voice (−30 %), not stretched |

**Checked, without ears:**

- Word times. The voice service reports each word 50 to 200 ms before it is heard, differently for each voice and
  speed, so every clip's times are moved as one block until the first word starts where the sound starts. Measured
  afterwards on the words that follow a pause: the British set is 16 ms late at the median (8 in 10 words between
  110 ms late and 30 ms early), the American 1 ms early (between 119 ms late and 95 ms early). Good enough for words
  lighting up; for the mouth it is close, not exact.
- The words. A speech recogniser wrote all 428 clips down. British: 8 of 214 differ, and all 8 are the recogniser's
  spelling ("color", "A T, please", "7000"). American: 35 differ, and some look real: the man's voice says "Aziz" as
  something heard as "Ajis" in 6 clips, "Hi" at the start of a line is lost or heard as "E" in 4, and "som" is said like
  "psalm" in all 12 price lines.
- On the lessons page every line has its sound and every picture its file, the words light up while a line plays, and
  the waiter's and the seller's mouths go through their shapes (`node check-lessons.js`).

**"Malika" (owner, 2026-10-14: "it is saying malikuh not ma li kaa").** The voices ended the name with a short weak
vowel. For the voices only it is now written "Malikaa" (`SAY` in `build_lessons.py`); the screen keeps "Malika". In the
British set the recogniser now writes all four lines with the name as "Malikar", which is how it writes a long "a".
In the American set it still writes "Malika", so that set may not have changed as much. "samsa" ends the same way and
has not been changed.

**Not checked:** how the voices sound, whether "som", "samsa" and "Aziz" are said the way the owner wants, whether
"Malika" is right now, and whether slow is slow enough. Those need his ear.

Size: 21 MB for the British set as WAV. That is fine for testing; the clips can be packed smaller for the phone app
once the mouth timing has been tried there (a packed format adds a small silence at the start, which the times would
have to allow for).

Build: `PYTHONPATH=<folder with edge-tts> python build_lessons.py [uk us] [--hear]` in `design/sound/`. What the service
sends is kept in `originals/lessons-cache`, so a second run fetches only new lines. On this network the service's name
lookup timed out during the first runs (2026-10-14); the script now finds the address another way.

## 7. Technical notes for the build

- **Files:** 16-bit WAV, mono, trimmed so the sound starts at the first sample. MP3 and M4A add a short silence at
  the start, so they are not used for sounds that must land on a frame.
- **Library:** `expo-audio` with the sounds preloaded (`expo-av` is being removed). If taps feel late, move the short
  ones to `react-native-audio-api`, which can also raise the pitch of one file for the combo steps.
- **Mic:** play Mic on before listening starts; play nothing while listening; haptics do not fire while recording
  on iOS. Sounds can be quieter right after speaking until the audio session is restored.
- **Sounds inside Rive files** would skip the app's own sound switch, so sounds are played by app code.
- **Settings:** two switches, sound effects and haptics, as planned on the Settings page.

## 8. Open questions

1. **Phone on silent.** With the lesson audio session, effects play even when the phone's silent switch is on. Options:
   (a) keep that and rely on the in-app sound switch, as Duolingo does, or (b) respect the silent switch outside
   speaking exercises, which also silences the English phrase audio on a muted phone. Default until decided: (a).
2. **Found sounds or made sounds.** The options on the listening page are free sounds from many makers, so they are
   in different keys and instruments. After the picks, the set can be tuned to one key, or re-made as one family
   using the picks as the reference. Answered for the small sounds in §6 (one found family, picks shifted into its key).
3. **Which family.** Answered 2026-10-13: Sine (§6), as the working choice. The other three stay in the lab for comparison.
4. **One key on or off.** Answered 2026-10-13: the owner heard it on and said it is fine, so it stays on.
5. **Dombi's voice.** Answered 2026-10-14: "Acted line by line" (§6).
6. **The English voices of the lessons.** British or American (§6b). Both are built; the lab's lessons page switches between them. Default until decided: British.

## 9. Sources

- Voice models for Uzbek: https://aisha.group/en/blog/navoiy-tts-open-source-uzbek-text-to-speech · https://huggingface.co/aisha-org/navoiy-tts · https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4 · https://elevenlabs.io/docs/help-center/other/what-languages-do-you-support · https://ai.google.dev/gemini-api/docs/speech-generation · https://developers.openai.com/api/docs/guides/text-to-speech

- Duolingo sound work: https://ambroseyu.com/work/duolingo-sonic-identity · https://ambroseyu.com/work/duolingo-core-product-sounds
- Google Material sound: https://m2.material.io/design/sound/applying-sound-to-ui.html · https://m2.material.io/design/sound/sound-attributes.html
- Apple: https://developer.apple.com/videos/play/wwdc2017/803/ · https://developer.apple.com/design/human-interface-guidelines/playing-audio · https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- Lengths and speakers: https://withfeeling.com/the-sonic-glossary/ui-sounds/ · https://violetrecording.com/how-to-design-ui-sounds/
- Expo: https://docs.expo.dev/versions/latest/sdk/audio/ · https://docs.expo.dev/versions/latest/sdk/haptics/ · https://docs.swmansion.com/react-native-audio-api/docs/fundamentals/introduction
