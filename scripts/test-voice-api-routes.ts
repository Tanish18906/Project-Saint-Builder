import { NextRequest } from 'next/server'
import { POST as rewriteHandler } from '../src/app/api/voice/rewrite/route'
import { POST as ttsHandler } from '../src/app/api/voice/tts/route'
import { POST as sttHandler } from '../src/app/api/voice/stt/route'
import { generateVoiceToken } from '../src/lib/voice-token'

async function runTests() {
  console.log('Testing Voice API Routes Authentication...\n')
  const emailId = '2c61e693-69ad-43de-8341-264dfd638304'
  const validToken = generateVoiceToken(emailId, 24)

  // 1. REWRITE ROUTE - Missing Token
  const reqNoToken = new NextRequest('http://localhost:3000/api/voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      currentDraft: 'Hello, world',
      instruction: 'shorter',
      emailId,
    }),
  })
  const resNoToken = await rewriteHandler(reqNoToken)
  console.log('1. Rewrite - Missing Token:', resNoToken.status === 401 ? '✅ 401 Unauthorized' : `❌ Failed with ${resNoToken.status}`)

  // 2. REWRITE ROUTE - Invalid Token
  const reqBadToken = new NextRequest('http://localhost:3000/api/voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      currentDraft: 'Hello, world',
      instruction: 'shorter',
      token: 'fake.token.value',
      emailId,
    }),
  })
  const resBadToken = await rewriteHandler(reqBadToken)
  console.log('2. Rewrite - Invalid Token:', resBadToken.status === 401 ? '✅ 401 Unauthorized' : `❌ Failed with ${resBadToken.status}`)

  // 3. REWRITE ROUTE - Valid Token
  const reqValidToken = new NextRequest('http://localhost:3000/api/voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      currentDraft: 'Hi there, thanks for your email. We will look into it. Best regards.',
      instruction: 'shorter',
      token: validToken,
      emailId,
    }),
  })
  const resValidToken = await rewriteHandler(reqValidToken)
  const validData = await resValidToken.json()
  console.log('3. Rewrite - Valid Token:', resValidToken.status === 200 && validData.rewrittenText ? '✅ 200 Success' : `❌ Failed with ${resValidToken.status}`, validData)

  // 4. TTS ROUTE - Missing Token
  const reqTtsNoToken = new NextRequest('http://localhost:3000/api/voice/tts', {
    method: 'POST',
    body: JSON.stringify({
      text: 'Hello world',
      emailId,
    }),
  })
  const resTtsNoToken = await ttsHandler(reqTtsNoToken)
  console.log('4. TTS - Missing Token:', resTtsNoToken.status === 401 ? '✅ 401 Unauthorized' : `❌ Failed with ${resTtsNoToken.status}`)

  // 5. TTS ROUTE - Valid Token
  const reqTtsValid = new NextRequest('http://localhost:3000/api/voice/tts', {
    method: 'POST',
    body: JSON.stringify({
      text: 'Hello, this is a test audio generation.',
      token: validToken,
      emailId,
    }),
  })
  const resTtsValid = await ttsHandler(reqTtsValid)
  console.log('5. TTS - Valid Token:', resTtsValid.status === 200 ? '✅ 200 Success (Audio synthesized)' : `Status ${resTtsValid.status}`)

  // 6. STT ROUTE - Missing Token
  const formDataNoToken = new FormData()
  formDataNoToken.append('email_id', emailId)
  const reqSttNoToken = new NextRequest('http://localhost:3000/api/voice/stt', {
    method: 'POST',
    body: formDataNoToken,
  })
  const resSttNoToken = await sttHandler(reqSttNoToken)
  console.log('6. STT - Missing Token:', resSttNoToken.status === 401 ? '✅ 401 Unauthorized' : `❌ Failed with ${resSttNoToken.status}`)

  console.log('\nAll Voice API authentication tests completed!')
}

runTests().catch(console.error)
