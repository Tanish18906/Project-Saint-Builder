#!/usr/bin/env node
// Verifies WCAG contrast for every foreground/background pairing the design
// system promises (DESIGN_SYSTEM.md §3). Reads the primitive values straight
// from src/app/globals.css so it cannot drift from the real tokens.
//
//   node scripts/check-contrast.mjs        # exit 1 if any pair fails
//
// When you add a semantic token that carries text or a non-text signal, add
// its pairing here.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8')

const P = {}
for (const [, name, hex] of css.matchAll(/--p-([a-z]+-\d+):\s*(#[0-9a-fA-F]{6})/g)) P[name] = hex

const lum = (hex) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const TEXT = 4.5 // WCAG 1.4.3 normal text
const UI = 3 // WCAG 1.4.11 non-text (control borders, focus ring, stripes, dots)

// [foreground primitive, background primitive, minimum, what it is]
const pairs = [
  ['neutral-900', 'neutral-0', TEXT, 'fg on panel'],
  ['neutral-900', 'neutral-50', TEXT, 'fg on canvas'],
  ['neutral-900', 'ink-50', TEXT, 'fg on selected row'],
  ['neutral-600', 'neutral-0', TEXT, 'fg-muted on panel'],
  ['neutral-600', 'neutral-50', TEXT, 'fg-muted on canvas'],
  ['neutral-600', 'neutral-100', TEXT, 'fg-muted on sunken / hover'],
  ['neutral-500', 'neutral-0', TEXT, 'fg-subtle on panel'],
  ['neutral-500', 'neutral-50', TEXT, 'fg-subtle on canvas'],
  ['neutral-500', 'ink-50', TEXT, 'fg-subtle on selected row'],
  ['neutral-500', 'neutral-0', UI, 'line-control on panel'],
  ['neutral-500', 'neutral-50', UI, 'line-control on canvas'],
  ['ink-500', 'neutral-0', UI, 'focus ring on panel'],
  ['ink-500', 'neutral-50', UI, 'focus ring on canvas'],
  ['neutral-0', 'ink-600', TEXT, 'fg-on-accent on accent'],
  ['neutral-0', 'ink-700', TEXT, 'fg-on-accent on accent-hover'],
  ['ink-700', 'neutral-0', TEXT, 'accent-fg (links) on panel'],
  ['ink-700', 'ink-50', TEXT, 'accent-fg on accent-subtle'],
  ['neutral-0', 'red-600', TEXT, 'fg-on-accent on danger'],
  ['red-700', 'red-50', TEXT, 'danger-fg on danger-subtle'],
  ['red-700', 'neutral-0', TEXT, 'danger-fg on panel'],
  ['red-500', 'neutral-0', UI, 'danger-mark (stripe/dot)'],
  ['amber-700', 'amber-50', TEXT, 'warning-fg on warning-subtle'],
  ['amber-700', 'neutral-0', TEXT, 'warning-fg on panel'],
  ['amber-600', 'neutral-0', UI, 'warning-mark (stripe/dot)'],
  ['green-700', 'green-50', TEXT, 'success-fg on success-subtle'],
  ['green-700', 'neutral-0', TEXT, 'success-fg on panel'],
  ['green-500', 'neutral-0', UI, 'success-mark (dot)'],
  ['neutral-0', 'neutral-900', TEXT, 'fg-inverse on inverse (tooltip/toast)'],
  ['neutral-300', 'neutral-900', TEXT, 'fg-inverse-muted on inverse'],
  ['neutral-0', 'amber-700', TEXT, 'solid warning badge'],
  ['neutral-0', 'green-700', TEXT, 'solid success badge'],
]

let failures = 0
for (const [fg, bg, min, label] of pairs) {
  if (!P[fg] || !P[bg]) {
    console.log(`MISSING  ${fg} or ${bg} not found in globals.css`)
    failures++
    continue
  }
  const r = ratio(P[fg], P[bg])
  const ok = r >= min
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`)
}

console.log(failures ? `\n${failures} failing pair(s)` : `\nAll ${pairs.length} pairs pass.`)
process.exit(failures ? 1 : 0)
