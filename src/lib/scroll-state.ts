/**
 * Module-level scroll state shared between the ScrollTrigger that reads
 * the scroll position and R3F useFrame hooks that consume it.
 *
 * `progress` is the raw value written by ScrollTrigger.
 * `smoothedProgress` is lerped toward `progress` inside useFrame using a
 * frame-rate-independent damping factor `1 - exp(-k * delta)`.
 *
 * This mirrors the pattern used in components/ThreeShowcase.tsx.
 */
export const particleScrollState = {
  progress: 0,
  smoothedProgress: 0,
};
