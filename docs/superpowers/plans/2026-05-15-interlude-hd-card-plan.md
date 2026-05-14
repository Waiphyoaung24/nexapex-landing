# Interlude HD Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full-viewport pinned `InterstitialBreathe` with a contained, auto-looping 16:9 HD media card that scrolls in normal page flow.

**Architecture:** Single-component rewrite of `src/components/InterstitialBreathe.tsx`. Drop ScrollTrigger pin, drop 150-frame canvas scrub machinery, drop mouse parallax. Replace with a static JSX tree: container → eyebrow → 16:9 aspect-video card with autoplay video + headline overlay → 3-column caption row. Keep brand tokens, copy, and section id intact.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, brand CSS tokens (`--color-nex-background`, brand cyan `#94fcff`). No GSAP / ScrollTrigger needed after this change.

**Spec:** `docs/superpowers/specs/2026-05-15-interlude-hd-card-design.md`

**Design references invoked during implementation:**
- Plugin skill `frontend-design:frontend-design` — for card surface quality (corner radius, ring, glow proportions)
- Plugin skill `ui-ux-pro-max:ui-ux-pro-max` — for headline scale + caption row hierarchy on a contained card
- MCP `context7` — only if needed for Next.js 16 `<video>` SSR caveats

---

## File Structure

| File | Responsibility | Change |
|------|---------------|--------|
| `src/components/InterstitialBreathe.tsx` | Renders the interlude section | Rewrite body |
| `src/app/(marketing)/page.tsx` | Uses `<InterstitialBreathe />` | No change — component API unchanged |
| `docs/superpowers/specs/2026-05-15-interlude-hd-card-design.md` | Approved spec | No change |

No new files. No CSS file changes. The component's public surface (`{ id?: string }` prop) and the rendered `id="breathe-section"` anchor are preserved so the marketing page wiring keeps working.

---

### Task 1: Rewrite `InterstitialBreathe.tsx` body

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx` (full body replacement, ~415 → ~110 lines)

- [ ] **Step 1: Confirm dev server is not running, to avoid HMR errors during the swap**

Run: `Get-Process node -ErrorAction SilentlyContinue`
Expected: Either no output, or you know which `node` PIDs you can leave running. If a dev server for this project is up, stop it before editing — a half-saved file will throw HMR errors that pollute the debug signal in Task 2.

- [ ] **Step 2: Replace the entire file with the new implementation**

Write `src/components/InterstitialBreathe.tsx` with exactly this content:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const VIDEO_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/v1778744291/Butterflies_flapping_flowers_swa__202605141433_ndqss3.mp4";
const POSTER_SRC =
  "https://res.cloudinary.com/dkk8ylzhy/video/upload/so_0,w_1280,q_auto/Butterflies_flapping_flowers_swa__202605141433_ndqss3.jpg";

export function InterstitialBreathe({ id }: { id?: string } = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    setMounted(true);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section
      id={id ?? "breathe-section"}
      role="region"
      aria-label="Interlude — Systems that breathe"
      className="relative bg-nex-background overflow-hidden py-16 md:py-28"
    >
      {/* Top seam fade — joins BrandSection above at the same bg token */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-32 z-[5]"
        style={{
          background:
            "linear-gradient(to bottom, #0e1418 0%, rgba(14,20,24,0.6) 55%, rgba(14,20,24,0) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 md:px-[60px]">
        {/* Eyebrow */}
        <p
          className={`mb-6 text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 transition-all duration-700 md:mb-10 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          02.5 / INTERLUDE
        </p>

        {/* HD media card — 16:9, capped at 1280px, brand-tinted ring + soft glow */}
        <div
          className={`relative mx-auto w-full max-w-[1280px] aspect-video overflow-hidden rounded-2xl ring-1 ring-[#94fcff]/15 transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{
            boxShadow:
              "0 30px 80px -20px rgba(148,252,255,0.18), 0 0 0 1px rgba(148,252,255,0.05)",
          }}
        >
          {reduceMotion ? (
            <img
              src={POSTER_SRC}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Vignette — keeps headline readable over butterflies */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(14,20,24,0) 0%, rgba(14,20,24,0.35) 70%, rgba(14,20,24,0.7) 100%)",
            }}
          />

          {/* Headline overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <h2
              className="select-none text-center font-normal uppercase text-white font-[family-name:var(--font-display)]"
              style={{
                fontSize: "clamp(2rem, 7vw, 6.5rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.025em",
                background:
                  "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #94fcff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 2px 30px rgba(0,0,0,0.4)",
              }}
            >
              SYSTEMS THAT BREATHE.
            </h2>
          </div>
        </div>

        {/* Caption row — 3-col on md+, stacked on mobile */}
        <div
          className={`mt-8 grid grid-cols-1 items-start gap-6 transition-all duration-1000 delay-200 md:mt-14 md:grid-cols-3 md:items-center ${
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
    </section>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: Exit 0, no errors. If there are pre-existing TS errors in other files, ensure none reference `InterstitialBreathe`.

- [ ] **Step 4: Start the dev server**

Run: `npm run dev`
Expected: Server boots on `http://localhost:3000` (or 3001 if 3000 is busy). No build errors mentioning `InterstitialBreathe`.

Keep this server running for Task 2.

---

### Task 2: Visual verification with Playwright

**Files:**
- Read-only (no edits). Uses dev server from Task 1.

This task validates the spec acceptance criteria. We are NOT writing unit tests — this component is pure presentation; the meaningful checks are visual.

- [ ] **Step 1: Capture a desktop screenshot (1920×1080)**

Use `mcp__plugin_playwright_playwright__browser_navigate` to open `http://localhost:3000`, `browser_resize` to 1920×1080, scroll to the breathe section, and `browser_take_screenshot` of full page.

Expected observations:
- The breathe section is **not** full viewport height — eyebrow, card, and caption row all visible within roughly 900–1000px of vertical space.
- The card is visibly contained: page background (`bg-nex-background`) shows on the left and right of the 1280px card.
- Card has rounded corners and a soft cyan-tinted glow.
- "SYSTEMS THAT BREATHE." sits centered inside the card and is fully readable.
- Top seam against `BrandSection` shows no visible band.

- [ ] **Step 2: Capture a tablet screenshot (768×1024)**

`browser_resize` to 768×1024, screenshot.

Expected:
- Card spans most of the width (with side gutters from `px-5`), still 16:9.
- Caption row is still 3-column at this width (`md:` breakpoint = 768px in Tailwind, so it's right at the edge — acceptable if it's 3-col or 1-col stacked; document whichever).

- [ ] **Step 3: Capture a mobile screenshot (375×812)**

`browser_resize` to 375×812, screenshot.

Expected:
- Card spans `calc(100vw - 40px)` with `px-5` gutters.
- Headline shrinks via clamp (`clamp(2rem, 7vw, 6.5rem)` resolves to ~2rem on a 375px viewport).
- Caption row is stacked vertically.

- [ ] **Step 4: Verify reduced-motion path**

In the Playwright browser, use `browser_evaluate` to set the media-query emulation, OR navigate with the page's reduced-motion preference. Reload, screenshot.

```js
// browser_evaluate snippet
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload();
```

Expected:
- No `<video>` element inside the card. Inspect the DOM via `browser_evaluate`:
  ```js
  document.querySelector('#breathe-section video') === null
  ```
  must return `true`.
- An `<img>` with the poster src is rendered instead.

- [ ] **Step 5: Verify scroll behavior (no pin)**

`browser_evaluate`:
```js
const sec = document.getElementById('breathe-section');
const before = sec.getBoundingClientRect().top;
window.scrollBy(0, 400);
await new Promise(r => setTimeout(r, 200));
const after = sec.getBoundingClientRect().top;
return { before, after, delta: after - before };
```

Expected: `delta` ≈ `-400` (section moved with the scroll, was NOT pinned). If `delta ≈ 0`, a pin is still active — debug.

- [ ] **Step 6: Acceptance criteria checklist**

Tick off each item from the spec against the screenshots:

1. [ ] Not full-viewport height
2. [ ] At ≥1280px viewport, card is 1280×720 (allow ±2px aspect rounding)
3. [ ] Rounded corners + ring + glow visible
4. [ ] Headline centered and readable
5. [ ] Video auto-loops, no pin spacer
6. [ ] Reduced-motion renders poster only
7. [ ] Top seam intact, no visible band
8. [ ] Section bg = `bg-nex-background`

If any item fails, return to Task 1 Step 2, adjust the offending block, and re-run Task 2.

---

### Task 3: Commit

**Files:** Stage only the two files we touched.

- [ ] **Step 1: Stop the dev server**

In the terminal running `npm run dev`, send Ctrl+C (or kill the background bash if started via `run_in_background`).

- [ ] **Step 2: Stage changes explicitly**

Run:
```powershell
git add src/components/InterstitialBreathe.tsx docs/superpowers/specs/2026-05-15-interlude-hd-card-design.md docs/superpowers/plans/2026-05-15-interlude-hd-card-plan.md
```

Verify with `git status` that no other files are staged. If unrelated files are staged from earlier work, **stop** and check with the user before proceeding.

- [ ] **Step 3: Commit**

Run:
```powershell
git commit -m @'
refactor(interlude): replace pinned full-viewport interlude with HD 16:9 card

- Remove ScrollTrigger pin + 150-frame canvas scrub + mouse parallax
- Render single autoplay video inside a contained 16:9 aspect card
- Cap card at 1280px so it reads as a deliberately HD frame on wide screens
- Re-scale headline clamp to the card, not the viewport
- Preserve eyebrow, caption row, brand CTAs, and section id

Spec: docs/superpowers/specs/2026-05-15-interlude-hd-card-design.md
Plan: docs/superpowers/plans/2026-05-15-interlude-hd-card-plan.md
'@
```

Expected: One commit on `nexapex-v3-demo`. Verify with `git log -1 --stat`.

---

## Self-Review

Spec coverage:
- "Contained 16:9 card, max 1280px" → Task 1 Step 2 (`max-w-[1280px] aspect-video`)
- "Rounded corners, ring, glow" → Task 1 Step 2 (`rounded-2xl ring-1 ring-[#94fcff]/15` + `boxShadow`)
- "Vignette overlay" → Task 1 Step 2 (radial gradient div)
- "Headline scaled to card" → Task 1 Step 2 (clamp 2rem→6.5rem)
- "Remove pin + frame capture + parallax" → covered by full file replacement (Task 1 Step 2)
- "Preserve eyebrow, headline copy, captions, CTAs, section id, aria-label, video/poster URLs" → all present in Task 1 Step 2
- "Reduced motion → poster img only" → Task 1 Step 2 (`reduceMotion ? <img> : <video>`) + Task 2 Step 4 verifies
- "Top seam fade preserved" → Task 1 Step 2 (top seam gradient div retained)
- "Responsive breakpoints" → Task 2 Steps 1–3 verify each breakpoint

Placeholder scan: no "TBD", "TODO", "implement appropriate", or vague directives. All code blocks contain the actual code.

Type consistency: Component prop signature `{ id?: string }` matches the existing call site in `src/app/(marketing)/page.tsx:31`. No renames.

No gaps.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-15-interlude-hd-card-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
