"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const BURST_PHOTOS = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=520&q=80",
];

export function BrandSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const horizontalWrapRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const burstContainerRef = useRef<HTMLDivElement>(null);
  const burstKeywordRef = useRef<HTMLSpanElement>(null);
  const burstPhotosRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  useGSAP(
    () => {
      const container = burstContainerRef.current;
      const keyword = burstKeywordRef.current;
      const photoLayer = burstPhotosRef.current;
      if (!container || !keyword || !photoLayer) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const photos = Array.from(
        photoLayer.querySelectorAll<HTMLImageElement>(".ai-burst-photo"),
      );
      if (!photos.length) return;

      const r = gsap.utils.random;
      let tl: gsap.core.Timeline | null = null;

      const hideOffscreen = () =>
        gsap.set(photos, {
          left: "50%",
          top: "50%",
          xPercent: -50,
          yPercent: -50,
          x: 0,
          y: 0,
          rotation: 0,
          clipPath: "inset(100% 0 0 0)",
        });

      const stopBurst = () => {
        tl?.kill();
        tl = null;
        gsap.killTweensOf(photos);
        hideOffscreen();
      };

      const scatter = () => {
        photos.forEach((photo, index) => {
          gsap.set(photo, {
            left: r(2, 98) + "%",
            top: r(2, 98) + "%",
            x: r(-48, 48),
            y: r(50, 110),
            rotation: r(-12, 12) * 0.2,
            zIndex: index,
          });
        });
      };

      const playBurst = () => {
        stopBurst();
        scatter();

        const stagger = 0.09;
        const revealDur = 0.34;
        const exitDur = 0.3;
        const exitStagger = 0.07;
        const revealEnd = (photos.length - 1) * stagger + revealDur;

        tl = gsap.timeline({ onComplete: stopBurst });

        photos.forEach((photo, index) => {
          tl!.to(
            photo,
            {
              x: r(-40, 40),
              y: r(-30, 30),
              rotation: r(-12, 12),
              clipPath: "inset(0% 0 0 0)",
              ease: "power3.out",
              duration: revealDur,
            },
            index * stagger,
          );
        });

        photos.forEach((photo, index) => {
          tl!.to(
            photo,
            {
              y: "+=" + r(180, 280),
              x: "+=" + r(-55, 55),
              rotation: "+=" + r(-10, 10),
              clipPath: "inset(0% 0 100% 0)",
              ease: "power2.in",
              duration: exitDur,
            },
            revealEnd + index * exitStagger,
          );
        });
      };

      hideOffscreen();

      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") playBurst();
      };

      keyword.addEventListener("mouseenter", playBurst);
      keyword.addEventListener("focus", playBurst);
      keyword.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("mouseleave", stopBurst);

      return () => {
        keyword.removeEventListener("mouseenter", playBurst);
        keyword.removeEventListener("focus", playBurst);
        keyword.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("mouseleave", stopBurst);
        stopBurst();
      };
    },
    { scope: sectionRef, dependencies: [mounted] },
  );

  return (
    <section id={id} ref={sectionRef} className="relative bg-nex-background overflow-visible">
      {/* Full-viewport burst overlay — portaled to body so no ancestor
          transform/filter can break `position: fixed`. */}
      {mounted &&
        createPortal(
          <div
            ref={burstPhotosRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
          >
            {BURST_PHOTOS.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="ai-burst-photo absolute pointer-events-none rounded-[3px] object-cover shadow-2xl will-change-transform"
                style={{
                  width: "clamp(140px, 22vw, 300px)",
                  maxHeight: "min(48vh, 420px)",
                  aspectRatio: "3 / 4",
                }}
              />
            ))}
          </div>,
          document.body,
        )}


      {/* Seam blend — single dark falloff that meets the section above at #0e1418.
          No colored sweeps: the two sections share the same background token,
          so they should join with zero visible band. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-64 md:-top-96 h-64 md:h-96 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,20,24,0) 0%, rgba(14,20,24,0.55) 55%, #0e1418 100%)",
        }}
      />
      {/* Curved seam accent — a single dim arc replacing the old straight
          hairline + duplicate inner glow that together formed a visible band
          where this section meets the canvas above. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-8 w-[40%] -translate-x-1/2 md:h-12 md:w-[28%]"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="seam-curve-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(148,252,255,0)" />
            <stop offset="50%" stopColor="rgba(148,252,255,0.16)" />
            <stop offset="100%" stopColor="rgba(148,252,255,0)" />
          </linearGradient>
        </defs>
        <path
          d="M 0 20 C 360 40, 1080 40, 1440 20"
          fill="none"
          stroke="url(#seam-curve-grad)"
          strokeWidth="0.75"
        />
      </svg>

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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          {/* Left — identity statement + narrative */}
          <div className="md:col-span-7">
            <div ref={burstContainerRef} className="relative">
              <h2
                className="editorial-body brand-statement relative z-[2] font-normal uppercase leading-[0.92] tracking-[-0.01em] text-white font-[family-name:var(--font-display)]"
                style={{ fontSize: "clamp(1.6rem, 5vw, 4.5rem)" }}
              >
                We are{" "}
                <span
                  ref={burstKeywordRef}
                  tabIndex={0}
                  role="button"
                  aria-label="Reveal NexApex"
                  className="ai-burst-keyword relative z-10 inline-block cursor-pointer outline-none transition-colors duration-200 hover:text-[#94fcff] focus-visible:text-[#94fcff]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(148,252,255,0.55) 0, rgba(148,252,255,0.55) 55%, transparent 55%)",
                    backgroundRepeat: "repeat-x",
                    backgroundSize: "0.32em 0.08em",
                    backgroundPosition: "0 100%",
                    paddingBottom: "0.12em",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Nexapex
                </span>
              </h2>
            </div>

            <p className="editorial-body brand-statement-body mt-6 md:mt-10 text-[15px] md:text-[18px] leading-[1.5] md:leading-[1.6] text-white/85 max-w-[34rem]">
              An AI solutions company built for businesses that are ready to move faster.
            </p>
            <p className="editorial-body brand-statement-body mt-4 md:mt-5 text-[13px] md:text-[14px] leading-[1.7] md:leading-[1.8] text-white/55 max-w-[34rem]">
              We work with companies across Southeast Asia to find where AI creates the
              most impact &mdash; then we build it, deploy it, and make sure it delivers.
              No demos. No generic tools. Real systems that solve real problems.
            </p>
          </div>

          {/* Right — positioning + facts */}
          <div className="md:col-span-5 flex flex-col justify-end gap-8 md:gap-10">
            {/* Positioning: negate, then affirm */}
            <div className="editorial-body brand-statement-body flex flex-col gap-2.5">
              <p className="text-[15px] md:text-[17px] leading-snug text-white/50">
                We are not a{" "}
                <span className="line-through decoration-white/40 decoration-1">
                  software vendor
                </span>
              </p>
              <p className="text-[15px] md:text-[17px] leading-snug text-white/50">
                We are not a{" "}
                <span className="line-through decoration-white/40 decoration-1">
                  typical tech agency
                </span>
              </p>
              <p className="mt-1 text-[16px] md:text-[19px] font-medium leading-snug text-[#94fcff]">
                We are your business intelligence partner.
              </p>
            </div>

            {/* Facts */}
            <div className="editorial-body brand-statement-body grid grid-cols-2 gap-6 border-t border-[#94fcff]/15 pt-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-[3px] text-[#94fcff]/50">
                  Founded
                </span>
                <span className="text-[18px] md:text-[20px] text-white font-[family-name:var(--font-display)]">
                  2026
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-[3px] text-[#94fcff]/50">
                  Regional Vision
                </span>
                <span className="flex items-center gap-2 text-[18px] md:text-[20px] text-white font-[family-name:var(--font-display)]">
                  <span className="relative flex size-2" aria-hidden="true">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#94fcff]/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#94fcff]" />
                  </span>
                  Southeast Asia
                </span>
              </div>
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
