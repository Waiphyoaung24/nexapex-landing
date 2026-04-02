"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

function DigitRoller({ value }: { value: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!colRef.current || !wrapRef.current) return;
    const digitH = wrapRef.current.offsetHeight;
    gsap.to(colRef.current, {
      y: -(value * digitH),
      duration: 0.5,
      ease: "power2.out",
    });
  }, { dependencies: [value], scope: wrapRef });

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden"
      style={{ width: "1ch", height: "1em", lineHeight: "1em" }}
    >
      <div ref={colRef}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="text-center"
            style={{ height: "1em", lineHeight: "1em" }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Preloader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const digitsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const exitTriggered = useRef(false);
  const progressObj = useRef({ value: 0 });

  /* Entrance animation: logo scales from 0.5/invisible to full size
     over the 2.5s counter duration, then exit fires. */
  useGSAP(() => {
    // Set initial states explicitly so autoAlpha works correctly
    gsap.set(logoRef.current, { scale: 0.5, autoAlpha: 0 });

    // Logo entrance: scale 0.5 -> 1, opacity 0 -> 1 over 2.5s
    gsap.to(logoRef.current, {
      scale: 1,
      autoAlpha: 1,
      duration: 2.5,
      ease: "power2.out",
    });

    // Counter progress: 0 -> 100 over 2.5s
    gsap.to(progressObj.current, {
      value: 100,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(progressObj.current.value);
        setDisplayProgress(v);
      },
    });
  }, { scope: overlayRef });

  /* Exit animation -- fires once when counter reaches 100 */
  const triggerExit = useCallback(() => {
    if (exitTriggered.current) return;
    exitTriggered.current = true;

    const tl = gsap.timeline({
      delay: 0.4,
      onComplete: () => setIsDone(true),
    });

    // Logo: zoom out to 1.5x and fade
    tl.to(logoRef.current, {
      scale: 1.5,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.inOut",
    }, 0);

    // Digits: slide up and fade
    tl.to(digitsRef.current, {
      y: -80,
      autoAlpha: 0,
      duration: 0.7,
      ease: "power3.inOut",
    }, 0);

    // Overlay: fade out last (overlaps slightly with above)
    tl.to(overlayRef.current, {
      autoAlpha: 0,
      duration: 1,
      ease: "power2.inOut",
    }, "-=0.3");
  }, []);

  useGSAP(() => {
    if (displayProgress >= 100) {
      triggerExit();
    }
  }, { dependencies: [displayProgress] });

  if (isDone) return null;

  const hundreds = Math.floor(displayProgress / 100);
  const tens = Math.floor((displayProgress % 100) / 10);
  const ones = displayProgress % 10;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[200] bg-[#0e1418]">
      {/* Centered logo */}
      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ visibility: "hidden" }}
      >
        <Image
          src="/images/full_color_logo.png"
          alt="NexApex"
          width={280}
          height={280}
          className="w-[140px] h-[140px] md:w-[280px] md:h-[280px] object-contain"
          priority
        />
      </div>

      {/* Counter digits */}
      <div
        ref={digitsRef}
        className="absolute bottom-2 md:bottom-6 left-2 md:left-6 flex font-sans font-light tracking-[-0.02em] text-white"
        style={{
          fontSize: "clamp(2rem, 6vw, 5rem)",
          lineHeight: 1,
          overflow: "hidden",
        }}
      >
        <DigitRoller value={hundreds} />
        <DigitRoller value={tens} />
        <DigitRoller value={ones} />
      </div>
    </div>
  );
}
