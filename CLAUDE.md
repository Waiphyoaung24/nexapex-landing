# NexApex Rebranding Orchestration

## Project Context

- **Stack**: Astro 5 + React 19 + Three.js 0.183 + GSAP 3.14 + Lenis 1.3 + Tailwind 4 + shadcn
- **Pages**: Landing (`src/pages/index.astro`) + Work portfolio (`src/pages/work/[slug].astro`)
- **3D Model**: `public/models/spacestation_brand.glb` — scroll-driven, hero background
- **Branch**: `rebranding-nexapex`

## Orchestration Workflow

```
/rebrand → brainstorm → rebrand-3d-agent → rebrand-ui-agent → rebrand-review-agent → summary
```

### Command

| Command | Location | Purpose |
|---------|----------|---------|
| `/rebrand` | `.claude/skills/rebrand/SKILL.md` | Entry point — orchestrates full rebranding pipeline |

### Agents

| Agent | Location | Preloaded Skills (local) | Plugin Skills (via Skill tool) | Purpose |
|-------|----------|--------------------------|-------------------------------|---------|
| `rebrand-3d-agent` | `.claude/agents/rebrand-3d-agent.md` | `3d-web`, `threejs-fundamentals`, `threejs-loaders`, `threejs-materials`, `threejs-lighting`, `threejs-animation`, `threejs-interaction`, `threejs-geometry`, `threejs-textures`, `threejs-shaders`, `threejs-postprocessing` | — | Replace Logo3D with scroll-driven spacestation 3D scene |
| `rebrand-ui-agent` | `.claude/agents/rebrand-ui-agent.md` | `frontend-design`, `react-expert`, `taste-skill`, `soft-skill`, `redesign-skill`, `coding-standards`, `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-react`, `gsap-performance`, `gsap-frameworks` | `ui-ux-pro-max:ui-ux-pro-max`, `frontend-design:frontend-design`, `frontend-developer`, `ui-skills`, `ui-ux-pro-max` | Polish all UI components to match 3D visual identity |
| `rebrand-review-agent` | `.claude/agents/rebrand-review-agent.md` | `playwright-skill`, `code-reviewer`, `coding-standards` | `superpowers:verification-before-completion` | Visual + code validation with Playwright screenshots |

### Skill Types

**Preloaded skills** are in `.claude/skills/` — injected into agent context at startup as domain knowledge.

**Plugin skills** are from marketplace plugins — must be invoked via the `Skill` tool during execution.

| Skill | Type | Source |
|-------|------|--------|
| `threejs-*` (10 skills) | Preloaded | `.claude/skills/threejs-*/SKILL.md` |
| `3d-web` | Preloaded | `.claude/skills/3d-web/SKILL.md` |
| `frontend-design` | Preloaded | `.claude/skills/frontend-design/SKILL.md` |
| `react-expert` | Preloaded | `.claude/skills/react-expert/SKILL.md` |
| `taste-skill` | Preloaded | `.claude/skills/taste-skill/SKILL.md` |
| `soft-skill` | Preloaded | `.claude/skills/soft-skill/SKILL.md` |
| `redesign-skill` | Preloaded | `.claude/skills/redesign-skill/SKILL.md` |
| `coding-standards` | Preloaded | `.claude/skills/coding-standards/SKILL.md` |
| `gsap-core` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-core/SKILL.md` |
| `gsap-timeline` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-timeline/SKILL.md` |
| `gsap-scrolltrigger` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-scrolltrigger/SKILL.md` |
| `gsap-plugins` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-plugins/SKILL.md` |
| `gsap-utils` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-utils/SKILL.md` |
| `gsap-react` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-react/SKILL.md` |
| `gsap-performance` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-performance/SKILL.md` |
| `gsap-frameworks` | Preloaded | `.claude/skills/gsap-skills/skills/gsap-frameworks/SKILL.md` |
| `playwright-skill` | Preloaded | `.claude/skills/playwright-skill/SKILL.md` |
| `code-reviewer` | Preloaded | `.claude/skills/code-reviewer/SKILL.md` |
| `ui-ux-pro-max:ui-ux-pro-max` | Plugin | `ui-ux-pro-max-skill` marketplace |
| `frontend-design:frontend-design` | Plugin | `frontend-design` marketplace |
| `frontend-developer` | Plugin | `frontend-developer` marketplace |
| `ui-skills` | Plugin | `ui-skills` marketplace |
| `superpowers:brainstorming` | Plugin | `superpowers-marketplace` |
| `superpowers:verification-before-completion` | Plugin | `superpowers-marketplace` |

### Flow

```
╔══════════════════════════════════════════════════════════════════╗
║              REBRANDING ORCHESTRATION WORKFLOW                   ║
║           Command  →  Agents (with skills)  →  Skills            ║
╚══════════════════════════════════════════════════════════════════╝

                         ┌───────────────────┐
                         │  User: /rebrand   │
                         └─────────┬─────────┘
                                   │
                                   ▼
         ┌─────────────────────────────────────────────────────┐
         │  /rebrand — Command (Entry Point + Orchestrator)    │
         │  Model: opus                                        │
         │  Plugin skill: superpowers:brainstorming            │
         └─────────────────────────┬───────────────────────────┘
                                   │
                         Step 1: Brainstorm with user
                                   │
                                   ▼
         ┌─────────────────────────────────────────────────────┐
         │  rebrand-3d-agent — Agent                           │
         │  Model: opus                                        │
         │  Preloaded: 3d-web + all threejs-* (11 skills)      │
         │  Tools: Read, Write, Edit, Glob, Grep, Bash         │
         │  MCP: context7, shadcn                              │
         └─────────────────────────┬───────────────────────────┘
                                   │
                         Returns 3D config + visual tone
                                   │
                                   ▼
         ┌─────────────────────────────────────────────────────┐
         │  rebrand-ui-agent — Agent                           │
         │  Model: opus                                        │
         │  Preloaded: frontend-design, react-expert,          │
         │    taste-skill, soft-skill, redesign-skill,         │
         │    coding-standards, gsap-* (8 skills)              │
         │  Plugin: ui-ux-pro-max:ui-ux-pro-max,              │
         │    frontend-design:frontend-design,                 │
         │    frontend-developer, ui-skills (via Skill)        │
         │  Tools: Read, Write, Edit, Glob, Grep, Bash         │
         │  MCP: context7, shadcn                              │
         └─────────────────────────┬───────────────────────────┘
                                   │
                         Returns polished UI
                                   │
                                   ▼
         ┌─────────────────────────────────────────────────────┐
         │  rebrand-review-agent — Agent                       │
         │  Model: opus                                        │
         │  Preloaded: playwright-skill, code-reviewer,        │
         │    coding-standards                                 │
         │  Plugin: superpowers:verification-before-completion │
         │  Tools: Read, Glob, Grep, Bash                      │
         └─────────────────────────┬───────────────────────────┘
                                   │
                         Returns: review report + screenshots
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Summary to User  │
                         └───────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/components/Logo3D.astro` | OLD — to be removed by 3D agent |
| `src/components/SpaceStation3D.tsx` | NEW — scroll-driven 3D React component |
| `src/components/cinematic/CinematicHero.astro` | Integration point for new 3D scene |
| `src/components/cinematic/text-overlays.ts` | Update for legibility over 3D |
| `src/components/cinematic/scroll-animations.ts` | Adapt for new scroll-driven 3D |
| `src/components/Navbar.astro` | Polish for rebrand |
| `src/components/Footer.astro` | Polish for rebrand |
| `src/components/LandingSections.astro` | Polish for rebrand |
| `src/components/ProductSlider.astro` | Polish for rebrand |
| `src/components/ScrollRevealGrid.astro` | Polish for rebrand |
| `src/styles/globals.css` | Update colors, typography, spacing |
| `src/data/products.ts` | Keep as-is (content unchanged) |
| `public/models/spacestation_brand.glb` | New 3D model asset |

## 3D Reference Pattern

The spacestation 3D scene follows this pattern from the reference code:

```typescript
// Renderer — WebGL with ACES filmic tone mapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// Scene — dark space theme with fog
scene.fog = new THREE.Fog('#131055', 15, 50);
scene.background = new THREE.Color('#192022');

// Environment — HDR equirectangular reflection mapping
texture.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = texture;

// Model — GLTFLoader with AnimationMixer
new GLTFLoader().load('/models/spacestation_brand.glb', (gltf) => {
  scene.add(gltf.scene);
  mixer.clipAction(animation).play();
});
```

**Scroll-Driven Behavior** (GSAP ScrollTrigger + Lenis):
- **0-30% scroll**: Model at initial position, slow auto-rotate
- **30-60% scroll**: Camera zooms closer, model tilts to reveal detail
- **60-100% scroll**: Camera pulls back, model fades as content takes over

## GSAP Skills (Preloaded for UI Agent)

All 8 GSAP skills are preloaded from `.claude/skills/gsap-skills/skills/`:

| Skill | Purpose |
|-------|---------|
| `gsap-core` | Core API: `gsap.to()` / `from()` / `fromTo()`, easing, duration, stagger |
| `gsap-timeline` | Timelines: sequencing, position parameter, labels, nesting |
| `gsap-scrolltrigger` | ScrollTrigger: scroll-linked animations, pinning, scrub, triggers |
| `gsap-plugins` | Plugins: ScrollSmoother, Flip, Draggable, SplitText, etc. |
| `gsap-utils` | Utilities: clamp, mapRange, normalize, interpolate, snap, toArray |
| `gsap-react` | React: useGSAP hook, refs, `gsap.context()`, cleanup, SSR |
| `gsap-performance` | Performance: transforms over layout props, will-change, batching |
| `gsap-frameworks` | Vue, Svelte: lifecycle, scoping selectors, cleanup |

**When to use:** The `rebrand-ui-agent` must consult these skills for all GSAP animation work. Additionally invoke plugin skills `/frontend-design`, `/frontend-developer`, `/ui-skills`, `/ui-ux-pro-max` via the Skill tool for UI polish decisions.

## Rules

- Use `context7` MCP for up-to-date docs on Three.js, Astro, GSAP, Tailwind
- Use `shadcn` MCP for component patterns
- All agents use Opus model
- Sequential pipeline: 3D agent must complete before UI agent starts
- Preloaded skills come from `.claude/skills/` — plugin skills use the `Skill` tool
- Review agent validates with Playwright screenshots at desktop (1920x1080), tablet (768x1024), and mobile (375x812)
- Keep existing content/copy — only change visuals, 3D, and styling
- All colors must pass WCAG AA contrast
- Animations must respect `prefers-reduced-motion`

---

## AI Studio v3 — Feature-by-Feature Execution

### Plan & Design Docs

| Doc | Path |
|-----|------|
| Implementation Plan | `docs/plans/2026-04-06-ai-studio-v3-plan.md` |
| Architecture Design | `docs/plans/2026-04-06-ai-studio-v3-design.md` |
| PRD | `docs/nexapex_ai_studio_PRD.md` |

### Branch: `nexapex-v3-demo`

### Custom Skills (KWG-Skills)

These skills are stored in the shared skills directory and should be invoked when working on AI Studio v3 tasks:

| Skill | Path | When to Use |
|-------|------|-------------|
| `ai-studio-v3-executor` | `KWG-Skills/skills/skills/ai-studio-v3-executor/SKILL.md` | Master orchestrator — maps every task to skills, enforces test-per-feature |
| `nextjs-route-groups` | `KWG-Skills/skills/skills/nextjs-route-groups/SKILL.md` | Tasks 1, 2, 6, 18 — route group restructuring, layout isolation, bundle verification |
| `fastapi-fullstack` | `KWG-Skills/skills/skills/fastapi-fullstack/SKILL.md` | Tasks 3-5, 7, 9, 11, 15 — backend scaffold, DB, auth, inference endpoints |
| `auth-jwt-flow` | `KWG-Skills/skills/skills/auth-jwt-flow/SKILL.md` | Tasks 5, 6, 13, 14 — JWT, email gate, middleware, demo limits |
| `feature-test-loop` | `KWG-Skills/skills/skills/feature-test-loop/SKILL.md` | ALL tasks — build → smoke → verify → commit → report cycle |

### Existing Local Skills (used for AI Studio v3)

| Skill | Location | Tasks |
|-------|----------|-------|
| `nextjs-developer` | `.claude/skills/nextjs-developer/SKILL.md` | 1, 2, 6, 17, 18, 20 |
| `fastapi-expert` | `.claude/skills/fastapi-expert/SKILL.md` | 3-5, 7, 9, 11, 15, 20 |
| `react-expert` | `.claude/skills/react-expert/SKILL.md` | 2, 6, 8, 10, 12, 14, 16 |
| `frontend-design` | `.claude/skills/frontend-design/SKILL.md` | 2, 8, 10, 12, 16 |
| `api-design` | `.claude/skills/api-design/SKILL.md` | 3, 13 |
| `database-optimizer` | `.claude/skills/database-optimizer/SKILL.md` | 4 |
| `coding-standards` | `.claude/skills/coding-standards/SKILL.md` | All tasks |
| `playwright-expert` | `.claude/skills/playwright-expert/SKILL.md` | 19 |
| `e2e-testing` | `.claude/skills/e2e-testing/SKILL.md` | 19 |

### Plugin Skills (invoke via `Skill` tool)

| Skill | Tasks |
|-------|-------|
| `ui-ux-pro-max:ui-ux-pro-max` | 2, 8, 16 |
| `frontend-design:frontend-design` | 6, 8, 12 |
| `superpowers:verification-before-completion` | After each phase |
| `superpowers:test-driven-development` | Backend endpoints |

### Task Execution Order (20 Tasks, 5 Phases)

**Phase 1 — Foundation (Tasks 1-6):**
1. Restructure to Route Groups
2. Create Demo Hub Page (Static UI)
3. Scaffold FastAPI Backend
4. Database Schema + Migrations
5. Auth Endpoints (Signup + JWT)
6. Email Gate Frontend

**Phase 2 — Core Demos (Tasks 7-12):**
7. Vision Inspector — Backend (YOLO)
8. Vision Inspector — Frontend
9. Smart Assistant — Backend (LLM SSE)
10. Smart Assistant — Frontend
11. Document Intelligence — Backend
12. Document Intelligence — Frontend

**Phase 3 — Conversion (Tasks 13-15):**
13. Booking Integration (Cal.com)
14. Demo Limits + CTAs
15. Transactional Emails (Resend)

**Phase 4 — Admin (Tasks 16-17):**
16. Admin Dashboard
17. PostHog Analytics

**Phase 5 — Polish (Tasks 18-20):**
18. Bundle Optimization
19. E2E Tests (Playwright)
20. Error Handling + Graceful Degradation

### MCP Tools for AI Studio v3

- `context7` — Latest docs for Next.js 16, FastAPI, SQLAlchemy, Tailwind 4
- `shadcn` — UI component patterns for studio pages

### Performance Targets

| Metric | Target |
|--------|--------|
| 3D libs on demo pages | 0 bytes |
| Demo page LCP | < 2s on 4G |
| Vision inference | < 3s |
| Chat first token | < 1s |
| Marketing Lighthouse | > 90 |
| Demo Lighthouse | > 95 |
