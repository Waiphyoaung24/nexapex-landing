"use client";

import { useRef } from "react";
import { useEditorialReveal } from "@/lib/editorial-reveal";

const ECHO_SPEEDS = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7];

interface ParallaxTile {
  src: string;
  alt: string;
  caption: string;
  containerSpeed: number;
  col: 1 | 2 | 3;
  row: 1 | 2 | 3;
  priority?: boolean;
}

const TILES: ParallaxTile[] = [
  {
    src: "/images/peak/peak-1.webp",
    alt: "AI neural network representation",
    caption: "01 · Intelligence",
    containerSpeed: 1,
    col: 1,
    row: 1,
    priority: true,
  },
  {
    src: "/images/peak/peak-2.webp",
    alt: "Future robotics and engineering",
    caption: "02 · Automation",
    containerSpeed: 1.4,
    col: 3,
    row: 2,
  },
  {
    src: "/images/peak/peak-3.webp",
    alt: "Cloud infrastructure and data centers",
    caption: "03 · Infrastructure",
    containerSpeed: 1.2,
    col: 2,
    row: 3,
  },
];

const COL_START_CLASSES: Record<1 | 2 | 3, string> = {
  1: "col-start-1",
  2: "col-start-1 md:col-start-2",
  3: "col-start-2 md:col-start-3",
};

const ROW_START_CLASSES: Record<1 | 2 | 3, string> = {
  1: "row-start-1",
  2: "row-start-2 md:row-start-2",
  3: "row-start-3 md:row-start-3",
};

export function ShipStackSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative bg-[#0e1418] text-white min-h-[120vh] md:min-h-[180vh] overflow-hidden px-5 md:px-[60px] py-24 md:py-32"
    >
      {/* Eyebrow */}
      <div className="absolute top-10 md:top-14 left-5 md:left-[60px] z-40">
        <p
          className="editorial-index text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50"
          aria-hidden="true"
        >
          03 / APEX
        </p>
      </div>

      {/* Composition stage — fills the section, allows absolute layering */}
      <div className="relative h-full w-full max-w-[1400px] mx-auto min-h-[100vh] md:min-h-[140vh]">
        {/* BACK LAYER — Echo PEAK rows (cyan stroke outlines, lagging speeds) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              gridTemplateAreas: '"stack"',
            }}
          >
            {ECHO_SPEEDS.map((speed) => (
              <p
                key={speed}
                data-speed={speed}
                className="m-0 select-none text-center font-normal uppercase font-[family-name:var(--font-display)] motion-reduce:hidden"
                style={{
                  gridArea: "stack",
                  fontSize: "clamp(60px, 15vw, 280px)",
                  lineHeight: 0.85,
                  color: "transparent",
                  letterSpacing: "0.01em",
                  WebkitTextStroke: "1px rgba(148, 252, 255, 0.35)",
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
              >
                Peak
              </p>
            ))}
          </div>
        </div>

        {/* MID LAYER — Asymmetric parallax image grid */}
        <div
          className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-3 gap-3 md:gap-5 pointer-events-none"
          style={{
            zIndex: 10,
            paddingTop: "15vh",
            paddingBottom: "15vh",
            width: "min(92vw, 1100px)",
            marginInline: "auto",
            inset: 0,
          }}
        >
          {TILES.map((tile) => (
            <figure
              key={tile.src}
              data-speed={tile.containerSpeed}
              className={`${COL_START_CLASSES[tile.col]} ${
                ROW_START_CLASSES[tile.row]
              } relative aspect-square overflow-hidden rounded-md md:rounded-lg border border-white/[0.06]`}
              style={{ willChange: "transform", transform: "translateZ(0)" }}
            >
              <img
                data-speed="auto"
                src={tile.src}
                alt={tile.alt}
                width={1200}
                height={805}
                decoding="async"
                fetchPriority={tile.priority ? "high" : "low"}
                loading={tile.priority ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-[140%] object-cover opacity-60 md:opacity-70"
                style={{ willChange: "transform", transform: "translateZ(0)" }}
              />
              {/* dark gradient — keeps cyan type readable when it overlaps */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0e1418]/40 via-transparent to-[#0e1418]/65" />
              {/* corner caption */}
              <figcaption className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-[8px] md:text-[10px] font-mono uppercase tracking-[1px] md:tracking-[2px] text-[#94fcff]/80">
                {tile.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* FRONT LAYER — Tagline + solid cyan PEAK + NexApex signature */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <p
            className="editorial-heading text-center font-normal uppercase tracking-[0.06em] text-white/85 font-[family-name:var(--font-display)] mb-1 md:mb-2 px-4"
            style={{
              fontSize: "clamp(0.85rem, 2.4vw, 2rem)",
              lineHeight: 1.2,
              textShadow: "0 2px 24px rgba(14, 20, 24, 0.7)",
            }}
          >
            Where AI Reaches Its
          </p>
          <p
            data-speed="1"
            className="m-0 select-none text-center font-normal uppercase font-[family-name:var(--font-display)]"
            style={{
              fontSize: "clamp(60px, 15vw, 280px)",
              lineHeight: 0.85,
              color: "#94fcff",
              letterSpacing: "0.01em",
              textShadow:
                "0 6px 40px rgba(148, 252, 255, 0.35), 0 0 80px rgba(14, 20, 24, 0.6)",
            }}
            aria-label="Where AI reaches its peak — NexApex"
          >
            Peak<span className="text-white/85">.</span>
          </p>

          {/* NexApex signature */}
          <div className="mt-6 md:mt-10 flex items-center gap-3 text-[#94fcff]/70 scale-90 md:scale-100">
            <span className="h-px w-6 md:w-12 bg-[#94fcff]/40" aria-hidden="true" />
            <span
              className="text-[9px] md:text-[11px] font-mono uppercase tracking-[3px] md:tracking-[5px]"
              style={{ textShadow: "0 2px 16px rgba(14, 20, 24, 0.7)" }}
            >
              NexApex
            </span>
            <span className="h-px w-6 md:w-12 bg-[#94fcff]/40" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
