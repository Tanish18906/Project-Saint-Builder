// Word-level diff between the AI draft and the reply text. Pure, no DOM.

export interface DiffPart {
  type: 'same' | 'added' | 'removed'
  text: string
}

const MAX_CELLS = 4_000_000

/** Words and the whitespace between them, so line breaks survive the diff. */
function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? []
}

function push(parts: DiffPart[], type: DiffPart['type'], text: string) {
  const last = parts[parts.length - 1]
  if (last && last.type === type) last.text += text
  else parts.push({ type, text })
}

/**
 * Longest-common-subsequence diff over word tokens. Returns null when the
 * texts are too long to compare in the browser (caller says so rather than
 * showing a partial diff).
 */
export function diffWords(before: string, after: string): DiffPart[] | null {
  const a = tokenize(before)
  const b = tokenize(after)

  // Trim the common prefix and suffix; most edits are local.
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const midA = a.slice(start, endA)
  const midB = b.slice(start, endB)
  const n = midA.length
  const m = midB.length
  if ((n + 1) * (m + 1) > MAX_CELLS) return null

  // lcs[i][j] = LCS length of midA[i..] and midB[j..], stored row-major.
  const width = m + 1
  const lcs = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        midA[i] === midB[j] ? lcs[(i + 1) * width + j + 1] + 1 : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1])
    }
  }

  const parts: DiffPart[] = []
  if (start > 0) push(parts, 'same', a.slice(0, start).join(''))
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (midA[i] === midB[j]) {
      push(parts, 'same', midA[i])
      i++
      j++
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      push(parts, 'removed', midA[i++])
    } else {
      push(parts, 'added', midB[j++])
    }
  }
  while (i < n) push(parts, 'removed', midA[i++])
  while (j < m) push(parts, 'added', midB[j++])
  if (endA < a.length) push(parts, 'same', a.slice(endA).join(''))
  return parts
}
