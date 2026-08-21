export type VoiceActionType =
  | 'read_draft'
  | 'rewrite_formal'
  | 'rewrite_shorter'
  | 'rewrite_technical'
  | 'discard'
  | 'apply_edit'
  | 'dictation'
  | 'voice_send_blocked'

export interface VoiceCommandResult {
  action: VoiceActionType
  rawText: string
  normalizedText: string
  editInstruction?: string
  dictationText?: string
  feedbackMessage?: string
}

/**
 * Normalizes input speech string by removing punctuation, polite prefixes/suffixes, and collapsing whitespace.
 */
export function normalizeSpeech(text: string): string {
  let cleaned = (text || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Strip common conversational wrapper phrases
  cleaned = cleaned
    .replace(/^(please|can you|could you|would you|can you please|could you please)\s+/g, '')
    .replace(/\s+(please|thank you|thanks|to me|for me)$/g, '')
    .trim()

  return cleaned
}

/**
 * Robust intent-based pattern matching for voice commands.
 * Fixed command intents (read, rewrite, discard, send) are strictly detected first.
 * Only genuine editing instructions or dictation fall through to 'apply_edit'.
 */
export function parseVoiceCommand(transcript: string): VoiceCommandResult {
  const rawText = (transcript || '').trim()
  const normalized = normalizeSpeech(rawText)

  if (!normalized) {
    return {
      action: 'apply_edit',
      rawText,
      normalizedText: '',
      editInstruction: '',
      dictationText: '',
    }
  }

  // 1. READ DRAFT Intent (Strictly Read-Only)
  // Matches: "read the draft", "read draft", "play the draft", "what is the draft", "whats the reply",
  // "read back the draft", "can you read the reply", "read the response", "read out the draft", "read reply"
  const isReadDraft =
    /(^|\b)(read|play|hear|listen|say|recite)(\s+(back|out|to\s+me|it))?(\s+(the|my|this|our|ai))?\s*(draft|reply|response|message|answer)(\b|$)/i.test(
      normalized
    ) ||
    /(^|\b)(what\s+is|whats|tell\s+me)\s+(the|my|this|our)?\s*(draft|reply|response|message|answer)(\b|$)/i.test(
      normalized
    ) ||
    normalized === 'read it back' ||
    normalized === 'read back' ||
    normalized === 'read it' ||
    normalized === 'play it' ||
    normalized === 'read' ||
    normalized === 'read draft'

  if (isReadDraft) {
    return {
      action: 'read_draft',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Reading draft reply...',
    }
  }

  // 2. DISCARD / CLEAR Intent
  // Matches: "discard", "discard draft", "clear draft", "delete draft", "wipe draft", "cancel draft"
  const isDiscard =
    /(^|\b)(discard|clear|delete|wipe|erase|reset|cancel)(\s+(the|my|this)?)?\s*(draft|reply|response|text|message)?$/i.test(
      normalized
    )

  if (isDiscard) {
    return {
      action: 'discard',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Draft discarded and cleared.',
    }
  }

  // 3. REWRITE — FORMAL Intent
  // Matches: "make it more formal", "make it formal", "make formal", "more formal", "formal tone", "professional"
  const isFormal =
    /(^|\b)(make\s+(it\s+)?(more\s+)?formal|more\s+formal|formal\s+tone|make\s+it\s+professional|professional\s+tone)(\b|$)/i.test(
      normalized
    )

  if (isFormal) {
    return {
      action: 'rewrite_formal',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Rewriting in formal director tone...',
    }
  }

  // 4. REWRITE — SHORTER Intent
  // Matches: "make it shorter", "make it short", "shorten it", "make shorter", "more concise", "keep it brief"
  const isShorter =
    /(^|\b)(make\s+(it\s+)?(more\s+)?(short|shorter|concise|brief)|shorten\s+(it)?|more\s+concise|more\s+brief|keep\s+it\s+short)(\b|$)/i.test(
      normalized
    )

  if (isShorter) {
    return {
      action: 'rewrite_shorter',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Shortening draft reply...',
    }
  }

  // 5. REWRITE — TECHNICAL Intent
  // Matches: "make it more technical", "make it technical", "technical tone", "more technical", "add technical detail"
  const isTechnical =
    /(^|\b)(make\s+(it\s+)?(more\s+)?technical|more\s+technical|technical\s+tone|operational\s+tone)(\b|$)/i.test(
      normalized
    )

  if (isTechnical) {
    return {
      action: 'rewrite_technical',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Rewriting in technical operations tone...',
    }
  }

  // 6. BLOCKED VOICE SEND Intent (Safety Rule: Voice sending blocked, button click required)
  // Matches: "approve and send", "approve & send", "approve", "send it", "send email", "send draft"
  const isSend =
    /(^|\b)(approve(\s+and|\s+&)?\s+send|approve\s+draft|approve\s+reply|send\s+it|send\s+email|send\s+reply|send\s+draft)(\b|$)/i.test(
      normalized
    ) ||
    normalized === 'approve' ||
    normalized === 'send'

  if (isSend) {
    return {
      action: 'voice_send_blocked',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'For safety, emails cannot be sent by voice. Please tap the Approve & Send button on screen.',
    }
  }

  // 7. Non-command speech: Apply spoken instruction as an edit to the draft
  return {
    action: 'apply_edit',
    rawText,
    normalizedText: normalized,
    editInstruction: rawText,
    dictationText: rawText,
    feedbackMessage: 'Applying edit to draft...',
  }
}
