"use client";

import { initScrollPauses, resetPauseState } from "@/lib/scroll-pause";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createContext, useContext, useEffect, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// Shared context so any component can access smoother.paused(), scrollTo(), etc.
const SmootherContext = createContext<ScrollSmoother | null>(null);
export const useSmoother = () => useContext(SmootherContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [smoother, setSmoother] = useState<ScrollSmoother | null>(null);

  useEffect(() => {
    const instance = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 2,
      speed: 0.25,
      effects: true,
      normalizeScroll: true,
      smoothTouch: 0.1,
    });

    setSmoother(instance);

    // Initialize scroll pause points (Brand, Capabilities, CTA)
    initScrollPauses(instance);

    return () => {
      resetPauseState();
      instance.kill();
    };
  }, []);

  return (
    <SmootherContext.Provider value={smoother}>
      {children}
    </SmootherContext.Provider>
  );
}
