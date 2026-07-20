import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { ListSkeleton } from '../../src/components/Skeleton'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { FilterSheet, activeFilterCount, type SearchFilters } from '../../src/components/FilterSheet'
import { propertyApi } from '../../src/lib/api'
import { useLocationStore } from '../../src/store/locationStore'
import { colors, fonts, radius, shadow } from '../../src/theme'
import type { ListingType, PriceUnit, PropertyCard, SearchParams } from '../../src/types'

const BRAND = colors.brand
const ACCENT = colors.accent
const HEADER_GRADIENT = ['#0f332f', '#184A45'] as const

const TYPE_TABS: { key: ListingType | 'ALL'; label: string }[] = [
  { key: 'ALL',  label: 'All'  },
  { key: 'SALE', label: 'Buy'  },
  { key: 'RENT', label: 'Rent' },
  { key: 'PG',   label: 'PG'   },
]

export default function SearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    listingType?: string; q?: string; propertyType?: string; propertyTypes?: string | string[]
    minPrice?: string; maxPrice?: string; minBedrooms?: string
  }>()
  const initial = TYPE_TABS.find((t) => t.key === params.listingType)?.key ?? 'ALL'

  const city = useLocationStore((s) => s.city)
  const [active, setActive] = useState<typeof TYPE_TABS[number]['key']>(initial)
  const [keyword, setKeyword] = useState(params.q ?? '')
  // Submitted keyword — sent to the server so matches beyond the fetched page are found
  // (the old client-only filter silently missed anything past the first 30 results).
  const [query, setQuery] = useState(params.q ?? '')
  // Everything except listing type (the tabs own that) — seeded from route params
  // so the home-screen filter button lands here with its selection applied.
  const [filters, setFilters] = useState<SearchFilters>({
    propertyType:  params.propertyType as SearchFilters['propertyType'],
    // Home's "Commercial" tile sends two types at once.
    propertyTypes: params.propertyTypes
      ? ([] as string[]).concat(params.propertyTypes) as SearchFilters['propertyTypes']
      : undefined,
    minPrice:     num(params.minPrice),
    maxPrice:     num(params.maxPrice),
    minBedrooms:  num(params.minBedrooms),
  })
  const [filterOpen, setFilterOpen] = useState(false)
  const filterCount = activeFilterCount({ ...filters, listingType: active === 'ALL' ? undefined : active })
  const [items, setItems] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const apiParams: SearchParams = { citySlug: city.slug, page: 0, size: 30, ...filters }
      if (active !== 'ALL') apiParams.listingType = active
      if (query.trim()) apiParams.keyword = query.trim()
      const { data } = await propertyApi.search(apiParams)
      setItems(data.content)
    } catch { setItems([]) }
    finally { setLoading(false); setRefreshing(false) }
  }, [active, query, city.slug, filters])

  useEffect(() => { setLoading(true); void load() }, [load])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{city.name} Listings</Text>
        <View style={{ width: 22 }} />
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.mutedLight} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => setQuery(keyword)}
          returnKeyType="search"
          placeholder="Search by title or locality"
          placeholderTextColor={colors.mutedLight}
          style={styles.searchInput}
        />
        {query.trim() ? (
          <Pressable onPress={() => { setKeyword(''); setQuery('') }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.mutedLight} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => setFilterOpen(true)} style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.85 }]} hitSlop={6}>
          <Ionicons name="options-outline" size={18} color="#fff" />
          {filterCount > 0 ? (
            <View style={styles.filterCount}><Text style={styles.filterCountText}>{filterCount}</Text></View>
          ) : null}
        </Pressable>
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
        <ListSkeleton />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={BRAND} />}
          renderItem={({ item }) => <Row item={item} onPress={() => router.push(`/properties/${item.id}`)} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIcon}><Ionicons name="search" size={34} color={colors.brand} /></View>
              <Text style={styles.empty}>No matches in {city.name} for this filter.</Text>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={{ ...filters, listingType: active === 'ALL' ? undefined : active }}
        onApply={({ listingType, ...rest }) => { setActive(listingType ?? 'ALL'); setFilters(rest) }}
      />
    </SafeAreaView>
  )
}

/** Route params arrive as strings; drop anything non-numeric. */
function num(v?: string): number | undefined {
  const n = Number(v)
  return v && Number.isFinite(n) ? n : undefined
}

function Row({ item, onPress }: { item: PropertyCard; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      {item.primaryImageUrl ? (
        <Image source={{ uri: item.primaryImageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}><Ionicons name="image-outline" size={28} color={colors.mutedLight} /></View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardBadgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.listingType}</Text></View>
          {item.isFeatured ? <View style={[styles.badge, { backgroundColor: ACCENT }]}><Text style={styles.badgeText}>Featured</Text></View> : null}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={12} color={colors.muted} />
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
  safe:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#fff' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, margin: 16, marginBottom: 8, borderRadius: radius.md, paddingHorizontal: 10, paddingLeft: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.ink, padding: 0 },
  filterBtn:   { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  filterCount: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontFamily: fonts.bold, fontSize: 9, lineHeight: 12, color: BRAND },

  tabRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  tab:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: '#f1f5f9' },
  tabActive:   { backgroundColor: BRAND },
  tabText:     { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  tabTextActive:{ fontFamily: fonts.bold, color: '#fff' },

  center:      { padding: 60, alignItems: 'center' },
  emptyIcon:   { width: 84, height: 84, borderRadius: 42, backgroundColor: '#e6ece1', alignItems: 'center', justifyContent: 'center' },
  empty:       { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 12, textAlign: 'center' },

  card:        { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', ...shadow.card },
  cardImage:   { width: 110, height: 120, backgroundColor: colors.border },
  noImage:     { alignItems: 'center', justifyContent: 'center' },
  cardBody:    { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardBadgeRow:{ flexDirection: 'row', gap: 6 },
  badge:       { backgroundColor: BRAND, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, justifyContent: 'center' },
  badgeText:   { color: '#fff', fontFamily: fonts.bold, fontSize: 10, lineHeight: 13 },
  cardTitle:   { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginTop: 4 },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLoc:     { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  metaRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardPrice:   { fontFamily: fonts.extra, fontSize: 15, color: BRAND },
  cardMeta:    { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
})
