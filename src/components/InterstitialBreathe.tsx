"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const VIDEO_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/v1778744291/Butterflies_flapping_flowers_swa__202605141433_ndqss3.mp4";
const POSTER_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/so_0,w_1280,q_auto/Butterflies_flapping_flowers_swa__202605141433_ndqss3.jpg";

export function InterstitialBreathe({ id }: { id?: string } = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    setMounted(true);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section
      id={id ?? "breathe-section"}
      role="region"
      aria-label="Interlude — Systems that breathe"
      className="relative bg-nex-background overflow-hidden py-16 md:py-28"
    >
      {/* Top seam fade — joins BrandSection above at the same bg token */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-32 z-[5]"
        style={{
          background:
            "linear-gradient(to bottom, #0e1418 0%, rgba(14,20,24,0.6) 55%, rgba(14,20,24,0) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 md:px-[60px]">
        {/* Eyebrow */}
        <p
          className={`mb-6 text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 transition-all duration-700 md:mb-10 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          02.5 / INTERLUDE
        </p>

        {/* HD media card — 16:9, capped at 1280px, brand-tinted ring + soft glow */}
        <div
          className={`relative mx-auto w-full max-w-[1280px] aspect-video overflow-hidden rounded-2xl ring-1 ring-[#94fcff]/15 transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{
            boxShadow:
              "0 30px 80px -20px rgba(148,252,255,0.18), 0 0 0 1px rgba(148,252,255,0.05)",
          }}
        >
          {reduceMotion ? (
            <img
              src={POSTER_SRC}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Vignette — keeps headline readable over butterflies */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(14,20,24,0) 0%, rgba(14,20,24,0.35) 70%, rgba(14,20,24,0.7) 100%)",
            }}
          />

          {/* Headline overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <h2
              className="select-none text-center font-normal uppercase text-white font-[family-name:var(--font-display)]"
              style={{
                fontSize: "clamp(2rem, 7vw, 6.5rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.025em",
                background:
                  "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #94fcff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 2px 30px rgba(0,0,0,0.4)",
              }}
            >
              SYSTEMS THAT BREATHE.
            </h2>
          </div>
        </div>

        {/* Caption row — 3-col on md+, stacked on mobile */}
        <div
          className={`mt-8 grid grid-cols-1 items-start gap-6 transition-all duration-1000 delay-200 md:mt-14 md:grid-cols-3 md:items-center ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[280px]">
            Built like nature: living systems, not static deliverables.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-3 px-6 py-3 border border-[#94fcff]/40 hover:border-[#94fcff] hover:bg-[#94fcff]/[0.06] transition-colors duration-300 text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]"
            >
              Start a project
              <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
                <path
                  d="M0 4H21M21 4L17 1M21 4L17 7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                />
              </svg>
            </Link>
            <Link
              href="#project-showcase"
              className="liquid-glass inline-flex items-center gap-3 rounded-full px-6 py-3 text-[11px] font-mono uppercase tracking-[3px] text-white hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
            >
              See work
              <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
                <path
                  d="M0 4H21M21 4L17 1M21 4L17 7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                />
              </svg>
            </Link>
          </div>

          <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[280px] md:text-right md:justify-self-end">
            From a single prototype to a stack that runs every day.
          </p>
        </div>
      </div>
    </section>
  );
}
