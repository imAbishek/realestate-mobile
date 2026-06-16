import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Sentry from '@sentry/react-native'
import { useAuthStore } from '../src/store/authStore'

// Error monitoring (OWASP A09). Inert unless EXPO_PUBLIC_SENTRY_DSN is set,
// and disabled in dev (__DEV__) so only release/OTA builds report.
// Set the DSN as an EAS env var: `eas env:create --name EXPO_PUBLIC_SENTRY_DSN ...`
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENV ?? 'production',
    enabled: !__DEV__,
    tracesSampleRate: 0, // perf tracing off — stay within free tier
  })
}

function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => { void hydrate() }, [hydrate])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#185FA5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post"   options={{ headerShown: false }} />
        <Stack.Screen name="my-listings" options={{ headerShown: false }} />
        <Stack.Screen name="emi-calculator" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}

// Sentry.wrap adds the error boundary + native crash/touch instrumentation.
export default Sentry.wrap(RootLayout)
