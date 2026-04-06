"use client";

import { useRef } from "react";
import { Lightbulb } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(card, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      card,
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.7, delay: 1.5, ease: "power3.out" }
    );
  }, [suggestion]);

  return (
    <div
      ref={cardRef}
      className="invisible rounded-2xl border border-[#94fcff]/20 bg-[#94fcff]/5 p-6 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#94fcff]/10">
          <Lightbulb size={20} className="text-[#94fcff]" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-[#94fcff]/60">
            What this means for your business
          </p>
          <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
            {suggestion.title}
          </h3>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-nex-dim">
        {suggestion.pitch}
      </p>

      <a
        href="mailto:hello@nexapex.ai?subject=AI%20Vision%20Demo%20Inquiry"
        className="inline-flex cursor-pointer items-center rounded-full bg-[#94fcff] px-5 py-2.5 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] transition-all duration-200 hover:bg-[#b0fdff] hover:shadow-[0_0_16px_rgba(148,252,255,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-full"
      >
        {suggestion.cta_text}
      </a>
    </div>
  );
}
