import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PausePoint {
  id: string;
  trigger: string;            // CSS selector for ScrollTrigger trigger element
  start?: string;             // ScrollTrigger start (default: "top 70%")
  pauseDuration?: number;     // seconds (default: 1.5)
  mobileDuration?: number;    // shorter on mobile (default: 1.0)
}

// Sections 4, 5, 6 now use PageSlideSection clip transitions instead of smoother.paused()
const DEFAULT_PAUSE_POINTS: PausePoint[] = [];

const pausedSections = new Set<string>();

export function initScrollPauses(smoother: ScrollSmoother, points: PausePoint[] = DEFAULT_PAUSE_POINTS) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // skip all pauses

  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  points.forEach((point) => {
    ScrollTrigger.create({
      trigger: point.trigger,
      start: point.start || "top 70%",
      once: true,  // fire only once
      onEnter: () => {
        if (pausedSections.has(point.id)) return;
        pausedSections.add(point.id);

        // Pause smooth scroll
        smoother.paused(true);

        // Show indicator
        window.dispatchEvent(new CustomEvent("scroll-pause-start"));

        // Auto-resume after delay
        const duration = isMobile ? (point.mobileDuration || 1.0) : (point.pauseDuration || 1.5);
        gsap.delayedCall(duration, () => {
          smoother.paused(false);
          window.dispatchEvent(new CustomEvent("scroll-pause-end"));
        });
      },
    });
  });
}

/**
 * ThreeShowcase panel pauses -- called from inside ThreeShowcase's onUpdate.
 * progress thresholds: panel1 ~0.20-0.25, panel2 ~0.45-0.50
 */
const panelPaused = new Set<number>();

export function checkThreeShowcasePause(smoother: ScrollSmoother, progress: number) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const duration = isMobile ? 1.0 : 1.5;

  // Panel 1 (Vision Engine): pause at progress ~0.22
  if (progress >= 0.22 && progress <= 0.28 && !panelPaused.has(1)) {
    panelPaused.add(1);
    smoother.paused(true);
    window.dispatchEvent(new CustomEvent("scroll-pause-start"));
    gsap.delayedCall(duration, () => {
      smoother.paused(false);
      window.dispatchEvent(new CustomEvent("scroll-pause-end"));
    });
  }

  // Panel 2 (Language Core): pause at progress ~0.47
  if (progress >= 0.47 && progress <= 0.53 && !panelPaused.has(2)) {
    panelPaused.add(2);
    smoother.paused(true);
    window.dispatchEvent(new CustomEvent("scroll-pause-start"));
    gsap.delayedCall(duration, () => {
      smoother.paused(false);
      window.dispatchEvent(new CustomEvent("scroll-pause-end"));
    });
  }

  // After 3D model — pause at progress ~0.88 (final camera pullout, before fade overlay)
  if (progress >= 0.88 && progress <= 0.93 && !panelPaused.has(3)) {
    panelPaused.add(3);
    smoother.paused(true);
    window.dispatchEvent(new CustomEvent("scroll-pause-start"));
    gsap.delayedCall(isMobile ? 1.2 : 1.8, () => {
      smoother.paused(false);
      window.dispatchEvent(new CustomEvent("scroll-pause-end"));
    });
  }
}

export function resetPauseState() {
  pausedSections.clear();
  panelPaused.clear();
}
