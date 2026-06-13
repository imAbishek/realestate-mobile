import { useCallback, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { bookingsApi } from '../../src/lib/api'
import { ConfirmSheet } from '../../src/components/ConfirmSheet'
import { useAuthStore } from '../../src/store/authStore'
import type { BookingStatus, SiteVisitBooking } from '../../src/types'

const BRAND  = '#185FA5'
const ACCENT = '#D85A30'

const STATUS_STYLE: Record<BookingStatus, { bg: string; fg: string; label: string }> = {
  REQUESTED: { bg: '#fff7ed', fg: '#c2410c', label: 'Requested' },
  CONFIRMED: { bg: '#eff6ff', fg: '#1d4ed8', label: 'Confirmed' },
  COMPLETED: { bg: '#ecfdf5', fg: '#15803d', label: 'Completed' },
  CANCELLED: { bg: '#f1f5f9', fg: '#64748b', label: 'Cancelled' },
}

export default function BookingsScreen() {
  const router = useRouter()
  const { isLoggedIn, hydrated } = useAuthStore()

  const [items, setItems] = useState<SiteVisitBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<SiteVisitBooking | null>(null)

  const load = useCallback(async () => {
    if (!hydrated) return // wait for session restore; identity change re-fires the focus effect
    if (!isLoggedIn) { setItems([]); setLoading(false); return }
    try {
      const { data } = await bookingsApi.listMine(0, 50)
      setItems(data.content)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [hydrated, isLoggedIn])

  // Re-fetch on focus — a booking can be made from the detail screen.
  // No separate mount effect: it double-fetched on first focus (#30); useFocusEffect alone
  // covers mount, refocus, and the post-hydration re-run (load's identity changes).
  useFocusEffect(useCallback(() => { setLoading(true); load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const doCancel = async (b: SiteVisitBooking) => {
    setCancelling(b.id)
    // Optimistic — flip to CANCELLED locally.
    setItems((prev) => prev.map((x) =>
      x.id === b.id ? { ...x, status: 'CANCELLED', cancelledBy: 'BUYER' } : x))
    try {
      await bookingsApi.cancel(b.id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not cancel'
      Alert.alert('Cancel failed', msg)
      load() // reconcile with server state
    } finally {
      setCancelling(null)
    }
  }

  if (!hydrated || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <View style={styles.center}><ActivityIndicator color={BRAND} /></View>
      </SafeAreaView>
    )
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Sign in to see your bookings</Text>
          <Text style={styles.emptySub}>Site visits you request will show up here.</Text>
          <Pressable onPress={() => router.push('/auth/login')} style={styles.cta}>
            <Text style={styles.ctaText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No site visits booked yet</Text>
          <Text style={styles.emptySub}>Tap “Book Visit” on any listing to request one.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header count={items.length} />
      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            cancelling={cancelling === item.id}
            onPress={() => router.push(`/properties/${item.propertyId}`)}
            onCancel={() => setCancelTarget(item)}
          />
        )}
      />

      <ConfirmSheet
        visible={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        icon="calendar-outline"
        title="Cancel site visit?"
        body={cancelTarget ? `Cancel your visit request for "${cancelTarget.propertyTitle}"?` : undefined}
        confirmLabel="Cancel visit"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => { if (cancelTarget) doCancel(cancelTarget) }}
      />
    </SafeAreaView>
  )
}

function Header({ count }: { count?: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Bookings</Text>
      {count != null && <Text style={styles.headerCount}>{count} {count === 1 ? 'visit' : 'visits'}</Text>}
    </View>
  )
}

function BookingCard({
  item, cancelling, onPress, onCancel,
}: {
  item: SiteVisitBooking; cancelling: boolean; onPress: () => void; onCancel: () => void
}) {
  const s = STATUS_STYLE[item.status]
  const canCancel = item.status === 'REQUESTED' || item.status === 'CONFIRMED'
  const slot = [item.preferredDate, item.preferredWindow].filter(Boolean).join(' · ')

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={styles.cardTop}>
        <View style={styles.thumbWrap}>
          {item.propertyImageUrl ? (
            <Image source={{ uri: item.propertyImageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="image-outline" size={22} color="#94a3b8" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.propertyTitle}</Text>
              <View style={[styles.pill, { backgroundColor: s.bg }]}>
                <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
              </View>
            </View>
            <Text style={styles.cardSub} numberOfLines={1}>
              {item.propertyLocality}, {item.propertyCity}
            </Text>
          </View>
          <View style={styles.slotRow}>
            <Ionicons name="time-outline" size={13} color="#64748b" />
            <Text style={styles.slot}>{slot || 'Flexible slot'}</Text>
          </View>
        </View>
      </Pressable>

      {canCancel ? (
        <Pressable onPress={onCancel} disabled={cancelling} style={styles.cancelBtn}>
          {cancelling
            ? <ActivityIndicator size="small" color="#dc2626" />
            : <>
                <Ionicons name="close-circle-outline" size={15} color="#dc2626" />
                <Text style={styles.cancelText}>Cancel visit</Text>
              </>}
        </Pressable>
      ) : item.cancelReason ? (
        <View style={styles.reasonRow}>
          <Text style={styles.reasonText} numberOfLines={2}>Reason: {item.cancelReason}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f8fafc' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerCount: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  emptySub:    { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', lineHeight: 19 },
  cta:         { marginTop: 18, backgroundColor: ACCENT, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  ctaText:     { color: '#fff', fontWeight: '700', fontSize: 14 },

  card:        { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop:     { flexDirection: 'row' },
  thumbWrap:   { width: 104, height: 104, backgroundColor: '#e2e8f0' },
  thumb:       { width: '100%', height: '100%' },
  thumbEmpty:  { alignItems: 'center', justifyContent: 'center' },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:   { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardSub:     { fontSize: 12, color: '#64748b', marginTop: 3 },
  slotRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  slot:        { fontSize: 12, color: '#475569', fontWeight: '500' },

  pill:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText:    { fontSize: 10, fontWeight: '700' },

  cancelBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cancelText:  { fontSize: 13, fontWeight: '600', color: '#dc2626' },
  reasonRow:   { paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  reasonText:  { fontSize: 12, color: '#64748b' },
})
