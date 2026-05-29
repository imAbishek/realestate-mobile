import { useCallback, useState } from 'react'
import {
  ActivityIndicator, Image, Pressable, StyleSheet, Text, View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { propertyApi } from '../../src/lib/api'
import type { PriceUnit, PropertyCard } from '../../src/types'

const BRAND  = '#185FA5'
const ACCENT = '#D85A30'

// Coimbatore city center — the only district currently seeded.
const COIMBATORE: Region = {
  latitude: 11.0168,
  longitude: 76.9558,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
}

export default function MapScreen() {
  const router = useRouter()
  const [items, setItems] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PropertyCard | null>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await propertyApi.search({ citySlug: 'coimbatore', size: 100 })
      // Only listings with real coordinates can be plotted.
      setItems(data.content.filter((p) => p.latitude != null && p.longitude != null))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map View</Text>
        <Text style={styles.headerCount}>
          {loading ? '…' : `${items.length} on map`}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={COIMBATORE}
          onPress={() => setSelected(null)}
        >
          {items.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude as number, longitude: p.longitude as number }}
              pinColor={p.isFeatured ? ACCENT : BRAND}
              onPress={(e) => { e.stopPropagation?.(); setSelected(p) }}
            />
          ))}
        </MapView>

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={BRAND} />
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyOverlay} pointerEvents="none">
            <View style={styles.emptyCard}>
              <Ionicons name="map-outline" size={28} color="#94a3b8" />
              <Text style={styles.emptyText}>No mapped listings in Coimbatore yet</Text>
            </View>
          </View>
        ) : null}

        {selected ? (
          <PreviewCard
            item={selected}
            onClose={() => setSelected(null)}
            onOpen={() => router.push(`/properties/${selected.id}`)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  )
}

function PreviewCard({
  item, onClose, onOpen,
}: {
  item: PropertyCard; onClose: () => void; onOpen: () => void
}) {
  return (
    <View style={styles.previewWrap}>
      <Pressable onPress={onOpen} style={styles.preview}>
        <View style={styles.previewThumbWrap}>
          {item.primaryImageUrl ? (
            <Image source={{ uri: item.primaryImageUrl }} style={styles.previewThumb} />
          ) : (
            <View style={[styles.previewThumb, styles.previewThumbEmpty]}>
              <Ionicons name="image-outline" size={22} color="#94a3b8" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.previewTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.previewSub} numberOfLines={1}>
              {item.localityName}, {item.cityName}
            </Text>
          </View>
          <View style={styles.previewFooter}>
            <Text style={styles.previewPrice}>{formatPrice(item.price, item.priceUnit)}</Text>
            <Text style={styles.previewMeta}>
              {item.bedrooms != null ? `${item.bedrooms} BHK · ` : ''}{item.areaSqft} sqft
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable onPress={onClose} hitSlop={8} style={styles.previewClose}>
        <Ionicons name="close" size={18} color="#0f172a" />
      </Pressable>
    </View>
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
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerCount: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  mapWrap:     { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,250,252,0.6)' },
  emptyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  emptyCard:   { alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  emptyText:   { fontSize: 13, color: '#64748b', fontWeight: '500' },

  previewWrap: { position: 'absolute', left: 12, right: 12, bottom: 16 },
  preview:     { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  previewThumbWrap: { width: 110, height: 100, backgroundColor: '#e2e8f0' },
  previewThumb: { width: '100%', height: '100%' },
  previewThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  previewSub:  { fontSize: 12, color: '#64748b', marginTop: 3 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  previewPrice: { fontSize: 14, fontWeight: '800', color: BRAND },
  previewMeta: { fontSize: 11, color: '#64748b' },
  previewClose: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },
})
