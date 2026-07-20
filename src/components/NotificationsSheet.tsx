import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { Text } from './Text'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { DraggableSheet } from './DraggableSheet'
import { bookingsApi, propertyApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { colors, fonts, radius } from '../theme'

// ponytail: no notifications backend yet — this derives a feed client-side from
// the user's bookings + listing statuses. Replace with a real /notifications
// endpoint (+ unread tracking + push) when expo-notifications lands (backlog).

interface Notice {
  id: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  body: string
  at: string // ISO — used for sorting + the time label
  onPress?: () => void
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [items, setItems] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible || !isLoggedIn) return
    let mounted = true
    setLoading(true)
    ;(async () => {
      const notices: Notice[] = []
      const go = (path: string) => () => { onClose(); router.push(path as never) }
      const [bookings, listings] = await Promise.allSettled([
        bookingsApi.listMine(0, 20),
        propertyApi.myListings(0, 20),
      ])
      if (bookings.status === 'fulfilled') {
        for (const b of bookings.value.data.content) {
          if (b.status === 'CONFIRMED') notices.push({
            id: `b-${b.id}`, icon: 'calendar', at: b.updatedAt,
            title: 'Site visit confirmed',
            body: `${b.propertyTitle} — ${[b.preferredDate, b.preferredWindow].filter(Boolean).join(' · ') || 'owner will coordinate the slot'}`,
            onPress: go(`/properties/${b.propertyId}`),
          })
          if (b.status === 'CANCELLED' && b.cancelledBy === 'OWNER') notices.push({
            id: `b-${b.id}`, icon: 'calendar-clear-outline', at: b.updatedAt,
            title: 'Site visit cancelled by owner',
            body: b.propertyTitle,
            onPress: go(`/properties/${b.propertyId}`),
          })
        }
      }
      if (listings.status === 'fulfilled') {
        for (const p of listings.value.data.content) {
          if (p.status === 'ACTIVE') notices.push({
            id: `l-${p.id}`, icon: 'checkmark-circle', at: p.createdAt,
            title: 'Your listing is live',
            body: p.title,
            onPress: go(`/properties/${p.id}?ownerView=1`),
          })
          if (p.status === 'REJECTED') notices.push({
            id: `l-${p.id}`, icon: 'alert-circle-outline', at: p.createdAt,
            title: 'Listing needs changes',
            body: `${p.title} — open it to see the review notes`,
            onPress: go(`/properties/${p.id}?ownerView=1`),
          })
          if (p.status === 'PENDING_REVIEW') notices.push({
            id: `l-${p.id}`, icon: 'time-outline', at: p.createdAt,
            title: 'Listing under review',
            body: p.title,
            onPress: go(`/properties/${p.id}?ownerView=1`),
          })
        }
      }
      notices.sort((a, b) => b.at.localeCompare(a.at))
      if (mounted) { setItems(notices.slice(0, 12)); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [visible, isLoggedIn, onClose, router])

  return (
    <DraggableSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Notifications</Text>

      {!isLoggedIn ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={26} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>Sign in to see your updates</Text>
          <Text style={styles.emptyBody}>Site-visit confirmations and news about your listings show up here.</Text>
          <Pressable style={styles.signInBtn} onPress={() => { onClose(); router.push('/auth/login') }}>
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: 28 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-off-outline" size={26} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyBody}>Updates on your site visits and listings will appear here.</Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={false}>
          {items.map((n) => (
            <Pressable key={n.id} onPress={n.onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
              <View style={styles.rowIcon}><Ionicons name={n.icon} size={18} color={colors.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{n.title}</Text>
                <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text>
              </View>
              <Text style={styles.rowTime}>{timeAgo(n.at)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </DraggableSheet>
  )
}

const styles = StyleSheet.create({
  title:      { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, marginTop: 6, marginBottom: 12 },

  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowIcon:    { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  rowTitle:   { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  rowBody:    { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  rowTime:    { fontFamily: fonts.medium, fontSize: 11, color: colors.mutedLight, marginTop: 2 },

  emptyWrap:  { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 },
  emptyIcon:  { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  emptyBody:  { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 19 },
  signInBtn:  { backgroundColor: colors.brand, borderRadius: radius.sm, paddingHorizontal: 28, paddingVertical: 12, marginTop: 14 },
  signInText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
})
