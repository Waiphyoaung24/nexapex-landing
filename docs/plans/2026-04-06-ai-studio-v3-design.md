# NexApex AI Studio v3 — Architecture Design

**Date:** 2026-04-06
**Branch:** nexapex-v3-demo
**PRD:** docs/nexapex_ai_studio_PRD.md
**Status:** Approved

---

## Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Scope | Full PRD (all features) | Build the complete platform feature-by-feature |
| Backend | FastAPI (separate Python service) | Real AI inference with YOLO + LLM + OCR |
| Frontend architecture | Route groups with isolated layouts | Zero 3D lib overhead on demo pages |
| Database | Neon PostgreSQL | Serverless, existing tooling, as PRD specifies |

---

## Frontend Architecture

### Route Groups (Performance Isolation)

```
src/app/
├── (marketing)/                    # 3D-heavy landing experience
│   ├── layout.tsx                  # SmoothScroll + GSAP + fonts + grain overlay
│   ├── page.tsx                    # Current landing page (Three.js, R3F, GSAP)
│   └── work/[slug]/page.tsx        # Portfolio pages
│
├── (studio)/                       # Lightweight AI demo experience
│   ├── layout.tsx                  # Minimal: fonts + dark theme + AuthProvider
│   ├── page.tsx                    # Redirect to /demos
│   ├── auth/page.tsx               # Email gate / signup
│   ├── demos/
│   │   ├── layout.tsx              # Demo nav + usage counter sidebar
│   │   ├── page.tsx                # Demo Hub (3 cards)
│   │   ├── vision/page.tsx         # Vision Inspector
│   │   ├── chat/page.tsx           # Smart Assistant
│   │   └── docs/page.tsx           # Document Intelligence
│   └── admin/
│       ├── layout.tsx              # Admin auth guard
│       └── page.tsx                # Admin analytics dashboard
│
├── api/v1/
│   ├── auth/signup/route.ts        # Auth handling
│   └── proxy/[...path]/route.ts    # Proxy to FastAPI
│
└── layout.tsx                      # REMOVED — each group has own root layout
```

### Performance Strategy

| Technique | Where | Impact |
|-----------|-------|--------|
| Route groups (separate root layouts) | `(marketing)` vs `(studio)` | Demo pages ship zero Three.js/R3F/GSAP bytes |
| Server Components by default | All pages/layouts | Only interactive parts are Client Components |
| `dynamic()` with `ssr: false` | Camera, dropzone, chat widget | Browser-only APIs lazy-loaded |
| `next/font` | Both layouts | Self-hosted fonts, no CLS |
| `next/image` | All images | Auto WebP, lazy loading |
| `@next/bundle-analyzer` | Build step | Track JS per route group |

### Studio Layout (Lightweight)

```tsx
// src/app/(studio)/layout.tsx
// NO Three.js, NO GSAP, NO SmoothScroll, NO Framer Motion
import { AuthProvider } from '@/lib/auth-context';

export default function StudioLayout({ children }) {
  return (
    <html lang="en" className={`${fonts} dark`}>
      <body className="min-h-full bg-[#0e1418] text-[#f0f1ef]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Demo Component Pattern (Server + Client Split)

```tsx
// src/app/(studio)/demos/vision/page.tsx — SERVER Component
import dynamic from 'next/dynamic';

const VisionInspector = dynamic(
  () => import('@/components/demos/VisionInspector'),
  { ssr: false, loading: () => <VisionSkeleton /> }
);

export default function VisionPage() {
  return (
    <div>
      <h1>Vision Inspector</h1>
      <p>Upload an image or use your camera to detect objects.</p>
      <VisionInspector />
    </div>
  );
}
```

---

## Backend Architecture (FastAPI)

### Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI + lifespan (model loading)
│   ├── config.py               # Pydantic Settings (env vars)
│   ├── dependencies.py         # get_db, get_current_user
│   ├── auth/
│   │   ├── router.py           # POST /signup, POST /verify-magic-link
│   │   ├── jwt.py              # create_token, verify_token
│   │   ├── schemas.py          # SignupRequest, TokenResponse
│   │   └── service.py          # Magic link email via Resend
│   ├── vision/
│   │   ├── router.py           # POST /vision/detect
│   │   ├── service.py          # YOLO singleton + inference
│   │   └── schemas.py          # DetectionResult, VisionResponse
│   ├── chat/
│   │   ├── router.py           # POST /chat/stream (SSE)
│   │   ├── service.py          # llama-cpp-python model
│   │   └── schemas.py          # ChatMessage, StreamChunk
│   ├── docs/
│   │   ├── router.py           # POST /docs/extract
│   │   ├── ocr_service.py      # Tesseract + preprocessing
│   │   ├── extraction.py       # Gemini structured extraction
│   │   └── schemas.py          # ExtractionResult
│   ├── admin/
│   │   ├── router.py           # GET /admin/leads, GET /admin/analytics
│   │   └── schemas.py          # LeadListResponse
│   ├── booking/
│   │   ├── router.py           # POST /booking/create, webhook
│   │   └── schemas.py          # BookingRequest
│   └── db/
│       ├── database.py         # Async engine (Neon)
│       ├── models.py           # SQLAlchemy ORM
│       └── migrations/         # Alembic
├── models/                     # AI weights (gitignored)
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml
```

### Memory Optimization

| Model | RAM | Strategy |
|-------|-----|----------|
| YOLOv8n | ~6MB | Tiny. Load at startup via lifespan. |
| LLM 7B GGUF Q4 | ~4GB | Biggest consumer. Q4 quantization. CPU for MVP. |
| Tesseract OCR | ~30MB | Per-call by pytesseract. |
| **Total** | **~4.5GB** | Fits in 8GB Railway/Fly.io instance |

```python
# Lifespan: load models ONCE at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.yolo_model = YOLO("models/yolov8n.pt")
    app.state.llm = Llama("models/nexapex-llm.gguf",
                           n_ctx=4096, n_gpu_layers=0)
    yield
    del app.state.llm
    del app.state.yolo_model
```

If memory is tight: run LLM in a separate process, so Vision + Docs work even if LLM is swapped.

---

## Data Flow

### Frontend ↔ Backend Communication

```
Browser → Next.js API Route (proxy) → FastAPI
Browser → FastAPI directly (SSE streaming for chat)
```

Next.js API routes proxy most calls (adds cookie handling, CORS simplification). Chat SSE connects directly to FastAPI to avoid buffering.

### Auth Flow

1. User visits `/demos` → middleware redirects to `/auth`
2. `POST /api/v1/auth/signup` → creates Lead → returns JWT
3. JWT stored in httpOnly cookie
4. Middleware on `(studio)/demos/*` checks cookie
5. Returning users: email → magic link → JWT reissued

---

## Integration Points

| Service | Purpose | Phase |
|---------|---------|-------|
| Neon PostgreSQL | Leads, sessions, bookings | 1 |
| Gemini API | Structured doc extraction | 2 |
| Resend | Transactional emails | 3 |
| Cal.com | Booking widget + webhooks | 3 |
| PostHog | Funnel analytics | 4 |

---

## Build Order (Feature-by-Feature)

### Phase 1: Foundation (Week 1)
1. Restructure to route groups — `(marketing)` + `(studio)`
2. FastAPI scaffold — health endpoint, CORS, Docker Compose
3. Database schema — Alembic migrations (Lead, DemoSession, Booking, AdminUser)
4. Auth endpoints — signup, magic link, JWT
5. Email gate UI — signup form at `(studio)/auth`

### Phase 2: Core Demos (Week 2-3)
6. Demo Hub — 3 cards, usage counters, responsive
7. Vision Inspector — upload + camera, YOLO inference, bounding boxes, suggestions
8. Smart Assistant — chat streaming SSE, conversation context, language selector
9. Document Intelligence — upload, OCR + Gemini, structured results

### Phase 3: Conversion (Week 4)
10. Booking integration — Cal.com embed, webhook, pre-fill
11. Demo limits + CTAs — counter enforcement, gating overlay
12. Transactional emails — welcome, magic link, booking confirm via Resend

### Phase 4: Admin + Analytics (Week 5)
13. Admin dashboard — leads table, filters, CSV export
14. Admin auth — email + password + TOTP
15. PostHog — funnel events, demo tracking

### Phase 5: Polish + Performance (Week 6)
16. Bundle optimization — analyzer, tree-shaking
17. Lighthouse audit — 90+ marketing, 95+ demos
18. E2E tests — Playwright signup → demo → booking flow
19. Error handling — offline fallbacks, cached samples

---

## Performance Targets

| Metric | Target | Phase |
|--------|--------|-------|
| 3D libs on demo pages | 0 bytes | 1 |
| Demo page LCP | < 2s on 4G | 2 |
| Vision inference | < 3s | 2 |
| Chat first token | < 1s | 2 |
| Marketing Lighthouse | > 90 | 5 |
| Demo Lighthouse | > 95 | 5 |
| Demo page total JS | < 200KB gzipped | 5 |

---

## Brand Consistency

All demo UIs use the existing NexApex design system:
- Background: `#0e1418`
- Text: `#f0f1ef`
- Accent: `#94fcff` (cyan)
- Fonts: Nevera (display), Nexa (body)
- Cards: glassmorphism, subtle glow
- Dark theme throughout
