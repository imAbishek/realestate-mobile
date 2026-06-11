import { useCallback, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { propertyApi } from '../src/lib/api'
import { useAuthStore } from '../src/store/authStore'
import type { ListingStatus, PriceUnit, PropertyCard } from '../src/types'

const BRAND  = '#185FA5'
const ACCENT = '#D85A30'

const STATUS_STYLE: Record<ListingStatus, { bg: string; fg: string; label: string }> = {
  DRAFT:          { bg: '#f1f5f9', fg: '#64748b', label: 'Draft' },
  PENDING_REVIEW: { bg: '#fef3c7', fg: '#b45309', label: 'In review' },
  ACTIVE:         { bg: '#dcfce7', fg: '#15803d', label: 'Active' },
  EXPIRED:        { bg: '#f1f5f9', fg: '#64748b', label: 'Expired' },
  REJECTED:       { bg: '#fee2e2', fg: '#b91c1c', label: 'Rejected' },
  SOLD_RENTED:    { bg: '#e0e7ff', fg: '#4338ca', label: 'Sold / Rented' },
}

export default function MyListingsScreen() {
  const router = useRouter()
  const { isLoggedIn, hydrated } = useAuthStore()

  const [items, setItems] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!hydrated) return // wait for session restore; identity change re-fires the focus effect
    if (!isLoggedIn) { setItems([]); setLoading(false); return }
    try {
      const { data } = await propertyApi.myListings(0, 50)
      setItems(data.content)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [hydrated, isLoggedIn])

  // Refresh on focus — a listing just posted from the wizard should appear on return.
  // No separate mount effect: it double-fetched on first focus (#30); useFocusEffect alone
  // covers mount, refocus, and the post-hydration re-run (load's identity changes).
  useFocusEffect(useCallback(() => { setLoading(true); load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  if (!hydrated || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}><ActivityIndicator color={BRAND} /></View>
      </SafeAreaView>
    )
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <Ionicons name="home-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Sign in to see your listings</Text>
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
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <Ionicons name="home-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptySub}>Post your first property to see it here.</Text>
          <Pressable onPress={() => router.push('/post')} style={styles.cta}>
            <Text style={styles.ctaText}>Post a property</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => router.back()} count={items.length} />
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
        renderItem={({ item }) => (
          <ListingCard item={item} onPress={() => router.push({ pathname: '/properties/[id]', params: { id: item.id, ownerView: '1' } })} />
        )}
      />
    </SafeAreaView>
  )
}

function Header({ onBack, count }: { onBack: () => void; count?: number }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={8}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
      <Text style={styles.headerTitle}>My Listings{count != null ? ` (${count})` : ''}</Text>
      <View style={{ width: 22 }} />
    </View>
  )
}

function ListingCard({ item, onPress }: { item: PropertyCard; onPress: () => void }) {
  const st = STATUS_STYLE[item.status]
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumbWrap}>
        {item.primaryImageUrl ? (
          <Image source={{ uri: item.primaryImageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="image-outline" size={22} color="#94a3b8" />
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
        <View>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.fg }]}>{st.label}</Text>
            </View>
            {item.isFeatured ? (
              <View style={[styles.statusBadge, { backgroundColor: '#fff1ea' }]}>
                <Text style={[styles.statusText, { color: ACCENT }]}>Featured</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{item.localityName}, {item.cityName}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatPrice(item.price, item.priceUnit)}</Text>
          <Text style={styles.meta}>{item.viewsCount} views</Text>
        </View>
      </View>
    </Pressable>
  )
}

function formatPrice(price: number, unit: PriceUnit): string {
  if (unit === 'PER_MONTH') return `₹${price.toLocaleString('en-IN')}/mo`
  if (unit === 'PER_SQFT')  return `₹${price.toLocaleString('en-IN')}/sqft`
  if (price >= 10_000_000)  return `₹${(price / 10_000_000).toFixed(2)} Cr`
  if (price >= 100_000)     return `₹${(price / 100_000).toFixed(2)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f8fafc' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BRAND, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  emptySub:     { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', lineHeight: 19 },
  cta:          { marginTop: 18, backgroundColor: ACCENT, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  ctaText:      { color: '#fff', fontWeight: '700', fontSize: 14 },

  card:         { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  thumbWrap:    { width: 110, height: 110, backgroundColor: '#e2e8f0' },
  thumb:        { width: '100%', height: '100%' },
  thumbEmpty:   { alignItems: 'center', justifyContent: 'center' },
  badgeRow:     { flexDirection: 'row', gap: 6, marginBottom: 4 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText:   { fontSize: 10, fontWeight: '700' },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardSub:      { fontSize: 12, color: '#64748b', marginTop: 3 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price:        { fontSize: 14, fontWeight: '800', color: BRAND },
  meta:         { fontSize: 11, color: '#64748b' },
})
