import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radius } from '../theme'

export type ChipOption<T extends string = string> = { label: string; value: T }

interface Props<T extends string = string> {
  label?: string
  options: ChipOption<T>[]
  value: T | null
  onChange: (v: T) => void
  wrap?: boolean
}

export function ChipRow<T extends string = string>({ label, options, value, onChange, wrap = true }: Props<T>) {
  const content = (
    <View style={wrap ? styles.wrapList : styles.row}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextOn]}>{opt.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {wrap ? content : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{content}</ScrollView>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap:      { marginBottom: 14 },
  label:     { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  wrapList:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row:       { flexDirection: 'row', gap: 8 },
  chip:      { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.white },
  chipOn:    { borderColor: colors.brand, backgroundColor: colors.brandTint },
  chipText:  { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  chipTextOn:{ fontFamily: fonts.bold, color: colors.brand },
})
