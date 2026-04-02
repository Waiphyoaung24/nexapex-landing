"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface PageSlideSectionProps {
  children: React.ReactNode;
  id: string;
  /** Scroll distance for the clip reveal — higher = slower (default: "+=150%") */
  scrollLength?: string;
  /** Scrub smoothing in seconds (default: 1) */
  scrub?: number;
  /** z-index for stacking order — each section must be higher than the previous */
  zIndex?: number;
  className?: string;
}

/**
 * Pins the section, then clips the NEXT section in from bottom-to-top.
 *
 * Flow:
 * 1. User scrolls → this section enters the viewport
 * 2. Section gets PINNED at "top top"
 * 3. Inner content starts fully clipped: clipPath inset(100% 0 0 0)
 * 4. As user scrolls, clip opens upward: inset(0% 0 0 0)
 * 5. Section is now fully visible, pin releases, normal scroll continues
 */
export function PageSlideSection({
  children,
  id,
  scrollLength = "+=150%",
  scrub = 1,
  zIndex = 10,
  className = "",
}: PageSlideSectionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const endDistance = isMobile ? "+=40%" : scrollLength;

    // Start fully clipped — hidden from bottom
    gsap.set(inner, {
      clipPath: "inset(100% 0% 0% 0%)",
    });

    // Pin + clip reveal
    gsap.to(inner, {
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: endDistance,
        pin: true,
        pinSpacing: true,
        scrub: isMobile ? 0.6 : scrub,
      },
    });
  }, { scope: wrapperRef });

  return (
    <div
      ref={wrapperRef}
      id={id}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ zIndex }}
    >
      <div
        ref={innerRef}
        className="will-change-[clip-path]"
      >
        {children}
      </div>
    </div>
  );
}
