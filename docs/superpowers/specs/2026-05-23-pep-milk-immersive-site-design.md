# PEP Milk — Immersive Brand Site

**Status:** Draft for review
**Date:** 2026-05-23
**Owner:** Wai Phyo Aung
**Repo:** `nexapex-web` (Next.js 16 + React 19)

---

## 1. Goal

Build an "awwwards-style" immersive brand site for **PEP Milk (Myanmar)**: a single deep-scroll Home page driven by a 3D cow mascot, plus three lighter inner routes (Story, Products, Where to Buy). The site must adhere strictly to the PEP brand guidelines (red `#ED1C24`, cream `#E1E17F`, milk-chat bubble device, joyful family voice).

**Visual direction:** "Playful Pop" — flat brand-loyal red/cream, chunky shapes, friendly, mass-market.

---

## 2. Constraints & Inputs

| Item | Source |
|---|---|
| Brand guidelines | `~/Downloads/PEP Brand Guidelines.pdf` (26pp) |
| Primary logo SVG | `~/Downloads/Artboard 1 copy 11.svg` → copy to `public/brand/pep-logo.svg` |
| Cow 3D model | `public/models/cow.glb` (already in repo, 2.3 MB) |
| Brand red | `#ED1C24` (Pantone 485 C) |
| Brand cream | `#E1E17F` (Pantone 1205 C) |
| Fonts | Cushy (Regular/Bold), Annifont Regular (handwriting) — user must supply font files; fallback: Nunito + Caveat |
| Stack already installed | Next 16, React 19, R3F + drei + cannon + postprocessing, GSAP + @gsap/react, framer-motion, Tailwind v4, shadcn |

**Hard brand rules:**
- Never alter the logo colours or proportions.
- Never use the brandmark and milk-chat bubble as a single focus together.
- Cream is an accent only — minimal use.
- Maintain logo clear space and minimum size (0.6 in equivalent on viewport).

---

## 3. Information Architecture

```
/                  Home (immersive, 5 sections)
/story             Origin story (4-scene deep scroll)
/products          3D bottle lineup
/where-to-buy      Myanmar retailer map
```

Shared chrome: sticky top nav (logo left, links right), footer (logo + family-pattern strip + socials).

---

## 4. Home — Scroll Storyboard

Each section ~1 viewport unless noted. ScrollTrigger pins where stated. Lenis enabled for smooth scroll.

### S1. Intro splash (pinned, ~1.5x viewport)
- 3D scene: PEP chat-bubble logo rotates mid-air → falls → plunges into a glass of milk.
- On impact: instanced particle splash (cream droplets + 6–10 chat-bubble shapes burst radially).
- Headline fades in: **"Milk Talks."** sub: **"Memorable conversations, every glass."**
- Scroll cue chevron at bottom.

### S2. Meet the cow (~1 viewport)
- Camera pulls back from the glass to reveal the cow.glb on a soft cream platform.
- Cow does an idle bob (looping clip).
- Small chat bubbles drift past carrying words: "calcium", "energy", "smile", "ပက်(ပ်)".
- Copy: "Meet the source of all the goodness."

### S3. Drinking moment (pinned, ~1.5x viewport)
- Hero scroll-driven animation: cow lifts bottle → tilts → milk level drops → satisfied "ahh".
- Three text reveals tied to scroll progress (0%, 50%, 100%):
  1. **"pep it up."**
  2. **"Fueling kid power."**
  3. **"Every drop is a memory."**
- Background subtly shifts from red → cream over the section.

### S4. Milk Talks pillars (horizontal scroll-lock, ~1 viewport)
- Three giant milk-chat bubbles scroll horizontally past the viewport:
  - **Nourishing** — calcium + protein for growing bodies.
  - **Family** — moments at the table.
  - **Memorable** — conversations worth keeping.
- Background: faint cream wordmark pattern (per brand `pep wordmark pattern` page).

### S5. Product peek + CTA (~1 viewport + footer)
- Three PEP bottles in a row (3D, slight tilt on hover).
- Primary CTAs: **Explore products →** (/products), **Find a store →** (/where-to-buy).
- Footer: logo, socials, milk-chat-bubble pattern strip (per brand guidelines page).

---

## 5. Inner Pages

### /story — Origin (4-scene deep scroll)
1. Farm at dawn — cow on grassy field, sky tint.
2. Milking — milk pours into a pail.
3. Bottling — bottles fill on a conveyor.
4. Family — milk arrives at a Myanmar home, family pattern characters animate in.
Each scene is a 2D illustration + light parallax (not full 3D — cheaper, stays on brand).

### /products
- Grid of product cards. Each card has a small R3F bottle that rotates on hover.
- Click → detail panel: nutrition facts presented inside chat bubbles, "pep family" character recommends.

### /where-to-buy
- Stylised Myanmar map (SVG, not Google Maps — to stay design-forward).
- Pins for retailers, filter by region (Yangon, Mandalay, etc.).
- Contact form below.

---

## 6. Technical Architecture

### Routing & layout
- App Router. `app/layout.tsx` injects fonts (next/font/local for Cushy/Annifont), `<Nav />`, `<Footer />`.
- `app/page.tsx` = Home. Each scroll section lives in `components/home/SectionXX.tsx`.

### 3D pipeline
- Single shared `<Canvas>` mounted at the Home top, fixed-position behind DOM content.
- Scroll progress → useScroll (drei) drives animation states.
- Cow GLB loaded once via `useGLTF.preload`. Animation clip seeked by scroll progress (no playback time).
- Postprocessing: subtle bloom + vignette only (keep flat pop look).
- Mobile: degrade to 2D illustrations for S1/S2/S3 (perf budget); keep S4/S5 as-is.

### Asset prep (Blender-MCP)
The cow.glb needs a "drinking" animation. Pipeline:
1. Open `cow.glb` in Blender via `blender-mcp`.
2. Add an armature, rig the head + a bottle prop.
3. Author a 60-frame clip: lift → tilt → drink → settle.
4. Export `cow-drink.glb` with embedded animation to `public/models/cow-drink.glb`.

### Scroll engine
- **Lenis** for smooth scrolling (`npm i lenis`).
- **GSAP ScrollTrigger** for pinning + horizontal section.
- @gsap/react `useGSAP` for cleanup-safe hooks.

### Design tokens (Tailwind v4)
```css
@theme {
  --color-pep-red: #ED1C24;
  --color-pep-red-2: #DA2128;
  --color-pep-cream: #E1E17F;
  --color-pep-cream-soft: #F6F2D7;
  --color-pep-grey: #939596;
  --color-pep-milk: #FFFFFF;
  --font-display: var(--font-cushy);
  --font-hand: var(--font-annifont);
}
```

### File layout (delta only)
```
app/
  layout.tsx                      (fonts, nav, footer, lenis provider)
  page.tsx                        (Home assembly)
  story/page.tsx
  products/page.tsx
  where-to-buy/page.tsx
components/
  brand/Logo.tsx                  (uses /public/brand/pep-logo.svg)
  brand/ChatBubble.tsx            (the milk-chat-bubble SVG, reusable)
  layout/Nav.tsx, Footer.tsx
  lenis/LenisProvider.tsx
  three/HomeCanvas.tsx            (fixed Canvas shared across sections)
  three/Cow.tsx                   (loads cow-drink.glb, scroll-driven)
  three/LogoDrop.tsx              (S1 logo-into-milk)
  three/BottleRow.tsx             (S5)
  home/S1Intro.tsx ... S5Cta.tsx
  story/Scene1.tsx ... Scene4.tsx
public/
  brand/pep-logo.svg
  models/cow-drink.glb            (Blender-prepped)
  fonts/cushy-*.woff2             (user-supplied)
```

---

## 7. Performance Budget

- LCP < 2.5s on 4G. Hero shows a tinted poster until R3F mounts.
- cow-drink.glb < 3 MB (Draco compress).
- Lazy-load sections below S1 (`next/dynamic` with `ssr:false` for R3F bits).
- No third-party fonts from network — self-host via next/font/local.

---

## 8. Out of Scope

- E-commerce / cart.
- CMS integration (content lives in TS files for now).
- i18n / Burmese-language version (defer; design supports it later via the `pep-myanmar` font).
- Auth.

---

## 9. Open Questions

1. **Fonts:** Do you have Cushy and Annifont licensed? If not, we use Nunito + Caveat as visual stand-ins and swap later.
2. **Where-to-Buy data:** static list, or API? (Assuming static JSON for now.)
3. **Products:** how many SKUs? (Assuming 3 for storyboard.)
4. **Mobile expectation:** Full immersive on mobile, or graceful 2D fallback for heavy 3D sections? (Assuming 2D fallback for S1/S3.)

---

## 10. Success Criteria

- All 5 Home sections work on desktop Chrome/Safari at 60 fps.
- Logo, colours, type all match brand guidelines exactly.
- Cow drinking animation visibly tied to scroll position.
- Three inner routes render with shared nav/footer and design system.
- Lighthouse Performance ≥ 80 on a throttled mid-tier mobile run.
