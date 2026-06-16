<div align="center">

# 🏡 PropFind — Mobile

**The React Native (Expo) mobile app for PropFind, a full-stack real estate listing platform.**

A single codebase targeting **Android & iOS** — browse listings on an interactive map, post a property with a guided wizard, calculate EMIs, and book site visits.

[![Expo](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo Router](https://img.shields.io/badge/Expo%20Router-file--based-000020?logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![EAS](https://img.shields.io/badge/build-EAS%20%2B%20OTA-4630EB?logo=expo&logoColor=white)](https://docs.expo.dev/eas/)
[![Sentry](https://img.shields.io/badge/observability-Sentry-362D59?logo=sentry&logoColor=white)](https://sentry.io/)

</div>

---

## 📱 What it does

- 🏠 **Browse & search** — gradient-hero home, property cards, city picker with GPS detection.
- 🗺️ **Map view** — satellite map with price-pill markers, a synced card carousel, and category chips (InvusProp-style).
- 📝 **Post a property** — 6-step wizard with an in-map location picker and document upload.
- 🔍 **Property detail** — image gallery with thumbnail strip, full specs, and contact actions.
- 💰 **EMI calculator** — estimate monthly payments inline.
- ❤️ **Saved & bookings** — favourite listings, book/cancel site visits.
- 🔐 **Secure auth** — login with email or Indian mobile; tokens stored in the device's encrypted keystore.

5-tab navigation: **Home · Map · Saved · Bookings · Profile**.

## 🛠️ Tech stack

| Area | Choice |
|---|---|
| Framework | **Expo SDK 56**, React Native 0.85, React 19, TypeScript (strict) |
| Routing | `expo-router` (file-based, `app/` directory) |
| State | Zustand; **`expo-secure-store`** for encrypted token persistence |
| Data | Typed Axios client (`src/lib/api.ts`) with JWT interceptor + 401 handling |
| Maps | `react-native-maps` (Google provider) + `expo-location` |
| Media | `expo-image-picker`, `expo-document-picker` |
| Build & ship | **EAS Build** (standalone APK) + **EAS Update** (OTA) |
| Observability | Sentry (`@sentry/react-native`) |

## 🧱 Architecture notes

- **File-based routing** via `expo-router` — same mental model as Next.js, under `app/`.
- **Tokens never touch plain storage** — `expo-secure-store` (iOS Keychain / Android Keystore).
- **Shared API contract** — `src/types/` mirrors the backend DTOs, kept in sync with the web app.
- **Sentry** is wired via the Expo config plugin + `Sentry.wrap`, DSN-gated and disabled in dev.

```
app/                 # expo-router screens
├── (tabs)/          # Home · Map · Saved · Bookings · Profile
├── post/            # Add-property wizard
├── property/[id]    # Property detail
└── _layout.tsx      # Root layout (+ Sentry init)
src/
├── lib/api.ts       # All HTTP calls
├── store/           # Zustand stores (auth, location)
├── components/      # DraggableSheet, CityPickerSheet, ConfirmSheet, …
└── types/           # TS types mirroring backend DTOs
```

## 🚀 Getting started

> **Full per-OS setup (Windows / Linux / macOS): see [`SETUP.md`](SETUP.md).**

```bash
# 1. Install (requires Node 20 via nvm)
npm install

# 2. Configure env
cp .env.example .env
# set the API URL; add GOOGLE_MAPS_API_KEY for native map builds

# 3. Run
npx expo start --lan        # open in Expo Go (non-map screens) or a dev build
```

### Validation

```bash
npx tsc --noEmit            # type check (must be clean)
```

### Build & deploy

```bash
eas update --branch preview # ship JS-only changes over the air (OTA)
eas build --profile preview # native build (needed for new native modules / maps)
```

## 🧩 Part of PropFind

| Repo | Description |
|---|---|
| **realestate-mobile** (this) | React Native + Expo app |
| [realestate-backend](https://github.com/imAbishek/realestate-backend) | Spring Boot REST API |
| [realestate-frontend](https://github.com/imAbishek/realestate-frontend) | Next.js 16 web app |

---

<div align="center">
Built by <a href="https://github.com/imAbishek">Abishek</a> · React Native · Expo
</div>
