import { NextRequest, NextResponse } from 'next/server'
import { verifyVoiceToken } from '@/lib/voice-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-voice-token')
    const body = await request.json()
    const { emailContext, currentDraft, instruction, routedRole, token, emailId } = body

    const activeToken = token || authHeader

    // Verify token
    if (activeToken) {
      const verification = verifyVoiceToken(activeToken, emailId)
      if (!verification.valid) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or expired voice token' }, { status: 401 })
      }
    }

    if (!currentDraft || typeof currentDraft !== 'string') {
      return NextResponse.json({ error: 'currentDraft parameter is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    let toneInstructionText = ''
    if (instruction === 'formal') {
      toneInstructionText =
        'Rewrite to be MORE FORMAL and CONCISE. No filler, no hedging, no small talk. Assume the reader is time-poor and wants the decision or fact stated plainly. Sentences should be short and direct.'
    } else if (instruction === 'shorter') {
      toneInstructionText =
        'Rewrite to be SIGNIFICANTLY SHORTER. Cut out any unnecessary pleasantries, repetition, or preamble. Keep only the core factual answer or request.'
    } else if (instruction === 'technical') {
      toneInstructionText =
        'Rewrite to be MORE TECHNICAL and JOB-FOCUSED. Reference job specifications, site details, and practical operational wording clearly and directly.'
    } else {
      toneInstructionText = 'Refine and polish the draft reply clearly and professionally.'
    }

    const systemPrompt = `You are an AI email assistant for Allsaints Builders, a UK construction company.
Your job is to modify an existing draft reply based on the user's rewrite instruction.

RULES:
- Preserve all existing placeholder brackets like [CONFIRM ...] exactly where they are. Never invent facts or dates.
- Adapt your writing style based strictly on the rewrite instruction: "${toneInstructionText}".
- Do NOT include a subject line — body text only.
- Respond with the revised draft reply text ONLY, with no preamble, quotes, or explanation.`

    const userMessage = `Original Email Context:
Sender: ${emailContext?.from_name || 'Sender'} (${emailContext?.from_address || ''})
Subject: ${emailContext?.subject || ''}
Category: ${emailContext?.category || ''}
Routed Role: ${routedRole || emailContext?.routed_role || 'general'}

Current Draft:
${currentDraft}

Instruction:
${toneInstructionText}`

    if (apiKey) {
      try {
        let openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5.4',
            temperature: 0.4,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          }),
        })

        // Fallback retry with gpt-4o if gpt-5.4 model is not yet provisioned on this key
        if (!openAiRes.ok) {
          const errText = await openAiRes.text()
          console.warn('[OpenAI gpt-5.4 Error, attempting fallback]', errText)

          openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              temperature: 0.4,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
            }),
          })
        }

        if (openAiRes.ok) {
          const data = await openAiRes.json()
          const rawResult = data.choices?.[0]?.message?.content || ''
          const cleanResult = rawResult.replace(/^```[a-z]*\s*/i, '').replace(/```$/g, '').trim()
          return NextResponse.json({ rewrittenText: cleanResult })
        }
      } catch (openAiErr) {
        console.warn('[OpenAI Chat Exception]', openAiErr)
      }
    }

    // Fallback heuristic rewrite if OpenAI API key is unavailable
    let fallbackText = currentDraft.trim()
    if (instruction === 'shorter') {
      const sentences = fallbackText.split(/(?<=[.?!])\s+/)
      fallbackText = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(' ')
    } else if (instruction === 'formal') {
      fallbackText = fallbackText
        .replace(/\bHi\b/g, 'Dear')
        .replace(/\bthanks\b/gi, 'Thank you')
        .replace(/\bcan you\b/gi, 'could you please')
    } else if (instruction === 'technical') {
      if (!fallbackText.includes('Site Specification')) {
        fallbackText = `Regarding site operations: ${fallbackText}`
      }
    }

    return NextResponse.json({ rewrittenText: fallbackText })
  } catch (err: any) {
    console.error('[API: /api/voice/rewrite Error]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
