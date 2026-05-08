"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";

const FADE_DURATION = 0.5;

export function InterstitialCanvas({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const video = videoRef.current;
      if (!section || !video) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Initial state — content hidden, video paused
      gsap.set(
        [eyebrowRef.current, headlineRef.current, descRef.current, ctaRef.current],
        { opacity: 0, y: 40 },
      );
      gsap.set(videoWrapRef.current, { opacity: 0, scale: 1.06 });
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("autoplay");

      // rAF-driven custom fade loop (only ticks while playing)
      let raf = 0;
      let ticking = false;
      const tick = () => {
        const { currentTime, duration, paused } = video;
        if (!paused && duration > 0 && Number.isFinite(duration)) {
          const fadeIn = Math.min(currentTime / FADE_DURATION, 1);
          const remaining = duration - currentTime;
          const fadeOut = Math.min(remaining / FADE_DURATION, 1);
          video.style.opacity = String(Math.max(0, Math.min(fadeIn, fadeOut)));
        }
        raf = requestAnimationFrame(tick);
      };
      const startTicking = () => {
        if (ticking) return;
        ticking = true;
        raf = requestAnimationFrame(tick);
      };
      const stopTicking = () => {
        ticking = false;
        cancelAnimationFrame(raf);
      };

      const handleEnded = () => {
        video.style.opacity = "0";
        window.setTimeout(() => {
          video.currentTime = 0;
          void video.play().catch(() => {});
        }, 100);
      };
      video.addEventListener("ended", handleEnded);

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
              startTicking();
            } else {
              video.pause();
              stopTicking();
            }
          },
        },
      });

      tl.to(videoWrapRef.current, { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" }, 0)
        .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.15)
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 1.1, ease: "power4.out" }, 0.25)
        .to(descRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0.55)
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.75);

      return () => {
        stopTicking();
        video.removeEventListener("ended", handleEnded);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative w-full overflow-hidden bg-[#0e1418]"
      style={{ minHeight: "100vh" }}
      aria-label="Interlude"
    >
      <div
        ref={videoWrapRef}
        className="absolute inset-x-0 bottom-0 z-0 top-[140px] md:top-[300px]"
        aria-hidden
        style={{ willChange: "transform, opacity" }}
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          style={{ opacity: 0 }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0e1418] via-[rgba(14,20,24,0.55)] to-[#0e1418]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(14,20,24,0.25) 0%, rgba(14,20,24,0.7) 60%, #0e1418 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{ backgroundColor: "rgba(14,20,24,0.4)" }}
      />

      <div
        className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24 text-center md:py-32"
      >
        <span
          ref={eyebrowRef}
          className="mb-5 text-[11px] uppercase tracking-[0.4em] md:mb-8"
          style={{ color: "#94fcff" }}
        >
          Interlude
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
          Beyond{" "}
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#94fcff", fontWeight: 400 }}>
            the noise,
          </span>{" "}
          we engineer{" "}
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#94fcff", fontWeight: 400 }}>
            the inevitable.
          </span>
        </h2>

        <p
          ref={descRef}
          className="mt-6 max-w-md text-[15px] leading-relaxed md:mt-10 md:max-w-2xl md:text-lg"
          style={{ color: "#c8ccc6" }}
        >
          NexApex partners with operators and engineers to turn ambiguous problems into
          measurable systems — AI products built with conviction, shipped with proof.
        </p>

        <a
          ref={ctaRef}
          href="#contact"
          className="mt-10 inline-flex items-center justify-center rounded-full px-9 py-4 text-sm font-medium transition-transform duration-300 hover:scale-[1.03] md:mt-12 md:px-14 md:py-5 md:text-base"
          style={{ backgroundColor: "#94fcff", color: "#0e1418" }}
        >
          Start the Build
        </a>
      </div>
    </section>
  );
}
