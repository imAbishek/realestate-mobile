import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InfoSheet, type InfoSheetContent } from '../../src/components/InfoSheet'
import { ConfirmSheet } from '../../src/components/ConfirmSheet'
import { useAuthStore } from '../../src/store/authStore'

export default function ProfileScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const clearSession = useAuthStore((s) => s.clearSession)
  // Branded "coming soon" sheet instead of a bare Alert box.
  const [info, setInfo] = useState<InfoSheetContent | null>(null)
  const [signOutOpen, setSignOutOpen] = useState(false)

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={72} color="#cbd5e1" />
          <Text style={styles.title}>You're browsing as a guest</Text>
          <Text style={styles.sub}>Sign in to send inquiries and post listings.</Text>
          <Link href="/auth/login" asChild>
            <Pressable style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Sign in</Text></Pressable>
          </Link>
          <Link href="/auth/register" asChild>
            <Pressable style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Create account</Text></Pressable>
          </Link>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.roleChip}>{user?.role}</Text>
      </View>

      <View style={styles.list}>
        <Row icon="home-outline"            label="My Listings"   onPress={() => router.push('/my-listings')} />
        <Row icon="heart-outline"           label="Favourites"     onPress={() => setInfo({
          icon: 'heart-outline', title: 'Favourites',
          body: 'Save the properties you love and find them all here — this is coming soon.',
        })} />
        <Row icon="calendar-outline"        label="Bookings"      onPress={() => router.push('/bookings')} />
        <Row icon="settings-outline"        label="Settings"       onPress={() => setInfo({
          icon: 'settings-outline', title: 'Settings',
          body: 'Profile and notification settings are coming soon.',
        })} />
        <Row icon="log-out-outline"         label="Sign out"       onPress={() => setSignOutOpen(true)} danger />
      </View>

      <InfoSheet
        visible={info !== null}
        onClose={() => setInfo(null)}
        {...(info ?? { title: '', body: '' })}
      />

      <ConfirmSheet
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        icon="log-out-outline"
        title="Sign out?"
        body="You will need to log in again to send inquiries or post listings."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => void clearSession()}
      />
    </SafeAreaView>
  )
}

function Row({ icon, label, onPress, danger }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Ionicons name={icon} size={20} color={danger ? '#dc2626' : '#185FA5'} />
      <Text style={[styles.rowLabel, danger && { color: '#dc2626' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:          { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 16, textAlign: 'center' },
  sub:            { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', marginBottom: 20 },
  primaryBtn:     { backgroundColor: '#185FA5', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn:   { borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12, marginTop: 10 },
  secondaryBtnText:{ color: '#185FA5', fontWeight: '600', fontSize: 14 },

  header:         { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: '#185FA5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:     { color: '#fff', fontSize: 28, fontWeight: '700' },
  name:           { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  email:          { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleChip:       { fontSize: 10, fontWeight: '700', color: '#185FA5', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 8, overflow: 'hidden' },

  list:           { paddingHorizontal: 16, marginTop: 12 },
  row:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  rowPressed:     { opacity: 0.6 },
  rowLabel:       { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', marginLeft: 12 },
})
