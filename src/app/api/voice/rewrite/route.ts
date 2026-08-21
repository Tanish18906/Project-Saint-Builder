import { NextRequest, NextResponse } from 'next/server'
import { verifyVoiceToken } from '@/lib/voice-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-voice-token')
    const body = await request.json().catch(() => ({}))
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

    let systemPrompt = ''
    let userMessage = ''

    if (instruction === 'apply_edit') {
      systemPrompt = `You will be given the CURRENT DRAFT TEXT and a SPOKEN INSTRUCTION. Apply the instruction as an edit to the current draft, returning the FULL updated draft text. Do not discard content from the current draft unless the instruction explicitly asks you to remove or replace something. If the instruction references a fact (a date, name, price, confirmation, etc.) that should be inserted into the draft, insert it in the appropriate place rather than appending it as a new sentence at the end, if a natural placement exists. Preserve any existing [CONFIRM ...] placeholders that the instruction does not directly resolve. If the instruction directly provides a fact that matches an existing placeholder (e.g. current draft has [CONFIRM COMPLETION DATE] and the instruction says 'the completion date is 20th August'), REPLACE that specific placeholder with the provided fact rather than leaving both the placeholder and a new sentence. Return only the updated draft text, no preamble or explanation.`

      userMessage = `Original Email Context:
Sender: ${emailContext?.from_name || 'Sender'} (${emailContext?.from_address || ''})
Subject: ${emailContext?.subject || ''}
Category: ${emailContext?.category || ''}
Routed Role: ${routedRole || emailContext?.routed_role || 'general'}

Current Draft:
${currentDraft}

Spoken Instruction:
${body.spokenInstruction || body.instruction || ''}`
    } else {
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

      systemPrompt = `You are an AI email assistant for Allsaints Builders, a UK construction company.
Your job is to modify an existing draft reply based on the user's rewrite instruction.

RULES:
- Preserve all existing placeholder brackets like [CONFIRM ...] exactly where they are. Never invent facts or dates.
- Adapt your writing style based strictly on the rewrite instruction: "${toneInstructionText}".
- Do NOT include a subject line — body text only.
- Respond with the revised draft reply text ONLY, with no preamble, quotes, or explanation.`

      userMessage = `Original Email Context:
Sender: ${emailContext?.from_name || 'Sender'} (${emailContext?.from_address || ''})
Subject: ${emailContext?.subject || ''}
Category: ${emailContext?.category || ''}
Routed Role: ${routedRole || emailContext?.routed_role || 'general'}

Current Draft:
${currentDraft}

Instruction:
${toneInstructionText}`
    }

    if (apiKey) {
      try {
        let openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(6500),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5.4-mini',
            temperature: 0.4,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          }),
        })

        // Fallback retry with gpt-4o-mini if gpt-5.4-mini model is not yet provisioned on this key
        if (!openAiRes.ok) {
          openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(6500),
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
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
      } catch (openAiErr: any) {
        console.warn('[OpenAI Chat Exception]', openAiErr?.message || openAiErr)
      }
    }

    // Fallback heuristic rewrite if OpenAI API key is unavailable or timed out
    let fallbackText = currentDraft.trim()
    const spokenInst = (body.spokenInstruction || body.instruction || '').trim()

    if (instruction === 'apply_edit') {
      if (fallbackText.includes('[CONFIRM') && spokenInst) {
        fallbackText = fallbackText.replace(/\[CONFIRM[^\]]*\]/, spokenInst)
      } else if (spokenInst) {
        if (fallbackText.includes('Best regards,')) {
          fallbackText = fallbackText.replace('Best regards,', `${spokenInst}\n\nBest regards,`)
        } else {
          fallbackText = `${fallbackText}\n\n${spokenInst}`
        }
      }
    } else if (instruction === 'shorter') {
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
