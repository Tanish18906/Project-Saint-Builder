import { NextRequest, NextResponse } from 'next/server'
import { verifyVoiceToken } from '@/lib/voice-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-voice-token')
    const formData = await request.formData()
    const audioFile = formData.get('file') as Blob | null
    const token = formData.get('token') as string | null
    const emailId = formData.get('email_id') as string | null

    const activeToken = token || authHeader

    // Verify token
    if (activeToken) {
      const verification = verifyVoiceToken(activeToken, emailId || undefined)
      if (!verification.valid) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or expired voice token' }, { status: 401 })
      }
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    // If OpenAI API key is present, send audio to Whisper
    if (apiKey) {
      try {
        const whisperFormData = new FormData()
        whisperFormData.append('file', audioFile, 'recording.webm')
        whisperFormData.append('model', 'whisper-1')
        whisperFormData.append('language', 'en')

        const openAiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: whisperFormData,
        })

        if (!openAiRes.ok) {
          const errText = await openAiRes.text()
          console.warn('[OpenAI Whisper Error]', errText)
          return NextResponse.json({ error: 'Speech recognition failed', details: errText }, { status: 502 })
        }

        const data = await openAiRes.json()
        return NextResponse.json({ text: (data.text || '').trim() })
      } catch (openAiErr) {
        console.warn('[OpenAI Whisper Fetch Exception]', openAiErr)
        return NextResponse.json({ error: 'Whisper network error' }, { status: 500 })
      }
    }

    // If no API key, return a mock response or indicate speech recognition fallback
    return NextResponse.json({
      text: '',
      fallback: true,
      message: 'OPENAI_API_KEY not configured on server; client fallback used.',
    })
  } catch (err: any) {
    console.error('[API: /api/voice/stt Error]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
