import crypto from 'crypto'

export interface VoiceTokenPayload {
  email_id: string
  exp: number // Expiration timestamp in seconds
  iat: number // Issued at timestamp in seconds
}

export interface VoiceTokenVerificationResult {
  valid: boolean
  emailId?: string
  error?: 'missing_token' | 'invalid_format' | 'invalid_signature' | 'expired' | 'email_mismatch'
  errorMessage?: string
  payload?: VoiceTokenPayload
}

const DEFAULT_SECRET = 'foreman-voice-secret-key-3b7c89f2a4e10d'

function getSecret(): string {
  return process.env.VOICE_TOKEN_SECRET || DEFAULT_SECRET
}

function base64UrlEncode(input: string | Buffer): string {
  const base64 = (typeof input === 'string' ? Buffer.from(input, 'utf8') : input).toString('base64')
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

/**
 * Generates a signed voice token for an email_id.
 * Valid for the specified number of hours (default: 24h).
 */
export function generateVoiceToken(emailId: string, expiresInHours = 24): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresInHours * 3600

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: VoiceTokenPayload = {
    email_id: emailId.trim(),
    exp,
    iat: now,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(dataToSign)
    .digest()

  const encodedSignature = base64UrlEncode(signature)
  return `${dataToSign}.${encodedSignature}`
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

    // Clean up possible URL-encoded string or whitespace
    let cleanToken = token.trim()
    if (cleanToken.includes('%')) {
      try {
        cleanToken = decodeURIComponent(cleanToken)
      } catch {
        // use cleanToken as-is
      }
    }

    const parts = cleanToken.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'invalid_format', errorMessage: 'Malformed token structure (expected 3 parts)' }
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return { valid: false, error: 'invalid_format', errorMessage: 'Token header, payload, or signature missing' }
    }

    const dataToSign = `${encodedHeader}.${encodedPayload}`

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(dataToSign)
      .digest()

    const expectedSignatureB64 = base64UrlEncode(expectedSignature)

    // Constant-time buffer comparison
    const sigA = Buffer.from(encodedSignature, 'utf8')
    const sigB = Buffer.from(expectedSignatureB64, 'utf8')
    const isSignatureValid = sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)

    if (!isSignatureValid) {
      return { valid: false, error: 'invalid_signature', errorMessage: 'Cryptographic signature mismatch' }
    }

    // Decode and parse payload JSON
    const payloadJson = base64UrlDecode(encodedPayload)
    const payload: VoiceTokenPayload = JSON.parse(payloadJson)

    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'invalid_format', errorMessage: 'Token payload is not a valid JSON object' }
    }

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && typeof payload.exp === 'number' && payload.exp < now) {
      return {
        valid: false,
        error: 'expired',
        errorMessage: `Voice link expired ${Math.round((now - payload.exp) / 60)} minutes ago`,
        payload,
      }
    }

    if (expectedEmailId && payload.email_id !== expectedEmailId.trim()) {
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
  } catch (err: any) {
    return {
      valid: false,
      error: 'invalid_format',
      errorMessage: err?.message || 'Error parsing token',
    }
  }
}
