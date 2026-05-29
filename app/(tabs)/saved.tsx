import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { favoritesApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import type { PropertyCard } from '../../src/types'

const BRAND  = '#185FA5'
const ACCENT = '#D85A30'

export default function SavedScreen() {
  const router = useRouter()
  const { isLoggedIn, hydrated } = useAuthStore()

  const [items, setItems] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!isLoggedIn) { setItems([]); setLoading(false); return }
    try {
      const { data } = await favoritesApi.listMine(0, 50)
      setItems(data.content)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isLoggedIn])

  // Refresh every time the tab gains focus — favorites can change from the detail screen
  useFocusEffect(useCallback(() => { setLoading(true); load() }, [load]))
  useEffect(() => { if (hydrated) load() }, [hydrated, load])

  const onRefresh = () => { setRefreshing(true); load() }

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
          <Ionicons name="heart-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Sign in to see saved properties</Text>
          <Text style={styles.emptySub}>Save listings you like and find them all in one place.</Text>
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
          <Ionicons name="heart-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No saved properties yet</Text>
          <Text style={styles.emptySub}>Tap the heart on any listing to save it for later.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header count={items.length} />
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
        renderItem={({ item }) => (
          <SavedCard item={item} onPress={() => router.push(`/properties/${item.id}`)} />
        )}
      />
    </SafeAreaView>
  )
}

function Header({ count }: { count?: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Saved Properties</Text>
      {count != null && <Text style={styles.headerCount}>{count} saved</Text>}
    </View>
  )
}

function SavedCard({ item, onPress }: { item: PropertyCard; onPress: () => void }) {
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
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {item.localityName}, {item.cityName}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatPrice(item.price, item.priceUnit)}</Text>
          <Text style={styles.meta}>
            {item.bedrooms != null ? `${item.bedrooms} BHK · ` : ''}{item.areaSqft} sqft
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

function formatPrice(price: number, unit: string): string {
  if (unit === 'PER_MONTH') return `₹${price.toLocaleString('en-IN')}/mo`
  if (unit === 'PER_SQFT')  return `₹${price.toLocaleString('en-IN')}/sqft`
  if (price >= 10_000_000)  return `₹${(price / 10_000_000).toFixed(2)} Cr`
  if (price >= 100_000)     return `₹${(price / 100_000).toFixed(2)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f8fafc' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerCount:  { fontSize: 12, color: '#64748b', fontWeight: '600' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  emptySub:     { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', lineHeight: 19 },
  cta:          { marginTop: 18, backgroundColor: ACCENT, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  ctaText:      { color: '#fff', fontWeight: '700', fontSize: 14 },

  card:         { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  thumbWrap:    { width: 110, height: 100, backgroundColor: '#e2e8f0' },
  thumb:        { width: '100%', height: '100%' },
  thumbEmpty:   { alignItems: 'center', justifyContent: 'center' },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardSub:      { fontSize: 12, color: '#64748b', marginTop: 3 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price:        { fontSize: 14, fontWeight: '800', color: BRAND },
  meta:         { fontSize: 11, color: '#64748b' },
})
