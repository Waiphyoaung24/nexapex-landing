# NexApex Interlude — "Systems That Breathe" Section — Design Spec

**Date:** 2026-05-14
**Branch:** `nexapex-v3-demo`
**Status:** approved (pending user review of written spec)

## Goal

Insert a new cinematic interstitial section between `BrandSection` (`01 / WHO WE ARE`) and `EditorialHighlightSection` (`02 / IN PRACTICE`) on the marketing landing. The section pins for one viewport of scroll while a butterflies/flowers video scrubs frame-by-frame in sync with scroll progress, overlaid with a poetic NexApex-adapted headline and two CTAs. Functions as an editorial breath between "Who We Are" and "How We Work."

## Architecture

One new client component, `InterstitialBreathe.tsx`, slotted into `src/app/(marketing)/page.tsx`. Uses Approach B for scroll-scrub: decode the source video once into an array of `HTMLCanvasElement` frames on mount, then drive a frame-index from `ScrollTrigger.progress` and redraw the visible canvas on each scroll tick. No new dependencies — re-uses `gsap`, `ScrollTrigger`, `useGSAP`, and Lenis (already wired via `<SmoothScroll>`).

Three rendering profiles, decided once at mount: **Full** (≥768px, no reduced-motion), **Lite** (<768px), **Static** (`prefers-reduced-motion: reduce` at any width).

## File Layout

```
src/
├── components/
│   └── InterstitialBreathe.tsx        NEW
├── app/(marketing)/page.tsx           EDIT (one-line insert)
└── styles/globals.css                 EDIT (append liquid-glass + hero-title)
```

No assets are committed locally; the video and poster are served from Cloudinary.

## Integration

In `src/app/(marketing)/page.tsx`, add one line between `BrandSection` and `EditorialHighlightSection`:

```tsx
<BrandSection id="brand-section" />
<InterstitialBreathe id="breathe-section" />        {/* NEW */}
<EditorialHighlightSection id="practice-section" />
```

No renumbering of the downstream `02 / IN PRACTICE` index — the new section is labeled `02.5 / INTERLUDE` to avoid touching siblings.

## Assets

| Asset | URL | Notes |
|---|---|---|
| Video source | `https://res.cloudinary.com/dkk8ylzhy/video/upload/v1778744291/Butterflies_flapping_flowers_swa__202605141433_ndqss3.mp4` | Defined as `VIDEO_SRC` constant inside the component. `muted`, `playsInline`, `preload="auto"`, `crossOrigin="anonymous"`. |
| Poster (still) | `https://res.cloudinary.com/dkk8ylzhy/video/upload/so_0,w_1280,q_auto/Butterflies_flapping_flowers_swa__202605141433_ndqss3.jpg` | Cloudinary auto-generates from the same public ID with `so_0` (start offset). Shown until `framesReady`. Also the canonical Static-profile image. |

## Data Flow (Full profile)

1. **Mount** — render poster `<img>`, mount hidden `<video>`, set `mounted=true` (triggers entrance fade for headline).
2. **`loadedmetadata`** — call `video.play().catch(() => {})`. Start the capture loop.
3. **Capture loop** — `requestVideoFrameCallback` (fallback: `rAF`). Each new frame is drawn onto a fresh offscreen `HTMLCanvasElement` at `min(1, 960 / videoWidth)` scale. Frames pushed to `framesRef.current`. Skip if `currentTime === lastTime` (de-dupe).
4. **Capture cap** — abort the capture loop and force `ended` after 150 frames OR if the video reports duration > 6s (defensive memory guard).
5. **`ended`** — set `capturing = false`, `setFramesReady(true)`, swap poster `<img>` → `<canvas>` in a single `rAF`. Pause and remove the source `<video>` from the DOM.
6. **`ScrollTrigger.refresh()`** — wire the pinned trigger now that we know frame count and have a real canvas to draw on.
7. **Scroll** — on each `onUpdate(self)`, compute `idx = Math.round(self.progress * (frames.length - 1))`; if `idx` changed since last draw, `ctx.drawImage(frames[idx], 0, 0)`.
8. **Unmount or unpin out of range** — `useGSAP` scope kills the trigger; frame array is GC'd on next tick.

## Scroll-Scrub Mechanics

```
section.h = 200vh                ← scroll runway
pinnedRef.h = 100vh              ← what stays visible
ScrollTrigger {
  trigger: sectionRef,
  start: "top top",
  end: "+=100%",
  pin: pinnedRef,
  pinSpacing: true,
  scrub: 0.5,                    ← half-second lerp; smooths Lenis latency
  invalidateOnRefresh: true,
  onUpdate(self) → drawFrame(idx from self.progress)
}
```

Content choreography runs on the **same** scrub trigger (single timeline, no competing pins):

| Progress | Behavior |
|---|---|
| 0.00 – 0.15 | Headline "SYSTEMS THAT BREATHE." fades + lifts in. |
| 0.15 – 0.85 | Video scrubs through frames; headline + bottom row hold. |
| 0.85 – 1.00 | Bottom vignette darkens to `rgba(14,20,24,0.45)`; seamless handoff into `EditorialHighlightSection` which shares `bg-[#0e1418]`. |

Mouse parallax on `pinnedRef`: `strength=20`, lerp `0.06`. Disabled at <1024px and under reduced-motion.

## Layout

**Desktop (≥1024px), pinned viewport:**

```
┌─────────────────────────────────────────────────────────────┐
│ 02.5 / INTERLUDE                                            │  ← eyebrow, top-left
│                                                             │
│              SYSTEMS THAT BREATHE.                          │  ← <h2>, italic Instrument Serif
│                                                             │
│  ░░░░ butterflies (canvas, full-bleed, behind text) ░░░░   │
│                                                             │
│                                                             │
│  Built like nature:       [ Start a project ]              │
│  living systems,          [ See work ]      From a          │
│  not static                                  prototype      │
│  deliverables.                               to a stack     │
│                                              that runs     │
│                                              every day.    │
└─────────────────────────────────────────────────────────────┘
   ↑ left aux                  ↑ CTAs            ↑ right aux
```

**Z-stacking:**
- `z-0` — pinned wrapper with `<canvas>` (visible) / `<video>` (mounted hidden until `framesReady`, then removed). Wrapper has `scale(1.06)` for parallax bleed.
- `z-10` — vignette overlay (top + bottom dark gradients, ramped by scroll progress).
- `z-20` — eyebrow, headline, bottom row, scroll cue.

## Copy

| Slot | Text |
|---|---|
| Eyebrow (top-left) | `02.5 / INTERLUDE` |
| Headline | `SYSTEMS THAT BREATHE.` |
| Left aux | `Built like nature: living systems, not static deliverables.` |
| Right aux | `From a single prototype to a stack that runs every day.` |
| CTA primary | `Start a project` → `/#contact` |
| CTA secondary | `See work` → `#project-showcase` |
| Scroll cue (bottom) | `↓ scroll` (fades out after first 5% of progress) |

## Type System (matches sibling sections)

| Element | Style |
|---|---|
| Headline `<h2>` | `font-family: 'Instrument Serif', serif; font-style: italic; font-size: clamp(64px, 12vw, 220px); line-height: 0.92; letter-spacing: -0.02em;` with the same gradient text-clip used in BrandSection/EditorialHighlightSection (`linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)`). |
| Eyebrow | `text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50` (verbatim from siblings). |
| Aux lines | `text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[400px]` (same cadence as BrandSection right column). |
| CTA primary | `inline-flex items-center gap-3 px-6 py-3 border border-[#94fcff]/40 hover:border-[#94fcff] hover:bg-[#94fcff]/[0.06] transition-colors duration-300 text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]` (verbatim from BrandSection's terminal CTA). |
| CTA secondary | Liquid-glass treatment from the pasted prompt, but `text-[11px] font-mono uppercase tracking-[3px]` to match the primary. Subtle 1px outer ring `rgba(148, 252, 255, 0.10)` on hover/focus. |

## CSS Additions (append to `src/styles/globals.css`)

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0)    40%,
    rgba(255, 255, 255, 0)    60%,
    rgba(255, 255, 255, 0.15) 80%,
    rgba(255, 255, 255, 0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}
.liquid-glass-strong::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0)   40%,
    rgba(255, 255, 255, 0)   60%,
    rgba(255, 255, 255, 0.2) 80%,
    rgba(255, 255, 255, 0.5) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.interlude-title {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-size: clamp(64px, 12vw, 220px);
  line-height: 0.92;
  letter-spacing: -0.02em;
  background: linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  text-align: center;
  user-select: none;
}
```

Note: `interlude-title` is renamed from the prompt's `hero-title` to avoid colliding with NexApex's existing hero in `HeroSection`.

## Rendering Profiles

| Profile | Trigger | Behavior |
|---|---|---|
| **Full** | ≥768px, `prefers-reduced-motion: no-preference` | Capture → canvas → scroll-scrub + pin + parallax. |
| **Lite** | <768px | `<video autoplay muted playsInline loop preload="metadata" poster="...">` plays normally. No pin, no scrub, no capture. Section is `min-h-[100svh]`. Headline shrinks to `clamp(48px, 14vw, 96px)`. Bottom row stacks vertically with `gap-6`. |
| **Static** | `prefers-reduced-motion: reduce` (any width) | Single poster `<img>` (Cloudinary still), centered cover. All text fades reduced to a single `opacity` transition fired once by `IntersectionObserver`. 1px cyan border around the image card to anchor the layout. |

Profile is decided once on mount. The reduced-motion media-query gets a `change` listener that re-mounts into Static if the user enables it mid-session.

## Accessibility

- `<section role="region" aria-label="Interlude — Systems that breathe">`
- Headline is a real `<h2>`, semantic continuation of sibling sections.
- `<video aria-hidden="true">` (decorative).
- `<canvas role="img" aria-label="Animated butterflies and flowers">`
- CTAs use Next.js `<Link>`, keyboard-focusable, with `focus-visible:bg-[#94fcff]/[0.05]` ring (matches BrandSection).
- WCAG AA contrast guaranteed by the z-10 vignette overlay tested against the brightest captured frame.
- No focus traps — pin does not block tab order or page scroll.

## Performance Budget

| Metric | Target | Notes |
|---|---|---|
| Section JS (gzip) | < 8 KB | One client component, no new deps. |
| Video download | ~1.2 MB | Cloudinary auto-encoded. |
| Capture pass wall-clock | ~0.5× video duration | Hidden behind poster + entrance fade. |
| Capture memory peak | < 250 MB | `MAX_WIDTH=960`, cap 150 frames. Frames GC'd on unmount. |
| LCP delta | 0 | Below the fold. |
| CLS | 0 | `200vh` height reserved at mount; canvas dims set before paint. |

## Verification

1. `pnpm build` succeeds, no new TypeScript errors.
2. Dev-server manual: scroll the marketing page from top through `breathe-section`. Capture completes; scrub feels frame-accurate; pin releases cleanly into `02 / IN PRACTICE`.
3. Mobile (375×812 DevTools): Lite profile renders; video autoplays muted; no canvas; no jank.
4. Reduced motion: macOS Settings → Display → Reduce motion → reload. Static profile renders the poster, no animation.
5. Lighthouse on `/`: ≥90 desktop, ≥85 mobile.
6. Playwright follow-up (optional): screenshots at 1920×1080, 768×1024, 375×812.

## Out of Scope (YAGNI)

- No top nav pill ("Gallery / Styles / API / Pricing / Blog").
- No "Sign in" or "Try it free" buttons.
- No inline `LogoMark` SVG.
- No renumbering of downstream section indices (`02.5 / INTERLUDE` used to avoid touching siblings).
- No boomerang autoplay mode (replaced by scroll-scrub per §1 decision).
- No new fonts beyond what's already loaded — Instrument Serif is already in the stack as `var(--font-display)`. The pasted prompt's "Dirtyline" font is **not** added.

## Rollout

Three small commits:

1. `feat(section): add InterstitialBreathe component` — new component + CSS block; not yet rendered.
2. `feat(marketing): slot interlude between Brand and Practice sections` — one-line insertion in `page.tsx`.
3. `polish(seam): blend Interlude unpin into Practice section` — small follow-up to tune the vignette ramp if visual review surfaces a seam.

## Rollback

Remove the one line in `src/app/(marketing)/page.tsx`. The component file becomes inert and unreferenced.
