"use client";

import Link from "next/link";
import { useRef } from "react";
import { useEditorialReveal } from "@/lib/editorial-reveal";

const PILLARS = [
  {
    num: "01",
    title: "Computer Vision",
    body: "From quality control on the factory floor to inventory tracking in retail — our vision systems see what humans miss and work around the clock.",
    href: "/demos/vision",
    cta: "Try the vision demo",
  },
  {
    num: "02",
    title: "AI Assistants",
    body: "Custom-trained language models that understand your business, speak your customers’ language, and handle the conversations that slow your team down.",
    href: "/demos/chat",
    cta: "Try the assistant demo",
  },
  {
    num: "03",
    title: "Document Intelligence",
    body: "Invoices, receipts, contracts — our extraction pipelines turn stacks of paperwork into structured, searchable data in seconds.",
    href: "/demos/docs",
    cta: "Try the docs demo",
  },
];

export function BrandSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  return (
    <section id={id} ref={sectionRef} className="relative bg-[#0e1418] overflow-visible">

      {/* ── Seam blend — fades the video above into this section ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-64 md:-top-96 h-64 md:h-96 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,20,24,0) 0%, rgba(14,20,24,0.15) 25%, rgba(14,20,24,0.5) 55%, rgba(14,20,24,0.85) 80%, #0e1418 100%)",
        }}
      />
      {/* Brand-tinted seam haze — pulls cyan particles into the section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 md:-top-56 h-40 md:h-56 z-10 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(148,252,255,0.12) 0%, rgba(99,179,237,0.06) 40%, transparent 75%)",
        }}
      />
      {/* Top-edge inner glow at the seam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-40 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(148,252,255,0.08) 0%, rgba(148,252,255,0.02) 40%, transparent 100%)",
        }}
      />
      {/* Hairline accent at the seam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px z-10"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(148,252,255,0.28) 50%, transparent 100%)",
        }}
      />

      {/* ── Section Headline — centered, same style as ThreeShowcase ── */}
      <div className="section-headline flex flex-col items-center justify-center py-8 md:py-20 pointer-events-none">
        <p
          className="editorial-index text-[10px] mt-5 font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3"
          aria-hidden="true"
        >
          01 / WHO WE ARE
        </p>
        <h2
          className="editorial-heading section-headline-title font-normal uppercase tracking-[3px] text-center leading-[1.1] font-[family-name:var(--font-display)]"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 4rem)",
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
              className="editorial-body brand-statement font-normal uppercase leading-[0.92] tracking-[-0.01em] text-white font-[family-name:var(--font-display)]"
              style={{ fontSize: "clamp(1.6rem, 5vw, 4.5rem)" }}
            >
              We build AI solutions{"\n"}
              that transform how{"\n"}
              businesses operate
            </h2>
          </div>

          {/* Right — supporting text + location badge */}
          <div className="md:col-span-5 flex flex-col justify-end gap-4 md:gap-6">
            <p className="editorial-body brand-statement-body text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[400px]">
              NexApex is an AI solutions studio based in Southeast Asia.
              We design, build, and deploy production AI &mdash; from computer vision
              to intelligent assistants &mdash; for businesses ready to move faster
              than their competition.
            </p>
            {/* Location badge */}
            <div className="editorial-body brand-statement-body flex items-center gap-3">
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
            <Link
              key={pillar.num}
              href={pillar.href}
              className="editorial-item pillar-card group relative p-4 md:p-10 border-l-0 md:border-l border-[#94fcff]/10 md:first:border-l-0 border-b border-[#94fcff]/10 md:border-b-0 last:border-b-0 transition-colors duration-500 hover:bg-[#94fcff]/[0.02] focus-visible:outline-none focus-visible:bg-[#94fcff]/[0.04]"
              aria-label={`${pillar.cta} — ${pillar.title}`}
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

              {/* CTA — arrow that nudges right on hover */}
              <span className="mt-4 md:mt-8 inline-flex items-center gap-2 text-[10px] md:text-[11px] font-mono uppercase tracking-[2px] text-[#94fcff]/70 group-hover:text-[#94fcff] transition-colors duration-300">
                {pillar.cta}
                <svg
                  width="22"
                  height="8"
                  viewBox="0 0 22 8"
                  fill="none"
                  aria-hidden="true"
                  className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
                >
                  <path
                    d="M0 4H21M21 4L17 1M21 4L17 7"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="square"
                  />
                </svg>
              </span>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-6 md:left-10 right-6 md:right-10 h-px bg-[#94fcff]/0 group-hover:bg-[#94fcff]/30 transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>

    </section>
  );
}
