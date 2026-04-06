# Vision Inspector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Vision Inspector demo — YOLO26n backend inference endpoint + conversion-focused frontend with bounding box overlay, detection stats, and delayed business suggestion card.

**Architecture:** Single `POST /api/v1/vision/detect` endpoint receives an image, runs YOLO26n inference, applies cluster-to-industry mapping, returns detections + business suggestion. Frontend is a dynamically imported client component with upload dropzone, 3 sample image buttons, canvas bounding box overlay, and a 1.5s delayed business pitch card.

**Tech Stack:** FastAPI, ultralytics (YOLO26n), Pillow, Pydantic V2, React 19, Next.js 16, GSAP, Tailwind 4, Lucide icons

**Design doc:** `docs/plans/2026-04-07-vision-inspector-design.md`

---

## Task 1: Vision Backend — Schemas

**Files:**
- Create: `backend/app/vision/__init__.py`
- Create: `backend/app/vision/schemas.py`

**Step 1: Create the vision package**

```bash
mkdir -p backend/app/vision
```

**Step 2: Create empty init**

```python
# backend/app/vision/__init__.py
```

**Step 3: Write Pydantic V2 schemas**

```python
# backend/app/vision/schemas.py
from pydantic import BaseModel


class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: list[float]
    area_percentage: float


class BusinessSuggestion(BaseModel):
    industry: str
    title: str
    pitch: str
    cta_text: str


class VisionResponse(BaseModel):
    detections: list[Detection]
    total_objects: int
    unique_classes: int
    processing_time_ms: int
    image_dimensions: dict[str, int]
    suggestion: BusinessSuggestion
    demos_remaining: int
```

**Step 4: Verify import**

```bash
cd backend && python -c "from app.vision.schemas import VisionResponse, Detection, BusinessSuggestion; print('OK')"
```

Expected: `OK`

**Step 5: Commit**

```bash
git add backend/app/vision/
git commit -m "feat(vision): add Pydantic V2 schemas for vision detect endpoint"
```

---

## Task 2: Vision Backend — Service (YOLO26n Inference + Cluster Mapping)

**Files:**
- Create: `backend/app/vision/service.py`

**Step 1: Write the vision service**

This is the core logic: YOLO26n inference + cluster-to-industry business suggestion mapping. The YOLO26n API follows the pattern from `docs/yolo-reference-tutorial/tutorial.ipynb`:

```python
# backend/app/vision/service.py
import io
import time

import numpy as np
from PIL import Image
from ultralytics import YOLO

from app.vision.schemas import BusinessSuggestion, Detection

INDUSTRY_CLUSTERS: dict[str, dict] = {
    "retail": {
        "classes": {
            "bottle", "cup", "bowl", "vase", "book", "cell phone",
            "laptop", "keyboard", "mouse", "remote", "handbag",
            "backpack", "suitcase",
        },
        "title": "Smart Inventory & Retail Analytics",
        "pitch": (
            "We detected {count} countable products in this image. "
            "Imagine this trained on YOUR specific inventory \u2014 automatic stock "
            "counting, misplaced item alerts, and shelf compliance monitoring."
        ),
        "cta_text": "See how we helped a retail chain reduce stockouts by 34%",
    },
    "manufacturing": {
        "classes": {
            "person", "truck", "car", "bicycle", "motorcycle", "bus", "train",
        },
        "title": "Workplace Safety & Operations",
        "pitch": (
            "We identified {count} people and vehicles in this scene. "
            "A custom model could monitor PPE compliance, restricted zone "
            "violations, and vehicle-pedestrian proximity in real-time."
        ),
        "cta_text": "Learn how AI-powered safety monitoring works",
    },
    "food": {
        "classes": {
            "pizza", "cake", "sandwich", "banana", "apple", "orange",
            "donut", "hot dog", "carrot", "broccoli", "bowl", "cup",
            "wine glass", "fork", "knife", "spoon",
        },
        "title": "F&B Quality & Kitchen Intelligence",
        "pitch": (
            "We spotted {count} food items and kitchen objects. "
            "Custom vision can automate portion control, ingredient "
            "verification, and hygiene compliance for your kitchen."
        ),
        "cta_text": "Discover AI solutions for food service",
    },
    "agriculture": {
        "classes": {
            "cow", "sheep", "horse", "bird", "cat", "dog", "potted plant",
        },
        "title": "Smart Agriculture & Livestock",
        "pitch": (
            "We detected {count} animals/plants in this image. "
            "Trained on your farm, this becomes automated livestock counting, "
            "health monitoring, and crop assessment."
        ),
        "cta_text": "Explore precision agriculture solutions",
    },
}


def match_industry(class_names: list[str]) -> BusinessSuggestion:
    """Match detected classes to the best-fit industry cluster."""
    if not class_names:
        return BusinessSuggestion(
            industry="general",
            title="AI-Powered Object Detection",
            pitch="No objects detected at the current confidence level. Try a different image or lower the confidence threshold.",
            cta_text="Talk to us about custom AI solutions",
        )

    unique = set(class_names)
    best_cluster = ""
    best_count = 0

    for cluster_name, cluster in INDUSTRY_CLUSTERS.items():
        overlap = unique & cluster["classes"]
        if len(overlap) > best_count:
            best_count = len(overlap)
            best_cluster = cluster_name

    if best_count >= 2 and best_cluster:
        cluster = INDUSTRY_CLUSTERS[best_cluster]
        matched_count = sum(1 for c in class_names if c in cluster["classes"])
        return BusinessSuggestion(
            industry=best_cluster,
            title=cluster["title"],
            pitch=cluster["pitch"].format(count=matched_count),
            cta_text=cluster["cta_text"],
        )

    return BusinessSuggestion(
        industry="general",
        title="Custom AI Object Detection",
        pitch=(
            f"We detected {len(class_names)} objects across "
            f"{len(unique)} categories. Imagine this trained "
            f"specifically on your products."
        ),
        cta_text="Talk to us about custom AI solutions",
    )


def run_inference(
    model: YOLO, image_bytes: bytes, confidence: float = 0.25
) -> dict:
    """Run YOLO26n inference and return structured results.

    Follows the ultralytics Python API from docs/yolo-reference-tutorial/tutorial.ipynb:
      model = YOLO("yolo26n.pt")
      results = model.predict(source=img, conf=0.25, save=False, verbose=False)
      xyxy = results[0].boxes.xyxy.cpu().numpy()
      conf = results[0].boxes.conf.cpu().numpy()
      cls = results[0].boxes.cls.cpu().numpy().astype(int)
    """
    start = time.perf_counter()
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    results = model.predict(source=img, conf=confidence, save=False, verbose=False)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    detections: list[Detection] = []
    class_names: list[str] = []

    if results and len(results) > 0:
        result = results[0]
        if result.boxes is not None and len(result.boxes) > 0:
            xyxy = result.boxes.xyxy.cpu().numpy()
            conf_scores = result.boxes.conf.cpu().numpy()
            cls_ids = result.boxes.cls.cpu().numpy().astype(int)

            for i in range(len(xyxy)):
                x1, y1, x2, y2 = xyxy[i]
                cls_name = model.names[int(cls_ids[i])]
                area_pct = ((x2 - x1) * (y2 - y1)) / (w * h) * 100

                detections.append(
                    Detection(
                        class_name=cls_name,
                        confidence=round(float(conf_scores[i]), 3),
                        bbox=[round(float(v), 1) for v in [x1, y1, x2, y2]],
                        area_percentage=round(float(area_pct), 1),
                    )
                )
                class_names.append(cls_name)

    unique_classes = len(set(class_names))
    suggestion = match_industry(class_names)

    return {
        "detections": detections,
        "total_objects": len(detections),
        "unique_classes": unique_classes,
        "processing_time_ms": elapsed_ms,
        "image_dimensions": {"width": w, "height": h},
        "suggestion": suggestion,
    }
```

**Step 2: Verify import**

```bash
cd backend && python -c "from app.vision.service import run_inference, match_industry; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/app/vision/service.py
git commit -m "feat(vision): add YOLO26n inference service with cluster-to-industry mapping"
```

---

## Task 3: Vision Backend — Router + Main Integration

**Files:**
- Create: `backend/app/vision/router.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/config.py`

**Step 1: Write the vision router**

```python
# backend/app/vision/router.py
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Lead
from app.dependencies import get_current_lead
from app.vision.schemas import VisionResponse
from app.vision.service import run_inference

router = APIRouter(prefix="/vision", tags=["vision"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/detect", response_model=VisionResponse)
async def detect(
    request: Request,
    image: Annotated[UploadFile, File(description="Image to analyze")],
    confidence_threshold: Annotated[float, Query(ge=0.1, le=1.0)] = 0.25,
    lead: Lead = Depends(get_current_lead),
    db: AsyncSession = Depends(get_db),
) -> VisionResponse:
    # Check demo limit
    if lead.vision_demos_used >= 10:
        raise HTTPException(
            status_code=429,
            detail="Demo limit reached. Book a consultation to continue.",
        )

    # Validate content type
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Use JPEG, PNG, or WebP.",
        )

    # Read and validate size
    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum 10MB.",
        )

    # Check model is loaded
    yolo_model = getattr(request.app.state, "yolo_model", None)
    if yolo_model is None:
        raise HTTPException(
            status_code=503,
            detail="Vision model not available. Please try again later.",
        )

    # Run inference
    result = run_inference(yolo_model, contents, confidence_threshold)

    # Increment usage counter
    await db.execute(
        update(Lead)
        .where(Lead.id == lead.id)
        .values(vision_demos_used=Lead.vision_demos_used + 1)
    )
    await db.commit()

    return VisionResponse(
        **result,
        demos_remaining=max(0, 10 - lead.vision_demos_used - 1),
    )
```

**Step 2: Update config.py — change model path to yolo26n**

In `backend/app/config.py`, change:

```python
yolo_model_path: str = "models/yolov8n.pt"
```

to:

```python
yolo_model_path: str = "models/yolo26n.pt"
```

**Step 3: Update main.py — load YOLO26n at startup + register vision router**

Replace the lifespan and add the vision router import:

```python
# backend/app/main.py
import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.vision.router import router as vision_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load YOLO26n model
    try:
        from ultralytics import YOLO
        app.state.yolo_model = YOLO(settings.yolo_model_path)
        app.state.models_loaded = True
    except Exception:
        app.state.yolo_model = None
        app.state.models_loaded = False
    yield
    # Shutdown: cleanup
    if getattr(app.state, "yolo_model", None):
        del app.state.yolo_model


app = FastAPI(
    title="NexApex AI Studio API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(vision_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    mem = psutil.virtual_memory()
    return {
        "status": "ok",
        "models_loaded": app.state.models_loaded,
        "memory": {
            "total_mb": round(mem.total / 1024 / 1024),
            "used_mb": round(mem.used / 1024 / 1024),
            "percent": mem.percent,
        },
    }
```

**Step 4: Download YOLO26n model for dev**

```bash
cd backend && mkdir -p models && python -c "from ultralytics import YOLO; m = YOLO('yolo26n.pt'); print(f'Model loaded: {m.model_name}')"
```

If the model downloads to the working directory, move it:

```bash
mv yolo26n.pt models/ 2>/dev/null; ls models/yolo26n.pt
```

**Step 5: Test the endpoint manually**

Start the server:

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

Verify health:

```bash
curl http://localhost:8000/health
```

Expected: `{"status": "ok", "models_loaded": true, ...}`

Verify OpenAPI docs show `/api/v1/vision/detect`:

```bash
curl -s http://localhost:8000/openapi.json | python -c "import json,sys; d=json.load(sys.stdin); print([p for p in d['paths'] if 'vision' in p])"
```

Expected: `['/api/v1/vision/detect']`

**Step 6: Commit**

```bash
git add backend/app/vision/router.py backend/app/main.py backend/app/config.py
git commit -m "feat(vision): add /vision/detect endpoint with YOLO26n lifespan loading"
```

---

## Task 4: Sample Images

**Files:**
- Create: `public/images/samples/retail-shelf.jpg`
- Create: `public/images/samples/restaurant-kitchen.jpg`
- Create: `public/images/samples/warehouse.jpg`

**Step 1: Create the samples directory**

```bash
mkdir -p public/images/samples
```

**Step 2: Source sample images**

Find 3 high-quality, royalty-free images that produce strong YOLO26n results:

1. **Retail shelf** — Photo of a store shelf packed with bottles, cans, and boxes. Source from Unsplash/Pexels. Target: 20-30 YOLO26n detections.
2. **Restaurant kitchen** — Photo with bowls, cups, knives, people, and food visible. Multiple class types for rich results.
3. **Warehouse** — Photo with people, trucks/forklifts, and boxes. Person + vehicle combo triggers manufacturing pitch.

Download and save to `public/images/samples/`. Resize to max 1920px wide, JPEG quality 85 to keep file size under 500KB.

**Step 3: Test each sample against YOLO26n**

```bash
cd backend && python -c "
from ultralytics import YOLO
from PIL import Image
model = YOLO('models/yolo26n.pt')
for name in ['retail-shelf', 'restaurant-kitchen', 'warehouse']:
    path = f'../public/images/samples/{name}.jpg'
    results = model.predict(source=path, conf=0.25, save=False, verbose=False)
    r = results[0]
    names = [model.names[int(c)] for c in r.boxes.cls.cpu().numpy().astype(int)]
    confs = r.boxes.conf.cpu().numpy()
    print(f'{name}: {len(names)} objects, {len(set(names))} classes, avg conf {confs.mean():.2f}')
    print(f'  Classes: {dict(zip(*__import__(\"numpy\").unique(names, return_counts=True)))}')
"
```

**Acceptance criteria:** Each image must produce 10+ detections with average confidence above 0.6. If any image fails, replace it with a better one and re-test.

**Step 4: Commit**

```bash
git add public/images/samples/
git commit -m "feat(vision): add 3 curated sample images for vision demo"
```

---

## Task 5: Frontend — VisionSkeleton (Loading State)

**Files:**
- Create: `src/components/demos/VisionSkeleton.tsx`

**Step 1: Write the loading skeleton component**

```tsx
// src/components/demos/VisionSkeleton.tsx
"use client";

export function VisionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-white/5" />

      {/* Stats placeholder */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="flex-1 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify it renders in dev**

Start Next.js dev server and temporarily import into vision page to verify visually. Then revert.

**Step 3: Commit**

```bash
git add src/components/demos/VisionSkeleton.tsx
git commit -m "feat(vision): add skeleton loading state component"
```

---

## Task 6: Frontend — BoundingBoxCanvas

**Files:**
- Create: `src/components/demos/BoundingBoxCanvas.tsx`

**Step 1: Write the bounding box canvas overlay**

This component renders detection boxes on a canvas layered over the uploaded image. Colors are assigned per class via HSL hue hashing.

```tsx
// src/components/demos/BoundingBoxCanvas.tsx
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
```

**Step 2: Commit**

```bash
git add src/components/demos/BoundingBoxCanvas.tsx
git commit -m "feat(vision): add canvas bounding box overlay component"
```

---

## Task 7: Frontend — BusinessSuggestionCard

**Files:**
- Create: `src/components/demos/BusinessSuggestionCard.tsx`

**Step 1: Write the delayed-reveal business suggestion card**

```tsx
// src/components/demos/BusinessSuggestionCard.tsx
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

    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(card, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      card,
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.7, delay: 1.5, ease: "power3.out" }
    );
  }, [suggestion]);

  return (
    <div
      ref={cardRef}
      className="invisible rounded-2xl border border-[#94fcff]/20 bg-[#94fcff]/5 p-6 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#94fcff]/10">
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
        className="inline-flex cursor-pointer items-center rounded-full bg-[#94fcff] px-5 py-2.5 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] transition-all duration-200 hover:bg-[#b0fdff] hover:shadow-[0_0_16px_rgba(148,252,255,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-full"
      >
        {suggestion.cta_text}
      </a>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/demos/BusinessSuggestionCard.tsx
git commit -m "feat(vision): add delayed-reveal business suggestion card"
```

---

## Task 8: Frontend — VisionInspector (Main Component)

**Files:**
- Create: `src/components/demos/VisionInspector.tsx`

**Step 1: Write the main Vision Inspector client component**

```tsx
// src/components/demos/VisionInspector.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, AlertCircle, RefreshCw } from "lucide-react";
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
              ? "border-[#94fcff]/60 bg-[#94fcff]/5"
              : "border-white/10 bg-nex-surface hover:border-[#94fcff]/30 hover:bg-nex-surface2"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#94fcff]/10">
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
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Sample images */}
        <div>
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim">
            Or try a sample
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleClick(sample.src)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-nex-surface transition-all duration-200 hover:border-[#94fcff]/20 hover:shadow-[0_0_12px_rgba(148,252,255,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-xl"
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
              <div className="rounded-xl bg-nex-surface border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
                  {result.total_objects}
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Objects
                </p>
              </div>
              <div className="rounded-xl bg-nex-surface border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
                  {result.unique_classes}
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Categories
                </p>
              </div>
              <div className="rounded-xl bg-nex-surface border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-[#94fcff] font-[family-name:var(--font-display)]">
                  {result.processing_time_ms < 1000
                    ? `${result.processing_time_ms}ms`
                    : `${(result.processing_time_ms / 1000).toFixed(1)}s`}
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-nex-dim">
                  Speed
                </p>
              </div>
            </div>

            {/* Detection list */}
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[400px] rounded-xl bg-nex-surface border border-white/[0.06] p-4">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
                Detections
              </p>
              {result.detections.map((det, i) => (
                <div
                  key={`${det.class_name}-${i}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                >
                  <span className="min-w-[90px] text-xs text-white/80 truncate">
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
```

**Step 2: Commit**

```bash
git add src/components/demos/VisionInspector.tsx
git commit -m "feat(vision): add VisionInspector main component with upload, samples, results"
```

---

## Task 9: Frontend — Update Vision Page (Server Component + Dynamic Import)

**Files:**
- Modify: `src/app/(studio)/demos/vision/page.tsx`

**Step 1: Update the vision page to dynamically import VisionInspector**

```tsx
// src/app/(studio)/demos/vision/page.tsx
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Eye } from "lucide-react";

const VisionInspector = dynamic(
  () =>
    import("@/components/demos/VisionInspector").then((m) => ({
      default: m.VisionInspector,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff]" />
      </div>
    ),
  }
);

export default function VisionPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Breadcrumb toolbar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim hover:text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-sm"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#94fcff]/10">
            <Eye size={20} className="text-[#94fcff]" />
          </div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
            Vision Inspector
          </h1>
        </div>
        <p className="max-w-xl text-sm text-nex-dim">
          Upload an image or try a sample to see real-time AI object detection. Our model identifies objects, counts them, and shows how custom AI could work for your business.
        </p>
      </div>

      {/* Workspace */}
      <div className="flex-1 px-4 pb-12 md:px-[60px]">
        <VisionInspector />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(studio\)/demos/vision/page.tsx
git commit -m "feat(vision): wire up VisionInspector with dynamic import on vision page"
```

---

## Task 10: API Proxy Route

**Files:**
- Create: `src/app/api/v1/proxy/[...path]/route.ts`

The frontend calls `/api/v1/proxy/vision/detect` which proxies to `http://localhost:8000/api/v1/vision/detect`. This simplifies CORS and cookie handling.

**Step 1: Create the catch-all proxy route**

```typescript
// src/app/api/v1/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = `/api/v1/${path.join("/")}`;
  const url = `${BACKEND_URL}${targetPath}`;

  const headers = new Headers();
  // Forward auth header
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  }
  // Forward cookies for JWT
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    // For multipart/form-data, pass the body stream directly
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      headers.set("content-type", contentType);
      init.body = await req.arrayBuffer();
    } else {
      headers.set("content-type", contentType);
      init.body = await req.text();
    }
  }

  try {
    const response = await fetch(url, init);
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
```

**Step 2: Commit**

```bash
git add "src/app/api/v1/proxy/[...path]/route.ts"
git commit -m "feat: add catch-all API proxy route to forward requests to FastAPI backend"
```

---

## Task 11: Integration Test — End-to-End Smoke

**Files:**
- None new — manual verification

**Step 1: Start backend**

```bash
cd backend && pip install -e ".[ai,dev]" && uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` returns `models_loaded: true`

**Step 2: Start frontend**

```bash
npm run dev
```

**Step 3: Manual smoke test**

1. Navigate to `http://localhost:3000/demos/vision`
2. Verify: page loads with upload dropzone + 3 sample buttons
3. Click "Retail Shelf" sample — verify loading skeleton appears
4. Verify: bounding boxes render over image, detection list shows on right
5. Verify: after ~1.5s, business suggestion card slides in with retail pitch
6. Click "Try another image" — verify returns to upload state
7. Test drag-and-drop with a local image
8. Test error state: upload a .gif file — verify inline error message

**Step 4: Responsive check**

Open Chrome DevTools, test at:
- 1440px (desktop): two-column layout
- 768px (tablet): single column
- 375px (mobile): single column, compact

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat(vision): Vision Inspector complete — YOLO26n backend + conversion-focused UI"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Vision schemas | `backend/app/vision/schemas.py` |
| 2 | Vision service (YOLO26n + clusters) | `backend/app/vision/service.py` |
| 3 | Vision router + main.py integration | `backend/app/vision/router.py`, `main.py`, `config.py` |
| 4 | Sample images | `public/images/samples/*.jpg` |
| 5 | VisionSkeleton loading state | `src/components/demos/VisionSkeleton.tsx` |
| 6 | BoundingBoxCanvas overlay | `src/components/demos/BoundingBoxCanvas.tsx` |
| 7 | BusinessSuggestionCard | `src/components/demos/BusinessSuggestionCard.tsx` |
| 8 | VisionInspector main component | `src/components/demos/VisionInspector.tsx` |
| 9 | Vision page update | `src/app/(studio)/demos/vision/page.tsx` |
| 10 | API proxy route | `src/app/api/v1/proxy/[...path]/route.ts` |
| 11 | Integration smoke test | Manual verification |
