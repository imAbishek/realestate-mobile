import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, fonts, radius, shadow } from '../theme'

interface Props {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'accent'
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary' }: Props) {
  const bg = variant === 'accent' ? colors.accent : colors.brand
  const off = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        shadow.cta,
        { backgroundColor: bg, opacity: off ? 0.6 : pressed ? 0.9 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn:  { borderRadius: radius.sm, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.2 },
})
