# Firebase setup — required before phone sign-in works

The phone-OTP code is complete and wired up, but it cannot send a real SMS until
a Firebase project is attached. The repo currently ships a **placeholder**
`google-services.json` so the Gradle `google-services` plugin can run and the app
still compiles. The app detects that placeholder at runtime (`project_id` is
`minty-placeholder`) and shows an honest "not configured" banner on the sign-in
screen instead of pretending to send a code.

Work through the steps below, in order. Only you can do these — they need access
to the Firebase console and your Play account.

---

## 1. Create / open the Firebase project

Firebase console → your project (Blaze plan is fine; phone auth SMS is billed
per message beyond the free tier).

## 2. Register the Android app

**Android package name — must match exactly:**

```
com.skillizee.mintifinance
```

## 3. Add the signing fingerprints

Firebase → Project settings → Your apps → Android app → *Add fingerprint*.

Android phone auth will not work without these: Firebase uses them for app
verification (Play Integrity, with reCAPTCHA as the fallback).

**Debug keystore** (`android/app/debug.keystore`) — already computed:

| | |
|---|---|
| SHA-1 | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| SHA-256 | `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C` |

**Release keystore.** Note that `android/app/build.gradle` currently signs the
*release* build with the debug keystore:

```gradle
release {
    // Caution! In production, you need to generate your own keystore file.
    signingConfig signingConfigs.debug
}
```

So today the release fingerprints are the same as the debug ones above. Before
you ship you must generate a real release keystore, point `signingConfigs.release`
at it, and add **that** keystore's SHA-1 and SHA-256 to Firebase as well:

```bash
keytool -list -v -keystore <your-release.keystore> -alias <your-alias>
```

**If you use Play App Signing** (the default for new apps on Google Play), the
APK Google serves is re-signed with Google's key. The upload-key fingerprint is
*not* enough. Copy the SHA-1 and SHA-256 from
*Play Console → your app → Setup → App signing → App signing key certificate*
and add those to Firebase too, or phone auth will fail only for Play-installed
production builds while working fine locally.

## 4. Download the real `google-services.json`

Put it at the repository root, replacing the placeholder:

```
./google-services.json
```

`app.json` already points at it (`expo.android.googleServicesFile`). The file is
listed in `.gitignore` so your real credentials are not committed.

## 5. Enable the Phone provider

Firebase console → Authentication → Sign-in method → **Phone** → Enable.

Also check **SMS region policy** on that screen and allow the regions your
students are in (India, at minimum). A number outside the allowed regions fails
with a generic error.

## 6. Publish the Firestore rules

`firestore.rules` in this repo scopes every profile to its own UID and grants no
role-based access of any kind.

```bash
firebase deploy --only firestore:rules
```

## 7. Test numbers (development only)

Firebase console → Authentication → Sign-in method → Phone → *Phone numbers for
testing*. Add a fictional number and a fixed code there to avoid burning real
SMS quota while testing.

These live in the Firebase console, **not** in the app. There is deliberately no
hardcoded test number or bypass code anywhere in this codebase, and
`setAppVerificationDisabledForTesting` is not used.

---

## Rebuild after configuring

The Firebase native config is baked in at build time, so a JS reload is not
enough:

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew.bat assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Verifying it worked

On the sign-in screen, the amber "not configured" banner should be gone. If it
is still there, the app is still reading the placeholder file — check that
`google-services.json` really was replaced and that you rebuilt rather than just
reloading.
