export default function EmailDetailLoading() {
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
        {/* Back header skeleton */}
        <div className="h-12 bg-white rounded-lg border border-[#e8e2d4] p-4 shadow-sm flex items-center justify-between animate-pulse">
          <div className="h-4 w-28 bg-stone-200 rounded" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-stone-100 rounded" />
            <div className="h-5 w-20 bg-stone-100 rounded" />
          </div>
        </div>

        {/* Two column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left column */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#e8e2d4] p-6 shadow-sm space-y-4 animate-pulse">
            <div className="h-6 w-3/4 bg-stone-200 rounded" />
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#e8e2d4]">
              <div className="h-4 w-32 bg-stone-100 rounded" />
              <div className="h-4 w-32 bg-stone-100 rounded" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-stone-100 rounded" />
              <div className="h-4 w-full bg-stone-100 rounded" />
              <div className="h-4 w-2/3 bg-stone-100 rounded" />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-3 animate-pulse">
              <div className="h-4 w-36 bg-stone-200 rounded" />
              <div className="h-16 w-full bg-stone-100 rounded" />
            </div>

            <div className="bg-white rounded-lg border border-[#e8e2d4] p-5 shadow-sm space-y-4 animate-pulse">
              <div className="h-4 w-36 bg-stone-200 rounded" />
              <div className="h-44 w-full bg-stone-100 rounded" />
              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-stone-200 rounded" />
                <div className="h-9 w-24 bg-stone-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
