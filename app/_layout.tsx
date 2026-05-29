import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../src/store/authStore'

export default function RootLayout() {
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
        <Stack.Screen name="emi-calculator" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}
