import type { TextStyle } from 'react-native'
import { colors } from './colors'

// Plus Jakarta Sans — loaded in app/_layout.tsx via @expo-google-fonts.
// NOTE: React Native does NOT map `fontWeight` onto custom-font variants — each
// weight is its own font family and must be named explicitly. Use `fonts.*`
// (or the presets below) instead of `fontWeight`.
export const fonts = {
  regular:  'PlusJakartaSans_400Regular',
  medium:   'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold:     'PlusJakartaSans_700Bold',
  extra:    'PlusJakartaSans_800ExtraBold',
  // Playfair Display — serif for DISPLAY slots only (hero headline, section
  // titles, stat values, header wordmark) per the Green Growth mock. Body/UI
  // text stays Jakarta Sans — serif below ~14px hurts mobile readability.
  display:     'PlayfairDisplay_700Bold',
  displaySemi: 'PlayfairDisplay_600SemiBold',
} as const

// Reusable text presets — size + family + line height, colour optional.
export const typography = {
  hero:    { fontFamily: fonts.display,  fontSize: 26, color: colors.white },
  h1:      { fontFamily: fonts.display,  fontSize: 22, color: colors.ink },
  h2:      { fontFamily: fonts.display,  fontSize: 20, color: colors.ink },
  title:   { fontFamily: fonts.bold,     fontSize: 16, color: colors.ink },
  body:    { fontFamily: fonts.regular,  fontSize: 14, color: colors.muted, lineHeight: 20 },
  label:   { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  caption: { fontFamily: fonts.medium,   fontSize: 12, color: colors.muted },
} satisfies Record<string, TextStyle>
