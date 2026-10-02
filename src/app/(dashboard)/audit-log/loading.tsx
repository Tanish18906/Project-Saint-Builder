export default function LoadingAuditLog() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Summary Card Skeleton */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[var(--surface-subtle)] rounded-md" />
            <div className="h-4 w-80 bg-[var(--surface-subtle)] rounded-md" />
          </div>
          <div className="h-7 w-28 bg-[var(--surface-subtle)] rounded-lg" />
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="h-9 w-64 bg-[var(--surface-subtle)] rounded-lg" />
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-20 bg-[var(--surface-subtle)] rounded-md" />
            <div className="h-7 w-20 bg-[var(--surface-subtle)] rounded-md" />
            <div className="h-7 w-20 bg-[var(--surface-subtle)] rounded-md" />
            <div className="h-7 w-20 bg-[var(--surface-subtle)] rounded-md" />
          </div>
        </div>
      </div>

      {/* Section Header Skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="h-4 w-36 bg-[var(--surface-subtle)] rounded" />
        <div className="h-3 w-40 bg-[var(--surface-subtle)] rounded" />
      </div>

      {/* Desktop Table / Mobile Feed Skeleton */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-xs">
        <div className="h-10 bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)]" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 border-b border-[var(--border-subtle)] last:border-b-0 flex items-center justify-between gap-4"
          >
            <div className="h-4 w-28 bg-[var(--surface-subtle)] rounded" />
            <div className="h-5 w-24 bg-[var(--surface-subtle)] rounded" />
            <div className="h-4 w-48 bg-[var(--surface-subtle)] rounded" />
            <div className="h-4 w-28 bg-[var(--surface-subtle)] rounded" />
            <div className="h-4 w-40 bg-[var(--surface-subtle)] rounded hidden md:block" />
            <div className="h-6 w-8 bg-[var(--surface-subtle)] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
