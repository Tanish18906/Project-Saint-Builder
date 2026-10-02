export default function LoadingHomeCommandCentre() {
  return (
    <div className="space-y-6 animate-pulse select-none">
        {/* Header Skeleton */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="h-4 w-44 bg-[var(--surface-subtle)] rounded" />
            <div className="h-6 w-28 bg-[var(--surface-subtle)] rounded-full" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-60 bg-[var(--surface-subtle)] rounded-lg" />
              <div className="h-4 w-48 bg-[var(--surface-subtle)] rounded" />
            </div>
            <div className="flex gap-2.5">
              <div className="h-10 w-32 bg-[var(--surface-subtle)] rounded-lg" />
              <div className="h-10 w-36 bg-[var(--surface-subtle)] rounded-lg" />
            </div>
          </div>
        </div>

        {/* 4 Metric Cards Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-subtle)]" />
                <div className="w-4 h-4 rounded bg-[var(--surface-subtle)]" />
              </div>
              <div className="h-8 w-16 bg-[var(--surface-subtle)] rounded" />
              <div className="h-4 w-32 bg-[var(--surface-subtle)] rounded" />
              <div className="h-3 w-24 bg-[var(--surface-subtle)] rounded" />
            </div>
          ))}
        </div>

        {/* Main Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column (8 cols): Needs Attention Skeletons */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-[var(--surface-subtle)] rounded" />
              <div className="h-4 w-28 bg-[var(--surface-subtle)] rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-[var(--surface-subtle)] rounded" />
                  <div className="h-3 w-16 bg-[var(--surface-subtle)] rounded" />
                </div>
                <div className="h-5 w-3/4 bg-[var(--surface-subtle)] rounded" />
                <div className="h-3 w-full bg-[var(--surface-subtle)] rounded" />
                <div className="flex gap-2 pt-1">
                  <div className="h-5 w-16 bg-[var(--surface-subtle)] rounded-full" />
                  <div className="h-5 w-20 bg-[var(--surface-subtle)] rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Right Column (4 cols): Side Panels Skeletons */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-[var(--surface-subtle)] rounded" />
                <div className="h-4 w-20 bg-[var(--surface-subtle)] rounded" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-16 bg-[var(--surface-subtle)] rounded-lg" />
                <div className="h-16 bg-[var(--surface-subtle)] rounded-lg" />
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-[var(--surface-subtle)] rounded" />
                <div className="h-4 w-24 bg-[var(--surface-subtle)] rounded" />
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-subtle)] shrink-0" />
                    <div className="space-y-1 w-full">
                      <div className="h-3 w-3/4 bg-[var(--surface-subtle)] rounded" />
                      <div className="h-2.5 w-1/2 bg-[var(--surface-subtle)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
