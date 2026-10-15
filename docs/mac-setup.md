# Mac setup for the phone app

Do this once on the Mac. After it, the phone app builds on the Mac and runs in the iPhone simulator and then on
your iPhone. It takes about an hour, most of it waiting for Xcode to download.

**What you need:** the Mac, your normal Apple ID, your iPhone and its cable. No paid developer account yet.
**Versions (Expo SDK 57):** Xcode **26.4 or newer**, iPhone on **iOS 16.4 or newer**.

Every command goes into the **Terminal** app (press Cmd + Space, type "Terminal", press Enter). Paste one
command, press Enter, wait until it finishes, then do the next one.

---

## 1. Update macOS

Apple menu → System Settings → General → Software Update. Install what it offers. New Xcode versions need a
recent macOS, so do this first.

## 2. Install Xcode (the big one)

1. Open the **App Store**, search **Xcode**, press **Get**. It is about 10 GB, so leave it.
2. Open Xcode once when it finishes. Accept the licence. When it asks which platforms to add, tick **iOS** and
   press **Download**. That is the iPhone simulator.
3. Check the version: Xcode menu → About Xcode. It must say **26.4** or higher.
4. Point the command-line tools at it:

```bash
sudo xcode-select -s /Applications/Xcode.app
```

It asks for the Mac's password. Nothing shows while you type; that is normal.

## 3. Install Homebrew (a tool that installs the other tools)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

At the end it prints two or three lines under **"Next steps"**. Copy and run those too, otherwise the `brew`
command will not be found.

## 4. Install Node, Watchman, CocoaPods and GitHub's tool

```bash
brew install node watchman cocoapods gh
```

Check it worked. Each should print a version number:

```bash
node -v && pod --version && gh --version
```

## 5. Get the project from GitHub

The repo is private, so log in to GitHub first. Pick **GitHub.com → HTTPS → Login with a web browser** and
follow the code it shows.

```bash
gh auth login
```

Then download the project into your Documents folder:

```bash
cd ~/Documents && gh repo clone ibrokhimel/akademiya-english
```

## 6. Install the app's packages

```bash
cd ~/Documents/akademiya-english/src/mobile && npm ci
```

## 7. First run: the iPhone simulator

```bash
npx expo run:ios
```

The first time takes 5–15 minutes: it creates the `ios` folder, installs the iOS libraries and builds the app.
A simulated iPhone opens with the app in it. Leave the Terminal window open; it is what feeds the app its code.

**If it fails:** copy the last 30 lines of the Terminal into the chat.

## 8. Your real iPhone

1. **Add your Apple ID to Xcode:** Xcode → Settings → Accounts → **+** → Apple ID.
2. **Turn on Developer Mode on the iPhone:** plug it into the Mac and tap **Trust** on the phone. Then
   Settings → Privacy & Security → **Developer Mode** → on. The phone restarts; confirm when it asks.
   (If Developer Mode is not in the list yet, do step 3 once; it appears after Xcode has seen the phone.)
3. **Pick the signing team:**

```bash
open ~/Documents/akademiya-english/src/mobile/ios/*.xcworkspace
```

   In Xcode, click the blue project icon at the top left → the app under **TARGETS** → **Signing &
   Capabilities** → tick **Automatically manage signing** → **Team:** your name (Personal Team).

4. **Build onto the phone** (pick your iPhone from the list it shows):

```bash
cd ~/Documents/akademiya-english/src/mobile && npx expo run:ios --device
```

5. **The first time only**, the phone will not open the app until you trust yourself as the developer:
   iPhone Settings → General → **VPN & Device Management** → your Apple ID → **Trust**.

The phone and the Mac must be on the **same Wi-Fi** while you test, because the app gets its code from the Mac.

**Good to know:** with a free Apple ID the app stops opening after **7 days**. Run step 8.4 again to renew it.
A paid developer account ($99 a year) removes that limit and is only needed later, for TestFlight.

---

## Every day after this

Get the latest code, then start the app:

```bash
cd ~/Documents/akademiya-english && git pull && cd src/mobile && npm ci && npx expo start
```

Then press **i** in the Terminal for the simulator, or open the app on the iPhone.

Run `npx expo run:ios` (or `--device`) again instead of `npx expo start` only when Codex or Claude says a new native
package was added. Otherwise the plain start is enough and takes seconds.

---

## Building with Codex

When steps 1–6 are done, start Codex in `~/Documents/akademiya-english` and paste the prompt from
[codex-prompt.md](codex-prompt.md).
