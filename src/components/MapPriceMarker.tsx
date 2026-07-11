import { memo, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Marker } from 'react-native-maps'
import { formatPricePill } from '../lib/format'
import { colors, fonts } from '../theme'
import type { PropertyCard } from '../types'

const BRAND  = colors.brand
const ACCENT = colors.accent

interface Props {
  item: PropertyCard
  selected: boolean
  /** Changes when the map screen refocuses — forces a re-rasterise. */
  refresh: number
  onPress: (item: PropertyCard) => void
}

/**
 * Custom price-pill map marker (₹-bubble + tail). Brand colour by default,
 * accent for featured; the selected marker pops larger and lifts its z-index.
 *
 * `tracksViewChanges` must be true for the custom child to rasterise, but
 * leaving it on tanks frame-rate with many markers — so we keep it true only
 * briefly after mount and whenever `selected` flips, then switch it off.
 */
function MapPriceMarkerBase({ item, selected, refresh, onPress }: Props) {
  const tone = item.isFeatured ? ACCENT : BRAND
  const [tracks, setTracks] = useState(true)

  useEffect(() => {
    setTracks(true)
    const t = setTimeout(() => setTracks(false), 500)
    return () => clearTimeout(t)
  }, [selected, refresh])

  return (
    <Marker
      coordinate={{ latitude: item.latitude as number, longitude: item.longitude as number }}
      onPress={(e) => { e.stopPropagation?.(); onPress(item) }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracks}
      zIndex={selected ? 999 : 1}
    >
      <View style={styles.wrap}>
        <View style={[styles.pill, { backgroundColor: tone }, selected && styles.pillSelected]}>
          <Text style={[styles.pillText, selected && styles.pillTextSelected]} numberOfLines={1}>
            {formatPricePill(item.price, item.priceUnit)}
          </Text>
        </View>
        <View style={[styles.tail, { borderTopColor: tone }, selected && styles.tailSelected]} />
      </View>
    </Marker>
  )
}

export const MapPriceMarker = memo(MapPriceMarkerBase)

const styles = StyleSheet.create({
  // The selected marker grows via real layout (padding/font/tail), NOT a
  // transform — react-native-maps rasterises only the layout box, so a scaled
  // transform clips the overflowing tail. Bigger layout keeps the tail intact.
  wrap:         { alignItems: 'center' },
  pill: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1.5, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 4,
  },
  pillSelected:     { paddingHorizontal: 12, paddingVertical: 5 },
  pillText:         { color: '#fff', fontFamily: fonts.extra, fontSize: 12 },
  pillTextSelected: { fontSize: 14 },
  tail: {
    width: 0, height: 0, marginTop: -1,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  tailSelected: { borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8 },
})
