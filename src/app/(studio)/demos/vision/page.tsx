import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { VisionInspectorLoader } from "@/components/demos/VisionInspectorLoader";

export default function VisionPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Ambient gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[#94fcff]/[0.02] blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[#94fcff]/[0.015] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#94fcff]/[0.01] blur-[80px]" />
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
          Vision Inspector
        </span>
      </div>

      {/* Hero section */}
      <div className="px-4 pt-10 pb-8 sm:pt-12 sm:pb-10 md:px-[60px]">
        {/* Label */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#94fcff]/10">
            <Eye size={16} className="text-[#94fcff]" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#94fcff]/70">
            AI Demo
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] uppercase tracking-wider text-white leading-none">
          Vision Inspector
        </h1>

        {/* Description */}
        <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-nex-text/60">
          Upload an image to see real-time object detection. Our model identifies objects, counts them, and shows how custom AI could work for your business.
        </p>
      </div>

      {/* Workspace */}
      <div className="flex-1 px-4 pb-12 md:px-[60px]">
        <VisionInspectorLoader />
      </div>
    </div>
  );
}
