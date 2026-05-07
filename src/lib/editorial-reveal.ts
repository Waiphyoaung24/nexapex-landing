"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

interface EditorialRevealOptions {
  /** When false, skips Beat 1 (mono index reveal). Default: true. */
  hasIndex?: boolean;
  /** When false, animates the whole heading element instead of per-char SplitText. Default: true. */
  splitHeading?: boolean;
  /** When true, swaps body and heading delay so body fades in first (CTA inversion). Default: false. */
  bodyBeforeHeading?: boolean;
  /** ScrollTrigger start offset. Default: "top 80%". */
  startOffset?: string;
}

/**
 * Editorial entrance pattern — fires a 4-beat reveal once when the section
 * crosses `startOffset`. Replays in reverse on scroll-up.
 *
 * Beats (durations / eases / delays):
 *   1. .editorial-index   — y:16 → 0, opacity 0 → 0.6, 0.5s power2.out, delay 0
 *   2. .editorial-heading — split chars y:40 → 0, fade, 1.0s power4.out,
 *                            delay 0.15s, stagger 0.04s
 *   3. .editorial-body    — y:24 → 0, fade, 0.7s power3.out, delay 0.55s
 *   4. .editorial-item    — y:50 → 0, fade, 0.7s power3.out, delay 0.7s,
 *                            stagger 0.1s
 *
 * Total runtime ~1.4s. No-op when prefers-reduced-motion is set.
 */
export function useEditorialReveal(
  sectionRef: RefObject<HTMLElement | null>,
  options: EditorialRevealOptions = {},
) {
  const {
    hasIndex = true,
    splitHeading = true,
    bodyBeforeHeading = false,
    startOffset = "top 80%",
  } = options;

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) return;

      const trigger = {
        trigger: section,
        start: startOffset,
        toggleActions: "play none none reverse",
      } as const;

      // Beat 1 — mono index
      if (hasIndex) {
        const indexEl = section.querySelector(".editorial-index");
        if (indexEl) {
          gsap.from(indexEl, {
            y: 16,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: trigger,
          });
        }
      }

      // Compute beat-2/beat-3 delays based on bodyBeforeHeading
      const headingDelay = bodyBeforeHeading ? 0.55 : 0.15;
      const bodyDelay = bodyBeforeHeading ? 0.15 : 0.55;

      // Beat 2 — heading
      const headingEl = section.querySelector<HTMLElement>(".editorial-heading");
      let split: SplitText | null = null;
      if (headingEl) {
        // background-clip:text gradients break when SplitText wraps each char in
        // a span — `background` doesn't inherit, so chars render with no fill.
        // Detect gradient-text headings and animate the element as a whole.
        const cs = window.getComputedStyle(headingEl);
        const hasGradientText =
          (cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text") &&
          (cs.webkitTextFillColor === "rgba(0, 0, 0, 0)" ||
            cs.color === "rgba(0, 0, 0, 0)");
        const useSplit = splitHeading && !hasGradientText;

        if (useSplit) {
          split = SplitText.create(headingEl, { type: "chars" });
          gsap.from(split.chars, {
            y: 40,
            autoAlpha: 0,
            duration: 1.0,
            ease: "power4.out",
            stagger: 0.04,
            delay: headingDelay,
            scrollTrigger: trigger,
          });
        } else {
          gsap.from(headingEl, {
            y: 40,
            autoAlpha: 0,
            duration: 1.0,
            ease: "power4.out",
            delay: headingDelay,
            scrollTrigger: trigger,
          });
        }
      }

      // Beat 3 — body (one or many)
      const bodyEls = section.querySelectorAll(".editorial-body");
      if (bodyEls.length) {
        gsap.from(bodyEls, {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          delay: bodyDelay,
          scrollTrigger: trigger,
        });
      }

      // Beat 4 — items
      const itemEls = section.querySelectorAll(".editorial-item");
      if (itemEls.length) {
        gsap.from(itemEls, {
          y: 50,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.7,
          scrollTrigger: trigger,
        });
      }

      return () => {
        split?.revert();
      };
    },
    {
      scope: sectionRef,
      dependencies: [hasIndex, splitHeading, bodyBeforeHeading, startOffset],
    },
  );
}
