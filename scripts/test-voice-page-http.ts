import { generateVoiceToken } from '../src/lib/voice-token'

async function runTests() {
  const baseUrl = 'http://localhost:3005'
  const emailId = '2c61e693-69ad-43de-8341-264dfd638304' // Real email in Supabase

  console.log('Testing HTTP endpoints on Next.js server (port 3005)...\n')

  // Test 1: Valid real token for real email
  const validToken = generateVoiceToken(emailId, 24)
  const res1 = await fetch(`${baseUrl}/voice/${emailId}?token=${validToken}`)
  const html1 = await res1.text()
  console.log(`Test 1 [Valid Token]: Status = ${res1.status}`)
  console.log(`Contains 'Hold to Speak': ${html1.includes('Hold to Speak')}`)
  console.log(`Contains Email Subject: ${html1.includes('URGENT: Legal injunction')}`)

  // Test 2: Expired token
  const expiredToken = generateVoiceToken(emailId, -2)
  const res2 = await fetch(`${baseUrl}/voice/${emailId}?token=${expiredToken}`)
  const html2 = await res2.text()
  console.log(`\nTest 2 [Expired Token]: Status = ${res2.status}`)
  console.log(`Contains 'Voice Link Expired': ${html2.includes('Voice Link Expired')}`)
  console.log(`Contains 'Reason: Voice link expired': ${html2.includes('Voice link expired')}`)

  // Test 3: Invalid signature
  const badToken = validToken.slice(0, -5) + 'xxxxx'
  const res3 = await fetch(`${baseUrl}/voice/${emailId}?token=${badToken}`)
  const html3 = await res3.text()
  console.log(`\nTest 3 [Invalid Signature]: Status = ${res3.status}`)
  console.log(`Contains 'Invalid Voice Link': ${html3.includes('Invalid Voice Link')}`)
  console.log(`Contains 'Cryptographic signature mismatch': ${html3.includes('Cryptographic signature mismatch')}`)

  // Test 4: Missing token
  const res4 = await fetch(`${baseUrl}/voice/${emailId}`)
  const html4 = await res4.text()
  console.log(`\nTest 4 [Missing Token]: Status = ${res4.status}`)
  console.log(`Contains 'Invalid Voice Link': ${html4.includes('Invalid Voice Link')}`)

  // Test 5: Non-existent email with valid token format
  const fakeEmailId = '00000000-0000-0000-0000-000000000000'
  const fakeToken = generateVoiceToken(fakeEmailId, 24)
  const res5 = await fetch(`${baseUrl}/voice/${fakeEmailId}?token=${fakeToken}`)
  const html5 = await res5.text()
  console.log(`\nTest 5 [Email Not Found]: Status = ${res5.status}`)
  console.log(`Contains 'Email Not Found': ${html5.includes('Email Not Found')}`)

  console.log('\nAll 5 HTTP Route Tests Completed!')
}

runTests().catch(console.error)
