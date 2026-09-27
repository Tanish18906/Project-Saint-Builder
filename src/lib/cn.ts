/**
 * Joins class names, skipping falsy values.
 *
 * Deliberately not tailwind-merge: primitives expose variants/props for anything
 * a caller should change, so `className` is for layout (margins, width, grid
 * placement) — not for overriding a primitive's colours or padding.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
