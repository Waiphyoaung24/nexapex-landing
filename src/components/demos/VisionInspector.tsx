"use client";

import { useCallback, useRef, useState } from "react";
// GSAP animations removed — CSS animations used instead for reliability with React 18 Strict Mode
import { Upload, AlertCircle, RefreshCw, Info, ShoppingCart, HardHat, UtensilsCrossed, Sprout } from "lucide-react";
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Dropzone */}
        <button
          type="button"
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

        {/* Model capabilities */}
        <div className="rounded-xl border border-white/[0.06] bg-nex-surface/50 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info size={14} className="text-nex-dim" />
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
              Pre-trained model — what it can detect
            </p>
          </div>
          <p className="mb-4 text-xs sm:text-sm leading-relaxed text-nex-text/60">
            This demo uses a <span className="text-white/80">YOLO26n</span> model pre-trained on the COCO dataset.
            It recognizes <span className="text-white/80">80 everyday object classes</span> grouped into these categories:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <ShoppingCart size={14} className="mb-1.5 text-[#94fcff]/70" />
              <p className="text-xs font-medium text-white/80">Retail</p>
              <p className="mt-0.5 text-[11px] leading-snug text-nex-dim">
                Bottles, cups, laptops, bags, phones
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <HardHat size={14} className="mb-1.5 text-[#94fcff]/70" />
              <p className="text-xs font-medium text-white/80">Safety</p>
              <p className="mt-0.5 text-[11px] leading-snug text-nex-dim">
                People, trucks, cars, buses, bikes
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <UtensilsCrossed size={14} className="mb-1.5 text-[#94fcff]/70" />
              <p className="text-xs font-medium text-white/80">Food & Bev</p>
              <p className="mt-0.5 text-[11px] leading-snug text-nex-dim">
                Pizza, fruit, utensils, bowls, cups
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <Sprout size={14} className="mb-1.5 text-[#94fcff]/70" />
              <p className="text-xs font-medium text-white/80">Agriculture</p>
              <p className="mt-0.5 text-[11px] leading-snug text-nex-dim">
                Animals, birds, plants, livestock
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-nex-dim">
            Objects outside these categories will still be detected if they&apos;re in the COCO class list. A custom-trained model can recognize anything specific to your business.
          </p>
        </div>

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
    <div className="mx-auto max-w-6xl space-y-6">
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
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: Image + bounding boxes */}
          <BoundingBoxCanvas
            imageSrc={imageSrc}
            detections={result.detections}
            imageDimensions={result.image_dimensions}
          />

          {/* Right: Stats + Suggestion */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Summary stats — horizontal scroll on mobile */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl glass-panel px-3 py-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-display)]">
                  {result.total_objects}
                </p>
                <p className="mt-0.5 sm:mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Objects
                </p>
              </div>
              <div className="rounded-xl glass-panel px-3 py-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-display)]">
                  {result.unique_classes}
                </p>
                <p className="mt-0.5 sm:mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Categories
                </p>
              </div>
              <div className="rounded-xl glass-panel px-3 py-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-[#94fcff] font-[family-name:var(--font-display)]">
                  {result.processing_time_ms < 1000
                    ? `${result.processing_time_ms}ms`
                    : `${(result.processing_time_ms / 1000).toFixed(1)}s`}
                </p>
                <p className="mt-0.5 sm:mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Speed
                </p>
              </div>
            </div>

            {/* Detection list */}
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[260px] sm:max-h-[400px] rounded-xl glass-panel p-3 sm:p-4">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
                Detections
              </p>
              {result.detections.map((det, i) => (
                <div
                  key={`${det.class_name}-${i}`}
                  className="flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                >
                  <span className="min-w-[80px] sm:min-w-[90px] text-xs text-white/80 truncate">
                    {det.class_name}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
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
