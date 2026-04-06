# NexApex AI Studio — Backend API

FastAPI backend serving auth, AI inference (YOLO, LLM, OCR), and admin endpoints.

## Prerequisites

- Python 3.11+
- Docker (for PostgreSQL)

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

### 2. Install Python dependencies

```bash
cd backend
pip install -e .
```

For AI model inference (optional, needed for Phase 2 demos):

```bash
pip install -e ".[ai]"
```

### 3. Set up environment

```bash
cp .env.example .env
```

Edit `.env` as needed. Default values work for local development.

### 4. Run database migrations

```bash
cd backend
alembic upgrade head
```

This creates the tables: `leads`, `demo_sessions`, `bookings`, `admin_users`.

### 5. Start the API server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API is now available at `http://localhost:8000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + memory stats |
| POST | `/api/v1/auth/signup` | Create lead + return JWT |
| GET | `/docs` | Swagger UI (auto-generated) |
| GET | `/redoc` | ReDoc API docs |

## Testing the Auth Flow

```bash
# Signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Response: { id, email, name, token, demos_remaining }

# Duplicate email returns 409
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Response: { "detail": "Email already registered" }
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `leads` | Email-gated users (email, name, company, industry, demo usage counters) |
| `demo_sessions` | Log of each demo run (type, input metadata, result, processing time) |
| `bookings` | Cal.com consultation bookings |
| `admin_users` | Admin dashboard access (email + password + TOTP) |

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
│   ├── main.py              # FastAPI app + lifespan
│   ├── config.py             # Pydantic Settings (env vars)
│   ├── dependencies.py       # get_current_lead (JWT auth)
│   ├── auth/
│   │   ├── router.py         # POST /auth/signup
│   │   ├── jwt.py            # JWT create/verify/hash
│   │   ├── schemas.py        # SignupRequest, SignupResponse
│   │   └── service.py        # Magic link emails (Phase 3)
│   └── db/
│       ├── database.py       # Async engine + session
│       └── models.py         # SQLAlchemy ORM models
├── alembic/
│   ├── env.py                # Async migration runner
│   └── versions/             # Migration scripts
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
