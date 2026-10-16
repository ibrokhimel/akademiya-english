# Local servers (on the owner's PC)

The phone app's local build (tech-stack.md §0b) talks to two servers on the owner's Windows PC, over the home
network. Set up and checked 2026-10-16.

| Server | What it does | Address for the app |
|---|---|---|
| **PocketBase** 0.40.5 | accounts, progress events, settings, voice recordings, feedback | `http://192.168.1.222:8090` |
| **Whisper** (large-v3-turbo, graphics card) | speech to text, the fallback when the phone's own recogniser fails | `http://192.168.1.222:8795` |

`192.168.1.222` is the PC's address on the home network today. The router may give it a new one after a restart:
`node server/start.js` prints the current address every time it starts. (To stop it changing, reserve that address
for the PC in the router's settings.)

## Start them (on the PC)

```bash
node server/start.js
```

Leave that window open. `node server/start.js --local` starts them for this PC only.

## For the app (Codex)

**PocketBase** — use the official `pocketbase` JS SDK pointed at the address above.
- Sign-in: email and password (`users` collection, `authWithPassword`; sign up with `create`). The built-in
  `name` field holds the learner's name; `settings` (JSON) holds goal, reminder, dark, sound, speaking, saveVoice
  and cast.
- `events`: `user`, `client_id` (make one on the phone per event, so an event saved offline is sent once; a second
  send is refused with 400), `type` (`onboarding` · `lesson` · `confidence` · `account` · `feedback`), `at` (when
  it happened on the phone), `data` (the rest of the event, exactly as the browser version keeps it). Events
  can't be changed or deleted, only added.
- `recordings`: `user`, `phrase`, `audio` (one file, up to 5 MB, a real m4a/aac/mp3/wav/webm/ogg; the server
  checks the content), `ms`, `at`. One per phrase per learner: replace by updating the existing row. Files are
  private: play them with a file token (`pb.files.getToken()`).
- `feedback`: `user`, `text`, `screen`, optional `screenshot` (png/jpeg). The app can send it, not read it.
- Every rule lets a learner reach only their own rows. Deleting the account (`users` delete) removes all of it,
  files included.
- Layout in code: `server/pocketbase/pb_migrations/`. Rule checks: `node server/pocketbase/check.js`.

**Whisper** — `GET /health` → `{"ok": true, ...}`. `POST /stt` with the recorded sound as the body → `{"text":
"..."}`; add `?partial=1` for the words so far while the learner is still speaking. See `src/web/hear.js`.
Check: `node server/check-stt.js`.

**iOS:** the app talks to a plain `http://` address on the home network, so allow local networking in the app's
settings (`NSAppTransportSecurity` → `NSAllowsLocalNetworking`) and add a `NSLocalNetworkUsageDescription`
line. iOS asks the learner once for local network access.

## The owner, once (Windows)

Phones can only reach the PC when Windows treats the home network as private:
1. Settings → Network & internet → **Ethernet** → Network profile type → **Private network**.
2. The first time `node server/start.js` runs, Windows asks whether to allow `pocketbase.exe` and `python.exe`
   on the network: tick **Private networks** only and click **Allow**.

## Dashboard

`http://127.0.0.1:8090/_/` on the PC. Accounts, events (usage numbers come from these), feedback, recordings.
The login is in `server/pocketbase/admin-login.txt`, which stays on the PC and is never committed.
