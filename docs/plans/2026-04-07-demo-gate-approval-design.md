# Demo Gate & Admin Approval — Design

**Date**: 2026-04-07
**Branch**: `nexapex-v3-demo`
**Status**: Approved

## Problem

The `/demos` page is currently unprotected. Any user who signs up via `/auth` immediately gets a JWT and full demo access. The founders need to manually review and approve each signup before granting demo access.

## Decision

**Approach A — Backend-gated with AuthGuard** (chosen over frontend-only gate and token-refresh approaches).

- Add `is_approved` column to `Lead` table (default `false`)
- AuthGuard component in demos layout checks approval status via `GET /auth/me`
- Unapproved users see a "pending review" screen inline
- Founders approve leads via `/admin/leads` page
- No Next.js middleware — client-side guard in `(studio)/demos/layout.tsx`

## Database Changes

### Lead table

Add column:

```sql
ALTER TABLE leads ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT FALSE;
```

### AdminUser table

Already exists. Seed super admin in migration:

- Email: `nexuslab.dev.mm@gmail.com`
- Password: bcrypt-hashed (never stored plain)
- Role: `super_admin`

Migration file: `backend/alembic/versions/002_add_lead_approval_and_seed_admin.py`

## Auth Flow

### User flow

1. User visits `/demos`
2. `AuthGuard` checks for JWT token in `AuthProvider`
3. No token → redirect to `/auth`
4. Has token → `GET /auth/me` to check `is_approved`
5. `is_approved === false` → render `PendingScreen` inline
6. `is_approved === true` → render demos normally

### Signup

No changes to `POST /auth/signup`. Lead is created with `is_approved=false`. JWT is issued immediately (used to identify the lead, not to grant access).

### New endpoint: GET /auth/me

Returns current lead profile including `is_approved` status. Protected by `get_current_lead()` dependency.

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Jane",
  "company": "Acme",
  "industry": "retail",
  "is_approved": false
}
```

## Admin System

### Admin auth

- `POST /auth/admin/login` — validates email+password against `AdminUser` table (bcrypt), returns admin JWT with `role` claim
- `get_current_admin()` dependency — validates admin JWT, checks role

### Admin endpoints

- `GET /admin/leads?status=pending|approved|all` — list leads with filter
- `PATCH /admin/leads/{id}/approve` — set `is_approved=true`

### Admin UI

**Route group**: `src/app/(admin)/` — separate from `(studio)`, minimal layout.

**`/admin/login`** — email + password form, calls admin login endpoint.

**`/admin/leads`** — table view:
- Columns: Name, Email, Company, Industry, Signed Up, Status
- "Approve" button per pending row
- Filter tabs: All / Pending / Approved

## Files

| File | Action |
|------|--------|
| `backend/alembic/versions/002_*.py` | New — migration + seed admin |
| `backend/app/auth/router.py` | Add `/auth/me`, `/auth/admin/login` |
| `backend/app/admin/__init__.py` | New |
| `backend/app/admin/router.py` | New — leads list + approve |
| `backend/app/admin/schemas.py` | New — admin models |
| `backend/app/dependencies.py` | Add `get_current_admin()` |
| `backend/app/db/models.py` | Add `is_approved` to Lead |
| `backend/app/main.py` | Register admin router |
| `src/app/(admin)/layout.tsx` | New — minimal admin layout |
| `src/app/(admin)/admin/login/page.tsx` | New — login form |
| `src/app/(admin)/admin/leads/page.tsx` | New — approval table |
| `src/components/studio/AuthGuard.tsx` | New — checks token + approval |
| `src/components/studio/PendingScreen.tsx` | New — "under review" UI |
| `src/app/(studio)/demos/layout.tsx` | Wrap with AuthGuard |

## Not Touched

- `/auth` page and `EmailGateForm` — unchanged
- Vision Inspector components — unchanged
- API proxy — unchanged
- Existing JWT issuance — unchanged

## Flow Diagram

```
USER:   /demos → AuthGuard → has token? →NO→ /auth
                                ↓ YES
                          GET /auth/me
                                ↓
                        is_approved? →NO→ PendingScreen
                                ↓ YES
                          Render demos

ADMIN:  /admin/login → POST /auth/admin/login → JWT
              ↓
        /admin/leads → GET /admin/leads?status=pending
              ↓
        Click "Approve" → PATCH /admin/leads/{id}/approve
              ↓
        User refreshes → AuthGuard passes → demos unlocked
```
