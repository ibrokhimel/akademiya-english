# Standalone Android MVP

The 1.0 MVP needs no Akademiya server or USB connection. Lessons, both audio
accents, progress, unfinished lessons, recordings and reminders are local.
Android's speech service can require an internet connection or a downloaded
English model. Settings > Nutqni tanish explains model installation. Learners can
finish lessons by selecting words when speech recognition is unavailable.

Cloud sign-in, social features, cosmetic rewards and internal test controls are
hidden in public builds. Feedback opens Android's share sheet and retains its
draft; opening the share sheet is never described as confirmed delivery.

## Build and verify

From this directory:

```powershell
npm run typecheck
npm run lint
npm test
npx expo-doctor
npm run android:signing
$env:EXPO_PUBLIC_INTERNAL_BUILD = '0'
$env:EXPO_PUBLIC_VISUAL_AUDIT = '0'
npx expo prebuild --platform android --no-install --no-clean
npm run android:release
node scripts/verify-android-release.cjs
```

Outputs in `.expo/builds/`:

- `akademiya-english-arm64-v8a,x86_64.apk`: public release, signed with the private key.
- `akademiya-english-arm64-v8a,x86_64.aab`: signed Play Store upload bundle.

Signing material is kept outside the repository in
`%LOCALAPPDATA%/Akademiya/signing/`. Keep a secure backup of that folder. Future
direct APK updates require the same signing key. The build refuses to silently
substitute a debug key when the private key is missing.

## Existing development installation

The old Redmi installation uses Android's development certificate. A production
certificate cannot update that installation in place. To preserve its data while
testing the exact public UI, use:

```powershell
npm run android:test-apk
adb install -r '.expo/builds/akademiya-test-arm64-v8a,x86_64.apk'
```

This explicitly produces a test-signed APK. It does not replace or overwrite the
separately signed public APK/AAB. Do not uninstall an existing learner's app or
clear its storage as a way to switch signing certificates.

## Release verification

Automated checks cover course/session rules, navigation, localhost/test-setting
migration, reminder timing and suppression, daylight-saving changes, notification
destinations, and signing safeguards. Device evidence is saved under
`.expo/mvp-release-checks/`.

Android schedules one invitation per day for the next year and refreshes the plan
on app opening, preference changes and lesson completion. Today's invitation is
removed after a lesson. Permission denial and Android battery restrictions can
prevent or delay delivery. Force-stopping an app suppresses its alarms until it is
opened again; dismissing it from recent apps is a different operation.

Public hosting, OAuth providers and Play Console submission are outside this
phone-only MVP. Do not enable cloud UI until a hosted HTTPS service is configured.
