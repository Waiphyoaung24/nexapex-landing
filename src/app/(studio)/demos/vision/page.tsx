import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { VisionInspectorLoader } from "@/components/demos/VisionInspectorLoader";

export default function VisionPage() {
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
          Vision Inspector
        </span>
      </div>

      {/* Hero section */}
      <div className="px-4 pt-8 pb-6 md:px-[60px]">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#94fcff]/10">
            <Eye size={20} className="text-[#94fcff]" />
          </div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
            Vision Inspector
          </h1>
        </div>
        <p className="max-w-xl text-sm text-nex-dim">
          Upload an image or try a sample to see real-time AI object detection. Our model identifies objects, counts them, and shows how custom AI could work for your business.
        </p>
      </div>

      {/* Workspace */}
      <div className="flex-1 px-4 pb-12 md:px-[60px]">
        <VisionInspectorLoader />
      </div>
    </div>
  );
}
