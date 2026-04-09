import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatInterfaceLoader } from "@/components/demos/ChatInterfaceLoader";

export default function ChatPage() {
  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col">
      {/* Ambient gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[#94fcff]/[0.02] blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[#94fcff]/[0.015] blur-[100px]" />
      </div>

      {/* Breadcrumb toolbar */}
      <div className="glass-panel flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex cursor-pointer items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-sm"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Smart Assistant
        </span>
      </div>

      {/* Chat workspace — takes full remaining height */}
      <div className="flex-1 overflow-hidden">
        <ChatInterfaceLoader />
      </div>
    </div>
  );
}
