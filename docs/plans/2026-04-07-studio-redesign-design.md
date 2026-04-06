# Studio Pages Redesign — Design Doc

**Date:** 2026-04-07
**Branch:** `nexapex-v3-demo`
**Scope:** Restyle AI Studio pages to match landing page brand identity

## Decisions

- **Approach:** Component-level polish (no new layout abstractions)
- **Scroll:** Standard scroll, no ScrollSmoother
- **Grain overlay:** Yes, applied via `grain-overlay` class on studio body
- **Animations:** Subtle GSAP entrance animations (fade-up, stagger) on hub page; none on demo tool pages
- **Demo pages:** Full-width immersive layout with breadcrumb toolbar
- **Auth page:** Minimal branded, no atmospheric effects

## Design Tokens (from landing page)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-nex-background` | `#0e1418` | Page backgrounds |
| `--color-nex-surface` | `#162029` | Card/input surfaces |
| `--color-nex-surface2` | `#1d2d39` | Hover states |
| `--color-nex-cyan` | `#94fcff` | Primary accent |
| `--color-nex-dim` | `#6e7a84` | Muted text |
| `--font-display` | Nevera | Headings |
| `--font-sans` | Nexa | Body text |

## Section 1: Studio Layout & Global Styling

### `src/app/(studio)/layout.tsx`
- Add `grain-overlay` class to `<body>`
- Keep standard scroll, no ScrollSmoother

### `src/app/(studio)/demos/layout.tsx`
- StudioHeader stays sticky
- Main: `flex-1`, no max-width constraint

### `src/components/studio/StudioHeader.tsx`
- Use `glass-header` CSS class from globals
- Match marketing Header spacing: `px-4 md:px-[60px]`
- Match logo size and tracking
- "Book a Call" cyan pill button
- Subtle GSAP fade-down on mount

### `src/app/(studio)/auth/page.tsx`
- Clean centered layout, brand fonts inherited
- No atmospheric effects, no changes needed beyond token alignment

## Section 2: Demo Hub Page & Cards

### `src/app/(studio)/demos/page.tsx`
- Heading: Nevera display font + gradient text (`linear-gradient(180deg, #fff → #a0dfe4)`)
- Subtitle: `text-nex-dim`
- GSAP `useGSAP` on mount: heading fade-up, cards stagger (0.12s delay)
- `prefers-reduced-motion` check

### `src/components/studio/DemoCard.tsx`
- Surface: `bg-nex-surface` → hover `bg-nex-surface2`
- Border: `border-white/[0.06]` → hover `border-[#94fcff]/20`
- Add `hover:-translate-y-0.5` lift
- CSS transitions only (no GSAP on hover)

### `src/components/studio/EmailGateForm.tsx`
- Inputs: `bg-nex-surface`, `border-white/[0.06]`, focus `border-[#94fcff]/30`
- Submit: `bg-[#94fcff]` cyan pill
- Mostly token alignment

## Section 3: Demo Pages (Vision/Chat/Docs)

### All three demo pages
- Remove centered `max-w-7xl` wrapper
- Full-width: `min-h-[calc(100vh-4rem)] w-full`
- Breadcrumb toolbar: `px-4 md:px-[60px] py-3`, mono font, back arrow to `/demos`
- Border: `border-b border-white/[0.06]`
- Workspace area: full-width, ready for future tool UI
- "Coming soon" state: centered with muted text + icon
- No GSAP animations

## Files Changed

| File | Action |
|------|--------|
| `src/app/(studio)/layout.tsx` | Edit — add grain-overlay |
| `src/app/(studio)/demos/layout.tsx` | No change needed |
| `src/components/studio/StudioHeader.tsx` | Edit — glass-header, spacing, GSAP |
| `src/app/(studio)/demos/page.tsx` | Edit — gradient heading, GSAP animations |
| `src/components/studio/DemoCard.tsx` | Edit — brand tokens, hover lift |
| `src/components/studio/EmailGateForm.tsx` | Edit — token alignment |
| `src/app/(studio)/auth/page.tsx` | Minor token check |
| `src/app/(studio)/demos/vision/page.tsx` | Edit — full-width + breadcrumb |
| `src/app/(studio)/demos/chat/page.tsx` | Edit — full-width + breadcrumb |
| `src/app/(studio)/demos/docs/page.tsx` | Edit — full-width + breadcrumb |
