import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

interface Props {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'accent'
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary' }: Props) {
  const bg = variant === 'accent' ? '#D85A30' : '#185FA5'
  const off = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: off ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn:  { borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
