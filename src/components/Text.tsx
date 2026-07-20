import { forwardRef } from 'react'
import {
  StyleSheet,
  Text as RNText, TextInput as RNTextInput,
  type TextInputProps, type TextProps,
} from 'react-native'

/**
 * App-wide Text / TextInput.
 *
 * Android reserves extra top/bottom space inside every text box based on the
 * font's declared ascent/descent (`includeFontPadding`, on by default). Plus
 * Jakarta Sans and Playfair Display both declare *asymmetric* metrics, so that
 * padding is uneven — the glyphs' optical centre ends up above the box's centre.
 * Anything relying on `alignItems: 'center'` (icon + label rows, pills, the
 * stack header title) then looks a few pixels off, and small containers get
 * mysterious extra height.
 *
 * Turning it off per style was losing ground — 204 text styles across 28 files,
 * 7 of them patched one at a time as somebody noticed. Import Text/TextInput
 * from here instead of react-native and it is handled once, including for
 * screens nobody has written yet.
 *
 * `includeFontPadding` is Android-only; iOS ignores it. Set an explicit
 * `lineHeight` when you need a precise text box — turning the padding off
 * removes the slack that was silently absorbing tall glyphs.
 */
const styles = StyleSheet.create({
  base: { includeFontPadding: false },
})

export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={[styles.base, style]} />
})

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...props }, ref) {
  return <RNTextInput ref={ref} {...props} style={[styles.base, style]} />
})
