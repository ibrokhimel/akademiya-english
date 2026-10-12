# Tech Stack (English app)

**Roadmap item:** #29 Tech stack
**Status:** main choices **LOCKED** 2026-10-12 · the framework is locked on condition that two test builds pass
**Related:** [ai-plan.md](ai-plan.md) (MVP speech scope) · [motion-plan.md](motion-plan.md) ·
[companion-pet.md](companion-pet.md) · [product-definition.md](product-definition.md) (pricing)

Based on three research reports made 2026-10-12 (framework, backend and law, payments and stores).
The legal points are research, not legal advice.

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
