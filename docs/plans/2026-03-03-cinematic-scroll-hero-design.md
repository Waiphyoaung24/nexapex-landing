# Cinematic Scroll Hero — Integration Design

**Date:** 2026-03-03
**Status:** Approved
**Source:** Codrops cinematic scroll animations (Demo 1 + Demo 2)
**Target:** NexApex Astro landing page

---

## Overview

Integrate a scroll-driven 3D cinematic hero experience into the NexApex landing page. The camera orbits the NexApex 3D logo through 8 branded perspectives with per-character text animations and particle speed line effects. After ~7 viewports of cinematic scroll, the 3D fades out and transitions seamlessly into existing content sections.

## Architecture

### Scroll System: Lenis + ScrollTrigger (unified)

- Lenis provides smooth scrolling globally (already exists in Layout.astro)
- ScrollTrigger reads scroll position from Lenis via `lenis.on('scroll', ScrollTrigger.update)`
- GSAP ticker syncs with Lenis: `gsap.ticker.add((time) => lenis.raf(time * 1000))`
- **No ScrollSmoother needed** — avoids premium plugin and Lenis conflict

### Component Boundary

```
<Layout.astro>                           ← Lenis + ScrollTrigger sync
  <Navbar client:load />                 ← unchanged
  <CinematicHero client:only="react" />  ← NEW: single React island
  <LandingSections client:visible />     ← unchanged
</Layout.astro>
```

`client:only="react"` because Three.js Canvas cannot SSR.

## 3D Scene Composition

### Central Model
- `nexapex_logo.glb` (634KB, recovered from git commit `39ba949`)
- Placed at origin (0, 0, 0)
- Scale tuned to fill viewport

### Lighting Rig (NexApex brand)

| Light | Position | Intensity | Color | Purpose |
|-------|----------|-----------|-------|---------|
| Ambient | — | 0.3 | white | Base fill |
| Directional (key) | (10, 20, 10) | 1.2 | white | Main shadows |
| Directional (fill) | (-10, 10, -10) | 0.5 | white | Shadow softening |
| Point (accent) | (0, 15, 8) | 0.8 | #94fcff (cyan) | Brand glow |
| Point (warm) | (-5, 5, -5) | 0.3 | #b9afbb (mauve) | Subtle warmth |

### Environment
- Fog: `THREE.Fog('#0e1418', 15, 35)` — matches `--color-bg`
- Canvas background: `#0e1418` — seamless with page
- Canvas config: `antialias: true | alpha: false | dpr: [1, 2]`

### Particle Speed Lines (from Demo 1)
- 12 curved line strips orbiting logo at radius ~4
- Invisible at rest (opacity: 0)
- Velocity computed each frame: `currentRotation - lastRotation`
- Opacity scales with speed: `targetOpacity = min(speed * 3, 0.95)`
- Color: `#94fcff` with additive blending

## Camera Keyframes

Total cinematic height: **700vh** (7 viewports). 8 branded perspectives + 1 hidden transition.

| # | Scroll | Title | Subtitle | Position | Camera XYZ | LookAt XYZ |
|---|--------|-------|----------|----------|------------|------------|
| 0 | 0–12% | THE APEX | Of Intelligence | center | (0, 1, 8) | (0, 2, 0) |
| 1 | 12–25% | AI DEVELOPMENT | Custom Solutions, Real Impact | left | (3, 4, 7) | (0, 3, 0) |
| 2 | 25–37% | INFRASTRUCTURE | Built to Scale | right | (-6, 6, 4) | (0, 4, 0) |
| 3 | 37–48% | IMMERSIVE 3D | Experiences That Captivate | top-left | (-5, 8, -2) | (0, 5, 0) |
| 4 | 48–55% | *(hidden)* | — | — | (2, 10, -4) | (0, 5, 0) |
| 5 | 55–67% | INNOVATION | Where Technology Meets Design | center | (5, 8, 5) | (0, 4, 0) |
| 6 | 67–78% | PRECISION | Every Detail Matters | bottom-right | (7, 5, 3) | (0, 3, 0) |
| 7 | 78–88% | NEX APEX | Reach the Peak | top | (4, 10, -6) | (0, 5, 0) |
| 8 | 88–100% | *(transition)* | — | center | (0, 6, 10) | (0, 3, 0) |

All camera tweens use `ease: 'none'` — linear interpolation. Cinematic feel comes from Lenis momentum.

## Text Animation System

### Character Splitting (no SplitText premium plugin)
React-based: render each character as `<span>` elements in a React component.

### Animation Pattern Per Perspective

| Phase | Duration | Effect |
|-------|----------|--------|
| Enter | 0.25 | chars slide `x: -80 → 0`, `opacity: 0 → 1`, stagger `-0.02` |
| Hold | 0.50 | visible, camera moves |
| Exit | 0.25 | chars slide `x: 0 → 80`, `opacity: 1 → 0`, stagger `-0.02` |

### Exceptions
- **Perspective 0:** No enter animation, starts visible, only exits
- **Perspective 7 ("NEX APEX"):** Slower enter, longer hold (brand moment)

### Typography (NexApex brand fonts)
- Title: `font-d` (Nevera → Orbitron), `text-[4vw]`, bold, white
- Subtitle: `font-b` (Nexa → Rajdhani), `text-[1.25vw]`, light, white/70

## Transition to Content

Last 12% of scroll (perspective 8) is the transition zone:

1. 3D canvas opacity: `1 → 0` via GSAP tween
2. Gradient bridge div fades in (`from-bg via-bg to-transparent`)
3. Progress bar fades out
4. ScrollTrigger `onLeave`: canvas set to `display: none` (free GPU)
5. ScrollTrigger `onEnterBack`: canvas restored if user scrolls up
6. Content sections appear naturally — no Lenis handoff needed

## Mobile & Performance

### Tiered Rendering

| Tier | Detection | 3D | Particles | Text |
|------|-----------|-----|-----------|------|
| Desktop | ≥1024px + WebGL2 | Full, dpr [1,2] | 12 lines | per-char |
| Tablet | 768–1024px | Reduced, dpr [1,1.5] | 6 lines | per-char |
| Mobile | <768px | **Static fallback** | none | CSS fadeUp |

### Mobile Fallback
- Logo PNG with `animate-float` effect
- Radial gradient background matching fog
- Scroll height 200vh with opacity-based text transitions
- No WebGL, no GPU cost

### Performance Guardrails
- GLB preload: `useGLTF.preload()` at module level
- GPU cleanup: `display: none` + `dispose()` on unmount
- No premium GSAP plugins (no ScrollSmoother, no SplitText)
- `prefers-reduced-motion`: static hero, 100vh, text visible
- All animation via refs (no React state re-renders)
- `gsap.quickSetter` for progress bar

### Loading Sequence
1. Page loads → Navbar visible, black background
2. GLB loads → loading bar (cyan gradient)
3. Fonts ready → fade in 3D scene
4. Budget: < 2 seconds on fast connection

## File Structure

```
src/components/cinematic/
├── CinematicHero.tsx        ← Main orchestrator
├── NexApexScene.tsx         ← R3F scene (model, lights, fog, particles)
├── AnimatedCamera.tsx       ← PerspectiveCamera driven by refs
├── ParticleLines.tsx        ← Speed line effect (Demo 1 adapted)
├── TextOverlays.tsx         ← Character-split text panels
├── ProgressBar.tsx          ← Cyan gradient bar + counter
├── Loader.tsx               ← Loading overlay
└── scene-data.ts            ← Camera keyframes + brand text

Modified:
├── src/layouts/Layout.astro     ← Lenis + ScrollTrigger sync
├── src/pages/index.astro        ← Swap hero for CinematicHero
└── src/styles/globals.css       ← Cinematic utilities

Restored:
└── public/models/nexapex_logo.glb
```

## Implementation Order

| Step | Task | Depends On |
|------|------|------------|
| 1 | Restore GLB + create `public/models/` | — |
| 2 | Create `scene-data.ts` (keyframes + text) | — |
| 3 | Create `AnimatedCamera.tsx` + `NexApexScene.tsx` | Step 1 |
| 4 | Create `ParticleLines.tsx` (Demo 1 speed lines for R3F) | Step 3 |
| 5 | Create `TextOverlays.tsx` + `ProgressBar.tsx` + `Loader.tsx` | Step 2 |
| 6 | Create `CinematicHero.tsx` (wire everything + GSAP + Lenis) | Steps 3–5 |
| 7 | Modify `Layout.astro` + `index.astro` | Step 6 |
| 8 | Mobile fallback + reduced-motion + perf testing | Step 7 |

## Dependencies

**No new packages needed.** All already installed:
- `gsap` ^3.14.2
- `three` ^0.183.2
- `@react-three/fiber` ^9.5.0
- `@react-three/drei` ^10.7.7
- `lenis` ^1.3.17
