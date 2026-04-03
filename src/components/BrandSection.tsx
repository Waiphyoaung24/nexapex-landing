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

    // Section headline -- SplitText char reveal, tuned for scroll-pause impact
    const headlineTitle = section.querySelector(".section-headline-title");
    const headlineWrap = section.querySelector(".section-headline");
    if (headlineTitle) {
      const split = SplitText.create(headlineTitle, { type: "chars" });
      split.chars.forEach((char) => {
        const el = char as HTMLElement;
        el.style.background = "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)";
        (el.style as unknown as Record<string, string>).webkitBackgroundClip = "text";
        (el.style as unknown as Record<string, string>).webkitTextFillColor = "transparent";
        el.style.backgroundClip = "text";
      });
      gsap.from(split.chars, {
        y: 60,
        autoAlpha: 0,
        rotateX: -90,
        stagger: 0.04,
        duration: 1.0,
        ease: "power4.out",
        scrollTrigger: { trigger: headlineWrap, start: "top 80%", toggleActions: "play none none reverse" },
      });
    }

    // Statement reveal — scroll-scrubbed word highlight
    const statementTitle = section.querySelector(".brand-statement");
    if (statementTitle) {
      const split = SplitText.create(statementTitle, { type: "lines, words" });

      // Start all words dim, highlight progressively on scroll
      split.words.forEach((word) => {
        const el = word as HTMLElement;
        el.style.display = "inline-block";
        el.style.color = "rgba(255, 255, 255, 0.15)";
        el.style.transition = "none";
      });

      // Scrub-linked timeline — each word lights up as user scrolls
      const highlightTl = gsap.timeline({
        scrollTrigger: {
          trigger: statementTitle,
          start: "top 75%",
          end: "bottom 40%",
          scrub: 1,
        },
      });

      split.words.forEach((word, i) => {
        highlightTl.to(word, {
          color: "#d4eef0",
          textShadow: "0 0 30px rgba(148, 252, 255, 0.15)",
          duration: 0.3,
          ease: "none",
        }, i * 0.08);
      });
    }

    // Statement body
    const statementBody = section.querySelector(".brand-statement-body");
    if (statementBody) {
      gsap.from(statementBody, {
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statementBody,

          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // Pillar cards stagger
    const pillars = section.querySelectorAll(".pillar-card");
    pillars.forEach((card, i) => {
      gsap.from(card, {
        y: 60,
        autoAlpha: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,

          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Divider line draw
    const dividers = section.querySelectorAll(".brand-divider");
    dividers.forEach((line) => {
      gsap.from(line, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: line,

          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative bg-[#0e1418] overflow-hidden">

      {/* ── Section Headline — centered, same style as ThreeShowcase ── */}
      <div className="section-headline flex flex-col items-center justify-center py-8 md:py-20 pointer-events-none">
        <p className="text-[10px] mt-5 font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3">
          Discover
        </p>
        <h2
          className="section-headline-title font-normal uppercase tracking-[3px] text-white text-center leading-[1.1] font-[family-name:var(--font-display)]"
          style={{ fontSize: "clamp(1.5rem, 5vw, 4rem)" }}
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
              className="pillar-card group relative p-4 md:p-10 border-l-0 md:border-l border-[#94fcff]/10 md:first:border-l-0 border-b border-[#94fcff]/10 md:border-b-0 last:border-b-0 cursor-pointer transition-colors duration-500"
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
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
