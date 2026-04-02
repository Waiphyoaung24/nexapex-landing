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

  // Fallback: force-show after 3s if onLoad doesn't fire (cross-origin iframes)
  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(id);
  }, []);

  if (!url || url === "PASTE_YOUR_SPLINE_URL_HERE") return null;

  return (
    <div
      className="absolute inset-0 z-[1]"
      style={{
        /* Force GPU layer without subpixel blur */
        backfaceVisibility: "hidden",
        imageRendering: "auto",
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/[0.02]" />
      )}
      <iframe
        src={url}
        width="100%"
        height="100%"
        allow="autoplay"
        loading="eager"
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 h-full w-full border-none transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{
          background: "transparent",
          /* Crisp rendering: promote to own compositing layer */
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          imageRendering: "auto",
        }}
        title="Interactive 3D Tiles"
      />
    </div>
  );
}

export function HeroSection({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const scroller = document.querySelector("main");
    if (!scroller) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return;

    const heroTitle = section.querySelector(".hero-title");
    const crossMarkers = section.querySelector(".hero-cross-markers");
    const scrollPrompt = section.querySelector(".hero-scroll-prompt");
    // Title parallax on scroll
    if (heroTitle) {
      gsap.to(heroTitle, {
        y: -80,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          scroller,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // SplitText character reveal animation
    const titleEl = section.querySelector(".hero-title h1");
    if (titleEl) {
      const split = SplitText.create(titleEl, {
        type: "chars",
      });

      // Apply gradient to each char after SplitText wraps them
      split.chars.forEach((char) => {
        const el = char as HTMLElement;
        el.style.background = "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)";
        (el.style as unknown as Record<string, string>).webkitBackgroundClip = "text";
        (el.style as unknown as Record<string, string>).webkitTextFillColor = "transparent";
        el.style.backgroundClip = "text";
      });

      gsap.from(split.chars, {
        y: 80,
        autoAlpha: 0,
        rotateX: -90,
        stagger: 0.04,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: section,
          scroller,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // Cross markers fade on scroll
    if (crossMarkers) {
      gsap.to(crossMarkers, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          scroller,
          start: "top top",
          end: "40% top",
          scrub: true,
        },
      });
    }

    // Scroll prompt fade on scroll
    if (scrollPrompt) {
      gsap.to(scrollPrompt, {
        autoAlpha: 0,
        y: 20,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          scroller,
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
        "relative h-screen w-full overflow-hidden bg-[#0e1418]",
        className,
      )}
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

      {/* NEX APEX title */}
      <div className="hero-title pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden px-4 pb-4 md:px-[60px] md:pb-8">
        <h1
          className="select-none text-center font-normal uppercase leading-[0.85] tracking-[-0.02em] text-white"
          style={{
            fontSize: "clamp(3rem, 12vw, 180px)",
            fontFamily: "var(--font-display)",
          }}
        >
          NEX APEX
        </h1>
      </div>

      {/* Scroll prompt */}
      <div className="hero-scroll-prompt absolute bottom-6 right-4 z-10 md:bottom-10 md:right-[60px]">
        <span className="text-[10px] font-medium uppercase tracking-[2px] text-[#94fcff]/50">
          SCROLL TO DISCOVER
        </span>
      </div>
    </section>
  );
}
