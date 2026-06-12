import { useEffect, useRef } from 'react'
import {
  Animated, Modal, PanResponder, Pressable, StyleSheet, View, type ViewStyle,
} from 'react-native'

/**
 * Bottom sheet that can be flicked/dragged down to dismiss — the behaviour every
 * picker-style sheet should share. Wraps a transparent slide-up Modal; a grabber
 * region at the top owns the pan gesture so inner buttons/scrolls stay tappable.
 * Children supply the sheet body (the white rounded container + handle are provided).
 */
export function DraggableSheet({
  visible, onClose, children, contentStyle,
}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  contentStyle?: ViewStyle
}) {
  const translateY = useRef(new Animated.Value(0)).current
  // Keep the latest onClose so the once-created PanResponder never calls a stale one.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => { if (visible) translateY.setValue(0) }, [visible, translateY])

  const pan = useRef(
    PanResponder.create({
      // Only claim the gesture for a downward drag (lets horizontal/tap pass through).
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy) },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 0.8) {
          Animated.timing(translateY, { toValue: 700, duration: 180, useNativeDriver: true })
            .start(() => onCloseRef.current())
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start()
        }
      },
    }),
  ).current

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, contentStyle, { transform: [{ translateY }] }]}>
        <View {...pan.panHandlers} style={styles.grabber}>
          <View style={styles.handle} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 32 },
  grabber:  { alignSelf: 'stretch', alignItems: 'center', paddingTop: 12, paddingBottom: 6, marginHorizontal: -20 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0' },
})
