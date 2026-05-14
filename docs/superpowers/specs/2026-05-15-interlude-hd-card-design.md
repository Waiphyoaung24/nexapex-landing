# Interlude — HD Card Redesign

**Date:** 2026-05-15
**Branch:** `nexapex-v3-demo`
**Component:** `src/components/InterstitialBreathe.tsx`
**Supersedes parts of:** `docs/superpowers/specs/2026-05-14-interlude-breathe-design.md`

## Problem

The "SYSTEMS THAT BREATHE." interlude currently pins as a full-viewport
section (`h-screen`) with a 150-frame canvas scrub driven by ScrollTrigger.
Visually it reads as another hero section rather than a poster moment, the
headline overflows on wide screens, and the pin + frame capture is heavy
machinery for what should be a single editorial beat.

The user wants it to *not* be full-screen and to read as a deliberately HD
media card — a contained 16:9 frame at desktop, with the page background
visible around it.

## Goal

Replace the full-viewport pinned interlude with a contained, HD-framed
butterfly card that sits in normal page flow, auto-loops, and preserves the
existing brand language (gradient headline, 3-column caption row, brand
CTAs).

## Scope

**In scope:**
- Visual restructure of `InterstitialBreathe.tsx`
- Remove pin + scrub + frame-capture code paths
- Add 16:9 contained card with rounded corners, ring, glow, and vignette
- Re-scale headline to card width, not viewport
- Preserve eyebrow, headline copy, caption row, CTAs, and section id

**Out of scope:**
- Other sections on the marketing page
- Changes to the video asset itself (same Cloudinary mp4 / poster)
- Copy edits

## Design

### Section frame

```
<section id="breathe-section" bg-nex-background py-16 md:py-28>
  <div max-w-[1440px] mx-auto px-5 md:px-[60px]>
    <eyebrow>                          02.5 / INTERLUDE
    <media-card>                       16:9 HD frame (1280×720 ceiling)
    <caption-row>                      3-col: tagline · CTAs · tagline
  </div>
</section>
```

Outer `section` keeps the `bg-nex-background` token so it joins the
`BrandSection` above and `EditorialHighlightSection` below cleanly. The top
seam fade gradient stays.

### Media card

- **Aspect:** `aspect-ratio: 16 / 9` (Tailwind `aspect-video`)
- **Width:** `width: 100%; max-width: 1280px` — true HD width at the ceiling
- **Position:** `mx-auto` centered horizontally
- **Surface:**
  - `rounded-2xl` (16px) corners
  - `ring-1 ring-[#94fcff]/15` brand-tinted edge
  - Outer glow: `box-shadow: 0 30px 80px -20px rgba(148,252,255,0.18), 0 0 0 1px rgba(148,252,255,0.05)`
  - `overflow: hidden` so video clips to corners
- **Video:**
  - Single `<video>` element (no canvas, no frame buffer)
  - `autoplay muted loop playsinline preload="metadata"`
  - `object-cover` filling the card
  - `poster={POSTER_SRC}` for first-paint and reduced-motion fallback
- **Vignette overlay** (inside card, above video, below text):
  - `radial-gradient(ellipse at center, rgba(14,20,24,0) 0%, rgba(14,20,24,0.35) 70%, rgba(14,20,24,0.7) 100%)`
  - Pointer-events none, aria-hidden
- **Headline overlay** (`absolute inset-0`, flex center):
  - Copy: `SYSTEMS THAT BREATHE.`
  - Font: `var(--font-display)`, uppercase, normal weight
  - Size: `clamp(2rem, 7vw, 6.5rem)` — scales to card, not viewport
  - Tracking: `-0.025em`, leading `0.9`
  - Fill: gradient `linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #94fcff 100%)` with `-webkit-background-clip: text`
  - `text-shadow: 0 2px 30px rgba(0,0,0,0.4)` for legibility over butterflies
  - `select-none`, `pointer-events-none`

### Eyebrow row

Above the card, left-aligned within the container:
- Copy: `02.5 / INTERLUDE`
- Existing class: `text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50`
- Margin: `mb-6 md:mb-10`

### Caption row (below card)

Layout: 3-column grid on `md+`, single-column stack on mobile.

```
[ "Built like nature: living systems,        [ Start a project ]   [ "From a single prototype to a
   not static deliverables." ]               [ See work        ]      stack that runs every day." ]
        text-white/60                         existing buttons              text-white/60 md:text-right
```

- Spacing: `mt-8 md:mt-14`
- Columns: `grid-cols-1 md:grid-cols-3 items-start md:items-center gap-6`
- Existing button markup unchanged (outline brand CTA + liquid-glass)

### Reduced motion

When `prefers-reduced-motion: reduce`:
- Render `<img src={POSTER_SRC}>` instead of `<video>`
- No autoplay, no parallax, no transitions beyond the existing 1s opacity reveal

### Responsive behavior

| Breakpoint | Card width | Headline clamp | Caption row |
|-----------|-----------|----------------|-------------|
| `< 640px` | `calc(100vw - 40px)` (gutter) | `clamp(2rem, 7vw, 3.5rem)` resolves small | Stack vertically |
| `640–1024` | `min(100%, 90vw)` | mid-range of clamp | 3-col |
| `≥ 1280px` | `1280px` ceiling | hits `6.5rem` cap | 3-col |

The card never grows past 1280px wide, so on ultrawide displays the page
background is clearly visible on both sides — this is the "deliberately HD"
read.

## What is removed

From `InterstitialBreathe.tsx`:
1. `pickProfile()`, `Profile` type, `profile` state — single render path now
2. `framesRef`, `framesReady` state, `MAX_FRAMES`, `MAX_WIDTH` constants
3. Frame-capture `useEffect` (`captureFrame`, `requestVideoFrameCallback`, canvas writes)
4. Canvas-sizing `useEffect`
5. `useGSAP` pin + scrub timeline
6. `ScrollTrigger.refresh()` post-capture effect
7. Mouse-parallax `useEffect`
8. `canvasRef`, `bgRef`, `pinnedRef` refs
9. GSAP / ScrollTrigger / useGSAP imports
10. Outer `pinnedRef` wrapper div (`h-screen w-full`)

The component becomes a small functional component with one effect — a
reduced-motion media-query listener — and a static JSX tree.

## What is preserved

- Section `id` (default `"breathe-section"`)
- Brand colors and gradient fill
- Eyebrow copy
- Headline copy
- Caption copy
- CTA components and `href`s (`/#contact`, `#project-showcase`)
- `aria-label="Interlude — Systems that breathe"` on the section
- Video and poster URLs

## Acceptance criteria

1. Section is **not** full-viewport height. It grows naturally to fit its
   content (eyebrow + 16:9 card + caption row + padding).
2. On `≥ 1280px` viewports, the card is exactly 1280px wide and 720px tall
   (or as close as `aspect-video` resolves).
3. Card has visible rounded corners, brand-tinted ring, and soft outer
   glow.
4. Headline "SYSTEMS THAT BREATHE." sits centered inside the card, fully
   readable against the butterflies (vignette + text-shadow).
5. Video auto-loops without any scroll interaction. No pin spacer is
   inserted by ScrollTrigger.
6. `prefers-reduced-motion: reduce` renders the poster image only.
7. No regression on the seam where this section meets `BrandSection`
   above (top seam fade preserved).
8. Section background remains the shared `bg-nex-background` token.

## Files touched

- `src/components/InterstitialBreathe.tsx` — rewrite component body
- (No new files. No CSS file changes required if `liquid-glass` and brand
  tokens already exist; verify during implementation.)

## Risks / notes

- The existing scroll-scrub was added in the 2026-05-14 spec as a
  deliberate cinematic beat; removing it is a downgrade in motion fidelity
  but a clear upgrade in framing intent (and a perf win).
- If the autoplay `<video>` causes layout shift on slower networks, the
  poster `<img>` paints first and the video swaps in. Acceptable.
- Width ceiling 1280px is locked by design — do **not** raise to 1440 or
  full-bleed; that loses the "HD card" identity.
