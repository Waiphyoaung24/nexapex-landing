/**
 * scroll-animations.ts
 * GSAP ScrollTrigger-based scroll reveal animations for all landing sections
 * following the cinematic hero. Assumes GSAP + ScrollTrigger + Lenis are
 * registered globally in Layout.astro.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Brand tokens ──────────────────────────────────────────────────────────────

const CYAN = '#94fcff';
const CYAN_GLOW = 'rgba(148, 252, 255, 0.12)';
const CYAN_DIM = '#5ac8cb';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMobile(): boolean {
  return window.innerWidth < 768;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Make all reveal-targeted elements immediately visible (reduced motion). */
function showAllImmediately(): void {
  const selectors = [
    '[data-reveal]',
    '[data-reveal-stagger] > *',
    '[data-counter]',
    '.section-connector',
    '.cta-word',
    '.process-line',
  ];

  document.querySelectorAll<HTMLElement>(selectors.join(',')).forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}

// ── 1. Scroll Reveals ─────────────────────────────────────────────────────────

type RevealType = 'fade-up' | 'fade-left' | 'fade-right' | 'scale';

interface RevealConfig {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
}

const REVEAL_MAP: Record<RevealType, RevealConfig> = {
  'fade-up': {
    from: { y: 40, opacity: 0 },
    to: { y: 0, opacity: 1 },
  },
  'fade-left': {
    from: { x: -40, opacity: 0 },
    to: { x: 0, opacity: 1 },
  },
  'fade-right': {
    from: { x: 40, opacity: 0 },
    to: { x: 0, opacity: 1 },
  },
  scale: {
    from: { scale: 0.9, opacity: 0 },
    to: { scale: 1, opacity: 1 },
  },
};

export function initScrollReveals(): void {
  // Individual element reveals
  (Object.keys(REVEAL_MAP) as RevealType[]).forEach((type) => {
    const { from, to } = REVEAL_MAP[type];

    gsap.utils.toArray<HTMLElement>(`[data-reveal="${type}"]`).forEach((el) => {
      gsap.fromTo(el, from, {
        ...to,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    });
  });

  // Staggered container reveals
  gsap.utils.toArray<HTMLElement>('[data-reveal-stagger]').forEach((parent) => {
    const children = parent.children;
    if (!children.length) return;

    gsap.fromTo(
      children,
      { y: 36, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: parent,
          start: 'top 88%',
          once: true,
        },
      },
    );
  });
}

// ── 2. Stat Counters ──────────────────────────────────────────────────────────

function animateNumericCounter(el: HTMLElement, target: number): void {
  const proxy = { value: 0 };

  gsap.to(proxy, {
    value: target,
    duration: 1.6,
    ease: 'power2.out',
    snap: { value: Number.isInteger(target) ? 1 : 0.1 },
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
      once: true,
    },
    onUpdate() {
      el.textContent = Number.isInteger(target)
        ? String(Math.round(proxy.value))
        : proxy.value.toFixed(1);
    },
    onComplete() {
      el.textContent = String(target);
      addCyanGlowPulse(el);
    },
  });
}

function animateTypewriter(el: HTMLElement, text: string): void {
  el.textContent = '';

  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    once: true,
    onEnter() {
      const chars = text.split('');
      chars.forEach((char, i) => {
        gsap.delayedCall(i * 0.08, () => {
          el.textContent = text.slice(0, i + 1);
          if (i === chars.length - 1) {
            addCyanGlowPulse(el);
          }
        });
      });
    },
  });
}

function addCyanGlowPulse(el: HTMLElement): void {
  gsap.fromTo(
    el,
    { textShadow: `0 0 0px ${CYAN}` },
    {
      textShadow: `0 0 12px ${CYAN}, 0 0 24px ${CYAN_GLOW}`,
      duration: 0.5,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    },
  );
}

export function initStatCounters(): void {
  gsap.utils.toArray<HTMLElement>('[data-counter]').forEach((el) => {
    const raw = el.getAttribute('data-counter') ?? '';
    const numericValue = parseFloat(raw);

    // Determine if the value is purely numeric
    if (!isNaN(numericValue) && String(numericValue) === raw.trim()) {
      animateNumericCounter(el, numericValue);
    } else {
      animateTypewriter(el, raw);
    }
  });
}

// ── 3. Section Connectors ─────────────────────────────────────────────────────

export function initSectionConnectors(): void {
  gsap.utils.toArray<HTMLElement>('.section-connector').forEach((connector) => {
    const dot = connector.querySelector<HTMLElement>('.connector-dot');

    // Scrub-based draw animation (CSS sets initial scaleY: 0, transform-origin: top)
    gsap.to(connector, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: connector,
        start: 'top 90%',
        end: 'bottom 60%',
        scrub: isMobile() ? true : 0.5,
        onUpdate(self) {
          if (dot) {
            dot.style.opacity = String(Math.min(self.progress * 2, 1));
          }
        },
      },
    });

    // Pulsing glow on the dot once visible
    if (dot) {
      gsap.to(dot, {
        boxShadow: `0 0 14px ${CYAN}, 0 0 28px ${CYAN_GLOW}`,
        duration: 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
  });
}

// ── 4. Card Tilt Effects ──────────────────────────────────────────────────────

export function initCardEffects(): void {
  if (isMobile()) return; // Tilt is desktop-only; CSS handles hover glow on mobile

  gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((card) => {
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    // Create radial gradient overlay for cursor glow
    let glowOverlay = card.querySelector<HTMLElement>('.tilt-glow');
    if (!glowOverlay) {
      glowOverlay = document.createElement('div');
      glowOverlay.className = 'tilt-glow';
      Object.assign(glowOverlay.style, {
        position: 'absolute',
        inset: '0',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        zIndex: '1',
      });
      // Ensure card is positioned for the overlay
      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative';
      }
      card.appendChild(glowOverlay);
    }

    const handleMouseMove = (e: MouseEvent): void => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized -1 to 1 from center
      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      // Clamp rotation to ±3 degrees
      const rotateY = normX * 3;
      const rotateX = -normY * 3;

      gsap.to(card, {
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Move glow to follow cursor
      if (glowOverlay) {
        const percentX = ((e.clientX - rect.left) / rect.width) * 100;
        const percentY = ((e.clientY - rect.top) / rect.height) * 100;

        glowOverlay.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, ${CYAN_GLOW}, transparent 60%)`;
        glowOverlay.style.opacity = '1';
      }
    };

    const handleMouseLeave = (): void => {
      gsap.to(card, {
        transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
        duration: 0.4,
        ease: 'power3.out',
      });

      if (glowOverlay) {
        glowOverlay.style.opacity = '0';
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
  });
}

// ── 5. CTA Animation ─────────────────────────────────────────────────────────

export function initCTAAnimation(): void {
  const ctaSection = document.getElementById('contact');
  if (!ctaSection) return;

  // Word-by-word reveal
  const words = gsap.utils.toArray<HTMLElement>('.cta-word');
  if (words.length) {
    gsap.fromTo(
      words,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top 75%',
          once: true,
        },
      },
    );
  }

  // CTA buttons — animate after words complete
  const buttons = ctaSection.querySelectorAll<HTMLElement>(
    'a[href], button, .cta-button',
  );
  if (buttons.length) {
    const wordsDuration = words.length * 0.08 + 0.7;

    gsap.fromTo(
      buttons,
      { scale: 0.9, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1,
        delay: wordsDuration,
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top 75%',
          once: true,
        },
      },
    );
  }

  // Subtle background gradient pulse
  gsap.to(ctaSection, {
    backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(148, 252, 255, 0.06) 0%, transparent 60%)`,
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    scrollTrigger: {
      trigger: ctaSection,
      start: 'top 90%',
      once: true,
    },
  });
}

// ── 6. Process Flow ───────────────────────────────────────────────────────────

export function initProcessFlow(): void {
  const processSection = document.getElementById('process');
  if (!processSection) return;

  // Animate SVG connecting line via stroke-dashoffset
  const processLineSvg = processSection.querySelector<SVGSVGElement>('.process-line');
  const lineEl = processLineSvg?.querySelector<SVGLineElement>('line');

  if (lineEl) {
    // SVGLineElement doesn't have getTotalLength — use estimated dash length
    const estimatedLength = 600;

    lineEl.style.strokeDasharray = String(estimatedLength);
    lineEl.style.strokeDashoffset = String(estimatedLength);

    gsap.to(lineEl, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: processSection,
        start: 'top 70%',
        end: 'bottom 40%',
        scrub: isMobile() ? true : 0.6,
      },
    });
  }

  // Step number counters animate in
  const steps = gsap.utils.toArray<HTMLElement>(
    processSection.querySelectorAll('[data-step]'),
  );

  steps.forEach((step, i) => {
    gsap.fromTo(
      step,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
        delay: i * 0.15,
        scrollTrigger: {
          trigger: step,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });
}

// ── 7. Master Entry Point ─────────────────────────────────────────────────────

export function initAllAnimations(): void {
  // Respect user preference for reduced motion
  if (prefersReducedMotion()) {
    showAllImmediately();
    return;
  }

  initScrollReveals();
  initStatCounters();
  initSectionConnectors();
  initCardEffects();
  initCTAAnimation();
  initProcessFlow();
}
