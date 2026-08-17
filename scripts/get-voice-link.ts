import { generateVoiceToken } from '../src/lib/voice-token'

const emailId = process.argv[2] || '3f656ba4-1caf-4211-ac8a-af1bb3ced59b'
const token = generateVoiceToken(emailId, 48)
const url = `http://localhost:3000/voice/${emailId}?token=${token}`

console.log('--------------------------------------------------')
console.log('🎙️  FOREMAN VOICE REVIEW LINK GENERATED')
console.log('--------------------------------------------------')
console.log(`Email ID: ${emailId}`)
console.log(`Token:    ${token}`)
console.log(`\n🔗 Test URL:\n${url}\n`)
console.log('--------------------------------------------------')
