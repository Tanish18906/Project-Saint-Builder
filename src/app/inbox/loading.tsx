import { AppShell } from '@/components/shell'

export default function InboxLoading() {
  return (
    <AppShell currentPath="/inbox">
      <div className="space-y-4 animate-pulse">
        {/* Filter bar skeleton */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex gap-2">
              <div className="h-8 w-28 bg-[var(--surface-subtle)] rounded-lg" />
              <div className="h-8 w-32 bg-[var(--surface-subtle)] rounded-lg" />
            </div>
            <div className="h-6 w-24 bg-[var(--surface-subtle)] rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="h-10 bg-[var(--surface-subtle)] rounded-lg sm:col-span-2" />
            <div className="h-10 bg-[var(--surface-subtle)] rounded-lg" />
            <div className="h-10 bg-[var(--surface-subtle)] rounded-lg" />
          </div>
        </div>

        {/* Email list skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 bg-[var(--surface-subtle)] rounded" />
                  <div className="h-4 w-20 bg-[var(--surface-subtle)] rounded" />
                </div>
                <div className="h-3 w-16 bg-[var(--surface-subtle)] rounded" />
              </div>
              <div className="h-4 w-3/4 bg-[var(--surface-subtle)] rounded" />
              <div className="h-3 w-full bg-[var(--surface-subtle)] rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-16 bg-[var(--surface-subtle)] rounded-full" />
                <div className="h-5 w-20 bg-[var(--surface-subtle)] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
