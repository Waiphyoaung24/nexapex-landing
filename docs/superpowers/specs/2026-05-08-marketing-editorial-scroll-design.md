# Marketing Landing — Traditional Scroll + Editorial Entrance Animations

**Date:** 2026-05-08
**Branch:** `nexapex-v3-demo`
**Surfaces:** `src/app/(marketing)/page.tsx` and the 5 main marketing sections

## Goal

Replace the current pinned-curtain stack pattern (`PageSlideSection` with `pin: true` + `clipPath` scrub) with traditional vertical scroll. Add a unified GSAP "Editorial" entrance choreography that fires once when each main section enters the viewport. Redesign `CapabilitiesSection` from a 4-card white grid to a 3-column editorial layout that mirrors the studio demos.

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
| 5 | Redesign `CapabilitiesSection` to 3-column editorial layout. |
| 6 | Add `+ END-TO-END DELIVERY · MODEL OPS · SUPPORT` mono band under the trio. |
| 7 | Column titles are hover-underline links to the matching studio demo. |

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
- `src/components/CapabilitiesSection.tsx` — full rewrite (content + layout + reveal hook).
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

### `CapabilitiesSection` — full redesign (see next section)

| Slot | Element |
|---|---|
| `.editorial-index` | `04 / WHAT WE DO` (section-level) |
| `.editorial-heading` | `WHAT WE DO` display heading (Nevera, gradient fill kept) |
| `.editorial-body` | `AI SOLUTIONS THAT SHIP — FROM PROTOTYPE TO PRODUCTION, BUILT FOR REAL BUSINESSES` mono caption |
| `.editorial-item` | Each of the 3 columns + the delivery band = 4 items, staggered |

The per-column `01 / 02 / 03` mono indices inside the columns are NOT `.editorial-index` — they're part of each column's contents and rise with their column as part of `.editorial-item`.

### `CTASection`

| Slot | Element |
|---|---|
| `.editorial-index` | (none — `hasIndex: false`) |
| `.editorial-heading` | `Let's build something real.` (existing SplitText words + gradient fill kept; retimed to match unified durations) |
| `.editorial-body` | `Ready to see AI in action?` tagline. Inverts: body fades in BEFORE heading via `bodyBeforeHeading: true` |
| `.editorial-item` | `Book a Consultation` pill button |

## CapabilitiesSection redesign

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  04 / WHAT WE DO                AI SOLUTIONS THAT SHIP —                 │
│  (mono cyan/0.6)                FROM PROTOTYPE TO PRODUCTION             │
│                                 (mono cyan/0.5, top-right)               │
│                                                                          │
│  ── thin divider rgba(148,252,255,0.12) 1px ──────────────────────────── │
│                                                                          │
│   01                  02                  03                             │
│   ─                   ─                   ─                              │
│   COMPUTER VISION     AI ASSISTANTS       DOCUMENT INTELLIGENCE          │
│                                                                          │
│   From quality        Custom-trained      Invoices, receipts,            │
│   control on the      language models     contracts — our                │
│   factory floor to    that understand     extraction pipelines           │
│   inventory tracking  your business,      turn stacks of                 │
│   in retail — our     speak your          paperwork into                 │
│   vision systems      customers'          structured,                    │
│   see what humans     language, and       searchable data in             │
│   miss and work       handle the          seconds.                       │
│   around the clock.   conversations                                      │
│                       that slow your                                     │
│                       team down.                                         │
│                                                                          │
│              ── thin divider rgba(148,252,255,0.10) ──                   │
│                                                                          │
│        + END-TO-END DELIVERY · MODEL OPS · SUPPORT                       │
│        (mono cyan/0.5 · 0.18em letter-spacing · centered)                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Content

| Slot | Copy |
|---|---|
| Section index | `04 / WHAT WE DO` |
| Section caption (mono, top-right) | `AI SOLUTIONS THAT SHIP — FROM PROTOTYPE TO PRODUCTION, BUILT FOR REAL BUSINESSES` |
| Display heading | `WHAT WE DO` |
| Col 01 title | `COMPUTER VISION` |
| Col 01 body | "From quality control on the factory floor to inventory tracking in retail — our vision systems see what humans miss and work around the clock." |
| Col 01 demo link | `/demos/vision` (column title becomes hover-underline link) |
| Col 02 title | `AI ASSISTANTS` |
| Col 02 body | "Custom-trained language models that understand your business, speak your customers' language, and handle the conversations that slow your team down." |
| Col 02 demo link | `/demos/chat` |
| Col 03 title | `DOCUMENT INTELLIGENCE` |
| Col 03 body | "Invoices, receipts, contracts — our extraction pipelines turn stacks of paperwork into structured, searchable data in seconds." |
| Col 03 demo link | `/demos/docs` |
| Delivery band | `+ END-TO-END DELIVERY  ·  MODEL OPS  ·  SUPPORT` |

### Typography & color (NexApex tokens)

| Element | Style |
|---|---|
| Mono index per column | `var(--font-mono-accent)` · `0.75rem` · cyan `#94fcff` · opacity 0.6 · letter-spacing `0.12em` (existing `.mono-label` utility) |
| Column title | `var(--font-display)` Nevera · uppercase · `clamp(1.25rem, 2.4vw, 1.75rem)` · `tracking-[-0.01em]` · color `#f0f1ef` · hover: underline cyan/60 |
| Column body | `var(--font-sans)` Nexa · `0.875rem` · `leading-[1.55]` · color `#c8ccc6` opacity 0.7 · `max-w-[42ch]` |
| Delivery band | mono cyan `rgba(148, 252, 255, 0.5)` · `0.7rem` · uppercase · letter-spacing `0.18em` · centered |
| Top divider | 1px `rgba(148, 252, 255, 0.12)` |
| Bottom divider | 1px `rgba(148, 252, 255, 0.10)` |
| Background | `bg-[#0e1418]` (kept) |

### Responsive grid

| Viewport | Columns | Gap | Notes |
|---|---|---|---|
| ≥1024px | `grid-cols-3` | 64px | Top-aligned, body wraps at `~42ch` |
| 768–1023px | `grid-cols-2` | 40px | Third column wraps to row 2 |
| <768px | `grid-cols-1` | 48px | Stacked |

### Demo-link interaction

Each column title is wrapped in a `<Link>` (Next.js) to its matching demo route:

| Column | href |
|---|---|
| `COMPUTER VISION` | `/demos/vision` |
| `AI ASSISTANTS` | `/demos/chat` |
| `DOCUMENT INTELLIGENCE` | `/demos/docs` |

Hover: 1px cyan/0.6 underline appears beneath the title with a 200ms `var(--ease-out-expo)` transition. The whole column is NOT a clickable card — only the title — to keep the editorial feel and avoid suggesting "card-style" affordance.

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
3. CapabilitiesSection renders as 3 editorial columns + delivery band on desktop, stacks correctly at 768/375.
4. Column titles in CapabilitiesSection link to `/demos/vision`, `/demos/chat`, `/demos/docs` and underline on hover/focus.
5. `ScrollPauseIndicator` is gone from the DOM; the floating pause hint never appears.
6. With `prefers-reduced-motion: reduce`, all entrance animations are skipped and elements render in final state.
7. `npm run check` passes (`lint` + `typecheck` + `build`).

## Open questions

None at brainstorm close. Demo-link option locked to **on**; flip in `CapabilitiesSection.tsx` if you change your mind during review.
