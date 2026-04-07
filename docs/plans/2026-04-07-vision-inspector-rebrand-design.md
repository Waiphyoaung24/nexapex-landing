# Vision Inspector Premium Redesign — Design Doc

**Date:** 2026-04-07
**Branch:** `nexapex-v3-demo`
**Status:** Approved

## Concept: Glass Command Center

Transform the Vision Inspector from a functional tool into an immersive AI command center. Dark OLED base (`#0e1418`) with glass-morphism panels, animated stat counters, glowing bounding boxes, staggered GSAP entrance animations, and a dramatic state machine (upload → analyzing → results) with smooth transitions.

**Memorable moment:** The analyzing state with a scanning line effect + the results reveal where stats count up and detections cascade in from the side.

## Architecture

No structural changes. Same 5 components, same data flow, same API. Only visual + animation changes.

| Component | Changes |
|-----------|---------|
| `VisionInspector.tsx` | GSAP-driven state transitions (upload→loading→results), glass panel wrapper, ambient gradient background |
| `BoundingBoxCanvas.tsx` | Animated box draw-in effect, glow on boxes, pulsing labels, hover highlight |
| `BusinessSuggestionCard.tsx` | Glass-morphism card, refined entrance animation, gradient border |
| `VisionSkeleton.tsx` | Replace with scanning-line animation + progress text, pulsing grid |
| `page.tsx` | Refined hero with subtle gradient mesh background, better breadcrumb styling |

## Visual Spec

### Brand Tokens (unchanged)

| Token | Value |
|-------|-------|
| `--color-nex-cyan` | `#94fcff` |
| `--color-nex-surface` | `#162029` |
| `--color-nex-surface2` | `#1d2d39` |
| `--color-nex-surface3` | `#253a49` |
| `--color-nex-dim` | `#6e7a84` |
| Background | `#0e1418` |
| Display font | Nevera (`--font-display`) |
| Body font | Nexa (`--font-sans`) |

### Glass-Morphism Recipe

```css
.glass-panel {
  background: rgba(22, 32, 41, 0.6);      /* nex-surface at 60% */
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
}

.glass-panel-accent {
  background: rgba(148, 252, 255, 0.03);   /* nex-cyan at 3% */
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 252, 255, 0.12);
  border-radius: 1rem;
}
```

### 1. Upload State

- Glass-morphism dropzone with animated dashed border (CSS `stroke-dashoffset` animation)
- Subtle nex-cyan border glow on hover (`box-shadow: 0 0 20px rgba(148,252,255,0.1)`)
- Sample image cards with hover `scale(1.03)` + glow ring
- Staggered fade-in on mount: GSAP `from({autoAlpha:0, y:20}, {stagger: 0.1, ease:"power2.out"})`
- Upload icon with subtle floating animation (CSS `translateY` keyframe, 3s loop)

### 2. Loading/Analyzing State

- Image preview shown immediately at reduced opacity (0.6)
- Scanning line: CSS gradient animation sweeping top-to-bottom (2s linear infinite)
- Pulsing "Analyzing..." text with animated ellipsis (CSS)
- Skeleton stat cards: shimmer effect using CSS gradient translate
- Radial gradient pulse behind image container (CSS keyframe, subtle)

### 3. Results State

**Stats counter animation:**
- GSAP tween on each stat number from 0 to final value
- Duration: 1.2s, ease: `power2.out`
- Stagger: 0.15s between the 3 stat cards

**Detection list:**
- Items stagger in: `from({x:30, autoAlpha:0}, {stagger:0.08, ease:"power2.out"})`
- Confidence bars animate width from 0 to final value (GSAP, 0.6s each, staggered)
- Hover on detection item: subtle highlight + corresponding bounding box glow on canvas

**Bounding box canvas:**
- Boxes draw-in sequentially (canvas animation using requestAnimationFrame)
- Each box: stroke draws from 0 to full perimeter, then label fades in
- Box glow: `shadowBlur: 8, shadowColor` matching the class color
- Total draw-in duration: ~1.5s for all boxes

**Business suggestion card:**
- Glass-morphism with gradient border (animated `border-image` or pseudo-element)
- Entrance: GSAP `fromTo({autoAlpha:0, y:30, scale:0.97}, {autoAlpha:1, y:0, scale:1})` at 1.5s delay
- CTA button: subtle glow pulse on idle (CSS keyframe)

### 4. Page-Level (`page.tsx`)

- Ambient gradient mesh background: fixed-position radial gradients (nex-cyan at 2-3% opacity) placed asymmetrically
- Breadcrumb: refined with glass-morphism bar background
- Hero section: tighter spacing, icon with glow ring

## Animations Summary

| Animation | Tech | Duration | Trigger |
|-----------|------|----------|---------|
| Upload stagger-in | GSAP useGSAP | 0.5s + 0.1 stagger | Mount |
| Dropzone border pulse | CSS keyframe | 3s infinite | Idle |
| Upload icon float | CSS keyframe | 3s infinite | Idle |
| Scan line sweep | CSS gradient | 2s infinite | Loading state |
| Skeleton shimmer | CSS gradient | 1.5s infinite | Loading state |
| Stat counter | GSAP tween | 1.2s | Results mount |
| Detection list | GSAP stagger | 0.5s + 0.08 stagger | Results mount |
| Confidence bars | GSAP width | 0.6s staggered | Results mount |
| Bounding box draw | Canvas rAF | 1.5s total | Results mount |
| Suggestion card | GSAP fromTo | 0.7s at 1.5s delay | Results mount |
| CTA glow | CSS keyframe | 2s infinite | Idle |

All animations respect `prefers-reduced-motion: reduce` — skip to final state with `gsap.set()` or `animation: none`.

## Constraints

- No structural/API changes — same component files, same data flow
- No new dependencies (GSAP + useGSAP already installed)
- Brand tokens unchanged
- WCAG AA contrast on all text
- Responsive: 375px, 768px, 1024px, 1440px
- No layout shift during animations (use `autoAlpha` not `opacity` + `visibility`)
- Canvas bounding box draw must not block main thread

## Checklist

- [ ] No emojis as icons (Lucide SVGs)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover transitions 150-300ms
- [ ] `prefers-reduced-motion` respected
- [ ] Focus-visible states on all interactive elements
- [ ] Responsive at all breakpoints
- [ ] No horizontal scroll on mobile
- [ ] Glass panels readable over gradient background
