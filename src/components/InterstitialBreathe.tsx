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

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    setMounted(true);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const video = videoRef.current;
      const section = sectionRef.current;
      const headline = headlineRef.current;
      if (!video || !section) return;

      if (headline) {
        gsap.set(headline, { opacity: 0, y: 24 });
      }

      once(document.documentElement, "touchstart", () => {
        video.play();
        video.pause();
      });

      const tl = gsap.timeline({
        defaults: { duration: 1 },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      if (headline) {
        tl.to(headline, { opacity: 1, y: 0, duration: 1 }, 0);
        tl.to(headline, { opacity: 0, y: -12, duration: 1 }, 7);
      }

      const attachScrubTween = () => {
        tl.fromTo(
          video,
          { currentTime: 0 },
          { currentTime: video.duration || 1, duration: 8 },
          0
        );
      };

      if (video.readyState >= 1 /* HAVE_METADATA */) {
        attachScrubTween();
      } else {
        once(video, "loadedmetadata", attachScrubTween);
      }

      const blobTimer = window.setTimeout(() => {
        if (typeof window.fetch !== "function") return;
        fetch(VIDEO_SRC)
          .then((res) => res.blob())
          .then((blob) => {
            const blobURL = URL.createObjectURL(blob);
            const t = video.currentTime;
            once(document.documentElement, "touchstart", () => {
              video.play();
              video.pause();
            });
            video.setAttribute("src", blobURL);
            video.currentTime = t + 0.01;
          })
          .catch(() => {
            // Network or CORS failure — silently keep streamed src.
          });
      }, 1000);

      return () => {
        window.clearTimeout(blobTimer);
      };
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
        <div
          className={`relative mx-auto w-full max-w-[1280px] aspect-[4/3] sm:aspect-video overflow-hidden rounded-xl sm:rounded-2xl transition-[opacity,transform] duration-1000 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{
            boxShadow:
              "0 60px 140px -40px rgba(148,252,255,0.12)",
          }}
        >
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
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
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

          {/* Edge blend — fades all four edges into bg-nex-background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 80% 80% at center, rgb(var(--color-nex-background-rgb) / 0) 30%, rgb(var(--color-nex-background-rgb) / 0.35) 75%, rgb(var(--color-nex-background-rgb) / 0.85) 100%)",
                "linear-gradient(to right, rgb(var(--color-nex-background-rgb) / 0.95) 0%, rgb(var(--color-nex-background-rgb) / 0) 12%, rgb(var(--color-nex-background-rgb) / 0) 88%, rgb(var(--color-nex-background-rgb) / 0.95) 100%)",
                "linear-gradient(to bottom, rgb(var(--color-nex-background-rgb) / 0.9) 0%, rgb(var(--color-nex-background-rgb) / 0) 14%, rgb(var(--color-nex-background-rgb) / 0) 80%, rgb(var(--color-nex-background-rgb) / 0.92) 100%)",
              ].join(", "),
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
