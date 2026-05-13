"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { MORPH_SEQUENCE, MORPH_TITLES } from "@/lib/particle-morph/Config";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, SplitText);
}

/**
 * Centered, scroll-synced title that crossfades each time the
 * ParticleMorphScene transitions to a new morph target.
 *
 * Listens for the `particle-morph-segment` window event dispatched by
 * ParticleMorphScene.
 */
export function MorphingHeroText() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  // Subscribe to segment changes from the engine.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ idx: number }>).detail;
      if (typeof detail?.idx === "number") setIdx(detail.idx);
    };
    window.addEventListener("particle-morph-segment", handler);
    return () => window.removeEventListener("particle-morph-segment", handler);
  }, []);

  // Entry reveal — runs once on mount.
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const title = scopeRef.current?.querySelector(".morph-title");
      const tag = scopeRef.current?.querySelector(".morph-tagline");
      if (!title || !tag) return;

      const split = SplitText.create(title, { type: "chars" });
      gsap.set([title, tag], { autoAlpha: 0 });

      const tl = gsap.timeline({ delay: 0.6 });
      tl.set(title, { autoAlpha: 1 })
        .from(split.chars, {
          y: 48,
          autoAlpha: 0,
          rotateX: -85,
          stagger: 0.035,
          duration: 1.1,
          ease: "expo.out",
        })
        .to(
          tag,
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "-=0.5",
        )
        .from(
          tag,
          { y: 12, duration: 0.8, ease: "power3.out" },
          "<",
        );
    },
    { scope: scopeRef },
  );

  // Crossfade on segment change.
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      const title = scopeRef.current?.querySelector(".morph-title");
      const tag = scopeRef.current?.querySelector(".morph-tagline");
      if (!title || !tag) return;

      gsap.fromTo(
        [title, tag],
        { y: 18, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
        },
      );
    },
    { dependencies: [idx], scope: scopeRef },
  );

  const name = MORPH_SEQUENCE[idx] ?? MORPH_SEQUENCE[0];
  const copy = MORPH_TITLES[name];

  return (
    <div
      ref={scopeRef}
      className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] flex -translate-y-1/2 flex-col items-center justify-center px-6 text-center"
    >
      {/* Key on idx so React fully remounts the spans → SplitText behaves on each segment */}
      <h2
        key={`title-${idx}`}
        className="morph-title select-none font-normal uppercase leading-[0.92] tracking-[-0.03em] text-white"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 9vw, 7.5rem)",
          background:
            "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #94fcff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {copy.title}
      </h2>
      <p
        key={`tag-${idx}`}
        className="morph-tagline mt-5 max-w-md text-xs font-medium uppercase tracking-[3px] text-[#94fcff]/70 md:text-sm"
      >
        {copy.tagline}
      </p>
    </div>
  );
}
