# NexApex: Next.js to Astro Migration Design

**Date:** 2026-03-03
**Status:** Approved, implementing

## Decisions

- **Deployment:** Static SSG with nginx (Docker, port 3004)
- **Approach:** Fresh Astro project (`nexapex-astro/`), port components over
- **Framework:** Astro with `@astrojs/react` for interactive islands

## Architecture

```
nexapex-astro/
├── src/
│   ├── layouts/Layout.astro       # Root layout (fonts, meta, Lenis)
│   ├── pages/index.astro          # Landing page orchestrator
│   ├── components/                # React islands
│   │   ├── Navbar.tsx             # client:load
│   │   ├── HeroSection.tsx        # client:load
│   │   ├── LandingSections.tsx    # client:visible
│   │   └── Footer.tsx             # client:visible
│   └── styles/globals.css         # Tailwind v4 + brand tokens
├── public/                        # Static assets (fonts, images, favicon)
├── astro.config.mjs
├── tsconfig.json
├── Dockerfile                     # nginx-based static serving
└── nginx.conf
```

## Component Porting

| Component | Directive | Changes |
|-----------|-----------|---------|
| Navbar.tsx | client:load | Remove `'use client'`, replace next/link with `<a>` |
| HeroSection.tsx | client:load | Remove `'use client'`, replace next/image with `<img>` |
| LandingSections.tsx | client:visible | Extract from page.tsx, lazy hydrate |
| Footer.tsx | client:visible | Remove `'use client'`, replace next/link with `<a>` |

## Key Replacements

- `next/font` → `@font-face` in globals.css
- `next/image` → `<img>` tags
- `next/link` → `<a>` tags
- `'use client'` → Astro island directives
- Lenis init in React → `<script>` in Layout.astro
- Next.js standalone Docker → nginx:alpine static serve

## Implementation Steps

1. Scaffold Astro project, install dependencies
2. Port globals.css and configure Tailwind v4
3. Create Layout.astro (fonts, meta, Lenis init)
4. Port React components (strip Next.js imports)
5. Create index.astro with island directives
6. Copy static assets to public/
7. Create Dockerfile + nginx.conf
