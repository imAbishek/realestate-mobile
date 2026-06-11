import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const BRAND = '#185FA5'
const ACCENT = '#D85A30'

export interface InfoSheetContent {
  icon?: React.ComponentProps<typeof Ionicons>['name']
  title: string
  body: string
  /** Optional secondary action under the body (e.g. deep-link to a live feature). */
  actionLabel?: string
  onAction?: () => void
}

/**
 * Branded bottom sheet for "coming soon" / informational messages —
 * replaces the bare Alert.alert boxes with the app's sheet style
 * (same look as CityPickerSheet).
 */
export function InfoSheet({
  visible, onClose, icon = 'rocket-outline', title, body, actionLabel, onAction,
}: InfoSheetContent & { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={26} color={ACCENT} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <View style={styles.accentBar} />
        <Text style={styles.body}>{body}</Text>

        {actionLabel && onAction ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { onClose(); onAction() }}>
            <Text style={styles.secondaryBtnText}>{actionLabel}</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={onClose}>
          <Text style={styles.primaryBtnText}>Got it</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, alignItems: 'center' },
  handle:       { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 18 },

  iconWrap:     { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff3ec', borderWidth: 1, borderColor: '#f6cdb9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:        { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  accentBar:    { width: 36, height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 8, marginBottom: 10 },
  body:         { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21, marginBottom: 20, paddingHorizontal: 8 },

  secondaryBtn: { alignSelf: 'stretch', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  secondaryBtnText: { color: BRAND, fontWeight: '700', fontSize: 14 },
  primaryBtn:   { alignSelf: 'stretch', borderRadius: 12, backgroundColor: BRAND, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
