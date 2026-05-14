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
  void mounted;

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
        {/* Layers added in following tasks */}
      </div>
    </section>
  );
}
