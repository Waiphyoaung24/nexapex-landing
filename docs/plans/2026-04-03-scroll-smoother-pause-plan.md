# ScrollSmoother Migration + Scroll Pause Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Lenis smooth scroll with GSAP ScrollSmoother and add `smoother.paused()` at 5 section entry points with timed auto-resume and a minimal chevron scroll indicator.

**Architecture:** Remove Lenis entirely. Create ScrollSmoother with `#smooth-wrapper > #smooth-content` DOM structure. Expose smoother instance via React context so pause orchestrator and components can call `smoother.paused(true/false)`. Each pause fires once per page load, tracked by a `Set<string>`.

**Tech Stack:** GSAP 3.14 (ScrollSmoother, ScrollTrigger, SplitText), React 19, Next.js 16, Tailwind 4

---

### Task 1: Replace SmoothScroll.tsx — Lenis to ScrollSmoother

**Files:**
- Modify: `src/components/SmoothScroll.tsx` (full rewrite, lines 1-46)

**Step 1: Rewrite SmoothScroll.tsx**

Replace entire file with:

```tsx
"use client";

import { useEffect, useRef, createContext, useContext } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// Shared context so any component can access smoother.paused(), scrollTo(), etc.
const SmootherContext = createContext<ScrollSmoother | null>(null);
export const useSmoother = () => useContext(SmootherContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const smootherRef = useRef<ScrollSmoother | null>(null);

  useEffect(() => {
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.5,
      effects: true,
      normalizeScroll: true,
      smoothTouch: 0.1,
    });

    smootherRef.current = smoother;

    return () => {
      smoother.kill();
    };
  }, []);

  return (
    <SmootherContext.Provider value={smootherRef.current}>
      {children}
    </SmootherContext.Provider>
  );
}
```

**Step 2: Verify build compiles**

Run: `cd /c/Users/wai19/Desktop/Projects/AI-Tools/Nexus_AI_Lab\(Project\)/NexApex-web/nexapex && npx next build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/SmoothScroll.tsx
git commit -m "refactor: replace Lenis with GSAP ScrollSmoother provider"
```

---

### Task 2: Update page.tsx DOM Structure

**Files:**
- Modify: `src/app/page.tsx` (lines 1-34)

**Step 1: Update page.tsx**

Replace the entire file with the new DOM structure. Key changes:
- Remove `<SmoothScroll />` null component
- Wrap sections in `#smooth-wrapper > #smooth-content`
- Move `<Header />` outside the wrapper (it's fixed)
- Remove `<main>` tag and its `h-screen overflow-y-auto overflow-x-hidden` classes

```tsx
import { BrandSection } from "@/components/BrandSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ClientsSection } from "@/components/ClientsSection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Preloader } from "@/components/Preloader";
import { ThreeShowcase } from "@/components/ThreeShowcase";
import { ProjectShowcase } from "@/components/ui/project-showcase";
import { ScrollPauseIndicator } from "@/components/ScrollPauseIndicator";

export default function Home() {
  return (
    <>
      <Preloader />
      <Header />
      <ScrollPauseIndicator />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroSection />
          <div id="three-showcase"><ThreeShowcase /></div>
          <div id="brand-section"><BrandSection /></div>
          <div id="clients-section"><ClientsSection /></div>
          <div id="project-showcase" className="bg-[#0e1418]">
            <ProjectShowcase />
          </div>
          <div id="capabilities-section"><CapabilitiesSection /></div>
          <div id="cta-section"><CTASection /></div>
          <FooterSection />
        </div>
      </div>
    </>
  );
}
```

**Note:** `ScrollPauseIndicator` doesn't exist yet — it will be created in Task 6. Create a placeholder first:

Create: `src/components/ScrollPauseIndicator.tsx`

```tsx
"use client";

export function ScrollPauseIndicator() {
  return null; // placeholder — implemented in Task 6
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx src/components/ScrollPauseIndicator.tsx
git commit -m "refactor: update page.tsx DOM for ScrollSmoother wrapper structure"
```

---

### Task 3: Update globals.css

**Files:**
- Modify: `src/app/globals.css` (lines 114-119)

**Step 1: Replace overflow rules with ScrollSmoother styles**

Find and replace lines 114-119:

```css
/* OLD — remove these lines: */
/* NexApex global styles */
html, body {
  overflow: hidden;
  height: 100%;
  width: 100%;
}
```

Replace with:

```css
/* ScrollSmoother wrapper */
#smooth-wrapper {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

#smooth-content {
  overflow: visible;
  width: 100%;
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor: replace overflow:hidden with ScrollSmoother wrapper CSS"
```

---

### Task 4: Remove scroller from All Components

**Files:**
- Modify: `src/components/HeroSection.tsx` (lines 88-89, 107, 140, 155, 170)
- Modify: `src/components/ThreeShowcase.tsx` (lines 189-190, 197)
- Modify: `src/components/BrandSection.tsx` (lines 37-38, 47, 58, 84, 101, 119, 136)
- Modify: `src/components/ClientsSection.tsx` (lines 69-70, 77, 85)
- Modify: `src/components/CapabilitiesSection.tsx` (lines 123-124, 146, 160, 175, 190, 204, 211-213)
- Modify: `src/components/CTASection.tsx` (lines 110-111, 119, 128, 135)
- Modify: `src/components/FooterSection.tsx` (lines 26-27, 43, 58-59)

**Step 1: In EVERY file listed above, make these changes:**

**Pattern A — Remove scroller variable declaration:**
Every component has a line like:
```tsx
const scroller = document.querySelector("main");
if (!scroller) return;
```
DELETE both lines.

**Pattern B — Remove scroller from every ScrollTrigger config:**
Every `scrollTrigger: { ... scroller, ... }` or `scrollTrigger: { ... scroller ... }` — remove the `scroller` property (or `scroller,` including the comma).

For example in HeroSection.tsx line 107:
```tsx
// BEFORE:
scrollTrigger: {
  trigger: section,
  scroller,
  start: "top top",
  end: "bottom top",
  scrub: true,
},

// AFTER:
scrollTrigger: {
  trigger: section,
  start: "top top",
  end: "bottom top",
  scrub: true,
},
```

Apply this pattern to ALL ScrollTrigger configs in all 7 files.

**Step 2: Fix global ScrollTrigger.kill() bugs**

In `CapabilitiesSection.tsx` lines 211-213, replace:
```tsx
return () => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
};
```
With: DELETE the entire return cleanup — `useEffect` cleanup should NOT kill ALL ScrollTriggers globally. The component doesn't own all triggers. If needed, use `gsap.context()` scoping instead (which `useGSAP` already handles).

In `FooterSection.tsx` lines 58-59, same fix — delete:
```tsx
return () => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
};
```

**Step 3: Fix FooterSection scrollToTop**

In `FooterSection.tsx` line 17-19, replace:
```tsx
const scrollToTop = () => {
  const main = document.querySelector("main");
  main?.scrollTo({ top: 0, behavior: "smooth" });
};
```
With:
```tsx
const scrollToTop = () => {
  // ScrollSmoother scrolls the native body/window
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

**Step 4: Convert CapabilitiesSection and FooterSection from useEffect to useGSAP**

`CapabilitiesSection.tsx` uses `useEffect` (line 119) instead of `useGSAP`. This means ScrollTrigger cleanup isn't scoped. Convert:

Replace `useEffect(() => {` at line 119 with `useGSAP(() => {`.
Remove the manual cleanup `return () => { ... }` block (lines 211-213).
Add `}, { scope: sectionRef });` as the closing.
Add `import { useGSAP } from "@gsap/react";` to imports if not present.
Add `useGSAP` to the `gsap.registerPlugin(...)` call if not present.

`FooterSection.tsx` also uses `useEffect` (line 21). Same conversion:
Replace `useEffect(() => {` with `useGSAP(() => {`.
Remove manual cleanup (lines 58-59).
Close with `}, { scope: footerRef });`.
Add `useGSAP` import and register.

**Step 5: Verify build**

Run: `npx next build 2>&1 | tail -20`

**Step 6: Commit**

```bash
git add src/components/HeroSection.tsx src/components/ThreeShowcase.tsx src/components/BrandSection.tsx src/components/ClientsSection.tsx src/components/CapabilitiesSection.tsx src/components/CTASection.tsx src/components/FooterSection.tsx
git commit -m "refactor: remove scroller prop from all ScrollTriggers, fix global kill bugs"
```

---

### Task 5: Wire SmoothScrollProvider into Layout

**Files:**
- Modify: `src/app/layout.tsx` (or wherever the root layout lives)

**Step 1: Find root layout**

Check `src/app/layout.tsx` for the root layout component.

**Step 2: Wrap children with SmoothScrollProvider**

Import and wrap:
```tsx
import { SmoothScrollProvider } from "@/components/SmoothScroll";

// Inside the layout return, wrap {children}:
<SmoothScrollProvider>
  {children}
</SmoothScrollProvider>
```

**Important:** The provider must be inside the `<body>` but outside the `#smooth-wrapper`. Since `SmoothScrollProvider` now renders children (not null), and page.tsx contains the `#smooth-wrapper` div, this works naturally.

**Step 3: Verify dev server works**

Run: `npx next dev` and check `http://localhost:3000` in browser.

**Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wire SmoothScrollProvider into root layout"
```

---

### Task 6: Create ScrollPauseIndicator Component

**Files:**
- Modify: `src/components/ScrollPauseIndicator.tsx` (replace placeholder)

**Step 1: Implement the indicator**

```tsx
"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function ScrollPauseIndicator() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Start hidden
    gsap.set(el, { autoAlpha: 0, y: 10 });

    // Reduced motion: no pulse
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      pulseRef.current = gsap.to(el, {
        autoAlpha: 1,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut",
        paused: true,
      });
    }

    // Listen for custom events from pause orchestrator
    const show = () => {
      gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" });
      pulseRef.current?.play();
    };
    const hide = () => {
      pulseRef.current?.pause();
      gsap.to(el, { autoAlpha: 0, y: 10, duration: 0.3, ease: "power2.in" });
    };

    window.addEventListener("scroll-pause-start", show);
    window.addEventListener("scroll-pause-end", hide);

    return () => {
      window.removeEventListener("scroll-pause-start", show);
      window.removeEventListener("scroll-pause-end", hide);
      pulseRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[45] flex flex-col items-center gap-2 pointer-events-none"
      style={{ visibility: "hidden", opacity: 0 }}
    >
      {/* Thin line */}
      <div className="w-px h-10 bg-[#94fcff]/60" />
      {/* Chevron */}
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-[#94fcff]">
        <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Text */}
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6e7a84]">
        scroll down
      </span>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ScrollPauseIndicator.tsx
git commit -m "feat: implement ScrollPauseIndicator with pulse animation"
```

---

### Task 7: Create Scroll Pause Orchestrator

**Files:**
- Create: `src/lib/scroll-pause.ts`

**Step 1: Create the pause orchestrator module**

This module exports a function that sets up ScrollTrigger-based pauses and calls `smoother.paused()`.

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PausePoint {
  id: string;
  trigger: string;            // CSS selector for ScrollTrigger trigger element
  start?: string;             // ScrollTrigger start (default: "top 70%")
  pauseDuration?: number;     // seconds (default: 1.5)
  mobileDuration?: number;    // shorter on mobile (default: 1.0)
}

const DEFAULT_PAUSE_POINTS: PausePoint[] = [
  { id: "brand-section",        trigger: "#brand-section",        start: "top 70%", pauseDuration: 1.5, mobileDuration: 1.0 },
  { id: "capabilities-section", trigger: "#capabilities-section", start: "top 70%", pauseDuration: 2.0, mobileDuration: 1.2 },
  { id: "cta-section",          trigger: "#cta-section",          start: "top 70%", pauseDuration: 1.5, mobileDuration: 1.0 },
];

const pausedSections = new Set<string>();

export function initScrollPauses(smoother: ScrollSmoother, points: PausePoint[] = DEFAULT_PAUSE_POINTS) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // skip all pauses

  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  points.forEach((point) => {
    ScrollTrigger.create({
      trigger: point.trigger,
      start: point.start || "top 70%",
      once: true,  // fire only once
      onEnter: () => {
        if (pausedSections.has(point.id)) return;
        pausedSections.add(point.id);

        // Pause smooth scroll
        smoother.paused(true);

        // Show indicator
        window.dispatchEvent(new CustomEvent("scroll-pause-start"));

        // Auto-resume after delay
        const duration = isMobile ? (point.mobileDuration || 1.0) : (point.pauseDuration || 1.5);
        gsap.delayedCall(duration, () => {
          smoother.paused(false);
          window.dispatchEvent(new CustomEvent("scroll-pause-end"));
        });
      },
    });
  });
}

/**
 * ThreeShowcase panel pauses — called from inside ThreeShowcase's onUpdate.
 * progress thresholds: panel1 ~0.20-0.25, panel2 ~0.45-0.50
 */
const panelPaused = new Set<number>();

export function checkThreeShowcasePause(smoother: ScrollSmoother, progress: number) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const duration = isMobile ? 1.0 : 1.5;

  // Panel 1 (Vision Engine): pause at progress ~0.22
  if (progress >= 0.22 && progress <= 0.28 && !panelPaused.has(1)) {
    panelPaused.add(1);
    smoother.paused(true);
    window.dispatchEvent(new CustomEvent("scroll-pause-start"));
    gsap.delayedCall(duration, () => {
      smoother.paused(false);
      window.dispatchEvent(new CustomEvent("scroll-pause-end"));
    });
  }

  // Panel 2 (Language Core): pause at progress ~0.47
  if (progress >= 0.47 && progress <= 0.53 && !panelPaused.has(2)) {
    panelPaused.add(2);
    smoother.paused(true);
    window.dispatchEvent(new CustomEvent("scroll-pause-start"));
    gsap.delayedCall(duration, () => {
      smoother.paused(false);
      window.dispatchEvent(new CustomEvent("scroll-pause-end"));
    });
  }
}

export function resetPauseState() {
  pausedSections.clear();
  panelPaused.clear();
}
```

**Step 2: Commit**

```bash
git add src/lib/scroll-pause.ts
git commit -m "feat: create scroll-pause orchestrator with smoother.paused()"
```

---

### Task 8: Wire Pause Orchestrator into SmoothScrollProvider

**Files:**
- Modify: `src/components/SmoothScroll.tsx`

**Step 1: Import and call initScrollPauses after smoother creation**

Update the `useEffect` in `SmoothScrollProvider`:

```tsx
import { initScrollPauses, resetPauseState } from "@/lib/scroll-pause";

// Inside useEffect, after smoother creation:
useEffect(() => {
  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5,
    effects: true,
    normalizeScroll: true,
    smoothTouch: 0.1,
  });

  smootherRef.current = smoother;

  // Initialize scroll pause points (Brand, Capabilities, CTA)
  initScrollPauses(smoother);

  return () => {
    resetPauseState();
    smoother.kill();
  };
}, []);
```

**Step 2: Commit**

```bash
git add src/components/SmoothScroll.tsx
git commit -m "feat: wire scroll-pause orchestrator into SmoothScrollProvider"
```

---

### Task 9: Wire ThreeShowcase Panel Pauses

**Files:**
- Modify: `src/components/ThreeShowcase.tsx` (lines 181-184, around the onScrollProgress callback)

**Step 1: Import checkThreeShowcasePause and useSmoother**

Add to imports:
```tsx
import { useSmoother } from "./SmoothScroll";
import { checkThreeShowcasePause } from "@/lib/scroll-pause";
```

**Step 2: Get smoother ref inside ThreeShowcase**

Inside the `ThreeShowcase` component (after useState declarations, around line 179):
```tsx
const smoother = useSmoother();
```

**Step 3: Update onScrollProgress callback**

Modify the `onScrollProgress` callback (line 181-184):

```tsx
const onScrollProgress = useCallback((p: number) => {
  scrollState.progress = p;
  setActivePanel(Math.min(Math.floor(p * 4), 3));
  // Check if we should pause at panel entry points
  if (smoother) {
    checkThreeShowcasePause(smoother, p);
  }
}, [smoother]);
```

**Step 4: Commit**

```bash
git add src/components/ThreeShowcase.tsx
git commit -m "feat: wire ThreeShowcase panel pauses via scroll-pause orchestrator"
```

---

### Task 10: Build, Test, and Fix

**Step 1: Run build**

```bash
npx next build 2>&1 | tail -30
```

Fix any TypeScript or import errors.

**Step 2: Run dev server and test in browser**

```bash
npx next dev
```

Check:
- Smooth scroll works (no jerky motion)
- ThreeShowcase 3D scene still renders and camera moves on scroll
- Scroll pauses at panel 1 (~22% of ThreeShowcase) and panel 2 (~47%)
- Scroll pauses at Brand section, Capabilities section, CTA section
- Chevron indicator appears during pauses and disappears on resume
- Each pause fires only once (scrolling back doesn't re-trigger)
- Mobile: shorter pause durations
- `prefers-reduced-motion`: no pauses, no pulse

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: ScrollSmoother migration complete with 5 scroll pause points"
```

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/SmoothScroll.tsx` | Rewrite | Lenis → ScrollSmoother + context provider |
| `src/app/page.tsx` | Modify | `#smooth-wrapper > #smooth-content` DOM |
| `src/app/globals.css` | Modify | Remove `overflow:hidden`, add wrapper CSS |
| `src/components/HeroSection.tsx` | Modify | Remove `scroller` from ScrollTriggers |
| `src/components/ThreeShowcase.tsx` | Modify | Remove `scroller`, add panel pause calls |
| `src/components/BrandSection.tsx` | Modify | Remove `scroller` from ScrollTriggers |
| `src/components/ClientsSection.tsx` | Modify | Remove `scroller` from ScrollTriggers |
| `src/components/CapabilitiesSection.tsx` | Modify | Remove `scroller`, fix global kill, convert to useGSAP |
| `src/components/CTASection.tsx` | Modify | Remove `scroller` from ScrollTriggers |
| `src/components/FooterSection.tsx` | Modify | Remove `scroller`, fix global kill, fix scrollToTop, convert to useGSAP |
| `src/components/ScrollPauseIndicator.tsx` | Create | Fixed chevron indicator with pulse animation |
| `src/lib/scroll-pause.ts` | Create | Pause orchestrator with smoother.paused() |
| `src/app/layout.tsx` | Modify | Wrap with SmoothScrollProvider |

## Key Docs References

- GSAP ScrollSmoother: https://gsap.com/docs/v3/Plugins/ScrollSmoother
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger
- `smoother.paused()`: https://gsap.com/docs/v3/Plugins/ScrollSmoother/paused()
- GSAP React (`useGSAP`): https://gsap.com/docs/v3/GSAP/gsap.context()
