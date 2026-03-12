/**
 * ambient-effects.ts
 * Phase B: Particle bridge, ambient particles, tech grid scan, footer effects.
 * Lightweight CSS + GSAP approach — no additional WebGL.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CYAN = '#94fcff';

// ── 1. Particle Transition Bridge ────────────────────────────────────────────
// Spawns animated dots that drift downward from the hero into landing content.

export function initParticleBridge(): void {
  const bridge = document.getElementById('particle-bridge');
  if (!bridge) return;

  const count = window.innerWidth < 768 ? 18 : 35;

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'bridge-particle';

    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const delay = Math.random() * 4;
    const duration = 4 + Math.random() * 6;
    const opacity = 0.15 + Math.random() * 0.35;

    Object.assign(dot.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      '--particle-opacity': String(opacity),
    } as Record<string, string>);

    bridge.appendChild(dot);
  }

  // Fade bridge in/out based on scroll position
  ScrollTrigger.create({
    trigger: bridge,
    start: 'top 90%',
    end: 'bottom 20%',
    scrub: 0.5,
    onUpdate: (self) => {
      const p = self.progress;
      // Bell curve: fade in first half, fade out second half
      const opacity = p < 0.5 ? p * 2 : (1 - p) * 2;
      bridge.style.opacity = String(Math.min(opacity, 1));
    },
  });
}

// ── 2. Ambient Floating Particles ────────────────────────────────────────────
// Adds subtle floating dots to sections with [data-ambient-particles].

export function initAmbientParticles(): void {
  const containers = document.querySelectorAll<HTMLElement>('[data-ambient-particles]');

  containers.forEach((container) => {
    const count = parseInt(container.getAttribute('data-ambient-particles') || '12', 10);

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'ambient-particle';

      const size = 1 + Math.random() * 2.5;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 8 + Math.random() * 12;

      Object.assign(dot.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      });

      container.appendChild(dot);
    }

    // Only animate when in view
    ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => container.classList.add('ambient-active'),
      onLeave: () => container.classList.remove('ambient-active'),
      onEnterBack: () => container.classList.add('ambient-active'),
      onLeaveBack: () => container.classList.remove('ambient-active'),
    });
  });
}

// ── 3. Tech Grid Scan Effect ─────────────────────────────────────────────────
// Adds a horizontal scan line that sweeps across sections with [data-tech-grid].

export function initTechGrid(): void {
  const grids = document.querySelectorAll<HTMLElement>('[data-tech-grid]');

  grids.forEach((section) => {
    // Create the scan line element
    const scanLine = document.createElement('div');
    scanLine.className = 'tech-scan-line';
    section.appendChild(scanLine);

    // Scrub-based scan animation
    gsap.fromTo(
      scanLine,
      { top: '-2px', opacity: 0 },
      {
        top: '100%',
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
          onUpdate: (self) => {
            // Fade in at start, fade out at end
            const p = self.progress;
            if (p < 0.1) scanLine.style.opacity = String(p * 10);
            else if (p > 0.9) scanLine.style.opacity = String((1 - p) * 10);
            else scanLine.style.opacity = '1';
          },
        },
      },
    );
  });
}

// ── 4. Footer Ambient Effects ────────────────────────────────────────────────
// Adds glow pulse and floating particles to the footer.

export function initFooterEffects(): void {
  const footer = document.querySelector<HTMLElement>('footer');
  if (!footer) return;

  // Ensure footer is positioned for absolute children
  if (getComputedStyle(footer).position === 'static') {
    footer.style.position = 'relative';
  }
  footer.style.overflow = 'hidden';

  // Add ambient glow orb
  const glowOrb = document.createElement('div');
  glowOrb.className = 'footer-glow-orb';
  footer.appendChild(glowOrb);

  // Add floating particles
  const count = window.innerWidth < 768 ? 8 : 15;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'footer-particle';

    const size = 1 + Math.random() * 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 6 + Math.random() * 10;

    Object.assign(dot.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    });

    footer.appendChild(dot);
  }

  // Animate glow orb on scroll
  ScrollTrigger.create({
    trigger: footer,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      gsap.to(glowOrb, {
        opacity: 1,
        duration: 2,
        ease: 'power2.out',
      });
    },
  });

  // Subtle top border glow pulse
  const borderGlow = document.createElement('div');
  borderGlow.className = 'footer-border-glow';
  footer.appendChild(borderGlow);

  gsap.to(borderGlow, {
    opacity: 0.6,
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

// ── Master Init ──────────────────────────────────────────────────────────────

export function initAmbientEffects(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  initParticleBridge();
  initAmbientParticles();
  initTechGrid();
  initFooterEffects();
}
