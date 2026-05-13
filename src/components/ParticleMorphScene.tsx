"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type EngineModule = typeof import("@/lib/particle-morph/Engine");

declare global {
  interface Window {
    __particleMorphEvent?: { dispatch: (idx: number) => void };
  }
}

/**
 * Global fixed-position WebGL particle scene. Morphs between brand shapes
 * driven by the page scroll across the hero range (top 100vh).
 */
export function ParticleMorphScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const mod = (await import("@/lib/particle-morph/Engine")) as EngineModule;
      if (cancelled) return;

      const engine = new mod.ParticleMorphEngine(container, canvas);

      engine.onReady = () => {
        // Entry — particles fade in with eased motion.
        if (reduceMotion) {
          engine.setOpacity(1);
        } else {
          gsap.fromTo(
            { v: 0 },
            { v: 0 },
            {
              v: 1,
              duration: 1.8,
              ease: "expo.out",
              delay: 0.2,
              onUpdate: function () {
                const t = (this.targets()[0] as { v: number }).v;
                engine.setOpacity(t);
              },
            },
          );
        }
      };

      // Scroll-scrubbed morph progress + segment broadcasts.
      let lastIdx = -1;
      const st = ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: () => `+=${window.innerHeight * 2}`, // hero range = 2× viewport scroll
        scrub: reduceMotion ? false : 1,
        onUpdate: (self) => {
          engine.setScrollProgress(self.progress);
          const seg = engine.segmentFor(self.progress);
          if (seg.idx !== lastIdx) {
            lastIdx = seg.idx;
            window.dispatchEvent(
              new CustomEvent("particle-morph-segment", {
                detail: { idx: seg.idx },
              }),
            );
          }
        },
      });

      cleanup = () => {
        st.kill();
        engine.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ contain: "strict" }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
