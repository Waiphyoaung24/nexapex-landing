import Link from "next/link";

export function StudioHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e1418]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/images/Flat_white.png"
            alt="NexApex"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-bold uppercase font-[family-name:var(--font-display)] tracking-[2px] text-white">
            AI Studio
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/demos"
            className="text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            Demos
          </Link>
          <a
            href="mailto:support@nexapex.ai"
            className="rounded-full bg-[#94fcff] px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] hover:bg-[#b0fdff] transition-colors"
          >
            Book a Call
          </a>
        </div>
      </div>
    </header>
  );
}
