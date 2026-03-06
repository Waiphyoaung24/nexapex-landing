/**
 * product-animations.ts
 * Joffrey Spitzer-style vertical slider + text reveal animations.
 * - Scroll-driven active slide scaling
 * - Character-by-character title reveals
 * - Line-by-line paragraph reveals
 * - Fade-up image/card reveals with stagger
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

// ── Text Splitting Utility (SplitText alternative) ──────────────────────────

function splitIntoChars(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent || '';
  el.innerHTML = '';
  el.setAttribute('aria-label', text);

  const chars: HTMLSpanElement[] = [];
  text.split('').forEach((char) => {
    const span = document.createElement('span');
    span.className = 'split-char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
    chars.push(span);
  });

  return chars;
}

function splitIntoLines(el: HTMLElement): HTMLSpanElement[] {
  const text = el.innerHTML;
  // Wrap each text node line in a span with overflow hidden mask
  const words = text.split(/\s+/);
  el.innerHTML = '';

  const wrapper = document.createElement('span');
  wrapper.style.display = 'inline';

  words.forEach((word, i) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'split-word';
    wordSpan.innerHTML = (i > 0 ? ' ' : '') + word;
    wrapper.appendChild(wordSpan);
  });

  el.appendChild(wrapper);

  // Group words into visual lines based on offsetTop
  const wordSpans = Array.from(el.querySelectorAll<HTMLSpanElement>('.split-word'));
  const lines: HTMLSpanElement[][] = [];
  let currentLine: HTMLSpanElement[] = [];
  let lastTop = -1;

  wordSpans.forEach((ws) => {
    const top = ws.offsetTop;
    if (lastTop !== -1 && Math.abs(top - lastTop) > 4) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(ws);
    lastTop = top;
  });
  if (currentLine.length) lines.push(currentLine);

  // Rebuild with line wrappers (mask containers)
  el.innerHTML = '';
  const lineEls: HTMLSpanElement[] = [];

  lines.forEach((lineWords) => {
    const lineMask = document.createElement('span');
    lineMask.className = 'split-line-mask';

    const lineInner = document.createElement('span');
    lineInner.className = 'split-line';

    lineWords.forEach((ws) => {
      lineInner.appendChild(ws);
    });

    lineMask.appendChild(lineInner);
    el.appendChild(lineMask);
    lineEls.push(lineInner);
  });

  return lineEls;
}

// ── 1. Vertical Slider (Homepage) ───────────────────────────────────────────

export function initProductSlider(): void {
  const slides = gsap.utils.toArray<HTMLElement>('.product-slide');
  if (!slides.length) return;

  // Set first slide as active initially
  slides[0]?.classList.add('is-active');

  slides.forEach((slide) => {
    ScrollTrigger.create({
      trigger: slide,
      start: 'top 65%',
      end: 'bottom 35%',
      onEnter: () => setActiveSlide(slide, slides),
      onEnterBack: () => setActiveSlide(slide, slides),
    });
  });

  // Staggered fade-in for slides
  slides.forEach((slide, i) => {
    gsap.fromTo(
      slide,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        delay: i * 0.1,
        scrollTrigger: {
          trigger: slide,
          start: 'top 90%',
          once: true,
        },
      },
    );
  });
}

function setActiveSlide(active: HTMLElement, allSlides: HTMLElement[]): void {
  allSlides.forEach((s) => {
    if (s === active) {
      s.classList.add('is-active');
    } else {
      s.classList.remove('is-active');
    }
  });
}

// ── 2. Detail Page Text Reveals ─────────────────────────────────────────────

export function initDetailReveals(): void {
  // Character-by-character title reveals
  gsap.utils.toArray<HTMLElement>('[data-reveal-chars]').forEach((el) => {
    const chars = splitIntoChars(el);

    gsap.from(chars, {
      yPercent: -120,
      scale: 1.2,
      opacity: 0,
      duration: 1,
      stagger: 0.015,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // Line-by-line paragraph reveals
  gsap.utils.toArray<HTMLElement>('[data-reveal-lines]').forEach((el) => {
    const lines = splitIntoLines(el);

    gsap.from(lines, {
      yPercent: 105,
      duration: 0.9,
      stagger: 0.06,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // Image/card fade-up reveals
  gsap.utils.toArray<HTMLElement>('[data-reveal-media]').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 15, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });

  // Staggered feature cards
  const featureGrid = document.querySelector('[data-reveal-features]');
  if (featureGrid) {
    const cards = featureGrid.querySelectorAll<HTMLElement>('.feature-card');
    gsap.fromTo(
      cards,
      { y: 50, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: featureGrid,
          start: 'top 80%',
          once: true,
        },
      },
    );
  }

  // Tech tags stagger
  const techList = document.querySelector('[data-reveal-tech]');
  if (techList) {
    const tags = techList.querySelectorAll<HTMLElement>('.tech-tag');
    gsap.fromTo(
      tags,
      { scale: 0.8, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.5,
        ease: 'back.out(1.7)',
        stagger: 0.06,
        scrollTrigger: {
          trigger: techList,
          start: 'top 85%',
          once: true,
        },
      },
    );
  }
}

// ── 3. Detail Page Hero Clip-Path Reveal ────────────────────────────────────

export function initDetailHeroReveal(): void {
  const hero = document.getElementById('detail-hero');
  if (!hero) return;

  // Clip-path reveal from center
  gsap.fromTo(
    hero,
    { clipPath: 'inset(15% 15% 15% 15%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.2,
      ease: 'expo.out',
      delay: 0.2,
    },
  );

  // Hero content stagger
  const heroChildren = hero.querySelectorAll<HTMLElement>('.hero-reveal');
  gsap.fromTo(
    heroChildren,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.1,
      delay: 0.6,
    },
  );
}

// ── Master init for homepage ────────────────────────────────────────────────

export function initProductAnimations(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initProductSlider();
}

// ── Master init for detail pages ────────────────────────────────────────────

export function initDetailAnimations(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initDetailHeroReveal();
  initDetailReveals();
}
