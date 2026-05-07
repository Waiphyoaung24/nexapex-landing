"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

/* ── CTA Section ── */
export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const tagline = section.querySelector(".cta-tagline");
    if (tagline) {
      gsap.from(tagline, {
        y: 20, autoAlpha: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 60%", toggleActions: "play none none reverse" },
      });
    }

    const heading = section.querySelector(".cta-heading");
    if (heading) {
      const split = SplitText.create(heading, { type: "words" });
      split.words.forEach((word) => {
        const el = word as HTMLElement;
        el.style.background = "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)";
        (el.style as unknown as Record<string, string>).webkitBackgroundClip = "text";
        (el.style as unknown as Record<string, string>).webkitTextFillColor = "transparent";
        el.style.backgroundClip = "text";
      });
      gsap.from(split.words, {
        y: 80,
        autoAlpha: 0,
        rotateX: -60,
        stagger: 0.08,
        duration: 1.0,
        ease: "power4.out",
        scrollTrigger: { trigger: section, start: "top 55%", toggleActions: "play none none reverse" },
      });
    }

    const cta = section.querySelector(".cta-button");
    if (cta) {
      gsap.from(cta, {
        y: 30, autoAlpha: 0, duration: 0.6, delay: 0.4, ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 55%", toggleActions: "play none none reverse" },
      });
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0e1418] text-white"
    >
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:py-32 md:px-[60px] lg:py-48">
        {/* Tagline */}
        <p className="cta-tagline text-[10px] sm:text-[11px] font-mono uppercase tracking-[3px] sm:tracking-[4px] text-white/70 mb-4 sm:mb-6">
          Ready to see AI in action?
        </p>

        {/* Main heading */}
        <h2
          className="cta-heading font-[family-name:var(--font-display)] uppercase text-center leading-[0.95] tracking-[-0.01em] text-white"
          style={{ fontSize: "clamp(1.8rem, 7vw, 7rem)" }}
        >
          Let&apos;s build<br />something real.
        </h2>

        {/* Primary CTA */}
        <a
          href="mailto:nexuslab.dev.mm@gmail.com"
          className={cn(
            "cta-button mt-8 sm:mt-12 z-10 group",
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
