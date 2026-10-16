# Tech Stack (English app)

**Roadmap item:** #29 Tech stack
**Status:** main choices **LOCKED** 2026-10-12 · the framework is locked on condition that two test builds pass ·
**build order changed 2026-10-14: a browser version first** (§0) · **local phone build locked 2026-10-16** (§0b)
**Related:** [ai-plan.md](ai-plan.md) (MVP speech scope) · [motion-plan.md](motion-plan.md) ·
[companion-pet.md](companion-pet.md) · [product-definition.md](product-definition.md) (pricing)

Based on three research reports made 2026-10-12 (framework, backend and law, payments and stores).
The legal points are research, not legal advice.

---

## 0. Build order: a browser version first (owner, 2026-10-14)

The owner's words: "let's first build the application in browser for testing purposes". So the whole MVP is first built
to run in a browser, and the phone app comes after it.

**Started 2026-10-14.** The owner found the lab's lessons page "overcomplicated" and asked to "go thru the lessons myself
in my browser first", so steps 1 to 3 below are built: every lesson and checkpoint can be played from start to finish at
http://127.0.0.1:8791/src/web/ (the lab's server). What is there and what is not: "Built so far" at the end of this section.

### Why it is a good first step
- Everything the owner has approved so far already runs in a browser: the motion lab (`design/motion/`) has the real
  motion, sounds, taps, Dombi and the waiters. The browser version joins those pieces into one working app, so nothing
  approved is rebuilt before it can be tried.
- The lessons can be played from start to finish and judged (too long, too easy, a wrong Uzbek line) weeks before a
  phone build exists.
- It opens from a link, on the PC and on a phone, with nothing to install.

### What it is made of

| Part | In the browser version | Carried over to the phone app |
|---|---|---|
| Lesson content | `src/content/`: lesson files, sound clips, pictures (done, see lesson-template.md) | as it is |
| The rules (`src/core/`, new) | plain code with no screen in it: which item comes next, the mistakes round, combo, what counts as a right answer (said, built or tapped), streak and freeze, level and prediction, what is saved | as it is. Written once, with tests that run on the PC |
| Screens (`src/web/`, new) | the lab's own pieces (`motion.js`, `sound.js`, `haptic.js`, `voice.js`, the component styles, the Rive web player), one file per screen, on the locked Pencil screens | written again for the phone, screen by screen, with the browser version open beside it as the reference |
| Speech | the browser's speech recognition (Chrome on the PC and on Android; Safari on iPhone). Where a browser has none, the app behaves as on screen 31c: answers are built from words | replaced by the phone's own recogniser (`expo-speech-recognition`) |
| Saving | in the browser itself, behind one small "save / load" door | the same door, with the phone's database and later the server behind it |
| Sign-in | the three buttons only keep the name. No accounts, no server | real sign-in |
| Taps in the hand | Android: the browser's vibration. iPhone: one kind of tick at best | the real ones (`expo-haptics`) |
| Reminder | chosen and saved, not sent | scheduled on the phone |

### What the app saves (the same in both versions)

| What | Kept as |
|---|---|
| Settings | name, goal, "I'm new / I know some", reminder time, sound on, taps on, dark mode, speaking on, "save my voice" |
| Confidence answers | date and 1–5, for day 1 and for two weeks later |
| What happened | a list that only grows: lesson finished (which, when, mistakes, seconds spoken), checkpoint finished, item missed (which phrase, which exercise), streak freeze used |
| Worked out from that list, never stored twice | lessons unlocked, phrases the learner can say, streak and calendar, level and prediction, the numbers on Progress |
| Voice recordings | the clip, its phrase and the date; only with permission, deletable one by one or all at once |

A list of events is what the phone app sends to the server later (§3, "Offline"), so nothing here is thrown away.

### Order of work
Each step ends with something the owner can open and try.

1. **The rules and their tests** (`src/core/`): lesson player, answer checking, streak, level. No screens yet.
2. **One lesson, start to finish**: Lesson 6 with all six exercises, the feedback sheets, "can't speak now", the mistakes
   round, the new-phrase card and the result screen.
3. **All 15 lessons and the 3 checkpoints**, with trophy, reaction and level up.
4. **The Learn page**: the path, lesson start sheet, unlocking, replay, streak screen.
5. **Onboarding 1–10**, the first lesson inside it, then the name.
6. **Progress, "things I can say", streak calendar, Profile, Settings** (sound, taps, dark mode, speaking, recordings).
7. **Pop-ups and states**: feedback form, confidence again, no internet, mic blocked, no speech recognition, error, "not ready yet".
8. **A pass over everything**: dark mode, Reduce Motion, a phone-sized window, reload in the middle of a lesson.

Then the phone app: the two test builds of §4 first, then the screens in the same order.

### Built so far (2026-10-14): the whole MVP in the browser (steps 1–8)

The owner looked through it on 2026-10-15: "ts look alr".

| Where | What |
|---|---|
| `src/core/text.js` | what counts as a right answer: said (numbers in digits, short forms, names and Uzbek words that always count, other right answers), built from tiles, picked |
| `src/core/session.js` | one lesson being played: the order, the mistakes round (a missed item comes back until it is right), speaking off, the numbers for the result |
| `src/core/progress.js` | worked out from what happened: which lesson is done, current or locked, the phrase count, the level, and the streak (days in a row, counted day by day as they happen; one freeze a week covers a missed day; weeks start on Sunday) |
| `src/core/core.test.js` | `node --test src/core/core.test.js`: 12 tests, among them every taught phrase judged right when said as written |
| `src/web/app.js` | start, saving, settings, the first run, what comes after a lesson, the confidence question after two weeks, the error screen |
| `src/web/onboarding.js` | onboarding 1–9, Log in (1L) and "no such account" (1L·b), and the name and account (10) after Lesson 1 |
| `src/web/learn.js` | the Learn page: path, start sheets, tabs |
| `src/web/progresspage.js` | Progress (24), "Ayta oladiganlarim" (25), the streak calendar (26) |
| `src/web/profilepage.js`, `record.js` | Profile (27), Settings (28), voice recordings (28b); the recordings are kept in the browser only |
| `src/web/states.js` | feedback form (29, 29b), confidence again (30, 30b), no internet (31a), mic blocked (31b), speech not available (31c), not ready yet (31d), something went wrong (31e) |
| `src/web/player.js`, `exercises.js`, `finish.js`, `moments.js` | the lesson screen, the six exercises, the read-aloud after Tile Builder, the screens after a lesson (result, trophy, level up, streak) |
| `src/web/checks/` | `play.js` plays lessons from the path; `flow.js` the whole first run; `extras.js` log out, delete, the date moved, every pop-up, phone size and Reduce Motion; one harness page each for Progress, Profile and the pop-ups |

- The screens are the lab's own: its style files and its motion, sound and tap scripts are loaded as they are. Pages the
  lab did not have (log in, 24–26, 28, 28b, 29–31) were built from the locked Pencil screens, read from the file.
- **First run:** Welcome → Dombi → goal → level → what you'll achieve → confidence → mic (the browser asks for it here)
  → "Say Hello" (Dombi listens to the real mic) → voice promise → reminder time → Lesson 1 → name and account → the
  Learn page. KIRISH goes to Log in; in this version the account lives in this browser, so logging in only works with
  the way chosen on page 10 after logging out, and anything else shows "Bu hisob hali yo'q" with "start fresh".
- **The Learn page** is the locked Path H screen. The three units sit one under another on one scrolling path, with a
  thin line and the unit's name between them (new: the design shows one unit); the banner shows the unit in the middle
  of the view, and its book opens "Ayta oladiganlarim". Lessons open one after another, the trophy after the unit's
  five lessons, the next unit after the checkpoint. A finished lesson opens again with TAKRORLASH.
- **After a lesson:** "now you can say" → result → the streak screen if it was the first lesson of the day → the Learn
  page with the "lesson done" beat. **After a checkpoint:** the trophy with the partner's reaction (set by the number of
  mistakes) → level up after the third unit → streak. About two weeks after the start the confidence question comes
  once after a lesson, and 30b only if the answer went up.
- **Speaking.** The mic button records the answer and sends it to a speech-to-text server on this PC
  (`src/stt/server.py`, faster-whisper large-v3-turbo on the graphics card, about 1.2 s; it starts with
  `node design/motion/serve.js`). On 2026-10-15 the owner found that his speech was not understood: the browsers' own
  recognisers (Chrome sends the sound to Google, Edge to Microsoft) came back empty on this PC, so they are now only
  the second choice, used when the server is not running. While the learner speaks, the words so far appear
  live in grey under "ESHITYAPMAN…" (the server is asked every half second), then turn green or orange when checked;
  the page looks for the server again before every answer, not only when it opens. The owner tried it with his own
  voice the same day and it worked ("A coffee, please.", "No, thank you." and the numbers were heard). `checks/speak-real.js` answers a lesson item through the real
  microphone path with a recording; `checks/sttcheck.js` sends lesson clips to the server. A voice with no words understood is asked again and is not a mistake; the third time the
  31c sheet offers words to build or another try. A blocked mic shows 31b. After a sentence built right from tiles the
  learner is asked to say it out loud once (it can be skipped and is never a mistake).
- **Saving your voice:** when the learner chose it (screen 8, or Settings → Ovoz yozuvlari), a phrase said right is
  kept, one per phrase, newest wins. It plays from "Mening ovozim" on page 25 and from page 28b, and can be deleted.
- **Settings** has the designed rows, then a test-only part "SINOV UCHUN": British or American voices, every lesson
  open, moving the date (+1 day, +14 days, back to today) to try the streak and the confidence question, a list that
  opens every pop-up and problem screen, and start over.
- **Picked up after a reload:** every answer in a lesson is saved as it is given; after a reload the lesson comes back
  at the same item, with the bar, combo and speaking as they were.
- **Reduce Motion** follows the computer's setting. On a phone-sized window the app fills the screen.
- **Saved:** the growing list of "what happened" (onboarding answers, lessons, account, confidence, feedback) and the
  settings, in the browser. Progress, streak and level are worked out from the list every time.
- **Checked (2026-10-14, in a real browser, no page errors):** the whole first run in light and in dark, the dark
  one through Log in and "no such account"; onboarding answers, name, account and three saved voice clips kept;
  Progress 24, 25, 26, Profile 27, Settings 28 and 28b; a reload in the middle of Lesson 2 came back at the same item;
  log out and back in with the results kept; the date moved 14 days, the confidence question after the next lesson,
  30b when it went up, the answer saved; every pop-up and problem screen opened and closed; Lesson 2 in a 390×844
  window and in a 360×740 one with Reduce Motion; deleting the account goes back to Welcome with nothing kept; and all
  15 lessons and 3 checkpoints played in path order with one wrong answer each. The helpers' own pages
  (`checks/progresspage.html`, `profilepage.html`, `states.html`) were checked in light and dark.
- **Fixed on the way:** with Reduce Motion the lesson's feedback sheet stayed below the screen (the lab's sheet only
  faded); the streak now spends a week's freeze on the first missed day, as it would really happen.
- **Speech, checked with recordings:** the real microphone path, fed a lesson clip, gives "A coffee, please." all green and
  "A tea, please." with "coffee" orange. Not checked: how it hears the owner's own voice and accent.
- **Not real in a browser:** reminders (the time is saved; the phone app sends them), taps in the hand, signing in with
  Google, Apple or a phone number (a button press only marks the account in this browser), the screenshot in the
  feedback form (only "on/off" is kept), and sending feedback anywhere (it is saved in the list).
- **Shown but after the MVP:** on Profile, friends, the league, Apples, friend streaks and the pet outfit are drawn as
  designed and open "not ready yet" (31d).

### What the browser version cannot tell us
- How the phone's own speech recogniser hears Uzbek-accented English. The browser's is a different one, so its result
  is a first look, not the answer.
- How taps feel, how smooth Dombi is on a cheap Android phone, and battery use. Those are tests A and B (§4).
- On an iPhone the microphone only works on a secure (https) address, so a plain local link is enough on the PC but
  not on the phone. A secure link from the PC is set up when the owner wants to try it on his iPhone.

## 0b. The local phone build (locked with the owner, 2026-10-16)

Goal: the real app, fully working on the owner's own machines (Mac, iPhone, this PC), before any outside server,
store or tester. Codex builds it on the Mac from [codex-prompt.md](../codex-prompt.md).

| Question | Decision |
|---|---|
| Who builds | **Codex** on the Mac (Apple chip). Claude reviews only when the owner asks. |
| Pace | Codex stops at **big milestones** only: after test B, after one full lesson, and at the end. |
| Platforms | **iPhone first** (simulator, then the owner's iPhone). **Android after the iPhone works**, built on the Mac from the same code. |
| Speech | The iPhone's own recogniser first (test B). If it doesn't understand the owner's accent: **Whisper on this PC** (`src/stt/server.py`, already works with his voice), reached over Wi-Fi. |
| Server | **PocketBase on this PC**, reached over Wi-Fi: accounts, progress events, settings, voice recordings, feedback, usage numbers. |
| Sign-in | A **simple test account** (email and password in PocketBase). The Google and Apple buttons stay on screen and are wired later. |
| Lessons and audio | **Built into the app** (`src/content/`, about 40 MB). Served from the server only for the launch, later. |

**PC-side work (Claude, on this PC):** let the Whisper server listen on the home Wi-Fi as well as on the PC (an
`STT_HOST` setting); install PocketBase, pinned, with its collections; write down the PC's Wi-Fi address and ports
for Codex. When a server first listens on the Wi-Fi, Windows asks whether to allow it: the owner clicks **Allow**
(private networks only).

**Not part of the local build:** a rented server, store accounts, privacy policy, testers, an Android phone, phone
number sign-in. Those come with the beta (see the roadmap).

---

## 1. Who builds, and with what

| Point | Answer |
|---|---|
| Who writes the code | Claude, on the Windows PC |
| Who tests | Ibrokhim, on his iPhone |
| Launch platforms | Android and iPhone together, from one codebase |
| iPhone builds | Made on Ibrokhim's Mac (free), or by Expo's cloud build service |
| Android builds and checks | On the Windows PC with the Android emulator, with screenshots |
| Server | Ibrokhim's rented server abroad (provider, country and size still to be confirmed) |
| Store accounts | None yet (see §6) |

## 2. Locked choices

| Decision | Choice | Decided by |
|---|---|---|
| App framework | **React Native with Expo** (Expo SDK 57) | Ibrokhim, 2026-10-12 |
| Backend | **PocketBase**, self-hosted, version pinned | Claude; Ibrokhim left this one open ("idk bro") |
| Voice recordings | **Saved on the server** with the learner's progress, private to their account | Ibrokhim, 2026-10-12 (first answer was phone-only; changed the same day) |
| Sign-in | **Google, Apple and phone number**, as drawn on screen 10. No Telegram | Ibrokhim, 2026-10-12 (Telegram was picked first, then removed the same day) |

### Why Expo
- Claude edits code on the PC and the iPhone reloads live and sends its logs back. With Flutter, every
  iPhone test would have to be run from the Mac.
- `expo-speech-recognition` gives partial results and a loudness value, which drives Dombi's `amp`.
- Updates without store review can carry assets (lesson audio) as well as code.
- **Risk:** the Rive package with view-model data binding, `@rive-app/react-native`, only became the
  stable default on 2026-09-29. A bug that drew transparent overlays black on Android was fixed in
  0.5.4 on 2026-10-07. **Flutter is the fallback** if test A below fails.

### Why PocketBase
- One program gives accounts, database, private files and an admin panel. It runs in about 2 GB of RAM
  and a backup is one folder.
- **Catch:** it is not at version 1.0 yet and runs on one server only, so the version is pinned and
  upgrades are tested first.
- Self-hosted Supabase is the alternative if PostgreSQL is ever needed (8 GB of RAM or more).

### Recordings on the server
- Recordings are uploaded and kept with the account, as extra-features.md already says, so they
  follow the learner to a new phone and the "proof of progress" comparison works across devices.
- PocketBase stores them as private files; only the learner's own account can read them.
- **Legal risk to settle in #33:** Uzbekistan's personal data law was changed on 2026-03-27. Ordinary
  account data may now be kept abroad in listed countries, but biometric data must still be stored
  inside Uzbekistan. The law does not name voice, but Uzbek legal commentary treats voice as
  biometric. Under that reading, recordings and their backups need a server inside Uzbekistan and that
  database must be registered. Ibrokhim's current server is abroad.
- A rule for how long recordings are kept is needed. Rough estimate: about 9 GB a month per 1,000
  learners if every clip is kept.

### Sign-in
- Google, Apple and phone number, matching the three buttons already designed on screen 10.
- Apple requires Sign in with Apple when other sign-in services are offered.
- Phone number needs an SMS code. The SMS provider (Eskiz, 95 so'm per SMS) only signs registered
  businesses, and sender-name approval takes 1–2 months, so the Phone button cannot work until that
  contract exists.
- PocketBase has no SMS sign-in built in, so the code check for phone numbers is custom work.

## 3. Supporting choices (set by Claude)

| Area | Choice |
|---|---|
| Rive | `@rive-app/react-native` 0.5.x, with `react-native-nitro-modules` pinned to 0.36.x |
| Speech recognition | `expo-speech-recognition`, using its own loudness event (a second mic meter cannot run beside the recogniser on Android) |
| Lesson audio | `react-native-audio-api` for accurate start timing with the mouth-shape timeline; `expo-audio` if that proves enough |
| Drag physics | `react-native-gesture-handler` + `react-native-reanimated` |
| Haptics and tilt | `expo-haptics`, `expo-sensors` |
| Offline | SQLite on the phone (`expo-sqlite`); finished lessons and reviews are saved as events and uploaded when online |
| Lesson content | Lesson data and audio served from the backend, so lessons change without an app release |
| Daily reminder | Scheduled on the phone, with no server push |
| Analytics | Lesson events stored in our own backend |
| Crash reports | GlitchTip, self-hosted |
| Payments | **Version 1 is free with no payment code** (see §5) |
| Automated checks | Android emulator screenshots and Maestro |

## 4. Two test builds before committing to Expo

- **A. Dombi on a real low-end Android phone.** The real `.riv` with Dombi plus two or three transparent
  effect overlays; `viseme` and `amp` set 60 times a second during a drag; a trigger fired back from the
  file; a tap listener inside the artboard. Check frame rate, transparency and battery use in the
  background.
- **B. The listen-then-speak loop** on an iPhone, an Android 13+ phone and an Android 12 or older phone.
  Play a clip with its mouth timeline, then start recognition straight away. Check the start beep, the
  start delay, how often loudness arrives, and that playback and recognition do not break each other.

Until a low-end Android phone is found, test A can only be run on the emulator, which does not show
real performance.

## 5. Payments (for the paid version, later)

- Both stores require their own billing for subscriptions sold inside the app, and the exceptions do
  not cover Uzbekistan. Payme, Click and Uzum therefore cannot be used inside the app.
- **Plan:** sell on a website and a Telegram bot through Payme and Click (Uzum third); the app only
  unlocks the account. On iPhone, also offer Apple's in-app purchase, with no mention of the website.
- Start with fixed passes (1, 3, 12 months) before auto-renewal.
- Payme accepts registered businesses only, not private individuals.
- Keep a `plan` field per user on the server from version 1, so payments can be added without a rewrite.

## 6. Open items

| Item | Why it matters |
|---|---|
| Server details: provider, country, RAM, disk, what else runs on it | The country must be on Uzbekistan's list for account data to be kept there; PocketBase needs about 2 GB; recordings need disk space |
| Where recordings may legally be stored | Under the safe reading of the law they must be on a server inside Uzbekistan (see §2) |
| A low-end Android phone for testing | Most learners use one, and Ibrokhim only has an iPhone |
| Google Play account ($25 once) | A personal account must run a closed test with 12 testers for 14 days before launch |
| Apple Developer account ($99 a year) | Needed for TestFlight and the App Store; enrolment from Uzbekistan has stalled for some developers, so start early |
| Business registration | Needed for the SMS provider (so for phone sign-in), Payme, and organisation store accounts |
| Parental consent for ages 13–17 | The law asks for it for minors; to be settled in #33 |
| Older Android phones (12 and below) | The recogniser's start beep cannot be turned off, and on-device recognition is not available |
| Phones without Google speech services | Recognition can fail on some Huawei, Honor and China-ROM Xiaomi phones; needs a fallback message |
