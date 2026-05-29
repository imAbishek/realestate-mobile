import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'

interface Props extends TextInputProps {
  label: string
  error?: string
}

export function FormField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor="#94a3b8"
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap:       { marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input:      { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#fff' },
  inputError: { borderColor: '#dc2626' },
  error:      { fontSize: 12, color: '#dc2626', marginTop: 4 },
})
