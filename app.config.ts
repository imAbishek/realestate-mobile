import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Dynamic config layered on top of app.json (#27): the Google Maps API key is
 * injected from the environment instead of being committed to source control.
 *
 * - Local dev: put GOOGLE_MAPS_API_KEY in `.env` (gitignored; see `.env.example`).
 *   Expo Go ignores it anyway — maps in Expo Go use Expo's own key.
 * - EAS builds: `eas env:create --name GOOGLE_MAPS_API_KEY --value <key>` so the
 *   key is injected at build time only.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
    },
  },
})
