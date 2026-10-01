export interface VoiceEmailAccount {
  id?: string
  email_address: string
  display_name: string | null
}

export interface VoiceEmailItem {
  id: string
  account_id: string
  message_id: string
  from_address: string
  from_name: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  received_at: string
  theme: string | null
  urgency: string | null
  routed_roles: string[] | null
  status: string
  accounts?: VoiceEmailAccount | null
}

export interface VoiceDraftItem {
  id: string
  email_id: string
  ai_generated_text: string | null
  edited_text: string | null
  draft_type: string
  status: string
  approved_by: string | null
  approved_at: string | null
  sent_at: string | null
}

export type VoiceUIState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface VoiceFeedback {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export interface VoiceEmailViewProps {
  email: VoiceEmailItem
  draft: VoiceDraftItem | null
  approverName?: string | null
  token: string
}

export interface VoiceActionToolbarProps {
  onApproveClick: () => void
  onSaveClick: () => void
  onDiscardClick: () => void
  isPending: boolean
  isLocked: boolean
  canApprove: boolean
  hasDraftText: boolean
}

export interface VoiceOrbProps {
  uiState: VoiceUIState
  showMicBusy: boolean
  isLocked: boolean
  onPointerDown: () => void
  onPointerUp: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
  onClick?: () => void
  onStopAudio: () => void
  micPermissionDenied: boolean
  onSwitchToTextMode: () => void
  lastTranscript?: string
  onSelectSuggestedCommand?: (cmd: string) => void
}

export interface VoiceDraftArtifactProps {
  draftText: string
  onChangeDraftText: (text: string) => void
  initialAIText: string | null
  isLocked: boolean
  isPending: boolean
  onRewriteTone: (tone: 'formal' | 'shorter' | 'technical') => void
  onResetToInitialAI: () => void
  draftStatus?: string
  approvedAt?: string | null
  approverName?: string | null
  recipientEmail: string
  isDraftUpdated?: boolean
}

export interface VoiceHeaderProps {
  email: VoiceEmailItem
  draft: VoiceDraftItem | null
  isLocked: boolean
}

