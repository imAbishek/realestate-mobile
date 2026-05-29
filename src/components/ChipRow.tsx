import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

const BRAND = '#185FA5'

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
  label:     { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  wrapList:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row:       { flexDirection: 'row', gap: 8 },
  chip:      { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  chipOn:    { borderColor: BRAND, backgroundColor: '#eff4fb' },
  chipText:  { fontSize: 13, color: '#334155', fontWeight: '500' },
  chipTextOn:{ color: BRAND, fontWeight: '700' },
})
