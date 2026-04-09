"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

const PILLARS = [
  {
    num: "01",
    title: "Computer Vision",
    body: "From quality control on the factory floor to inventory tracking in retail \u2014 our vision systems see what humans miss and work around the clock.",
  },
  {
    num: "02",
    title: "AI Assistants",
    body: "Custom-trained language models that understand your business, speak your customers\u2019 language, and handle the conversations that slow your team down.",
  },
  {
    num: "03",
    title: "Document Intelligence",
    body: "Invoices, receipts, contracts \u2014 our extraction pipelines turn stacks of paperwork into structured, searchable data in seconds.",
  },
];

export function BrandSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // ─── Section headline — SplitText char reveal (one ScrollTrigger) ───
    // Gradient is applied via CSS class (.section-headline-title) so we
    // skip the JS style writes that previously thrashed layout per-char.
    const headlineTitle = section.querySelector<HTMLElement>(".section-headline-title");
    const headlineWrap = section.querySelector<HTMLElement>(".section-headline");
    let headlineSplit: SplitText | null = null;
    if (headlineTitle) {
      headlineSplit = SplitText.create(headlineTitle, { type: "chars" });
      gsap.from(headlineSplit.chars, {
        yPercent: 100,
        autoAlpha: 0,
        rotateX: -90,
        stagger: 0.04,
        duration: 1.0,
        ease: "power4.out",
        force3D: true,
        scrollTrigger: {
          trigger: headlineWrap,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // ─── Statement reveal — scroll-scrubbed word highlight ───
    // OLD: animated `color` + `textShadow` per word → both are PAINT
    //      properties, repainted every scroll tick. Massive jank.
    // NEW: one CSS variable `--lit` is animated 0 → 1, words use opacity
    //      (composited) + a fixed final color. Single property, GPU only.
    const statementTitle = section.querySelector<HTMLElement>(".brand-statement");
    let statementSplit: SplitText | null = null;
    if (statementTitle) {
      statementSplit = SplitText.create(statementTitle, { type: "lines, words" });
      const words = statementSplit.words as HTMLElement[];

      // Pre-style words ONCE (no per-frame style writes)
      words.forEach((word) => {
        word.style.display = "inline-block";
        word.style.color = "#d4eef0";
        word.style.opacity = "0.15";
        word.style.willChange = "opacity";
      });

      gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: { each: 0.08, from: "start" },
        scrollTrigger: {
          trigger: statementTitle,
          start: "top 75%",
          end: "bottom 40%",
          scrub: 1,
        },
      });
    }

    // ─── Statement body (right column) — single ScrollTrigger ───
    const statementBody = section.querySelectorAll<HTMLElement>(".brand-statement-body");
    if (statementBody.length) {
      gsap.from(statementBody, {
        yPercent: 30,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: statementBody[0],
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // ─── Pillar cards — ONE ScrollTrigger with stagger (was 3) ───
    const pillars = section.querySelectorAll<HTMLElement>(".pillar-card");
    if (pillars.length) {
      gsap.from(pillars, {
        yPercent: 40,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        force3D: true,
        scrollTrigger: {
          trigger: pillars[0],
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // ─── Divider draw — ONE ScrollTrigger with stagger (was 2) ───
    const dividers = section.querySelectorAll<HTMLElement>(".brand-divider");
    if (dividers.length) {
      gsap.from(dividers, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1,
        stagger: 0.1,
        ease: "power2.inOut",
        force3D: true,
        scrollTrigger: {
          trigger: dividers[0],
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // Cleanup splits on re-run / unmount to avoid leaking DOM nodes
    return () => {
      headlineSplit?.revert();
      statementSplit?.revert();
    };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative bg-[#0e1418] overflow-hidden">

      {/* ── Section Headline — centered, same style as ThreeShowcase ── */}
      <div className="section-headline flex flex-col items-center justify-center py-8 md:py-20 pointer-events-none">
        <p className="text-[10px] mt-5 font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3">
          Discover
        </p>
        <h2
          className="section-headline-title font-normal uppercase tracking-[3px] text-center leading-[1.1] font-[family-name:var(--font-display)]"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 4rem)",
            // Gradient applied via background-clip — handled in CSS so we
            // skip per-char JS style writes from SplitText.
            background:
              "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          Who We Are
        </h2>
        <div className="mt-4 h-px w-12 md:w-16 bg-[#94fcff]/30" />
      </div>

      {/* ── 1. Brand Statement ── */}
      <div className="px-5 md:px-[60px] pb-6 md:pb-16">
        <div className="brand-divider h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-6 md:mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-16">
          {/* Left — large statement */}
          <div className="md:col-span-7">
            <h2
              className="brand-statement font-normal uppercase leading-[0.92] tracking-[-0.01em] text-white font-[family-name:var(--font-display)]"
              style={{ fontSize: "clamp(1.6rem, 5vw, 4.5rem)" }}
            >
              We build AI solutions{"\n"}
              that transform how{"\n"}
              businesses operate
            </h2>
          </div>

          {/* Right — supporting text + location badge */}
          <div className="md:col-span-5 flex flex-col justify-end gap-4 md:gap-6">
            <p className="brand-statement-body text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[400px]">
              NexApex is an AI solutions studio based in Southeast Asia.
              We design, build, and deploy production AI &mdash; from computer vision
              to intelligent assistants &mdash; for businesses ready to move faster
              than their competition.
            </p>
            {/* Location badge */}
            <div className="brand-statement-body flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#94fcff]/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#94fcff]" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]/70">
                Based in Bangkok, Thailand
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Three Pillars ── */}
      <div className="px-5 md:px-[60px] pb-6 md:pb-16">
        <div className="brand-divider h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-6 md:mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="pillar-card group relative p-4 md:p-10 border-l-0 md:border-l border-[#94fcff]/10 md:first:border-l-0 border-b border-[#94fcff]/10 md:border-b-0 last:border-b-0"
            >
              {/* Number */}
              <span className="block text-[11px] font-mono text-[#94fcff]/30 tracking-wider mb-2 md:mb-6">
                {pillar.num}
              </span>

              {/* Title */}
              <h3 className="text-base md:text-xl font-normal uppercase tracking-[1px] text-white font-[family-name:var(--font-display)] mb-2 md:mb-4">
                {pillar.title}
              </h3>

              {/* Body */}
              <p className="text-[12px] md:text-[13px] leading-[1.5] md:leading-[1.7] text-white/55">
                {pillar.body}
              </p>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-6 md:left-10 right-6 md:right-10 h-px bg-[#94fcff]/0 group-hover:bg-[#94fcff]/20 transition-colors duration-500" />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
