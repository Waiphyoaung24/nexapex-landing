export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-white/[0.04]" />
            <div
              className={`h-16 animate-pulse rounded-2xl bg-white/[0.04] ${
                i % 2 === 0 ? "w-1/3" : "w-2/3"
              }`}
            />
          </div>
        ))}
      </div>
      {/* Input skeleton */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
