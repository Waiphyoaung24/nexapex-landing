import { scenePerspectives, getPositionClasses } from './scene-data';

/** Splits text into individual character spans for GSAP animation */
function splitTextToChars(text: string, className: string): string {
  const chars = text.split('').map((char) => {
    const c = char === ' ' ? '\u00A0' : char;
    return `<span class="inline-block" style="will-change: transform, opacity;">${c}</span>`;
  });
  return `<span class="${className}">${chars.join('')}</span>`;
}

/** Create all text overlay DOM elements inside the given container */
export function createTextOverlays(container: HTMLElement): HTMLElement[] {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'fixed inset-0 pointer-events-none z-10';

  const textElements: HTMLElement[] = [];

  scenePerspectives.forEach((perspective) => {
    const el = document.createElement('div');
    el.className = `absolute ${getPositionClasses(perspective.position)}`;

    if (!perspective.hideText && perspective.isHero) {
      // Hero perspective: label above, plain text heading (for gradient)
      el.innerHTML = `
        ${perspective.subtitle ? `
        <p class="mb-3 max-md:mb-2">
          ${splitTextToChars(perspective.subtitle, 'font-m text-[0.85vw] max-md:text-[11px] font-normal tracking-[0.45em] text-dim drop-shadow-lg')}
        </p>
        ` : ''}
        <h2 class="font-d text-[5.8vw] max-md:text-[9vw] font-bold leading-[1.05] tracking-[0.02em] text-gradient-hero mt-5">
          ${perspective.title.split('\n').map((line) => `<span class="block">${line}</span>`).join('')}
        </h2>
      `;
    } else if (!perspective.hideText) {
      // Standard perspectives: plain text title (for gradient) + character-split subtitle
      const hasMultiline = perspective.title.includes('\n');
      const titleHtml = hasMultiline
        ? perspective.title.split('\n').map((line: string) => `<span class="block">${line}</span>`).join('')
        : perspective.title;
      const ariaAttr = hasMultiline ? ` aria-label="${perspective.title.replace(/\n/g, ' ')}"` : '';
      el.innerHTML = `
        <h2 class="font-d text-[4vw] max-md:text-2xl font-bold leading-[1.1] mb-2 tracking-tight text-gradient-hero drop-shadow-2xl"${ariaAttr}>${titleHtml}</h2>
        ${perspective.subtitle ? `<p>${splitTextToChars(perspective.subtitle, 'font-b text-[1.25vw] max-md:text-base leading-[1.4] text-white font-light drop-shadow-lg')}</p>` : ''}
      `;
    }

    overlayContainer.appendChild(el);
    textElements.push(el);
  });

  container.appendChild(overlayContainer);
  return textElements;
}

/** Initialize GSAP scroll-triggered animations for text overlays */
export function initTextAnimations(
  textElements: HTMLElement[],
  scrollContainer: HTMLElement,
): (() => void) {
  const gsapModule = import('gsap');
  const scrollTriggerModule = import('gsap/ScrollTrigger');

  let triggers: any[] = [];

  Promise.all([gsapModule, scrollTriggerModule]).then(
    ([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);

      scenePerspectives.forEach((perspective, index) => {
        const textEl = textElements[index];
        if (!textEl) return;

        if (perspective.hideText) {
          gsap.set(textEl, { opacity: 0, pointerEvents: 'none' });
          return;
        }

        const subtitleChars = textEl.querySelectorAll('p .inline-block');
        const heroH2 = textEl.querySelector('h2');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scrollContainer,
            start: `${perspective.scrollProgress.start}% top`,
            end: `${perspective.scrollProgress.end}% top`,
            scrub: 0.5,
          },
        });

        const st = tl.scrollTrigger;
        if (st) triggers.push(st);

        if (index === 0) {
          // Hero perspective: animate h2 block + label chars
          const labelChars = Array.from(subtitleChars);

          gsap.set(textEl, { opacity: 0 });
          gsap.set(labelChars, { x: 0, opacity: 1 });
          if (heroH2) gsap.set(heroH2, { x: 0, opacity: 1 });

          // Fade in at 0-2% of scroll-container
          const fadeInSt = ScrollTrigger.create({
            trigger: scrollContainer,
            start: '0% top',
            end: '2% top',
            scrub: 0.5,
            onUpdate: (self) => {
              gsap.set(textEl, { opacity: self.progress });
            },
          });
          triggers.push(fadeInSt);

          // Exit: heading slides out first, then label follows
          if (heroH2) {
            tl.to(heroH2, {
              x: 60,
              opacity: 0,
              duration: 0.6,
              ease: 'power2.in',
            }, 0.3);
          }
          tl.to(labelChars, {
            x: 40,
            opacity: 0,
            duration: 0.4,
            stagger: -0.02,
            ease: 'power2.in',
          }, 0.5);
        } else {
          // Standard + brand perspectives: animate h2 as block, subtitle chars individually
          const isLastTextPerspective = index === scenePerspectives.length - 2;
          const holdDuration = isLastTextPerspective ? 1.0 : 0.5;
          const enterDuration = isLastTextPerspective ? 0.2 : 0.25;
          const enterStagger = isLastTextPerspective ? -0.01 : -0.02;

          // Title: slide in/out as a whole block (preserves gradient)
          if (heroH2) {
            tl.fromTo(
              heroH2,
              { x: -60, opacity: 0 },
              { x: 0, opacity: 1, duration: enterDuration, ease: 'power2.out' },
            );
          }

          // Subtitle chars: staggered character animation
          if (subtitleChars.length > 0) {
            tl.fromTo(
              Array.from(subtitleChars),
              { x: -80, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: enterDuration,
                stagger: enterStagger,
                ease: 'power2.out',
              },
              '<0.05',
            );
          }

          // Hold
          tl.to({}, { duration: holdDuration });

          // Exit: title slides out
          if (heroH2) {
            tl.to(heroH2, {
              x: 60,
              opacity: 0,
              duration: 0.25,
              ease: 'power2.in',
            });
          }

          // Exit: subtitle chars stagger out
          if (subtitleChars.length > 0) {
            tl.to(
              Array.from(subtitleChars),
              {
                x: 80,
                opacity: 0,
                duration: 0.25,
                stagger: -0.02,
                ease: 'power2.in',
              },
              '<0.05',
            );
          }
        }
      });
    },
  );

  return () => {
    triggers.forEach((t) => t.kill());
  };
}
