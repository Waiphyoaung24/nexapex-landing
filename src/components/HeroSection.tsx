"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

const CROSS_POSITIONS = [5, 25, 50, 72, 95] as const;

function CrossMarker({ xPercent }: { xPercent: number }) {
  return (
    <div
      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 opacity-30"
      style={{ left: `${xPercent}%` }}
    >
      <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-[#94fcff]" />
      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#94fcff]" />
    </div>
  );
}

export function HeroSection({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return;

    const heroTitle = section.querySelector(".hero-title");
    const crossMarkers = section.querySelector(".hero-cross-markers");
    const scrollPrompt = section.querySelector(".hero-scroll-prompt");

    // Title parallax — moves down as user scrolls (opposite direction)
    if (heroTitle) {
      gsap.to(heroTitle, {
        y: 80,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "50% top",
          scrub: true,
        },
      });
    }

    // SplitText character reveal — plays on page load, not scroll
    const titleEl = section.querySelector(".hero-title");
    if (titleEl) {
      const split = SplitText.create(titleEl, {
        type: "chars",
      });

      split.chars.forEach((char) => {
        const el = char as HTMLElement;
        el.style.background = "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)";
        (el.style as unknown as Record<string, string>).webkitBackgroundClip = "text";
        (el.style as unknown as Record<string, string>).webkitTextFillColor = "transparent";
        el.style.backgroundClip = "text";
      });

      gsap.from(split.chars, {
        y: 40,
        autoAlpha: 0,
        rotateX: -90,
        stagger: 0.04,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.3,
      });
    }

    // Cross markers fade out on scroll
    if (crossMarkers) {
      gsap.to(crossMarkers, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "40% top",
          scrub: true,
        },
      });
    }

    // Scroll prompt fades up on scroll
    if (scrollPrompt) {
      gsap.to(scrollPrompt, {
        autoAlpha: 0,
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "20% top",
          scrub: true,
        },
      });
    }

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className={cn(
        "sticky top-0 min-h-[100dvh] h-screen w-full overflow-hidden -z-10",
        className,
      )}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
      {/* Atmospheric background gradient — tinted hero center, particles show through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(148,252,255,0.06) 0%, rgba(148,252,255,0.02) 35%, rgba(14,20,24,0) 70%)",
        }}
      />

      {/* Cross markers */}
      <div className="hero-cross-markers pointer-events-none absolute inset-0 z-[2]">
        {CROSS_POSITIONS.map((x) => (
          <CrossMarker key={x} xPercent={x} />
        ))}
      </div>

      {/* AI Lab title + Scroll prompt — bottom right */}
      <div className="hero-scroll-prompt absolute bottom-6 right-4 z-10 md:bottom-10 md:right-[60px] flex flex-col items-end gap-2">
        <h1
          className="hero-title select-none font-normal uppercase leading-[0.85] tracking-[-0.02em] text-white"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 48px)",
            fontFamily: "var(--font-display)",
          }}
        >
          AI Lab
        </h1>
        <span className="text-[10px] font-medium uppercase tracking-[2px] text-[#94fcff]/50">
          SCROLL TO DISCOVER
        </span>
      </div>
    </section>
  );
}
