# Marketing Landing — Traditional Scroll + Editorial Entrance Animations

**Date:** 2026-05-08
**Branch:** `nexapex-v3-demo`
**Surfaces:** `src/app/(marketing)/page.tsx` and the 5 main marketing sections

## Goal

Replace the current pinned-curtain stack pattern (`PageSlideSection` with `pin: true` + `clipPath` scrub) with traditional vertical scroll. Add a unified GSAP "Editorial" entrance choreography that fires once when each main section enters the viewport. No content or layout redesign — the screenshot shown in brainstorming was BrandSection's existing 3-pillar trio (`Computer Vision / AI Assistants / Document Intelligence`), which already exists in the codebase. CapabilitiesSection keeps its current 4-card grid; only its entrance animation changes.

ScrollSmoother stays — it's what gives entrance animations their buttery feel. The visual rhythm of the page comes from per-section choreography, not from layered pinning.

## Non-goals

- Hero choreography (its existing AI Lab GSAP intro stays).
- Footer choreography (left as quiet outro).
- Any change to `(studio)` surfaces or `(admin)`.
- Any copy edits outside `CapabilitiesSection`.

## Locked decisions (from brainstorm)

| # | Decision |
|---|---|
| 1 | Traditional vertical scroll. No pin, no clipPath. |
| 2 | Strip pin+clipPath everywhere. Keep `ScrollSmoother`. Hero loses `sticky top-0`. |
| 3 | "Editorial" entrance flavor — mono index → SplitText chars rise → body fade-rise → columns/cards stagger. Triggered once at `top 80%`, no scrub. |
| 4 | Apply to Brand → CTA (5 sections). Hero & Footer untouched. |
| 5 | Keep `CapabilitiesSection` 4-card layout/content as-is; apply only the editorial entrance animation. (Brainstorm screenshot was BrandSection's 3-pillar trio, which already exists — no redesign needed.) |

## File changes

**Delete:**
- `src/components/PageSlideSection.tsx` — pin + clipPath wrapper, no longer needed.
- `src/components/ScrollPauseIndicator.tsx` — depends on `PageSlideSection` pin points.
- `src/lib/scroll-pause.ts` — depends on `PageSlideSection` pin points.

**Create:**
- `src/lib/editorial-reveal.ts` — shared GSAP entrance hook. Sole reveal contract for the 5 sections.

**Modify:**
- `src/app/(marketing)/page.tsx` — replace each `<PageSlideSection ...><Section/></PageSlideSection>` with bare `<Section id="..." />`. Remove `<ScrollPauseIndicator/>` mount.
- `src/components/SmoothScroll.tsx` — remove `initScrollPauses(...)` call and import.
- `src/components/HeroSection.tsx` — remove `sticky top-0`. Other GSAP unchanged.
- `src/components/BrandSection.tsx` — adopt editorial-reveal hook; remove pre-existing entrance animations that conflict.
- `src/components/ClientsSection.tsx` — adopt editorial-reveal hook; keep existing horizontal marquee animation on the logo strip (continuous loop, separate concern).
- `src/components/ui/project-showcase.tsx` — adopt editorial-reveal hook; consolidate any existing entrance animations.
- `src/components/CapabilitiesSection.tsx` — adopt editorial-reveal hook; replace inline animations; add a section-level `04 / WHAT WE DO` mono index. Content (4 cards: Vision/Language/Documents/Delivery) and layout unchanged.
- `src/components/CTASection.tsx` — adopt editorial-reveal hook with `hasIndex: false` and `bodyBeforeHeading: true`. Existing SplitText word reveal kept (reused by the hook). 3D ball already removed in commit `bd54070`.

**Net delta:** −3 files, +1 file, 8 modified.

## Editorial entrance pattern (the contract)

A single GSAP timeline shape that every modified section follows. Implemented as a hook in `src/lib/editorial-reveal.ts`.

### Beat sequence

Fires when the section's top hits 80% of the viewport. No scrub. `toggleActions: "play none none reverse"` so scroll-back-up replays.

| Beat | Element | Motion | Duration | Ease | Delay |
|---|---|---|---|---|---|
| 1 | `.editorial-index` | `y: 16 → 0`, opacity `0 → 0.6` | 0.5s | `power2.out` | 0 |
| 2 | `.editorial-heading` chars (SplitText) | `y: 40 → 0`, opacity `0 → 1` | 1.0s | `power4.out` | 0.15s, char-stagger 0.04s |
| 3 | `.editorial-body` | `y: 24 → 0`, opacity `0 → 1` | 0.7s | `power3.out` | 0.55s |
| 4 | `.editorial-item` | `y: 50 → 0`, opacity `0 → 1` | 0.7s | `power3.out` | 0.7s, stagger 0.1s |

Total runtime ≈ 1.4s. Finishes inside a normal scroll dwell, doesn't block fast scrollers.

### Hook API

```ts
useEditorialReveal(
  sectionRef: RefObject<HTMLElement>,
  options?: {
    hasIndex?: boolean;          // default true; skip beat 1 if false
    splitHeading?: boolean;      // default true; false = whole-heading fade-rise (no SplitText)
    bodyBeforeHeading?: boolean; // default false; CTA inverts to body-then-heading
    startOffset?: string;        // default "top 80%"
  }
): void
```

### Hook responsibilities

- Register `useGSAP`, `ScrollTrigger`, `SplitText` on the GSAP global once (idempotent guard).
- Early-return if `prefers-reduced-motion: reduce`.
- Build a `ScrollTrigger`-driven `gsap.timeline()` scoped to `sectionRef`.
- Use `SplitText.create(headingEl, { type: "words,chars" })` for beat 2; revert SplitText on cleanup.
- Apply each beat's selector with `.from(...)` calls in sequence.
- Return nothing; cleanup happens via `useGSAP`'s scope.

### Class contract

Each section's JSX adds these classes to specific elements; the hook handles the rest.

| Class | Where to put it |
|---|---|
| `.editorial-index` | Single small mono label at the top of the section. Skip when `hasIndex: false`. |
| `.editorial-heading` | The big display heading (Nevera). Required. |
| `.editorial-body` | Supporting paragraph(s) below the heading. Optional but typical. |
| `.editorial-item` | Each repeating element below the body — column, card, logo row, button, etc. Order matters for stagger. |

## Per-section choreography

### `BrandSection`

| Slot | Element |
|---|---|
| `.editorial-index` | `01 / WHO WE ARE` mono label, top-left, JetBrains Mono cyan/0.6 |
| `.editorial-heading` | Existing brand display heading (kept) |
| `.editorial-body` | Existing supporting paragraph (kept) |
| `.editorial-item` | Sub-blocks (founder line, signature, etc.) in document order |

Existing inline GSAP intro animations replaced by the hook.

### `ClientsSection`

| Slot | Element |
|---|---|
| `.editorial-index` | `02 / TECHNOLOGIES` |
| `.editorial-heading` | Existing heading (kept) |
| `.editorial-body` | Small caption (kept) |
| `.editorial-item` | The marquee row container (one fade-rise on the wrapper). The horizontal logo marquee animation is unchanged — it's a continuous CSS/GSAP loop, separate from the entrance. |

### `ProjectShowcase`

| Slot | Element |
|---|---|
| `.editorial-index` | `03 / SELECTED WORK` |
| `.editorial-heading` | Showcase heading |
| `.editorial-body` | Caption / year range |
| `.editorial-item` | Each project tile, staggered |

### `CapabilitiesSection` — animation pass only (no redesign)

| Slot | Element |
|---|---|
| `.editorial-index` | New `04 / WHAT WE DO` mono label added at the top of the section header row |
| `.editorial-heading` | Existing `.capabilities-heading` h2 (`WHAT WE DO`, Nevera, gradient fill kept) |
| `.editorial-body` | Existing `.capabilities-desc` paragraph (`AI SOLUTIONS THAT SHIP — FROM PROTOTYPE TO PRODUCTION...`) |
| `.editorial-item` | Each of the 4 existing `.capability-card` divs (Vision / Language / Documents / Delivery), staggered |

The `.cat-btn` category buttons keep their existing scale-in animation inline — they're tertiary visual chrome, not editorial items, and don't need the unified treatment. Existing inline GSAP on heading/desc/cards is replaced by the hook.

### `CTASection`

| Slot | Element |
|---|---|
| `.editorial-index` | (none — `hasIndex: false`) |
| `.editorial-heading` | `Let's build something real.` (existing SplitText words + gradient fill kept; retimed to match unified durations) |
| `.editorial-body` | `Ready to see AI in action?` tagline. Inverts: body fades in BEFORE heading via `bodyBeforeHeading: true` |
| `.editorial-item` | `Book a Consultation` pill button |

## CapabilitiesSection — minor markup additions

No redesign. The existing 4-card layout (`Vision / Language / Documents / Delivery` with bullet skill lists) stays exactly as it is. Only changes:

1. Add a small `04 / WHAT WE DO` mono index label (using the existing `.mono-label` utility) at the top-left of the section header row, above the existing `.capabilities-heading`. This becomes the `.editorial-index`.
2. Add `editorial-heading` className to the existing `.capabilities-heading` h2.
3. Add `editorial-body` className to the existing `.capabilities-desc` paragraph.
4. Add `editorial-item` className to each of the 4 `.capability-card` divs.
5. Replace the existing inline GSAP `from(...)` animations on heading/desc/cards/skill-items with a single call to `useEditorialReveal(sectionRef)`.

Existing `.cat-btn` scale-in animation kept inline (tertiary chrome). Existing `.skill-item` slide-in animation kept inline (per-card detail, fires after card lands).

## ScrollSmoother + reduced-motion

- `ScrollSmoother.create({ smooth: 2, speed: 0.25, effects: true, normalizeScroll: true, smoothTouch: 0.1 })` unchanged in `SmoothScroll.tsx`.
- `initScrollPauses(...)` call removed (the function is deleted with `scroll-pause.ts`).
- Every section's reveal hook checks `window.matchMedia("(prefers-reduced-motion: reduce)").matches` and early-returns. With reduced-motion, all elements render in their final state immediately (no transforms, full opacity).

## Accessibility

- Heading hierarchy unchanged (each section keeps its `<h2>`).
- Mono index labels are decorative; not announced by screen readers (`aria-hidden` on the index `<span>`).
- Demo-link column titles are keyboard-focusable with the same hover-underline shown on `:focus-visible`. Focus ring uses `var(--ring)` (existing token).
- All animations are entrance-only and short (≤1.0s). No infinite loops outside the existing marquee, which already respects `prefers-reduced-motion`.

## Acceptance criteria

1. Marketing landing scrolls in normal flow — no section pins, no `clipPath` curtains.
2. Each of the 5 main sections plays its 4-beat editorial entrance once at `top 80%` of the viewport, replays in reverse on scroll-up.
3. CapabilitiesSection still renders as the 4-card grid (Vision/Language/Documents/Delivery), now preceded by a `04 / WHAT WE DO` mono index, and uses the editorial entrance.
4. `ScrollPauseIndicator` is gone from the DOM; the floating pause hint never appears.
5. With `prefers-reduced-motion: reduce`, all entrance animations are skipped and elements render in final state.
6. `npm run check` passes (`lint` + `typecheck` + `build`).

## Open questions

None at brainstorm close.
