"use client";

import "@/lib/patch-three-clock";
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
      smooth: 1.5,
      speed: 0.6,
      effects: true,
      normalizeScroll: true,
      smoothTouch: 0.3,
    });

    setSmoother(instance);

    return () => {
      instance.kill();
    };
  }, []);

  return (
    <SmootherContext.Provider value={smoother}>
      {children}
    </SmootherContext.Provider>
  );
}
