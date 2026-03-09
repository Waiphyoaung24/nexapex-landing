# Scroll Normalization — Uniform Lenis Behavior

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make scrolling feel uniform and native across all screens (mobile/desktop) and all pages (landing/work).

**Architecture:** Disable `syncTouch` on mobile so touch devices use native browser scroll (iOS/Android already have excellent built-in smooth scrolling). Lenis only smooths desktop wheel events. Remove all per-page conditional branching for touch settings. Keep `virtualScroll` wheel dampening for the long landing page only.

**Tech Stack:** Lenis ^1.3.17, GSAP ScrollTrigger

---

### Problem

The current Lenis config has 7+ conditional branches across device type (isTouch) and page (isWorkPage), creating unpredictable scroll behavior. `syncTouch: true` intercepts native mobile scroll and replaces it with Lenis physics, which fights the browser and never feels right regardless of multiplier tuning.

### Solution

| Concern | Desktop | Mobile |
|---------|---------|--------|
| Smooth scroll engine | Lenis (smoothWheel) | Native browser |
| syncTouch | false | false |
| wheelMultiplier | 0.7 (landing) / 1.0 (work) | N/A (no wheel on touch) |
| Touch scroll | N/A | Native — zero Lenis intervention |
| GSAP ScrollTrigger | Synced via `lenis.on('scroll')` | Synced via native scroll events |
| virtualScroll dampening | Landing only (shorter pages) | N/A |

### Task 1: Simplify Lenis config in Layout.astro

**File:** `src/layouts/Layout.astro` (lines 68-110)

Replace the entire Lenis initialization block with:

```typescript
const isWorkPage = window.location.pathname.startsWith('/work');

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: false,
  wheelMultiplier: isWorkPage ? 1.0 : 0.7,
  virtualScroll: (e) => {
    if (isWorkPage) return;
    const docH = document.documentElement.scrollHeight;
    const vpH = window.innerHeight;
    const pages = docH / vpH;
    const ref = 12;
    if (pages < ref) {
      const ratio = pages / ref;
      const scale = Math.max(0.45, ratio * ratio);
      e.deltaY *= scale;
      e.deltaX *= scale;
    }
  },
});
```

**What this removes:**
- `isTouch` detection (no longer needed)
- `hasHeavy3D` / `disableSyncTouch` logic
- All `syncTouchLerp`, `touchInertiaExponent`, `touchMultiplier` params
- All per-page touch conditionals

**What this keeps:**
- `smoothWheel: true` for desktop
- `wheelMultiplier` per-page (landing 0.7, work 1.0)
- `virtualScroll` dampening for short landing pages
- GSAP ScrollTrigger sync unchanged
