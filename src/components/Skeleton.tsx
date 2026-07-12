import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius, shadow } from '../theme'

/** Pulsing placeholder block — the shimmer primitive for loading states. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.45)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[styles.block, style, { opacity }]} />
}

/** Row-card skeleton matching the list cards on Search / Saved / My Listings / Bookings. */
export function CardRowSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.image} />
      <View style={styles.body}>
        <Skeleton style={{ width: 70, height: 16 }} />
        <Skeleton style={{ width: '85%', height: 14 }} />
        <Skeleton style={{ width: '60%', height: 12 }} />
        <Skeleton style={{ width: '45%', height: 14 }} />
      </View>
    </View>
  )
}

/** A padded column of row-card skeletons — drop-in for a loading FlatList. */
export function ListSkeleton({ count = 5, padded = true }: { count?: number; padded?: boolean }) {
  return (
    <View style={padded ? styles.list : undefined}>
      {Array.from({ length: count }, (_, i) => <CardRowSkeleton key={i} />)}
    </View>
  )
}

/** Property-detail skeleton: hero image block + title/price/meta lines. */
export function DetailSkeleton() {
  return (
    <View>
      <Skeleton style={{ width: '100%', height: 280, borderRadius: 0 }} />
      <View style={styles.detailBody}>
        <Skeleton style={{ width: '55%', height: 22 }} />
        <Skeleton style={{ width: '80%', height: 16 }} />
        <Skeleton style={{ width: '65%', height: 13 }} />
        <View style={styles.detailChips}>
          <Skeleton style={styles.chip} />
          <Skeleton style={styles.chip} />
          <Skeleton style={styles.chip} />
        </View>
        <Skeleton style={{ width: '100%', height: 90, borderRadius: radius.md }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border, borderRadius: 4 },
  list:  { padding: 16 },
  card:  {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md,
    marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden', ...shadow.card,
  },
  image: { width: 110, height: 120, borderRadius: 0 },
  body:  { flex: 1, padding: 12, gap: 8 },
  detailBody:  { padding: 16, gap: 10 },
  detailChips: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  chip: { width: 84, height: 34, borderRadius: radius.md },
})
