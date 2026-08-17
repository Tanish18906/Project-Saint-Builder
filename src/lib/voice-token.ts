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
 * Valid for the specified number of hours (default: 48h).
 */
export function generateVoiceToken(emailId: string, expiresInHours = 48): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresInHours * 3600

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: VoiceTokenPayload = {
    email_id: emailId,
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
 */
export function verifyVoiceToken(
  token: string | null | undefined,
  expectedEmailId?: string
): VoiceTokenVerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'missing_token' }
  }

  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return { valid: false, error: 'invalid_format' }
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  // Verify HMAC signature
  try {
    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(dataToSign)
      .digest()

    const expectedSignatureB64 = base64UrlEncode(expectedSignature)

    if (encodedSignature !== expectedSignatureB64) {
      return { valid: false, error: 'invalid_signature' }
    }

    const payloadJson = base64UrlDecode(encodedPayload)
    const payload: VoiceTokenPayload = JSON.parse(payloadJson)

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'expired', payload }
    }

    if (expectedEmailId && payload.email_id !== expectedEmailId) {
      return { valid: false, error: 'email_mismatch', payload }
    }

    return {
      valid: true,
      emailId: payload.email_id,
      payload,
    }
  } catch (err) {
    return { valid: false, error: 'invalid_format' }
  }
}
