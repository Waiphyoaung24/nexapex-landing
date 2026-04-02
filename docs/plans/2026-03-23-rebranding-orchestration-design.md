# Rebranding Orchestration Design

**Date**: 2026-03-23
**Branch**: `rebranding-nexapex`
**Status**: Approved (v2 — updated from brainstorm session)

## Decision Summary

Rebranding the NexApex website with a scroll-driven 3D spacestation model (orbital sunrise lighting, scroll-scrubbed GLB animations) and full UI polish, orchestrated via a Command → Agent → Skill sequential pipeline.

## Brainstorm Decisions

1. **Visual mood**: Orbital sunrise — warm-cool contrast with golden rim lighting meeting cool blue shadows
2. **Color palette**: Keep existing brand colors unchanged (`#0e1418` bg, `#94fcff` cyan, `#c63518` red CTA). Sunrise mood comes from 3D scene lighting only.
3. **Scroll behavior**: Scroll-scrub the GLB model's 3 embedded AnimationClips (Approach A). Each clip maps to ~33% of hero scroll range. Gentle auto-rotate between scroll stops. No major camera movement.
4. **Mobile**: Keep existing fallback — no 3D, text overlays + GSAP pin. Unchanged.
5. **UI scope**: Full polish on all listed components — Navbar, Footer, LandingSections, ProductSlider, ScrollRevealGrid, text-overlays. Refine transitions, hover states, spacing, legibility.

## Architecture

**Pattern**: Sequential Pipeline (Approach A — scroll-scrubbed model animations)
**Models**: All Opus
**Flow**: `/rebrand` → brainstorm → `rebrand-3d-agent` → `rebrand-ui-agent` → `rebrand-review-agent` → summary

## 3D Scene — SpaceStation3D.tsx

### Renderer
- `THREE.WebGLRenderer` with `antialias: true`, `alpha: true`
- `ACESFilmicToneMapping`, exposure ~1.0
- `outputColorSpace = THREE.SRGBColorSpace`
- Canvas: `position: fixed`, fills viewport, `z-index: 0`

### Scene
- Background: `#0e1418` (existing `--color-bg`)
- Fog: `THREE.Fog('#0e1418', 15, 50)`

### Lighting (orbital sunrise)
- `DirectionalLight` warm gold (`#FDB813`, intensity ~2) — "sun" rim light
- `HemisphereLight` cool sky (`#1a2630`) / warm ground (`#2a1a0a`, intensity ~0.4)
- `AmbientLight` dim (`#94fcff`, intensity ~0.15) — brand cyan fill
- HDR environment map for metallic reflections

### Model & Animation
- `GLTFLoader` loads `/models/spacestation_brand.glb`
- Extract `gltf.animations` (3 clips)
- `THREE.AnimationMixer` with all 3 clips set to `paused = true`, `clampWhenFinished = true`
- GSAP `ScrollTrigger` scrubs each clip's `.time` across its scroll segment
- `THREE.MathUtils.lerp` for smooth interpolation
- Gentle Y-axis auto-rotate (~0.001 rad/frame)

### Camera
- `PerspectiveCamera` FOV 45, framing full model
- Subtle sine-based drift on x/y for organic feel
- No major camera movement — model animations are the star

### Performance
- Desktop only — returns `null` if `window.innerWidth < 768` or no WebGL2
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`
- `frustumCulled = true`

### Cleanup
- `useEffect` return: dispose renderer, geometry, materials, textures
- Cancel `requestAnimationFrame`
- Remove resize listener and ScrollTrigger

## Integration — CinematicHero & Logo3D

- **Delete** `src/components/Logo3D.astro`
- **CinematicHero.astro**: Import `SpaceStation3D.tsx` as `client:only="react"`, replace cinematic-engine particle system on desktop
- **Mobile**: Unchanged — text-overlay + GSAP pin fallback
- **Tablet**: Follow desktop (render SpaceStation3D if WebGL2)
- **Reduced motion**: Unchanged — static logo image
- **Loader**: Keep it, tie to GLB load progress via `THREE.LoadingManager`
- **scroll-animations.ts**: Hero scroll logic moves into SpaceStation3D.tsx. Section reveals below hero stay.
- **text-overlays.ts**: Adjust shadows/gradients for legibility over orbital sunrise lighting

## UI Polish — All Components

**Guiding principle**: No color palette changes. Refine transitions, hover states, spacing, visual consistency.

- **globals.css**: Refine animation easing. Ensure `prefers-reduced-motion` coverage.
- **Navbar.astro**: Refine backdrop blur + transparency over 3D scene. Polish hover transitions.
- **Footer.astro**: Polish glow border, link hovers, social icon transitions, spacing.
- **LandingSections.astro**: Refine section transitions, card hovers, stagger timing, CTA button states.
- **ProductSlider.astro**: Refine card surfaces, hover glow, border transitions, active indicators.
- **ScrollRevealGrid.astro**: Polish center-to-mosaic transition, image reveal stagger.
- **text-overlays.ts**: Stronger text shadows/gradient backing for legibility over 3D.

## Review & Validation

- `npm run build` — zero errors
- Playwright screenshots: 1920x1080, 768x1024, 375x812
- Pages: `/` and `/work/hospitality-ai`
- Checklist: 3D renders, scroll animations work, no layout overflow, text legible, mobile fallback works, Three.js cleanup correct, no console.log, TypeScript clean, WCAG AA contrast, prefers-reduced-motion respected

## Skill Mapping

### Local Skills (preloaded)

| Skill | Agent |
|-------|-------|
| `3d-web` | rebrand-3d-agent |
| `threejs-fundamentals` | rebrand-3d-agent |
| `threejs-loaders` | rebrand-3d-agent |
| `threejs-materials` | rebrand-3d-agent |
| `threejs-lighting` | rebrand-3d-agent |
| `threejs-animation` | rebrand-3d-agent |
| `threejs-interaction` | rebrand-3d-agent |
| `threejs-geometry` | rebrand-3d-agent |
| `threejs-textures` | rebrand-3d-agent |
| `threejs-shaders` | rebrand-3d-agent |
| `threejs-postprocessing` | rebrand-3d-agent |
| `frontend-design` | rebrand-ui-agent |
| `react-expert` | rebrand-ui-agent |
| `taste-skill` | rebrand-ui-agent |
| `soft-skill` | rebrand-ui-agent |
| `redesign-skill` | rebrand-ui-agent |
| `coding-standards` | rebrand-ui-agent, rebrand-review-agent |
| `playwright-skill` | rebrand-review-agent |
| `code-reviewer` | rebrand-review-agent |

### Plugin Skills (via Skill tool)

| Skill | Invoked By |
|-------|-----------|
| `superpowers:brainstorming` | `/rebrand` command |
| `ui-ux-pro-max:ui-ux-pro-max` | rebrand-ui-agent |
| `superpowers:verification-before-completion` | rebrand-review-agent |

## Key Files

| File | Action |
|------|--------|
| `src/components/Logo3D.astro` | DELETE |
| `src/components/SpaceStation3D.tsx` | CREATE — scroll-driven 3D React component |
| `src/components/cinematic/CinematicHero.astro` | MODIFY — integrate SpaceStation3D |
| `src/components/cinematic/scroll-animations.ts` | MODIFY — remove hero scroll, keep section reveals |
| `src/components/cinematic/text-overlays.ts` | MODIFY — legibility adjustments |
| `src/styles/globals.css` | MODIFY — refine easing, no color changes |
| `src/components/Navbar.astro` | MODIFY — polish |
| `src/components/Footer.astro` | MODIFY — polish |
| `src/components/LandingSections.astro` | MODIFY — polish |
| `src/components/ProductSlider.astro` | MODIFY — polish |
| `src/components/ScrollRevealGrid.astro` | MODIFY — polish |
