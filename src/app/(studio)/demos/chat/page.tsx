import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Breadcrumb toolbar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim hover:text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-sm"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Smart Assistant
        </span>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <MessageCircle size={32} className="mx-auto mb-4 text-[#94fcff]/20" />
          <p className="text-sm text-nex-dim">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
