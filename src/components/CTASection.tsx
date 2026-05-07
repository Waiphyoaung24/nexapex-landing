"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useEditorialReveal } from "@/lib/editorial-reveal";
import { cn } from "@/lib/utils";

export function CTASection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef, {
    hasIndex: false,
    bodyBeforeHeading: true,
  });

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0e1418] text-white"
    >
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:py-32 md:px-[60px] lg:py-48">
        {/* Tagline */}
        <p className="editorial-body cta-tagline text-[10px] sm:text-[11px] font-mono uppercase tracking-[3px] sm:tracking-[4px] text-white/70 mb-4 sm:mb-6">
          Ready to see AI in action?
        </p>

        {/* Main heading */}
        <h2
          className="editorial-heading cta-heading font-[family-name:var(--font-display)] uppercase text-center leading-[0.95] tracking-[-0.01em] text-white"
          style={{
            fontSize: "clamp(1.8rem, 7vw, 7rem)",
            background:
              "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Let&apos;s build<br />something real.
        </h2>

        {/* Primary CTA */}
        <a
          href="mailto:nexuslab.dev.mm@gmail.com"
          className={cn(
            "editorial-item cta-button mt-8 sm:mt-12 z-10 group",
            "flex items-center gap-2 sm:gap-3",
            "rounded-full bg-white px-6 py-3 sm:px-8 sm:py-4",
            "font-mono text-[11px] sm:text-[12px] font-medium uppercase tracking-[1px] text-[#0e1418]",
            "cursor-pointer transition-all duration-300",
            "hover:bg-white/95 hover:shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:scale-[1.03]",
            "active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Book a Consultation
          <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </section>
  );
}
