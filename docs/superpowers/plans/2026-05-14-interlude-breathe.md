# Interlude "Systems That Breathe" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scroll-pinned interstitial section between `BrandSection` and `EditorialHighlightSection` on the marketing landing. The section scrubs a butterflies/flowers video via a captured-frame canvas synchronized to scroll progress.

**Architecture:** One new client component `src/components/InterstitialBreathe.tsx`. On mount it captures every video frame to an array of offscreen `HTMLCanvasElement`s; on scroll the section pins for one viewport height and a GSAP `ScrollTrigger` redraws the visible canvas at `frameIndex = round(progress * (frames.length - 1))`. Three rendering profiles (Full ≥768px, Lite <768px autoplay, Static under `prefers-reduced-motion: reduce`) are picked once at mount.

**Tech Stack:** Next.js 16, React 19, GSAP 3.14 + `@gsap/react` (`useGSAP`), `ScrollTrigger` (already in deps), Lenis via existing `<SmoothScroll>`, Tailwind 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-14-interlude-breathe-design.md`

---

## File Structure

```
src/
├── components/
│   └── InterstitialBreathe.tsx        NEW (single client component, ~300 LOC)
├── styles/
│   └── globals.css                    EDIT (append liquid-glass + .interlude-title)
└── app/
    └── (marketing)/page.tsx           EDIT (one-line insert)
```

The component file is intentionally self-contained — capture logic, scrub logic, three render profiles, and JSX all in one file. Splitting earlier would invent abstractions for a single-use surface.

---

## Task 1: Add CSS additions to `globals.css`

**Files:**
- Modify: `src/styles/globals.css` (append at end)

- [ ] **Step 1: Read the end of globals.css to find the append point**

Run: open `src/styles/globals.css`, scroll to the last line.

Expected: file ends with existing utility/animation classes; we append new rules below.

- [ ] **Step 2: Append the liquid-glass + interlude-title classes**

Append to end of `src/styles/globals.css`:

```css
/* ── InterstitialBreathe section ──────────────────────────────────────── */

.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0) 60%,
    rgba(255, 255, 255, 0.15) 80%,
    rgba(255, 255, 255, 0.45) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}
.liquid-glass-strong::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0) 60%,
    rgba(255, 255, 255, 0.2) 80%,
    rgba(255, 255, 255, 0.5) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.interlude-title {
  font-family: var(--font-display, "Instrument Serif"), serif;
  font-style: italic;
  font-size: clamp(64px, 12vw, 220px);
  line-height: 0.92;
  letter-spacing: -0.02em;
  background: linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  text-align: center;
  user-select: none;
}
```

- [ ] **Step 3: Run typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS (CSS isn't lint-checked here, but TypeScript should be unaffected).

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "style(interlude): add liquid-glass + interlude-title classes"
```

---

## Task 2: Create the `InterstitialBreathe` component skeleton

Creates the file with profile detection, prop typing, refs, and an empty render that compiles. Subsequent tasks fill it in.

**Files:**
- Create: `src/components/InterstitialBreathe.tsx`

- [ ] **Step 1: Create the file with skeleton**

Create `src/components/InterstitialBreathe.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const VIDEO_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/v1778744291/Butterflies_flapping_flowers_swa__202605141433_ndqss3.mp4";
const POSTER_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/so_0,w_1280,q_auto/Butterflies_flapping_flowers_swa__202605141433_ndqss3.jpg";

const MAX_FRAMES = 150;
const MAX_WIDTH = 960;

type Profile = "full" | "lite" | "static";

function pickProfile(): Profile {
  if (typeof window === "undefined") return "full";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return "static";
  if (window.innerWidth < 768) return "lite";
  return "full";
}

export function InterstitialBreathe({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const [profile, setProfile] = useState<Profile>("full");

  useEffect(() => {
    setProfile(pickProfile());
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setProfile(pickProfile());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      role="region"
      aria-label="Interlude — Systems that breathe"
      className="relative bg-[#0e1418] overflow-hidden"
      style={{ height: profile === "full" ? "200vh" : undefined, minHeight: profile !== "full" ? "100svh" : undefined }}
    >
      <div ref={pinnedRef} className="relative h-screen w-full overflow-hidden">
        {/* Layers added in following tasks */}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS — no errors.

- [ ] **Step 3: Run dev server briefly to confirm import paths resolve**

Run: `npm run dev` (background), then visit `http://localhost:3000` once it's up.
Expected: existing landing renders unchanged (component not yet slotted in).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "feat(interlude): scaffold InterstitialBreathe component"
```

---

## Task 3: Implement the Static profile (reduced-motion fallback)

Renders just the Cloudinary poster as an `<img>` with the headline overlay. No video, no capture, no scroll behavior.

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx`

- [ ] **Step 1: Add Static branch to render**

Inside the `<div ref={pinnedRef}>` add a conditional render. Replace the placeholder comment with:

```tsx
{profile === "static" && (
  <>
    <img
      src={POSTER_SRC}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,20,24,0)_0%,_rgba(14,20,24,0.35)_70%,_rgba(14,20,24,0.7)_100%)]"
    />
    <InterludeContent profile="static" mounted={mounted} />
  </>
)}
```

- [ ] **Step 2: Add the `InterludeContent` helper inside the same file**

Above the `export function InterstitialBreathe`, add:

```tsx
function InterludeContent({
  profile,
  mounted,
}: {
  profile: Profile;
  mounted: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col">
      {/* Eyebrow */}
      <div className="flex justify-start px-5 pt-8 md:px-[60px] md:pt-12">
        <p className="text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50">
          02.5 / INTERLUDE
        </p>
      </div>

      {/* Headline — vertically centered */}
      <div
        className={`flex-1 flex items-center justify-center px-5 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <h2
          className="interlude-title"
          style={
            profile === "lite"
              ? { fontSize: "clamp(48px, 14vw, 96px)" }
              : undefined
          }
        >
          SYSTEMS THAT BREATHE.
        </h2>
      </div>

      {/* Bottom row */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 items-end gap-6 px-5 pb-10 md:px-[60px] md:pb-14 transition-all duration-1000 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[280px]">
          Built like nature: living systems, not static deliverables.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-3 px-6 py-3 border border-[#94fcff]/40 hover:border-[#94fcff] hover:bg-[#94fcff]/[0.06] transition-colors duration-300 text-[11px] font-mono uppercase tracking-[3px] text-[#94fcff]"
          >
            Start a project
            <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
              <path
                d="M0 4H21M21 4L17 1M21 4L17 7"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="square"
              />
            </svg>
          </Link>
          <Link
            href="#project-showcase"
            className="liquid-glass inline-flex items-center gap-3 rounded-full px-6 py-3 text-[11px] font-mono uppercase tracking-[3px] text-white hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
          >
            See work
            <svg width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
              <path
                d="M0 4H21M21 4L17 1M21 4L17 7"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="square"
              />
            </svg>
          </Link>
        </div>

        <p className="text-[13px] md:text-[14px] leading-[1.6] md:leading-[1.8] text-white/60 max-w-[280px] md:text-right md:justify-self-end">
          From a single prototype to a stack that runs every day.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Verify Static profile renders**

Temporarily force `setProfile("static")` in the mount effect (don't commit this change yet).
Run `npm run dev`, slot the component into `(marketing)/page.tsx` for visual test only (will be re-done properly in Task 9). Verify the poster + headline + bottom row render.

Revert the temporary `setProfile("static")` override.

- [ ] **Step 5: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "feat(interlude): implement static profile (reduced-motion fallback)"
```

---

## Task 4: Implement the Lite profile (mobile autoplay loop)

Renders the video as a native autoplay loop (no capture, no pin, no scrub). The section is `100svh` tall.

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx`

- [ ] **Step 1: Add Lite branch to render**

Inside `<div ref={pinnedRef}>`, after the Static block, add:

```tsx
{profile === "lite" && (
  <>
    <video
      src={VIDEO_SRC}
      poster={POSTER_SRC}
      autoPlay
      muted
      playsInline
      loop
      preload="metadata"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,20,24,0)_0%,_rgba(14,20,24,0.35)_70%,_rgba(14,20,24,0.7)_100%)]"
    />
    <InterludeContent profile="lite" mounted={mounted} />
  </>
)}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Verify Lite profile (DevTools mobile)**

Run `npm run dev`. Open Chrome DevTools → Device toolbar → iPhone 12 (390×844). Slot component temporarily into `(marketing)/page.tsx`. Verify:
- Section is exactly one viewport tall (no scroll runway).
- Video autoplays muted, loops.
- Headline is centered.
- Bottom row stacks vertically with `gap-6`.

Stop dev server. Revert any temporary `page.tsx` edits.

- [ ] **Step 4: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "feat(interlude): implement lite profile (mobile autoplay loop)"
```

---

## Task 5: Implement Full profile — frame capture

Adds the `<video>` element (hidden), the `<canvas>` element (visible after capture), and the capture effect that drains every frame into `framesRef.current`. No scrub yet.

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx`

- [ ] **Step 1: Add the capture effect**

Inside the `InterstitialBreathe` component, after the existing `useEffect` that sets `profile/mounted`, add:

```tsx
// Frame capture (Full profile only)
useEffect(() => {
  if (profile !== "full") return;
  const video = videoRef.current;
  if (!video) return;

  let capturing = true;
  let lastTime = -1;
  let raf = 0;
  const frames: HTMLCanvasElement[] = [];

  const captureFrame = () => {
    if (!capturing) return;
    if (video.readyState < 2) {
      raf = requestAnimationFrame(captureFrame);
      return;
    }
    if (video.currentTime === lastTime) {
      raf = requestAnimationFrame(captureFrame);
      return;
    }
    lastTime = video.currentTime;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    frames.push(canvas);
    if (frames.length >= MAX_FRAMES) {
      capturing = false;
      onCaptureDone();
      return;
    }
    if ("requestVideoFrameCallback" in video) {
      // @ts-expect-error — non-standard but widely supported
      video.requestVideoFrameCallback(captureFrame);
    } else {
      raf = requestAnimationFrame(captureFrame);
    }
  };

  const onCaptureDone = () => {
    framesRef.current = frames;
    setFramesReady(true);
    try {
      video.pause();
    } catch {}
  };

  const onLoaded = () => {
    video.play().catch(() => {});
    captureFrame();
  };

  const onEnded = () => {
    capturing = false;
    onCaptureDone();
  };

  video.addEventListener("loadedmetadata", onLoaded);
  video.addEventListener("ended", onEnded);
  if (video.readyState >= 1) onLoaded();

  return () => {
    capturing = false;
    cancelAnimationFrame(raf);
    video.removeEventListener("loadedmetadata", onLoaded);
    video.removeEventListener("ended", onEnded);
  };
}, [profile]);
```

- [ ] **Step 2: Add Full-profile JSX (video + canvas + poster fallback)**

Inside `<div ref={pinnedRef}>`, after the Lite block, add:

```tsx
{profile === "full" && (
  <>
    {/* Poster fallback until framesReady */}
    {!framesReady && (
      <img
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )}

    {/* Source video — hidden, only used to feed the capture loop */}
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      muted
      playsInline
      preload="auto"
      crossOrigin="anonymous"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover opacity-0 pointer-events-none"
      style={{ display: framesReady ? "none" : "block" }}
    />

    {/* Visible scrub target */}
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Animated butterflies and flowers"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ display: framesReady ? "block" : "none" }}
    />

    {/* Vignette */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,20,24,0)_0%,_rgba(14,20,24,0.35)_70%,_rgba(14,20,24,0.7)_100%)]"
    />

    <InterludeContent profile="full" mounted={mounted} />
  </>
)}
```

- [ ] **Step 3: Add an effect to size the canvas once frames are ready and draw frame 0**

Add a new `useEffect` after the capture effect:

```tsx
// Size canvas and draw initial frame once capture completes
useEffect(() => {
  if (!framesReady) return;
  const canvas = canvasRef.current;
  const frames = framesRef.current;
  if (!canvas || frames.length === 0) return;
  canvas.width = frames[0].width;
  canvas.height = frames[0].height;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(frames[0], 0, 0);
}, [framesReady]);
```

- [ ] **Step 4: Verify capture runs and canvas shows the first frame**

Run `npm run dev`. Temporarily slot the component into `(marketing)/page.tsx`. Open browser DevTools → Console.
Add a one-line debug log inside `onCaptureDone`: `console.log("[Interlude] frames captured:", frames.length)` — keep this in the working copy for now; we'll remove in Task 6.
Expected: console logs e.g. `[Interlude] frames captured: 137`. Canvas shows the still first frame.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "feat(interlude): capture video frames to offscreen canvases"
```

---

## Task 6: Implement Full profile — ScrollTrigger pin + canvas scrub

Drives the canvas frame index from scroll progress while pinning `pinnedRef` for one viewport's worth of scroll.

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx`

- [ ] **Step 1: Add the `useGSAP` hook for pin + scrub**

After the canvas-sizing effect, add:

```tsx
// Pin + scroll-scrub (Full profile only)
useGSAP(
  () => {
    if (profile !== "full") return;
    if (!framesReady) return;
    const section = sectionRef.current;
    const pinned = pinnedRef.current;
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!section || !pinned || !canvas || frames.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = { i: -1 };

    const drawFrame = (idx: number) => {
      if (idx === state.i) return;
      state.i = idx;
      ctx.drawImage(frames[idx], 0, 0);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=100%",
      pin: pinned,
      pinSpacing: true,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (frames.length - 1));
        drawFrame(idx);
      },
    });

    return () => {
      trigger.kill();
    };
  },
  { scope: sectionRef, dependencies: [profile, framesReady] },
);
```

- [ ] **Step 2: Remove the debug `console.log` from Task 5**

Delete the `console.log("[Interlude] frames captured:", frames.length)` line from `onCaptureDone`.

- [ ] **Step 3: Verify pin + scrub manually**

Run `npm run dev`. Temporarily slot the component into `(marketing)/page.tsx`. Scroll down to the section slowly.
Expected:
- Section pins as soon as its top reaches viewport top.
- Canvas frames advance in lockstep with scroll wheel.
- Section unpins when the equivalent of one viewport of scroll has elapsed; next section follows immediately with no gap.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "feat(interlude): pin section and scrub canvas to scroll progress"
```

---

## Task 7: Add parallax mouse tracking (Full profile, ≥1024px)

Adds the prompt's parallax effect on `pinnedRef` — `gsap.set` driven by a smoothed mouse offset. Disabled at <1024px and under reduced-motion.

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx`

- [ ] **Step 1: Add parallax effect**

After the `useGSAP` pin/scrub block, add:

```tsx
// Mouse parallax (Full profile, ≥1024px only)
useEffect(() => {
  if (profile !== "full") return;
  if (typeof window === "undefined") return;
  if (window.innerWidth < 1024) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const pinned = pinnedRef.current;
  if (!pinned) return;

  const STRENGTH = 20;
  const LERP = 0.06;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let raf = 0;

  const onMove = (e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = ((e.clientX - cx) / cx) * STRENGTH;
    targetY = ((e.clientY - cy) / cy) * STRENGTH;
  };

  const tick = () => {
    currentX += (targetX - currentX) * LERP;
    currentY += (targetY - currentY) * LERP;
    gsap.set(pinned, { x: currentX, y: currentY });
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener("mousemove", onMove);
  raf = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener("mousemove", onMove);
    cancelAnimationFrame(raf);
    gsap.set(pinned, { x: 0, y: 0 });
  };
}, [profile]);
```

- [ ] **Step 2: Add `scale-[1.06] origin-center` to `pinnedRef` so parallax has bleed**

Update the `pinnedRef` `<div>`:

```tsx
<div
  ref={pinnedRef}
  className="relative h-screen w-full overflow-hidden scale-[1.06] origin-center"
>
```

- [ ] **Step 3: Verify parallax**

Run `npm run dev`. Slot the component temporarily. Move mouse around the section.
Expected: subtle drift (≤20px) of the entire pinned wrapper, smoothing over ~0.5s. Disable on a narrow window — drift stops.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "feat(interlude): add smoothed mouse parallax on pinned wrapper"
```

---

## Task 8: Slot the component into the marketing page

This is the actual user-visible change.

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

- [ ] **Step 1: Read current imports + JSX**

Open `src/app/(marketing)/page.tsx`. Confirm the existing structure:

```tsx
import { BrandSection } from "@/components/BrandSection";
// ...
<BrandSection id="brand-section" />
<EditorialHighlightSection id="practice-section" />
```

- [ ] **Step 2: Add the import**

After the existing component imports, add:

```tsx
import { InterstitialBreathe } from "@/components/InterstitialBreathe";
```

- [ ] **Step 3: Add the JSX between `BrandSection` and `EditorialHighlightSection`**

Replace:

```tsx
<BrandSection id="brand-section" />
<EditorialHighlightSection id="practice-section" />
```

with:

```tsx
<BrandSection id="brand-section" />
<InterstitialBreathe id="breathe-section" />
<EditorialHighlightSection id="practice-section" />
```

- [ ] **Step 4: Run typecheck + lint + build**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(marketing)/page.tsx
git commit -m "feat(marketing): slot Interlude breathe section between Brand and Practice"
```

---

## Task 9: Visual verification

End-to-end manual sweep against the spec's verification list.

**Files:** none (verification only)

- [ ] **Step 1: Desktop (Full profile)**

Run `npm run dev`. Visit `http://localhost:3000`. Scroll from top.
Verify in order:
- BrandSection renders normally and ends on "Start a project" panel.
- New Interlude section enters: poster shows briefly, then canvas swaps in (no flash).
- Eyebrow `02.5 / INTERLUDE` visible top-left.
- Headline `SYSTEMS THAT BREATHE.` italic, large, gradient text-clip applied.
- Scroll: section pins, canvas scrubs through butterfly frames.
- Mouse motion: subtle parallax on the pinned wrapper.
- Section unpins cleanly into `02 / IN PRACTICE` with no visual seam (both share `#0e1418`).

- [ ] **Step 2: Tablet (768×1024)**

DevTools → device → iPad. Reload.
Expected: Full profile still active (≥768px). Same behavior but parallax is disabled.

- [ ] **Step 3: Mobile (iPhone 12, 390×844)**

DevTools → device → iPhone 12. Reload.
Expected: Lite profile. Video autoplays muted, section is exactly one viewport. No pin, no scrub. Bottom row stacked vertically.

- [ ] **Step 4: Reduced motion**

macOS: System Settings → Accessibility → Display → "Reduce motion". Reload.
Expected: Static profile. Poster image only, no video, no animation. Headline fades in once via opacity transition.

- [ ] **Step 5: Lighthouse**

DevTools → Lighthouse → Performance / Best Practices / Accessibility (desktop).
Run on `http://localhost:3000`.
Expected: Performance ≥90, Accessibility ≥95. If Performance drops noticeably from the pre-change baseline, profile the capture pass and confirm `MAX_FRAMES=150` is being hit promptly.

- [ ] **Step 6: Tab order**

Click on the BrandSection's last link, then press Tab repeatedly. Expected: focus flows through the Interlude's "Start a project" → "See work" → into EditorialHighlightSection's first focusable. No focus trap.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 8: Final commit (if any polish was applied during verification)**

If any tweaks were made during verification:

```bash
git add -A
git commit -m "polish(interlude): minor adjustments from visual review"
```

If nothing was changed: skip the commit.

---

## Done

All tasks complete when:
- The marketing page renders the new Interlude section between `BrandSection` and `EditorialHighlightSection`.
- Full / Lite / Static profiles all render correctly on their respective device classes.
- `npm run check` passes.
- All commits from Tasks 1–8 are on the branch.
