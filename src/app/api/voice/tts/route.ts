import { NextRequest, NextResponse } from 'next/server'
import { verifyVoiceToken } from '@/lib/voice-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-voice-token')
    const body = await request.json()
    const { text, token, emailId } = body

    const activeToken = token || authHeader

    // Verify token
    if (activeToken) {
      const verification = verifyVoiceToken(activeToken, emailId)
      if (!verification.valid) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or expired voice token' }, { status: 401 })
      }
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 })
    }

    const cleanText = text.trim()
    const apiKey = process.env.OPENAI_API_KEY

    // If OpenAI API key is configured, stream real TTS audio
    if (apiKey) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: cleanText,
            voice: 'alloy',
            response_format: 'mp3',
          }),
        })

        if (!openAiRes.ok) {
          const errText = await openAiRes.text()
          console.warn('[OpenAI TTS Error]', errText)
          // Fall back to client Web Speech API
          return NextResponse.json({ useBrowserSpeech: true, text: cleanText })
        }

        const audioBuffer = await openAiRes.arrayBuffer()
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } catch (openAiErr) {
        console.warn('[OpenAI TTS Fetch Exception, falling back to browser speech]', openAiErr)
        return NextResponse.json({ useBrowserSpeech: true, text: cleanText })
      }
    }

    // Fallback: Instruct client to use Web Speech API
    return NextResponse.json({ useBrowserSpeech: true, text: cleanText })
  } catch (err: any) {
    console.error('[API: /api/voice/tts Error]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
