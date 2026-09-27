// Maps raw driver/network/database error text to plain sentences for the UI.
// Raw messages stay available to developers via console logging at the call site.

const NETWORK_PATTERNS = ['fetch failed', 'failed to fetch', 'network', 'econnrefused', 'enotfound', 'etimedout', 'timeout']

function isNetworkError(normalized: string): boolean {
  return NETWORK_PATTERNS.some((p) => normalized.includes(p))
}

export const CONNECTION_MESSAGE = 'Unable to connect. Please check your connection and try again.'

export function toUserMessage(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback
  const normalized = raw.toLowerCase()
  if (isNetworkError(normalized)) return CONNECTION_MESSAGE
  // Server-side lockdown message (drafts actions) is already written for people — show it as-is.
  if (normalized.includes('already been approved or sent')) return raw
  return fallback
}

export function toSignInMessage(raw: string | null | undefined): string {
  if (!raw) return 'Unable to sign in right now. Please try again.'
  const normalized = raw.toLowerCase()

  if (normalized.includes('provide both email and password')) return raw
  if (normalized.includes('invalid login credentials')) {
    return 'That email and password combination wasn’t recognised. Check both and try again.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'This account hasn’t been confirmed yet. Check your inbox for the confirmation link.'
  }
  if (normalized.includes('too many') || normalized.includes('rate limit')) {
    return 'Too many sign-in attempts. Wait a moment, then try again.'
  }
  if (isNetworkError(normalized)) return CONNECTION_MESSAGE

  return 'Unable to sign in right now. Please try again.'
}
