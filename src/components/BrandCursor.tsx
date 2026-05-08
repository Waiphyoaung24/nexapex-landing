"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const RING_SIZE = 28;
const DOT_SIZE = 5;
const HOVER_SCALE = 1.7;

export function BrandCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const hover = window.matchMedia("(hover: hover)").matches;
    const desktopViewport = window.matchMedia("(min-width: 768px)").matches;
    if (reduceMotion || !fine || !hover || !desktopViewport) return;
    setEnabled(true);

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    document.body.classList.add("brand-cursor-active");

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });

    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onDown = () => {
      gsap.to(ring, { scale: 0.7, duration: 0.18, ease: "power3.out" });
    };
    const onUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.3, ease: "power3.out" });
    };

    const interactiveSelector =
      'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]';

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(interactiveSelector)) {
        gsap.to(ring, {
          scale: HOVER_SCALE,
          opacity: 0.6,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(dot, { opacity: 0, duration: 0.2, ease: "power3.out" });
      }
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(interactiveSelector)) {
        gsap.to(ring, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(dot, { opacity: 1, duration: 0.2, ease: "power3.out" });
      }
    };

    const onLeave = () => {
      gsap.to([ring, dot], { opacity: 0, duration: 0.2, ease: "power3.out" });
    };
    const onEnter = () => {
      gsap.to(ring, { opacity: 1, duration: 0.2, ease: "power3.out" });
      gsap.to(dot, { opacity: 1, duration: 0.2, ease: "power3.out" });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      document.body.classList.remove("brand-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: "50%",
          border: "1.5px solid #94fcff",
          boxShadow:
            "0 0 12px rgba(148, 252, 255, 0.35), inset 0 0 6px rgba(148, 252, 255, 0.15)",
          pointerEvents: "none",
          zIndex: 10000,
          mixBlendMode: "screen",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: "50%",
          background: "#94fcff",
          boxShadow: "0 0 8px rgba(148, 252, 255, 0.8)",
          pointerEvents: "none",
          zIndex: 10001,
          willChange: "transform, opacity",
        }}
      />
    </>
  );
}

export default BrandCursor;
