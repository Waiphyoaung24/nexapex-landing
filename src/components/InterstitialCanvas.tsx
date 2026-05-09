"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260411_104032_69319010-2458-492b-b04d-b40a5dfa4482.mp4";

export function InterstitialCanvas({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const video = videoRef.current;
      if (!section || !video) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Initial state — content hidden, video paused
      gsap.set(
        [eyebrowRef.current, headlineRef.current, descRef.current],
        { opacity: 0, y: 40 },
      );
      gsap.set(videoWrapRef.current, { opacity: 0, scale: 1.06 });
      video.style.opacity = "1";
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("autoplay");

      // Entrance timeline — triggered when section enters viewport
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 40%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
          onToggle: ({ isActive }) => {
            if (isActive && !reduced) {
              void video.play().catch(() => {});
            } else {
              video.pause();
            }
          },
        },
      });

      tl.to(videoWrapRef.current, { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" }, 0)
        .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.15)
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 1.1, ease: "power4.out" }, 0.25)
        .to(descRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0.55);

    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative w-full overflow-hidden bg-[#0e1418] min-h-[78vh] md:min-h-[115vh]"
      style={{ marginBottom: "-1px" }}
      aria-label="Interlude"
    >
      <div
        ref={videoWrapRef}
        className="absolute inset-x-0 bottom-0 z-0 top-[45%] md:top-[52%] [mask-image:linear-gradient(to_bottom,transparent_0,#000_50px,#000_60%,rgba(0,0,0,0.5)_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,#000_50px,#000_60%,rgba(0,0,0,0.5)_85%,transparent_100%)] md:[mask-image:linear-gradient(to_bottom,transparent_0,#000_60px,#000_65%,rgba(0,0,0,0.75)_82%,rgba(0,0,0,0.35)_92%,transparent_100%)] md:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,#000_60px,#000_65%,rgba(0,0,0,0.75)_82%,rgba(0,0,0,0.35)_92%,transparent_100%)]"
        aria-hidden
        style={{
          willChange: "transform, opacity",
        }}
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 25%" }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 75%, rgba(148,252,255,0.08) 0%, rgba(148,252,255,0) 70%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(26,38,48,0.35) 0%, rgba(26,38,48,0) 60%, rgba(26,38,48,0) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "linear-gradient(to bottom, #0e1418 0%, rgba(14,20,24,0.85) 30%, rgba(14,20,24,0) 45%, rgba(14,20,24,0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-[#0e1418] to-transparent"
        aria-hidden
      />

      {/* ── Bottom backdrop overlay — brand-tinted blend into next section ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-48 md:h-80"
        aria-hidden
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,20,24,0) 0%, rgba(14,20,24,0.15) 30%, rgba(14,20,24,0.45) 60%, rgba(14,20,24,0.85) 85%, #0e1418 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 md:h-32 mix-blend-screen"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(148,252,255,0.10) 0%, rgba(99,179,237,0.04) 45%, transparent 80%)",
        }}
      />

      <div
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-start px-6 pt-16 pb-0 text-center md:pt-32 min-h-[78vh] md:min-h-[115vh]"
      >
        <span
          ref={eyebrowRef}
          className="mb-5 text-[11px] uppercase tracking-[0.4em] md:mb-8"
          style={{ color: "#94fcff" }}
        >
          What&apos;s next
        </span>

        <h2
          ref={headlineRef}
          className="text-[2.5rem] font-normal md:text-8xl"
          style={{
            fontFamily: "var(--font-display, Nevera), serif",
            color: "#f0f1ef",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            maxWidth: "72rem",
          }}
        >
          Build the version{" "}
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#94fcff", fontWeight: 400 }}>
            they don&apos;t
          </span>{" "}
          see{" "}
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#94fcff", fontWeight: 400 }}>
            coming.
          </span>
        </h2>

        <p
          ref={descRef}
          className="mt-6 max-w-md text-[15px] leading-relaxed md:mt-10 md:max-w-2xl md:text-lg"
          style={{ color: "#c8ccc6" }}
        >
          Proof below. Systems shipped — not slides.
        </p>

      </div>
    </section>
  );
}
