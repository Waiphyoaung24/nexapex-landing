# Loading Flow Fix + Model/Brand Alignment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the flash of unstyled content on page reload by adding an SSR loading screen, fix broken model reference, and align brand colors.

**Architecture:** Add server-rendered loading overlay in index.astro that covers the viewport instantly (pure HTML/CSS, no JS). When React hydrates CinematicHero, it dismisses the SSR loader seamlessly — the React Loader looks identical, creating zero visual discontinuity. Also fix model path from Untitled.glb → need_some_space.glb and align BRAND_STOPS with exact brand palette.

**Tech Stack:** Astro SSR HTML, CSS keyframes, React useEffect, Three.js PointsMaterial

---

### Task 1: Add SSR Loading Screen to index.astro

**Files:**
- Modify: `src/pages/index.astro`

**Why:** `client:only="react"` renders NO HTML during SSR. The browser shows Navbar + LandingSections before JS loads. An SSR overlay prevents this flash.

**Step 1: Add inline loading screen before CinematicHero**

The SSR loader must:
- Use inline styles (independent of CSS bundle loading)
- Embed its own keyframe animation
- Match Loader.tsx visually (same colors, sizing, layout)
- Have z-index 10001 to cover everything
- Have id="ssr-loader" for programmatic removal

```astro
<!-- SSR Loading Screen — visible instantly, dismissed when React hydrates -->
<div id="ssr-loader"
  style="position:fixed;inset:0;z-index:10001;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0e1418;"
>
  <style>
    @keyframes ssrLoaderBar {
      0% { width:0%;margin-left:0% }
      50% { width:60%;margin-left:20% }
      100% { width:0%;margin-left:100% }
    }
  </style>
  <div style="width:64px;height:64px;margin-bottom:32px;opacity:0.4">
    <img src="/full_color_logo.png" alt="" style="width:100%;height:100%;object-fit:contain" />
  </div>
  <div style="width:192px;height:2px;background:rgba(255,255,255,0.1);border-radius:9999px;overflow:hidden">
    <div style="height:100%;background:linear-gradient(to right,rgba(148,252,255,0.6),#94fcff);border-radius:9999px;animation:ssrLoaderBar 1.5s ease-in-out infinite;box-shadow:0 0 8px rgba(148,252,255,0.5)" />
  </div>
  <p style="font-family:'Space Grotesk',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6e7a84;margin-top:16px">
    Loading Experience
  </p>
</div>
```

### Task 2: Dismiss SSR Loader from CinematicHero

**Files:**
- Modify: `src/components/cinematic/CinematicHero.tsx`

**Step 1: Add useEffect to remove SSR loader on mount**

At the top of the CinematicHero component body (before other effects), add:

```tsx
// Dismiss SSR loading screen — React's own Loader takes over seamlessly
useEffect(() => {
  const el = document.getElementById('ssr-loader');
  if (el) el.remove();
}, []);
```

This runs once on mount. Since the React Loader is visually identical and already rendering, the user sees no change.

### Task 3: Fix Model Path

**Files:**
- Modify: `src/components/cinematic/NexApexScene.tsx`

**Step 1: Change Untitled.glb → need_some_space.glb**

Two locations:
- Line 53: `useGLTF('/models/Untitled.glb')` → `useGLTF('/models/need_some_space.glb')`
- Line 118: `useGLTF.preload('/models/Untitled.glb')` → `useGLTF.preload('/models/need_some_space.glb')`

### Task 4: Align BRAND_STOPS with Exact Brand Palette

**Files:**
- Modify: `src/components/cinematic/NexApexScene.tsx`

**Why:** Current BRAND_STOPS contain colors not in the brand system (#1d4f5a, #5ab9bb, #b9ccb4). Replace with exact brand colors from globals.css.

**Step 1: Replace BRAND_STOPS array**

Use only official brand colors:
```ts
const BRAND_STOPS = [
  { pos: 0.0, color: new THREE.Color('#0e1418') },   // --bg
  { pos: 0.10, color: new THREE.Color('#162029') },   // --surface
  { pos: 0.20, color: new THREE.Color('#1a2630') },   // --teal
  { pos: 0.30, color: new THREE.Color('#1d2d39') },   // --surface2
  { pos: 0.40, color: new THREE.Color('#253a49') },   // --surface3
  { pos: 0.50, color: new THREE.Color('#45596d') },   // --slate
  { pos: 0.65, color: new THREE.Color('#5ac8cb') },   // --cyan-dim
  { pos: 0.80, color: new THREE.Color('#94fcff') },   // --cyan
  { pos: 0.90, color: new THREE.Color('#b9afbb') },   // --mauve
  { pos: 1.0, color: new THREE.Color('#dfe4dc') },    // --sage
];
```

### Task 5: Build Verification

Run: `npx astro build`
Expected: Complete! with no errors.
