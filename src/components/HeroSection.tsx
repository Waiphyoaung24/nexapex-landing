"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";
import { BackgroundPaths } from "@/components/ui/background-paths";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

// ──────────────────────────────────────────────
// Spline 3D embed URL
// ──────────────────────────────────────────────
const SPLINE_EMBED_URL = "https://my.spline.design/interactivetiles3dtransformcopycopy-ZwOLjFzO4sF749gAFs5TPRYa-rKS/";

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

function SplineEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback: force-show after 3s if onLoad doesn't fire (cross-origin iframes)
  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(id);
  }, []);

  // Pause iframe when scrolled out of view to stop WebGL render loop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!url || url === "PASTE_YOUR_SPLINE_URL_HERE") return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1] overflow-hidden"
      style={{
        contain: "strict",
        isolation: "isolate",
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/[0.02]" />
      )}
      {visible && (
        <iframe
          src={url}
          allow="autoplay"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="absolute border-none"
          style={{
            background: "transparent",
            transform: "translateZ(0)",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.7s ease-out",
            /* Extend iframe beyond container to hide Spline watermark */
            top: 0,
            left: 0,
            width: "100%",
            height: "calc(100% + 60px)",
          }}
          title="Interactive 3D Tiles"
        />
      )}
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
        "sticky top-0 min-h-[100dvh] h-screen w-full overflow-hidden bg-[#0e1418] -z-10",
        className,
      )}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
      {/* Atmospheric background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(148,252,255,0.04) 0%, rgba(26,38,48,0.15) 40%, #0e1418 70%)",
        }}
      />

      {/* Spline 3D Interactive Tiles */}
      <SplineEmbed url={SPLINE_EMBED_URL} />

      {/* Animated SVG paths — bottom-left only, avoids crossing 3D tiles */}
      <div className="absolute bottom-0 left-0 w-[55%] h-[55%] z-[3] pointer-events-none overflow-hidden">
        <BackgroundPaths />
      </div>

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
