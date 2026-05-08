"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";

const FADE_DURATION = 0.5;

export function InterstitialCanvas({ id }: { id?: string } = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      video.pause();
      video.style.opacity = "0.4";
      return;
    }

    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const { currentTime, duration } = video;
      if (duration > 0 && Number.isFinite(duration)) {
        const fadeIn = Math.min(currentTime / FADE_DURATION, 1);
        const remaining = duration - currentTime;
        const fadeOut = Math.min(remaining / FADE_DURATION, 1);
        video.style.opacity = String(Math.max(0, Math.min(fadeIn, fadeOut)));
      }
      raf = requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      window.setTimeout(() => {
        if (cancelled) return;
        video.currentTime = 0;
        void video.play().catch(() => {});
      }, 100);
    };

    void video.play().catch(() => {});
    raf = requestAnimationFrame(tick);
    video.addEventListener("ended", handleEnded);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <section
      id={id}
      className="relative w-full overflow-hidden bg-[#0e1418]"
      style={{ minHeight: "100vh" }}
      aria-label="Interlude"
    >
      <div
        className="absolute inset-x-0 bottom-0 z-0 top-[clamp(120px,25vh,300px)]"
        aria-hidden
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          autoPlay
          preload="auto"
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
        className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-5 text-center sm:px-6"
        style={{ paddingTop: "clamp(4rem, 12vh, 6rem)", paddingBottom: "clamp(5rem, 15vh, 10rem)" }}
      >
        <span
          className="animate-fade-rise mb-6 text-[10px] uppercase tracking-[0.35em] sm:mb-8 sm:text-[11px] sm:tracking-[0.4em]"
          style={{ color: "#94fcff" }}
        >
          Interlude
        </span>

        <h2
          className="animate-fade-rise text-4xl font-normal sm:text-6xl md:text-7xl lg:text-8xl"
          style={{
            fontFamily: "var(--font-display, Nevera), serif",
            color: "#f0f1ef",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            maxWidth: "72rem",
          }}
        >
          Beyond{" "}
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#94fcff", fontWeight: 400 }}>the noise,</span>{" "}
          we engineer{" "}
          <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#94fcff", fontWeight: 400 }}>the inevitable.</span>
        </h2>

        <p
          className="animate-fade-rise-delay mt-6 max-w-2xl text-sm leading-relaxed sm:mt-8 sm:text-base md:text-lg"
          style={{ color: "#c8ccc6" }}
        >
          NexApex partners with operators and engineers to turn ambiguous problems into
          measurable systems — AI products built with conviction, shipped with proof.
        </p>

        <a
          href="#contact"
          className="animate-fade-rise-delay-2 mt-8 inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-medium transition-transform duration-300 hover:scale-[1.03] sm:mt-12 sm:px-14 sm:py-5 sm:text-base"
          style={{ backgroundColor: "#94fcff", color: "#0e1418" }}
        >
          Start the Build
        </a>
      </div>
    </section>
  );
}
