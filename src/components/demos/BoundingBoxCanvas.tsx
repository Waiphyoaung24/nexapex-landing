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

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const rect = container.getBoundingClientRect();
      const displayW = rect.width;
      const displayH = (imageDimensions.height / imageDimensions.width) * displayW;

      canvas.width = displayW * window.devicePixelRatio;
      canvas.height = displayH * window.devicePixelRatio;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const scaleX = displayW / imageDimensions.width;
      const scaleY = displayH / imageDimensions.height;

      for (const det of detections) {
        const [x1, y1, x2, y2] = det.bbox;
        const sx1 = x1 * scaleX;
        const sy1 = y1 * scaleY;
        const sw = (x2 - x1) * scaleX;
        const sh = (y2 - y1) * scaleY;

        const color = classToColor(det.class_name);

        // Draw box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx1, sy1, sw, sh);

        // Draw label background
        const label = `${det.class_name} ${Math.round(det.confidence * 100)}%`;
        ctx.font = "bold 11px system-ui, sans-serif";
        const textMetrics = ctx.measureText(label);
        const labelH = 18;
        const labelW = textMetrics.width + 8;
        const labelY = sy1 > labelH ? sy1 - labelH : sy1;

        ctx.fillStyle = color;
        ctx.fillRect(sx1, labelY, labelW, labelH);

        // Draw label text
        ctx.fillStyle = "#000";
        ctx.fillText(label, sx1 + 4, labelY + 13);
      }
    };
    img.src = imageSrc;
  }, [imageSrc, detections, imageDimensions]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl">
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
