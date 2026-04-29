# Admin Login on the Gate Page — Design

**Date:** 2026-04-30
**Branch:** `nexapex-v3-demo`
**Status:** Draft (pending user review)

## 1. Problem

Today, lead users sign up at `/auth` (the AI Solutions Studio gate) and admins sign in at a separate `/admin/login` page. The two flows are disjoint:

- An admin who lands on `/auth` cannot reach the demos without first creating a lead account.
- An admin token cannot pass through the demo endpoints. `backend/app/dependencies.py::get_current_lead` looks up `Lead` by `payload["sub"]` — admin tokens carry an admin UUID and `payload.type == "admin"`, so they 401 on `/v1/proxy/...` calls.

We want admins to:

1. Sign in directly from the gate page in the screenshot at `/auth`.
2. Land on `/demos` and be able to run every demo (vision, chat, docs).
3. Still reach the existing admin dashboard at `/admin/leads` from a header link.

The `/admin/login` deep-link continues to work unchanged — it is not removed.

## 2. Out of Scope

- Switching auth storage from `localStorage` to `httpOnly` cookies. The current pattern is preserved.
- Email/password flow for leads. Leads remain a one-step signup.
- Any change to `/admin/leads` data, schema, or seeded admin (`nexuslab.dev.mm@gmail.com` / `123123` is already provisioned by migration `002_add_approval_and_seed_admin.py`).
- New admin users / signup. The seeded admin is the only one.

## 3. User-Facing Behavior

The `/auth` page gains a small **two-mode segmented toggle** above the form:

```
┌──────────────────────────────────────┐
│         AI SOLUTIONS STUDIO          │
│  Try real AI demos…                  │
│                                      │
│   ┌────────────┬──────────────┐      │
│   │   Lead     │    Admin     │      │  ← segmented toggle
│   └────────────┴──────────────┘      │
│                                      │
│  [Email *]                           │
│  [Name *]            (Lead mode)     │
│  [Company]                           │
│  [Industry ▼]                        │
│  ─────  OR  ─────                    │
│  [Email *]                           │
│  [Password *]        (Admin mode)    │
│                                      │
│  [ TRY OUR AI / SIGN IN ]            │
│  Your data is never shared. …        │
└──────────────────────────────────────┘
```

- Default mode: **Lead** (existing form, unchanged behavior).
- Switching to **Admin**: form swaps to email + password. Button label becomes "Sign in".
- Mode is local component state — no URL change, no persistence.
- On Admin success: store admin JWT in `localStorage["nexapex_admin"]`, route to `/demos`.
- On Lead success: existing flow (`/demos` after approval, `PendingScreen` if not approved).

## 4. Architecture

### 4.1 Frontend

**`src/components/studio/EmailGateForm.tsx` (modified)**

Add `mode: "lead" | "admin"` state and a small segmented toggle. Conditionally render either the lead inputs or the admin (`email`, `password`) inputs. Submit handler branches:

```ts
if (mode === "admin") {
  const res = await apiPost<{ token: string; email: string; role: string }>(
    "/admin/login",
    { email, password },
  );
  setAdminToken(res.token);          // existing helper
  router.push("/demos");
} else {
  /* existing lead signup flow */
}
```

Keep error handling and loading state shared between modes.

**`src/components/studio/AuthGuard.tsx` (modified)**

Today the guard reads only `nexapex_auth` (lead token) via `useAuth()`. It now must also accept an admin token:

- If `getAdminToken()` returns a token, call `/auth/me` with that token. Backend (§4.2) returns `{is_approved: true, name: "Admin"}` for admin tokens, so the guard sets status `approved`.
  - Calling `/auth/me` is **always** done (admin or lead) so expired tokens are detected and the user is redirected back to `/auth`.
  - On 401, `clearAdminToken()` first, then redirect.
- Else, fall back to the existing lead path (`useAuth()` token + `/auth/me` + `is_approved`).

**`src/lib/api.ts` (no change expected)**

`apiGet`/`apiPost` already accept a token. Demo components currently pass the lead token from `useAuth()`. We update each demo component (Vision, Chat, Docs) to prefer the admin token when present:

```ts
const token = getAdminToken() ?? leadToken;
```

This is a small, mechanical change in 2–3 demo components. See §6 for the file list.

**`src/lib/admin-auth.ts` (no change)**

`setAdminToken/getAdminToken/clearAdminToken` keep their current shape. Storage key `nexapex_admin` is reused.

### 4.2 Backend

**`backend/app/dependencies.py::get_current_lead` (modified)**

Make the dependency accept admin tokens transparently:

```python
async def get_current_lead(credentials, db) -> Lead | AdminUser:
    payload = verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")

    if payload.get("type") == "admin":
        result = await db.execute(select(AdminUser).where(AdminUser.id == payload["sub"]))
        admin = result.scalar_one_or_none()
        if not admin:
            raise HTTPException(401, "Admin not found")
        return admin              # admin is treated as auto-approved

    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(401, "Lead not found")
    return lead
```

Return type annotation is widened to `Lead | AdminUser`. Existing demo handlers that only read `lead.email` keep working — both models expose `.email`. Handlers that touch lead-only fields (`is_approved`, `industry`) are reviewed in §6.

**`backend/app/auth/router.py::/auth/me` (modified)**

Accept admin tokens and respond with an admin-shaped payload:

```python
if isinstance(user, AdminUser):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": "Admin",
        "is_approved": True,
    }
# existing lead branch unchanged
```

This way, the existing `AuthGuard` — if we keep `/auth/me` as the source of truth — sees `is_approved: true` for admins and lets them through.

**No DB / migration changes.** The admin row already exists.

## 5. Data Flow

```
Gate page (Admin tab)
   │ POST /admin/login {email, password}
   ▼
backend/app/admin/router.py::admin_login
   │ verify bcrypt, mint admin JWT (type=admin)
   ▼
client: localStorage["nexapex_admin"] = token
   │ router.push("/demos")
   ▼
/demos AuthGuard
   │ getAdminToken() → token present
   │ (optional) GET /auth/me with admin token → {is_approved: true}
   ▼ status = "approved"
Demo UI (Vision / Chat / Docs)
   │ POST /v1/proxy/vision/inspect  (Bearer admin JWT)
   ▼
backend/app/dependencies.py::get_current_lead
   │ payload.type == "admin" → return AdminUser
   ▼
demo handler runs, returns 200
```

## 6. Files Changed

| File | Change |
|---|---|
| `src/components/studio/EmailGateForm.tsx` | Add mode toggle, admin form fields, admin submit branch |
| `src/components/studio/AuthGuard.tsx` | Accept admin token; treat as approved |
| `src/components/demos/VisionInspector.tsx` | Use `getAdminToken() ?? leadToken` for `Authorization` header |
| `src/components/demos/ChatInterface.tsx` | Same |
| `src/components/studio/StudioHeader.tsx` | When admin token present, show "Admin" badge + link to `/admin/leads`; logout clears admin token |
| `backend/app/dependencies.py` | `get_current_lead` accepts admin tokens |
| `backend/app/auth/router.py` | `/auth/me` returns admin-shaped payload for admin tokens |

> Document Intelligence demo (Tasks 11–12) is not yet implemented. When it lands, it must follow the same `getAdminToken() ?? leadToken` rule. This is captured in the implementation plan.

## 7. Error Handling

| Case | Behavior |
|---|---|
| Wrong admin password | Backend `401 Invalid credentials` → inline red text "Invalid credentials" (existing pattern) |
| Admin JWT expired | `/auth/me` 401 → AuthGuard redirects to `/auth` (existing pattern); `clearAdminToken()` first |
| Admin token + lead token both stored | Admin token wins (`getAdminToken() ?? leadToken`) |
| Server unreachable on `/admin/login` | Existing fetch error path: `apiPost` throws → form shows error message |

## 8. Testing

**Manual smoke (non-negotiable, per project rules):**

1. Start backend (`uvicorn`) + frontend (`npm run dev`).
2. Visit `/auth`. Toggle to **Admin**. Enter `nexuslab.dev.mm@gmail.com` / `123123`. Submit.
3. Land on `/demos`. Run Vision Inspector with a sample image → expect bounding boxes + suggestion (no 401).
4. Run Smart Assistant chat → expect SSE stream (no 401).
5. Click "Admin" link in header → reach `/admin/leads`, see lead list.
6. Log out → return to `/auth`. Default mode is **Lead**. Sign up as a fresh lead → unchanged flow.
7. Wrong admin password → inline error, no token stored.

**Regression checks:**

- Lead signup still routes to `/demos` and shows `PendingScreen` when `is_approved=false`.
- `/admin/login` deep-link still works.
- Demo endpoints reject completely missing tokens (`401`).

## 9. Security Notes

- Admin password remains bcrypt-hashed in DB (no change).
- Admin JWT lifetime is the existing `settings.jwt_expire_hours` — no special long-lived tokens.
- The default credentials `123123` are demo-only. Production deployment must rotate via a new migration or admin reset endpoint (out of scope for this spec).
- `localStorage` storage means XSS would expose the admin token. This matches the existing risk surface; switching to `httpOnly` cookies is documented as a future improvement (not part of this work).

## 10. Open Questions

None. Approach A (single `get_current_lead` accepting both token types) and `localStorage` storage were both confirmed by the user before this spec was written.
