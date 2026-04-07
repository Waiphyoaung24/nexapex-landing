"use client";

export function VisionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Image area with scanning line */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl glass-panel">
        {/* Subtle image placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

        {/* Scanning line */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="vision-scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#94fcff]/40 to-transparent shadow-[0_0_12px_rgba(148,252,255,0.3)]" />
        </div>

        {/* Center analyzing text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff] animate-spin" />
          <p className="text-xs font-mono uppercase tracking-[2px] text-[#94fcff]/60">
            Analyzing<span className="inline-block w-4 text-left animate-pulse">...</span>
          </p>
        </div>
      </div>

      {/* Stats sidebar skeleton */}
      <div className="flex flex-col gap-4">
        {/* Stat cards shimmer */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl glass-panel p-4 text-center"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="mx-auto h-7 w-10 rounded-md vision-shimmer" />
              <div className="mx-auto mt-2 h-3 w-14 rounded vision-shimmer" />
            </div>
          ))}
        </div>

        {/* Detection list shimmer */}
        <div className="flex-1 space-y-2 rounded-xl glass-panel p-4">
          <div className="mb-3 h-3 w-20 rounded vision-shimmer" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-3 w-16 rounded vision-shimmer" />
              <div className="h-1.5 flex-1 rounded-full vision-shimmer" />
              <div className="h-3 w-8 rounded vision-shimmer" />
            </div>
          ))}
        </div>

        {/* Suggestion card placeholder */}
        <div className="rounded-2xl glass-panel-accent p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl vision-shimmer" />
            <div className="space-y-2">
              <div className="h-2 w-32 rounded vision-shimmer" />
              <div className="h-3 w-44 rounded vision-shimmer" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 w-full rounded vision-shimmer" />
            <div className="h-3 w-3/4 rounded vision-shimmer" />
          </div>
          <div className="h-9 w-48 rounded-full vision-shimmer" />
        </div>
      </div>
    </div>
  );
}
