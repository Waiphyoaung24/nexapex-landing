"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MORPH_SEQUENCE, MORPH_TITLES } from "@/lib/particle-morph/Config";

/**
 * Vertical step indicator pinned to the right edge of the viewport. One pip
 * per morph in MORPH_SEQUENCE. The active pip elongates and lights up cyan;
 * inactive pips stay dim. Updates from the same `particle-morph-segment`
 * event that drives MorphingHeroText.
 *
 * Only visible while the pinned hero is active — fades out once the user
 * scrolls past the morph range.
 */
export function MorphSegmentIndicator() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onSegment = (e: Event) => {
      const detail = (e as CustomEvent<{ idx: number }>).detail;
      if (typeof detail?.idx === "number") setIdx(detail.idx);
    };
    window.addEventListener("particle-morph-segment", onSegment);

    // Hide indicator once we leave the pinned hero section.
    const hero = document.getElementById("particle-morph-pin");
    if (!hero) return () => window.removeEventListener("particle-morph-segment", onSegment);

    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio > 0.05),
      { threshold: [0, 0.05, 0.3] },
    );
    io.observe(hero);

    return () => {
      window.removeEventListener("particle-morph-segment", onSegment);
      io.disconnect();
    };
  }, []);

  // Entry stagger.
  useEffect(() => {
    if (!rootRef.current) return;
    const pips = rootRef.current.querySelectorAll(".pip");
    gsap.from(pips, {
      x: 16,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.7,
      ease: "expo.out",
      delay: 0.9,
    });
  }, []);

  // Fade the whole rail with the pinned section.
  useEffect(() => {
    if (!rootRef.current) return;
    gsap.to(rootRef.current, {
      autoAlpha: visible ? 1 : 0,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [visible]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed right-8 top-1/2 z-[5] hidden -translate-y-1/2 flex-col items-end gap-8 md:flex"
    >
      {MORPH_SEQUENCE.map((name, i) => {
        const active = i === idx;
        return (
          <div key={name} className="pip flex items-center gap-3">
            <span
              className="select-none text-[10px] font-medium uppercase tracking-[3px] transition-all duration-500"
              style={{
                color: active ? "rgba(148,252,255,0.85)" : "rgba(200,204,198,0.28)",
                transform: active ? "translateX(0)" : "translateX(6px)",
              }}
            >
              {MORPH_TITLES[name].title}
            </span>
            <span
              className="block rounded-full transition-all duration-500"
              style={{
                width: active ? 24 : 6,
                height: 2,
                background: active
                  ? "linear-gradient(90deg, rgba(148,252,255,0) 0%, #94fcff 100%)"
                  : "rgba(200,204,198,0.25)",
                boxShadow: active ? "0 0 12px rgba(148,252,255,0.5)" : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
