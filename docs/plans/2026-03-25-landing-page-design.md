# Landing Page Design — Scroll-Driven Storytelling

**Date**: 2026-03-25
**Branch**: rebranding-nexapex
**Stack**: Astro 5, GSAP 3.14 + ScrollTrigger, Lenis 1.3, Tailwind 4

## Design Philosophy

Curiosity-driven exploration. Each scroll reveals something new. Continuous scroll storytelling with GSAP `scrub: true` — animations tied directly to scroll position. No snapping. Lenis smooth scroll provides the buttery base.

## Brand System

- **Display font**: Nevera (--font-d)
- **Body font**: Nexa (--font-b)
- **Background**: #0e1418 (bg)
- **Primary accent**: #5ac8cb (cyan-dim)
- **Text**: #f0f1ef (white), #6e7a84 (dim)
- **Surfaces**: #162029, #1d2d39, #253a49

## Sections

### 1. Hero (existing, refined)

- Full viewport, logo top-left, nav top-right
- "WE ARE / NEXAPEX / AN AI / INNOVATION LAB" bottom-left
- "NICE TO / MEET YOU" bottom-right (desktop)
- Center empty for future 3D model
- **GSAP**: Clip-path line reveals on load (existing)
- **Scroll-out**: Headline slides down + fades via ScrollTrigger scrub as user scrolls past

### 2. Manifesto (pinned word-illuminate)

- Full viewport, pinned
- Single centered statement: "We build AI systems that see, predict, and understand — engineered for the real world of Southeast Asia."
- **GSAP**: Words start at opacity 0.15, illuminate to white one by one on scroll. "AI" gets cyan-dim.
- Pin duration: 2x viewport height
- Typography: Nevera, clamp(1.8rem, 4vw, 3.5rem), centered, max-w ~900px

### 3. Capabilities (scrub reveals)

Three blocks stacked, each ~80vh:

1. **Computer Vision** — "Quality control that never blinks"
2. **Predictive Intelligence** — "Demand forecasting that learns your market"
3. **Natural Language** — "Systems that speak your customers' language"

Per block:
- Large faint number ("01") slides in from left
- Title: clip-path reveal
- Description: fade up from y:30
- Horizontal line draws left to right as divider

Typography: Number in Nevera 8rem cyan-dim/10, title Nevera clamp(2rem,5vw,4rem), desc Nexa text-lg text-dim

### 4. Products (image cards)

Three full-width cards, alternating image/text sides:

1. **NexFactory** — AI-powered quality inspection (product-factory.jpg)
2. **NexHotel** — Dynamic pricing optimization (product-hotel.jpg)
3. **NexPOS** — Retail customer intelligence (product-pos.jpg)

Per card:
- Image scales 1.15 → 1.0 on scrub (zoom-out)
- Text: title clip-path reveal, description fade up
- Cyan accent line draws vertically beside text
- Cards ~70vh with overflow:hidden + rounded corners

### 5. Footer / CTA

- Full viewport, centered
- "Let's build something intelligent." — word illuminate (faster than manifesto)
- CTA button: "Get in Touch", cyan border, fills on hover
- Footer row: copyright left, links right
- GSAP: word illuminate, button scale 0.95→1, footer fade in

## File Structure

```
src/components/
  Navbar.astro          (exists)
  HeroSection.astro     (exists — add scroll-out)
  Manifesto.astro       (new)
  Capabilities.astro    (new)
  Products.astro        (new)
  FooterCTA.astro       (new)
src/pages/
  index.astro           (wire all sections)
```

## Implementation Order

1. Add scroll-out animation to HeroSection
2. Create Manifesto with pinned word-illuminate
3. Create Capabilities with scrub reveals
4. Create Products with image cards
5. Create FooterCTA
6. Wire all into index.astro
7. Verify full scroll flow
