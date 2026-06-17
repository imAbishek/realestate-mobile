import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { authApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import { FormField } from '../../src/components/FormField'
import { PrimaryButton } from '../../src/components/PrimaryButton'

const schema = z.object({
  email:       z.string().email('Enter a valid email address'),
  otp:         z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:     z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

type Errors = Partial<Record<'email' | 'otp' | 'newPassword' | 'confirm', string>>

export default function ResetPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ email?: string }>()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState(params.email ?? '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const resend = async () => {
    if (!z.string().email().safeParse(email).success) {
      Alert.alert('Enter your email', 'Please enter a valid email address first.')
      return
    }
    setResending(true)
    try {
      await authApi.forgotPassword(email)
    } catch {
      // Neutral response either way (anti-enumeration, mirrors the backend).
    } finally {
      setResending(false)
      setCooldown(30)
      Alert.alert('OTP resent', `A new OTP has been sent to ${email}.`)
    }
  }

  const submit = async () => {
    const parsed = schema.safeParse({ email, otp, newPassword, confirm })
    if (!parsed.success) {
      const fieldErrors: Errors = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Errors
        fieldErrors[k] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await authApi.resetPassword(parsed.data.email, parsed.data.otp, parsed.data.newPassword)
    } catch (e: unknown) {
      Alert.alert('Reset failed', extractError(e) || 'Invalid or expired OTP. Please try again.')
      setSubmitting(false)
      return
    }
    // Password changed — sign in with the new credentials so the user skips the login screen.
    try {
      const { data } = await authApi.login({ identifier: parsed.data.email, password: parsed.data.newPassword })
      await setSession(data.accessToken, data.refreshToken, data.user)
      router.replace('/')
    } catch {
      Alert.alert('Password reset', 'Your password has been reset. Please sign in.')
      router.replace('/auth/login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Set new password' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Set a new password</Text>
          <Text style={styles.sub}>Enter the 6-digit OTP sent to your email and choose a new password.</Text>

          <FormField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            error={errors.email}
            placeholder="you@example.com"
          />
          <FormField
            label="One-time password (OTP)"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            error={errors.otp}
            placeholder="123456"
          />
          <FormField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            error={errors.newPassword}
            placeholder="Min. 8 characters"
          />
          <FormField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirm}
            placeholder="Repeat your new password"
          />

          <PrimaryButton label="Reset password" onPress={submit} loading={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn&apos;t get the OTP? </Text>
            <Pressable onPress={resend} disabled={resending || cooldown > 0}>
              <Text style={[styles.link, (resending || cooldown > 0) && styles.linkDisabled]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Resending…' : 'Resend'}
              </Text>
            </Pressable>
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
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  footerText: { color: '#64748b', fontSize: 14 },
  link:       { color: '#185FA5', fontWeight: '700', fontSize: 14 },
  linkDisabled: { color: '#94a3b8' },
})
