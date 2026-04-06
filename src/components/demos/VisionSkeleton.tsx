"use client";

export function VisionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-white/5" />

      {/* Stats placeholder */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="flex-1 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
