# Vision Inspector — Architecture Design

**Date:** 2026-04-07
**Branch:** nexapex-v3-demo
**Phase:** 2 (Core Demos) — Tasks 7 & 8
**Status:** Approved

---

## Overview

The Vision Inspector is the first AI demo in the NexApex Studio. It lets non-technical SME visitors upload an image (or click a curated sample), see real YOLO26n object detection results with bounding boxes, then receive a business-specific suggestion card that bridges from "look what AI can do" to "imagine what it can do for YOUR business."

The conversion structure is a **two-layer reveal**: raw AI results first (the wow moment), then a delayed business pitch card (the conversion trigger).

---

## Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Model | YOLO26n (not YOLOv8n) | Latest ultralytics model per tutorial, better accuracy, same COCO classes |
| Architecture | Monolithic endpoint | Single POST, cluster mapping server-side, one round-trip |
| Input methods | Upload + 3 samples (no camera) | Samples are the primary conversion tool; camera adds friction |
| Suggestion delivery | 1.5s delayed slide-in | Two-step reveal: see AI results, then imagine business value |
| Confidence threshold | 0.25 default | Lower threshold = more visible detections = more impressive demo |

---

## Backend

### Endpoint

`POST /api/v1/vision/detect`

- **Input:** multipart image (JPEG/PNG/WebP, max 10MB) + optional `confidence_threshold` query param (default 0.25)
- **Auth:** `get_current_lead` dependency (JWT from httpOnly cookie)
- **Demo limit:** 10 uses, tracked on `Lead.vision_demos_used`
- **Model:** YOLO26n loaded at startup via FastAPI lifespan

### YOLO26n API (from tutorial + context7 docs)

```python
from ultralytics import YOLO

model = YOLO("yolo26n.pt")  # auto-downloads on first use
results = model.predict(source=img, conf=0.25, save=False, verbose=False)

for r in results:
    boxes = r.boxes
    xyxy = boxes.xyxy.cpu().numpy()      # [N, 4] bounding box coords
    conf = boxes.conf.cpu().numpy()       # [N] confidence scores
    cls = boxes.cls.cpu().numpy().astype(int)  # [N] class indices
    name = model.names[int(cls[i])]       # class name string
```

### Cluster-to-Industry Mapping

The core conversion logic. Groups COCO classes into industry clusters:

```python
INDUSTRY_CLUSTERS = {
    "retail": {
        "classes": {"bottle", "cup", "bowl", "vase", "book", "cell phone",
                    "laptop", "keyboard", "mouse", "remote", "handbag",
                    "backpack", "suitcase"},
        "title": "Smart Inventory & Retail Analytics",
        "pitch": "We detected {count} countable products in this image. Imagine this trained on YOUR specific inventory — automatic stock counting, misplaced item alerts, and shelf compliance monitoring.",
        "cta_text": "See how we helped a retail chain reduce stockouts by 34%"
    },
    "manufacturing": {
        "classes": {"person", "truck", "car", "bicycle", "motorcycle",
                    "bus", "train"},
        "title": "Workplace Safety & Operations",
        "pitch": "We identified {count} people and vehicles in this scene. A custom model could monitor PPE compliance, restricted zone violations, and vehicle-pedestrian proximity in real-time.",
        "cta_text": "Learn how AI-powered safety monitoring works"
    },
    "food": {
        "classes": {"pizza", "cake", "sandwich", "banana", "apple", "orange",
                    "donut", "hot dog", "carrot", "broccoli", "bowl", "cup",
                    "wine glass", "fork", "knife", "spoon"},
        "title": "F&B Quality & Kitchen Intelligence",
        "pitch": "We spotted {count} food items and kitchen objects. Custom vision can automate portion control, ingredient verification, and hygiene compliance for your kitchen.",
        "cta_text": "Discover AI solutions for food service"
    },
    "agriculture": {
        "classes": {"cow", "sheep", "horse", "bird", "cat", "dog",
                    "potted plant"},
        "title": "Smart Agriculture & Livestock",
        "pitch": "We detected {count} animals/plants in this image. Trained on your farm, this becomes automated livestock counting, health monitoring, and crop assessment.",
        "cta_text": "Explore precision agriculture solutions"
    },
}
```

**Matching logic:** Count detected classes per cluster, pick the cluster with the highest overlap. If no cluster has 2+ matches, return generic: "We detected N objects across M categories. Imagine this trained specifically on your products."

### Response Schema

```python
class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: list[float]          # [x1, y1, x2, y2]
    area_percentage: float

class BusinessSuggestion(BaseModel):
    industry: str              # "retail" | "manufacturing" | "food" | "agriculture" | "general"
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

### Files

| File | Purpose |
|------|---------|
| `backend/app/vision/__init__.py` | Package init |
| `backend/app/vision/schemas.py` | Pydantic V2 request/response models |
| `backend/app/vision/service.py` | YOLO inference + cluster matching logic |
| `backend/app/vision/router.py` | POST /vision/detect endpoint |
| `backend/app/main.py` | Update lifespan + register router |
| `backend/app/config.py` | Update model path to yolo26n.pt |

---

## Frontend

### Component Tree

```
vision/page.tsx (Server Component)
  └─ VisionInspector.tsx (Client, dynamic ssr:false)
       ├─ UploadZone — drag-and-drop + file input + 3 sample buttons
       ├─ VisionSkeleton — loading state (pulsing placeholders)
       ├─ ResultsView
       │    ├─ ImageCanvas — uploaded image + bounding box overlay (canvas)
       │    └─ DetectionStats — object count, unique classes, time, per-detection list
       └─ BusinessSuggestionCard — 1.5s delayed slide-in, industry pitch + CTA
```

### Upload Zone

- Dashed border container: `border-[#94fcff]/20`, drag-over → `border-[#94fcff]/60 bg-[#94fcff]/5`
- Upload icon (Lucide `Upload`) + "Drop an image or click to upload" text
- Accepted: JPEG, PNG, WebP. Max 10MB.
- Below: 3 sample image buttons as small cards with thumbnail + label
  - "Retail Shelf", "Restaurant Kitchen", "Warehouse"
  - `min-h-[44px]`, `cursor-pointer`, hover: `shadow-[0_0_12px_rgba(148,252,255,0.1)]`

### Sample Images

3 curated images in `public/images/samples/`:
- `retail-shelf.jpg` — packed shelf with bottles, cans, boxes (target: 20-30 detections)
- `restaurant-kitchen.jpg` — bowls, cups, knives, people, food (multiple class types)
- `warehouse.jpg` — people, trucks, boxes (person + vehicle combo)

**Selection criteria:** Each must produce 10+ detections with 80%+ average confidence from YOLO26n.

### Bounding Box Overlay

- HTML Canvas layered on top of image via `position: absolute`
- Each detection: colored rectangle + label pill (class name + confidence %)
- Color per class: hash class name to HSL hue for consistent coloring
- Canvas resizes with image (responsive)

### Detection Stats Panel

- Desktop: right column. Mobile: below image.
- Total objects detected (large number)
- Unique categories count
- Processing time (ms)
- Per-detection list: class name + horizontal confidence bar (cyan gradient fill) + area %

### Business Suggestion Card (Conversion Trigger)

- Appears 1.5s after results load
- GSAP `fromTo` animation: slides up, opacity 0→1
- `prefers-reduced-motion`: show immediately, no animation
- Glassmorphism card: `bg-[#94fcff]/5 border border-[#94fcff]/20 backdrop-blur-sm`
- Content: industry icon + title + pitch paragraph (dynamic {count}) + CTA button
- CTA: `mailto:hello@nexapex.ai` for now (Cal.com embed in Phase 3)

### Loading State (VisionSkeleton)

- Pulsing placeholder for image area (`animate-pulse bg-white/5 rounded-xl`)
- Pulsing bars for stats panel
- Shown during inference round-trip

### Responsive Layout

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px (desktop) | Two-column: image+boxes left, stats+suggestion right |
| 768-1023px (tablet) | Single column stacked |
| <768px (mobile) | Single column, compact spacing |

### Error States

| Error | UI |
|-------|-----|
| File too large (>10MB) | Inline error toast below dropzone |
| Unsupported format | Inline error with accepted formats |
| Demo limit reached (10) | Overlay with "Book a consultation" CTA |
| Server error | Generic retry message with retry button |

### Files

| File | Purpose |
|------|---------|
| `src/app/(studio)/demos/vision/page.tsx` | Server component, dynamic import |
| `src/components/demos/VisionInspector.tsx` | Main client component |
| `src/components/demos/BoundingBoxCanvas.tsx` | Canvas overlay for detections |
| `src/components/demos/BusinessSuggestionCard.tsx` | Delayed-reveal conversion card |
| `src/components/demos/VisionSkeleton.tsx` | Loading state |
| `public/images/samples/retail-shelf.jpg` | Sample image |
| `public/images/samples/restaurant-kitchen.jpg` | Sample image |
| `public/images/samples/warehouse.jpg` | Sample image |

---

## Data Flow

```
User clicks sample / drops image
  → Client shows VisionSkeleton (loading state)
  → POST /api/v1/vision/detect (multipart, JWT cookie)
  → FastAPI: validate file → YOLO26n inference → cluster matching → response
  → Client renders:
      1. Image + bounding box canvas overlay (immediate)
      2. Detection stats panel (immediate)
      3. Business suggestion card (1.5s delayed slide-in via GSAP)
```

---

## Brand Consistency

| Element | Value |
|---------|-------|
| Background | `#0e1418` |
| Text | `#f0f1ef` |
| Accent / CTA | `#94fcff` (cyan) |
| Muted text | `text-nex-dim` (white/50) |
| Surfaces | `bg-nex-surface` / `bg-nex-surface2` |
| Display font | Nevera |
| Body font | Nexa |
| Cards | glassmorphism, subtle glow, `border-white/[0.06]` |
| Icons | Lucide SVGs only (no emojis) |

---

## Accessibility

- All interactive elements: visible focus rings (`outline-[#94fcff]/60`)
- `prefers-reduced-motion`: skip GSAP animations, show content immediately
- Image alt text: "Uploaded image with {N} detected objects highlighted"
- Color contrast: `#94fcff` on `#0e1418` = 12.6:1 (WCAG AAA)
- Touch targets: ≥44x44px on all buttons
- `cursor-pointer` on all clickable elements
- Skeleton loading states (no frozen UI)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Vision inference | < 3s |
| Demo page LCP | < 2s on 4G |
| 3D libs on demo pages | 0 bytes |
| Demo page total JS | < 200KB gzipped |
