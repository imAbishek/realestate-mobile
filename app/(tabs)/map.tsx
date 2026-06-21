import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { propertyApi } from '../../src/lib/api'
import { useLocationStore } from '../../src/store/locationStore'
import { MapPriceMarker } from '../../src/components/MapPriceMarker'
import { MapPropertyCarousel, SNAP } from '../../src/components/MapPropertyCarousel'
import type { PropertyCard, PropertyType } from '../../src/types'

const BRAND = '#185FA5'

// Coimbatore city center — the only district currently seeded.
const COIMBATORE: Region = {
  latitude: 11.0168,
  longitude: 76.9558,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
}

// Category chips → the property types each one keeps. `null` = show everything.
const CATEGORIES: { label: string; types: PropertyType[] | null }[] = [
  { label: 'All',        types: null },
  { label: 'Plots',      types: ['PLOT'] },
  { label: 'Agri Land',  types: ['AGRICULTURAL_LAND'] },
  { label: 'Apartments', types: ['APARTMENT', 'BUILDER_FLOOR'] },
  { label: 'Houses',     types: ['INDEPENDENT_HOUSE', 'VILLA'] },
  { label: 'Commercial', types: ['COMMERCIAL_OFFICE', 'COMMERCIAL_SHOP'] },
  { label: 'PG',         types: ['PG_HOSTEL'] },
]

export default function MapScreen() {
  const router = useRouter()
  const city = useLocationStore((s) => s.city)

  const [items, setItems] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const mapRef = useRef<MapView>(null)
  const listRef = useRef<FlatList<PropertyCard>>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await propertyApi.search({ citySlug: city.slug, size: 100 })
      // Only listings with real coordinates can be plotted.
      setItems(data.content.filter((p) => p.latitude != null && p.longitude != null))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [city.slug])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // Visible set = category filter + locality/title text search. Recomputed
  // together so markers and carousel always stay in lock-step.
  const visible = useMemo(() => {
    const types = CATEGORIES[category].types
    const q = query.trim().toLowerCase()
    return items.filter((p) => {
      if (types && !types.includes(p.propertyType)) return false
      if (q && !`${p.localityName} ${p.cityName} ${p.title}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, category, query])

  const selectAt = useCallback((item: PropertyCard) => {
    setSelectedId(item.id)
    mapRef.current?.animateToRegion({
      latitude: item.latitude as number,
      longitude: item.longitude as number,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 250)
  }, [])

  // Marker tap → select + scroll the carousel to its card.
  const onMarkerPress = useCallback((item: PropertyCard) => {
    setSelectedId(item.id)
    const idx = visible.findIndex((p) => p.id === item.id)
    if (idx >= 0) listRef.current?.scrollToOffset({ offset: idx * SNAP, animated: true })
  }, [visible])

  const resetSelection = () => setSelectedId(null)
  const changeCategory = (i: number) => { setCategory(i); setSelectedId(null) }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={COIMBATORE}
          mapType="hybrid"
          onPress={resetSelection}
          showsMyLocationButton={false}
        >
          {visible.map((p) => (
            <MapPriceMarker
              key={p.id}
              item={p}
              selected={p.id === selectedId}
              onPress={onMarkerPress}
            />
          ))}
        </MapView>

        {/* Top overlay: search field + filter button, then category chips */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <Ionicons name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search localities in ${city.name}`}
                placeholderTextColor="#94a3b8"
                value={query}
                onChangeText={(t) => { setQuery(t); setSelectedId(null) }}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>
            <Pressable style={styles.filterBtn} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="options-outline" size={20} color="#fff" />
            </Pressable>
          </View>

          <FlatList
            data={CATEGORIES}
            keyExtractor={(c) => c.label}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item, index }) => {
              const on = index === category
              return (
                <Pressable
                  onPress={() => changeCategory(index)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.label}</Text>
                </Pressable>
              )
            }}
          />
        </View>

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={BRAND} />
          </View>
        ) : null}

        {!loading && visible.length === 0 ? (
          <View style={styles.emptyOverlay} pointerEvents="none">
            <View style={styles.emptyCard}>
              <Ionicons name="map-outline" size={28} color="#94a3b8" />
              <Text style={styles.emptyText}>
                {items.length === 0
                  ? `No mapped listings in ${city.name} yet`
                  : 'No listings match these filters'}
              </Text>
            </View>
          </View>
        ) : null}

        {!loading && visible.length > 0 ? (
          <View style={styles.carouselWrap} pointerEvents="box-none">
            <MapPropertyCarousel
              ref={listRef}
              items={visible}
              onOpen={(p) => router.push(`/properties/${p.id}`)}
              onSnap={selectAt}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#f8fafc' },
  mapWrap: { flex: 1 },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 10 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },

  chipsRow: { paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  chipOn:     { backgroundColor: BRAND },
  chipText:   { fontSize: 13, color: '#334155', fontWeight: '600' },
  chipTextOn: { color: '#fff', fontWeight: '700' },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,250,252,0.6)' },
  emptyOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  emptyCard:      { alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  emptyText:      { fontSize: 13, color: '#64748b', fontWeight: '500' },

  carouselWrap: { position: 'absolute', left: 0, right: 0, bottom: 84 },
})
