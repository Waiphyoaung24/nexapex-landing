"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const VIDEO_SRC = "/videos/butterflies-interlude-scrub-960.mp4";
const POSTER_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/so_0,w_1280,q_auto/Butterflies_flapping_flowers_swa__202605141433_ndqss3.jpg";

function once<T extends EventTarget>(
  el: T,
  event: string,
  fn: (e: Event) => void,
  opts?: AddEventListenerOptions
) {
  const onceFn = (e: Event) => {
    el.removeEventListener(event, onceFn);
    fn(e);
  };
  el.addEventListener(event, onceFn, opts);
  return onceFn;
}

export function InterstitialBreathe({ id }: { id?: string } = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    setMounted(true);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const splash = document.getElementById("splash-cursor");
    const wrapper = splash?.parentElement as HTMLElement | null;
    if (!wrapper) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        wrapper.style.visibility = entry.isIntersecting ? "hidden" : "";
      },
      { threshold: 0.2 }
    );
    io.observe(section);
    return () => {
      io.disconnect();
      wrapper.style.visibility = "";
    };
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const video = videoRef.current;
      const section = sectionRef.current;
      const headline = headlineRef.current;
      if (!video || !section) return;

      once(document.documentElement, "touchstart", () => {
        video.play();
        video.pause();
      });

      // Proxy object so we tween a plain number (cheap) and only set
      // video.currentTime when the change exceeds ~1 frame. Avoids the
      // seek-storm that makes direct currentTime tweens feel laggy under
      // ScrollSmoother's high-frequency scroll updates.
      const proxy = { t: 0 };
      const FRAME = 1 / 24; // source is 24fps

      // Always pin so the screen locks while the video scrubs end-to-end.
      // The card's max-height (calc(100svh - 320px)) keeps the whole section
      // inside the viewport even on short screens, so the pin never overflows.
      const tl = gsap.timeline({
        defaults: { duration: 1, ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // 200% of viewport gives the scrub enough travel to feel deliberate
          // and guarantees the video reaches its final frame before unpin.
          end: "+=200%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      const card = cardRef.current;
      if (card) {
        gsap.set(card, { scale: 0.82, yPercent: 6, filter: "blur(8px)", opacity: 0.6 });
        tl.to(
          card,
          { scale: 1, yPercent: 0, filter: "blur(0px)", opacity: 1, duration: 1.5, ease: "power2.out" },
          0
        );
        tl.to(card, { rotate: 0.6, duration: 8, ease: "none" }, 0);
        tl.to(
          card,
          { scale: 1.04, duration: 1.5, ease: "power2.in" },
          6.5
        );
      }

      if (headline) {
        gsap.set(headline, { opacity: 0, y: 24 });
        tl.to(headline, { opacity: 1, y: 0, duration: 1 }, 0.6);
        tl.to(headline, { opacity: 0, y: -12, duration: 1 }, 7);
      }

      let scrubAttached = false;
      const attachScrubTween = () => {
        if (scrubAttached) return;
        scrubAttached = true;
        const dur = video.duration || 1;
        tl.to(
          proxy,
          {
            t: dur,
            duration: 8,
            ease: "none",
            onUpdate: () => {
              // Skip redundant seeks within one frame — the decoder can't
              // display sub-frame deltas anyway, and each seek is expensive.
              if (Math.abs(video.currentTime - proxy.t) > FRAME) {
                video.currentTime = proxy.t;
              }
            },
          },
          0
        );
      };

      // Wait for canplaythrough — seeks before this stall the main thread
      // because the demuxer hasn't built enough of the seek index yet.
      if (video.readyState >= 4 /* HAVE_ENOUGH_DATA */) {
        attachScrubTween();
      } else {
        once(video, "canplaythrough", attachScrubTween);
        // Fallback in case canplaythrough never fires (cached video on some browsers)
        once(video, "loadeddata", () => {
          if (video.readyState >= 3) attachScrubTween();
        });
      }
    },
    { scope: sectionRef, dependencies: [reduceMotion] }
  );

  return (
    <section
      ref={sectionRef}
      id={id ?? "breathe-section"}
      role="region"
      aria-labelledby="breathe-headline"
      className="relative bg-nex-background overflow-hidden py-[var(--space-2xl)] md:py-[var(--space-3xl)]"
    >
      {/* Top seam fade — joins BrandSection above at the same bg token */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-32 z-[5]"
        style={{
          background:
            "linear-gradient(to bottom, rgb(var(--color-nex-background-rgb) / 1) 0%, rgb(var(--color-nex-background-rgb) / 0.6) 55%, rgb(var(--color-nex-background-rgb) / 0) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-5 md:px-[60px]">
        {/* Eyebrow */}
        <p
          className={`mb-5 text-[9px] sm:text-[10px] font-mono uppercase tracking-[3px] sm:tracking-[4px] text-[#94fcff]/50 transition-[opacity,transform] duration-700 ease-out md:mb-10 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          01.5 / INTERLUDE
        </p>

        {/* HD media card — 16:9 on md+, 4:3 on mobile for breathing room, capped at 1280px */}
        {/* max-h via svh keeps the whole section inside short viewports (eyebrow + padding + caption ≈ 320px chrome) */}
        <div
          ref={cardRef}
          className={`relative mx-auto w-full max-w-[560px] sm:max-w-[720px] lg:max-w-[880px] xl:max-w-[960px] aspect-[4/5] sm:aspect-[3/2] overflow-hidden rounded-xl sm:rounded-2xl p-[1.5px] transition-[opacity,transform] duration-1000 ease-out will-change-transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{
            background:
              "conic-gradient(from 140deg at 50% 50%, rgba(148,252,255,0.55), rgba(148,252,255,0.05) 25%, rgba(120,90,255,0.35) 50%, rgba(148,252,255,0.05) 75%, rgba(148,252,255,0.55))",
            boxShadow:
              "0 60px 140px -40px rgba(148,252,255,0.18), 0 0 60px -20px rgba(148,252,255,0.25)",
            maxHeight: "calc(100svh - 220px)",
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-nex-background">
          {reduceMotion ? (
            <img
              src={POSTER_SRC}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                // Subject is framed right in the source; nudge zoom toward it
                // so the tree reads as "centered with atmosphere," not "cropped."
                transform: "scale(1.12)",
                transformOrigin: "62% 55%",
              }}
            />
          )}

          {/* Void gradient overlay — cinematic vignette + bottom grounding (tinted near-black, not pure #000) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 100% 80% at center, rgb(4 7 10 / 0) 40%, rgb(4 7 10 / 0.5) 100%)",
                "linear-gradient(to bottom, rgb(4 7 10 / 0.25) 0%, rgb(4 7 10 / 0) 30%, rgb(4 7 10 / 0) 65%, rgb(4 7 10 / 0.55) 100%)",
              ].join(", "),
            }}
          />

          {/* Edge blend — softer fades into bg-nex-background so the image keeps presence */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 85% 85% at center, rgb(var(--color-nex-background-rgb) / 0) 40%, rgb(var(--color-nex-background-rgb) / 0.2) 80%, rgb(var(--color-nex-background-rgb) / 0.65) 100%)",
                "linear-gradient(to right, rgb(var(--color-nex-background-rgb) / 0.55) 0%, rgb(var(--color-nex-background-rgb) / 0) 8%, rgb(var(--color-nex-background-rgb) / 0) 92%, rgb(var(--color-nex-background-rgb) / 0.55) 100%)",
                "linear-gradient(to bottom, rgb(var(--color-nex-background-rgb) / 0.6) 0%, rgb(var(--color-nex-background-rgb) / 0) 10%, rgb(var(--color-nex-background-rgb) / 0) 82%, rgb(var(--color-nex-background-rgb) / 0.7) 100%)",
              ].join(", "),
            }}
          />

          {/* Atmospheric counter-glow — quiet cyan haze on the left balances the bright tree on the right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background:
                "radial-gradient(ellipse 55% 70% at 22% 65%, rgb(148 252 255 / 0.06) 0%, rgb(148 252 255 / 0.025) 45%, rgb(148 252 255 / 0) 75%)",
            }}
          />

          {/* Watermark mask — focused gradient over bottom-right corner to hide source-tool watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-[32%] w-[28%]"
            style={{
              background:
                "radial-gradient(ellipse at bottom right, rgb(var(--color-nex-background-rgb) / 1) 0%, rgb(var(--color-nex-background-rgb) / 0.95) 30%, rgb(var(--color-nex-background-rgb) / 0.6) 60%, rgb(var(--color-nex-background-rgb) / 0) 100%)",
            }}
          />

          {/* Headline overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 sm:px-5 md:px-6">
            <h2
              ref={headlineRef}
              id="breathe-headline"
              className="select-none text-center font-medium uppercase text-[#f0f1ef] font-[family-name:var(--font-display)] max-w-full [text-wrap:balance]"
              style={{
                fontSize: "clamp(1.5rem, 6vw, 6.5rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                textShadow:
                  "0 2px 30px rgb(4 7 10 / 0.55), 0 0 80px rgb(148 252 255 / 0.08)",
              }}
            >
              SYSTEMS THAT BREATHE.
            </h2>
          </div>
          </div>
        </div>

        {/* Caption row — 3-col on md+, stacked & centered on mobile */}
        <div
          className={`mt-8 grid grid-cols-1 items-center gap-5 text-center transition-[opacity,transform] duration-1000 ease-out delay-200 md:mt-14 md:grid-cols-3 md:items-center md:text-left md:gap-6 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="mx-auto md:mx-0 max-w-[280px] text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-[#c8ccc6]/65 order-2 md:order-1">
            Built like nature: living systems, not static deliverables.
          </p>

          <div className="order-1 md:order-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center gap-3 px-6 py-3 min-h-[44px] border border-[#94fcff]/40 hover:border-[#94fcff] hover:bg-[#94fcff]/[0.06] transition-colors duration-300 text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]"
            >
              Start a project
              <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
                <path
                  d="M0 4H21M21 4L17 1M21 4L17 7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                />
              </svg>
            </Link>
            <Link
              href="#project-showcase"
              className="liquid-glass inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 min-h-[44px] text-[11px] font-mono uppercase tracking-[3px] text-[#f0f1ef] hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
            >
              See work
              <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
                <path
                  d="M0 4H21M21 4L17 1M21 4L17 7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                />
              </svg>
            </Link>
          </div>

          <p className="mx-auto md:mx-0 max-w-[280px] text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-[#c8ccc6]/65 order-3 md:text-right md:justify-self-end">
            From a single prototype to a stack that runs every day.
          </p>
        </div>
      </div>
    </section>
  );
}
