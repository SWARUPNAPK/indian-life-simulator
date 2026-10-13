# Build the Android Package Kit (APK) — Indian Life Simulator

The game is an offline HTML5 app in `www/`, wrapped as a native Android app with Capacitor. Nothing needs a server or internet connection.

## 0. Test in a browser first (optional)
```
npm install
npm run serve
```
Open the shown address on your phone (same Wi-Fi) or in desktop Chrome with device mode.

## Option A — Android Studio (recommended)
Requirements: Node.js 20 or newer, Android Studio (includes the Android Software Development Kit and Java).

```
npm install
npx cap add android
npx cap sync android
npx cap open android
```
In Android Studio: wait for Gradle sync, then **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
Output: `android/app/build/outputs/apk/debug/app-debug.apk`
Copy that file to your phone and install it (allow "Install unknown apps" when asked).

Run directly on a phone: enable Developer options → USB debugging, connect, press the green Run button.

## Option B — Command line only
Requirements: Node.js 20+, Java 21, Android command-line tools with `ANDROID_HOME` set.
```
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

## Option C — No installation (GitHub Actions)
1. Create a new GitHub repository and upload this whole folder (including `.github/`).
2. Open the **Actions** tab → **Build Android debug APK** → **Run workflow**.
3. When finished, download `indian-life-simulator-debug-apk` from the run page. Unzip it for `app-debug.apk`.

## Before publishing (Google Play)
1. Change `appId` in `capacitor.config.json` to your own unique name, e.g. `in.yourname.lifesim`. Do this **before** `npx cap add android`.
2. Set app icon: put a 1024×1024 `icon.png` in an `assets/` folder, then run `npx @capacitor/assets generate --android`.
3. Create a signing key (keep it safe and backed up):
   ```
   keytool -genkey -v -keystore lifesim.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lifesim
   ```
4. In Android Studio: **Build → Generate Signed Bundle / APK** → choose **Android App Bundle (AAB)** for Google Play, or APK for direct sharing.
5. Google Play requires a developer account, a privacy policy, a content rating form, and a current target Application Programming Interface level. Check Play Console for the latest requirement.

## Updating the game
Edit `www/game.js` or `www/index.html`, then run `npx cap sync android` and rebuild.
Settings you can tweak without code knowledge: the `CONFIG` block at the top of `www/game.js`.

## If versions have moved on
Run `npx cap doctor` to see required Node.js and Java versions for your installed Capacitor release.

## Notes
- Progress saves automatically on the device (local storage).
- The daily challenge uses the phone's date for a shared seed. A global leaderboard needs a server and is not included.
- Share button uses the system share sheet via `@capacitor/share`.
- All money, careers and stocks are a fictional game economy, not real advice.
