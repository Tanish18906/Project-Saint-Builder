import crypto from 'crypto'
import { generateVoiceToken, verifyVoiceToken } from '../src/lib/voice-token'

// Fixed test secret so results never depend on (or touch) the real VOICE_TOKEN_SECRET.
// voice-token.ts reads the env var at call time, so setting it here is enough.
const SECRET = 'test-secret-for-voice-token-script'
process.env.VOICE_TOKEN_SECRET = SECRET

console.log('Testing voice token verification paths...\n')

let failures = 0
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failures++
  console.log(`${name}:`, ok ? '✅ PASSED' : '❌ FAILED', detail ?? '')
}

/** Verbatim port of n8n Workflow 3 "Generate Signed Voice Token" node (draft version 2026-10-02). */
function mintLikeN8n(emailId: string, secret: string, expiresInSeconds = 24 * 3600): string {
  const hex = emailId.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error(`email_id is not a UUID: ${emailId}`)
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const expBytes = Buffer.alloc(4)
  expBytes.writeUInt32BE(exp)
  const data = Buffer.concat([Buffer.from(hex, 'hex'), expBytes])
  const tag = crypto.createHmac('sha256', secret).update(data).digest().subarray(0, 12)
  return Buffer.concat([data, tag]).toString('base64url')
}

const emailId = '2c61e693-69ad-43de-8341-264dfd638304'

// 1. Valid token
const validToken = generateVoiceToken(emailId, 24)
const r1 = verifyVoiceToken(validToken, emailId)
check('1. Valid Token', r1.valid, r1)

// 2. URL-encoded token
const r2 = verifyVoiceToken(encodeURIComponent(validToken), emailId)
check('2. URL-Encoded Token', r2.valid, r2)

// 3. Expired token
const r3 = verifyVoiceToken(generateVoiceToken(emailId, -1), emailId)
check('3. Expired Token', !r3.valid && r3.error === 'expired', r3)

// 4. Email mismatch
const r4 = verifyVoiceToken(validToken, 'different-email-id-1234')
check('4. Email Mismatch', !r4.valid && r4.error === 'email_mismatch', r4)

// 5. Tampered signature
const r5 = verifyVoiceToken(validToken.slice(0, -4) + 'abcd', emailId)
check('5. Tampered Signature', !r5.valid && r5.error === 'invalid_signature', r5)

// 6. Malformed token
const r6 = verifyVoiceToken('invalid.token', emailId)
check('6. Malformed Token', !r6.valid && r6.error === 'invalid_format', r6)

// 7. Missing token
const r7 = verifyVoiceToken('', emailId)
check('7. Missing Token', !r7.valid && r7.error === 'missing_token', r7)

// 8. Format: 32 bytes -> 43 base64url chars
check('8. Token is 43 base64url chars', /^[A-Za-z0-9_-]{43}$/.test(validToken), validToken.length)

// 9. Cross-implementation: token minted by the n8n node code verifies in the app
const n8nToken = mintLikeN8n(emailId, SECRET)
const r9 = verifyVoiceToken(n8nToken, emailId)
check('9. n8n-minted token accepted', r9.valid && r9.emailId === emailId, r9)

// 10. Wrong secret (n8n and app secrets out of sync) is rejected
const r10 = verifyVoiceToken(mintLikeN8n(emailId, 'some-other-secret'), emailId)
check('10. Wrong secret rejected', !r10.valid && r10.error === 'invalid_signature', r10)

// 11. Modified email bytes (payload swap with original tag) is rejected
const swapped = Buffer.from(n8nToken, 'base64url')
swapped[0] ^= 0xff
const r11 = verifyVoiceToken(swapped.toString('base64url'))
check('11. Modified email bytes rejected', !r11.valid && r11.error === 'invalid_signature', r11)

// 12. Legacy JWT-style token (still minted by the PUBLISHED n8n WF3 version) is rejected
const legacyJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbF9pZCI6IjJjNjFlNjkzIn0.c2ln'
const r12 = verifyVoiceToken(legacyJwt, emailId)
check('12. Legacy JWT token rejected', !r12.valid, r12)

if (failures) {
  console.error(`\n${failures} voice token check(s) FAILED.`)
  process.exit(1)
}
console.log('\nAll token verification edge cases verified successfully.')
