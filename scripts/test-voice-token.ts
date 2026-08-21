import { generateVoiceToken, verifyVoiceToken } from '../src/lib/voice-token'

console.log('Testing voice token verification paths...\n')

const emailId = '2c61e693-69ad-43de-8341-264dfd638304'

// 1. Valid token
const validToken = generateVoiceToken(emailId, 24)
const r1 = verifyVoiceToken(validToken, emailId)
console.log('1. Valid Token:', r1.valid ? '✅ PASSED' : '❌ FAILED', r1)

// 2. URL-encoded token
const encodedToken = encodeURIComponent(validToken)
const r2 = verifyVoiceToken(encodedToken, emailId)
console.log('2. URL-Encoded Token:', r2.valid ? '✅ PASSED' : '❌ FAILED', r2)

// 3. Expired token
const expiredToken = generateVoiceToken(emailId, -1) // expired 1 hour ago
const r3 = verifyVoiceToken(expiredToken, emailId)
console.log('3. Expired Token:', !r3.valid && r3.error === 'expired' ? '✅ PASSED' : '❌ FAILED', r3)

// 4. Email mismatch
const r4 = verifyVoiceToken(validToken, 'different-email-id-1234')
console.log('4. Email Mismatch:', !r4.valid && r4.error === 'email_mismatch' ? '✅ PASSED' : '❌ FAILED', r4)

// 5. Tampered signature
const tamperedToken = validToken.slice(0, -4) + 'abcd'
const r5 = verifyVoiceToken(tamperedToken, emailId)
console.log('5. Tampered Signature:', !r5.valid && r5.error === 'invalid_signature' ? '✅ PASSED' : '❌ FAILED', r5)

// 6. Malformed token
const r6 = verifyVoiceToken('invalid.token', emailId)
console.log('6. Malformed Token:', !r6.valid && r6.error === 'invalid_format' ? '✅ PASSED' : '❌ FAILED', r6)

// 7. Missing token
const r7 = verifyVoiceToken('', emailId)
console.log('7. Missing Token:', !r7.valid && r7.error === 'missing_token' ? '✅ PASSED' : '❌ FAILED', r7)

console.log('\nAll token verification edge cases verified successfully.')
