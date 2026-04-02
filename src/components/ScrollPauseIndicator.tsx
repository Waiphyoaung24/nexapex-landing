"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function ScrollPauseIndicator() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    const line = lineRef.current;
    const glow = glowRef.current;
    if (!el || !line || !glow) return;

    // Start hidden
    gsap.set(el, { autoAlpha: 0, y: 12 });
    gsap.set(line, { scaleY: 0, transformOrigin: "top center" });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!reduceMotion) {
      // Organic breathing pulse timeline -- uses transform + opacity only
      pulseRef.current = gsap.timeline({ paused: true, repeat: -1 });
      pulseRef.current
        .to(glow, {
          opacity: 0.6,
          scale: 1.3,
          duration: 1.2,
          ease: "power1.inOut",
        })
        .to(glow, {
          opacity: 0.2,
          scale: 1,
          duration: 1.2,
          ease: "power1.inOut",
        });
    }

    const show = () => {
      const tl = gsap.timeline();
      tl.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" });
      tl.to(
        line,
        { scaleY: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
      pulseRef.current?.play();
    };

    const hide = () => {
      pulseRef.current?.pause();
      gsap.to(el, {
        autoAlpha: 0,
        y: 12,
        duration: 0.35,
        ease: "power2.in",
      });
      gsap.to(line, {
        scaleY: 0,
        duration: 0.25,
        ease: "power2.in",
      });
    };

    window.addEventListener("scroll-pause-start", show);
    window.addEventListener("scroll-pause-end", hide);

    return () => {
      window.removeEventListener("scroll-pause-start", show);
      window.removeEventListener("scroll-pause-end", hide);
      pulseRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{
        visibility: "hidden",
        opacity: 0,
        zIndex: "var(--z-pause-indicator, 45)",
      }}
    >
      {/* Glow orb behind the line */}
      <div
        ref={glowRef}
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(148,252,255,0.5) 0%, transparent 70%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Thin vertical line */}
      <div
        ref={lineRef}
        className="w-px h-12 origin-top"
        style={{
          background:
            "linear-gradient(to bottom, rgba(148,252,255,0.6), rgba(148,252,255,0.1))",
          willChange: "transform",
        }}
      />

      {/* Chevron */}
      <svg
        width="14"
        height="9"
        viewBox="0 0 14 9"
        fill="none"
        className="text-[#94fcff]/70"
      >
        <path
          d="M1 1L7 7L13 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Label */}
      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#6e7a84]">
        scroll down
      </span>
    </div>
  );
}
