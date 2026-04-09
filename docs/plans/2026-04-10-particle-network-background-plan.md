# Particle Network Background Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the NexApex marketing page background with a scroll-driven WebGL particle network ported from dbctech-site, remove the Spline "3D tiles" and the `ThreeShowcase` "space" section, and mount `BallClumpSection` in the vacated slot.

**Architecture:** New client component `ParticleNetworkBackground` renders a fixed, full-viewport R3F `<Canvas>` at `z-index: -10` inside the marketing layout (outside `#smooth-content` so ScrollSmoother's transform doesn't move it). A single `ScrollTrigger` writes whole-page progress into a module singleton; inside the canvas, `useFrame` lerps camera keyframes frame-rate-independently. Shaders are inlined as template-literal strings to avoid a `?raw` webpack loader.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@react-three/fiber`, `three`, `gsap` + `@gsap/react`, GSAP ScrollSmoother (already configured), Tailwind v4.

**Design doc:** `docs/plans/2026-04-10-particle-network-background-design.md`

---

## Preconditions

- Working from branch `nexapex-v3-demo` at commit `171af04` (design doc committed).
- Design has been read and approved.
- Node 22+, `npm install` already run.

## Task 1: Create the shader strings module

**Files:**
- Create: `src/lib/particle-shaders.ts`

**Step 1: Write the file**

```typescript
/**
 * GLSL shaders for the particle network background.
 * Ported verbatim from dbctech-site/src/shaders/particles.{vert,frag}.glsl,
 * with the fragment color tuned to NexApex's accent (#94fcff) instead of
 * the dbctech teal (#0D9488).
 */

export const PARTICLE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute float aSize;
  attribute float aPhase;

  varying float vDistance;
  varying float vPhase;

  void main() {
    vec3 pos = position;

    // Organic drift from per-particle phase
    pos.x += sin(uTime * 0.4 + aPhase * 2.1) * 0.08;
    pos.y += cos(uTime * 0.35 + aPhase * 1.7) * 0.08;
    pos.z += sin(uTime * 0.3 + aPhase * 2.5) * 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDistance = -mvPosition.z;
    vPhase = aPhase;

    gl_PointSize = uSize * aSize * uPixelRatio * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const PARTICLE_FRAG = /* glsl */ `
  uniform float uTime;

  varying float vDistance;
  varying float vPhase;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core  = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow  = 1.0 - smoothstep(0.1, 0.5, dist);
    float alpha = core * 0.8 + glow * 0.15;

    float pulse = 0.9 + 0.1 * sin(uTime * 0.8 + vPhase * 6.28);
    alpha *= pulse;

    alpha *= clamp(1.0 - vDistance * 0.06, 0.1, 1.0);

    // NexApex accent #94fcff = rgb(148, 252, 255) → (0.580, 0.988, 1.0)
    float lum  = 0.75 + 0.25 * sin(vPhase * 6.28);
    vec3 accent = vec3(0.580, 0.988, 1.0) * lum;
    vec3 deep   = vec3(0.102, 0.431, 0.741);
    vec3 color  = mix(accent, deep, vPhase * 0.3);

    gl_FragColor = vec4(color, alpha * 0.7);
  }
`;
```

**Step 2: Typecheck**

```bash
cd "C:/Users/wai19/Desktop/Projects/AI-Tools/Nexus_AI_Lab(Project)/NexApex-web/nexapex" && npm run typecheck
```
Expected: exits 0, no errors about the new file.

**Step 3: Commit**

```bash
git add src/lib/particle-shaders.ts
git commit -m "feat: particle network shader strings"
```

---

## Task 2: Create the scroll-state singleton

**Files:**
- Create: `src/lib/scroll-state.ts`

**Step 1: Write the file**

```typescript
/**
 * Module-level scroll state shared between the ScrollTrigger that reads
 * the scroll position and R3F useFrame hooks that consume it.
 *
 * `progress` is the raw value written by ScrollTrigger.
 * `smoothedProgress` is lerped toward `progress` inside useFrame using a
 * frame-rate-independent damping factor `1 - exp(-k * delta)`.
 *
 * This mirrors the pattern used in components/ThreeShowcase.tsx.
 */
export const particleScrollState = {
  progress: 0,
  smoothedProgress: 0,
};
```

**Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add src/lib/scroll-state.ts
git commit -m "feat: scroll-state singleton for particle camera rig"
```

---

## Task 3: Create the ParticleNetworkBackground component

**Files:**
- Create: `src/components/ParticleNetworkBackground.tsx`

**Step 1: Write the file**

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARTICLE_VERT, PARTICLE_FRAG } from "@/lib/particle-shaders";
import { particleScrollState } from "@/lib/scroll-state";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const SPREAD = 8;
const CONNECT_DISTANCE = 1.8;
const LINE_COLOR = 0x94fcff;

/** Device-tiered particle count. */
function getParticleCount(): number {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 30;
  const w = window.innerWidth;
  if (w >= 1024) return 90;
  if (w >= 640) return 45;
  return 20;
}

/** Camera keyframes keyed to whole-page scroll progress. */
const VIEWS = [
  { pos: new THREE.Vector3(0,  0.00, 5.0), rotY: 0.00 }, // 0.00
  { pos: new THREE.Vector3(0, -0.30, 6.5), rotY: 0.00 }, // 0.33
  { pos: new THREE.Vector3(0, -0.45, 7.0), rotY: 0.15 }, // 0.66
  { pos: new THREE.Vector3(0, -0.60, 7.0), rotY: 0.00 }, // 1.00
] as const;

function ParticleNetwork({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Build geometries/materials once per `count` change.
  const { geometry, material, lineGeometry, lineMaterial } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phase = new Float32Array(count);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 0.4;
      sizes[i] = 0.6 + Math.random() * 0.8;
      phase[i] = Math.random() * Math.PI * 2;
      vel[i * 3]     = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    velocitiesRef.current = vel;

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase",   new THREE.BufferAttribute(phase, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize:       { value: 0.6 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Allocate maxLines = count * 3 segments (well above typical usage).
    const maxLines = count * 3;
    const lineVerts = new Float32Array(maxLines * 2 * 3);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lineVerts, 3));
    lg.setDrawRange(0, 0);

    const lm = new THREE.LineBasicMaterial({
      color: LINE_COLOR,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: g, material: m, lineGeometry: lg, lineMaterial: lm };
  }, [count]);

  // Free GPU resources on unmount / count change.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [geometry, material, lineGeometry, lineMaterial]);

  useFrame((_, delta) => {
    if (count === 0) return;
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const vel = velocitiesRef.current;
    if (!vel) return;

    // Advance uTime regardless of reduced motion — lets the fragment pulse subtly.
    material.uniforms.uTime.value += delta;

    if (!reducedMotion) {
      const h = SPREAD / 2;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3]     += vel[i3];
        pos[i3 + 1] += vel[i3 + 1];
        pos[i3 + 2] += vel[i3 + 2];

        if (pos[i3]     >  h)       pos[i3]     = -h;
        if (pos[i3]     < -h)       pos[i3]     =  h;
        if (pos[i3 + 1] >  h * 0.6) pos[i3 + 1] = -h * 0.6;
        if (pos[i3 + 1] < -h * 0.6) pos[i3 + 1] =  h * 0.6;
        if (pos[i3 + 2] >  h * 0.4) pos[i3 + 2] = -h * 0.4;
        if (pos[i3 + 2] < -h * 0.4) pos[i3 + 2] =  h * 0.4;
      }
      posAttr.needsUpdate = true;
    }

    // Recompute connections (O(n²); fine at n ≤ 90).
    const lineAttr = lineGeometry.getAttribute("position") as THREE.BufferAttribute;
    const linePos = lineAttr.array as Float32Array;
    const maxSegments = Math.floor(linePos.length / 6);
    let segIndex = 0;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pos[i * 3]     - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECT_DISTANCE && segIndex < maxSegments) {
          const base = segIndex * 6;
          linePos[base]     = pos[i * 3];
          linePos[base + 1] = pos[i * 3 + 1];
          linePos[base + 2] = pos[i * 3 + 2];
          linePos[base + 3] = pos[j * 3];
          linePos[base + 4] = pos[j * 3 + 1];
          linePos[base + 5] = pos[j * 3 + 2];
          segIndex++;
        }
      }
    }
    lineGeometry.setDrawRange(0, segIndex * 2);
    lineAttr.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={material} />
      <lineSegments ref={linesRef} geometry={lineGeometry} material={lineMaterial} />
    </>
  );
}

function ScrollCameraRig() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3().copy(VIEWS[0].pos));
  const targetRotY = useRef(VIEWS[0].rotY);

  useFrame((_, delta) => {
    const p = particleScrollState.progress;

    // Damp the smoothed progress toward the raw one.
    const pK = 1 - Math.exp(-6 * delta);
    particleScrollState.smoothedProgress +=
      (p - particleScrollState.smoothedProgress) * pK;
    const sp = particleScrollState.smoothedProgress;

    // Keyframe interpolation: find segment.
    const segCount = VIEWS.length - 1;
    const seg = Math.min(sp * segCount, segCount - 0.001);
    const i = Math.floor(seg);
    const f = seg - i;
    const ease = f * f * (3 - 2 * f); // smoothstep

    const from = VIEWS[i];
    const to = VIEWS[Math.min(i + 1, VIEWS.length - 1)];

    targetPos.current.set(
      from.pos.x + (to.pos.x - from.pos.x) * ease,
      from.pos.y + (to.pos.y - from.pos.y) * ease,
      from.pos.z + (to.pos.z - from.pos.z) * ease,
    );
    targetRotY.current = from.rotY + (to.rotY - from.rotY) * ease;

    const camK = 1 - Math.exp(-4 * delta);
    camera.position.lerp(targetPos.current, camK);
    camera.rotation.y += (targetRotY.current - camera.rotation.y) * camK;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function ParticleNetworkBackground() {
  const countRef = useRef(getParticleCount());

  // Wire a single ScrollTrigger to feed whole-page progress into state.
  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        particleScrollState.progress = self.progress;
      },
    });
    return () => {
      st.kill();
      particleScrollState.progress = 0;
      particleScrollState.smoothedProgress = 0;
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ touchAction: "none" }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 100 }}
      >
        <ParticleNetwork count={countRef.current} />
        <ScrollCameraRig />
      </Canvas>
    </div>
  );
}
```

**Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0. If it fails on `useGSAP` return type, change the hook to a bare `useEffect` that creates+kills the ScrollTrigger (useGSAP prefers cleanup via its own return).

**Step 3: Commit**

```bash
git add src/components/ParticleNetworkBackground.tsx
git commit -m "feat: ParticleNetworkBackground component (R3F port)"
```

---

## Task 4: Mount the background in the marketing layout

**Files:**
- Modify: `src/app/(marketing)/layout.tsx`

**Step 1: Edit the layout**

Add the import at the top with the other component imports:

```typescript
import { ParticleNetworkBackground } from "@/components/ParticleNetworkBackground";
```

Inside `<body>`, add `<ParticleNetworkBackground />` as the **first child**, before `<SmoothScrollProvider>`:

```tsx
<body suppressHydrationWarning className="grain-overlay min-h-full bg-[#0e1418] text-[#f0f1ef]">
  <ParticleNetworkBackground />
  <SmoothScrollProvider>
    {children}
  </SmoothScrollProvider>
</body>
```

Rationale: placing it outside `<SmoothScrollProvider>` (and therefore outside `#smooth-wrapper`/`#smooth-content`) guarantees the fixed canvas isn't transformed by ScrollSmoother.

**Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add src/app/\(marketing\)/layout.tsx
git commit -m "feat: mount ParticleNetworkBackground in marketing layout"
```

---

## Task 5: Remove the Spline "3D tiles" iframe from HeroSection

**Files:**
- Modify: `src/components/HeroSection.tsx`

**Step 1: Read the current file to find exact deletion targets**

Run:

```bash
grep -n "SplineEmbed\|SPLINE_EMBED_URL" src/components/HeroSection.tsx
```

**Step 2: Edit — delete these ranges**

Remove:
1. The `SPLINE_EMBED_URL` constant (the `const SPLINE_EMBED_URL = "..."` line near the top).
2. The entire `function SplineEmbed(...)` definition (from `function SplineEmbed` through its closing `}`).
3. The `<SplineEmbed url={SPLINE_EMBED_URL} />` JSX usage wherever it appears in the returned JSX.
4. Any imports that become unused as a result (likely `useState`, `useEffect` if no other code in the file uses them — check first with grep).

Do NOT remove:
- The `CrossMarker` component or `CROSS_POSITIONS` — these are unrelated hero scaffolding and should stay.
- The hero copy, layout, or any GSAP animation logic.

After editing, ensure the hero's root background is transparent (no `bg-[#0e1418]` on the outermost section) so the particle canvas behind it shows through. If the hero root has a background color, remove it or change to `bg-transparent`.

**Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0. If `useState`/`useEffect` are reported as unused, remove them from the import.

**Step 4: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "feat: remove Spline 3D tiles iframe from HeroSection"
```

---

## Task 6: Swap ThreeShowcase for BallClumpSection in marketing page

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

**Step 1: Edit the imports**

Remove:
```typescript
import { ThreeShowcase } from "@/components/ThreeShowcase";
```

Add:
```typescript
import { BallClumpSection } from "@/components/BallClump";
```

**Step 2: Edit the JSX**

Find:

```tsx
<div id="three-showcase" style={{ marginBottom: '-100vh' }}><ThreeShowcase /></div>
```

Replace with:

```tsx
<BallClumpSection />
```

(The `marginBottom: -100vh` hack existed because `ThreeShowcase` pinned for 1800px of scroll; `BallClumpSection` doesn't pin, so the negative margin is not needed.)

**Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

**Step 4: Verify no other references to ThreeShowcase exist outside its own file**

```bash
grep -rn "ThreeShowcase" src/app src/components src/lib 2>&1 | grep -v "ThreeShowcase.tsx"
```
Expected: zero matches (or only `scroll-pause.ts` which references `checkThreeShowcasePause` — that's internal to a now-orphaned flow and can be left as dead code for this pass).

If `scroll-pause.ts` still calls `checkThreeShowcasePause`, leave it; it'll simply never fire.

**Step 5: Commit**

```bash
git add src/app/\(marketing\)/page.tsx
git commit -m "feat: swap ThreeShowcase for BallClumpSection"
```

---

## Task 7: Make the BallClump canvas transparent

**Files:**
- Modify: `src/components/BallClump.tsx`

**Step 1: Read the file and find the `<Canvas>` configuration**

```bash
grep -n "Canvas\|color attach" src/components/BallClump.tsx
```

**Step 2: Edit the Canvas to be transparent**

Locate the `<Canvas ...>` inside `BallClumpSection`. Ensure it has:

```tsx
<Canvas
  gl={{ alpha: true, antialias: true }}
  style={{ background: "transparent" }}
  ...other existing props
>
```

Remove any `<color attach="background" args={...} />` child inside the canvas if one exists.

Also: if `BallClumpSection`'s outer wrapper has `bg-[#0e1418]` or similar, change it to `bg-transparent` (or remove the bg class) so the particle canvas shows through.

**Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

**Step 4: Commit**

```bash
git add src/components/BallClump.tsx
git commit -m "fix: make BallClump canvas transparent so particle bg shows"
```

---

## Task 8: Full verification

**Step 1: Typecheck clean**

```bash
npm run typecheck
```
Expected: exits 0, zero errors.

**Step 2: Lint**

```bash
npm run lint
```
Expected: exits 0, zero errors. (Warnings about unused imports in `ThreeShowcase.tsx` / `SpaceStation.tsx` / `AstronautScene.tsx` are acceptable — those files are orphaned for this pass.)

**Step 3: Production build**

```bash
npm run build
```
Expected: exits 0. Watch for any warning about shader strings, `useGSAP` cleanup, or SSR access to `window` — all of those are guarded but double-check.

**Step 4: Dev server smoke test**

```bash
npm run dev
```

In a browser, open `http://localhost:3000` and verify:

1. Particle network visible behind the hero — no Spline iframe loads (check Network tab; no request to `my.spline.design`).
2. Scroll slowly from top to bottom. Confirm:
   - Camera drifts continuously; no sudden jumps.
   - Particle network remains visible behind every section (Hero → BallClump → Brand → Clients → ProjectShowcase → Capabilities → CTA → Footer).
   - `BallClumpSection` renders with the bubbles visible against the particle backdrop — no opaque panel hiding them.
   - No `ThreeShowcase` pin / 1800px scroll lock.
3. Open DevTools Performance tab, record 5 seconds of scroll, confirm 60fps (≥55fps acceptable on laptop integrated GPU).
4. Toggle OS "reduce motion" (or set `prefers-reduced-motion: reduce` via DevTools Rendering panel), reload. Confirm particles freeze but the scene still renders.
5. Emulate iPhone SE (375×667) in DevTools. Confirm particle count drops to 20, framerate stays ≥30fps, no horizontal scroll.
6. Open DevTools console — confirm **zero** errors or warnings (GSAP "ScrollSmoother not registered" would be bad; shader compile errors would be bad).

**Step 5: Commit any fixes from verification**

If verification revealed issues, fix them in targeted commits, one issue per commit, before declaring done.

**Step 6: Final status**

```bash
git log --oneline 171af04..HEAD
```
Expected: ~7-8 commits, one per task.

---

## Rollback

If something goes wrong and you need to abandon this work:

```bash
git reset --hard 171af04
```

This returns the repo to the design-doc commit, discarding all code changes from this plan.

---

## Notes for the executor

- **Do not** install Lenis or any new scroll library. NexApex already uses GSAP ScrollSmoother.
- **Do not** delete `ThreeShowcase.tsx`, `SpaceStation.tsx`, or `AstronautScene.tsx` files in this pass. They become orphaned but stay on disk for reversibility. A follow-up PR will clean them up.
- **Do not** add post-processing (bloom) to the background canvas. Source has it; we're skipping for perf.
- If `useGSAP`'s cleanup semantics cause the ScrollTrigger to fire after unmount, fall back to a bare `useEffect` with manual `st.kill()` cleanup.
- If Chrome reports "WebGL context lost" during dev (can happen with HMR + two canvases), it will recover on refresh. Not a bug.
- If `npm run build` flags SSR access to `window` in `getParticleCount`, the guard is already in place — the call site (`useRef(getParticleCount())`) runs on client only, but if Next's SSR evaluates the module body, wrap the `useRef` initial value in a lazy initializer: `useRef<number | null>(null)` then set in a `useEffect`.
