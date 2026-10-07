import { NextRequest, NextResponse } from 'next/server'
import { verifyVoiceToken } from '@/lib/voice-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-voice-token')
    const body = await request.json().catch(() => ({}))
    const { text, token, emailId } = body

    const activeToken = token || authHeader

    // Verify token - strictly enforce valid signed token
    if (!activeToken) {
      return NextResponse.json({ error: 'Unauthorized: Missing voice token' }, { status: 401 })
    }

    const verification = verifyVoiceToken(activeToken, emailId)
    if (!verification.valid) {
      return NextResponse.json(
        { error: `Unauthorized: ${verification.error || 'Invalid or expired voice token'}` },
        { status: 401 }
      )
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 })
    }

    const cleanText = text.trim()
    const apiKey = process.env.OPENAI_API_KEY

    // If OpenAI API key is configured, stream real TTS audio with strict timeout
    if (apiKey) {
      try {
        let openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          signal: AbortSignal.timeout(12000),
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

        // Fallback retry with tts-1-hd if tts-1 fails
        if (!openAiRes.ok) {
          openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            signal: AbortSignal.timeout(12000),
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'tts-1-hd',
              input: cleanText,
              voice: 'alloy',
              response_format: 'mp3',
            }),
          })
        }

        if (openAiRes.ok) {
          const audioBuffer = await openAiRes.arrayBuffer()
          return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=3600',
            },
          })
        }
      } catch (openAiErr) {
        console.warn('[OpenAI TTS Fetch Exception, falling back to browser speech]', openAiErr)
      }
    }

    // Fallback: Instruct client to use Web Speech API immediately without hanging
    return NextResponse.json({ useBrowserSpeech: true, text: cleanText })
  } catch (err: unknown) {
    console.error('[API: /api/voice/tts Error]', err)
    return NextResponse.json({ error: (err instanceof Error && err.message) || 'Internal server error', useBrowserSpeech: true }, { status: 500 })
  }
}
