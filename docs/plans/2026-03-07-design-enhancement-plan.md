# NexApex Design Enhancement Plan

## Phase A: Polish & Motion (Current)

### A1: Scroll Reveal Animation System
**File:** `src/components/cinematic/scroll-animations.ts` (NEW)
- `initScrollReveals()` — finds all `[data-reveal]` elements, creates GSAP ScrollTrigger fade-up/stagger animations
- `initStatCounters()` — animates stat numbers (24/7, 3, SEA, Lab) with counting/typewriter effect
- `initSectionConnectors()` — animates gradient line connectors between sections on scroll
- `initCardEffects()` — adds magnetic tilt + cyan glow border on hover for product/service cards
- `initCTAAnimation()` — special CTA section: word-by-word reveal + button bounce-in

### A2: LandingSections.astro Updates
- Add `data-reveal="fade-up"` to all section labels, headings
- Add `data-reveal="stagger"` to card containers (services, products)
- Add `data-reveal="fade-up"` to individual process steps, stat cards, about paragraphs
- Add `data-counter="24/7"` (etc.) attributes to stat value spans
- Add section connector `<div class="section-connector">` between each section
- Add `data-tilt` attribute to service and product cards
- Enhanced CTA: wrap heading words in spans for word-by-word reveal
- Process steps: add SVG connecting line between steps

### A3: CSS Updates (`globals.css`)
- `[data-reveal]` initial hidden state: `opacity: 0; transform: translateY(40px)`
- `.section-connector` gradient line styles (cyan accent, centered)
- `.card-tilt-glow` hover glow effect styles
- Process step connecting line styles
- CTA enhanced animation styles
- `@media (prefers-reduced-motion: reduce)` — disable all reveals

### A4: Layout.astro Integration
- Import and call `initAllAnimations()` from scroll-animations.ts after DOM ready

## Phase B: New Components + Motion (Next)
- Particle transition bridge between hero and landing sections
- Ambient floating particles background for landing sections
- Tech grid overlay on select sections
- Footer ambient effects

## Shared Contract (class names / data attributes)
- `data-reveal="fade-up"` — single element fade up
- `data-reveal="fade-left"` — single element fade from left
- `data-reveal="fade-right"` — single element fade from right
- `data-reveal-stagger` — parent container, children stagger in
- `data-counter` — stat counter element (value = final display text)
- `data-tilt` — card with magnetic tilt hover effect
- `.section-connector` — gradient line divider between sections
- `.process-line` — SVG connecting line for process steps
- `.cta-word` — individual word span in CTA heading
