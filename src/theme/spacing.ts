import type { ViewStyle } from 'react-native'

// Spacing scale (4-pt rhythm) + corner-radius + elevation tokens.
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const

export const radius = {
  sm: 12, md: 16, lg: 18, xl: 24, pill: 999,
} as const

// Shadow tiers (iOS shadow* + Android elevation). Spread into a style object.
export const shadow = {
  card:   { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  raised: { shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cta:    { shadowColor: '#0f332f', shadowOpacity: 0.30, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
} satisfies Record<string, ViewStyle>
