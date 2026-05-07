# Marketing Editorial Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing landing's pinned-curtain stack pattern with traditional vertical scroll, and apply a unified GSAP "Editorial" entrance choreography to the 5 main sections (Brand → CTA).

**Architecture:** A single shared hook `useEditorialReveal` in `src/lib/editorial-reveal.ts` defines the 4-beat entrance pattern (mono index → SplitText heading chars rise → body fade-rise → items stagger). Each section adds four CSS classes (`.editorial-index`, `.editorial-heading`, `.editorial-body`, `.editorial-item`) to existing elements and calls the hook with a section ref. ScrollSmoother stays. PageSlideSection, ScrollPauseIndicator, and `lib/scroll-pause.ts` are deleted. Hero loses `sticky top-0`.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind 4 · GSAP 3.14 (with `useGSAP`, `ScrollTrigger`, `ScrollSmoother`, `SplitText` plugins) · existing `@gsap/react` integration.

**Spec:** `docs/superpowers/specs/2026-05-08-marketing-editorial-scroll-design.md` (commits `e7c82db`, revised in `8a260b9`).

**Verification model:** This codebase has no Jest/RTL test runner. Each task ends with running the project's existing `npm run check` (`lint` + `typecheck` + `build`) and a focused manual smoke step. The hook is tested by wiring it into `ProjectShowcase` first (the simplest section) before being applied across the page.

---

## Task 1: Create the `useEditorialReveal` hook

**Files:**
- Create: `src/lib/editorial-reveal.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

interface EditorialRevealOptions {
  /** When false, skips Beat 1 (mono index reveal). Default: true. */
  hasIndex?: boolean;
  /** When false, animates the whole heading element instead of per-char SplitText. Default: true. */
  splitHeading?: boolean;
  /** When true, swaps body and heading delay so body fades in first (CTA inversion). Default: false. */
  bodyBeforeHeading?: boolean;
  /** ScrollTrigger start offset. Default: "top 80%". */
  startOffset?: string;
}

/**
 * Editorial entrance pattern — fires a 4-beat reveal once when the section
 * crosses `startOffset`. Replays in reverse on scroll-up.
 *
 * Beats (durations / eases / delays):
 *   1. .editorial-index   — y:16 → 0, opacity 0 → 0.6, 0.5s power2.out, delay 0
 *   2. .editorial-heading — split chars y:40 → 0, fade, 1.0s power4.out,
 *                            delay 0.15s, stagger 0.04s
 *   3. .editorial-body    — y:24 → 0, fade, 0.7s power3.out, delay 0.55s
 *   4. .editorial-item    — y:50 → 0, fade, 0.7s power3.out, delay 0.7s,
 *                            stagger 0.1s
 *
 * Total runtime ~1.4s. No-op when prefers-reduced-motion is set.
 */
export function useEditorialReveal(
  sectionRef: RefObject<HTMLElement | null>,
  options: EditorialRevealOptions = {},
) {
  const {
    hasIndex = true,
    splitHeading = true,
    bodyBeforeHeading = false,
    startOffset = "top 80%",
  } = options;

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) return;

      const trigger = {
        trigger: section,
        start: startOffset,
        toggleActions: "play none none reverse",
      } as const;

      // Beat 1 — mono index
      if (hasIndex) {
        const indexEl = section.querySelector(".editorial-index");
        if (indexEl) {
          gsap.from(indexEl, {
            y: 16,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: trigger,
          });
        }
      }

      // Compute beat-2/beat-3 delays based on bodyBeforeHeading
      const headingDelay = bodyBeforeHeading ? 0.55 : 0.15;
      const bodyDelay = bodyBeforeHeading ? 0.15 : 0.55;

      // Beat 2 — heading
      const headingEl = section.querySelector<HTMLElement>(".editorial-heading");
      let split: SplitText | null = null;
      if (headingEl) {
        if (splitHeading) {
          split = SplitText.create(headingEl, { type: "chars" });
          gsap.from(split.chars, {
            y: 40,
            autoAlpha: 0,
            duration: 1.0,
            ease: "power4.out",
            stagger: 0.04,
            delay: headingDelay,
            scrollTrigger: trigger,
          });
        } else {
          gsap.from(headingEl, {
            y: 40,
            autoAlpha: 0,
            duration: 1.0,
            ease: "power4.out",
            delay: headingDelay,
            scrollTrigger: trigger,
          });
        }
      }

      // Beat 3 — body (one or many)
      const bodyEls = section.querySelectorAll(".editorial-body");
      if (bodyEls.length) {
        gsap.from(bodyEls, {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          delay: bodyDelay,
          scrollTrigger: trigger,
        });
      }

      // Beat 4 — items
      const itemEls = section.querySelectorAll(".editorial-item");
      if (itemEls.length) {
        gsap.from(itemEls, {
          y: 50,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.7,
          scrollTrigger: trigger,
        });
      }

      return () => {
        split?.revert();
      };
    },
    {
      scope: sectionRef,
      dependencies: [hasIndex, splitHeading, bodyBeforeHeading, startOffset],
    },
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0, no errors.

- [ ] **Step 3: Verify lint passes**

Run:
```bash
npx eslint src/lib/editorial-reveal.ts
```
Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/editorial-reveal.ts
git commit -m "feat(marketing): add useEditorialReveal hook for unified entrance choreography

Defines the 4-beat reveal contract: mono index, SplitText heading chars,
body fade-rise, items stagger. Honors prefers-reduced-motion. Scoped to
a section ref via @gsap/react useGSAP."
```

---

## Task 2: Wire the hook into `ProjectShowcase` (smoke test the hook)

`ProjectShowcase` has no existing GSAP — wiring the hook here proves it works in isolation before touching sections that have their own animations.

**Files:**
- Modify: `src/components/ui/project-showcase.tsx`

- [ ] **Step 1: Add the hook import and a ref-based reveal**

Replace the top-of-file imports block:

```tsx
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"
```

with:

```tsx
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"
import { useEditorialReveal } from "@/lib/editorial-reveal"
```

- [ ] **Step 2: Call the hook on the existing section ref**

Inside the `ProjectShowcase` component body, after the `useEffect` block that runs the cursor-lerp animation (around line 68), add:

```tsx
  useEditorialReveal(containerRef as React.RefObject<HTMLElement | null>, {
    hasIndex: true,
  })
```

(`containerRef` is already a `useRef<HTMLDivElement>(null)` and points at the `<section>`. The cast widens the element type for the hook's signature.)

- [ ] **Step 3: Add the four reveal classes to existing elements**

In the JSX, find the header block and the project list. Apply these class additions (preserving existing classes):

3a. Add a new `.editorial-index` element above the existing `<p className="text-[11px] font-medium uppercase tracking-[3px] text-[#94fcff]/60 mb-2">Portfolio</p>`. Replace this header block:

```tsx
      <div className="mb-10 md:mb-14 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[3px] text-[#94fcff]/60 mb-2">
            Portfolio
          </p>
          <h2 className="text-2xl md:text-[40px] font-normal uppercase tracking-[2px] text-[#f0f1ef] font-[family-name:var(--font-display)] leading-tight">
            Selected Work
          </h2>
        </div>
        <p className="max-w-[280px] text-[11px] font-medium uppercase tracking-[1px] text-[#f0f1ef]/55 md:text-right">
          AI products built in-house, deployed for businesses across Southeast Asia.
        </p>
      </div>
```

with:

```tsx
      <div className="mb-10 md:mb-14 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="editorial-index text-[11px] font-medium uppercase tracking-[3px] text-[#94fcff]/60 mb-2" aria-hidden="true">
            03 / SELECTED WORK
          </p>
          <h2 className="editorial-heading text-2xl md:text-[40px] font-normal uppercase tracking-[2px] text-[#f0f1ef] font-[family-name:var(--font-display)] leading-tight">
            Selected Work
          </h2>
        </div>
        <p className="editorial-body max-w-[280px] text-[11px] font-medium uppercase tracking-[1px] text-[#f0f1ef]/55 md:text-right">
          AI products built in-house, deployed for businesses across Southeast Asia.
        </p>
      </div>
```

3b. Add `editorial-item` to each project link. Find the `<a>` inside `projects.map(...)` (the line that starts `<a key={project.title} ...>`). Change its `className` from:

```tsx
            className="group block cursor-pointer"
```

to:

```tsx
            className="editorial-item group block cursor-pointer"
```

- [ ] **Step 4: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/components/ui/project-showcase.tsx
```
Expected: both exit 0.

- [ ] **Step 5: Manual smoke (dev server)**

```bash
npm run dev
```

In a browser at `http://localhost:3000`, scroll past Hero down to the "Selected Work" section. With the current PageSlideSection still in place, the section will be pinned during reveal — the editorial entrance should still play once. Confirm:
- `03 / SELECTED WORK` mono label fades up first
- "Selected Work" heading characters cascade upward
- Right-rail caption rises
- Project rows enter staggered with a 100ms gap

If the reveal looks jittery because of the pin overlap, that's expected and resolved by Task 5 below. Stop the dev server (Ctrl+C) before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/project-showcase.tsx
git commit -m "feat(marketing): wire editorial reveal into ProjectShowcase

Adds the four reveal classes (.editorial-index/.editorial-heading/
.editorial-body/.editorial-item) to existing elements and calls
useEditorialReveal. New '03 / SELECTED WORK' mono index renders above
the heading."
```

---

## Task 3: Remove ScrollPauseIndicator and the scroll-pause infrastructure

`scroll-pause.ts` is effectively dead (its `DEFAULT_PAUSE_POINTS` is empty and `checkThreeShowcasePause` has no live caller in the marketing page). `ScrollPauseIndicator.tsx` listens to events `scroll-pause-start` / `scroll-pause-end` that nothing fires. Safe to delete after unwiring.

**Files:**
- Modify: `src/components/SmoothScroll.tsx`
- Modify: `src/app/(marketing)/page.tsx`
- Delete: `src/components/ScrollPauseIndicator.tsx`
- Delete: `src/lib/scroll-pause.ts`

- [ ] **Step 1: Strip `scroll-pause` calls from SmoothScroll**

Replace the entire contents of `src/components/SmoothScroll.tsx` with:

```tsx
"use client";

import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createContext, useContext, useEffect, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// Shared context so any component can access smoother.paused(), scrollTo(), etc.
const SmootherContext = createContext<ScrollSmoother | null>(null);
export const useSmoother = () => useContext(SmootherContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [smoother, setSmoother] = useState<ScrollSmoother | null>(null);

  useEffect(() => {
    const instance = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 2,
      speed: 0.25,
      effects: true,
      normalizeScroll: true,
      smoothTouch: 0.1,
    });

    setSmoother(instance);

    return () => {
      instance.kill();
    };
  }, []);

  return (
    <SmootherContext.Provider value={smoother}>
      {children}
    </SmootherContext.Provider>
  );
}
```

- [ ] **Step 2: Strip `<ScrollPauseIndicator />` from page.tsx**

In `src/app/(marketing)/page.tsx`:

Remove this import line:
```tsx
import { ScrollPauseIndicator } from "@/components/ScrollPauseIndicator";
```

Remove this JSX line (currently between `<Header />` and `<div id="smooth-wrapper">`):
```tsx
      <ScrollPauseIndicator />
```

- [ ] **Step 3: Delete the now-unused files**

```bash
rm src/components/ScrollPauseIndicator.tsx src/lib/scroll-pause.ts
```

- [ ] **Step 4: Verify nothing else imports the deleted symbols**

Use the Grep tool with pattern `ScrollPauseIndicator|scroll-pause|initScrollPauses|resetPauseState|checkThreeShowcasePause` over `src/`. Expected: no matches.

- [ ] **Step 5: Typecheck + lint + build**

```bash
npx tsc --noEmit
npx eslint src/components/SmoothScroll.tsx "src/app/(marketing)/page.tsx"
```
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/SmoothScroll.tsx "src/app/(marketing)/page.tsx"
git rm src/components/ScrollPauseIndicator.tsx src/lib/scroll-pause.ts
git commit -m "refactor(marketing): remove ScrollPauseIndicator and scroll-pause module

Both depend on the layered-stack pattern that's being removed. The
DEFAULT_PAUSE_POINTS array was already empty; the indicator listens
to events that nothing fires. SmoothScroll keeps its ScrollSmoother
config unchanged."
```

---

## Task 4: Strip `<PageSlideSection>` wrappers from page.tsx

Replaces each `<PageSlideSection ...><Section /></PageSlideSection>` with a bare `<Section />`. Each inner section already renders its own `<section>` element with appropriate styling.

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

Replace the file contents with:

```tsx
import { BrandSection } from "@/components/BrandSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ClientsSection } from "@/components/ClientsSection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Preloader } from "@/components/Preloader";
import { ProjectShowcase } from "@/components/ui/project-showcase";

export default function Home() {
  return (
    <>
      <Preloader />
      <Header />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroSection />
          <BrandSection id="brand-section" />
          <ClientsSection id="clients-section" />
          <div id="project-showcase" className="bg-[#0e1418] min-h-screen flex items-center">
            <ProjectShowcase />
          </div>
          <CapabilitiesSection id="capabilities-section" />
          <CTASection id="cta-section" />
          <FooterSection />
        </div>
      </div>
    </>
  );
}
```

Note: the `id` attributes that previously lived on the `<PageSlideSection>` wrappers are now passed as props into each section component. Each component will be modified in subsequent tasks to accept and apply that `id` to its root `<section>` element. `ProjectShowcase` is wrapped in a plain `<div id="project-showcase">` because that component does not currently accept an id prop and adding one is out of this task's scope (its root `<section>` would also work, but the wrapping div was already used in the previous version).

- [ ] **Step 2: Verify the import for `PageSlideSection` is gone**

Use Grep on `src/app/(marketing)/page.tsx` for `PageSlideSection`. Expected: no matches.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

This will produce errors about each section component not accepting an `id` prop. That's expected — we'll add the id props in Tasks 6–10. To unblock typechecking until then, the next step (4) makes the props optional via temporary lint-suppress.

- [ ] **Step 4: Add temporary id props (will be made permanent in component-level tasks)**

For each of these four files, find the function signature line and add an `{ id }: { id?: string }` parameter. Apply the `id` to the root `<section>` element.

4a. `src/components/BrandSection.tsx` — change `export function BrandSection() {` to:
```tsx
export function BrandSection({ id }: { id?: string } = {}) {
```
And change the root `<section ref={sectionRef} className="relative bg-[#0e1418] overflow-hidden">` to include `id={id}`:
```tsx
    <section id={id} ref={sectionRef} className="relative bg-[#0e1418] overflow-hidden">
```

4b. `src/components/ClientsSection.tsx` — change `export function ClientsSection() {` to:
```tsx
export function ClientsSection({ id }: { id?: string } = {}) {
```
And change the root `<section>` to include `id={id}`:
```tsx
    <section id={id} ref={sectionRef} className="bg-[#0e1418] min-h-screen flex flex-col justify-center overflow-hidden py-10 md:py-0">
```

4c. `src/components/CapabilitiesSection.tsx` — change `export function CapabilitiesSection() {` to:
```tsx
export function CapabilitiesSection({ id }: { id?: string } = {}) {
```
And change the root `<section>` to include `id={id}`:
```tsx
    <section
      id={id}
      ref={sectionRef}
      className="relative bg-[#0e1418] text-white min-h-[100dvh] flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-[60px]"
    >
```

4d. `src/components/CTASection.tsx` — change `export function CTASection() {` to:
```tsx
export function CTASection({ id }: { id?: string } = {}) {
```
And change the root `<section>` to include `id={id}`:
```tsx
    <section
      id={id}
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0e1418] text-white"
    >
```

- [ ] **Step 5: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(marketing)/page.tsx" src/components/BrandSection.tsx src/components/ClientsSection.tsx src/components/CapabilitiesSection.tsx src/components/CTASection.tsx
```
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(marketing)/page.tsx" src/components/BrandSection.tsx src/components/ClientsSection.tsx src/components/CapabilitiesSection.tsx src/components/CTASection.tsx
git commit -m "refactor(marketing): drop PageSlideSection wrappers, pass id as prop

Sections now flow in normal scroll order — no pinning, no clipPath
curtains. Each section accepts an optional id prop applied to its
root <section> element to preserve anchor-link behavior from the
Header navigation."
```

---

## Task 5: Delete `PageSlideSection.tsx`

**Files:**
- Delete: `src/components/PageSlideSection.tsx`

- [ ] **Step 1: Verify nothing imports it**

Use Grep on `src/` for `PageSlideSection`. Expected: no matches.

- [ ] **Step 2: Delete the file**

```bash
rm src/components/PageSlideSection.tsx
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git rm src/components/PageSlideSection.tsx
git commit -m "refactor(marketing): delete PageSlideSection component

Pin + clipPath stack pattern is gone from page.tsx in the previous
commit, leaving this file unused."
```

---

## Task 6: Remove `sticky top-0` from HeroSection

Hero's sticky positioning was infrastructure for the layered-stack pattern. With sections flowing naturally, sticky causes Hero to overlap BrandSection visually.

**Files:**
- Modify: `src/components/HeroSection.tsx`

- [ ] **Step 1: Edit the section className**

In `src/components/HeroSection.tsx`, find this block (around line 117):

```tsx
    <section
      ref={sectionRef}
      className={cn(
        "sticky top-0 min-h-[100dvh] h-screen w-full overflow-hidden",
        className,
      )}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
```

Replace with:

```tsx
    <section
      ref={sectionRef}
      className={cn(
        "relative min-h-[100dvh] h-screen w-full overflow-hidden",
        className,
      )}
      style={{ contain: "layout style paint", isolation: "isolate" }}
    >
```

(Just `sticky top-0` → `relative`. Everything else unchanged.)

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/components/HeroSection.tsx
```
Expected: both exit 0.

- [ ] **Step 3: Manual smoke**

```bash
npm run dev
```

Visit `http://localhost:3000`. Confirm:
- Hero fills the first viewport
- On scrolling down, BrandSection comes IMMEDIATELY after Hero — Hero scrolls off the top, BrandSection takes its place
- No section pinning anywhere — scrolling feels like a normal smooth-scrolled page
- The ProjectShowcase entrance from Task 2 fires when "Selected Work" hits 80% of the viewport

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "refactor(marketing): remove sticky positioning from HeroSection

Hero was sticky to support the layered PageSlideSection stack. With
sections now flowing naturally, sticky caused Hero to overlap
BrandSection. Switched to relative."
```

---

## Task 7: Wire editorial reveal into BrandSection

Replaces BrandSection's existing inline GSAP (headline char reveal, scrubbed statement word-fade, body cascade, pillar cards, divider draw) with the unified hook.

**Files:**
- Modify: `src/components/BrandSection.tsx`

- [ ] **Step 1: Replace the entire file contents**

Replace `src/components/BrandSection.tsx` with:

```tsx
"use client";

import { useRef } from "react";
import { useEditorialReveal } from "@/lib/editorial-reveal";

const PILLARS = [
  {
    num: "01",
    title: "Computer Vision",
    body: "From quality control on the factory floor to inventory tracking in retail — our vision systems see what humans miss and work around the clock.",
  },
  {
    num: "02",
    title: "AI Assistants",
    body: "Custom-trained language models that understand your business, speak your customers’ language, and handle the conversations that slow your team down.",
  },
  {
    num: "03",
    title: "Document Intelligence",
    body: "Invoices, receipts, contracts — our extraction pipelines turn stacks of paperwork into structured, searchable data in seconds.",
  },
];

export function BrandSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  return (
    <section id={id} ref={sectionRef} className="relative bg-[#0e1418] overflow-hidden">

      {/* ── Section Headline — centered, same style as ThreeShowcase ── */}
      <div className="section-headline flex flex-col items-center justify-center py-8 md:py-20 pointer-events-none">
        <p
          className="editorial-index text-[10px] mt-5 font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3"
          aria-hidden="true"
        >
          01 / WHO WE ARE
        </p>
        <h2
          className="editorial-heading section-headline-title font-normal uppercase tracking-[3px] text-center leading-[1.1] font-[family-name:var(--font-display)]"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 4rem)",
            background:
              "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          Who We Are
        </h2>
        <div className="mt-4 h-px w-12 md:w-16 bg-[#94fcff]/30" />
      </div>

      {/* ── 1. Brand Statement ── */}
      <div className="px-5 md:px-[60px] pb-6 md:pb-16">
        <div className="brand-divider h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-6 md:mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-16">
          {/* Left — large statement */}
          <div className="md:col-span-7">
            <h2
              className="editorial-body brand-statement font-normal uppercase leading-[0.92] tracking-[-0.01em] text-white font-[family-name:var(--font-display)]"
              style={{ fontSize: "clamp(1.6rem, 5vw, 4.5rem)" }}
            >
              We build AI solutions{"\n"}
              that transform how{"\n"}
              businesses operate
            </h2>
          </div>

          {/* Right — supporting text + location badge */}
          <div className="md:col-span-5 flex flex-col justify-end gap-4 md:gap-6">
            <p className="editorial-body brand-statement-body text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[400px]">
              NexApex is an AI solutions studio based in Southeast Asia.
              We design, build, and deploy production AI &mdash; from computer vision
              to intelligent assistants &mdash; for businesses ready to move faster
              than their competition.
            </p>
            {/* Location badge */}
            <div className="editorial-body brand-statement-body flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#94fcff]/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#94fcff]" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]/70">
                Based in Bangkok, Thailand
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Three Pillars ── */}
      <div className="px-5 md:px-[60px] pb-6 md:pb-16">
        <div className="brand-divider h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-6 md:mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="editorial-item pillar-card group relative p-4 md:p-10 border-l-0 md:border-l border-[#94fcff]/10 md:first:border-l-0 border-b border-[#94fcff]/10 md:border-b-0 last:border-b-0"
            >
              {/* Number */}
              <span className="block text-[11px] font-mono text-[#94fcff]/30 tracking-wider mb-2 md:mb-6">
                {pillar.num}
              </span>

              {/* Title */}
              <h3 className="text-base md:text-xl font-normal uppercase tracking-[1px] text-white font-[family-name:var(--font-display)] mb-2 md:mb-4">
                {pillar.title}
              </h3>

              {/* Body */}
              <p className="text-[12px] md:text-[13px] leading-[1.5] md:leading-[1.7] text-white/55">
                {pillar.body}
              </p>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-6 md:left-10 right-6 md:right-10 h-px bg-[#94fcff]/0 group-hover:bg-[#94fcff]/20 transition-colors duration-500" />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
```

What changed:
- All inline GSAP imports/registrations and the `useGSAP` block are gone
- A single `useEditorialReveal(sectionRef)` call replaces ~120 lines of bespoke animation
- New `editorial-index` element renders `01 / WHO WE ARE` above the headline
- The `Who We Are` h2 gains the `editorial-heading` class (chars will SplitText-reveal)
- The brand statement (`We build AI…`), the supporting paragraph, and the location badge each gain `editorial-body` (they all rise together at beat 3)
- Each pillar card gains `editorial-item` (they rise staggered at beat 4)
- The `.brand-divider` divider-draw animation is removed — dividers render in place. The gradient shape itself still feels deliberate.

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/components/BrandSection.tsx
```
Expected: both exit 0.

- [ ] **Step 3: Manual smoke**

```bash
npm run dev
```

Scroll into the BrandSection and confirm beat order:
1. `01 / WHO WE ARE` mono index fades up
2. `WHO WE ARE` characters cascade up (~1s)
3. The `We build AI…` statement, the right-rail body paragraph, and the location badge all rise together at ~0.55s
4. The 3 pillar cards (Computer Vision / AI Assistants / Document Intelligence) rise with a 100ms stagger at ~0.7s

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/BrandSection.tsx
git commit -m "refactor(marketing): replace BrandSection animations with editorial reveal

Drops the inline SplitText headline, scrubbed statement word-fade,
body cascade, pillar entrance, and divider-draw timelines in favor
of the unified useEditorialReveal hook. Adds a '01 / WHO WE ARE'
mono index above the headline. Pillar trio (Computer Vision / AI
Assistants / Document Intelligence) becomes editorial-items."
```

---

## Task 8: Wire editorial reveal into ClientsSection

ClientsSection has a small inline GSAP block (heading + desc fade-rise). The CSS marquee animation on the logo strip is independent and stays.

**Files:**
- Modify: `src/components/ClientsSection.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `src/components/ClientsSection.tsx` with:

```tsx
"use client";

import { useRef } from "react";
import { useEditorialReveal } from "@/lib/editorial-reveal";

const row1 = [
  { src: "/images/logos/logo--python.svg", alt: "Python" },
  { src: "/images/logos/logo--pytorch.svg", alt: "PyTorch" },
  { src: "/images/logos/logo--tensorflow.svg", alt: "TensorFlow" },
  { src: "/images/logos/logo--openai.svg", alt: "OpenAI" },
  { src: "/images/logos/logo--flutter.svg", alt: "Flutter" },
  { src: "/images/logos/logo--react.svg", alt: "React" },
];

const row2 = [
  { src: "/images/logos/logo--fastapi.svg", alt: "FastAPI" },
  { src: "/images/logos/logo--postgresql.svg", alt: "PostgreSQL" },
  { src: "/images/logos/logo--docker.svg", alt: "Docker" },
  { src: "/images/logos/logo--vercel.svg", alt: "Vercel" },
  { src: "/images/logos/logo--nextjs.svg", alt: "Next.js" },
  { src: "/images/logos/logo--tailwindcss.svg", alt: "Tailwind CSS" },
];

function MarqueeRow({ logos, direction, duration }: {
  logos: typeof row1;
  direction: "left" | "right";
  duration: number;
}) {
  // Duplicate enough times to fill viewport + overflow
  const allLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max gap-3 md:gap-5"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {allLogos.map((logo, i) => (
          <div
            key={`${logo.alt}-${i}`}
            className="group flex items-center justify-center rounded-lg md:rounded-xl border border-white/[0.06] bg-white/[0.02] w-[120px] h-[75px] md:w-[180px] md:h-[100px] shrink-0 hover:border-[#94fcff]/15 hover:bg-white/[0.04] transition-all duration-300"
          >
            <img
              src={logo.src}
              alt={`${logo.alt} logo`}
              className="max-h-[24px] md:max-h-[40px] w-auto opacity-60 group-hover:opacity-90 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientsSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="bg-[#0e1418] min-h-screen flex flex-col justify-center overflow-hidden py-10 md:py-0"
    >
      {/* Header row */}
      <div className="mb-8 md:mb-12 flex flex-col gap-3 px-5 md:flex-row md:items-start md:justify-between md:px-[60px]">
        <div>
          <p
            className="editorial-index text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3"
            aria-hidden="true"
          >
            02 / TECHNOLOGIES
          </p>
          <h2
            className="editorial-heading clients-heading font-normal uppercase tracking-[2px] font-[family-name:var(--font-display)]"
            style={{
              fontSize: "clamp(1.25rem, 3vw, 2.5rem)",
              background:
                "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Technologies We Work With
          </h2>
        </div>
        <p className="editorial-body clients-desc max-w-[280px] text-[10px] font-medium uppercase tracking-[1.5px] text-white/55 md:text-right leading-[1.6] md:leading-[1.8]">
          Production-grade tools powering our AI solutions across vision, language, and documents.
        </p>
      </div>

      {/* Scrolling logo rows — CSS infinite marquee */}
      <div className="editorial-item flex flex-col gap-3 md:gap-4">
        <MarqueeRow logos={row1} direction="left" duration={30} />
        <MarqueeRow logos={row2} direction="right" duration={35} />
      </div>
    </section>
  );
}
```

What changed:
- All inline GSAP imports/registrations and the `useGSAP` block are gone
- `useEditorialReveal(sectionRef)` is called instead
- `02 / TECHNOLOGIES` mono index added (wrapped with the heading in a new `<div>`)
- Heading gains `editorial-heading`
- Right-rail caption gains `editorial-body`
- The marquee rows wrapper gains `editorial-item` so the whole logo strip rises together once. The CSS marquee animation on the rows themselves is unchanged and continuous.

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/components/ClientsSection.tsx
```
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/ClientsSection.tsx
git commit -m "refactor(marketing): wire editorial reveal into ClientsSection

Drops inline GSAP heading/desc fade in favor of useEditorialReveal.
Adds '02 / TECHNOLOGIES' mono index above the heading. The marquee
strip rises as a single .editorial-item; the per-row infinite CSS
marquee animation is unchanged."
```

---

## Task 9: Wire editorial reveal into CapabilitiesSection

CapabilitiesSection keeps its 4-card layout and content. Inline `gsap.from` calls on heading, desc, and cards are replaced by the hook. The per-card `.skill-item` slide-in and `.cat-btn` scale-in stay inline (tertiary detail animations).

**Files:**
- Modify: `src/components/CapabilitiesSection.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `src/components/CapabilitiesSection.tsx` with:

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEditorialReveal } from "@/lib/editorial-reveal";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface Capability {
  title: string;
  icon: string;
  skills: string[];
}

const capabilities: Capability[] = [
  {
    title: "Vision",
    icon: "V",
    skills: [
      "Object Detection & Classification",
      "Quality Control & Inspection",
      "Inventory & Asset Tracking",
      "Real-Time Camera Analytics",
      "Custom Model Training",
    ],
  },
  {
    title: "Language",
    icon: "L",
    skills: [
      "Custom AI Assistants",
      "Multilingual Chat (EN/MY/TH)",
      "Business Process Automation",
      "Knowledge Base Integration",
      "Fine-Tuned LLM Deployment",
    ],
  },
  {
    title: "Documents",
    icon: "D",
    skills: [
      "OCR & Text Extraction",
      "Invoice & Receipt Processing",
      "Contract Data Mining",
      "Structured Data Export",
      "Multi-Format Support",
    ],
  },
  {
    title: "Delivery",
    icon: "→",
    skills: [
      "End-to-End Development",
      "Mobile & Web Deployment",
      "API Integration",
      "Model Monitoring & Retraining",
      "Ongoing Support & Maintenance",
    ],
  },
];

const categoryButtons = ["v", "l", "d", "→"];

function CapabilityCard({
  capability,
  className,
}: {
  capability: Capability;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "editorial-item capability-card bg-white text-[#0e1418] rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col",
        "transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 cursor-pointer",
        className,
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      {/* Card header */}
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <h3 className="text-[12px] sm:text-[14px] lg:text-[16px] font-bold uppercase tracking-wide">
          {capability.title}
        </h3>
        <span className="text-[14px] sm:text-[18px] lg:text-[20px] font-bold font-mono text-[#0e1418]/40">
          {capability.icon}
        </span>
      </div>

      {/* Skills list */}
      <div className="flex-1">
        {capability.skills.map((skill) => (
          <div
            key={skill}
            className="skill-item py-1.5 sm:py-2 lg:py-2.5 border-b border-dotted border-black/15 text-[10px] sm:text-[11px] lg:text-[13px] leading-tight"
          >
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilitiesSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  // Tertiary detail animations: cat-btn scale-in + per-card skill-item slide-in.
  // Kept inline because they're decorative chrome, not part of the editorial beat.
  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    const cards = section.querySelectorAll<HTMLElement>(".capability-card");
    cards.forEach((card) => {
      const skillItems = card.querySelectorAll(".skill-item");
      gsap.from(skillItems, {
        x: -15,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: isDesktop ? "top 75%" : "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });

    const catBtns = section.querySelectorAll(".cat-btn");
    gsap.from(catBtns, {
      scale: 0,
      autoAlpha: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: section.querySelector(".capabilities-heading"),
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative bg-[#0e1418] text-white min-h-[100dvh] flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-[60px]"
    >
      {/* Top area: heading left, description+buttons right */}
      <div className="flex flex-col gap-2 mb-4 sm:mb-5 md:flex-row md:justify-between md:items-end md:mb-8">
        <div>
          <p
            className="editorial-index text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3"
            aria-hidden="true"
          >
            04 / WHAT WE DO
          </p>
          <h2
            className="editorial-heading capabilities-heading text-[clamp(1.8rem,7vw,90px)] font-normal uppercase leading-[0.9] font-[family-name:var(--font-display)]"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            WHAT WE
            <br />
            <span className="ml-[0.3em] md:ml-[0.5em]">DO</span>
          </h2>
        </div>
        <div className="capabilities-desc max-w-[280px]">
          <p className="editorial-body text-[10px] sm:text-[11px] font-medium uppercase tracking-[1px] text-white/70 leading-relaxed">
            AI SOLUTIONS THAT SHIP &mdash; FROM PROTOTYPE TO PRODUCTION,
            BUILT FOR REAL BUSINESSES.
          </p>
          <div className="flex gap-1.5 sm:gap-2 mt-3">
            {categoryButtons.map((label) => (
              <span
                key={label}
                className="cat-btn w-7 h-7 sm:w-8 sm:h-8 border border-white/20 rounded text-[11px] sm:text-[12px] font-mono flex items-center justify-center text-white/50"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid — 2 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.title} capability={capability} />
        ))}
      </div>
    </section>
  );
}
```

What changed:
- Inline `gsap.from` on `.capabilities-heading`, `.capabilities-desc`, and `.capability-card` removed
- `useEditorialReveal(sectionRef)` added
- `04 / WHAT WE DO` mono index renders above the heading; `editorial-index` class
- Heading gains `editorial-heading` (preserved gradient fill)
- Description paragraph gains `editorial-body`
- Each `CapabilityCard` gains `editorial-item` via the className composition in `cn(...)`
- The two tertiary animations (`.skill-item` slide-in inside each card, `.cat-btn` scale-in) remain in a focused inline `useGSAP` call — they fire AFTER the card lands so they don't fight beat 4

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/components/CapabilitiesSection.tsx
```
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/CapabilitiesSection.tsx
git commit -m "refactor(marketing): wire editorial reveal into CapabilitiesSection

Adds '04 / WHAT WE DO' mono index above the heading. Heading, desc,
and the four capability cards are now driven by useEditorialReveal.
Per-card skill-item slide-in and cat-btn scale-in are kept as tertiary
detail animations inline. 4-card layout (Vision/Language/Documents/
Delivery) is unchanged."
```

---

## Task 10: Wire editorial reveal into CTASection

CTA gets the editorial reveal with two non-default options: `hasIndex: false` (closing moment, no number), and `bodyBeforeHeading: true` (tagline appears before the giant heading).

**Files:**
- Modify: `src/components/CTASection.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `src/components/CTASection.tsx` with:

```tsx
"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useEditorialReveal } from "@/lib/editorial-reveal";
import { cn } from "@/lib/utils";

export function CTASection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef, {
    hasIndex: false,
    bodyBeforeHeading: true,
  });

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0e1418] text-white"
    >
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:py-32 md:px-[60px] lg:py-48">
        {/* Tagline */}
        <p className="editorial-body cta-tagline text-[10px] sm:text-[11px] font-mono uppercase tracking-[3px] sm:tracking-[4px] text-white/70 mb-4 sm:mb-6">
          Ready to see AI in action?
        </p>

        {/* Main heading */}
        <h2
          className="editorial-heading cta-heading font-[family-name:var(--font-display)] uppercase text-center leading-[0.95] tracking-[-0.01em] text-white"
          style={{
            fontSize: "clamp(1.8rem, 7vw, 7rem)",
            background:
              "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Let&apos;s build<br />something real.
        </h2>

        {/* Primary CTA */}
        <a
          href="mailto:nexuslab.dev.mm@gmail.com"
          className={cn(
            "editorial-item cta-button mt-8 sm:mt-12 z-10 group",
            "flex items-center gap-2 sm:gap-3",
            "rounded-full bg-white px-6 py-3 sm:px-8 sm:py-4",
            "font-mono text-[11px] sm:text-[12px] font-medium uppercase tracking-[1px] text-[#0e1418]",
            "cursor-pointer transition-all duration-300",
            "hover:bg-white/95 hover:shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:scale-[1.03]",
            "active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Book a Consultation
          <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </section>
  );
}
```

What changed:
- All inline GSAP imports/registrations and the `useGSAP` block are gone
- `useEditorialReveal(sectionRef, { hasIndex: false, bodyBeforeHeading: true })` replaces the four inline timelines (tagline / heading split / CTA fade / heading gradient apply)
- The gradient fill on the heading was previously applied via JS per-word inside the SplitText callback — now it's a normal `style.background` block on the h2, identical visual result, simpler markup
- `editorial-body` on the tagline (rises first, beat order inverted)
- `editorial-heading` on the h2 (chars cascade after tagline lands)
- `editorial-item` on the CTA button

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit
npx eslint src/components/CTASection.tsx
```
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/CTASection.tsx
git commit -m "refactor(marketing): wire editorial reveal into CTASection

Uses hasIndex:false (no number on the closing moment) and
bodyBeforeHeading:true so 'Ready to see AI in action?' fades in
before the giant 'Let's build something real.' heading. Inline
SplitText/per-word gradient JS replaced by a normal CSS gradient
on the h2. CTA button becomes the editorial-item."
```

---

## Task 11: Final verification

- [ ] **Step 1: Run the project's check script**

```bash
npm run check
```
Expected: lint, typecheck, and build all pass with exit 0. The build step compiles the production bundle and surfaces any issues that didn't show up in `npx tsc --noEmit`.

- [ ] **Step 2: Manual visual verification (dev server)**

```bash
npm run dev
```

Visit `http://localhost:3000` and verify each section in order:

| Section | Look for |
|---|---|
| Hero | Fills first viewport. Existing AI Lab text intro plays. NOT sticky — Hero scrolls off normally. |
| BrandSection | `01 / WHO WE ARE` mono index fades up first. `Who We Are` heading chars cascade. Statement + body + location badge rise together. The 3 pillar cards (Computer Vision / AI Assistants / Document Intelligence) rise with stagger. |
| ClientsSection | `02 / TECHNOLOGIES` index. `Technologies We Work With` chars cascade. Right-rail caption rises. Logo marquee strip rises as one block; per-row CSS marquee continues looping. |
| ProjectShowcase | `03 / SELECTED WORK` index. Heading chars cascade. Right-rail caption rises. The 3 project rows rise with stagger. Hover image-preview behavior unchanged. |
| CapabilitiesSection | `04 / WHAT WE DO` index. `WHAT WE DO` chars cascade. Description rises. The 4 white cards (Vision/Language/Documents/Delivery) rise with stagger. Inside each card, skill items slide in from left after the card lands. Category buttons scale in. |
| CTASection | Tagline `Ready to see AI in action?` rises FIRST. `Let's build something real.` heading chars cascade after. `Book a Consultation` button rises last. No mono index. |
| FooterSection | Renders as before. No editorial choreography (out of scope). |

Confirm:
- The page scrolls naturally — no section pins, no clipPath curtains, no floating "scroll paused" indicator
- ScrollSmoother inertia still feels buttery
- All anchor IDs (brand-section, clients-section, project-showcase, capabilities-section, cta-section) still resolve when clicked from the Header nav
- No console errors

Stop the dev server.

- [ ] **Step 3: Reduced-motion check**

In Chrome DevTools, open the Rendering tab and set `Emulate CSS media feature prefers-reduced-motion` to `reduce`. Reload the page. Confirm:
- Every section's content renders in its final state immediately on entering the viewport
- No staggered character cascades, no rises, no fades
- The page is fully functional without any motion (the marquee logo strip's CSS animation is paused per the existing globals.css `prefers-reduced-motion` block)

- [ ] **Step 4: Commit any remaining stragglers**

If `npm run check` produced cosmetic changes (e.g., a Next.js cache update committed to `.next/`), confirm those are gitignored. There should be nothing left to commit at this point. If there is, commit it as:

```bash
git add <files>
git commit -m "chore(marketing): post-implementation cleanup"
```

- [ ] **Step 5: Push the branch**

```bash
git push origin nexapex-v3-demo
```

The branch should now be ahead of origin by approximately 9 commits (one per task plus the earlier spec commits).

---

## Self-review

**Spec coverage:**
- Decision 1 (traditional scroll, no pin/clipPath) — Tasks 4, 5
- Decision 2 (strip pin+clipPath, keep ScrollSmoother, Hero loses sticky) — Tasks 3, 4, 5, 6
- Decision 3 (Editorial flavor, top 80%, no scrub) — Task 1
- Decision 4 (Brand → CTA) — Tasks 7, 8, 2, 9, 10 (note: ProjectShowcase wired in Task 2 as hook smoke test, not in scroll order)
- Decision 5 (Capabilities animation-only, no redesign) — Task 9
- Acceptance criterion 1 (normal flow) — Task 11 step 2
- Acceptance criterion 2 (4-beat reveal at top 80%) — Task 11 step 2
- Acceptance criterion 3 (Capabilities 4-card grid + new mono index) — Task 9
- Acceptance criterion 4 (no ScrollPauseIndicator) — Task 3
- Acceptance criterion 5 (reduced-motion respected) — Task 11 step 3
- Acceptance criterion 6 (npm run check passes) — Task 11 step 1

All spec items are covered.

**Placeholder scan:** No "TBD", "TODO", "implement later", "appropriate error handling", or referenced-but-undefined symbols. All file paths are exact. All steps with code show the code in full.

**Type consistency:** Hook signature (`useEditorialReveal(ref, options)`), the four reveal classes (`.editorial-index`, `.editorial-heading`, `.editorial-body`, `.editorial-item`), and the `id?: string` prop shape are consistent across Tasks 1, 2, 4, 7, 8, 9, 10.

**Open questions:** None.
