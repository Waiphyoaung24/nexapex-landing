# Hero 3D Fix + Loading Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 3D spacestation barely appearing in the hero section and add a GSAP-animated loading overlay for smooth model loading experience.

**Architecture:** The 3D canvas starts hidden (opacity 0) behind a fullscreen loading overlay. When the GLB model finishes loading, the overlay animates away with a cinematic GSAP sequence (brand bar + reveal), then the 3D canvas fades in and hero text animates. Scroll lock via Lenis prevents scrolling during load.

**Tech Stack:** GSAP 3.14, Three.js 0.183, Astro 5, React 19, Lenis 1.3, Tailwind 4

---

## Root Cause Analysis

### Issue 1: Model barely visible
- `HERO_START` camera at `z: 18` with `y: 2` places the camera too close for the model's bounding box (center y=-3.42, size 22.45 tall)
- The fog `near: 15` eats geometry at this distance range
- Scene background `#0e1820` ≈ page bg `#0e1418` — low contrast before model loads

### Issue 2: No loading experience
- Canvas starts at `opacity: 1` before GLTFLoader finishes → user sees empty dark canvas
- Hero text entrance plays on a 0.6s delay regardless of model state → text appears over nothing
- No scroll lock during loading → user can scroll before 3D is ready

---

## Task 1: Fix HERO_START camera to show full station

**Files:**
- Modify: `src/components/three/CapabilitiesScene.tsx:18-19`

**Step 1: Update HERO_START/HERO_END camera positions**

Use PERSPECTIVES[0] (proven to show full station) as the starting point. Pull back further for the hero, lower camera to center the station in the upper viewport:

```typescript
// Hero zoom-out: station fills upper half as cinematic backdrop
const HERO_START = { camera: { x: 0, y: -2, z: 24 }, target: { x: 0, y: -3, z: -1 } };
const HERO_END   = { camera: { x: 0, y: 6, z: 34 }, target: { x: 0, y: -4, z: -1 } };
```

**Why these values:**
- `z: 24` — far enough to show the entire station (bounding box width ~14.5, height ~22.5)
- `y: -2` — camera below center puts the station in the upper viewport (Lusion-style)
- `HERO_END z: 34` — gentle 10-unit pullback (not dramatic)
- Camera rises from `y: -2 → y: 6` — cinematic upward drift

**Step 2: Extend fog far distance for hero viewing range**

In `SceneContent`, change fog to accommodate the further camera:

```typescript
scene.fog = new THREE.Fog(fogColor, 20, 60);
```

`near: 15 → 20` so geometry at the hero distance isn't fogged.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/three/CapabilitiesScene.tsx
git commit -m "fix: hero camera at z=24 shows full station, extend fog range"
```

---

## Task 2: Create loading overlay in Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro`

**Step 1: Add loading overlay HTML after `<body>` opens**

Insert between `<body>` and the cursor divs. The overlay covers everything at `z-[9999]`:

```html
<!-- Loading overlay — covers page until 3D model is ready -->
<div id="loader-overlay" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg">
  <!-- Brand loader bar -->
  <div class="relative w-48 h-px bg-white/10 overflow-hidden rounded-full">
    <div id="loader-bar" class="absolute inset-y-0 left-0 w-0 bg-cyan-dim rounded-full"></div>
  </div>
  <p id="loader-text" class="font-m text-[11px] text-dim uppercase tracking-[0.3em] mt-4 opacity-0">Loading</p>
</div>
```

**Step 2: Add loader GSAP script at end of body**

```html
<script>
  import gsap from 'gsap';

  const overlay = document.getElementById('loader-overlay');
  const bar = document.getElementById('loader-bar');
  const text = document.getElementById('loader-text');

  if (overlay && bar && text) {
    // Animate bar + text while loading
    const loadTl = gsap.timeline();
    loadTl.to(text, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    loadTl.to(bar, { width: '70%', duration: 2, ease: 'power1.inOut' }, 0);

    // Listen for model ready
    window.addEventListener('nexapex:model-ready', () => {
      // Complete the bar
      gsap.to(bar, { width: '100%', duration: 0.3, ease: 'power2.out' });

      // Exit animation — overlay slides up + morphs
      const exitTl = gsap.timeline({ delay: 0.4 });
      exitTl
        .to(text, { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in' })
        .to(overlay, {
          yPercent: -100,
          duration: 1.2,
          ease: 'expo.inOut',
        }, 0.1)
        .set(overlay, { display: 'none' });
    }, { once: true });

    // Fallback: if model takes >6s, dismiss loader anyway
    setTimeout(() => {
      if (overlay.style.display !== 'none') {
        window.dispatchEvent(new CustomEvent('nexapex:model-ready'));
      }
    }, 6000);
  }
</script>
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: add GSAP loading overlay with brand bar animation"
```

---

## Task 3: Dispatch model-ready event from CapabilitiesCanvas

**Files:**
- Modify: `src/components/three/CapabilitiesCanvas.tsx:11`

**Step 1: Add custom event dispatch in handleModelReady**

```typescript
const handleModelReady = useCallback(() => {
  setModelReady(true);
  window.dispatchEvent(new CustomEvent('nexapex:model-ready'));
}, []);
```

**Step 2: Start canvas at opacity 0 again**

The loader overlay covers the page, so the canvas should fade in AFTER the overlay exits. Change initial opacity back to 0:

```typescript
style={{
  position: 'fixed',
  inset: 0,
  zIndex: 1,
  pointerEvents: 'none',
  opacity: 0,
}}
```

**Step 3: Add canvas fade-in after loader exits**

In the `setup()` function, add a canvas reveal that plays AFTER the loader overlay finishes (1.6s total exit time):

```typescript
// Canvas reveal — after loader overlay exits
gsap.to(containerRef.current, {
  opacity: 1,
  duration: 1,
  ease: 'power2.out',
  delay: 1.6,
});
```

Insert this right before the hero zoom-out timeline code.

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/three/CapabilitiesCanvas.tsx
git commit -m "feat: dispatch model-ready event, canvas reveals after loader"
```

---

## Task 4: Delay hero entrance until after loader

**Files:**
- Modify: `src/components/HeroSection.astro:91`

**Step 1: Increase hero entrance delay**

Currently `delay: 0.6`. Change to `delay: 2.2` so hero text reveals AFTER the loader overlay slides away (1.6s) + a small buffer:

```javascript
const tl = gsap.timeline({ delay: 2.2 });
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/HeroSection.astro
git commit -m "feat: delay hero entrance until after loader exits"
```

---

## Task 5: Lock scroll during loading

**Files:**
- Modify: `src/layouts/Layout.astro` (Lenis script section)

**Step 1: Start Lenis stopped, resume on model-ready**

In the Lenis init script, add scroll lock:

```typescript
// Start with scroll locked until model is ready
lenis.stop();

window.addEventListener('nexapex:model-ready', () => {
  // Resume scroll after loader exit animation (1.6s)
  setTimeout(() => lenis.start(), 1600);
}, { once: true });
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: lock scroll during model loading, resume after loader"
```

---

## Task 6: Verify full flow end-to-end

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify loading flow**

Expected behavior:
1. Page loads → dark overlay with animated cyan bar + "Loading" text
2. Bar fills to 70% while model loads
3. Model ready → bar completes to 100%
4. Overlay slides up (expo.inOut, 1.2s)
5. 3D station visible as hero backdrop (full station, centered upper viewport)
6. Hero text lines slide up with staggered reveal
7. On scroll → camera gently zooms out + fades
8. Subsequent sections render normally

**Step 3: Check reduced motion**

Verify `prefers-reduced-motion` still works — loader should still dismiss, animations should be instant.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete hero 3D fix + loading animation flow"
```

---

## Z-Index Stack Reference

| z-index | Element |
|---------|---------|
| 1 | 3D canvas (fixed) |
| 10 | Capabilities text overlays |
| 20 | Content sections (Manifesto, Products, Spiral, FooterCTA) |
| 50 | Navbar |
| 9999 | Loader overlay (removed after exit) |

## File Summary

| File | Changes |
|------|---------|
| `src/components/three/CapabilitiesScene.tsx` | Fix HERO_START/END camera, extend fog |
| `src/components/three/CapabilitiesCanvas.tsx` | Dispatch event, opacity 0 start, delayed reveal |
| `src/layouts/Layout.astro` | Add loader overlay + GSAP animation + scroll lock |
| `src/components/HeroSection.astro` | Increase entrance delay to 2.2s |
