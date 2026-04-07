"use client";

import { useEffect, useRef } from "react";

interface Detection {
  class_name: string;
  confidence: number;
  bbox: number[];
  area_percentage: number;
}

interface BoundingBoxCanvasProps {
  imageSrc: string;
  detections: Detection[];
  imageDimensions: { width: number; height: number };
}

function classToColor(className: string): string {
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 80%, 60%)`;
}

export function BoundingBoxCanvas({
  imageSrc,
  detections,
  imageDimensions,
}: BoundingBoxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const rect = container.getBoundingClientRect();
      const displayW = rect.width;
      const displayH = (imageDimensions.height / imageDimensions.width) * displayW;
      const dpr = window.devicePixelRatio;

      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const scaleX = displayW / imageDimensions.width;
      const scaleY = displayH / imageDimensions.height;

      // Pre-compute box data
      const boxes = detections.map((det) => {
        const [x1, y1, x2, y2] = det.bbox;
        const color = classToColor(det.class_name);
        return {
          x: x1 * scaleX,
          y: y1 * scaleY,
          w: (x2 - x1) * scaleX,
          h: (y2 - y1) * scaleY,
          color,
          label: `${det.class_name} ${Math.round(det.confidence * 100)}%`,
        };
      });

      if (prefersReducedMotion) {
        // Draw all boxes immediately
        for (const box of boxes) {
          drawBox(ctx, box, 1);
        }
        return;
      }

      // Animated draw-in
      const totalDuration = 1500; // ms
      const perBox = totalDuration / Math.max(boxes.length, 1);
      let startTime: number | null = null;
      let frameId: number;

      function animate(timestamp: number) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        ctx!.clearRect(0, 0, displayW, displayH);

        for (let i = 0; i < boxes.length; i++) {
          const boxStart = i * perBox;
          const boxElapsed = elapsed - boxStart;

          if (boxElapsed <= 0) continue;

          const progress = Math.min(boxElapsed / (perBox * 1.5), 1);
          // Ease out quad
          const eased = 1 - (1 - progress) * (1 - progress);
          drawBox(ctx!, boxes[i], eased);
        }

        if (elapsed < totalDuration + perBox * 1.5) {
          frameId = requestAnimationFrame(animate);
        }
      }

      frameId = requestAnimationFrame(animate);

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    };
    img.src = imageSrc;
  }, [imageSrc, detections, imageDimensions]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl glass-panel">
      <img
        src={imageSrc}
        alt={`Uploaded image with ${detections.length} detected objects highlighted`}
        className="block w-full rounded-xl"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
      />
    </div>
  );
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number; color: string; label: string },
  progress: number
) {
  const { x, y, w, h, color, label } = box;

  // Glow effect
  ctx.shadowBlur = 8 * progress;
  ctx.shadowColor = color;

  // Draw box stroke — animate perimeter
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = progress;

  const perimeter = 2 * (w + h);
  const drawnLength = perimeter * progress;

  ctx.beginPath();
  let remaining = drawnLength;

  // Top edge
  const topLen = Math.min(remaining, w);
  ctx.moveTo(x, y);
  ctx.lineTo(x + topLen, y);
  remaining -= topLen;

  // Right edge
  if (remaining > 0) {
    const rightLen = Math.min(remaining, h);
    ctx.lineTo(x + w, y + rightLen);
    remaining -= rightLen;
  }

  // Bottom edge
  if (remaining > 0) {
    const bottomLen = Math.min(remaining, w);
    ctx.lineTo(x + w - bottomLen, y + h);
    remaining -= bottomLen;
  }

  // Left edge
  if (remaining > 0) {
    const leftLen = Math.min(remaining, h);
    ctx.lineTo(x, y + h - leftLen);
  }

  ctx.stroke();

  // Reset shadow for label
  ctx.shadowBlur = 0;

  // Draw label when progress > 0.6
  if (progress > 0.6) {
    const labelAlpha = (progress - 0.6) / 0.4; // fade in from 0.6 to 1
    ctx.globalAlpha = labelAlpha;

    ctx.font = "bold 11px system-ui, sans-serif";
    const textMetrics = ctx.measureText(label);
    const labelH = 18;
    const labelW = textMetrics.width + 8;
    const labelY = y > labelH ? y - labelH : y;

    ctx.fillStyle = color;
    ctx.fillRect(x, labelY, labelW, labelH);

    ctx.fillStyle = "#000";
    ctx.fillText(label, x + 4, labelY + 13);
  }

  ctx.globalAlpha = 1;
}
