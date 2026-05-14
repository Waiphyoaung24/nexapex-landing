# Section Seam Fix + Background Token Unification — Design

**Date:** 2026-05-14
**Branch:** `nexapex-v3-demo`
**Scope:** Marketing landing page (`src/app/(marketing)/page.tsx`)

## Problem

A visible color band appears at the boundary between `BrandSection` (`src/components/BrandSection.tsx`) and `InterstitialBreathe` (`src/components/InterstitialBreathe.tsx`, "02.5 / INTERLUDE"). Both sections declare `bg-[#0e1418]`, but the seam is still visible because:

- `BrandSection`'s last content area renders fully opaque `#0e1418`.
- `InterstitialBreathe` starts immediately with its butterfly/flowers video-canvas. Its only darkening overlay is a *radial* ellipse vignette that reaches `rgba(14,20,24,0.7)` at the corners — i.e. 30% of the image still shows through at the top edge.
- The result: the top edge of the Interlude canvas is perceptibly bluer and lighter than the solid `#0e1418` of BrandSection above it.

A secondary issue surfaced by this bug: the codebase declares `--color-nex-background: #0e1418` in `src/styles/globals.css` (auto-generating the `bg-nex-background` Tailwind utility), but section components use the literal `bg-[#0e1418]` instead. With 56 hardcoded `#0e1418` occurrences across 28 files, future drift is inevitable.

## Goals

1. Eliminate the visible band between `BrandSection` and `InterstitialBreathe`.
2. Make the existing `--color-nex-background` token the canonical source for section-level deep-surface backgrounds, so future sections cannot drift via copy-pasted hex.

## Non-Goals

- Replacing every `#0e1418` literal in the codebase. Internal usages (`text-[#0e1418]`, hover states, `rgba(14,20,24,…)` gradient stops, JS color constants in `src/lib/particle-morph/Config.ts`) are out of scope. They reference the same color but at different semantic layers; converting them via `color-mix()` is a separate refactor.
- Studio, admin, and demo subpages. This spec covers only the marketing landing route group.
- Auditing other section transitions on the landing page. This spec addresses one seam; the token unification is a prophylactic measure for the same class of bug elsewhere.

## Design

### Part A — Seam fix

Add a top-edge linear gradient overlay inside `InterstitialBreathe`, mirroring the existing pattern at `BrandSection.tsx:134–141` (which fades the top of BrandSection into the canvas above it).

**Location:** inside the `<section>` of `InterstitialBreathe` (around line 331), as a sibling of `pinnedRef`. It must sit *above* the bg layer (the video/canvas/poster) but *below* `InterludeContent` so headline text is unaffected.

**Markup:**

```tsx
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-x-0 top-0 h-32 md:h-40 z-[5]"
  style={{
    background:
      "linear-gradient(to bottom, #0e1418 0%, rgba(14,20,24,0.6) 55%, rgba(14,20,24,0) 100%)",
  }}
/>
```

**Why these numbers:**
- `h-32 md:h-40` (128px / 160px) — matches the perceptual softness of BrandSection's `-top-64 md:-top-96` (256px / 384px), but shorter because the Interlude canvas is pinned and the fade must occupy a smaller fraction of the viewport.
- Three stops `1.0 → 0.6 → 0` — matches the cadence in BrandSection's `rgba(14,20,24,0) → 0.55 → #0e1418` (inverted direction).
- `z-[5]` — above the bg layer (which is unstacked, so z:auto = 0) and the radial vignette inside it, below the headline content layer (which is rendered by `InterludeContent` later in DOM order).

The existing radial vignette inside the bg layer (line 396–399) stays as-is — it handles side/bottom darkening. This new overlay only addresses the top edge.

### Part B — Token unification

#### Token declaration

The token `--color-nex-background: #0e1418` already exists at `src/styles/globals.css:15`. No new token is added. A short comment is appended above it declaring it the canonical deep-surface background, so future contributors don't reintroduce literal hex.

```css
/* Canonical deep-surface background. All section-level <section> wrappers
   on marketing routes must use bg-nex-background (not bg-[#0e1418]) to
   stay in sync with this token. */
--color-nex-background: #0e1418;
```

#### Migration scope — top-level `<section>` wrappers only

Replace `bg-[#0e1418]` with `bg-nex-background` on the root section element of each of these files. **Only the section root** — internal `bg-[#0e1418]` instances (e.g. modal backdrops, hover states, button defaults) are out of scope.

| File | Change |
|---|---|
| `src/components/BrandSection.tsx` | Line 129: `bg-[#0e1418]` → `bg-nex-background` |
| `src/components/InterstitialBreathe.tsx` | Line 331: `bg-[#0e1418]` → `bg-nex-background` |
| `src/components/InterstitialCanvas.tsx` | Section root |
| `src/components/EditorialHighlightSection.tsx` | Section root |
| `src/components/ShipStackSection.tsx` | Section root |
| `src/components/ClientsSection.tsx` | Section root |
| `src/components/CapabilitiesSection.tsx` | Section root |
| `src/components/CTASection.tsx` | Section root |
| `src/components/FooterSection.tsx` | Section root |
| `src/components/ThreeShowcase.tsx` | Section root |
| `src/app/(marketing)/page.tsx` | Line 35: `bg-[#0e1418]` on the `ProjectShowcase` wrapper |

Final hex count for section roots: 0 instances of `bg-[#0e1418]` on a `<section>` element in marketing components.

#### What is intentionally not migrated

- `rgba(14,20,24, X)` gradient stops in JSX inline styles — they share the same color but encode opacity. Converting them to `color-mix(in oklab, var(--color-nex-background) X%, transparent)` is a viable follow-up but adds CSS complexity disproportionate to the seam fix.
- Hex literals inside `src/lib/particle-morph/Config.ts` (Three.js color constants) — Three.js consumes hex strings, not CSS variables.
- Studio, admin, and demo subpages — not on the landing route, out of scope.

## Verification

1. **Manual visual check:** Reload `/` on desktop (1920×1080), scroll to the Brand→Interlude transition. The seam should be invisible — solid `#0e1418` straight into the dimmed top of the butterfly canvas.
2. **Token grep:** `Grep "bg-\[#0e1418\]"` across the section component files listed above returns zero matches.
3. **Regression sweep:** Other section transitions on the page (Brand→Hero canvas above, Interlude→Practice below) should be visually unchanged. The top-edge overlay only affects InterstitialBreathe's top boundary.
4. **Reduced-motion / lite / static profiles** of InterstitialBreathe should all show the fade — the overlay is independent of the bg layer's profile, so it applies uniformly.

## Risks

- The new top-edge overlay sits at `z-[5]`. If `InterludeContent` (rendered next in `InterstitialBreathe.tsx:402`) ever raises text to `z-[4]` or below, the headline could be tinted dark at the top of the section. Mitigation: verify `InterludeContent` headline z-index during implementation; raise if needed.
- A future contributor adds a new section component with `bg-[#0e1418]` literal. Mitigation: the comment above `--color-nex-background` declares the rule. A CI lint rule could enforce it, but is out of scope.

## Out of Scope (Future Work)

- Audit and fix the other ~9 section transitions on the landing page.
- Convert internal `bg-[#0e1418]` and `rgba(14,20,24,…)` literals to token-driven values across the codebase.
- Add an ESLint rule banning literal `bg-[#0e1418]` outside `globals.css`.
