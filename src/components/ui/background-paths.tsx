"use client";

/**
 * BackgroundPaths — GPU-composited floating SVG paths.
 *
 * Uses CSS @keyframes on stroke-dashoffset + opacity so the animation
 * runs entirely on the compositor thread. No Framer Motion, no main-thread
 * recalculations during scroll.
 *
 * Reduced from 14 to 8 paths per instance (16 total) for performance.
 */

function FloatingPaths({ position }: { position: number }) {
  const PATH_COUNT = 8;

  const paths = Array.from({ length: PATH_COUNT }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 12 * position} -${189 + i * 15}C-${
      380 - i * 12 * position
    } -${189 + i * 15} -${312 - i * 12 * position} ${216 - i * 15} ${
      152 - i * 12 * position
    } ${343 - i * 15}C${616 - i * 12 * position} ${470 - i * 15} ${
      684 - i * 12 * position
    } ${875 - i * 15} ${220 - i * 12 * position} ${600 - i * 15}`,
    width: 0.4 + i * 0.06,
    // Stagger duration per path so they don't all sync up
    duration: 20 + i * 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="#94fcff"
            strokeWidth={path.width}
            fill="none"
            // Total dash length = 1 full path. The offset animation
            // slides the visible portion along the curve.
            strokeDasharray="1"
            strokeDashoffset="0"
            pathLength={1}
            style={{
              animation: `bgPathDash ${path.duration}s linear infinite, bgPathFade ${path.duration}s linear infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  return (
    <>
      {/* Keyframes injected once — CSS animations run on the compositor */}
      <style>{`
        @keyframes bgPathDash {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1; }
        }
        @keyframes bgPathFade {
          0%, 100% { opacity: 0.08; }
          50%      { opacity: 0.2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-paths-container path {
            animation: none !important;
            opacity: 0.1;
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden bg-paths-container">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
    </>
  );
}
