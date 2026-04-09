# Demo Gate & Admin Approval — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lock `/demos` behind admin approval — users sign up, see a pending screen, founders approve via `/admin/leads`.

**Architecture:** Add `is_approved` column to `Lead` model. New `GET /auth/me` endpoint returns approval status. `AuthGuard` client component wraps demos layout — redirects to `/auth` if no token, shows pending screen if not approved. Separate `(admin)` route group with login + leads table. Admin auth via `AdminUser` table with bcrypt.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, bcrypt, Next.js 16 App Router, React 19, Tailwind 4

---

### Task 1: Add `is_approved` to Lead model

**Files:**
- Modify: `backend/app/db/models.py:49-70` (Lead class)

**Step 1: Add the column to the ORM model**

In `backend/app/db/models.py`, add after `token_hash` (line 59):

```python
is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
```

**Step 2: Verify import**

`Boolean` is already imported on line 6. No new imports needed.

**Step 3: Commit**

```bash
git add backend/app/db/models.py
git commit -m "feat(db): add is_approved column to Lead model"
```

---

### Task 2: Alembic migration + seed super admin

**Files:**
- Create: `backend/alembic/versions/002_add_approval_and_seed_admin.py`

**Step 1: Create migration file**

```python
"""Add is_approved to leads and seed super admin.

Revision ID: 002
Revises: 001
"""

import uuid
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"


def upgrade():
    # Add is_approved column
    op.add_column("leads", sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")))

    # Seed super admin
    from passlib.hash import bcrypt
    password_hash = bcrypt.hash("123123")

    op.execute(
        sa.text(
            "INSERT INTO admin_users (id, email, password_hash, role, created_at) "
            "VALUES (:id, :email, :password_hash, :role, :created_at)"
        ).bindparams(
            id=str(uuid.uuid4()),
            email="nexuslab.dev.mm@gmail.com",
            password_hash=password_hash,
            role="admin",
            created_at=datetime.now(timezone.utc),
        )
    )


def downgrade():
    op.execute(sa.text("DELETE FROM admin_users WHERE email = 'nexuslab.dev.mm@gmail.com'"))
    op.drop_column("leads", "is_approved")
```

**Step 2: Install passlib + bcrypt**

```bash
cd backend && pip install passlib[bcrypt]
```

Add to `backend/requirements.txt`:

```
passlib[bcrypt]
```

**Step 3: Run migration**

```bash
cd backend && alembic upgrade head
```

Expected: Migration applies, `is_approved` column added, admin user seeded.

**Step 4: Commit**

```bash
git add backend/alembic/versions/002_add_approval_and_seed_admin.py backend/requirements.txt
git commit -m "feat(db): migration for is_approved column + seed super admin"
```

---

### Task 3: `GET /auth/me` endpoint

**Files:**
- Modify: `backend/app/auth/schemas.py` (add MeResponse)
- Modify: `backend/app/auth/router.py` (add /me endpoint)

**Step 1: Add MeResponse schema**

In `backend/app/auth/schemas.py`, add:

```python
class MeResponse(BaseModel):
    id: str
    email: str
    name: str
    company: str | None
    industry: str | None
    is_approved: bool
```

**Step 2: Add /me endpoint**

In `backend/app/auth/router.py`, add imports and endpoint:

```python
from app.auth.schemas import SignupRequest, SignupResponse, MeResponse
from app.dependencies import get_current_lead
```

```python
@router.get("/me", response_model=MeResponse)
async def get_me(lead: Lead = Depends(get_current_lead)):
    return MeResponse(
        id=str(lead.id),
        email=lead.email,
        name=lead.name,
        company=lead.company,
        industry=lead.industry.value if lead.industry else None,
        is_approved=lead.is_approved,
    )
```

**Step 3: Test manually**

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/auth/me
```

Expected: JSON with `is_approved: false`

**Step 4: Commit**

```bash
git add backend/app/auth/schemas.py backend/app/auth/router.py
git commit -m "feat(auth): add GET /auth/me endpoint with approval status"
```

---

### Task 4: Admin login endpoint

**Files:**
- Create: `backend/app/admin/__init__.py`
- Create: `backend/app/admin/schemas.py`
- Create: `backend/app/admin/router.py`
- Modify: `backend/app/auth/jwt.py` (add admin token creator)
- Modify: `backend/app/dependencies.py` (add get_current_admin)
- Modify: `backend/app/main.py` (register admin router)

**Step 1: Create `backend/app/admin/__init__.py`**

Empty file.

**Step 2: Create admin schemas**

`backend/app/admin/schemas.py`:

```python
from pydantic import BaseModel, EmailStr


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    email: str
    role: str


class LeadRow(BaseModel):
    id: str
    email: str
    name: str
    company: str | None
    industry: str | None
    is_approved: bool
    created_at: str


class LeadsListResponse(BaseModel):
    leads: list[LeadRow]
    total: int
```

**Step 3: Add admin token helpers to jwt.py**

In `backend/app/auth/jwt.py`, add:

```python
def create_admin_token(admin_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": admin_id, "email": email, "role": role, "type": "admin", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
```

**Step 4: Add `get_current_admin` dependency**

In `backend/app/dependencies.py`, add:

```python
from app.db.models import Lead, AdminUser

# ... existing get_current_lead ...

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    payload = verify_access_token(credentials.credentials)
    if not payload or payload.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin access required",
        )

    result = await db.execute(select(AdminUser).where(AdminUser.id == payload["sub"]))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found"
        )
    return admin
```

**Step 5: Create admin router**

`backend/app/admin/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from passlib.hash import bcrypt
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    LeadRow,
    LeadsListResponse,
)
from app.auth.jwt import create_admin_token
from app.db.database import get_db
from app.db.models import AdminUser, Lead
from app.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(req: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.email == req.email))
    admin = result.scalar_one_or_none()

    if not admin or not bcrypt.verify(req.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_admin_token(str(admin.id), admin.email, admin.role.value)
    return AdminLoginResponse(token=token, email=admin.email, role=admin.role.value)


@router.get("/leads", response_model=LeadsListResponse)
async def list_leads(
    filter_status: str = Query("all", alias="status"),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Lead).order_by(Lead.created_at.desc())

    if filter_status == "pending":
        query = query.where(Lead.is_approved == False)
    elif filter_status == "approved":
        query = query.where(Lead.is_approved == True)

    result = await db.execute(query)
    leads = result.scalars().all()

    count_result = await db.execute(select(func.count(Lead.id)))
    total = count_result.scalar() or 0

    return LeadsListResponse(
        leads=[
            LeadRow(
                id=str(l.id),
                email=l.email,
                name=l.name,
                company=l.company,
                industry=l.industry.value if l.industry else None,
                is_approved=l.is_approved,
                created_at=l.created_at.isoformat(),
            )
            for l in leads
        ],
        total=total,
    )


@router.patch("/leads/{lead_id}/approve", status_code=status.HTTP_200_OK)
async def approve_lead(
    lead_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_approved = True
    await db.commit()
    return {"status": "approved", "lead_id": lead_id}
```

**Step 6: Register admin router in main.py**

In `backend/app/main.py`, add:

```python
from app.admin.router import router as admin_router
```

```python
app.include_router(admin_router, prefix=settings.api_prefix)
```

**Step 7: Commit**

```bash
git add backend/app/admin/ backend/app/auth/jwt.py backend/app/dependencies.py backend/app/main.py
git commit -m "feat(admin): admin login, leads list, and approve endpoints"
```

---

### Task 5: Frontend `apiGet` helper

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add apiGet function**

The existing `api.ts` only has `apiPost`. Add `apiGet` with auth header support:

```typescript
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
```

Also add `apiPatch`:

```typescript
export async function apiPatch<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
```

**Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(api): add apiGet and apiPatch helpers with auth support"
```

---

### Task 6: AuthGuard + PendingScreen components

**Files:**
- Create: `src/components/studio/AuthGuard.tsx`
- Create: `src/components/studio/PendingScreen.tsx`
- Modify: `src/app/(studio)/demos/layout.tsx`

**Step 1: Create PendingScreen**

`src/components/studio/PendingScreen.tsx`:

```tsx
"use client";

import { Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function PendingScreen() {
  const { name, logout } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#94fcff]/10">
          <Clock size={28} className="text-[#94fcff]" />
        </div>

        <h2 className="text-2xl font-[family-name:var(--font-display)] text-white mb-3">
          Thanks{name ? `, ${name}` : ""}!
        </h2>

        <p className="text-sm leading-relaxed text-nex-text/60 mb-6">
          Your access request is under review. Our team will approve your
          account shortly. Refresh this page to check your status.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-lg bg-[#94fcff] px-5 py-2.5 text-xs font-medium text-[#0e1418] transition-colors hover:bg-[#b0fdff]"
          >
            Refresh status
          </button>
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer text-xs text-nex-dim hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create AuthGuard**

`src/components/studio/AuthGuard.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import { PendingScreen } from "./PendingScreen";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  is_approved: boolean;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "approved" | "pending">("loading");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }

    apiGet<MeResponse>("/auth/me", token!)
      .then((me) => {
        setStatus(me.is_approved ? "approved" : "pending");
      })
      .catch(() => {
        router.replace("/auth");
      });
  }, [isAuthenticated, token, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff]" />
      </div>
    );
  }

  if (status === "pending") {
    return <PendingScreen />;
  }

  return <>{children}</>;
}
```

**Step 3: Wrap demos layout**

Modify `src/app/(studio)/demos/layout.tsx`:

```tsx
import { StudioHeader } from "@/components/studio/StudioHeader";
import { AuthGuard } from "@/components/studio/AuthGuard";

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader />
      <main className="flex-1">
        <AuthGuard>{children}</AuthGuard>
      </main>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/studio/AuthGuard.tsx src/components/studio/PendingScreen.tsx src/app/\(studio\)/demos/layout.tsx
git commit -m "feat(auth): AuthGuard with pending screen for demo access control"
```

---

### Task 7: Update EmailGateForm redirect

**Files:**
- Modify: `src/components/studio/EmailGateForm.tsx`

**Step 1: Change redirect after signup**

The form currently redirects to `/demos` after signup. Since the user won't be approved yet, they'll hit the AuthGuard and see the pending screen automatically. No change needed — the existing `router.push("/demos")` will work because AuthGuard handles the gating.

**This task is a no-op.** The existing flow is correct:
1. Signup → JWT issued → redirect to `/demos`
2. AuthGuard checks `/auth/me` → `is_approved: false` → shows PendingScreen

**No commit needed.**

---

### Task 8: Admin login page

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/admin/login/page.tsx`
- Create: `src/lib/admin-auth.ts` (simple localStorage helper)

**Step 1: Create admin auth helper**

`src/lib/admin-auth.ts`:

```typescript
const ADMIN_KEY = "nexapex_admin";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_KEY);
}
```

**Step 2: Create admin layout**

`src/app/(admin)/layout.tsx`:

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nex-background text-white">
      {children}
    </div>
  );
}
```

**Step 3: Create admin login page**

`src/app/(admin)/admin/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { setAdminToken } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiPost<{ token: string }>("/admin/login", {
        email,
        password,
      });
      setAdminToken(res.token);
      router.push("/admin/leads");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-lg bg-nex-surface border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none transition-colors w-full";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim mb-2">
          NexApex Admin
        </p>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-white mb-8">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-lg bg-[#94fcff] px-5 py-3 text-sm font-medium text-[#0e1418] hover:bg-[#b0fdff] disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/\(admin\)/ src/lib/admin-auth.ts
git commit -m "feat(admin): admin login page and auth helper"
```

---

### Task 9: Admin leads page

**Files:**
- Create: `src/app/(admin)/admin/leads/page.tsx`

**Step 1: Create the leads approval page**

`src/app/(admin)/admin/leads/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { getAdminToken, clearAdminToken } from "@/lib/admin-auth";

interface Lead {
  id: string;
  email: string;
  name: string;
  company: string | null;
  industry: string | null;
  is_approved: boolean;
  created_at: string;
}

type Filter = "all" | "pending" | "approved";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const token = getAdminToken();

  const fetchLeads = useCallback(async () => {
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet<{ leads: Lead[]; total: number }>(
        `/admin/leads?status=${filter}`,
        token
      );
      setLeads(res.leads);
      setTotal(res.total);
    } catch {
      clearAdminToken();
      router.replace("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [token, filter, router]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function handleApprove(leadId: string) {
    if (!token) return;
    await apiPatch(`/admin/leads/${leadId}/approve`, undefined, token);
    fetchLeads();
  }

  const filters: { label: string; value: Filter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
            Admin
          </p>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-white">
            Leads
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-nex-dim">{total} total</span>
          <button
            type="button"
            onClick={() => { clearAdminToken(); router.replace("/admin/login"); }}
            className="cursor-pointer text-xs text-nex-dim hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-1 rounded-lg bg-nex-surface p-1">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-white/10 text-white"
                : "text-nex-dim hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff]" />
        </div>
      ) : leads.length === 0 ? (
        <p className="py-12 text-center text-sm text-nex-dim">No leads found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 hidden sm:table-cell">Company</th>
                <th className="px-4 py-3 hidden md:table-cell">Industry</th>
                <th className="px-4 py-3 hidden md:table-cell">Signed Up</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-white/90">{lead.name}</td>
                  <td className="px-4 py-3 text-nex-text/70">{lead.email}</td>
                  <td className="px-4 py-3 text-nex-dim hidden sm:table-cell">
                    {lead.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-nex-dim hidden md:table-cell capitalize">
                    {lead.industry || "—"}
                  </td>
                  <td className="px-4 py-3 text-nex-dim hidden md:table-cell">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {lead.is_approved ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!lead.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(lead.id)}
                        className="cursor-pointer flex items-center gap-1 rounded-md bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Check size={12} />
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/leads/page.tsx
git commit -m "feat(admin): leads approval table with filter tabs"
```

---

### Task 10: Integration smoke test

**Step 1: Start backend**

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

**Step 2: Start frontend**

```bash
cd nexapex && npm run dev
```

**Step 3: Test user flow**

1. Visit `http://localhost:3000/demos` → should redirect to `/auth`
2. Sign up with test email → redirected to `/demos` → sees PendingScreen
3. Refresh → still pending

**Step 4: Test admin flow**

1. Visit `http://localhost:3000/admin/login`
2. Login with `nexuslab.dev.mm@gmail.com` / `123123`
3. See leads table with the test signup as "Pending"
4. Click "Approve"
5. Go back to `/demos` as the user (or refresh) → demos now visible

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: demo gate with admin approval — complete integration"
```
