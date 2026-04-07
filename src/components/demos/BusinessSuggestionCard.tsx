"use client";

import { ArrowRight } from "lucide-react";

interface BusinessSuggestion {
  industry: string;
  title: string;
  pitch: string;
  cta_text: string;
}

interface BusinessSuggestionCardProps {
  suggestion: BusinessSuggestion;
}

export function BusinessSuggestionCard({ suggestion }: BusinessSuggestionCardProps) {
  return (
    <div className="rounded-xl border border-[#94fcff]/10 bg-nex-surface/80 p-5 sm:p-6 animate-[fadeInUp_0.5s_ease-out_1.2s_both]">
      {/* Label */}
      <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim mb-2">
        What this means for your business
      </p>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-semibold font-[family-name:var(--font-display)] text-white leading-snug mb-3">
        {suggestion.title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-nex-text/80 mb-5">
        {suggestion.pitch}
      </p>

      {/* CTA */}
      <a
        href="mailto:hello@nexapex.ai?subject=AI%20Vision%20Demo%20Inquiry"
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#94fcff] px-4 py-2.5 text-xs font-medium text-[#0e1418] transition-all duration-200 hover:bg-[#b0fdff] hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60"
      >
        {suggestion.cta_text}
        <ArrowRight size={14} />
      </a>
    </div>
  );
}
