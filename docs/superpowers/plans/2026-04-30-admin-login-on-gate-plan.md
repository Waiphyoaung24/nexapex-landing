# Admin Login on the Gate Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin sign-in mode on the AI Studio gate page (`/auth`) so the seeded admin (`nexuslab.dev.mm@gmail.com` / `123123`) can pass the gate and run every demo.

**Architecture:** A two-mode segmented toggle in `EmailGateForm` (Lead default, Admin tab). Admin submit calls existing `POST /admin/login`, stores JWT in `localStorage["nexapex_admin"]`, redirects to `/demos`. Backend `get_current_lead`, `get_optional_lead`, and `/auth/me` accept admin-typed tokens and treat the admin as auto-approved. `AuthGuard` recognizes admin tokens and lets them through.

**Tech Stack:** Next.js 16 App Router (client components), FastAPI, SQLAlchemy async, python-jose JWT, bcrypt.

**Spec:** `docs/superpowers/specs/2026-04-30-admin-login-on-gate-design.md`

**Branch:** `nexapex-v3-demo` (current — no new branch).

**Testing model:** This repo has no test infra (no `tests/` folder, no React test framework configured). Per `CLAUDE.md` we use the *feature-test-loop* pattern: build → manual smoke → verify → commit. Each task ends with a verification step (curl, browser, type check) and a commit.

---

## File Map

**Backend (Python / FastAPI):**

| File | Change |
|---|---|
| `backend/app/dependencies.py` | `get_current_lead` returns `Lead \| AdminUser` based on token `type` claim |
| `backend/app/vision/router.py` | `get_optional_lead` (defined inline) accepts admin tokens too |
| `backend/app/chat/router.py` | Same `get_optional_lead` admin handling |
| `backend/app/auth/router.py` | `/auth/me` returns admin-shaped `MeResponse` for admin tokens |
| `backend/app/auth/schemas.py` | `MeResponse` already permits this — no change |

**Frontend (Next.js / TS):**

| File | Change |
|---|---|
| `src/components/studio/EmailGateForm.tsx` | Add `mode` state, segmented toggle, admin form fields, admin submit branch |
| `src/components/studio/AuthGuard.tsx` | Read admin token first; on present, treat as approved (still validate via `/auth/me`) |
| `src/components/studio/StudioHeader.tsx` | Show "Admin" link to `/admin/leads` and a logout that clears both tokens, when admin token present |
| `src/lib/admin-auth.ts` | No change |
| `src/lib/auth-context.tsx` | `logout()` also clears admin token (so the header logout fully signs admin out) |

---

## Task 1: Backend — `get_current_lead` accepts admin tokens

**Goal:** `get_current_lead` returns the `AdminUser` row when token has `type=admin`. Existing lead path unchanged.

**Files:**
- Modify: `backend/app/dependencies.py`

- [ ] **Step 1: Read current file**

```bash
cat backend/app/dependencies.py
```

- [ ] **Step 2: Replace `get_current_lead`**

Replace the function body so it branches on `payload.get("type")`. Final state of the file:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import verify_access_token
from app.db.database import get_db
from app.db.models import AdminUser, Lead

security = HTTPBearer()


async def get_current_lead(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Lead | AdminUser:
    payload = verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if payload.get("type") == "admin":
        result = await db.execute(
            select(AdminUser).where(AdminUser.id == payload["sub"])
        )
        admin = result.scalar_one_or_none()
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin not found",
            )
        return admin

    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Lead not found"
        )
    return lead


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

    result = await db.execute(
        select(AdminUser).where(AdminUser.id == payload["sub"])
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found"
        )
    return admin
```

- [ ] **Step 3: Verify imports compile**

Run from repo root:

```bash
cd backend && python -c "from app.dependencies import get_current_lead, get_current_admin; print('ok')"
```

Expected: `ok` (no ImportError).

- [ ] **Step 4: Commit**

```bash
git add backend/app/dependencies.py
git commit -m "feat(backend): get_current_lead accepts admin tokens"
```

---

## Task 2: Backend — `/auth/me` returns admin-shaped payload

**Goal:** When the bearer token is an admin token, `/auth/me` returns `{is_approved: true, name: "Admin", ...}` so the frontend `AuthGuard` lets admin through.

**Files:**
- Modify: `backend/app/auth/router.py`

- [ ] **Step 1: Read current file**

```bash
cat backend/app/auth/router.py
```

- [ ] **Step 2: Update `/auth/me` handler**

Change the imports at the top to include `AdminUser`, and rewrite the handler. Final state:

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, hash_token
from app.auth.schemas import MeResponse, SignupRequest, SignupResponse
from app.db.database import get_db
from app.db.models import AdminUser, Lead
from app.dependencies import get_current_lead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED
)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.email == req.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    lead_id = uuid.uuid4()
    token = create_access_token(str(lead_id), req.email)

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


@router.get("/me", response_model=MeResponse)
async def get_me(user: Lead | AdminUser = Depends(get_current_lead)):
    if isinstance(user, AdminUser):
        return MeResponse(
            id=str(user.id),
            email=user.email,
            name="Admin",
            company=None,
            industry=None,
            is_approved=True,
        )
    return MeResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        company=user.company,
        industry=user.industry.value if user.industry else None,
        is_approved=user.is_approved,
    )
```

- [ ] **Step 3: Verify the module imports**

```bash
cd backend && python -c "from app.auth.router import router; print('ok')"
```

Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/auth/router.py
git commit -m "feat(backend): /auth/me returns admin payload for admin tokens"
```

---

## Task 3: Backend — `get_optional_lead` accepts admin tokens (vision + chat)

**Goal:** Demo endpoints (vision, chat) currently use a local `get_optional_lead` that looks up `Lead` by `payload["sub"]`. For admin tokens this returns `None` (admin treated as anonymous). Update both to recognize admin tokens — admin counts as authenticated and bypasses demo limits.

**Files:**
- Modify: `backend/app/vision/router.py`
- Modify: `backend/app/chat/router.py`

- [ ] **Step 1: Update `backend/app/vision/router.py` — replace `get_optional_lead`**

Final state of the helper (lines 19–37):

```python
optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_lead(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> Lead | None:
    """Resolve token to a Lead. Returns None for missing/invalid tokens.

    Admin tokens are accepted and treated as auto-approved by returning None
    here — the endpoint already skips lead-only checks (limits, counters)
    when lead is None, which is the correct behavior for admins.
    """
    if credentials is None:
        return None
    from app.auth.jwt import verify_access_token

    payload = verify_access_token(credentials.credentials)
    if not payload:
        return None

    if payload.get("type") == "admin":
        # Admin authenticated; no Lead row to return. Endpoint treats None
        # as "skip limits", which is what we want for admins.
        return None

    from sqlalchemy import select

    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    return result.scalar_one_or_none()
```

- [ ] **Step 2: Update `backend/app/chat/router.py` — same change**

Apply the identical change to the local `get_optional_lead` defined in `backend/app/chat/router.py`. Read the file first, then add the `if payload.get("type") == "admin": return None` branch immediately after the `verify_access_token` call (before the `Lead` lookup).

```bash
grep -n "get_optional_lead\|verify_access_token" backend/app/chat/router.py
```

Then edit so the admin-type branch is present in the helper (mirroring vision/router.py).

- [ ] **Step 3: Verify both modules import**

```bash
cd backend && python -c "from app.vision.router import router as v; from app.chat.router import router as c; print('ok')"
```

Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/vision/router.py backend/app/chat/router.py
git commit -m "feat(backend): demo endpoints accept admin tokens"
```

---

## Task 4: Backend smoke — admin token round-trip

**Goal:** Verify end-to-end: log in as admin, hit `/auth/me` with the token, see `is_approved: true`.

**Files:** none modified.

- [ ] **Step 1: Start the backend**

In one terminal:

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

Wait until you see `Application startup complete.`

- [ ] **Step 2: Log in as admin and capture the token**

In another terminal:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nexuslab.dev.mm@gmail.com","password":"123123"}' \
  | python -c "import json,sys; print(json.load(sys.stdin)['token'])")
echo "token len: ${#TOKEN}"
```

Expected: `token len:` followed by a number > 100.

- [ ] **Step 3: Call `/auth/me` with the admin token**

```bash
curl -s http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
```

Expected JSON:

```json
{"id":"...","email":"nexuslab.dev.mm@gmail.com","name":"Admin","company":null,"industry":null,"is_approved":true}
```

If `is_approved` is false or response is 401 → revisit Task 1 / Task 2.

- [ ] **Step 4: No commit (verification only)**

Stop uvicorn (`Ctrl-C`) once verified.

---

## Task 5: Frontend — `AuthGuard` recognizes admin token

**Goal:** When `getAdminToken()` returns a value, use it for the `/auth/me` check. Backend now returns `is_approved: true` for admin tokens, so the existing flow works with one change: which token we use.

**Files:**
- Modify: `src/components/studio/AuthGuard.tsx`

- [ ] **Step 1: Replace the file**

Final state:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import { getAdminToken, clearAdminToken } from "@/lib/admin-auth";
import { PendingScreen } from "./PendingScreen";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  is_approved: boolean;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token: leadToken, isAuthenticated, hydrated, logout } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "approved" | "pending">(
    "loading",
  );

  useEffect(() => {
    if (!hydrated) return;

    const adminToken = getAdminToken();
    const activeToken = adminToken ?? leadToken;

    if (!activeToken) {
      router.replace("/auth");
      return;
    }

    apiGet<MeResponse>("/auth/me", activeToken)
      .then((me) => {
        setStatus(me.is_approved ? "approved" : "pending");
      })
      .catch(() => {
        // Token invalid/expired — clear whichever side it came from and bounce.
        if (adminToken) clearAdminToken();
        if (leadToken) logout();
        router.replace("/auth");
      });
  }, [hydrated, isAuthenticated, leadToken, router, logout]);

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

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (If unrelated errors exist in other files, ignore them but ensure no errors point to `AuthGuard.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/AuthGuard.tsx
git commit -m "feat(studio): AuthGuard recognizes admin token"
```

---

## Task 6: Frontend — Two-mode toggle in `EmailGateForm`

**Goal:** Add a Lead/Admin segmented toggle. Admin mode shows email + password and submits to `/admin/login`.

**Files:**
- Modify: `src/components/studio/EmailGateForm.tsx`

- [ ] **Step 1: Replace the file**

Final state:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";
import { setAdminToken } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

type Mode = "lead" | "admin";

export function EmailGateForm() {
  const [mode, setMode] = useState<Mode>("lead");

  // Lead fields
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");

  // Admin fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function switchMode(next: Mode) {
    if (loading) return;
    setMode(next);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "admin") {
        const res = await apiPost<{
          token: string;
          email: string;
          role: string;
        }>("/admin/login", {
          email: adminEmail,
          password: adminPassword,
        });
        setAdminToken(res.token);
        router.push("/demos");
        return;
      }

      const res = await apiPost<{
        token: string;
        email: string;
        name: string;
      }>("/auth/signup", {
        email,
        name,
        company: company || undefined,
        industry: industry || undefined,
      });
      login(res.token, res.email, res.name);
      router.push("/demos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-lg bg-nex-surface border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      {/* Mode toggle */}
      <div
        role="tablist"
        aria-label="Sign-in mode"
        className="grid grid-cols-2 gap-1 rounded-full bg-white/[0.04] p-1 border border-white/[0.06]"
      >
        {(["lead", "admin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-[2px] transition-colors",
              mode === m
                ? "bg-[#94fcff] text-[#0e1418]"
                : "text-white/60 hover:text-white",
            )}
          >
            {m === "lead" ? "Lead" : "Admin"}
          </button>
        ))}
      </div>

      {mode === "lead" ? (
        <>
          <input
            type="email"
            required
            placeholder="Email address *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            required
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Company name (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={inputClass}
          >
            <option value="">Industry (optional)</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="fnb">Food &amp; Beverage</option>
            <option value="retail">Retail</option>
            <option value="agriculture">Agriculture</option>
            <option value="technology">Technology</option>
            <option value="other">Other</option>
          </select>
        </>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="Admin email *"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            autoComplete="username"
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password *"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[#94fcff] px-6 py-3 text-sm font-mono font-medium uppercase tracking-wider text-[#0e1418] hover:bg-[#b0fdff] disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
      >
        {loading
          ? mode === "admin"
            ? "Signing in..."
            : "Signing up..."
          : mode === "admin"
            ? "Sign in"
            : "Try Our AI"}
      </button>

      <p className="text-[10px] text-white/30 text-center">
        {mode === "admin"
          ? "Authorized personnel only."
          : "Your data is never shared. Uploads auto-delete in 1 hour."}
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors in `EmailGateForm.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/EmailGateForm.tsx
git commit -m "feat(studio): add admin login mode to gate form"
```

---

## Task 7: Frontend — `auth-context.logout()` clears admin token

**Goal:** Calling `logout()` from anywhere in the app should fully sign the user out — both lead state and admin token.

**Files:**
- Modify: `src/lib/auth-context.tsx`

- [ ] **Step 1: Read current file**

(Already read in earlier exploration — see the existing `logout` callback.)

- [ ] **Step 2: Add admin clear into `logout`**

Edit `logout` to also call `clearAdminToken`. New imports + new logout body:

```tsx
import { clearAdminToken } from "@/lib/admin-auth";

// ...inside AuthProvider, replace the existing logout:
const logout = useCallback(() => {
  setAuth({ token: null, email: null, name: null });
  localStorage.removeItem("nexapex_auth");
  clearAdminToken();
}, []);
```

Leave everything else in the file unchanged.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors in `auth-context.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth-context.tsx
git commit -m "feat(auth): logout clears admin token too"
```

---

## Task 8: Frontend — `StudioHeader` shows admin link when signed in as admin

**Goal:** When an admin token is present, surface a link to `/admin/leads` and a "Sign out" action. Otherwise, render the existing header unchanged.

**Files:**
- Modify: `src/components/studio/StudioHeader.tsx`

- [ ] **Step 1: Replace the file**

Final state:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Shield, LogOut } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { getAdminToken, clearAdminToken } from "@/lib/admin-auth";
import { useAuth } from "@/lib/auth-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export function StudioHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { logout, hydrated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setIsAdmin(getAdminToken() !== null);
  }, [hydrated]);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.set(header, { y: -20, autoAlpha: 0 });
      gsap.to(header, {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: headerRef },
  );

  function handleSignOut() {
    clearAdminToken();
    logout();
    setIsAdmin(false);
    router.push("/auth");
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 glass-header",
        "px-4 py-4 md:px-[60px]",
        "flex items-center justify-between",
      )}
    >
      <Link href="/" className="flex items-center gap-2 group">
        <img
          src="/images/Flat_white.png"
          alt="NexApex"
          width={36}
          height={36}
          className="h-7 w-7 md:h-9 md:w-9 object-contain transition-transform duration-300 group-hover:scale-105"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        />
        <span className="text-[14px] md:text-[20px] font-bold uppercase font-[family-name:var(--font-display)] tracking-[3px] text-white">
          AI Studio
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/demos"
          className="text-[11px] font-mono uppercase tracking-[2px] text-white/60 hover:text-white transition-colors duration-200"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Demos
        </Link>

        {isAdmin && (
          <>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-[#94fcff] hover:text-[#b0fdff] transition-colors"
            >
              <Shield size={12} />
              Admin
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-white/60 hover:text-white transition-colors"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </>
        )}

        {!isAdmin && (
          <a
            href="mailto:support@nexapex.ai"
            className={cn(
              "flex items-center gap-2",
              "rounded-full bg-[#94fcff] px-5 py-2.5",
              "text-[11px] font-mono font-medium uppercase tracking-[1px] text-[#0e1418]",
              "transition-all duration-300 hover:bg-[#b0fdff] hover:shadow-[0_0_20px_rgba(148,252,255,0.2)]",
              "active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]",
            )}
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            Book a Call
            <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors in `StudioHeader.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/StudioHeader.tsx
git commit -m "feat(studio): show admin link in header when admin signed in"
```

---

## Task 9: End-to-end manual smoke test

**Goal:** Verify the full flow — admin signs in from `/auth`, runs vision + chat demos, reaches `/admin/leads`, signs out cleanly. Lead flow also still works.

**Files:** none modified.

- [ ] **Step 1: Start backend**

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

Wait for `Application startup complete.`

- [ ] **Step 2: Start frontend (separate terminal)**

```bash
npm run dev
```

Wait for `Ready in ...`. Note the URL (typically `http://localhost:3000`).

- [ ] **Step 3: Admin happy path**

Open `http://localhost:3000/auth` in a fresh incognito window.

  1. Verify the segmented toggle shows **Lead | Admin** with **Lead** selected by default and the original lead form rendered.
  2. Click **Admin**. The form swaps to email + password. Button label is **Sign in**.
  3. Enter `nexuslab.dev.mm@gmail.com` and `123123`. Submit.
  4. URL navigates to `/demos`. Header shows **Admin** link and **Sign out**. The "Book a Call" CTA is hidden.
  5. Click **Vision Inspector** → upload a sample image → expect bounding boxes + a business suggestion. No 401.
  6. Open **Smart Assistant** → send a message → expect a streamed reply. No 401.
  7. Click **Admin** in the header → land on `/admin/leads`, see the leads table.
  8. Click **Sign out** → return to `/auth` (Lead mode default). `localStorage` should have neither `nexapex_admin` nor `nexapex_auth` (DevTools → Application → Local Storage).

- [ ] **Step 4: Wrong-password path**

  1. From `/auth`, switch to **Admin**. Enter a bad password (e.g. `wrong`). Submit.
  2. Expect inline red text **Invalid credentials**. No redirect. `localStorage["nexapex_admin"]` is absent.

- [ ] **Step 5: Lead regression**

  1. From `/auth`, ensure **Lead** is selected. Sign up with a new email.
  2. Expect redirect to `/demos`. Because `is_approved=false` for new leads, the **PendingScreen** renders.
  3. (Optional) Approve the lead via `/admin/leads` after re-signing in as admin in another tab — page should now show demos.

- [ ] **Step 6: Deep-link sanity**

  1. Visit `/admin/login` directly. Existing dedicated admin login page still loads and signs you in successfully.

- [ ] **Step 7: Stop servers**

`Ctrl-C` both terminals.

- [ ] **Step 8: Final commit (none if no edits made during smoke)**

If any small fix was needed, commit it now:

```bash
git status
git add <fixed files>
git commit -m "fix(studio): <describe>"
```

---

## Self-Review (skill requirement — do not skip)

Before marking the plan complete, the writer of the plan re-reads it against the spec:

**Spec coverage:**
- §3 user-facing toggle → Task 6 ✓
- §4.1 AuthGuard admin recognition → Task 5 ✓
- §4.1 demo components prefer admin token → not needed: demo components don't pass any Authorization header today (vision uses cookies via proxy; chat goes direct without auth). Backend `get_optional_lead` updated in Task 3 to recognize admin tokens, and `AuthGuard` lets admin in. The spec note about `getAdminToken() ?? leadToken` in demo components was overstated — confirmed during plan-time exploration. Plan correctly omits unnecessary frontend changes.
- §4.2 `get_current_lead` widens → Task 1 ✓
- §4.2 `/auth/me` admin payload → Task 2 ✓
- §6 StudioHeader admin badge + logout → Task 8 ✓
- §7 error handling (wrong password, expired token) → Task 5 + Task 9 ✓
- §8 manual smoke → Task 9 ✓

**Placeholder scan:** No "TBD", "TODO", "implement later". Each step has runnable commands or full code.

**Type consistency:** `getAdminToken`, `clearAdminToken`, `setAdminToken` used consistently. `MeResponse` shape matches across Task 2 and Task 5. `Lead | AdminUser` type used uniformly in backend.

No issues to fix.
