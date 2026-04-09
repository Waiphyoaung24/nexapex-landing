export function ChatSkeleton() {
  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 md:px-6">
        <div className="h-7 w-[110px] animate-pulse rounded-full bg-white/[0.04]" />
        <div className="h-5 w-12 animate-pulse rounded bg-white/[0.04]" />
      </div>

      {/* Empty-state skeleton */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="h-24 w-24 animate-pulse rounded-full bg-white/[0.03]" />
        <div className="h-3 w-28 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-8 w-72 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-8 w-56 animate-pulse rounded bg-white/[0.04]" />

        <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[68px] animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
      </div>

      {/* Composer skeleton */}
      <div className="px-4 pb-5 pt-2 md:px-6 md:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="h-[60px] animate-pulse rounded-2xl border border-white/[0.06] bg-[#0e1418]/60" />
          <div className="mt-3 flex justify-between">
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.03]" />
            <div className="h-3 w-32 animate-pulse rounded bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </div>
  );
}
