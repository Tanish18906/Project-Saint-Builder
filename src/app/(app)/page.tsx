import { WorkspaceEmpty } from '@/components/queue/workspace-empty'

/**
 * `/` — the queue with no email open. The queue pane itself (Review, Urgent,
 * All mail, Handled via the `view` param) is rendered by MailFrame in the
 * layout so it persists while emails open beside it; this page is the empty
 * workspace.
 */
export default function QueuePage() {
  return <WorkspaceEmpty />
}
