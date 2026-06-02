# Mobile — Local Setup (Windows / Linux / macOS)

React Native + Expo (SDK 56, Expo Router, TypeScript). One codebase for Android + iOS.

> First time on this machine? Install prerequisites via the master guide:
> [`../SETUP.md` §1](../SETUP.md). You need **Node.js 20 (LTS)**. You do **not** need
> Android Studio / Xcode for the normal workflow — you run on a real phone via **Expo Go**.

---

## Step 1 — Verify Node

```bash
node -v     # must be v20.x
npm -v
```

> On this dev machine Node is installed via nvm. If `node` isn't found:
> `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"`

---

## Step 2 — Install dependencies

This project has a known peer-dependency conflict, so installs **must** use legacy peer
resolution. That's already pinned in `.npmrc` (`legacy-peer-deps=true`), so a plain install works:

```bash
npm install
```

If you ever install a package manually and npm complains about peer deps, add the flag explicitly:
`npm install <pkg> --legacy-peer-deps`.

---

## Step 3 — Get the Expo Go app on your phone

Install **Expo Go** from the store and make sure the phone is on the **same Wi-Fi network**
as your computer:

- Android — Google Play → "Expo Go"
- iOS — App Store → "Expo Go"

---

## Step 4 — Choose which backend the app talks to

The API URL lives in `app.json` under `expo.extra.apiUrl`. By default it points at the
**deployed** backend:

```json
"extra": { "apiUrl": "https://realestate-backend-tgbv.onrender.com/api" }
```

- **Easiest:** leave it as-is and the app works against the live backend immediately.
- **Against your local backend:** a phone cannot reach `localhost` on your computer, so use
  your machine's **LAN IP**, e.g. `http://192.168.1.50:8080/api`.
  - Find your IP — Windows: `ipconfig` (IPv4 Address); Linux/macOS: `ip addr` / `ifconfig` or `ipconfig getifaddr en0`.
  - Make sure the local backend is running (see [`../realestate-backend/SETUP.md`](../realestate-backend/SETUP.md))
    and your firewall allows inbound 8080 on the LAN.

---

## Step 5 — Start the dev server

```bash
npm start
# = expo start — prints a QR code in the terminal
```

Then:

- **Android** — open Expo Go → "Scan QR code" → scan the terminal QR.
- **iOS** — open the Camera app → point at the QR → tap the Expo banner.

The app loads and hot-reloads on save.

### Optional: emulators/simulators

Only needed if you don't want to use a physical phone (requires extra tooling):

```bash
npm run android    # needs Android Studio + an AVD running (Win/Linux/Mac)
npm run ios        # macOS only — needs Xcode + iOS Simulator
npm run web        # run in a browser
```

---

## Step 6 — Validate after any change

```bash
npx tsc --noEmit     # type check — must pass
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm install` fails on peer deps | Confirm `.npmrc` has `legacy-peer-deps=true`, or add `--legacy-peer-deps`. |
| Phone can't load the app | Phone and computer must be on the same Wi-Fi. Try `npx expo start --tunnel` if your network blocks LAN connections. |
| App loads but no data (local backend) | `apiUrl` must be your LAN IP, not `localhost`; backend running; firewall allows port 8080. |
| `node`/`npm` not found (Linux nvm) | `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"`. |
| Metro bundler cache issues | `npx expo start -c` to clear the cache. |
| Expo Go version mismatch | This project is SDK 56 — update Expo Go from the store, or read the versioned docs at https://docs.expo.dev/versions/v56.0.0/. |
