"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useEditorialReveal } from "@/lib/editorial-reveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

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
  {
    num: "04",
    title: "Predictive Analytics",
    body: "Forecast demand, detect anomalies, and surface signals from your operational data — before they become problems.",
    href: "#",
    cta: "Talk to us",
  },
  {
    num: "05",
    title: "Workflow Automation",
    body: "Agentic systems that handle approvals, routing, and data entry — your team stays focused on the work that actually matters.",
    href: "#",
    cta: "Talk to us",
  },
];

type Pillar = (typeof PILLARS)[number];

function PillarCard({ pillar }: { pillar: Pillar }) {
  return (
    <Link
      href={pillar.href}
      className="editorial-item pillar-card group relative block h-full p-6 md:p-12 border border-[#94fcff]/10 transition-colors duration-500 hover:bg-[#94fcff]/[0.03] focus-visible:outline-none focus-visible:bg-[#94fcff]/[0.05]"
      aria-label={`${pillar.cta} — ${pillar.title}`}
    >
      <span className="block text-[11px] font-mono text-[#94fcff]/30 tracking-wider mb-3 md:mb-8">
        {pillar.num}
      </span>
      <h3 className="text-base md:text-2xl font-normal uppercase tracking-[1px] text-white font-[family-name:var(--font-display)] mb-2 md:mb-5">
        {pillar.title}
      </h3>
      <p className="text-[12px] md:text-[14px] leading-[1.5] md:leading-[1.75] text-white/55 max-w-[440px]">
        {pillar.body}
      </p>
      <span className="mt-4 md:mt-10 inline-flex items-center gap-2 text-[10px] md:text-[11px] font-mono uppercase tracking-[2px] text-[#94fcff]/70 group-hover:text-[#94fcff] transition-colors duration-300">
        {pillar.cta}
        <svg
          width="22"
          height="8"
          viewBox="0 0 22 8"
          fill="none"
          aria-hidden="true"
          className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
        >
          <path d="M0 4H21M21 4L17 1M21 4L17 7" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
        </svg>
      </span>
      <div className="absolute bottom-0 left-6 md:left-12 right-6 md:right-12 h-px bg-[#94fcff]/0 group-hover:bg-[#94fcff]/30 transition-colors duration-500" />
    </Link>
  );
}

export function BrandSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const horizontalWrapRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);

  useEditorialReveal(sectionRef);

  useGSAP(
    () => {
      const wrap = horizontalWrapRef.current;
      const track = horizontalTrackRef.current;
      if (!wrap || !track) return;
      if (window.matchMedia("(max-width: 767px)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const getDistance = () =>
        Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef },
  );

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
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#94fcff]/60" />
                <span className="relative inline-flex size-2 rounded-full bg-[#94fcff]" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]/70">
                Based in Bangkok, Thailand
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Three Pillars ── */}
      {/* Mobile: stacked grid */}
      <div className="md:hidden px-5 pb-6">
        <div className="brand-divider h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-6" />
        <div className="grid grid-cols-1 gap-px">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.num} pillar={pillar} />
          ))}
        </div>
      </div>

      {/* Desktop: horizontal pinned scroll */}
      <div ref={horizontalWrapRef} className="hidden md:block relative">
        <div className="brand-divider h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-12 mx-[60px]" />
        <div className="h-screen overflow-hidden flex items-center">
          <div
            ref={horizontalTrackRef}
            className="flex gap-px will-change-transform pl-[60px] pr-[60px]"
          >
            {/* Intro panel */}
            <div className="shrink-0 w-[min(620px,85vw)] p-12 border border-[#94fcff]/10 flex flex-col justify-between">
              <div>
                <span className="block text-[11px] font-mono text-[#94fcff]/40 tracking-[3px] mb-8">00 / FOUNDATIONS</span>
                <h3
                  className="font-normal uppercase tracking-[1px] text-white font-[family-name:var(--font-display)] leading-[1.05] mb-6"
                  style={{ fontSize: "clamp(1.5rem, 2.4vw, 2.4rem)" }}
                >
                  A studio, not<br />a service desk.
                </h3>
                <p className="text-[14px] leading-[1.75] text-white/55 max-w-[440px]">
                  Engineers who ship. Systems you own. From day one.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <span className="h-px w-10 bg-[#94fcff]/40" />
                <span className="text-[10px] font-mono uppercase tracking-[3px] text-[#94fcff]/60">
                  Scroll →
                </span>
              </div>
            </div>

            {/* Three capabilities */}
            {PILLARS.map((pillar) => (
              <div key={pillar.num} className="shrink-0 w-[min(540px,80vw)]">
                <PillarCard pillar={pillar} />
              </div>
            ))}

            {/* Closing CTA panel */}
            <div className="shrink-0 w-[min(620px,85vw)] p-12 border border-[#94fcff]/15 flex flex-col justify-center text-center items-center bg-[#94fcff]/[0.02]">
              <span className="block text-[11px] font-mono text-[#94fcff]/50 tracking-[3px] mb-6">06 / NEXT</span>
              <h3
                className="font-normal uppercase tracking-[1px] text-white font-[family-name:var(--font-display)] leading-[1.05] mb-6"
                style={{ fontSize: "clamp(1.75rem, 3vw, 3rem)" }}
              >
                Let&rsquo;s build the<br />unfair advantage.
              </h3>
              <p className="text-[14px] leading-[1.7] text-white/55 max-w-[440px] mb-10">
                30-minute scoping call. No deck, no junior account manager;
                you&rsquo;ll talk to the people who&rsquo;ll actually ship the system.
              </p>
              <Link
                href="/#contact"
                className="inline-flex items-center gap-3 px-6 py-3 border border-[#94fcff]/40 hover:border-[#94fcff] hover:bg-[#94fcff]/[0.06] transition-colors duration-300 text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]"
              >
                Start a project
                <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
                  <path d="M0 4H21M21 4L17 1M21 4L17 7" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                </svg>
              </Link>
            </div>

            {/* Trailing spacer so the last card lands centered, not pinned to edge */}
            <div className="shrink-0 w-[20vw]" aria-hidden />
          </div>
        </div>
      </div>

    </section>
  );
}
