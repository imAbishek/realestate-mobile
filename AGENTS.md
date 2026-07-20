# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

> **Local setup (Windows / Linux / macOS):** see [`SETUP.md`](SETUP.md).

## Conventions

**Text / TextInput — import from `src/components/Text.tsx`, never from `react-native`.**
Android's `includeFontPadding` defaults to on and reserves uneven top/bottom space
for Plus Jakarta Sans and Playfair Display (both declare asymmetric metrics), so raw
react-native text sits a few pixels above the optical centre of any row it's aligned
in — icon+label rows, pills, badges, headers. The wrapper turns it off once, for every
screen including ones not written yet. Enforced by `npm run check:text` (CI gate).
Exception: the stack header — native-stack's `headerTitleStyle` only honours font
family/size/colour, so `app/_layout.tsx` passes its own `headerTitle` Text.

Side effect worth knowing: without that padding there's no slack absorbing tall
glyphs, so set an explicit `lineHeight` on any text in a cramped fixed-height box.

## Gates (run before calling anything done)

```bash
npx tsc --noEmit     # the type gate — no ESLint in this repo
npm run check:text   # Text/TextInput import guard
```
