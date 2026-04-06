"use client";

import dynamic from "next/dynamic";

const VisionInspector = dynamic(
  () =>
    import("@/components/demos/VisionInspector").then((m) => ({
      default: m.VisionInspector,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff]" />
      </div>
    ),
  }
);

export function VisionInspectorLoader() {
  return <VisionInspector />;
}
