import { generateVoiceToken } from '../src/lib/voice-token'

// Negative hours -> already-expired token, used to deliberately force and
// verify the "expired voice link" edge state (Phase 5 testing).
const emailId = process.argv[2] || 'e95ca137-e5a0-4e3e-9a00-c1b4c3c0d461'
const token = generateVoiceToken(emailId, -1)
console.log(`http://localhost:3000/voice/${emailId}?token=${token}`)
