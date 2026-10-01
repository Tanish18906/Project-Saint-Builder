import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import {
  type EmailRecord,
  type ClassificationAudit,
  formatRoles,
  confidenceToPercent,
} from '@/components/email-detail/types'

export interface ClassificationCardProps {
  classificationAudit?: ClassificationAudit | null
  email: EmailRecord
  className?: string
}

export function ClassificationCard({
  classificationAudit,
  email,
  className = '',
}: ClassificationCardProps) {
  const confidencePercent =
    classificationAudit?.confidence !== undefined && classificationAudit?.confidence !== null
      ? confidenceToPercent(classificationAudit.confidence)
      : null

  const assignedRoles =
    classificationAudit?.routed_roles && classificationAudit.routed_roles.length > 0
      ? classificationAudit.routed_roles
      : email.routed_roles

  const themeDisplay = (classificationAudit?.theme || email.theme || 'unclassified').replace(/_/g, ' ')
  const urgencyDisplay = (classificationAudit?.urgency || email.urgency || '—').replace(/_/g, ' ')

  return (
    <Card padding="md" className={`space-y-3.5 ${className}`.trim()}>
      {/* Header with Sparkles icon, Title, and Confidence Badge */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <h2 className="text-xs font-semibold text-[var(--text-primary)]">
            AI triage analysis
          </h2>
        </div>
        {confidencePercent !== null && (
          <Badge
            variant="success"
            size="sm"
            className="font-semibold tabular-nums"
          >
            {confidencePercent}% Confidence
          </Badge>
        )}
      </div>

      {/* Executive Summary Box */}
      <div>
        <span className="text-[11px] text-[var(--text-secondary)] font-medium block mb-1">
          Executive summary
        </span>
        <p className="text-xs text-[var(--text-primary)] bg-[var(--surface-subtle)] p-3 rounded-lg border border-[var(--border-subtle)] leading-relaxed">
          {classificationAudit?.summary || 'No AI summary generated for this message.'}
        </p>
      </div>

      {/* Grid of assigned roles, theme, and urgency */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
        <div>
          <span className="text-[var(--text-secondary)] text-[11px] block">Assigned role(s)</span>
          <span
            className="font-semibold text-[var(--text-primary)] capitalize mt-0.5 block truncate"
            title={formatRoles(assignedRoles)}
          >
            {formatRoles(assignedRoles)}
          </span>
        </div>
        <div>
          <span className="text-[var(--text-secondary)] text-[11px] block">Theme</span>
          <span className="font-semibold text-[var(--text-primary)] capitalize mt-0.5 block">
            {themeDisplay}
          </span>
        </div>
        <div>
          <span className="text-[var(--text-secondary)] text-[11px] block">Urgency</span>
          <span className="font-semibold text-[var(--text-primary)] capitalize mt-0.5 block">
            {urgencyDisplay}
          </span>
        </div>
      </div>
    </Card>
  )
}
