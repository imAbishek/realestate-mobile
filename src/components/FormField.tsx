import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props extends TextInputProps {
  label: string
  error?: string
}

export function FormField({ label, error, style, secureTextEntry, ...rest }: Props) {
  // For password fields, start hidden and let the eye icon toggle visibility (item 9).
  const isPassword = !!secureTextEntry
  const [hidden, setHidden] = useState(true)

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          {...rest}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          placeholderTextColor="#94a3b8"
          style={[styles.input, isPassword ? styles.inputWithIcon : null, error ? styles.inputError : null, style]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden(h => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.eyeBtn}
          >
            <Ionicons name={hidden ? 'eye-off' : 'eye'} size={20} color="#64748b" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap:          { marginBottom: 14 },
  label:         { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  inputRow:      { position: 'relative', justifyContent: 'center' },
  input:         { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#fff' },
  inputWithIcon: { paddingRight: 44 },
  inputError:    { borderColor: '#dc2626' },
  eyeBtn:        { position: 'absolute', right: 10, padding: 4 },
  error:         { fontSize: 12, color: '#dc2626', marginTop: 4 },
})
