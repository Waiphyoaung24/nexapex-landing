# NexApex AI Studio v3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack AI demo platform (email gate + 3 AI demos + admin + booking) on top of the existing NexApex marketing site, with zero performance impact on the landing page.

**Architecture:** Next.js 16 route groups isolate the heavy 3D marketing site `(marketing)` from the lightweight demo studio `(studio)`. FastAPI backend serves YOLO vision, LLM chat (SSE), and OCR+Gemini document extraction. Neon PostgreSQL stores leads, sessions, bookings.

**Tech Stack:** Next.js 16, React 19, FastAPI, SQLAlchemy async, Alembic, YOLOv8 (ultralytics), llama-cpp-python, pytesseract, Gemini API, Neon PostgreSQL, Resend, Cal.com, PostHog, Tailwind 4, shadcn

**Design doc:** `docs/plans/2026-04-06-ai-studio-v3-design.md`
**PRD:** `docs/nexapex_ai_studio_PRD.md`

---

## Phase 1: Foundation

### Task 1: Restructure to Route Groups

Move the current single-layout app into `(marketing)` route group and create the `(studio)` route group with its own lightweight root layout. This is the core performance optimization — demo pages will never load Three.js, R3F, GSAP, or Framer Motion.

**Files:**
- Move: `src/app/layout.tsx` -> `src/app/(marketing)/layout.tsx`
- Move: `src/app/page.tsx` -> `src/app/(marketing)/page.tsx`
- Move: `src/app/globals.css` -> `src/styles/globals.css` (shared by both layouts)
- Create: `src/app/(studio)/layout.tsx`
- Create: `src/app/(studio)/page.tsx`
- Delete: `src/app/layout.tsx` (replaced by per-group root layouts)

**Step 1: Create the (marketing) route group directory**

```bash
mkdir -p src/app/\(marketing\)
```

**Step 2: Move globals.css to a shared location**

```bash
mkdir -p src/styles
mv src/app/globals.css src/styles/globals.css
```

**Step 3: Move current layout.tsx into (marketing)**

Copy `src/app/layout.tsx` to `src/app/(marketing)/layout.tsx`. Update the CSS import path:

```tsx
// src/app/(marketing)/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import { SmoothScrollProvider } from "@/components/SmoothScroll";

const nevera = localFont({
  src: "../../../public/fonts/nevera-font/Nevera-Regular.otf",
  variable: "--font-display",
  display: "swap",
});

const nexa = localFont({
  src: [
    { path: "../../../public/fonts/Nexa-Font/NexaLight.otf", weight: "300" },
    { path: "../../../public/fonts/Nexa-Font/NexaRegular.otf", weight: "400" },
    { path: "../../../public/fonts/Nexa-Font/NexaBold.otf", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexApex - Where AI Reaches Its Peak",
  description: "NEX APEX is an AI tech solutions company driving businesses to the pinnacle of technological capability.",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nevera.variable} ${nexa.variable} dark h-full antialiased`}>
      <body suppressHydrationWarning className="grain-overlay min-h-full bg-[#0e1418] text-[#f0f1ef]">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
```

**Step 4: Move current page.tsx into (marketing)**

```bash
mv src/app/page.tsx src/app/\(marketing\)/page.tsx
```

No changes needed to page.tsx content — imports remain the same with `@/` alias.

**Step 5: Create the (studio) root layout**

```tsx
// src/app/(studio)/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";

const nevera = localFont({
  src: "../../../public/fonts/nevera-font/Nevera-Regular.otf",
  variable: "--font-display",
  display: "swap",
});

const nexa = localFont({
  src: [
    { path: "../../../public/fonts/Nexa-Font/NexaLight.otf", weight: "300" },
    { path: "../../../public/fonts/Nexa-Font/NexaRegular.otf", weight: "400" },
    { path: "../../../public/fonts/Nexa-Font/NexaBold.otf", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexApex AI Studio",
  description: "Try real AI demos — computer vision, smart chat, and document intelligence.",
};

export default function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nevera.variable} ${nexa.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-[#0e1418] text-[#f0f1ef]">
        {children}
      </body>
    </html>
  );
}
```

Note: NO SmoothScrollProvider, NO GSAP, NO Three.js imports. This is the key performance isolation.

**Step 6: Create studio landing page (redirect to demos)**

```tsx
// src/app/(studio)/page.tsx
import { redirect } from "next/navigation";

export default function StudioRoot() {
  redirect("/demos");
}
```

**Step 7: Delete the old root layout**

```bash
rm src/app/layout.tsx
```

Also remove `src/app/favicon.ico` if it exists at root — move to `public/favicon.ico` if not already there.

**Step 8: Update next.config.ts for the shared styles path**

Verify `@/styles/globals.css` resolves correctly. The existing `@` alias in tsconfig should handle it. Check `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 9: Run dev server and verify**

```bash
npm run dev
```

Expected: Landing page at `/` renders exactly as before (3D, GSAP, everything). Navigate to `/demos` — should show a blank page with dark background, NO console errors about GSAP/Three.js.

**Step 10: Verify bundle isolation**

```bash
npx next build
```

Check `.next/static/chunks` — the `(studio)` route group should NOT contain any Three.js, R3F, GSAP, or Framer Motion chunks. The `(marketing)` group should contain them.

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: restructure to route groups — isolate marketing 3D from studio"
```

---

### Task 2: Create Demo Hub Page (Static UI)

Build the demo hub page with 3 demo cards. This is pure UI — no API calls yet.

**Files:**
- Create: `src/app/(studio)/demos/layout.tsx`
- Create: `src/app/(studio)/demos/page.tsx`
- Create: `src/components/studio/DemoCard.tsx`
- Create: `src/components/studio/StudioHeader.tsx`

**Step 1: Create the demos layout with studio header**

```tsx
// src/app/(studio)/demos/layout.tsx
import { StudioHeader } from "@/components/studio/StudioHeader";

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

**Step 2: Create the StudioHeader component**

```tsx
// src/components/studio/StudioHeader.tsx
import Link from "next/link";

export function StudioHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e1418]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/images/Flat_white.png"
            alt="NexApex"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-bold uppercase font-[family-name:var(--font-display)] tracking-[2px] text-white">
            AI Studio
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/demos"
            className="text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            Demos
          </Link>
          <a
            href="mailto:support@nexapex.ai"
            className="rounded-full bg-[#94fcff] px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] hover:bg-[#b0fdff] transition-colors"
          >
            Book a Call
          </a>
        </div>
      </div>
    </header>
  );
}
```

**Step 3: Create the DemoCard component**

```tsx
// src/components/studio/DemoCard.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DemoCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  usageLabel: string;
  tags: string[];
}

export function DemoCard({ title, description, href, icon, usageLabel, tags }: DemoCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-2xl p-6 md:p-8",
        "bg-[#162029] border border-white/[0.06]",
        "hover:border-[#94fcff]/20 hover:bg-[#1d2d39]",
        "transition-all duration-300"
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#94fcff]/10 text-[#94fcff]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
        {title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-white/50">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-[#94fcff]/5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#94fcff]/60">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
          {usageLabel}
        </span>
        <span className="rounded-full bg-[#94fcff] px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] group-hover:bg-[#b0fdff] transition-colors">
          Try Now
        </span>
      </div>
    </Link>
  );
}
```

**Step 4: Create the Demo Hub page**

```tsx
// src/app/(studio)/demos/page.tsx
import { DemoCard } from "@/components/studio/DemoCard";
import { Eye, MessageCircle, FileText } from "lucide-react";

export default function DemoHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
          AI Demo Hub
        </h1>
        <p className="mx-auto max-w-2xl text-base text-white/50">
          Try real AI capabilities. Upload your own data and see results instantly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <DemoCard
          title="Vision Inspector"
          description="Upload an image or use your camera to detect objects with real-time computer vision."
          href="/demos/vision"
          icon={<Eye size={24} />}
          usageLabel="10 demos available"
          tags={["Manufacturing", "Retail", "QC"]}
        />
        <DemoCard
          title="Smart Assistant"
          description="Chat with an AI business consultant that understands Southeast Asian markets."
          href="/demos/chat"
          icon={<MessageCircle size={24} />}
          usageLabel="20 messages available"
          tags={["F&B", "Agriculture", "Tech"]}
        />
        <DemoCard
          title="Document Intelligence"
          description="Upload invoices, receipts, or documents to extract structured data automatically."
          href="/demos/docs"
          icon={<FileText size={24} />}
          usageLabel="5 documents available"
          tags={["Finance", "Admin", "Logistics"]}
        />
      </div>
    </div>
  );
}
```

**Step 5: Create placeholder pages for each demo**

```tsx
// src/app/(studio)/demos/vision/page.tsx
export default function VisionPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-bold text-white">Vision Inspector</h1>
      <p className="text-white/50">Coming soon...</p>
    </div>
  );
}
```

```tsx
// src/app/(studio)/demos/chat/page.tsx
export default function ChatPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-bold text-white">Smart Assistant</h1>
      <p className="text-white/50">Coming soon...</p>
    </div>
  );
}
```

```tsx
// src/app/(studio)/demos/docs/page.tsx
export default function DocsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-bold text-white">Document Intelligence</h1>
      <p className="text-white/50">Coming soon...</p>
    </div>
  );
}
```

**Step 6: Run dev server and verify**

```bash
npm run dev
```

Navigate to `/demos` — should see 3 demo cards. Click each card — navigates to placeholder. No GSAP/Three.js console errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add demo hub page with 3 demo cards and studio header"
```

---

### Task 3: Scaffold FastAPI Backend

Create the Python backend project with health endpoint, CORS, and Docker Compose for local development.

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/pyproject.toml`
- Create: `backend/Dockerfile`
- Create: `backend/docker-compose.yml`
- Create: `backend/.env.example`

**Step 1: Create backend directory**

```bash
mkdir -p backend/app
```

**Step 2: Create pyproject.toml**

```toml
# backend/pyproject.toml
[project]
name = "nexapex-studio-api"
version = "0.1.0"
description = "NexApex AI Studio inference API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.17",
    "slowapi>=0.1.9",
    "psutil>=6.1.0",
]

[project.optional-dependencies]
ai = [
    "ultralytics>=8.3.0",
    "llama-cpp-python>=0.3.0",
    "pytesseract>=0.3.13",
    "Pillow>=11.0.0",
    "google-generativeai>=0.8.0",
    "opencv-python-headless>=4.10.0",
]
email = [
    "resend>=2.5.0",
]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
]
```

**Step 3: Create config.py**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API
    api_prefix: str = "/api/v1"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexapex_studio"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # AI Models (paths)
    yolo_model_path: str = "models/yolov8n.pt"
    llm_model_path: str = "models/nexapex-llm.gguf"
    llm_context_length: int = 4096

    # External APIs
    gemini_api_key: str = ""
    resend_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
```

**Step 4: Create main.py**

```python
# backend/app/main.py
import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load AI models here later
    app.state.models_loaded = False
    yield
    # Shutdown: cleanup

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

**Step 5: Create .env.example**

```bash
# backend/.env.example
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/nexapex_studio
JWT_SECRET=change-me-in-production
GEMINI_API_KEY=
RESEND_API_KEY=
ALLOWED_ORIGINS=["http://localhost:3000"]
```

**Step 6: Create Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps for pytesseract/opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 7: Create docker-compose.yml**

```yaml
# backend/docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nexapex_studio
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db:5432/nexapex_studio
      JWT_SECRET: dev-secret-change-me
    depends_on:
      - db
    volumes:
      - ./app:/app/app  # hot reload

volumes:
  pgdata:
```

**Step 8: Test the backend starts**

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Navigate to `http://localhost:8000/health` — should return JSON with status "ok".

**Step 9: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with health endpoint and Docker Compose"
```

---

### Task 4: Database Schema + Migrations

Set up SQLAlchemy async models and Alembic migrations for Lead, DemoSession, Booking, AdminUser.

**Files:**
- Create: `backend/app/db/database.py`
- Create: `backend/app/db/models.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`

**Step 1: Create database.py**

```python
# backend/app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session
```

**Step 2: Create ORM models**

```python
# backend/app/db/models.py
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import enum

class Base(DeclarativeBase):
    pass

class Industry(str, enum.Enum):
    manufacturing = "manufacturing"
    fnb = "fnb"
    retail = "retail"
    agriculture = "agriculture"
    technology = "technology"
    other = "other"

class DemoType(str, enum.Enum):
    vision = "vision"
    chat = "chat"
    document = "document"

class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"

class AdminRole(str, enum.Enum):
    admin = "admin"
    viewer = "viewer"

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    company: Mapped[str | None] = mapped_column(String(200))
    industry: Mapped[Industry | None] = mapped_column(SAEnum(Industry))
    token_hash: Mapped[str] = mapped_column(String(64))
    vision_demos_used: Mapped[int] = mapped_column(Integer, default=0)
    chat_demos_used: Mapped[int] = mapped_column(Integer, default=0)
    doc_demos_used: Mapped[int] = mapped_column(Integer, default=0)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions: Mapped[list["DemoSession"]] = relationship(back_populates="lead")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="lead")

class DemoSession(Base):
    __tablename__ = "demo_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    demo_type: Mapped[DemoType] = mapped_column(SAEnum(DemoType))
    input_metadata: Mapped[dict | None] = mapped_column(JSONB)
    result_summary: Mapped[dict | None] = mapped_column(JSONB)
    processing_time_ms: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lead: Mapped["Lead"] = relationship(back_populates="sessions")

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    timezone: Mapped[str] = mapped_column(String(50))
    problem_description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus), default=BookingStatus.pending)
    calendar_event_id: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lead: Mapped["Lead"] = relationship(back_populates="bookings")

class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    totp_secret: Mapped[str | None] = mapped_column(String(32))
    role: Mapped[AdminRole] = mapped_column(SAEnum(AdminRole), default=AdminRole.viewer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

**Step 3: Initialize Alembic**

```bash
cd backend
pip install alembic
alembic init alembic
```

**Step 4: Configure alembic/env.py for async**

Update `alembic/env.py` — replace the `run_migrations_online` function to use async engine:

```python
# backend/alembic/env.py (key sections to modify)
from app.db.models import Base
from app.config import settings

target_metadata = Base.metadata

# In run_migrations_online():
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio

def run_migrations_online():
    connectable = create_async_engine(settings.database_url)

    async def do_run():
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()

    def do_run_migrations(connection):
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

    asyncio.run(do_run())
```

Update `alembic.ini` — set `sqlalchemy.url` to empty (we use config.py):

```ini
sqlalchemy.url =
```

**Step 5: Generate initial migration**

```bash
cd backend
alembic revision --autogenerate -m "initial schema"
```

**Step 6: Run migration (requires Postgres running)**

```bash
docker compose up -d db
alembic upgrade head
```

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat: add database schema with Lead, DemoSession, Booking, AdminUser models"
```

---

### Task 5: Auth Endpoints (Signup + JWT)

Implement the email gate backend — signup endpoint that creates a lead and returns a JWT.

**Files:**
- Create: `backend/app/auth/router.py`
- Create: `backend/app/auth/jwt.py`
- Create: `backend/app/auth/schemas.py`
- Create: `backend/app/auth/service.py`
- Create: `backend/app/dependencies.py`
- Modify: `backend/app/main.py` (add router)

**Step 1: Create JWT utilities**

```python
# backend/app/auth/jwt.py
import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

def create_access_token(lead_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": lead_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def verify_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
```

**Step 2: Create auth schemas**

```python
# backend/app/auth/schemas.py
from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    company: str | None = None
    industry: str | None = None

class SignupResponse(BaseModel):
    id: str
    email: str
    name: str
    token: str
    demos_remaining: dict[str, int]
```

**Step 3: Create dependencies**

```python
# backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.auth.jwt import verify_access_token

security = HTTPBearer()

async def get_current_lead(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    payload = verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    from app.db.models import Lead
    from sqlalchemy import select
    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Lead not found")
    return lead
```

**Step 4: Create auth router**

```python
# backend/app/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Lead
from app.auth.schemas import SignupRequest, SignupResponse
from app.auth.jwt import create_access_token, hash_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(Lead).where(Lead.email == req.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    token = create_access_token(str(lead_id := __import__("uuid").uuid4()), req.email)

    lead = Lead(
        id=lead_id,
        email=req.email,
        name=req.name,
        company=req.company,
        industry=req.industry,
        token_hash=hash_token(token),
    )
    db.add(lead)
    await db.commit()

    return SignupResponse(
        id=str(lead.id),
        email=lead.email,
        name=lead.name,
        token=token,
        demos_remaining={"vision": 10, "chat": 20, "document": 5},
    )
```

**Step 5: Register router in main.py**

Add to `backend/app/main.py`:

```python
from app.auth.router import router as auth_router
app.include_router(auth_router, prefix=settings.api_prefix)
```

**Step 6: Test the endpoint**

```bash
# Start the API
uvicorn app.main:app --reload --port 8000

# Test signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

Expected: 201 response with JWT token.

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat: add auth signup endpoint with JWT token generation"
```

---

### Task 6: Email Gate Frontend

Create the signup form UI that gates access to demos.

**Files:**
- Create: `src/app/(studio)/auth/page.tsx`
- Create: `src/components/studio/EmailGateForm.tsx`
- Create: `src/lib/api.ts`
- Create: `src/lib/auth-context.tsx`
- Modify: `src/app/(studio)/layout.tsx` (add AuthProvider)

**Step 1: Create API client**

```tsx
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
```

**Step 2: Create auth context**

```tsx
// src/lib/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthState {
  token: string | null;
  email: string | null;
  name: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, email: string, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, email: null, name: null });

  useEffect(() => {
    const stored = localStorage.getItem("nexapex_auth");
    if (stored) {
      try { setAuth(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const login = useCallback((token: string, email: string, name: string) => {
    const state = { token, email, name };
    setAuth(state);
    localStorage.setItem("nexapex_auth", JSON.stringify(state));
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, email: null, name: null });
    localStorage.removeItem("nexapex_auth");
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

**Step 3: Create EmailGateForm**

```tsx
// src/components/studio/EmailGateForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";

export function EmailGateForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiPost<{ token: string; email: string; name: string }>("/auth/signup", {
        email, name,
        company: company || undefined,
        industry: industry || undefined,
      });
      login(res.token, res.email, res.name);
      router.push("/demos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <input
        type="email"
        required
        placeholder="Email address *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg bg-[#162029] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#94fcff]/30 focus:outline-none transition-colors"
      />
      <input
        type="text"
        required
        placeholder="Your name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg bg-[#162029] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#94fcff]/30 focus:outline-none transition-colors"
      />
      <input
        type="text"
        placeholder="Company name (optional)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="rounded-lg bg-[#162029] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#94fcff]/30 focus:outline-none transition-colors"
      />
      <select
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        className="rounded-lg bg-[#162029] border border-white/[0.06] px-4 py-3 text-sm text-white focus:border-[#94fcff]/30 focus:outline-none transition-colors"
      >
        <option value="">Industry (optional)</option>
        <option value="manufacturing">Manufacturing</option>
        <option value="fnb">Food & Beverage</option>
        <option value="retail">Retail</option>
        <option value="agriculture">Agriculture</option>
        <option value="technology">Technology</option>
        <option value="other">Other</option>
      </select>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[#94fcff] px-6 py-3 text-sm font-mono font-medium uppercase tracking-wider text-[#0e1418] hover:bg-[#b0fdff] disabled:opacity-50 transition-colors"
      >
        {loading ? "Signing up..." : "Try Our AI"}
      </button>

      <p className="text-[10px] text-white/30 text-center">
        Your data is never shared. Uploads auto-delete in 1 hour.
      </p>
    </form>
  );
}
```

**Step 4: Create auth page**

```tsx
// src/app/(studio)/auth/page.tsx
import { EmailGateForm } from "@/components/studio/EmailGateForm";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <img src="/images/Flat_white.png" alt="NexApex" className="mx-auto mb-6 h-12 w-12" />
        <h1 className="mb-2 text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
          AI Solutions Studio
        </h1>
        <p className="mb-8 text-sm text-white/50">
          Try real AI demos — computer vision, smart chat, and document intelligence.
        </p>
        <EmailGateForm />
      </div>
    </div>
  );
}
```

**Step 5: Add AuthProvider to studio layout**

Update `src/app/(studio)/layout.tsx` to wrap children with AuthProvider:

```tsx
import { AuthProvider } from "@/lib/auth-context";

// In the body:
<body className="min-h-full bg-[#0e1418] text-[#f0f1ef]">
  <AuthProvider>
    {children}
  </AuthProvider>
</body>
```

**Step 6: Add .env.local for API URL**

```bash
# .env.local (frontend root)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Step 7: Run and test**

Start both backend and frontend. Navigate to `/auth` — see signup form. Submit — should call backend and redirect to `/demos`.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add email gate signup form with auth context"
```

---

## Phase 2: Core Demos

### Task 7: Vision Inspector — Backend (YOLO Inference)

**Files:**
- Create: `backend/app/vision/router.py`
- Create: `backend/app/vision/service.py`
- Create: `backend/app/vision/schemas.py`
- Modify: `backend/app/main.py` (load YOLO at startup, add router)

**Step 1: Create vision schemas**

```python
# backend/app/vision/schemas.py
from pydantic import BaseModel

class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: list[float]
    area_percentage: float

class VisionResponse(BaseModel):
    detections: list[Detection]
    processing_time_ms: int
    image_dimensions: dict[str, int]
    suggestions: list[str]
    demos_remaining: int
```

**Step 2: Create vision service**

```python
# backend/app/vision/service.py
import io
import time
from PIL import Image
from ultralytics import YOLO

BUSINESS_SUGGESTIONS = {
    "person": ["People counting for retail foot traffic analysis", "Workforce monitoring for safety compliance"],
    "car": ["Vehicle counting for parking management", "Fleet tracking for logistics"],
    "bottle": ["Inventory counting for retail or F&B", "Quality inspection on production lines"],
    "default": ["Object detection can automate visual inspection in your industry", "NexApex can train a custom model specific to your products"],
}

def get_suggestions(classes: list[str]) -> list[str]:
    suggestions = set()
    for cls in classes[:3]:
        for s in BUSINESS_SUGGESTIONS.get(cls, BUSINESS_SUGGESTIONS["default"]):
            suggestions.add(s)
    return list(suggestions)[:3]

def run_inference(model: YOLO, image_bytes: bytes, confidence: float = 0.5) -> dict:
    start = time.perf_counter()
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    results = model(img, conf=confidence, verbose=False)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    detections = []
    class_names = []
    for r in results:
        for box in r.boxes:
            cls_name = r.names[int(box.cls)]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            area_pct = ((x2 - x1) * (y2 - y1)) / (w * h) * 100
            detections.append({
                "class_name": cls_name,
                "confidence": round(float(box.conf), 3),
                "bbox": [round(v, 1) for v in [x1, y1, x2, y2]],
                "area_percentage": round(area_pct, 1),
            })
            class_names.append(cls_name)

    return {
        "detections": detections,
        "processing_time_ms": elapsed_ms,
        "image_dimensions": {"width": w, "height": h},
        "suggestions": get_suggestions(class_names),
    }
```

**Step 3: Create vision router**

```python
# backend/app/vision/router.py
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.db.database import get_db
from app.db.models import Lead
from app.dependencies import get_current_lead
from app.vision.service import run_inference
from app.vision.schemas import VisionResponse

router = APIRouter(prefix="/vision", tags=["vision"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

@router.post("/detect", response_model=VisionResponse)
async def detect(
    request: Request,
    image: UploadFile = File(...),
    confidence_threshold: float = Query(0.5, ge=0.1, le=1.0),
    lead: Lead = Depends(get_current_lead),
    db: AsyncSession = Depends(get_db),
):
    # Check demo limit
    if lead.vision_demos_used >= 10:
        raise HTTPException(status_code=429, detail="Demo limit reached. Book a consultation to continue.")

    # Validate file
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Use JPEG, PNG, or WebP.")

    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")

    # Run inference
    model = request.app.state.yolo_model
    result = run_inference(model, contents, confidence_threshold)

    # Increment usage counter
    await db.execute(
        update(Lead).where(Lead.id == lead.id).values(vision_demos_used=Lead.vision_demos_used + 1)
    )
    await db.commit()

    return VisionResponse(
        **result,
        demos_remaining=10 - lead.vision_demos_used - 1,
    )
```

**Step 4: Update main.py to load YOLO at startup**

```python
# Add to lifespan in backend/app/main.py
from ultralytics import YOLO

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.yolo_model = YOLO(settings.yolo_model_path)
        app.state.models_loaded = True
    except Exception:
        app.state.yolo_model = None
        app.state.models_loaded = False
    yield
    if hasattr(app.state, "yolo_model") and app.state.yolo_model:
        del app.state.yolo_model

# Register router
from app.vision.router import router as vision_router
app.include_router(vision_router, prefix=settings.api_prefix)
```

**Step 5: Download YOLO model for dev**

```bash
cd backend
mkdir -p models
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
mv yolov8n.pt models/
```

**Step 6: Test the endpoint**

```bash
curl -X POST http://localhost:8000/api/v1/vision/detect \
  -H "Authorization: Bearer <token>" \
  -F "image=@test_image.jpg"
```

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat: add YOLO vision inference endpoint with demo limit tracking"
```

---

### Task 8: Vision Inspector — Frontend

**Files:**
- Create: `src/components/demos/VisionInspector.tsx`
- Create: `src/components/demos/BoundingBoxOverlay.tsx`
- Modify: `src/app/(studio)/demos/vision/page.tsx`

This task creates the interactive Vision Inspector with image upload, camera feed, bounding box overlay, and business suggestions. Uses `dynamic()` with `ssr: false` since it requires browser File/Canvas APIs.

**Step 1:** Create `BoundingBoxOverlay.tsx` — a canvas overlay that draws detection boxes on the uploaded image.

**Step 2:** Create `VisionInspector.tsx` — client component with drag-and-drop upload (using a simple `<input type="file">` + drag events, no external library), results display with detection list and suggestions, download button.

**Step 3:** Update `src/app/(studio)/demos/vision/page.tsx` to dynamically import VisionInspector with `ssr: false`.

**Step 4:** Test: upload an image, see bounding boxes and suggestions.

**Step 5:** Commit.

```bash
git commit -m "feat: add Vision Inspector demo UI with bounding box overlay"
```

---

### Task 9: Smart Assistant — Backend (LLM SSE Streaming)

**Files:**
- Create: `backend/app/chat/router.py`
- Create: `backend/app/chat/service.py`
- Create: `backend/app/chat/schemas.py`
- Modify: `backend/app/main.py` (load LLM at startup, add router)

Implement SSE streaming chat endpoint using `llama-cpp-python`. The LLM is loaded once at startup. Responses are streamed token-by-token via Server-Sent Events.

**Key implementation details:**
- Use `StreamingResponse` with `text/event-stream` content type
- Maintain conversation context with a dict keyed by conversation_id (in-memory for MVP)
- System prompt: NexApex AI business consultant for SEA markets
- Max 20 messages per session, tracked in Lead model

**Step 1:** Create schemas, service, router following the same pattern as vision.

**Step 2:** Load LLM model in lifespan (only if the model file exists — graceful skip for dev without the model).

**Step 3:** Test with curl: `curl -N http://localhost:8000/api/v1/chat/stream -d '{"message":"Hello"}'`

**Step 4:** Commit.

```bash
git commit -m "feat: add LLM chat endpoint with SSE streaming"
```

---

### Task 10: Smart Assistant — Frontend

**Files:**
- Create: `src/components/demos/ChatInterface.tsx`
- Create: `src/components/demos/ChatMessage.tsx`
- Modify: `src/app/(studio)/demos/chat/page.tsx`

Build the chat UI with message bubbles, typing indicator, language selector (EN/MY/TH), suggested prompts, and SSE stream consumption using `fetch` + `ReadableStream`.

**Step 1:** Create ChatMessage component (user right / assistant left with cyan border).

**Step 2:** Create ChatInterface client component — connects directly to FastAPI SSE endpoint (not through Next.js proxy to avoid buffering).

**Step 3:** Update chat page with `dynamic()` import.

**Step 4:** Test end-to-end: type message, see streamed response.

**Step 5:** Commit.

```bash
git commit -m "feat: add Smart Assistant chat UI with SSE streaming"
```

---

### Task 11: Document Intelligence — Backend

**Files:**
- Create: `backend/app/docs/router.py`
- Create: `backend/app/docs/ocr_service.py`
- Create: `backend/app/docs/extraction.py`
- Create: `backend/app/docs/schemas.py`
- Modify: `backend/app/main.py` (add router)

Implement OCR with pytesseract, then send extracted text to Gemini API for structured key-value extraction. Supports PDF (up to 5 pages) and images.

**Key details:**
- Use `pytesseract.image_to_string()` for OCR
- For PDFs: convert each page to image using `pdf2image` or Pillow
- Send OCR text to Gemini with a structured extraction prompt
- Return: raw text, key-value pairs, tables, summary
- Files saved to `/tmp/{uuid}`, deleted after processing

**Step 1-4:** Create schemas, services, router, test.

**Step 5:** Commit.

```bash
git commit -m "feat: add document extraction endpoint with OCR and Gemini"
```

---

### Task 12: Document Intelligence — Frontend

**Files:**
- Create: `src/components/demos/DocExtractor.tsx`
- Modify: `src/app/(studio)/demos/docs/page.tsx`

Build the upload UI with two-panel view (original doc left, extracted data right), tabs for key-value pairs / tables / summary, download as JSON/CSV buttons.

**Step 1-4:** Create component, wire up to API, test.

**Step 5:** Commit.

```bash
git commit -m "feat: add Document Intelligence demo UI"
```

---

## Phase 3: Conversion

### Task 13: Booking Integration (Cal.com)

**Files:**
- Create: `src/components/studio/BookingWidget.tsx`
- Create: `backend/app/booking/router.py`
- Create: `backend/app/booking/schemas.py`

Embed Cal.com scheduling widget. Pre-fill name/email from lead record. Webhook handler in FastAPI creates Booking record.

**Step 1-4:** Create components, webhook endpoint, test.

**Step 5:** Commit.

```bash
git commit -m "feat: add Cal.com booking integration with webhook handler"
```

---

### Task 14: Demo Limits + CTAs

**Files:**
- Modify: `src/components/demos/VisionInspector.tsx`
- Modify: `src/components/demos/ChatInterface.tsx`
- Modify: `src/components/demos/DocExtractor.tsx`
- Create: `src/components/studio/DemoLimitOverlay.tsx`

Add usage counter display and gating overlay when limits are reached. Overlay includes "Book a Consultation" CTA.

**Step 1-3:** Create overlay component, add to each demo.

**Step 4:** Commit.

```bash
git commit -m "feat: add demo limit enforcement with booking CTA overlay"
```

---

### Task 15: Transactional Emails (Resend)

**Files:**
- Create: `backend/app/auth/service.py` (extend with email sending)
- Create: `backend/app/email/templates.py`

Implement welcome email on signup, magic link email for returning users, booking confirmation.

**Step 1-3:** Create email service, templates, wire to auth flow.

**Step 4:** Commit.

```bash
git commit -m "feat: add transactional emails via Resend (welcome, magic link, booking)"
```

---

## Phase 4: Admin + Analytics

### Task 16: Admin Dashboard

**Files:**
- Create: `src/app/(studio)/admin/layout.tsx`
- Create: `src/app/(studio)/admin/page.tsx`
- Create: `src/components/admin/LeadsTable.tsx`
- Create: `src/components/admin/AnalyticsCards.tsx`
- Create: `backend/app/admin/router.py`
- Create: `backend/app/admin/schemas.py`

Build admin dashboard with leads table (filterable by date, industry, demo type), analytics cards (signups, demo usage, conversion rates), CSV export.

Protected by admin auth (separate from demo signup).

**Step 1-5:** Create backend endpoints, frontend components, auth guard, test.

**Step 6:** Commit.

```bash
git commit -m "feat: add admin dashboard with leads table and analytics"
```

---

### Task 17: PostHog Analytics Integration

**Files:**
- Create: `src/lib/analytics.ts`
- Modify: `src/app/(studio)/layout.tsx` (add PostHog script)
- Create: `backend/app/analytics.py` (server-side events)

Track: page views, demo starts, demo completions, booking clicks, signup events.

**Step 1-3:** Create analytics utilities, add tracking calls.

**Step 4:** Commit.

```bash
git commit -m "feat: add PostHog analytics for funnel tracking"
```

---

## Phase 5: Polish + Performance

### Task 18: Bundle Optimization

**Files:**
- Modify: `next.config.ts` (add bundle analyzer)
- Modify: various components (optimize imports)

```bash
npm install @next/bundle-analyzer
```

Run `ANALYZE=true npm run build` and verify:
- `(studio)` pages have NO Three.js/R3F/GSAP chunks
- Demo page JS total < 200KB gzipped
- Marketing Lighthouse > 90
- Demo Lighthouse > 95

**Step 1:** Add analyzer, run build, identify issues.

**Step 2:** Fix any cross-boundary imports.

**Step 3:** Commit.

```bash
git commit -m "perf: optimize bundles — verify route group isolation"
```

---

### Task 19: E2E Tests (Playwright)

**Files:**
- Create: `e2e/studio-flow.spec.ts`
- Create: `playwright.config.ts`

Test the full journey: land → signup → try vision demo → try chat → book consultation.

```bash
npm init playwright@latest
```

**Step 1-3:** Write tests, run, fix issues.

**Step 4:** Commit.

```bash
git commit -m "test: add Playwright E2E tests for studio demo flow"
```

---

### Task 20: Error Handling + Graceful Degradation

**Files:**
- Create: `src/app/(studio)/error.tsx`
- Create: `src/app/(studio)/demos/vision/error.tsx`
- Create: `src/app/(studio)/demos/chat/error.tsx`
- Create: `src/app/(studio)/demos/docs/error.tsx`
- Modify: each demo component (add offline fallback)

Add Next.js error boundaries per route. If inference backend is down, show cached sample results with "Live demo temporarily unavailable" message + booking CTA.

**Step 1-3:** Create error boundaries, add fallbacks.

**Step 4:** Commit.

```bash
git commit -m "feat: add error boundaries and graceful degradation for demos"
```

---

## Summary

| Phase | Tasks | Commits |
|-------|-------|---------|
| 1: Foundation | Tasks 1-6 | 6 |
| 2: Core Demos | Tasks 7-12 | 6 |
| 3: Conversion | Tasks 13-15 | 3 |
| 4: Admin | Tasks 16-17 | 2 |
| 5: Polish | Tasks 18-20 | 3 |
| **Total** | **20 tasks** | **20 commits** |
