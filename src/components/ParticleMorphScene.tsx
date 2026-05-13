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

      // Scroll-pinned, snap-stepped morph progress + segment broadcasts.
      const { MORPH_SEQUENCE } = await import("@/lib/particle-morph/Config");
      const stops = MORPH_SEQUENCE.length;
      const snapPoints = Array.from({ length: stops }, (_, i) => i / (stops - 1));

      let lastIdx = -1;
      const broadcast = (progress: number) => {
        // Snap progress to nearest stop for label switching, so the title
        // changes exactly when a shape is fully formed.
        const stepped =
          snapPoints.reduce(
            (best, p) =>
              Math.abs(p - progress) < Math.abs(best - progress) ? p : best,
            snapPoints[0],
          );
        const idx = Math.round(stepped * (stops - 1));
        if (idx !== lastIdx) {
          lastIdx = idx;
          window.dispatchEvent(
            new CustomEvent("particle-morph-segment", {
              detail: { idx },
            }),
          );
        }
      };

      const st = ScrollTrigger.create({
        trigger: "#particle-morph-pin",
        pin: true,
        pinSpacing: true,
        start: "top top",
        end: () => `+=${window.innerHeight * (stops - 1) * 1.2}`,
        scrub: reduceMotion ? false : 1,
        snap: reduceMotion
          ? undefined
          : {
              snapTo: snapPoints,
              duration: { min: 0.25, max: 0.7 },
              delay: 0.08,
              ease: "power2.inOut",
            },
        onUpdate: (self) => {
          engine.setScrollProgress(self.progress);
          broadcast(self.progress);
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
      style={{
        contain: "strict",
        // Soft top/bottom falloff so the canvas never shows a hard seam against
        // the next section's background. Particles vignette toward the edges.
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 80%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 80%, transparent 100%)",
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
