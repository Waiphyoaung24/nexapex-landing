# NexApex Morphing Particle Scene — Design Spec

**Date:** 2026-05-13
**Branch:** `nexapex-v3-demo`
**Status:** approved

## Goal

Replace the global `ParticleNetworkBackground` orb on marketing pages with a scroll-scrubbed Three.js particle scene that morphs between brand-supplied .glb shapes. Pair it with a centered, GSAP-driven title that crossfades per morph segment.

## Architecture

Engine ported from `https://github.com/aleks-webdev/threejs-particle-morphing` into `src/lib/particle-morph/` as plain ES modules. A React wrapper (`ParticleMorphScene.tsx`) instantiates the engine inside a fixed full-viewport canvas, drives morph progress from scroll, and tears down on unmount. Mounted globally in `src/app/(marketing)/layout.tsx` so the canvas persists across scrolls.

## File Layout

```
src/
├── components/
│   ├── ParticleMorphScene.tsx        NEW
│   ├── MorphingHeroText.tsx          NEW
│   └── HeroSection.tsx               EDIT (add MorphingHeroText)
├── lib/particle-morph/
│   ├── index.ts                      Engine entry class
│   ├── Scene.ts
│   ├── Particles.ts
│   ├── AssetsLoader.ts               (DRACO baked in)
│   ├── Config.ts                     NexApex palette
│   ├── assets.ts                     Single source of truth for morphs
│   ├── CustomMeshSurfaceSampler.ts
│   ├── utils.ts
│   └── shaders/*.glsl
└── app/(marketing)/layout.tsx        EDIT (swap component)

public/models/                         NEW (user-supplied .glb files)
```

Delete: `src/components/ParticleNetworkBackground.tsx` (and any imports).

## Data Flow

1. **Mount** — `ParticleMorphScene` dynamic-imports engine, AssetsLoader fetches glbs (DRACO-aware) + texture.
2. **onAssetsLoad** — build MeshSurfaceSamplers, fill morph buffers.
3. **Entry timeline** — GSAP scatters→assembles particles into morph[0] over 1.5s (`expo.out`), in sync with SplitText reveal of MorphingHeroText title[0].
4. **Scroll** — ScrollTrigger (Lenis-driven) maps body scroll progress across N morph segments, calls `engine.setMorphProgress(segmentIndex, localProgress)` updating shader uniforms.
5. **Segment change** — MorphingHeroText crossfades old title out + new in (0.6s).
6. **Past hero range** — particles drop to 0.2 opacity ambient, text hides, page content takes over.

## Brand Tokens (strict)

| Token | Value | Use |
|---|---|---|
| `--color-nex-background` | `#0e1418` | canvas clear |
| `--color-nex-cyan` | `#94fcff` | primary dot |
| `--color-nex-red` | `#c63518` | accent gradient |
| `--color-nex-sage` | `#dfe4dc` | highlight |
| `--color-nex-teal` | `#1a2630` | dot shadow |
| `--color-nex-text` | `#c8ccc6` | morphing title |
| `var(--font-display)` | — | title, uppercase, `tracking-[-0.02em]` |

## GSAP Plan

- Entry: `gsap.timeline({ defaults: { ease: 'expo.out' } })` driving `u_morph` 1→0 and `splitTitle.chars` reveal.
- Scroll: `ScrollTrigger.create({ trigger: 'body', scrub: 1, onUpdate })` calling engine setter.
- Title crossfade per segment: `gsap.fromTo(newTitle, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6 })`.
- Lenis ↔ ScrollTrigger: `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t*1000))`.
- `prefers-reduced-motion`: skip entry timeline, snap to final state, disable scrubbed morphs.

## Glb Swap Workflow (for future user-supplied models)

Single file: `src/lib/particle-morph/assets.ts`. To add a new shape:
1. Drop `myShape.glb` into `public/models/`.
2. Add asset entry `{ obj: '/models/myShape.glb', name: 'myShape', type: model, loader: gltfLoader }`.
3. Add a `case 'myShape':` in `resolveObj` returning the inner mesh (auto-fallback traverses for first Mesh).
4. Add `'myShape'` to the exported `MORPH_SEQUENCE` array.

Top-of-file comment in `assets.ts` documents this.

## Out of Scope

- No post-processing (OldFilmPass excluded for brand minimalism).
- No dat.gui debug panel in production.
- No changes to `SpaceStation`, `AstronautScene`, `ThreeShowcase`, product pages, footer, navbar.

## Performance Targets

- Engine dynamic-imported (~600KB deferred behind first paint).
- Marketing Lighthouse > 90.
- Reduced motion respected.

## Risks

1. Bundle size — mitigated by dynamic import + tree-shaken three imports.
2. DRACO decoder served from `gstatic.com` CDN (self-host swap is a 1-liner).
3. Removing `ParticleNetworkBackground` — `grep` first to confirm no other importers.
