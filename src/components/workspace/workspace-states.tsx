'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { MailQuestion, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton'
import { useMail } from '@/components/queue/mail-context'
import { VIEW_TITLE } from '@/components/queue/queue-view'
import { WorkspaceToolbar } from './workspace-toolbar'

/**
 * The workspace column: its own scroll area beside the queue (≥1280), the
 * page itself below that. A size container, so its layout follows its own
 * width (sidebar open or collapsed), not the window's.
 */
export const workspaceFrame =
  'fm-scroll @container relative flex min-w-0 flex-1 flex-col bg-panel xl:sticky xl:top-0 xl:h-dvh xl:overflow-y-auto'

function useBack() {
  const router = useRouter()
  const { params, queueHref } = useMail()
  return { label: VIEW_TITLE[params.view], onBack: () => router.push(queueHref) }
}

/** The email doesn't exist (deleted, or a wrong link). */
export function WorkspaceUnavailable() {
  const back = useBack()
  return (
    <section aria-labelledby="email-subject" className={workspaceFrame}>
      <WorkspaceToolbar backLabel={back.label} onBack={back.onBack} />
      <h1 id="email-subject" className="sr-only">
        Email not available
      </h1>
      <EmptyState
        layout="page"
        icon={<MailQuestion />}
        title="This email isn’t available"
        description="It may have been removed, or the link is incomplete. Nothing was changed."
        action={
          <Button variant="secondary" size="sm" onClick={back.onBack}>
            Back to {back.label}
          </Button>
        }
      />
    </section>
  )
}

/** The email couldn't be read (database or network failure). */
export function WorkspaceLoadError() {
  const back = useBack()
  const router = useRouter()
  const [retrying, setRetrying] = React.useState(false)
  return (
    <section aria-labelledby="email-subject" className={workspaceFrame}>
      <WorkspaceToolbar backLabel={back.label} onBack={back.onBack} />
      <h1 id="email-subject" className="sr-only">
        Email couldn’t be loaded
      </h1>
      <ErrorState
        layout="page"
        title="Couldn’t load this email"
        description="Check your connection and try again. Nothing was changed."
        action={
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<RotateCcw />}
            loading={retrying}
            onClick={() => {
              setRetrying(true)
              router.refresh()
              setTimeout(() => setRetrying(false), 1000)
            }}
          >
            Try again
          </Button>
        }
      />
    </section>
  )
}

/** Same shape as the loaded workspace: toolbar, header, triage, body, reply. */
export function WorkspaceSkeleton({ className }: { className?: string }) {
  return (
    <section aria-label="Loading email" className={cn(workspaceFrame, className)}>
      <div className="flex h-(--fm-c-topbar-h) shrink-0 items-center gap-2 border-b border-line px-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <SkeletonRegion label="Loading email…" className="space-y-6 px-4 py-5 sm:px-6">
        <div className="space-y-2.5">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="max-w-(--fm-c-reading-max) space-y-2 border-t border-line pt-5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <div className="space-y-2 border-t border-line pt-5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </SkeletonRegion>
    </section>
  )
}
