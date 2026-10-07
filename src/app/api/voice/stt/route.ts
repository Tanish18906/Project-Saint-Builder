import { NextRequest, NextResponse } from 'next/server'
import { verifyVoiceToken } from '@/lib/voice-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-voice-token')
    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'Expected multipart/form-data body' }, { status: 400 })
    }
    const audioFile = formData.get('file') as Blob | null
    const token = formData.get('token') as string | null
    const emailId = formData.get('email_id') as string | null

    const activeToken = token || authHeader

    // Verify token - strictly enforce valid signed token
    if (!activeToken) {
      return NextResponse.json({ error: 'Unauthorized: Missing voice token' }, { status: 401 })
    }

    const verification = verifyVoiceToken(activeToken, emailId || undefined)
    if (!verification.valid) {
      return NextResponse.json(
        { error: `Unauthorized: ${verification.error || 'Invalid or expired voice token'}` },
        { status: 401 }
      )
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    // If OpenAI API key is present, send audio to Whisper with timeout
    if (apiKey) {
      try {
        const whisperFormData = new FormData()
        // iOS Safari records audio/mp4; name the file to match so Whisper picks the right decoder
        const ext = audioFile.type.includes('mp4') ? 'mp4' : audioFile.type.includes('ogg') ? 'ogg' : 'webm'
        whisperFormData.append('file', audioFile, `recording.${ext}`)
        whisperFormData.append('model', 'whisper-1')
        whisperFormData.append('language', 'en')

        const openAiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          signal: AbortSignal.timeout(7500),
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: whisperFormData,
        })

        if (!openAiRes.ok) {
          const errText = await openAiRes.text()
          console.warn('[OpenAI Whisper Error]', errText)
          return NextResponse.json({ error: 'Speech recognition failed' }, { status: 502 })
        }

        const data = await openAiRes.json()
        return NextResponse.json({ text: (data.text || '').trim() })
      } catch (openAiErr: unknown) {
        console.warn('[OpenAI Whisper Fetch Exception]', openAiErr instanceof Error ? openAiErr.message : openAiErr)
        return NextResponse.json({ error: 'Whisper network timeout or error', fallback: true }, { status: 500 })
      }
    }

    // If no API key, return a fallback message
    return NextResponse.json({
      text: '',
      fallback: true,
      message: 'OPENAI_API_KEY not configured on server; client fallback used.',
    })
  } catch (err: unknown) {
    console.error('[API: /api/voice/stt Error]', err)
    return NextResponse.json({ error: (err instanceof Error && err.message) || 'Internal server error' }, { status: 500 })
  }
}
