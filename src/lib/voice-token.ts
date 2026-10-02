import crypto from 'crypto'

// Compact voice-link token: base64url of 32 bytes → 43 URL-safe chars, so a
// WhatsApp link is just `/voice/<token>`.
//   bytes [0,16)  email UUID
//   bytes [16,20) expiry, uint32 unix seconds (big-endian)
//   bytes [20,32) HMAC-SHA256(secret, bytes[0,20)) truncated to 96 bits
// n8n "Foreman Whatsapp" → "Generate Signed Voice Token" mints the same format
// with the same VOICE_TOKEN_SECRET — keep the two in sync.

export interface VoiceTokenPayload {
  email_id: string
  exp: number // Expiration timestamp in seconds
}

export interface VoiceTokenVerificationResult {
  valid: boolean
  emailId?: string
  error?: 'missing_token' | 'invalid_format' | 'invalid_signature' | 'expired' | 'email_mismatch'
  errorMessage?: string
  payload?: VoiceTokenPayload
}

// Local-dev fallback only. Production must set VOICE_TOKEN_SECRET.
const DEFAULT_SECRET = 'foreman-voice-secret-key-3b7c89f2a4e10d'

function getSecret(): string {
  const secret = process.env.VOICE_TOKEN_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('VOICE_TOKEN_SECRET is not set')
  }
  return DEFAULT_SECRET
}

function sign(data: Buffer): Buffer {
  return crypto.createHmac('sha256', getSecret()).update(data).digest().subarray(0, 12)
}

function uuidToBytes(id: string): Buffer | null {
  const hex = id.trim().replace(/-/g, '').toLowerCase()
  return /^[0-9a-f]{32}$/.test(hex) ? Buffer.from(hex, 'hex') : null
}

function bytesToUuid(bytes: Buffer): string {
  return bytes.toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
}

function decode(token: string): Buffer | null {
  let clean = token.trim()
  try {
    clean = decodeURIComponent(clean)
  } catch {
    // use as-is
  }
  return /^[A-Za-z0-9_-]{43}$/.test(clean) ? Buffer.from(clean, 'base64url') : null
}

/**
 * Generates a signed voice token for an email_id.
 * Valid for the specified number of hours (default: 24h).
 */
export function generateVoiceToken(emailId: string, expiresInHours = 24): string {
  const id = uuidToBytes(emailId)
  if (!id) throw new Error('emailId must be a UUID')

  const exp = Buffer.alloc(4)
  exp.writeUInt32BE(Math.floor(Date.now() / 1000) + Math.round(expiresInHours * 3600))

  const data = Buffer.concat([id, exp])
  return Buffer.concat([data, sign(data)]).toString('base64url')
}

/**
 * Reads the email UUID out of a well-formed token WITHOUT verifying it.
 * Only for routing `/voice/<token>`; always call verifyVoiceToken() afterwards.
 */
export function voiceTokenEmailId(token: string): string | null {
  const bytes = decode(token)
  return bytes ? bytesToUuid(bytes.subarray(0, 16)) : null
}

/**
 * Verifies a signed voice token and optionally matches it against the requested emailId.
 * Guarantees a safe, non-throwing return object for every possible token input.
 */
export function verifyVoiceToken(
  token: string | null | undefined,
  expectedEmailId?: string
): VoiceTokenVerificationResult {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'missing_token', errorMessage: 'No voice token provided in request' }
    }

    const bytes = decode(token)
    if (!bytes) {
      return { valid: false, error: 'invalid_format', errorMessage: 'Malformed voice token' }
    }

    // Constant-time comparison of the 96-bit tag
    if (!crypto.timingSafeEqual(bytes.subarray(20), sign(bytes.subarray(0, 20)))) {
      return { valid: false, error: 'invalid_signature', errorMessage: 'Cryptographic signature mismatch' }
    }

    const payload: VoiceTokenPayload = {
      email_id: bytesToUuid(bytes.subarray(0, 16)),
      exp: bytes.readUInt32BE(16),
    }

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return {
        valid: false,
        error: 'expired',
        errorMessage: `Voice link expired ${Math.round((now - payload.exp) / 60)} minutes ago`,
        payload,
      }
    }

    if (expectedEmailId && payload.email_id !== expectedEmailId.trim().toLowerCase()) {
      return {
        valid: false,
        error: 'email_mismatch',
        errorMessage: 'Token is for a different email message',
        payload,
      }
    }

    return {
      valid: true,
      emailId: payload.email_id,
      payload,
    }
  } catch (err: unknown) {
    return {
      valid: false,
      error: 'invalid_format',
      errorMessage: err instanceof Error ? err.message : 'Error parsing token',
    }
  }
}
