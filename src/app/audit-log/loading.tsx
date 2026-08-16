export default function AuditLogLoading() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      {/* Shell Header */}
      <header className="bg-[#1c1a17] text-[#f5f1e8] h-16 border-b border-[#2a2723] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 bg-[#2a2723] rounded animate-pulse" />
        </div>
        <div className="h-8 w-28 bg-[#2a2723] rounded animate-pulse" />
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Bar Skeleton */}
        <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-[#e8e2d4]">
            <div className="h-7 w-28 bg-stone-200 rounded animate-pulse" />
            <div className="h-7 w-28 bg-stone-100 rounded animate-pulse" />
            <div className="h-7 w-28 bg-stone-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-64 bg-stone-100 rounded animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-[#e8e2d4] shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-10 w-full bg-stone-100 rounded animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  )
}
