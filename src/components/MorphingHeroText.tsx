"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MORPH_SEQUENCE, MORPH_TITLES } from "@/lib/particle-morph/Config";

/**
 * Centered, scroll-synced title that crossfades each time the
 * ParticleMorphScene transitions to a new morph target.
 *
 * Single-source animation: each idx change runs ONE timeline that fades the
 * old text out, swaps the strings, then fades the new text in. No SplitText,
 * no key-remount, no concurrent effects.
 */
export function MorphingHeroText() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const [idx, setIdx] = useState(0);
  const mountedRef = useRef(false);

  // Listen for segment events.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ idx: number }>).detail;
      if (typeof detail?.idx === "number") setIdx(detail.idx);
    };
    window.addEventListener("particle-morph-segment", handler);
    return () => window.removeEventListener("particle-morph-segment", handler);
  }, []);

  // One timeline per idx change. Drives entry on first run too.
  useEffect(() => {
    const title = titleRef.current;
    const tag = tagRef.current;
    if (!title || !tag) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const copy = MORPH_TITLES[MORPH_SEQUENCE[idx] ?? MORPH_SEQUENCE[0]];

    if (reduce) {
      title.textContent = copy.title;
      tag.textContent = copy.tagline;
      gsap.set([title, tag], { autoAlpha: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline();

    if (mountedRef.current) {
      // Mid-page segment change — fade out, swap, fade in.
      tl.to([title, tag], {
        autoAlpha: 0,
        y: -14,
        duration: 0.35,
        ease: "power2.in",
        stagger: 0.04,
      });
    } else {
      // First mount — start hidden so entry can play.
      gsap.set([title, tag], { autoAlpha: 0, y: 24 });
      mountedRef.current = true;
    }

    tl.call(() => {
      title.textContent = copy.title;
      tag.textContent = copy.tagline;
    }).fromTo(
      [title, tag],
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.08,
      },
    );

    return () => {
      tl.kill();
    };
  }, [idx]);

  const initial = MORPH_TITLES[MORPH_SEQUENCE[0]];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] flex -translate-y-1/2 flex-col items-center justify-center px-6 text-center"
    >
      <h2
        ref={titleRef}
        className="morph-title select-none font-normal uppercase leading-[0.92] tracking-[-0.03em] text-white"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 9vw, 7.5rem)",
          background:
            "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #94fcff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          willChange: "transform, opacity",
        }}
      >
        {initial.title}
      </h2>
      <p
        ref={tagRef}
        className="morph-tagline mt-5 max-w-md text-xs font-medium uppercase tracking-[3px] text-[#94fcff]/70 md:text-sm"
        style={{ willChange: "transform, opacity" }}
      >
        {initial.tagline}
      </p>
    </div>
  );
}
