// Centralized colour tokens — single source of truth for the app's palette.
// Previously each screen re-declared `const BRAND = '#185FA5'` inline; import
// from here instead so the brand aesthetic stays consistent everywhere.
export const colors = {
  // Brand
  brand:      '#185FA5',
  brandDark:  '#0e447a',
  brandTint:  '#eff4fb',
  accent:     '#D85A30',

  // Text
  ink:        '#0f172a',
  muted:      '#64748b',
  mutedLight: '#94a3b8',

  // Surfaces & borders
  bg:         '#f8fafc',
  white:      '#fff',
  border:     '#e2e8f0',
  borderLight:'#eef2f7',

  // Semantic (already used across status badges / forms)
  success:    '#16a34a',
  warning:    '#b45309',
  danger:     '#dc2626',
} as const

// Hero gradient — used as the fallback backdrop when no listing photos exist.
export const heroGradient = ['#1c6cba', '#15589c', '#0e447a'] as const

export type ColorToken = keyof typeof colors
