import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { propertyApi } from '../../src/lib/api'
import { useLocationStore } from '../../src/store/locationStore'
import type { ListingType, PriceUnit, PropertyCard, SearchParams } from '../../src/types'

const BRAND = '#185FA5'
const ACCENT = '#D85A30'

const TYPE_TABS: { key: ListingType | 'ALL'; label: string }[] = [
  { key: 'ALL',  label: 'All'  },
  { key: 'SALE', label: 'Buy'  },
  { key: 'RENT', label: 'Rent' },
  { key: 'PG',   label: 'PG'   },
]

export default function SearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ listingType?: string; q?: string }>()
  const initial = TYPE_TABS.find((t) => t.key === params.listingType)?.key ?? 'ALL'

  const city = useLocationStore((s) => s.city)
  const [active, setActive] = useState<typeof TYPE_TABS[number]['key']>(initial)
  const [keyword, setKeyword] = useState(params.q ?? '')
  // Submitted keyword — sent to the server so matches beyond the fetched page are found
  // (the old client-only filter silently missed anything past the first 30 results).
  const [query, setQuery] = useState(params.q ?? '')
  const [items, setItems] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const apiParams: SearchParams = { citySlug: city.slug, page: 0, size: 30 }
      if (active !== 'ALL') apiParams.listingType = active
      if (query.trim()) apiParams.keyword = query.trim()
      const { data } = await propertyApi.search(apiParams)
      setItems(data.content)
    } catch { setItems([]) }
    finally { setLoading(false); setRefreshing(false) }
  }, [active, query, city.slug])

  useEffect(() => { setLoading(true); void load() }, [load])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{city.name} Listings</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => setQuery(keyword)}
          returnKeyType="search"
          placeholder="Search by title or locality"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        {query.trim() ? (
          <Pressable onPress={() => { setKeyword(''); setQuery('') }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      {/* Type tabs */}
      <View style={styles.tabRow}>
        {TYPE_TABS.map((t) => {
          const on = active === t.key
          return (
            <Pressable key={t.key} onPress={() => setActive(t.key)} style={[styles.tab, on && styles.tabActive]}>
              <Text style={[styles.tabText, on && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          )
        })}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={BRAND} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={BRAND} />}
          renderItem={({ item }) => <Row item={item} onPress={() => router.push(`/properties/${item.id}`)} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search" size={36} color="#cbd5e1" />
              <Text style={styles.empty}>No matches in {city.name} for this filter.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

function Row({ item, onPress }: { item: PropertyCard; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      {item.primaryImageUrl ? (
        <Image source={{ uri: item.primaryImageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}><Ionicons name="image-outline" size={28} color="#94a3b8" /></View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardBadgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.listingType}</Text></View>
          {item.isFeatured ? <View style={[styles.badge, { backgroundColor: ACCENT }]}><Text style={styles.badgeText}>Featured</Text></View> : null}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.cardLoc} numberOfLines={1}>{item.localityName}, {item.cityName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.cardPrice}>{formatPrice(item.price, item.priceUnit)}</Text>
          <Text style={styles.cardMeta}>{item.bedrooms ? `${item.bedrooms} BHK · ` : ''}{item.areaSqft} sqft</Text>
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
  safe:        { flex: 1, backgroundColor: '#f8fafc' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BRAND, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', padding: 0 },

  tabRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  tab:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#f1f5f9' },
  tabActive:   { backgroundColor: BRAND },
  tabText:     { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive:{ color: '#fff' },

  center:      { padding: 60, alignItems: 'center' },
  empty:       { fontSize: 13, color: '#64748b', marginTop: 10, textAlign: 'center' },

  card:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardImage:   { width: 110, height: 120, backgroundColor: '#e2e8f0' },
  noImage:     { alignItems: 'center', justifyContent: 'center' },
  cardBody:    { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardBadgeRow:{ flexDirection: 'row', gap: 6 },
  badge:       { backgroundColor: BRAND, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText:   { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLoc:     { fontSize: 12, color: '#64748b' },
  metaRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardPrice:   { fontSize: 14, fontWeight: '700', color: BRAND },
  cardMeta:    { fontSize: 11, color: '#64748b' },
})
