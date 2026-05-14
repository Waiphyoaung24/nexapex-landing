# Section Seam Fix + Background Token Unification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the visible color band between `BrandSection` and `InterstitialBreathe` on the marketing landing page, and make `--color-nex-background` the canonical token for section-level deep backgrounds.

**Architecture:** Two narrow changes. (A) Add a top-edge linear-fade overlay inside `InterstitialBreathe`, mirroring the existing seam-blend pattern at `BrandSection.tsx:134–141`. (B) Replace `bg-[#0e1418]` with `bg-nex-background` on the root `<section>` (or page wrapper) of 11 marketing files. Internal usages (hover states, modals, gradient stops, JS color constants) are intentionally left untouched.

**Tech Stack:** Next.js 16, React 19, Tailwind v4 with `@theme inline` tokens, GSAP, Astro (legacy, unused on this route). No test framework — verification is manual via dev server.

**Spec:** `docs/superpowers/specs/2026-05-14-section-seam-and-bg-token-design.md`

---

### Task 1: Add the top-edge fade overlay to InterstitialBreathe

**Files:**
- Modify: `src/components/InterstitialBreathe.tsx` around line 331

**Context for the implementer:**
`InterstitialBreathe.tsx` is the "02.5 / INTERLUDE" section. Its current structure (line 325–405):

```tsx
<section ... className="relative bg-[#0e1418] overflow-hidden">
  <div ref={pinnedRef} className="relative h-screen w-full overflow-hidden">
    <div ref={bgRef} className="absolute inset-0 scale-[1.06] ...">
      {/* poster img / lite video / full canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(...)]" />  {/* radial vignette */}
    </div>
    <InterludeContent profile={profile} mounted={mounted} />  {/* uses z-20 internally */}
  </div>
</section>
```

The radial vignette (line 396–399) only dims corners. The top edge of the butterfly canvas is still bluer than the solid `#0e1418` of `BrandSection` above it. We add a top-edge linear fade sibling to `bgRef` (inside `pinnedRef`) so it shares the pinned-wrapper's clip area and gets pinned along with the canvas.

`InterludeContent` renders headline text at `z-20` (see `InterstitialBreathe.tsx:39`). Our overlay at `z-[5]` sits above the bg layer (default z) but below the headline.

- [ ] **Step 1: Read the current section render**

Run: open `src/components/InterstitialBreathe.tsx` lines 325–406. Confirm the structure matches the snippet above. Confirm `InterludeContent` uses `z-20` (line 39).

- [ ] **Step 2: Insert the top-edge fade overlay**

Edit `src/components/InterstitialBreathe.tsx`. Inside the `<div ref={pinnedRef} ...>` block, immediately after the `<div ref={bgRef} ...>...</div>` block closes and before `<InterludeContent ... />`, add:

```tsx
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 md:h-40 z-[5]"
          style={{
            background:
              "linear-gradient(to bottom, #0e1418 0%, rgba(14,20,24,0.6) 55%, rgba(14,20,24,0) 100%)",
          }}
        />
```

The full structure after the edit should be:

```tsx
<div ref={pinnedRef} className="relative h-screen w-full overflow-hidden">
  <div ref={bgRef} className="absolute inset-0 scale-[1.06] origin-center will-change-transform">
    {/* ...existing poster/video/canvas + radial vignette... */}
  </div>

  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 top-0 h-32 md:h-40 z-[5]"
    style={{
      background:
        "linear-gradient(to bottom, #0e1418 0%, rgba(14,20,24,0.6) 55%, rgba(14,20,24,0) 100%)",
    }}
  />

  <InterludeContent profile={profile} mounted={mounted} />
</div>
```

- [ ] **Step 3: Start the dev server**

Run: `npm run dev`
Expected: Next.js starts on `http://localhost:3000` (or the configured port). Wait for "Ready" log line.

- [ ] **Step 4: Visual check at the Brand→Interlude boundary**

Open `http://localhost:3000/` in a browser at 1920×1080. Scroll until the `BrandSection` ends and the "02.5 / INTERLUDE" eyebrow comes into view. The top of the butterfly canvas should dissolve smoothly into `#0e1418` — no perceptible band where `BrandSection` ends and `InterstitialBreathe` begins.

If a band is still visible, the gradient height may be too short. Try `h-40 md:h-56` (160px / 224px) and re-check. If the headline text "02.5 / INTERLUDE" looks tinted, confirm `InterludeContent` is still at `z-20` and the overlay at `z-[5]`.

- [ ] **Step 5: Check the three profiles**

The component picks a profile based on viewport and `prefers-reduced-motion` (see `pickProfile()` at line 23). Verify the overlay works for all three:

- `full` profile: desktop viewport ≥768px, motion enabled. Default in most browsers.
- `lite` profile: resize browser to <768px width. Refresh page. Scroll to Interlude. Fade should still be visible.
- `static` profile: in DevTools rendering panel, set "Emulate CSS prefers-reduced-motion: reduce". Refresh. Static poster image should still show fade at top.

Each profile renders different bg content (poster / video / canvas), but the overlay is a sibling — it must apply uniformly.

- [ ] **Step 6: Commit**

```bash
git add src/components/InterstitialBreathe.tsx
git commit -m "fix(interlude): add top-edge linear fade to eliminate Brand→Interlude seam

The butterfly canvas in InterstitialBreathe was only darkened by a radial
vignette (rgba(14,20,24,0.7) at corners), so its top edge leaked blue
against the solid #0e1418 of BrandSection above. Add a top-edge linear
gradient overlay (h-32 md:h-40, z-[5]) inside the pinned wrapper that
fades from solid #0e1418 down to transparent, mirroring the seam-blend
pattern already used at BrandSection.tsx:134–141.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add canonical-token comment to globals.css

**Files:**
- Modify: `src/styles/globals.css:15`

**Context:** The token `--color-nex-background: #0e1418` already exists at line 15 of `globals.css` and auto-generates the `bg-nex-background` Tailwind utility under `@theme inline`. Section components have been using the literal `bg-[#0e1418]` instead, which is what allowed the seam-introducing drift. We add a comment declaring the rule so future contributors don't reintroduce literals.

- [ ] **Step 1: Read the current declaration**

Run: open `src/styles/globals.css` lines 13–27. Confirm `--color-nex-background: #0e1418;` is at line 15 inside the `@theme inline { ... }` block.

- [ ] **Step 2: Add the canonical-rule comment**

Replace the existing block at lines 14–15:

```css
  /* NexApex brand colors */
  --color-nex-background: #0e1418;
```

With:

```css
  /* NexApex brand colors */
  /* Canonical deep-surface background. All section-level <section> wrappers
     on marketing routes must use bg-nex-background (not bg-[#0e1418]) to
     stay in sync with this token. */
  --color-nex-background: #0e1418;
```

- [ ] **Step 3: Verify the Tailwind utility still resolves**

Run: `npm run dev` (skip if already running from Task 1).
Open `http://localhost:3000/` and confirm the page still renders normally. The comment is CSS-syntax-only and cannot break compilation, but a quick page load confirms no upstream cache issue.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "docs(css): declare --color-nex-background as canonical deep-surface token

Adds a comment above the token declaration stating that section-level
<section> wrappers on marketing routes must use bg-nex-background instead
of the literal bg-[#0e1418], preventing the kind of drift that caused
the Brand→Interlude seam.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Migrate section-root `bg-[#0e1418]` → `bg-nex-background`

**Files (11 files, single-line edit in each):**

- Modify: `src/components/BrandSection.tsx:129`
- Modify: `src/components/InterstitialBreathe.tsx:331`
- Modify: `src/components/InterstitialCanvas.tsx:73`
- Modify: `src/components/EditorialHighlightSection.tsx:123`
- Modify: `src/components/ShipStackSection.tsx:67`
- Modify: `src/components/ClientsSection.tsx:72`
- Modify: `src/components/CapabilitiesSection.tsx:164`
- Modify: `src/components/CTASection.tsx:20`
- Modify: `src/components/FooterSection.tsx:82`
- Modify: `src/components/ThreeShowcase.tsx:279`
- Modify: `src/app/(marketing)/page.tsx:35`

**Important:** Each file may contain additional `bg-[#0e1418]` occurrences at other lines (hover states, modal backdrops, fade overlays, tooltips). **Only change the line listed.** Do not use `sed`, `replace_all`, or a project-wide find-and-replace.

- [ ] **Step 1: Edit `src/components/BrandSection.tsx`**

Line 129. Change:

```tsx
    <section id={id} ref={sectionRef} className="relative bg-[#0e1418] overflow-visible">
```

To:

```tsx
    <section id={id} ref={sectionRef} className="relative bg-nex-background overflow-visible">
```

- [ ] **Step 2: Edit `src/components/InterstitialBreathe.tsx`**

Line 331. Change:

```tsx
      className="relative bg-[#0e1418] overflow-hidden"
```

To:

```tsx
      className="relative bg-nex-background overflow-hidden"
```

- [ ] **Step 3: Edit `src/components/InterstitialCanvas.tsx`**

Line 73. Change:

```tsx
      className="relative w-full overflow-hidden bg-[#0e1418] min-h-[78vh] md:min-h-[115vh]"
```

To:

```tsx
      className="relative w-full overflow-hidden bg-nex-background min-h-[78vh] md:min-h-[115vh]"
```

- [ ] **Step 4: Edit `src/components/EditorialHighlightSection.tsx`**

Line 123. Change:

```tsx
      className="relative bg-[#0e1418] text-white px-5 md:px-[60px] py-14 md:py-28 overflow-hidden"
```

To:

```tsx
      className="relative bg-nex-background text-white px-5 md:px-[60px] py-14 md:py-28 overflow-hidden"
```

- [ ] **Step 5: Edit `src/components/ShipStackSection.tsx`**

Line 67. Change:

```tsx
      className="relative bg-[#0e1418] text-white min-h-[120vh] md:min-h-[180vh] overflow-hidden px-5 md:px-[60px] py-24 md:py-32"
```

To:

```tsx
      className="relative bg-nex-background text-white min-h-[120vh] md:min-h-[180vh] overflow-hidden px-5 md:px-[60px] py-24 md:py-32"
```

- [ ] **Step 6: Edit `src/components/ClientsSection.tsx`**

Line 72. Change:

```tsx
      className="bg-[#0e1418] min-h-screen flex flex-col justify-center overflow-hidden py-10 md:py-0"
```

To:

```tsx
      className="bg-nex-background min-h-screen flex flex-col justify-center overflow-hidden py-10 md:py-0"
```

- [ ] **Step 7: Edit `src/components/CapabilitiesSection.tsx`**

Line 164. Change:

```tsx
      className="relative bg-[#0e1418] text-white min-h-[100dvh] flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-[60px]"
```

To:

```tsx
      className="relative bg-nex-background text-white min-h-[100dvh] flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-[60px]"
```

- [ ] **Step 8: Edit `src/components/CTASection.tsx`**

Line 20. Change:

```tsx
      className="relative overflow-hidden bg-[#0e1418] text-white"
```

To:

```tsx
      className="relative overflow-hidden bg-nex-background text-white"
```

- [ ] **Step 9: Edit `src/components/FooterSection.tsx`**

Line 82. Change:

```tsx
      className="relative bg-[#0e1418] text-[#c8ccc6] pt-10 pb-10 px-5 md:pt-14 md:pb-14 md:px-[60px]"
```

To:

```tsx
      className="relative bg-nex-background text-[#c8ccc6] pt-10 pb-10 px-5 md:pt-14 md:pb-14 md:px-[60px]"
```

- [ ] **Step 10: Edit `src/components/ThreeShowcase.tsx`**

Line 279 only (NOT line 39, which is an internal tooltip, and NOT line 361, which is an internal fade overlay). Change:

```tsx
    <section ref={sectionRef} className="relative min-h-screen h-screen w-full overflow-hidden bg-[#0e1418]">
```

To:

```tsx
    <section ref={sectionRef} className="relative min-h-screen h-screen w-full overflow-hidden bg-nex-background">
```

- [ ] **Step 11: Edit `src/app/(marketing)/page.tsx`**

Line 35. Change:

```tsx
          <div id="project-showcase" className="bg-[#0e1418] min-h-screen flex items-center">
```

To:

```tsx
          <div id="project-showcase" className="bg-nex-background min-h-screen flex items-center">
```

- [ ] **Step 12: Verify zero section-root literal hex remains**

Use the Grep tool with this pattern, scoped to the 11 files above:

```
pattern: "bg-\[#0e1418\]"
paths: src/components/BrandSection.tsx, src/components/InterstitialBreathe.tsx,
       src/components/InterstitialCanvas.tsx, src/components/EditorialHighlightSection.tsx,
       src/components/ShipStackSection.tsx, src/components/ClientsSection.tsx,
       src/components/CapabilitiesSection.tsx, src/components/CTASection.tsx,
       src/components/FooterSection.tsx, src/components/ThreeShowcase.tsx,
       src/app/(marketing)/page.tsx
```

Expected results:
- `BrandSection.tsx` — 0 matches (the 2 other occurrences from the seam-blend gradient inline style are in `rgba(14,20,24,...)` form, not `bg-[#0e1418]`)
- `InterstitialBreathe.tsx` — 0 matches
- `InterstitialCanvas.tsx` — 0 matches
- `EditorialHighlightSection.tsx` — 0 matches
- `ShipStackSection.tsx` — 0 matches
- `ClientsSection.tsx` — 0 matches
- `CapabilitiesSection.tsx` — 0 matches
- `CTASection.tsx` — 0 matches
- `FooterSection.tsx` — 0 matches
- `ThreeShowcase.tsx` — 2 matches remain (line 39 tooltip, line 361 fade overlay — out of scope per spec)
- `page.tsx` — 0 matches

If any "should be 0" file still has a section-root match, redo the edit for that file.

- [ ] **Step 13: Reload dev server and visual smoke test**

If dev server isn't running: `npm run dev`. Hard-refresh the browser (`Ctrl+Shift+R`) at `http://localhost:3000/`. Scroll through every section from top to bottom:

1. Hero
2. InterstitialCanvas
3. BrandSection ("01 / WHO WE ARE")
4. InterstitialBreathe ("02.5 / INTERLUDE") — seam from Task 1 must still be invisible
5. EditorialHighlightSection ("Practice")
6. ShipStackSection
7. ClientsSection
8. ProjectShowcase
9. CapabilitiesSection
10. CTASection
11. FooterSection

Every section background should remain visually identical to before Task 3. The token resolves to `#0e1418` — same color, different source.

If any section suddenly appears transparent / wrong color: the Tailwind utility didn't resolve. Confirm `bg-nex-background` (lowercase, exact name from `@theme inline`). Tailwind v4 generates the utility from the token name after the `--color-` prefix.

- [ ] **Step 14: Commit**

```bash
git add src/components/BrandSection.tsx src/components/InterstitialBreathe.tsx \
        src/components/InterstitialCanvas.tsx src/components/EditorialHighlightSection.tsx \
        src/components/ShipStackSection.tsx src/components/ClientsSection.tsx \
        src/components/CapabilitiesSection.tsx src/components/CTASection.tsx \
        src/components/FooterSection.tsx src/components/ThreeShowcase.tsx \
        "src/app/(marketing)/page.tsx"
git commit -m "refactor(marketing): migrate section-root bg to bg-nex-background

Replaces the literal bg-[#0e1418] on the root wrapper of 10 marketing
section components plus the ProjectShowcase page wrapper with the
canonical bg-nex-background token. Internal usages (hover states,
modals, gradient stops, JS color constants) remain untouched per the
design spec — they reference the same color at a different semantic
layer and are tracked as future work.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Final visual regression sweep

**Files:** none (verification only)

**Context:** Confirm the seam fix held after the token migration, and that no other section transitions regressed.

- [ ] **Step 1: Open the landing page fresh**

Hard-refresh `http://localhost:3000/` at 1920×1080. Disable browser cache in DevTools Network panel.

- [ ] **Step 2: Walk each section transition with a screenshot**

For each pair below, scroll the boundary to mid-viewport and visually confirm no perceptible color band:

- Hero → InterstitialCanvas
- InterstitialCanvas → BrandSection
- BrandSection → InterstitialBreathe ← **the seam this plan was about**
- InterstitialBreathe → EditorialHighlightSection
- EditorialHighlightSection → ShipStackSection
- ShipStackSection → ClientsSection
- ClientsSection → ProjectShowcase
- ProjectShowcase → CapabilitiesSection
- CapabilitiesSection → CTASection
- CTASection → FooterSection

The Brand→Interlude transition is the one this plan specifically fixes. The others should look identical to before this work (this plan does not introduce any new overlays elsewhere; the token migration is value-equivalent).

- [ ] **Step 3: Tablet + mobile checks**

In DevTools, switch to:
- Tablet: 768×1024 — scroll the Brand→Interlude boundary, confirm fade still works
- Mobile: 375×812 — confirm the `lite` profile renders the looping video with the fade

- [ ] **Step 4: Reduced-motion check**

In DevTools rendering panel, set "Emulate CSS prefers-reduced-motion: reduce". Hard-refresh. Scroll to Interlude. Confirm the static poster image shows the top-edge fade.

- [ ] **Step 5: No commit needed**

If anything looks off, return to the relevant task and adjust. Otherwise, this plan is complete.

---

## Notes for the implementer

- **No test framework is configured for this project.** Visual checks via the dev server are the verification layer for this work. Resist the urge to add Playwright tests for these changes — it's disproportionate to the surface area.
- **Don't `replace_all`.** Each section file has multiple `bg-[#0e1418]` occurrences. Only the section-root line is in scope; the others are out of scope per the spec.
- **The fade height is tunable.** If the band is still visible after Task 1, increase `h-32 md:h-40` to `h-40 md:h-56` and re-check. The gradient direction and stop ratios stay the same.
- **z-index discipline:** the new overlay at `z-[5]` must stay below `InterludeContent`'s `z-20` (set at `src/components/InterstitialBreathe.tsx:39`). If you change either, check the other.
