# Vision Inspector Premium Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Vision Inspector from functional to premium "Glass Command Center" — glass-morphism, GSAP animations, animated bounding boxes, stat counters — without changing any API or data flow.

**Architecture:** Edit 5 existing components + 1 page file + globals.css. No new files, no new dependencies. GSAP + useGSAP already installed. All changes are visual/animation-only.

**Tech Stack:** React 19, GSAP 3.14, useGSAP, Tailwind 4, CSS keyframes, Canvas API, Lucide icons

**Design doc:** `docs/plans/2026-04-07-vision-inspector-rebrand-design.md`

---

## Task 1: Add Vision-Specific CSS Animations to globals.css

**Files:**
- Modify: `src/styles/globals.css` (append after line 273, before the closing `}` of reduced-motion block)

**Step 1: Add CSS keyframes and utility classes**

Append these keyframes after the `@media (prefers-reduced-motion: reduce)` block (after line 273):

```css
/* ── Vision Inspector animations ── */

@keyframes vision-scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(calc(100% + 100vh)); }
}

@keyframes vision-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes vision-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes vision-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(148, 252, 255, 0.1); }
  50% { box-shadow: 0 0 20px rgba(148, 252, 255, 0.25), 0 0 40px rgba(148, 252, 255, 0.08); }
}

@keyframes vision-border-dash {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 24; }
}

@keyframes vision-dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
}

.vision-scan-line {
  animation: vision-scan 2s linear infinite;
}

.vision-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(148,252,255,0.04) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: vision-shimmer 1.5s ease-in-out infinite;
}

.vision-float {
  animation: vision-float 3s ease-in-out infinite;
}

.vision-glow-pulse {
  animation: vision-glow-pulse 2s ease-in-out infinite;
}

/* Glass panel utilities */
.glass-panel {
  background: rgba(22, 32, 41, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-panel-accent {
  background: rgba(148, 252, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 252, 255, 0.12);
}
```

**Step 2: Update reduced-motion block to include new animations**

In the existing `@media (prefers-reduced-motion: reduce)` block (line 260-273), the existing `*` rule already covers all animations with `animation-duration: 0.01ms !important`, so no additional changes needed.

**Step 3: Verify CSS loads**

Run: `cd nexapex && npx next dev --port 3000` — check console for CSS errors.

**Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "style(vision): add glass-panel utilities and animation keyframes"
```

---

## Task 2: Redesign page.tsx — Ambient Background + Refined Hero

**Files:**
- Modify: `src/app/(studio)/demos/vision/page.tsx`

**Step 1: Rewrite page.tsx with gradient mesh background and refined hero**

Replace entire file content:

```tsx
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { VisionInspectorLoader } from "@/components/demos/VisionInspectorLoader";

export default function VisionPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Ambient gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[#94fcff]/[0.02] blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[#94fcff]/[0.015] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#94fcff]/[0.01] blur-[80px]" />
      </div>

      {/* Breadcrumb toolbar */}
      <div className="glass-panel flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex cursor-pointer items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-sm"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Vision Inspector
        </span>
      </div>

      {/* Hero section */}
      <div className="px-4 pt-8 pb-6 md:px-[60px]">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#94fcff]/10 vision-glow-pulse">
            <Eye size={20} className="text-[#94fcff]" />
          </div>
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
              Vision Inspector
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
              Real-time AI Object Detection
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-nex-dim">
          Upload an image or try a sample to see real-time AI object detection. Our model identifies objects, counts them, and shows how custom AI could work for your business.
        </p>
      </div>

      {/* Workspace */}
      <div className="flex-1 px-4 pb-12 md:px-[60px]">
        <VisionInspectorLoader />
      </div>
    </div>
  );
}
```

**Step 2: Verify page renders**

Open `http://localhost:3000/demos/vision` — verify gradient mesh visible, breadcrumb has glass effect, icon has glow pulse.

**Step 3: Commit**

```bash
git add src/app/\(studio\)/demos/vision/page.tsx
git commit -m "style(vision): ambient gradient mesh + glass breadcrumb + refined hero"
```

---

## Task 3: Redesign VisionSkeleton.tsx — Scanning Line + Shimmer

**Files:**
- Modify: `src/components/demos/VisionSkeleton.tsx`

**Step 1: Rewrite VisionSkeleton with scanning line and shimmer effect**

Replace entire file content:

```tsx
"use client";

export function VisionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Image area with scanning line */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl glass-panel">
        {/* Subtle image placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

        {/* Scanning line */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="vision-scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#94fcff]/40 to-transparent shadow-[0_0_12px_rgba(148,252,255,0.3)]" />
        </div>

        {/* Center analyzing text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff] animate-spin" />
          <p className="text-xs font-mono uppercase tracking-[2px] text-[#94fcff]/60">
            Analyzing<span className="inline-block w-4 text-left animate-pulse">...</span>
          </p>
        </div>
      </div>

      {/* Stats sidebar skeleton */}
      <div className="flex flex-col gap-4">
        {/* Stat cards shimmer */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl glass-panel p-4 text-center"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="mx-auto h-7 w-10 rounded-md vision-shimmer" />
              <div className="mx-auto mt-2 h-3 w-14 rounded vision-shimmer" />
            </div>
          ))}
        </div>

        {/* Detection list shimmer */}
        <div className="flex-1 space-y-2 rounded-xl glass-panel p-4">
          <div className="mb-3 h-3 w-20 rounded vision-shimmer" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-3 w-16 rounded vision-shimmer" />
              <div className="h-1.5 flex-1 rounded-full vision-shimmer" />
              <div className="h-3 w-8 rounded vision-shimmer" />
            </div>
          ))}
        </div>

        {/* Suggestion card placeholder */}
        <div className="rounded-2xl glass-panel-accent p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl vision-shimmer" />
            <div className="space-y-2">
              <div className="h-2 w-32 rounded vision-shimmer" />
              <div className="h-3 w-44 rounded vision-shimmer" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 w-full rounded vision-shimmer" />
            <div className="h-3 w-3/4 rounded vision-shimmer" />
          </div>
          <div className="h-9 w-48 rounded-full vision-shimmer" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify loading state**

Open vision page, click a sample → verify scanning line sweeps, shimmer effect visible on skeleton cards.

**Step 3: Commit**

```bash
git add src/components/demos/VisionSkeleton.tsx
git commit -m "style(vision): scanning line + shimmer skeleton loading state"
```

---

## Task 4: Redesign VisionInspector.tsx — Glass Panels + GSAP Animations

**Files:**
- Modify: `src/components/demos/VisionInspector.tsx`

**Step 1: Rewrite VisionInspector with glass-morphism and GSAP entrance animations**

Replace entire file content:

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, AlertCircle, RefreshCw } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BoundingBoxCanvas } from "./BoundingBoxCanvas";
import { BusinessSuggestionCard } from "./BusinessSuggestionCard";
import { VisionSkeleton } from "./VisionSkeleton";

interface Detection {
  class_name: string;
  confidence: number;
  bbox: number[];
  area_percentage: number;
}

interface BusinessSuggestion {
  industry: string;
  title: string;
  pitch: string;
  cta_text: string;
}

interface VisionResult {
  detections: Detection[];
  total_objects: number;
  unique_classes: number;
  processing_time_ms: number;
  image_dimensions: { width: number; height: number };
  suggestion: BusinessSuggestion;
  demos_remaining: number;
}

const SAMPLE_IMAGES = [
  { id: "retail", label: "Retail Shelf", src: "/images/samples/retail-shelf.jpg" },
  { id: "kitchen", label: "Restaurant Kitchen", src: "/images/samples/restaurant-kitchen.jpg" },
  { id: "warehouse", label: "Warehouse", src: "/images/samples/warehouse.jpg" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function VisionInspector() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Upload entrance animation ──
  useGSAP(() => {
    if (!uploadRef.current || imageSrc || loading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(uploadRef.current.querySelectorAll("[data-animate]"), {
      autoAlpha: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
    });
  }, { scope: uploadRef, dependencies: [imageSrc, loading] });

  // ── Results entrance animation ──
  useGSAP(() => {
    if (!resultsRef.current || !result) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = resultsRef.current;

    // Stat counters animate from 0
    const statEls = ctx.querySelectorAll<HTMLElement>("[data-stat]");
    statEls.forEach((el, i) => {
      const target = parseInt(el.dataset.stat || "0", 10);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.2,
        delay: i * 0.15,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toString();
        },
      });
    });

    // Speed stat (may have "ms" or "s" suffix)
    const speedEl = ctx.querySelector<HTMLElement>("[data-stat-speed]");
    if (speedEl) {
      const target = result.processing_time_ms;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.2,
        delay: 0.3,
        ease: "power2.out",
        onUpdate: () => {
          const v = Math.round(obj.val);
          speedEl.textContent = v < 1000 ? `${v}ms` : `${(v / 1000).toFixed(1)}s`;
        },
      });
    }

    // Detection list stagger
    gsap.from(ctx.querySelectorAll("[data-detection]"), {
      x: 30,
      autoAlpha: 0,
      duration: 0.5,
      stagger: 0.08,
      delay: 0.4,
      ease: "power2.out",
    });

    // Confidence bars
    gsap.from(ctx.querySelectorAll("[data-bar]"), {
      scaleX: 0,
      duration: 0.6,
      stagger: 0.08,
      delay: 0.5,
      ease: "power2.out",
      transformOrigin: "left center",
    });
  }, { scope: resultsRef, dependencies: [result] });

  const analyzeImage = useCallback(async (file: File | Blob, previewUrl: string) => {
    setError(null);
    setResult(null);
    setImageSrc(previewUrl);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/v1/proxy/vision/detect", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Server error (${res.status})`);
      }

      const data: VisionResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Unsupported format. Use JPEG, PNG, or WebP.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File too large. Maximum 10MB.");
        return;
      }
      const url = URL.createObjectURL(file);
      analyzeImage(file, url);
    },
    [analyzeImage]
  );

  const handleSampleClick = useCallback(
    async (src: string) => {
      setError(null);
      setResult(null);
      setImageSrc(src);
      setLoading(true);

      try {
        const res = await fetch(src);
        const blob = await res.blob();
        await analyzeImage(blob, src);
      } catch {
        setError("Failed to load sample image.");
        setLoading(false);
      }
    },
    [analyzeImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const reset = useCallback(() => {
    setImageSrc(null);
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  // ── Upload state ──
  if (!imageSrc && !loading) {
    return (
      <div ref={uploadRef} className="mx-auto max-w-4xl space-y-6">
        {/* Dropzone */}
        <button
          type="button"
          data-animate
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-2xl ${
            isDragOver
              ? "border-[#94fcff]/60 bg-[#94fcff]/5 shadow-[0_0_30px_rgba(148,252,255,0.12)]"
              : "border-white/10 glass-panel hover:border-[#94fcff]/30 hover:shadow-[0_0_20px_rgba(148,252,255,0.08)]"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#94fcff]/10 vision-float">
            <Upload size={24} className="text-[#94fcff]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              Drop an image or click to upload
            </p>
            <p className="mt-1 text-xs text-nex-dim">
              JPEG, PNG, or WebP up to 10MB
            </p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Error */}
        {error && (
          <div data-animate className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Sample images */}
        <div data-animate>
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim">
            Or try a sample
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                data-animate
                onClick={() => handleSampleClick(sample.src)}
                className="group cursor-pointer overflow-hidden rounded-xl glass-panel transition-all duration-200 hover:border-[#94fcff]/20 hover:shadow-[0_0_16px_rgba(148,252,255,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={sample.src}
                    alt={sample.label}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
                    {sample.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <VisionSkeleton />
      </div>
    );
  }

  // ── Results state ──
  return (
    <div ref={resultsRef} className="mx-auto max-w-6xl space-y-6">
      {/* Back / Try another */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={reset}
          className="flex cursor-pointer items-center gap-2 text-xs font-mono uppercase tracking-[2px] text-nex-dim transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-sm"
        >
          <RefreshCw size={14} />
          Try another image
        </button>
        {result && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-nex-dim/50">
            {result.demos_remaining} demos remaining
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="ml-auto cursor-pointer text-xs text-red-300 underline hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {result && imageSrc && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: Image + bounding boxes */}
          <BoundingBoxCanvas
            imageSrc={imageSrc}
            detections={result.detections}
            imageDimensions={result.image_dimensions}
          />

          {/* Right: Stats + Suggestion */}
          <div className="flex flex-col gap-4">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl glass-panel p-4 text-center">
                <p
                  className="text-2xl font-bold text-white font-[family-name:var(--font-display)]"
                  data-stat={result.total_objects}
                >
                  0
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Objects
                </p>
              </div>
              <div className="rounded-xl glass-panel p-4 text-center">
                <p
                  className="text-2xl font-bold text-white font-[family-name:var(--font-display)]"
                  data-stat={result.unique_classes}
                >
                  0
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Categories
                </p>
              </div>
              <div className="rounded-xl glass-panel p-4 text-center">
                <p
                  className="text-2xl font-bold text-[#94fcff] font-[family-name:var(--font-display)]"
                  data-stat-speed
                >
                  0ms
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Speed
                </p>
              </div>
            </div>

            {/* Detection list */}
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[400px] rounded-xl glass-panel p-4">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
                Detections
              </p>
              {result.detections.map((det, i) => (
                <div
                  key={`${det.class_name}-${i}`}
                  data-detection
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                >
                  <span className="min-w-[90px] text-xs text-white/80 truncate">
                    {det.class_name}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      data-bar
                      className="h-full rounded-full"
                      style={{
                        width: `${det.confidence * 100}%`,
                        background: "linear-gradient(90deg, #94fcff 0%, #5ce0e6 100%)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-nex-dim tabular-nums w-10 text-right">
                    {Math.round(det.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Business suggestion card */}
            <BusinessSuggestionCard suggestion={result.suggestion} />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify all 3 states render**

1. Open `/demos/vision` → upload state with glass dropzone, floating icon, staggered fade-in
2. Click a sample → loading skeleton with scan line
3. Results load → stat counters animate, detections stagger in, bars animate

**Step 3: Commit**

```bash
git add src/components/demos/VisionInspector.tsx
git commit -m "style(vision): glass panels + GSAP entrance animations for all states"
```

---

## Task 5: Redesign BoundingBoxCanvas.tsx — Animated Draw-In + Glow

**Files:**
- Modify: `src/components/demos/BoundingBoxCanvas.tsx`

**Step 1: Rewrite BoundingBoxCanvas with animated box draw-in and glow**

Replace entire file content:

```tsx
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
```

**Step 2: Verify animated bounding boxes**

Upload/select sample image → watch boxes draw in sequentially with glow, labels fade in.

**Step 3: Commit**

```bash
git add src/components/demos/BoundingBoxCanvas.tsx
git commit -m "style(vision): animated bounding box draw-in with glow effect"
```

---

## Task 6: Redesign BusinessSuggestionCard.tsx — Glass-Morphism + Gradient Border

**Files:**
- Modify: `src/components/demos/BusinessSuggestionCard.tsx`

**Step 1: Rewrite BusinessSuggestionCard with glass-morphism and refined animation**

Replace entire file content:

```tsx
"use client";

import { useRef } from "react";
import { Lightbulb } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface BusinessSuggestion {
  industry: string;
  title: string;
  pitch: string;
  cta_text: string;
}

interface BusinessSuggestionCardProps {
  suggestion: BusinessSuggestion;
}

export function BusinessSuggestionCard({ suggestion }: BusinessSuggestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(card, { autoAlpha: 1, y: 0, scale: 1 });
      return;
    }

    gsap.fromTo(
      card,
      { autoAlpha: 0, y: 30, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, delay: 1.5, ease: "power3.out" }
    );
  }, [suggestion]);

  return (
    <div className="relative rounded-2xl p-px overflow-hidden">
      {/* Gradient border via pseudo-element */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#94fcff]/20 via-transparent to-[#94fcff]/10" />

      <div
        ref={cardRef}
        className="invisible relative rounded-2xl glass-panel-accent p-6"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#94fcff]/10 vision-glow-pulse">
            <Lightbulb size={20} className="text-[#94fcff]" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-[#94fcff]/60">
              What this means for your business
            </p>
            <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
              {suggestion.title}
            </h3>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-nex-dim">
          {suggestion.pitch}
        </p>

        <a
          href="mailto:hello@nexapex.ai?subject=AI%20Vision%20Demo%20Inquiry"
          className="inline-flex cursor-pointer items-center rounded-full bg-[#94fcff] px-5 py-2.5 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] transition-all duration-200 hover:bg-[#b0fdff] hover:shadow-[0_0_20px_rgba(148,252,255,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-full vision-glow-pulse"
        >
          {suggestion.cta_text}
        </a>
      </div>
    </div>
  );
}
```

**Step 2: Verify suggestion card renders**

Run a detection → after 1.5s delay the card animates in with glass effect and gradient border.

**Step 3: Commit**

```bash
git add src/components/demos/BusinessSuggestionCard.tsx
git commit -m "style(vision): glass-morphism suggestion card with gradient border"
```

---

## Task 7: Integration Smoke Test + Final Verification

**Files:**
- No files modified — testing only

**Step 1: Start both servers**

```bash
# Terminal 1
cd backend && venv/Scripts/python.exe -m uvicorn app.main:app --port 8000

# Terminal 2
cd nexapex && npx next dev --port 3000
```

**Step 2: Test all 3 states at each breakpoint**

| State | Test | Expected |
|-------|------|----------|
| Upload | Load `/demos/vision` | Glass dropzone, floating icon, staggered fade-in, gradient mesh bg |
| Upload | Hover dropzone | Glow shadow appears |
| Upload | Hover sample | Scale + glow ring |
| Loading | Click sample | Scanning line sweeps, shimmer on skeleton cards |
| Results | Wait for load | Stat counters animate 0→N, detections stagger in, bars animate width |
| Results | View canvas | Bounding boxes draw in sequentially with glow |
| Results | Wait 1.5s | Suggestion card floats in with gradient border |
| Results | Click "Try another" | Resets to upload state |
| Error | Stop backend, try upload | Error message shows |

**Step 3: Test responsive**

- Desktop (1440px): full side-by-side layout
- Tablet (768px): stacked layout, touch targets ≥44px
- Mobile (375px): no horizontal scroll, readable text

**Step 4: Test reduced motion**

Set `prefers-reduced-motion: reduce` in browser DevTools → all animations should skip to final state.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(vision): Vision Inspector premium redesign — glass command center"
```

---

Plan complete and saved to `docs/plans/2026-04-07-vision-inspector-rebrand-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
