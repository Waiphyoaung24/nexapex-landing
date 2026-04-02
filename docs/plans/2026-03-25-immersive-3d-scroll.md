# Immersive 3D Scroll Experience — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-page immersive 3D scroll experience where the camera flies through space, revealing three GLB models (hero, capabilities, products) with smooth GSAP-driven transitions and HTML text overlays.

**Architecture:** One persistent React Three Fiber `<Canvas>` fixed behind the page. Three GLB models positioned along the Z-axis at z=0, z=-60, z=-120. GSAP ScrollTrigger with `scrub: true` (synced to existing Lenis) drives the camera forward on scroll. Fog density pulses between models to create cinematic "traveling through deep space" transitions. HTML `<section>` elements sit on top for text content, also animated by GSAP.

**Tech Stack:** Astro 5, React 19, Three.js 0.183, @react-three/fiber 9.5, @react-three/drei (to install), GSAP 3.14 + ScrollTrigger, Lenis 1.3, Tailwind 4

---

## Task 1: Install @react-three/drei

**Files:**
- Modify: `package.json`

**Step 1: Install drei**

```bash
cd /Users/waiphyoaung/Desktop/NexApex/nexapex-web
npm install @react-three/drei
```

**Step 2: Verify installation**

```bash
npm ls @react-three/drei
```

Expected: shows `@react-three/drei@X.X.X`

**Step 3: Verify dev server still starts**

```bash
npm run dev -- --host 0.0.0.0 &
sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:4321
kill %1
```

Expected: `200`

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-three/drei for GLB loading and 3D helpers"
```

---

## Task 2: Create SpaceModel.tsx — Reusable GLB Loader

**Files:**
- Create: `src/components/three/SpaceModel.tsx`

**Context:** This component loads a single GLB, plays its animations, and exposes a ref for external control. Uses Three.js GLTFLoader directly (matching the reference pattern) wrapped in R3F.

**Step 1: Create the component**

```tsx
// src/components/three/SpaceModel.tsx
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** 0 = invisible, 1 = fully visible — driven by scroll */
  opacity?: number;
}

export default function SpaceModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
}: SpaceModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  // Play all embedded animations
  useEffect(() => {
    if (animations.length === 0) return;
    const actions = animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
      return action;
    });
    return () => actions.forEach((a) => a.stop());
  }, [animations, mixer]);

  // Tick the animation mixer
  useFrame((_, delta) => {
    mixer.update(delta);
  });

  // Drive opacity on all mesh materials
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = opacity;
      }
    });
  }, [opacity, scene]);

  const scaleArr: [number, number, number] = Array.isArray(scale)
    ? scale
    : [scale, scale, scale];

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scaleArr}>
      <primitive object={scene} />
    </group>
  );
}
```

**Step 2: Verify it compiles**

```bash
cd /Users/waiphyoaung/Desktop/NexApex/nexapex-web && npx tsc --noEmit
```

Expected: no errors (or only pre-existing ones)

**Step 3: Commit**

```bash
git add src/components/three/SpaceModel.tsx
git commit -m "feat: add SpaceModel reusable GLB loader with animation support"
```

---

## Task 3: Create SpaceCamera.tsx — Scroll-Driven Camera Rig

**Files:**
- Create: `src/components/three/SpaceCamera.tsx`

**Context:** This component positions the R3F camera along a Z-axis flight path. It reads a `progress` value (0-1) and interpolates the camera position from the start (z=10) through each model to the end (z=-130). Uses R3F's `useThree` to access the camera directly.

**Step 1: Create the camera component**

```tsx
// src/components/three/SpaceCamera.tsx
import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpaceCameraProps {
  /** 0–1 scroll progress */
  progress: number;
}

// Camera keyframes along the flight path
// Each keyframe: { at: scrollProgress, pos: [x,y,z], lookAt: [x,y,z] }
const KEYFRAMES = [
  { at: 0.0, pos: [0, 2, 12], lookAt: [0, 1, 0] },       // Looking at model 1
  { at: 0.15, pos: [0, 2, 6], lookAt: [0, 1, 0] },        // Close to model 1
  { at: 0.25, pos: [0, 3, -10], lookAt: [0, 2, -20] },     // Transitioning...
  { at: 0.35, pos: [-2, 2, -50], lookAt: [0, 1, -60] },    // Approaching model 2
  { at: 0.50, pos: [-2, 2, -54], lookAt: [0, 1, -60] },    // Close to model 2
  { at: 0.60, pos: [0, 3, -75], lookAt: [0, 2, -90] },     // Transitioning...
  { at: 0.70, pos: [2, 2, -110], lookAt: [0, 1, -120] },   // Approaching model 3
  { at: 0.85, pos: [2, 2, -114], lookAt: [0, 1, -120] },   // Close to model 3
  { at: 1.0, pos: [0, 3, -125], lookAt: [0, 2, -130] },    // Final pullback
] as const;

function lerpKeyframes(progress: number) {
  const kf = KEYFRAMES;
  // Clamp
  if (progress <= kf[0].at) return { pos: [...kf[0].pos], lookAt: [...kf[0].lookAt] };
  if (progress >= kf[kf.length - 1].at)
    return { pos: [...kf[kf.length - 1].pos], lookAt: [...kf[kf.length - 1].lookAt] };

  // Find segment
  for (let i = 0; i < kf.length - 1; i++) {
    if (progress >= kf[i].at && progress <= kf[i + 1].at) {
      const t = (progress - kf[i].at) / (kf[i + 1].at - kf[i].at);
      // Smooth step for nicer interpolation
      const s = t * t * (3 - 2 * t);
      return {
        pos: kf[i].pos.map((v, j) => v + (kf[i + 1].pos[j] - v) * s),
        lookAt: kf[i].lookAt.map((v, j) => v + (kf[i + 1].lookAt[j] - v) * s),
      };
    }
  }
  return { pos: [...kf[0].pos], lookAt: [...kf[0].lookAt] };
}

export default function SpaceCamera({ progress }: SpaceCameraProps) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const { pos, lookAt } = lerpKeyframes(progress);
    // Smooth lerp for buttery feel (Lenis + GSAP already smooth, but this adds frame-level damping)
    camera.position.lerp(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.08);
    lookAtTarget.current.lerp(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]), 0.08);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/three/SpaceCamera.tsx
git commit -m "feat: add SpaceCamera scroll-driven camera rig with keyframe interpolation"
```

---

## Task 4: Create SpaceScene.tsx — Main 3D Scene

**Files:**
- Create: `src/components/three/SpaceScene.tsx`

**Context:** This is the main R3F scene that composes all three models, the camera rig, lighting, fog, and environment. It receives `scrollProgress` (0-1) as a prop and distributes it to the camera and model visibility.

**Step 1: Create the scene component**

```tsx
// src/components/three/SpaceScene.tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import SpaceModel from './SpaceModel';
import SpaceCamera from './SpaceCamera';

interface SpaceSceneProps {
  scrollProgress: number;
}

/** Map scroll progress to model opacity — each model visible in its segment */
function getModelOpacity(progress: number, center: number, range = 0.2): number {
  const dist = Math.abs(progress - center);
  if (dist > range) return 0;
  // Smooth fade: 1 at center, 0 at edge
  return 1 - (dist / range);
}

/** Dynamic fog density — thicker between models, lighter near them */
function getFogDensity(progress: number): number {
  // Thin at model positions (0.08, 0.42, 0.77), thick in between
  const modelPositions = [0.08, 0.42, 0.77];
  const minDist = Math.min(...modelPositions.map((p) => Math.abs(progress - p)));
  // Base fog + extra in transition zones
  return 0.015 + minDist * 0.06;
}

// Model configurations matching reference code patterns
const MODELS = [
  {
    url: '/models/space_1.glb',
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 0.1,
    scrollCenter: 0.08,
  },
  {
    url: '/models/space_2.glb',
    position: [0, 0, -60] as [number, number, number],
    rotation: [0, Math.PI * 1.4, 0] as [number, number, number],
    scale: 0.0005,
    scrollCenter: 0.42,
  },
  {
    url: '/models/products_space.glb',
    position: [0, 0, -120] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    scale: 0.5,
    scrollCenter: 0.77,
  },
];

export default function SpaceScene({ scrollProgress }: SpaceSceneProps) {
  const fogColor = useMemo(() => new THREE.Color('#0e1418'), []);
  const fogDensity = getFogDensity(scrollProgress);

  return (
    <>
      {/* Camera rig */}
      <SpaceCamera progress={scrollProgress} />

      {/* Fog — matches brand bg, density driven by scroll */}
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />

      {/* Lighting — reference pattern: ACES filmic */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -10]} intensity={0.4} />
      <pointLight position={[0, 2, 0]} color="#94fcff" intensity={0.6} distance={30} />
      <pointLight position={[0, 2, -60]} color="#94fcff" intensity={0.6} distance={30} />
      <pointLight position={[0, 2, -120]} color="#94fcff" intensity={0.6} distance={30} />

      {/* Models */}
      {MODELS.map((m) => (
        <SpaceModel
          key={m.url}
          url={m.url}
          position={m.position}
          rotation={m.rotation}
          scale={m.scale}
          opacity={getModelOpacity(scrollProgress, m.scrollCenter)}
        />
      ))}
    </>
  );
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/three/SpaceScene.tsx
git commit -m "feat: add SpaceScene composing three models with fog transitions and lighting"
```

---

## Task 5: Create SpaceCanvas.tsx — R3F Canvas + GSAP Scroll Binding

**Files:**
- Create: `src/components/three/SpaceCanvas.tsx`

**Context:** This is the top-level React component that renders the R3F `<Canvas>` and bridges GSAP ScrollTrigger to the scene's `scrollProgress`. It uses `useEffect` to create a ScrollTrigger that reads scroll position from the Lenis-synced page scroll and updates a React ref.

**Step 1: Create the canvas component**

```tsx
// src/components/three/SpaceCanvas.tsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';
import SpaceScene from './SpaceScene';

export default function SpaceCanvas() {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import GSAP to avoid SSR issues in Astro
    let ctx: any;
    let st: any;

    async function setup() {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      const ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      // Create a proxy object for GSAP to tween
      const proxy = { progress: 0 };

      st = ScrollTrigger.create({
        trigger: '#space-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5, // Smooth scrub synced with Lenis
        onUpdate: (self) => {
          setProgress(self.progress);
        },
      });
    }

    setup();

    return () => {
      if (st) st.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 40, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        style={{ background: '#0e1418' }}
      >
        <SpaceScene scrollProgress={progress} />
        <Preload all />
      </Canvas>
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/three/SpaceCanvas.tsx
git commit -m "feat: add SpaceCanvas with R3F and GSAP ScrollTrigger binding"
```

---

## Task 6: Create SpaceOverlays.astro — HTML Text Sections

**Files:**
- Create: `src/components/three/SpaceOverlays.astro`

**Context:** These are the HTML text overlays that sit on top of the 3D canvas. Each section is positioned at the right scroll offset to align with its corresponding 3D model. GSAP ScrollTrigger drives their fade-in/fade-out.

**Step 1: Create the overlays component**

```astro
---
// src/components/three/SpaceOverlays.astro
// HTML text overlays for each 3D scene section
---

<!-- Section 1: Hero — aligns with space_1 model -->
<section
  id="hero-overlay"
  class="space-overlay relative z-10 flex items-center justify-center h-screen px-6"
>
  <div class="text-center max-w-4xl mx-auto" data-overlay="hero">
    <p class="text-cyan-dim font-m text-sm uppercase tracking-[0.3em] mb-6 opacity-0">
      Bangkok-Based AI Lab
    </p>
    <h1 class="font-d text-5xl md:text-7xl lg:text-8xl text-gradient-hero leading-[1.05] mb-8 opacity-0">
      Intelligence<br />Built for the<br />Real World
    </h1>
    <p class="font-b text-dim text-lg md:text-xl max-w-2xl mx-auto opacity-0">
      From dynamic pricing to factory automation — we build AI systems
      that transform hospitality, manufacturing, and retail across Southeast Asia.
    </p>
  </div>
</section>

<!-- Section 2: Capabilities — aligns with space_2 model -->
<section
  id="capabilities-overlay"
  class="space-overlay relative z-10 flex items-center justify-start h-screen px-6 md:px-16 lg:px-24"
>
  <div class="max-w-xl" data-overlay="capabilities">
    <p class="text-cyan-dim font-m text-sm uppercase tracking-[0.3em] mb-4 opacity-0">
      What We Build
    </p>
    <h2 class="font-d text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] mb-6 opacity-0">
      AI That<br />Understands<br />Your Business
    </h2>
    <p class="font-b text-dim text-base md:text-lg leading-relaxed opacity-0">
      Computer vision for quality control. Predictive models for demand forecasting.
      Natural language systems that speak your customers' language.
      Every solution engineered for Southeast Asian markets.
    </p>
  </div>
</section>

<!-- Section 3: Products — aligns with products_space model -->
<section
  id="products-overlay"
  class="space-overlay relative z-10 flex items-center justify-end h-screen px-6 md:px-16 lg:px-24"
>
  <div class="max-w-xl text-right" data-overlay="products">
    <p class="text-cyan-dim font-m text-sm uppercase tracking-[0.3em] mb-4 opacity-0">
      Our Products
    </p>
    <h2 class="font-d text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] mb-6 opacity-0">
      Ship Faster<br />With Proven<br />AI Modules
    </h2>
    <p class="font-b text-dim text-base md:text-lg leading-relaxed opacity-0">
      Pre-built, production-tested AI modules for pricing optimization,
      visual inspection, and customer intelligence.
      Plug into your stack. See results in weeks, not months.
    </p>
  </div>
</section>

<!-- GSAP scroll-driven overlay animations -->
<script>
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-overlay]').forEach((overlay) => {
    const children = overlay.children;
    const section = overlay.closest('.space-overlay') as HTMLElement;

    if (prefersReducedMotion) {
      // Show everything immediately
      gsap.set(children, { opacity: 1, y: 0 });
      return;
    }

    // Fade in: stagger children as section enters viewport
    gsap.fromTo(
      children,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'top 20%',
          scrub: 1,
        },
      }
    );

    // Fade out: as section scrolls away
    gsap.fromTo(
      children,
      { opacity: 1, y: 0 },
      {
        opacity: 0,
        y: -30,
        scrollTrigger: {
          trigger: section,
          start: 'bottom 60%',
          end: 'bottom 20%',
          scrub: 1,
        },
      }
    );
  });
</script>
```

**Step 2: Verify it compiles**

```bash
npm run build 2>&1 | tail -5
```

Expected: successful build (no errors from this file)

**Step 3: Commit**

```bash
git add src/components/three/SpaceOverlays.astro
git commit -m "feat: add SpaceOverlays with GSAP scroll-driven text animations"
```

---

## Task 7: Create SpaceExperience.astro — Full Assembly

**Files:**
- Create: `src/components/three/SpaceExperience.astro`

**Context:** This Astro component combines the fixed R3F canvas with the scrollable overlay sections. It creates the tall scroll container that drives everything.

**Step 1: Create the experience wrapper**

```astro
---
// src/components/three/SpaceExperience.astro
// Full-page immersive 3D scroll experience
import SpaceOverlays from './SpaceOverlays.astro';
---

<!-- Fixed 3D canvas behind everything -->
<div id="space-canvas-mount" class="fixed inset-0 z-0"></div>

<!-- Scrollable content container — height drives the entire experience -->
<div id="space-scroll-container" class="relative z-10">
  <!-- Spacer for entry (camera starts pulled back) -->
  <div class="h-[50vh]" aria-hidden="true"></div>

  <SpaceOverlays />

  <!-- Spacer for final pullback -->
  <div class="h-[80vh]" aria-hidden="true"></div>
</div>

<!-- Loading overlay -->
<div id="space-loader" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg transition-opacity duration-700">
  <p class="font-d text-2xl text-white mb-4">Loading Experience</p>
  <div class="w-48 h-[2px] bg-surface2 rounded-full overflow-hidden">
    <div id="space-loader-bar" class="h-full bg-cyan-dim rounded-full transition-all duration-300" style="width: 0%"></div>
  </div>
  <p id="space-loader-pct" class="font-m text-dim text-sm mt-3">0%</p>
</div>

<!-- Mount React canvas client-side -->
<script>
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import SpaceCanvas from './SpaceCanvas';

  const mount = document.getElementById('space-canvas-mount');
  if (mount) {
    const root = createRoot(mount);
    root.render(createElement(SpaceCanvas));
  }
</script>

<!-- Loading progress watcher -->
<script>
  // Watch for Three.js loading manager progress
  function watchLoading() {
    const loader = document.getElementById('space-loader');
    const bar = document.getElementById('space-loader-bar') as HTMLElement;
    const pct = document.getElementById('space-loader-pct');
    if (!loader || !bar || !pct) return;

    // Poll for canvas readiness (R3F mounts async)
    let loaded = false;
    const check = setInterval(() => {
      const canvas = document.querySelector('#space-canvas-mount canvas');
      if (canvas) {
        // Give models a moment to load
        let fakeProgress = 0;
        const fill = setInterval(() => {
          fakeProgress += 5;
          bar.style.width = Math.min(fakeProgress, 100) + '%';
          pct.textContent = Math.min(fakeProgress, 100) + '%';
          if (fakeProgress >= 100) {
            clearInterval(fill);
            setTimeout(() => {
              loader.style.opacity = '0';
              loader.style.pointerEvents = 'none';
              setTimeout(() => loader.remove(), 700);
            }, 400);
          }
        }, 80);
        loaded = true;
        clearInterval(check);
      }
    }, 100);

    // Timeout fallback — remove loader after 8s regardless
    setTimeout(() => {
      if (!loaded) {
        clearInterval(check);
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
      }
    }, 8000);
  }

  watchLoading();
</script>
```

**Step 2: Verify it compiles**

```bash
npm run build 2>&1 | tail -10
```

**Step 3: Commit**

```bash
git add src/components/three/SpaceExperience.astro
git commit -m "feat: add SpaceExperience assembling canvas, overlays, and loader"
```

---

## Task 8: Wire Into index.astro

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Update index.astro to use the experience**

```astro
---
import Layout from '../layouts/Layout.astro';
import SpaceExperience from '../components/three/SpaceExperience.astro';
---

<Layout>
  <main id="main-content" class="w-full bg-bg text-white min-h-screen">
    <SpaceExperience />
  </main>
</Layout>
```

**Step 2: Run dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321` — should see:
1. Loading screen with progress bar
2. 3D canvas loads with first model visible
3. Scrolling moves camera through space
4. Text overlays fade in/out at correct positions

**Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: wire SpaceExperience into landing page"
```

---

## Task 9: Add Loading Progress via drei useProgress

**Files:**
- Modify: `src/components/three/SpaceCanvas.tsx`
- Modify: `src/components/three/SpaceExperience.astro`

**Context:** Replace the fake progress bar with real loading progress from drei's `useProgress` hook. This requires a bridge between the R3F context and the HTML loader.

**Step 1: Add progress reporting to SpaceCanvas**

Add a progress reporter component inside the Canvas:

```tsx
// Add to SpaceCanvas.tsx — inside the Canvas, add:
import { useProgress } from '@react-three/drei';

function ProgressReporter() {
  const { progress } = useProgress();

  useEffect(() => {
    // Dispatch custom event for the Astro loader to pick up
    window.dispatchEvent(
      new CustomEvent('space-load-progress', { detail: { progress } })
    );
  }, [progress]);

  return null;
}

// Inside <Canvas>, add <ProgressReporter /> alongside <SpaceScene />
```

**Step 2: Update SpaceExperience.astro loader script to listen for real progress**

Replace the fake progress interval with:

```js
window.addEventListener('space-load-progress', ((e: CustomEvent) => {
  const p = Math.round(e.detail.progress);
  bar.style.width = p + '%';
  pct.textContent = p + '%';
  if (p >= 100) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      setTimeout(() => loader.remove(), 700);
    }, 400);
  }
}) as EventListener);
```

**Step 3: Verify loading bar reflects real model loading**

Hard-refresh the page — bar should fill as GLB files download.

**Step 4: Commit**

```bash
git add src/components/three/SpaceCanvas.tsx src/components/three/SpaceExperience.astro
git commit -m "feat: real loading progress via drei useProgress"
```

---

## Task 10: Polish — Stars Background + Ambient Particles

**Files:**
- Create: `src/components/three/SpaceStars.tsx`
- Modify: `src/components/three/SpaceScene.tsx`

**Context:** Add a starfield using drei's `<Stars>` component for the deep space atmosphere. Add subtle cyan point particles floating near each model.

**Step 1: Create SpaceStars**

```tsx
// src/components/three/SpaceStars.tsx
import { Stars } from '@react-three/drei';

export default function SpaceStars() {
  return (
    <Stars
      radius={100}
      depth={80}
      count={4000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
  );
}
```

**Step 2: Add to SpaceScene**

```tsx
// In SpaceScene.tsx, import and add inside the fragment:
import SpaceStars from './SpaceStars';

// Add inside the <> fragment, before the models:
<SpaceStars />
```

**Step 3: Verify stars render behind models**

```bash
npm run dev
```

Stars should be visible in the background, adding depth to the space theme.

**Step 4: Commit**

```bash
git add src/components/three/SpaceStars.tsx src/components/three/SpaceScene.tsx
git commit -m "feat: add starfield background for deep space atmosphere"
```

---

## Task 11: Polish — Smooth Fog Transitions with GSAP

**Files:**
- Modify: `src/components/three/SpaceScene.tsx`

**Context:** Currently fog density updates instantly. Add smooth interpolation so fog thickens/thins gradually during transitions, creating a cinematic wipe effect.

**Step 1: Add fog interpolation with useFrame**

Replace the direct fogDensity calculation with a `useRef` that lerps toward the target:

```tsx
// In SpaceScene.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Inside the component:
const fogRef = useRef<THREE.FogExp2>(null);
const currentDensity = useRef(0.015);

useFrame(() => {
  const target = getFogDensity(scrollProgress);
  currentDensity.current += (target - currentDensity.current) * 0.03;
  if (fogRef.current) {
    fogRef.current.density = currentDensity.current;
  }
});

// Update the JSX:
<fogExp2 ref={fogRef} attach="fog" args={[fogColor, 0.015]} />
```

**Step 2: Verify smooth fog transition while scrolling**

Scroll slowly between model sections — fog should gradually thicken in the gaps and thin near models.

**Step 3: Commit**

```bash
git add src/components/three/SpaceScene.tsx
git commit -m "feat: smooth fog density transitions for cinematic model reveals"
```

---

## Task 12: Responsive + Reduced Motion + Mobile Fallback

**Files:**
- Modify: `src/components/three/SpaceCanvas.tsx`
- Modify: `src/components/three/SpaceOverlays.astro`

**Context:** Handle mobile performance (lower DPR, reduce star count), respect `prefers-reduced-motion`, and ensure text overlays are readable on small screens.

**Step 1: Add reduced motion check to SpaceCanvas**

```tsx
// In SpaceCanvas.tsx — at top of component:
const [reducedMotion, setReducedMotion] = useState(false);

useEffect(() => {
  setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}, []);

// Pass to Canvas:
<Canvas dpr={reducedMotion ? [1, 1] : [1, 1.5]} ...>
```

**Step 2: Add mobile detection for lower quality**

```tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  setIsMobile(window.innerWidth < 768);
}, []);

// Use in Canvas:
dpr={isMobile ? [1, 1] : [1, 1.5]}
```

**Step 3: Verify on mobile viewport**

Use browser devtools device simulation at 375x812 — should render cleanly with readable text.

**Step 4: Commit**

```bash
git add src/components/three/SpaceCanvas.tsx src/components/three/SpaceOverlays.astro
git commit -m "feat: responsive DPR, mobile fallback, and reduced motion support"
```

---

## Task 13: Build Verification + Final Polish

**Files:**
- All files from previous tasks

**Step 1: Full production build**

```bash
cd /Users/waiphyoaung/Desktop/NexApex/nexapex-web && npm run build
```

Expected: clean build, no errors.

**Step 2: Preview production build**

```bash
npm run preview
```

Verify at `http://localhost:4321`:
- [ ] Loading screen shows real progress, then fades out
- [ ] First model (space_1) visible at top
- [ ] Scrolling moves camera forward through space
- [ ] Fog thickens between models, creating transition wipe
- [ ] Text overlays fade in/out at correct scroll positions
- [ ] Second model (space_2) appears mid-scroll
- [ ] Third model (products_space) appears at bottom
- [ ] Stars visible throughout
- [ ] Custom cursor still works
- [ ] No console errors
- [ ] Mobile viewport renders cleanly

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete immersive 3D scroll experience with three GLB models"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Install drei | `package.json` |
| 2 | SpaceModel — GLB loader | `src/components/three/SpaceModel.tsx` |
| 3 | SpaceCamera — scroll camera rig | `src/components/three/SpaceCamera.tsx` |
| 4 | SpaceScene — scene composition | `src/components/three/SpaceScene.tsx` |
| 5 | SpaceCanvas — R3F + GSAP bridge | `src/components/three/SpaceCanvas.tsx` |
| 6 | SpaceOverlays — HTML text sections | `src/components/three/SpaceOverlays.astro` |
| 7 | SpaceExperience — full assembly | `src/components/three/SpaceExperience.astro` |
| 8 | Wire into index.astro | `src/pages/index.astro` |
| 9 | Real loading progress | `SpaceCanvas.tsx`, `SpaceExperience.astro` |
| 10 | Stars background | `SpaceStars.tsx`, `SpaceScene.tsx` |
| 11 | Smooth fog transitions | `SpaceScene.tsx` |
| 12 | Responsive + a11y | `SpaceCanvas.tsx`, `SpaceOverlays.astro` |
| 13 | Build verification | All |

**Total scroll height:** ~500vh (50vh spacer + 3x100vh sections + 80vh exit spacer)
**Camera path:** z=12 → z=-125 (137 units of travel)
**Transition effect:** Exponential fog density pulse between model positions
