'use client';

export default function RecipeCardSkeleton() {
  return (
    <div className="rounded-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 hover:ring-8 hover:ring-amber-200 hover:shadow-md transition-shadow">
      <div className="w-full" style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#eee' }}>
        <div className="h-full w-full animate-pulse bg-[#e5e7eb]" />
      </div>
      <div className="px-1 pt-2 pb-1">
        <div className="h-4 bg-[#e5e7eb] rounded w-2/3 animate-pulse" />
        <div className="mt-2 h-3 bg-[#f1f5f9] rounded w-5/6 animate-pulse" />
      </div>
      <div className="px-1 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 bg-[#f1f5f9] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-7 w-7 rounded-full bg-[#e5e7eb]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}


