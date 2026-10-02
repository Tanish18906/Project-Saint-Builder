export default function LoadingApprovals() {
  return (
    <div className="space-y-6 animate-pulse">
        {/* Header Summary Card Skeleton */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-6 w-44 bg-[var(--surface-subtle)] rounded-md" />
              <div className="h-4 w-72 bg-[var(--surface-subtle)] rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-28 bg-[var(--surface-subtle)] rounded-lg" />
              <div className="h-7 w-24 bg-[var(--surface-subtle)] rounded-lg" />
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <div className="h-9 w-64 bg-[var(--surface-subtle)] rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-[var(--surface-subtle)] rounded-md" />
              <div className="h-8 w-24 bg-[var(--surface-subtle)] rounded-md" />
              <div className="h-8 w-28 bg-[var(--surface-subtle)] rounded-md" />
            </div>
          </div>
        </div>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-36 bg-[var(--surface-subtle)] rounded" />
          <div className="h-3 w-40 bg-[var(--surface-subtle)] rounded" />
        </div>

        {/* Queue Card Skeletons */}
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 bg-[var(--surface-subtle)] rounded" />
                  <div className="h-5 w-24 bg-[var(--surface-subtle)] rounded" />
                  <div className="h-5 w-32 bg-[var(--surface-subtle)] rounded" />
                </div>
                <div className="h-4 w-16 bg-[var(--surface-subtle)] rounded" />
              </div>

              <div className="space-y-1.5">
                <div className="h-4 w-48 bg-[var(--surface-subtle)] rounded" />
                <div className="h-5 w-3/4 bg-[var(--surface-subtle)] rounded" />
              </div>

              <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-2">
                <div className="h-4 w-28 bg-[var(--surface)] rounded" />
                <div className="h-10 w-full bg-[var(--surface)] rounded" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-44 bg-[var(--surface-subtle)] rounded" />
                <div className="h-8 w-32 bg-[var(--surface-subtle)] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
  )
}
