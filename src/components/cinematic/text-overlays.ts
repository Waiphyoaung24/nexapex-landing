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

  scenePerspectives.forEach((perspective, index) => {
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
      // Standard perspectives: character-split title + subtitle
      el.innerHTML = `
        <h2>${splitTextToChars(perspective.title, 'font-d text-[4vw] max-md:text-2xl font-bold leading-[1.1] mb-2 tracking-tight text-white drop-shadow-2xl')}</h2>
        ${perspective.subtitle ? `<p>${splitTextToChars(perspective.subtitle, 'font-b text-[1.25vw] max-md:text-base leading-[1.4] text-white/70 font-light drop-shadow-lg')}</p>` : ''}
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

        const titleChars = textEl.querySelectorAll('h2 .inline-block');
        const subtitleChars = textEl.querySelectorAll('p .inline-block');
        const allChars = [...Array.from(subtitleChars), ...Array.from(titleChars)];

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
          // Hero perspective: h2 is plain text (not split chars), animate block + label chars
          const heroH2 = textEl.querySelector('h2');
          const labelChars = Array.from(subtitleChars);

          // Start hidden — fade in after 2% scroll so cube section is clear
          gsap.set(textEl, { opacity: 0 });
          gsap.set(labelChars, { x: 0, opacity: 1 });
          if (heroH2) gsap.set(heroH2, { x: 0, opacity: 1 });

          // Fade in at 0–2% of scroll-container
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
        } else if (index === scenePerspectives.length - 2) {
          // "NEX APEX" — brand moment: slower enter, longer hold
          tl.fromTo(
            allChars,
            { x: -80, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.2,
              stagger: -0.01,
              ease: 'power2.out',
            },
          )
            .to({}, { duration: 1.0 })
            .to(allChars, {
              x: 80,
              opacity: 0,
              duration: 0.25,
              stagger: -0.02,
              ease: 'power2.in',
            });
        } else {
          // Standard: enter → hold → exit
          tl.fromTo(
            allChars,
            { x: -80, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.25,
              stagger: -0.02,
              ease: 'power2.out',
            },
          )
            .to({}, { duration: 0.5 })
            .to(allChars, {
              x: 80,
              opacity: 0,
              duration: 0.25,
              stagger: -0.02,
              ease: 'power2.in',
            });
        }
      });
    },
  );

  return () => {
    triggers.forEach((t) => t.kill());
  };
}
