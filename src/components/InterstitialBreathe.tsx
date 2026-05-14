"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const VIDEO_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/v1778744291/Butterflies_flapping_flowers_swa__202605141433_ndqss3.mp4";
const POSTER_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/so_0,w_1280,q_auto/Butterflies_flapping_flowers_swa__202605141433_ndqss3.jpg";

const MAX_FRAMES = 150;
const MAX_WIDTH = 960;

type Profile = "full" | "lite" | "static";

function pickProfile(): Profile {
  if (typeof window === "undefined") return "full";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return "static";
  if (window.innerWidth < 768) return "lite";
  return "full";
}

function InterludeContent({
  profile,
  mounted,
}: {
  profile: Profile;
  mounted: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col">
      {/* Eyebrow */}
      <div className="flex justify-start px-5 pt-8 md:px-[60px] md:pt-12">
        <p className="text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50">
          02.5 / INTERLUDE
        </p>
      </div>

      {/* Headline — vertically centered */}
      <div
        className={`flex-1 flex items-center justify-center px-5 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <h2
          className="interlude-title"
          style={
            profile === "lite"
              ? { fontSize: "clamp(48px, 14vw, 96px)" }
              : undefined
          }
        >
          SYSTEMS THAT BREATHE.
        </h2>
      </div>

      {/* Bottom row */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 items-end gap-6 px-5 pb-10 md:px-[60px] md:pb-14 transition-all duration-1000 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[280px]">
          Built like nature: living systems, not static deliverables.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-3 px-6 py-3 border border-[#94fcff]/40 hover:border-[#94fcff] hover:bg-[#94fcff]/[0.06] transition-colors duration-300 text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]"
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
            className="liquid-glass inline-flex items-center gap-3 rounded-full px-6 py-3 text-[11px] font-mono uppercase tracking-[3px] text-white hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
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

        <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[280px] md:text-right md:justify-self-end">
          From a single prototype to a stack that runs every day.
        </p>
      </div>
    </div>
  );
}

export function InterstitialBreathe({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const [profile, setProfile] = useState<Profile>("full");

  useEffect(() => {
    setProfile(pickProfile());
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setProfile(pickProfile());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Silence unused-var lints until later tasks wire these up.
  void videoRef;
  void canvasRef;
  void framesRef;
  void framesReady;

  return (
    <section
      id={id}
      ref={sectionRef}
      role="region"
      aria-label="Interlude — Systems that breathe"
      className="relative bg-[#0e1418] overflow-hidden"
      style={{
        height: profile === "full" ? "200vh" : undefined,
        minHeight: profile !== "full" ? "100svh" : undefined,
      }}
    >
      <div
        ref={pinnedRef}
        className="relative h-screen w-full overflow-hidden"
      >
        {profile === "static" && (
          <>
            <img
              src={POSTER_SRC}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,20,24,0)_0%,_rgba(14,20,24,0.35)_70%,_rgba(14,20,24,0.7)_100%)]"
            />
            <InterludeContent profile="static" mounted={mounted} />
          </>
        )}

        {profile === "lite" && (
          <>
            <video
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              autoPlay
              muted
              playsInline
              loop
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,20,24,0)_0%,_rgba(14,20,24,0.35)_70%,_rgba(14,20,24,0.7)_100%)]"
            />
            <InterludeContent profile="lite" mounted={mounted} />
          </>
        )}
      </div>
    </section>
  );
}
