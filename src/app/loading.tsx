export default function InboxLoading() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c1a17]">
      {/* Shell Header Skeleton */}
      <header className="bg-[#1c1a17] text-[#f5f1e8] h-16 border-b border-[#2a2723] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 bg-[#2a2723] rounded animate-pulse" />
          <div className="h-4 w-16 bg-[#2a2723] rounded animate-pulse hidden sm:block" />
        </div>
        <div className="h-8 w-28 bg-[#2a2723] rounded animate-pulse" />
      </header>

      {/* Main Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Card Skeleton */}
        <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-[#e8e2d4]">
            <div className="h-7 w-36 bg-stone-200 rounded animate-pulse" />
            <div className="h-7 w-40 bg-stone-100 rounded animate-pulse" />
            <div className="h-7 w-40 bg-stone-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-64 bg-stone-100 rounded animate-pulse" />
            <div className="h-9 w-32 bg-stone-100 rounded animate-pulse" />
            <div className="h-9 w-32 bg-stone-100 rounded animate-pulse" />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm space-y-2.5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 bg-stone-200 rounded" />
                <div className="h-4 w-24 bg-stone-100 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-stone-200 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
