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
| `rebrand-ui-agent` | `.claude/agents/rebrand-ui-agent.md` | `frontend-design`, `react-expert`, `taste-skill`, `soft-skill`, `redesign-skill`, `coding-standards` | `ui-ux-pro-max:ui-ux-pro-max` | Polish all UI components to match 3D visual identity |
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
| `playwright-skill` | Preloaded | `.claude/skills/playwright-skill/SKILL.md` |
| `code-reviewer` | Preloaded | `.claude/skills/code-reviewer/SKILL.md` |
| `ui-ux-pro-max:ui-ux-pro-max` | Plugin | `ui-ux-pro-max-skill` marketplace |
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
         │    coding-standards                                 │
         │  Plugin: ui-ux-pro-max:ui-ux-pro-max (via Skill)   │
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
