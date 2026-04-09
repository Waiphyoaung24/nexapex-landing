# NexApex AI Studio — Backend API

FastAPI backend serving auth, AI inference (YOLO, LLM, OCR), and admin endpoints.

## Prerequisites

- Python 3.11+
- Docker (for PostgreSQL) — or a remote Postgres instance

## Quick Start

### 1. Start the database

```bash
cd backend
docker compose up -d db
```

This starts PostgreSQL 16 on `localhost:5432` with:
- Database: `nexapex_studio`
- User: `postgres`
- Password: `postgres`

### 2. Create a virtual environment

```bash
cd backend

# Create venv
python -m venv venv

# Activate — pick your shell:
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
.\venv\Scripts\activate.bat

# Windows (Git Bash / MSYS2)
source venv/Scripts/activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Python dependencies

```bash
# Core (auth, admin, health check)
pip install -e .

# AI model inference (Vision Inspector — YOLO, OCR, etc.)
pip install -e ".[ai]"

# Dev tools (pytest, httpx)
pip install -e ".[dev]"

# Everything
pip install -e ".[ai,email,dev]"
```

### 4. Set up environment

```bash
cp .env.example .env
```

Edit `.env` as needed. Default values work for local development.

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/nexapex_studio` | Postgres connection |
| `JWT_SECRET` | `change-me-in-production` | JWT signing key |
| `ALLOWED_ORIGINS` | `["http://localhost:3000"]` | CORS origins (Next.js frontend) |
| `GEMINI_API_KEY` | _(empty)_ | Google Gemini for Smart Assistant |
| `RESEND_API_KEY` | _(empty)_ | Transactional emails |

### 5. Run database migrations

```bash
cd backend
alembic upgrade head
```

This creates the tables: `leads`, `demo_sessions`, `bookings`, `admin_users`.

### 6. Start the API server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API is now available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + YOLO model status + memory stats |

### Auth (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Create lead + return JWT |

### Vision Inspector (`/api/v1/vision`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/vision/detect` | Optional Bearer | Upload image for YOLO object detection |

Query params: `confidence_threshold` (0.1–1.0, default 0.25)

Accepts: `multipart/form-data` with `image` field (JPEG, PNG, WebP, max 10 MB)

### Admin (`/api/v1/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/login` | None | Admin login, returns JWT |
| GET | `/admin/leads` | Admin JWT | List leads (filter: `?status=all|pending|approved`) |
| PATCH | `/admin/leads/{id}/approve` | Admin JWT | Approve a lead |

## Testing the API

### Auth flow

```bash
# Signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Response: { id, email, name, token, demos_remaining }
```

### Vision Inspector

```bash
# Detect objects in an image (no auth required for dev)
curl -X POST http://localhost:8000/api/v1/vision/detect \
  -F "image=@path/to/photo.jpg" \
  -F "confidence_threshold=0.3"

# Response: { detections: [...], summary, business_suggestions, processing_time_ms, demos_remaining }
```

### Admin

```bash
# Login (default seed admin: admin@nexapex.dev / admin123)
curl -X POST http://localhost:8000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexapex.dev","password":"admin123"}'

# List pending leads
curl http://localhost:8000/api/v1/admin/leads?status=pending \
  -H "Authorization: Bearer <admin_token>"
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `leads` | Email-gated users (email, name, company, industry, demo usage counters) |
| `demo_sessions` | Log of each demo run (type, input metadata, result, processing time) |
| `bookings` | Cal.com consultation bookings |
| `admin_users` | Admin dashboard access (email + password + role) |

## Docker Commands

```bash
# Start database only
docker compose up -d db

# Start everything (API + DB)
docker compose up -d

# View logs
docker compose logs -f api

# Stop everything
docker compose down

# Reset database (destroys data)
docker compose down -v
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + lifespan (loads YOLO on startup)
│   ├── config.py             # Pydantic Settings (env vars)
│   ├── dependencies.py       # get_current_lead / get_current_admin (JWT)
│   ├── auth/
│   │   ├── router.py         # POST /auth/signup
│   │   ├── jwt.py            # JWT create/verify
│   │   ├── schemas.py        # SignupRequest, SignupResponse
│   │   └── service.py        # Email service (Phase 3)
│   ├── vision/
│   │   ├── router.py         # POST /vision/detect
│   │   ├── schemas.py        # VisionResponse, Detection
│   │   └── service.py        # YOLO inference + business suggestions
│   ├── admin/
│   │   ├── router.py         # Admin login, lead management
│   │   └── schemas.py        # AdminLoginRequest, LeadsListResponse
│   └── db/
│       ├── database.py       # Async engine + session
│       └── models.py         # SQLAlchemy ORM models
├── models/                   # AI model weights (gitignored)
│   └── yolo26n.pt            # Downloaded at first run by ultralytics
├── alembic/
│   ├── env.py                # Async migration runner
│   └── versions/             # Migration scripts
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
