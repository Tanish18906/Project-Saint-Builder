import { WorkspaceSkeleton } from '@/components/workspace/workspace-states'

/** Opening an email: the workspace takes its shape at once; the queue beside it stays put. */
export default function LoadingEmail() {
  return <WorkspaceSkeleton />
}
