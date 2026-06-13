import type { PriceUnit } from '../types'

/** Full price label, e.g. "₹1.25 Cr", "₹15.75 L", "₹18,000/mo". */
export function formatPrice(price: number, unit: PriceUnit): string {
  if (unit === 'PER_MONTH') return `₹${price.toLocaleString('en-IN')}/mo`
  if (unit === 'PER_SQFT')  return `₹${price.toLocaleString('en-IN')}/sqft`
  if (price >= 10_000_000)  return `₹${(price / 10_000_000).toFixed(2)} Cr`
  if (price >= 100_000)     return `₹${(price / 100_000).toFixed(2)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

/** Compact label for map price pills — trims trailing ".00" and the /mo·/sqft suffix. */
export function formatPricePill(price: number, unit: PriceUnit): string {
  if (unit === 'PER_MONTH') return `₹${compact(price)}/mo`
  if (unit === 'PER_SQFT')  return `₹${compact(price)}`
  return `₹${compact(price)}`
}

function compact(price: number): string {
  if (price >= 10_000_000) return `${strip(price / 10_000_000)} Cr`
  if (price >= 100_000)    return `${strip(price / 100_000)} L`
  if (price >= 1_000)      return `${strip(price / 1_000)} K`
  return price.toLocaleString('en-IN')
}

/** 15.75 → "15.75", 15.0 → "15". */
function strip(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '')
}
