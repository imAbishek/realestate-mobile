// Guard: Text / TextInput must come from src/components/Text.tsx, never from
// react-native directly.
//
// Android's `includeFontPadding` is on by default and reserves uneven top/bottom
// space for Plus Jakarta Sans and Playfair Display (both declare asymmetric
// metrics), so raw react-native Text sits a few pixels above the optical centre
// of any row it's aligned in. The wrapper turns it off once. This check exists
// because the previous approach — patching styles one at a time as someone
// noticed — lost ground: 204 text styles, 7 patched.
//
// Run: node scripts/check-text-imports.mjs   (also runs in CI)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOTS = ['app', 'src']
const ALLOWED = 'src/components/Text.tsx'
const RN_IMPORT = /import\s*\{([^}]*)\}\s*from\s*'react-native'/g

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : []
  })
}

const offenders = []
for (const file of ROOTS.flatMap(walk)) {
  if (relative('.', file) === ALLOWED) continue
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(RN_IMPORT)) {
    const names = m[1].split(',').map((n) => n.trim())
    const bad = names.filter((n) => n === 'Text' || n === 'TextInput')
    if (bad.length) offenders.push(`${file}: ${bad.join(', ')}`)
  }
}

if (offenders.length) {
  console.error(
    `\n✖ ${offenders.length} file(s) import Text/TextInput from react-native:\n` +
    offenders.map((o) => `    ${o}`).join('\n') +
    `\n\n  Import from ${ALLOWED} instead — it disables Android's uneven` +
    `\n  includeFontPadding so text centres correctly against icons.\n`,
  )
  process.exit(1)
}
console.log('✓ Text/TextInput imports all route through the shared wrapper')
