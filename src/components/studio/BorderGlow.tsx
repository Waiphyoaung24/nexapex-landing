"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  /** How close the pointer must be to the edge for the glow to peak (0-100). Higher = wider glow band. */
  edgeSensitivity?: number;
  /** Multiplier on glow opacity. */
  intensity?: number;
  /** Outer ring radius in px (how far the halo extends past the card). */
  glowRadius?: number;
  /** Width of the directional cone in % of the card. */
  coneSpread?: number;
  /** Border radius of the card in px (matches the wrapped element). */
  borderRadius?: number;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function BorderGlow({
  children,
  className,
  edgeSensitivity = 35,
  intensity = 1,
  glowRadius = 36,
  coneSpread = 30,
  borderRadius = 16,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    reducedMotionRef.current = mql.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotionRef.current) return;
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = y - cy;

    let edge = 0;
    if (dx !== 0 || dy !== 0) {
      const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
      const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
      edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    }

    let angle = 0;
    if (dx !== 0 || dy !== 0) {
      const radians = Math.atan2(dy, dx);
      angle = radians * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
    }

    card.style.setProperty("--edge-proximity", (edge * 100).toFixed(2));
    card.style.setProperty("--cursor-angle", `${angle.toFixed(2)}deg`);
  }, []);

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--edge-proximity", "0");
  }, []);

  const styleVars: CSSProperties = {
    ["--edge-sensitivity" as string]: edgeSensitivity,
    ["--glow-intensity" as string]: intensity,
    ["--glow-radius" as string]: `${glowRadius}px`,
    ["--cone-spread" as string]: coneSpread,
    ["--border-radius" as string]: `${borderRadius}px`,
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("nex-glow-card", className)}
      style={styleVars}
    >
      <span className="nex-edge-light" aria-hidden="true" />
      {children}
    </div>
  );
}
