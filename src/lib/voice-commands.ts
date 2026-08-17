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
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Strip common conversational wrapper words (please, can you, could you)
  cleaned = cleaned
    .replace(/^(please|can you|could you|would you)\s+/g, '')
    .replace(/\s+(please|thank you|thanks)$/g, '')
    .trim()

  return cleaned
}

/**
 * Fast, predictable string pattern matching for fixed voice command phrases.
 * Anything not matching the fixed list is treated as an edit instruction to apply.
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

  // 1. Read Draft commands
  if (
    normalized === 'read the draft' ||
    normalized === 'read draft' ||
    normalized === 'play the draft' ||
    normalized === 'play draft' ||
    normalized === 'whats the reply' ||
    normalized === 'what is the reply' ||
    normalized === 'read reply' ||
    normalized === 'play reply' ||
    normalized === 'read it back' ||
    normalized === 'read back'
  ) {
    return {
      action: 'read_draft',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Reading draft reply...',
    }
  }

  // 2. Rewrite — Formal
  if (
    normalized === 'make it more formal' ||
    normalized === 'make it formal' ||
    normalized === 'make more formal' ||
    normalized === 'more formal'
  ) {
    return {
      action: 'rewrite_formal',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Rewriting in formal director tone...',
    }
  }

  // 3. Rewrite — Shorter
  if (
    normalized === 'make it shorter' ||
    normalized === 'make it short' ||
    normalized === 'make shorter' ||
    normalized === 'shorten it' ||
    normalized === 'shorten' ||
    normalized === 'more concise'
  ) {
    return {
      action: 'rewrite_shorter',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Shortening draft reply...',
    }
  }

  // 4. Rewrite — Technical
  if (
    normalized === 'make it more technical' ||
    normalized === 'make it technical' ||
    normalized === 'make more technical' ||
    normalized === 'more technical'
  ) {
    return {
      action: 'rewrite_technical',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Rewriting in technical operations tone...',
    }
  }

  // 5. Blocked Voice Send (Safety Rule: Email cannot be sent via voice, must click button)
  if (
    normalized === 'approve and send' ||
    normalized === 'approve & send' ||
    normalized === 'approve send' ||
    normalized === 'approve' ||
    normalized === 'send it' ||
    normalized === 'send' ||
    normalized === 'send email' ||
    normalized === 'approve draft'
  ) {
    return {
      action: 'voice_send_blocked',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'For safety, emails cannot be sent by voice. Please tap the Approve & Send button on screen.',
    }
  }

  // 6. Discard
  if (
    normalized === 'discard' ||
    normalized === 'discard draft' ||
    normalized === 'clear draft' ||
    normalized === 'delete draft' ||
    normalized === 'clear reply'
  ) {
    return {
      action: 'discard',
      rawText,
      normalizedText: normalized,
      feedbackMessage: 'Draft discarded and cleared.',
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
