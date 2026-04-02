# ScrollSmoother Migration + Scroll Pause System

**Date:** 2026-04-03
**Status:** Approved
**Branch:** nexapex-v2

## Summary

Replace Lenis smooth scroll with GSAP ScrollSmoother. Add `smoother.paused(true/false)` at 5 section entry points with timed auto-resume and a minimal chevron scroll indicator.

## Motivation

The landing page needs deliberate pause moments at key sections to let content breathe and entrance animations play before the user continues scrolling. GSAP ScrollSmoother's native `.paused()` API provides this cleanly, and consolidates the scroll stack under GSAP (removing the Lenis dependency).

## Architecture

### ScrollSmoother Migration

**Remove:** Lenis package, `SmoothScroll.tsx` Lenis setup, all `scroller: document.querySelector("main")` from ScrollTrigger configs, `html/body { overflow: hidden }` CSS.

**Add:** ScrollSmoother with `#smooth-wrapper > #smooth-content` DOM structure.

**New DOM in `page.tsx`:**
```tsx
<>
  <Preloader />
  <Header />                    {/* fixed — outside wrapper */}
  <ScrollPauseIndicator />      {/* fixed — outside wrapper */}
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <HeroSection />
      <div id="three-showcase"><ThreeShowcase /></div>
      <div id="brand-section"><BrandSection /></div>
      <div id="clients-section"><ClientsSection /></div>
      <div id="project-showcase"><ProjectShowcase /></div>
      <div id="capabilities-section"><CapabilitiesSection /></div>
      <div id="cta-section"><CTASection /></div>
      <FooterSection />
    </div>
  </div>
</>
```

**New `SmoothScroll.tsx`:**
```tsx
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const smoother = ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth: 1.5,
  effects: true,
  normalizeScroll: true,
  smoothTouch: 0.1,
});
```

### Files to Update (scroller removal)

- `src/components/HeroSection.tsx` — remove `scroller` from 4 ScrollTriggers
- `src/components/ThreeShowcase.tsx` — remove `scroller` from pinned timeline ScrollTrigger
- `src/components/BrandSection.tsx` — remove `scroller` from ~8 ScrollTriggers
- `src/components/ClientsSection.tsx` — remove `scroller` from 2 ScrollTriggers
- `src/components/CapabilitiesSection.tsx` — remove `scroller` from ~6 ScrollTriggers, fix global kill bug
- `src/components/CTASection.tsx` — remove `scroller` from 3 ScrollTriggers
- `src/components/FooterSection.tsx` — remove `scroller` from 1 ScrollTrigger, fix global kill bug
- `src/app/globals.css` — remove `html, body { overflow: hidden; height: 100% }`

### CSS Changes

```css
/* REMOVE */
html, body { overflow: hidden; height: 100%; width: 100%; }

/* ADD */
#smooth-wrapper { overflow: hidden; position: fixed; width: 100%; height: 100%; top: 0; left: 0; }
#smooth-content { overflow: visible; width: 100%; }
```

## Scroll Pause System

### Pause Points

| # | Section | Trigger | Duration | Animation |
|---|---------|---------|----------|-----------|
| 1 | Vision Engine (ThreeShowcase panel 1) | Panel sub-animation enter | 1.5s | SplitText word reveal + camera shift |
| 2 | Language Core (ThreeShowcase panel 2) | Panel sub-animation enter | 1.5s | SplitText word reveal + camera shift |
| 3 | Who We Are (BrandSection) | Section top enters viewport | 1.5s | Headline char reveal + body fade |
| 4 | Capabilities | Section top enters viewport | 2.0s | Staggered card reveals |
| 5 | CTA (Let's Build) | Section top enters viewport | 1.5s | Heading SplitText + button scale |

### Pause Flow

```
1. ScrollTrigger.onEnter fires
2. Check pausedSections Set — skip if already paused
3. smoother.paused(true)
4. Show ScrollPauseIndicator (fade in)
5. Play section intro timeline
6. After timeline + delay → smoother.paused(false)
7. Hide ScrollPauseIndicator (fade out)
8. Add section ID to pausedSections Set
```

### ThreeShowcase Integration

ThreeShowcase is pinned for `+=4000px` with `scrub: 2`. Product card pauses happen INSIDE the pin by monitoring `scrollState.progress` thresholds in the `onUpdate` callback:
- Panel 1 (Vision Engine): pause at progress ~0.25
- Panel 2 (Language Core): pause at progress ~0.50

### First-Visit Only

A module-level `Set<string>` tracks paused section IDs. Each pause fires once per page load. Scrolling back through sections does not re-trigger pauses.

## ScrollPauseIndicator Component

**Position:** Fixed, bottom-center, z-index between content and Header.

**Visual:**
```
    |
    |   thin line, 40px height
    |   color: #94fcff (--nex-cyan)
    |
    V   chevron
 scroll down   (#6e7a84, uppercase, letter-spacing: 0.15em, 10px)
```

**Behavior:**
- Hidden by default (opacity: 0, pointerEvents: none)
- Fades in when smoother pauses, pulses opacity 0.3-1.0
- Fades out when smoother resumes
- `prefers-reduced-motion`: static, no pulse

## Risk Mitigation

| Risk | Solution |
|---|---|
| ThreeShowcase pin + paused() conflict | Pause at progress thresholds inside onUpdate, not at pin boundaries |
| Global ScrollTrigger.kill() in Footer/Capabilities | Fix: scope kills to component triggers only using `gsap.context()` |
| R3F Canvas transform stacking | Keep Canvas as position:fixed outside wrapper, or use data-speed="1" |
| Mobile responsiveness during pause | shorter durations (1s mobile vs 1.5s desktop), smoothTouch: 0.1 |
| prefers-reduced-motion | Skip all pauses, let animations play without stopping scroll |

## Dependencies

- `gsap: ^3.14.2` (already installed, Club with ScrollSmoother)
- Remove: `lenis: ^1.3.21`
