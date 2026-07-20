import { forwardRef } from 'react'
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { Text } from './Text'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '../lib/format'
import { colors, fonts, radius, shadow } from '../theme'
import type { PropertyCard } from '../types'

const BRAND  = colors.brand
const ACCENT = colors.accent

const { width: SCREEN_W } = Dimensions.get('window')
export const CARD_W = SCREEN_W - 48          // peek the neighbours on both sides
export const CARD_GAP = 12
export const SNAP = CARD_W + CARD_GAP

interface Props {
  items: PropertyCard[]
  onOpen: (item: PropertyCard) => void
  onSnap: (item: PropertyCard) => void
}

/**
 * Bottom horizontal card carousel, synced both ways with the map markers:
 * - parent drives it via the forwarded ref (`scrollToIndex`) when a marker is tapped;
 * - swiping fires `onSnap` so the parent can pan/select the matching marker.
 */
export const MapPropertyCarousel = forwardRef<FlatList<PropertyCard>, Props>(
  function MapPropertyCarousel({ items, onOpen, onSnap }, ref) {
    const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP)
      const item = items[idx]
      if (item) onSnap(item)
    }

    return (
      <FlatList
        ref={ref}
        data={items}
        keyExtractor={(p) => p.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        onMomentumScrollEnd={onMomentumEnd}
        // Fixed-width cards → cheap, accurate scrollToIndex from the parent.
        getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
        renderItem={({ item }) => <Card item={item} onOpen={onOpen} />}
      />
    )
  },
)

function Card({ item, onOpen }: { item: PropertyCard; onOpen: (item: PropertyCard) => void }) {
  return (
    <Pressable style={styles.card} onPress={() => onOpen(item)}>
      <View style={styles.thumbWrap}>
        {item.primaryImageUrl ? (
          <Image source={{ uri: item.primaryImageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="image-outline" size={22} color={colors.mutedLight} />
          </View>
        )}
        {item.isFeatured ? (
          <View style={styles.badge}><Text style={styles.badgeText}>Featured</Text></View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{item.localityName}, {item.cityName}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(item.price, item.priceUnit)}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.bedrooms != null ? `${item.bedrooms} BHK · ` : ''}{item.areaSqft} sqft
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list:      { paddingHorizontal: 24 },
  card: {
    width: CARD_W, flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden',
    ...shadow.raised,
  },
  thumbWrap: { width: 120, height: 116, backgroundColor: colors.border },
  thumb:     { width: '100%', height: '100%' },
  thumbEmpty:{ alignItems: 'center', justifyContent: 'center' },
  badge:     { position: 'absolute', top: 8, left: 8, backgroundColor: ACCENT, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#fff', fontFamily: fonts.extra, fontSize: 10 },
  body:      { flex: 1, padding: 12, justifyContent: 'space-between' },
  title:     { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  sub:       { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 3 },
  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price:     { fontFamily: fonts.extra, fontSize: 15, color: BRAND },
  meta:      { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, flexShrink: 1, textAlign: 'right', marginLeft: 8 },
})
