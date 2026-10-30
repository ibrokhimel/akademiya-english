# Profile Customization · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The `...` button on the Profile tab opens a Customize screen where the learner changes their avatar, frame, banner, name and identity, pinned badges, shown stats, Dombi's look on the profile, and the app's look.

**Why:** owner, 2026-10-27: "add a shit ton load of profile customization when the user presses ..." and then "let's plan on building everything else". Scope is items 1–57h plus 7a/22a in
[profile-customization.md](../../ideas/profile-customization.md). Sections 9–12 and "How items unlock" are parked.

**Today (scan 2026-10-27):**
- `...` goes to `/account`, which has a name field and the cloud sign-in (`profile.tsx:65-94`, `account.tsx`).
- The avatar is a 96 px violet circle with the first letter (`profile.tsx:113-137`).
- The top band is a plain `c.soft` block with the joined date (`profile.tsx:49-108`).
- Awards are hard-coded inline (`ProfileDetails.tsx:19-26`).
- Settings live in the `Settings` type in `lib/store.tsx:15-43`. They are stored locally in `expo-sqlite/kv-store` and synced to PocketBase `users.settings` JSON (`lib/backend.ts:108-119`).
- `useTheme()` picks between two inline objects (`ui.tsx:34-76`). `violet` is a constant, and many components hard-code hex values.
- The Rive file already has `outfit/none`, `outfit/doppi` and trigger `once/dress`, but the app never sets them.
- There is no image picker, video, or alternate-icon library yet.

**Tech stack:** Expo SDK 57, expo-router, @rive-app/react-native 0.5.4, PocketBase 0.28, Node test runner.
New packages: `expo-image-picker`, `expo-image` (GIF/WebP playback), `expo-video`, `expo-image-manipulator` (crop/resize), `expo-alternate-app-icons` (needs a new native build).

## Defaults taken (owner can overrule)

1. **Unlocks are parked**, so every cosmetic is free in this build. The exception is items that are earned by their own meaning, which unlock from real progress: streak / unit / CEFR / perfect / speaker frames (9–11, 14, 15), titles (25), name colour (24), and the moving avatar (7). Apples and the shop are not touched.
2. **No moderation yet.** Nobody else can see a profile until social exists (parked). GIF/video is limited to ≤ 8 MB and ≤ 6 s. Longer videos are refused with a message, not trimmed on the phone.
3. **Item 50** (Dombi reacts when someone views your profile) has no viewer until friends exist. It is built as a preview only ("tap to see what visitors will see").
4. **Item 30** (city) is stored but hidden by default, as written. Item 29 shows a script/language icon, never a country flag for Russian.
5. **Dombi stays black** (companion-pet.md). Tints in 49 are near-black only. New hats and items are Rive art; only the doppi exists today.

## Global constraints

- **Design first in Pencil** (`pendev/Akademiya English.pen`), then build. No invented UI: the app shows only what the Pencil screens show. Export PNGs through the existing `pendev/icons-r2` → `npm run assets` pipeline. Never edit `data/assets.ts` by hand.
- **Pencil save safety:** back up to `pendev/backups/` before big edits, verify the file size after each save, and never delete component children.
- Copy is in Uzbek, short and literal, with no slogans.
- All profile data goes into one `profile` object in `Settings`. It syncs inside `users.settings`; media goes to new PocketBase file fields.
- Every task: run `npm run typecheck`, `npm run lint` and `npm test` in `src/mobile`. Pure logic goes in `src/core` with node tests. Keep commits small and leave out `Co-Authored-By`.

## Review Focus

1. Old installs: `Settings` without `profile` loads with defaults, and nothing is lost on sync.
2. Earned items: a streak that drops does not take away a frame already earned. Earned means ever reached, not current.
3. GIF/video on still-picture / Reduce Motion phones: show the first frame only.
4. Theme switch: no screen keeps a hard-coded colour from the old theme (grep for `#` in touched files).
5. Offline: picked media works with no cloud. The upload retries on the next sync.

---

## Phase A · Design in Pencil

### Task A1: Customize hub and editors

- [ ] **Step 1:** Back up the .pen file. Design the **Customize** screen opened by `...`. It has a live profile preview at the top, then rows: Avatar, Frame, Banner, Name and about me, Badges, Stats, Dombi, Profile look (colours, background, what shows), App look, and Account (the existing `/account`).
- [ ] **Step 2:** Design one editor screen or sheet per row. Each one has a grid of choices, a preview, Save, and locked and earned states (locked shows the goal, e.g. "30 kun ketma-ket").
- [ ] **Step 3:** Design the media flow: pick a photo / GIF / video, crop to a circle (avatar) or a 390×199 strip (banner), and the error states for too big and too long.
- [ ] **Step 4:** Design the new Profile tab top: banner, framed avatar, name in its colour, title, bio, tags, and pinned badges. Both light and dark.

### Task A2: Art

- [ ] **Step 1:** Frames: plain colours, streak 7/30/100/365, one per unit, A1–C1, ikat / suzani / Rishtan / Samarkand, Navruz / Independence / New Year / Ramadan, Perfect, Speaker.
- [ ] **Step 2:** Banners: Registan, Khiva, TV tower, Chorsu, Amir Timur square, scene banners (café, shop, airport), patterns, seasonal, Dombi banners. The moving ones (clouds, teapot) are Rive.
- [ ] **Step 3:** Built-avatar kit (item 3): skin tones, hair, eyes, brows, beard, glasses, hijab, doppi, as separate layered parts in the flat round style.
- [ ] **Step 4:** Dombi items in Rive: hats (cap, beanie, chef, graduation, kalpak, quloqchin), neck (scarf, bow tie, atlas ribbon, headphones), held (apple, book, piyola, mic, flag), glasses, and corner props. Extend the `outfit` enum and add `neck` / `held` / `glasses` / `pose` enums the same way.
- [ ] **Step 5:** App icon variants (doppi Dombi, gold, night, ikat) and theme palettes (Violet, Pomegranate, Lagoon, Apricot, Cotton, Night) as tokens in `design/system/tokens.json`.

**Gate:** the owner approves the Pencil screens before Phase B starts.

## Phase B · Build

### Task B1: Profile data and earned rules (core)

**Files:** Create `src/core/profile.js`; Modify `src/core/core.test.js`.

- [ ] **Step 1:** Tests for `defaultProfile()`, `normalizeProfile(raw)` (unknown keys dropped, bad values reset, bio ≤ 60, username `[a-z0-9_]{3,20}`), and `earnedItems(facts)`. Example: best streak 31 → `frame.streak7` and `frame.streak30` but not `frame.streak100`; 10 perfect lessons → `frame.perfect`; first unit checkpoint → `frame.unit.cafe` and `title.cafeRegular`.
- [ ] **Step 2:** FAIL → implement → PASS. Commit `Core: profile data and earned items`.

### Task B2: Catalogue, store and sync

**Files:** Create `src/mobile/src/data/cosmetics.ts`; Modify `lib/store.tsx`, `lib/backend.ts`; Create `server/pocketbase/pb_migrations/<ts>_profile_media.js`.

- [ ] **Step 1:** `cosmetics.ts` holds every frame, banner, title, tag, avatar part and Dombi item, with id, picture, group, and `earnedBy` (or none).
- [ ] **Step 2:** Add `profile` to `Settings` with defaults, and add a `useProfile()` helper that also returns earned items from `profileFacts` + `progressOf`.
- [ ] **Step 3:** In the migration, `users` gets `avatar` and `banner` file fields (jpeg/png/webp/gif/mp4, 8 MB) and a unique `username` text field. `sync()` sends `profile` inside `settings` and uploads changed media.
- [ ] **Step 4:** Commit `Profile: data, catalogue and sync`.

### Task B3: Customize hub

**Files:** Create `src/mobile/src/app/customize.tsx`; Modify `(tabs)/profile.tsx`.

- [ ] **Step 1:** `...` goes to `/customize`. The hub renders the rows from A1, and the Account row opens `/account`.
- [ ] **Step 2:** Create a shared `ProfileHeader` component (banner + framed avatar + name block). Both the Profile tab and the hub preview use it.
- [ ] **Step 3:** Commit `Profile: customize hub`.

### Task B4: Avatar (items 1–7, 7a)

- [ ] **Step 1:** Letter avatar with a picked colour, avatar background (plain / gradient / pattern), and expression.
- [ ] **Step 2:** Photo: `expo-image-picker` → crop (`expo-image-manipulator`) → saved in the app's document folder.
- [ ] **Step 3:** GIF/video: pick and check size and length. GIF plays with `expo-image`; video plays with `expo-video` (looped, muted). Still phones show the first frame.
- [ ] **Step 4:** Dombi avatar (the `Actor` head crop, in his current outfit), built avatar (layered parts), and moving Rive avatar (earned).
- [ ] **Step 5:** Commit after each step.

### Task B5: Frames (8–15)

- [ ] **Step 1:** `AvatarFrame` draws the chosen ring around any avatar kind. The picker shows earned / locked from `earnedItems`.
- [ ] **Step 2:** Seasonal frames show only in their date window. Ramadan is off unless chosen.
- [ ] **Step 3:** Commit.

### Task B6: Banner (16–22, 22a)

- [ ] **Step 1:** The top band becomes `ProfileBanner`: colour / gradient / picture / Dombi scene / Rive moving / own GIF or video. Keep the joined date (item 32) on top of it.
- [ ] **Step 2:** Scene banners unlock when that scene's unit is finished.
- [ ] **Step 3:** Commit.

### Task B7: Name and identity (23–32)

- [ ] **Step 1:** The form has display name, @username (checked for uniqueness on the server when signed in, kept local otherwise), bio, "why I'm learning" tag, dream destination, native language, city (hidden by default), and birthday.
- [ ] **Step 2:** Name colour / gradient (earned) and title picker (earned).
- [ ] **Step 3:** Birthday: a confetti moment on the first app open of the day (reuse the existing celebration).
- [ ] **Step 4:** Commit.

### Task B8: Badges (33–36)

- [ ] **Step 1:** Move the awards out of `ProfileDetails.tsx` into `data/awards.ts` with no change to how they look.
- [ ] **Step 2:** Pin up to 3, display style (grid / row / shelf), Checkpoint trophy shelf with the order chosen by the learner, and the rarest badge spotlight (the rarest by goal size until there are global numbers).
- [ ] **Step 3:** Commit.

### Task B9: Stats (37–41)

- [ ] **Step 1:** Stat picker and layout (one big / 2×2) feed `ProfileDetails`.
- [ ] **Step 2:** Favourite phrase from `newestPhrases`, with the learner's own recording if `saveVoice` is on. Add word of the week.
- [ ] **Step 3:** Private mode hides all stats on the profile.
- [ ] **Step 4:** Commit.

### Task B10: Dombi on the profile (42–50)

**Files:** Modify `components/Actor.tsx`, `DombiPlay.tsx`, `TabChrome.tsx`.

- [ ] **Step 1:** `Actor` sets the `outfit`, `neck`, `held`, `glasses` and `pose` enums from `profile.dombi` and fires `dress` on change.
- [ ] **Step 2:** Dombi's corner on the Profile tab (props behind him), pose, near-black tint (`bool`/`num` input), and rename. The voice line stays "Dombiman" unless the owner says otherwise.
- [ ] **Step 3:** Visitor reaction (item 50) as a preview only.
- [ ] **Step 4:** Commit after each step.

### Task B10a: Profile look and what shows (57a–57h)

- [ ] **Step 1:** Profile colour and card colour. These are profile-only tokens passed to `ProfileHeader` / `ProfileDetails`, with contrast checked against both light and dark.
- [ ] **Step 2:** `ProfileBackground` behind the whole Profile tab: colour / gradient / pattern / picture / own photo, GIF or video (same media path and limits as B4), with a dim/blur slider. Still phones show the first frame.
- [ ] **Step 3:** `profile.sections` is an ordered list of `{id, shown}`. The Profile tab renders from it. The editor has a toggle per part, drag to reorder, and per-stat toggles. Reset to default.
- [ ] **Step 4:** Core tests: `normalizeProfile` keeps unknown section ids out, adds new ones at their default place, and never hides everything (the name stays).
- [ ] **Step 5:** Commit after each step.

### Task B11: App look (51–57)

- [ ] **Step 1:** Change `useTheme()` to `theme(name, dark)` reading palettes from `tokens.json`. `violet` becomes `c.accent`. Replace hard-coded hex in `ui.tsx`, `profile.tsx`, `ProfileDetails.tsx` and `LessonMoment`, one commit per file.
- [ ] **Step 2:** Dark / light / auto (`useColorScheme`). This replaces the `dark` bool, migrated on load.
- [ ] **Step 3:** Add a font size setting to `Txt` (×0.9 / 1 / 1.15 / 1.3) and a dyslexia-friendly font via `expo-font`.
- [ ] **Step 4:** Tab bar labels on/off, lesson backgrounds, and path skins on the course map.
- [ ] **Step 5:** App icon variants with `expo-alternate-app-icons`. This needs a new native build, so it goes last.
- [ ] **Step 6:** Commit after each step.

### Task B12: Review and test build

- [ ] **Step 1:** A fresh reviewer checks the branch against this plan, the Pencil screens and the Review Focus. Fix real findings.
- [ ] **Step 2:** Make a test build and check it on the iPhone: pick a photo, GIF and video; switch theme and dark mode; dress Dombi; restart offline; then sign in and sync.
