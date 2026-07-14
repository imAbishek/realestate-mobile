import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { colors, fonts, radius, shadow } from '../../src/theme'
import type { PropertyCard, PropertyType } from '../../src/types'

const BRAND = colors.brand

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
  // Bumped on every focus so markers re-rasterise (tracksViewChanges) — without
  // it, returning to the tab leaves the first price marker blank until scrolled.
  const [focusEpoch, setFocusEpoch] = useState(0)
  // Markers are gated on this: react-native-maps only rasterises a custom
  // marker's child while tracksViewChanges is true, and that capture is blank
  // if it runs before the map's GL surface exists. Mounting markers only AFTER
  // onMapReady guarantees every capture (initial + re-key remount) lands on a
  // live surface — the deterministic fix the timer/epoch attempts kept missing.
  const [mapReady, setMapReady] = useState(false)

  const mapRef = useRef<MapView>(null)
  const listRef = useRef<FlatList<PropertyCard>>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await propertyApi.search({ citySlug: city.slug, size: 100 })
      // Only listings with real coordinates can be plotted.
      const mapped = data.content.filter((p) => p.latitude != null && p.longitude != null)
      setItems(mapped)
      // Highlight the first (carousel-visible) listing on load so it's selected
      // without needing a scroll; keep any existing selection on refocus.
      setSelectedId((prev) => prev ?? mapped[0]?.id ?? null)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [city.slug])

  useFocusEffect(useCallback(() => {
    load()
    setFocusEpoch((e) => e + 1)
  }, [load]))

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

  // Draw the selected marker LAST — Android's Google Maps ignores marker zIndex
  // for custom views on overlap and paints in child order, so the active pill
  // would otherwise hide behind a neighbour at the same spot.
  const ordered = useMemo(() => {
    if (!selectedId) return visible
    const sel = visible.find((p) => p.id === selectedId)
    if (!sel) return visible
    return [...visible.filter((p) => p.id !== selectedId), sel]
  }, [visible, selectedId])

  // Keep the camera on the selected property. The auto-selection (first listing
  // on load, and the preserved selection on tab refocus) only sets selectedId —
  // it never moved the camera, so a selected marker sitting outside the default
  // Coimbatore viewport (many listings are well north/east of centre) showed no
  // pill until a carousel scroll finally panned to it. Runs on load, on every
  // selection change, and on refocus (items is a fresh array each load); a manual
  // pan changes none of these, so the user's own panning is never yanked back.
  useEffect(() => {
    if (!mapReady || !selectedId) return
    const sel = items.find((p) => p.id === selectedId)
    if (sel?.latitude == null || sel.longitude == null) return
    mapRef.current?.animateToRegion({
      latitude: sel.latitude,
      longitude: sel.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 300)
  }, [mapReady, selectedId, items])

  const selectAt = useCallback((item: PropertyCard) => setSelectedId(item.id), [])

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
          // GL surface is now ready: unblock marker rendering (so their first
          // rasterisation captures a real bitmap) and re-arm any that mounted.
          onMapReady={() => { setMapReady(true); setFocusEpoch((e) => e + 1) }}
          showsMyLocationButton={false}
        >
          {mapReady && ordered.map((p) => (
            <MapPriceMarker
              // Re-key the selected marker so it remounts → Android re-ADDS its
              // native marker (a plain array reorder is only a "move" and keeps
              // the old draw order, so zIndex/ordered-last alone left the active
              // pill hidden behind an overlapping neighbour).
              key={p.id === selectedId ? `${p.id}:sel` : p.id}
              item={p}
              selected={p.id === selectedId}
              refresh={focusEpoch}
              onPress={onMarkerPress}
            />
          ))}
        </MapView>

        {/* Top overlay: search field + filter button, then category chips */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search localities in ${city.name}`}
                placeholderTextColor={colors.mutedLight}
                value={query}
                onChangeText={(t) => { setQuery(t); setSelectedId(null) }}
                returnKeyType="search"
                numberOfLines={1}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.mutedLight} />
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
              <Ionicons name="map-outline" size={28} color={colors.mutedLight} />
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
  safe:    { flex: 1, backgroundColor: colors.bg },
  mapWrap: { flex: 1 },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 10 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 12, height: 44,
    ...shadow.raised,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.ink, paddingVertical: 0 },
  filterBtn: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
    ...shadow.raised,
  },

  chipsRow: { paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.92)',
    ...shadow.card,
  },
  chipOn:     { backgroundColor: BRAND },
  chipText:   { fontFamily: fonts.semibold, fontSize: 13, color: '#334155' },
  chipTextOn: { fontFamily: fonts.bold, color: '#fff' },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,250,252,0.6)' },
  emptyOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  emptyCard:      { alignItems: 'center', gap: 8, backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 16, borderRadius: radius.md, ...shadow.raised },
  emptyText:      { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },

  carouselWrap: { position: 'absolute', left: 0, right: 0, bottom: 84 },
})
