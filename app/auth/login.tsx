import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link, Stack, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { authApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import { FormField } from '../../src/components/FormField'
import { PrimaryButton } from '../../src/components/PrimaryButton'

const schema = z.object({
  identifier: z.string().min(1, 'Email or mobile is required'),
  password:   z.string().min(1, 'Password is required'),
})

export default function LoginScreen() {
  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const parsed = schema.safeParse({ identifier, password })
    if (!parsed.success) {
      const fieldErrors: typeof errors = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof typeof errors
        fieldErrors[k] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const { data } = await authApi.login(parsed.data)
      await setSession(data.accessToken, data.refreshToken, data.user)
      router.replace('/')
    } catch (e: unknown) {
      const msg = extractError(e) || 'Login failed. Check your credentials.'
      Alert.alert('Login failed', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to manage listings and inquiries.</Text>

          <FormField
            label="Email or mobile number"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            error={errors.identifier}
            placeholder="you@example.com or 98XXXXXXXX"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
            placeholder="••••••••"
          />

          <Link href="/auth/forgot-password" asChild>
            <Pressable style={styles.forgot}><Text style={styles.link}>Forgot password?</Text></Pressable>
          </Link>

          <PrimaryButton label="Sign in" onPress={submit} loading={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to PropFind? </Text>
            <Link href="/auth/register" asChild>
              <Pressable><Text style={styles.link}>Create an account</Text></Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function extractError(e: unknown): string | null {
  if (typeof e === 'object' && e && 'response' in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response
    return r?.data?.message ?? null
  }
  return null
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#f8fafc' },
  flex:       { flex: 1 },
  scroll:     { padding: 20 },
  heading:    { fontSize: 26, fontWeight: '700', color: '#0f172a' },
  sub:        { fontSize: 14, color: '#64748b', marginTop: 6, marginBottom: 24 },
  forgot:     { alignSelf: 'flex-end', marginBottom: 18, marginTop: 2 },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  footerText: { color: '#64748b', fontSize: 14 },
  link:       { color: '#185FA5', fontWeight: '700', fontSize: 14 },
})
