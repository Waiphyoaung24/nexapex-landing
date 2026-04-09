# Particle Network WebGL Background — Design

**Date:** 2026-04-10
**Status:** Approved (brainstorming)
**Scope:** NexApex marketing page (`src/app/(marketing)`)

## Problem

NexApex's marketing page currently uses a Spline iframe as the hero visual ("3D tiles") and a pinned `ThreeShowcase` section that renders a GLTF space-station model. The user wants to replace those with the WebGL particle-network background from the `dbctech-site` project, keep the `BallClump` "bubbles" component, and have the camera motion driven by page scroll — all smoothly synchronized with GSAP ScrollSmoother.

## Goals

1. Global fixed WebGL background behind every section of the marketing page.
2. Camera motion driven by scroll progress, not by time — visually "locked" to the user's scroll position.
3. **Smooth** in three senses:
   - Scroll input is smoothed (already handled by ScrollSmoother)
   - Scroll-progress → camera-target is lerped, frame-rate-independent
   - Particle positions evolve continuously (no per-frame discontinuities)
4. Remove the Spline iframe ("3D tiles") from Hero and the `ThreeShowcase` ("space") section from the page.
5. Keep the `BallClump` bubbles component and mount it in the slot vacated by `ThreeShowcase`.

## Non-goals

- Bloom / post-processing on the background canvas. (The source uses selective bloom; it's expensive and not needed for a background. Deferrable.)
- Mouse-reactive particle trails (source has this; out of scope for v1).
- Porting the dbctech splash screen, nav, or cursor modules.
- Adding Lenis — NexApex uses GSAP ScrollSmoother, which already covers smooth scroll.

## Architectural decision: port to React Three Fiber

The source is vanilla three.js with an imperative render loop. NexApex is React 19 + R3F + `@gsap/react` + ScrollSmoother. Pasting vanilla three.js into Next.js would introduce a second render loop, conflict with R3F's `useFrame` scheduler, and bypass the type-safety the rest of the codebase relies on.

**Chosen approach:** port the particle scene to R3F. Shaders are copied verbatim; the JS-side logic (buffer attribute updates, O(n²) connection recompute) becomes a single `useFrame` callback.

## Components & file layout

### New files

| Path | Purpose |
|---|---|
| `src/components/ParticleNetworkBackground.tsx` | Client component. Fixed-position `<Canvas>` mounted once at layout level, `z-index: -10`, `pointer-events-none`. Wraps `<ParticleNetwork />` (scene) + `<ScrollCameraRig />` (camera controller). |
| `src/lib/particle-shaders.ts` | Exports `PARTICLE_VERT` and `PARTICLE_FRAG` as template-literal strings, ported verbatim from `dbctech-site/src/shaders/particles.{vert,frag}.glsl`. Avoids needing a `?raw` webpack loader. |
| `src/lib/scroll-state.ts` | Module-level singleton `{ progress: 0, smoothedProgress: 0 }`. Mirrors the pattern already used in `ThreeShowcase.tsx`. Readers inside `useFrame` lerp `smoothedProgress` toward `progress`. |

### Modified files

| Path | Change |
|---|---|
| `src/app/(marketing)/layout.tsx` | Import and mount `<ParticleNetworkBackground />` inside `<body>`, *outside* `<SmoothScrollProvider>` children wrapper. Render it as a fixed layer so ScrollSmoother's transform on `#smooth-content` doesn't move it. |
| `src/app/(marketing)/page.tsx` | Remove `<ThreeShowcase />` and its wrapper `<div id="three-showcase" style={{ marginBottom: '-100vh' }}>`. Replace with `<BallClumpSection />` in the same slot (between `<HeroSection />` and the first `<PageSlideSection>`). Remove `ThreeShowcase` import. |
| `src/components/HeroSection.tsx` | Delete `SplineEmbed` function, `SPLINE_EMBED_URL`, the `<SplineEmbed url=...>` usage, and any now-unused imports (`useState`, `useEffect` if unused elsewhere). Keep the copy/layout/cross-markers. Background becomes transparent so the global particle canvas shows through. |
| `src/components/BallClump.tsx` | Make the `<Canvas>` background transparent (`gl={{ alpha: true }}`, `<color attach="background"...>` removed or set to transparent) so the particle network is visible behind the bubbles. Confirm `BallClumpSection` wraps correctly in the page's scroll flow. |

### Files left in place (dead but not deleted)

- `src/components/ThreeShowcase.tsx`
- `src/components/SpaceStation.tsx`
- `src/components/AstronautScene.tsx`

Left untouched so the diff is small and reversible. A follow-up PR can delete them after the visual change is approved in review.

## Data flow

```
window scroll
    │
    ▼
GSAP ScrollSmoother (#smooth-wrapper → #smooth-content, smooth: 2)
    │  normalizes + smooths raw scroll
    ▼
ScrollTrigger ({ trigger: body, start: 'top top', end: 'bottom bottom', scrub: 1.5 })
    │  onUpdate: (self) => scrollState.progress = self.progress
    ▼
scrollState (module singleton, { progress, smoothedProgress })
    │
    ▼
<ScrollCameraRig /> useFrame(delta):
    │  smoothedProgress += (progress - smoothedProgress) * (1 - exp(-6 * delta))
    │  camera.position.lerp(targetFromProgress, 1 - exp(-4 * delta))
    │  camera.rotation.y  lerp toward target
    ▼
<ParticleNetwork /> useFrame:
    │  updates BufferAttribute positions (same math as dbctech/particles.js)
    │  recomputes O(n²) line connections
    │  uniforms.uTime.value += delta
    ▼
<Canvas> render
```

Two layers of smoothing: ScrollSmoother handles input jitter; the frame-rate-independent `1 - exp(-k * delta)` lerps handle target-seeking without a fixed-timestep assumption. This is the same pattern `ThreeShowcase.tsx` already uses (`lerpFactor = 1 - Math.exp(-4 * delta)`), so the feel will match the rest of the site.

## Camera keyframes (scroll-driven)

Whole-page progress (0 → 1) drives a 3-segment curve, loosely based on dbctech's three scroll triggers:

| Progress | camera.position | camera.rotation.y |
|---|---|---|
| 0.00 | (0, 0, 5)      | 0     |
| 0.33 | (0, -0.3, 6.5) | 0     |
| 0.66 | (0, -0.45, 7)  | 0.15  |
| 1.00 | (0, -0.6, 7)   | 0     |

Interpolation between keyframes uses smoothstep (`f * f * (3 - 2*f)`), then the whole target is lerped toward the camera with frame-rate-independent damping. This matches `ThreeShowcase.tsx`'s `VIEWS` pattern.

## Particle system spec (verbatim from source, with tuning hooks)

- `SPREAD = 8` (world units), same as source
- `CONNECT_DISTANCE = 1.8`, same as source
- Particle count tiered:
  - desktop (`window.innerWidth >= 1024`): **90** particles
  - tablet (`>= 640`): **45**
  - mobile: **20** (or `0` + disable the O(n²) pass if `prefers-reduced-motion` or `devicePixelRatio < 1.5 && innerWidth < 640`)
- `dpr={[1, 2]}`
- `gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}`
- `ShaderMaterial` with `AdditiveBlending`, `depthWrite: false`, `transparent: true`
- Line connections: `LineSegments` with `LineBasicMaterial({ color: 0x94fcff, transparent: true, opacity: 0.25, blending: AdditiveBlending, depthWrite: false })`

**Color change:** source uses teal `#0D9488`. NexApex's accent is `#94fcff` (see `ThreeShowcase.tsx` annotations, BrandSection divider). Use `#94fcff` for the line color to match NexApex branding.

## SSR & hydration

- `ParticleNetworkBackground.tsx` is `"use client"`.
- `<Canvas>` only renders after mount; no hydration mismatch because the wrapper div is empty on the server and identical on the client.
- Mounted in `layout.tsx` *before* `<SmoothScrollProvider>` children but as a sibling positioned `fixed inset-0 -z-10`. ScrollSmoother transforms `#smooth-content`, so a fixed element outside `#smooth-content` is unaffected.

## Smoothness requirements (addressing "pls make it smooth")

1. **Scroll input:** already smoothed by ScrollSmoother `smooth: 2`.
2. **ScrollTrigger → state:** `scrub: 1.5` (matches dbctech's feel) — this is GSAP's own tween-to-progress smoothing.
3. **State → camera:** frame-rate-independent lerp `k = 1 - Math.exp(-4 * delta)` applied separately to `camera.position`, `camera.rotation.y`, and `smoothedProgress`.
4. **Keyframe interpolation:** smoothstep `f*f*(3-2f)` between adjacent keyframes.
5. **Particle velocities:** continuous; wrap-around uses `if (p > h) p = -h` (same as source). Discontinuity at wrap is imperceptible because connections are recomputed each frame — a wrapping particle just reassigns its neighbors.
6. **Reduced motion:** if `prefers-reduced-motion: reduce`, lock `smoothedProgress = 0`, freeze particles (skip velocity update), keep the visual static.

## Risks

| Risk | Mitigation |
|---|---|
| Multiple `<Canvas>` instances (Background + BallClump) — 2 WebGL contexts | 2 contexts is well within mobile limits (mobile Safari allows ~8); acceptable. Monitor with DevTools on real device. |
| O(n²) line updates at 90 particles = 4050 distance checks/frame | Profiled in source; fine at 60fps on modern desktop. On mobile, count drops to 20 → 190 checks. |
| GLSL shader compile error on exotic mobile GPUs | Shaders are minimal (no `#extension` directives); test on iOS Safari + Android Chrome before merge. |
| ScrollSmoother's `normalizeScroll: true` + multiple fixed canvases can cause touch-scroll hiccups on iOS | Set `touch-action: none` on the canvas wrapper; ScrollSmoother already handles normalization. |
| Removed files (`ThreeShowcase`, `SpaceStation`, etc.) still imported somewhere | Grep before committing: `ThreeShowcase|SpaceStationModel|AstronautScene` must return zero hits outside the files themselves. |

## Testing strategy

1. **Type-check:** `npm run typecheck` — must pass.
2. **Build:** `npm run build` — must succeed, no warnings about missing shaders.
3. **Visual smoke test:** `npm run dev`, load `/`, scroll top to bottom, confirm:
   - Particle network visible behind every section (Hero, BallClump, Brand, Clients, Portfolio, Capabilities, CTA, Footer)
   - No Spline iframe flash
   - No ThreeShowcase pin
   - Camera motion is continuous (no jumps at section boundaries)
   - BallClump bubbles render with particle network visible behind them
4. **Reduced motion:** enable OS "reduce motion", reload, confirm particles freeze and camera stays at keyframe 0.
5. **Mobile check:** Chrome DevTools device emulation at 375×667, confirm particle count drops and framerate stays ≥ 30fps.

## Out of scope (follow-ups)

- Deleting the orphaned `ThreeShowcase.tsx` / `SpaceStation.tsx` / `AstronautScene.tsx` files
- Adding selective bloom (source has it; can be layered via `@react-three/postprocessing` later)
- Mouse parallax / cursor-reactive particle repulsion
- Particle count auto-tuning via an FPS monitor (source has `Device.monitorFPS`)
