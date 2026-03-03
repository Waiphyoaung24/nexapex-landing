import { useRef, useEffect, useCallback } from 'react';
import { scenePerspectives, getPositionClasses } from './scene-data';

interface TextOverlaysProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/** Splits text into individual character spans for GSAP animation */
function SplitChars({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{ willChange: 'transform, opacity' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export default function TextOverlays({ containerRef }: TextOverlaysProps) {
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setTextRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      textRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const gsapModule = import('gsap');
    const scrollTriggerModule = import('gsap/ScrollTrigger');

    Promise.all([gsapModule, scrollTriggerModule]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const triggers: ScrollTrigger[] = [];

        scenePerspectives.forEach((perspective, index) => {
          const textEl = textRefs.current[index];
          if (!textEl || !containerRef.current) return;

          if (perspective.hideText) {
            gsap.set(textEl, { opacity: 0, pointerEvents: 'none' });
            return;
          }

          const titleChars = textEl.querySelectorAll('h2 .inline-block');
          const subtitleChars = textEl.querySelectorAll('p .inline-block');
          const allChars = [...Array.from(subtitleChars), ...Array.from(titleChars)];

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: `${perspective.scrollProgress.start}% top`,
              end: `${perspective.scrollProgress.end}% top`,
              scrub: 0.5,
            },
          });

          const st = tl.scrollTrigger;
          if (st) triggers.push(st);

          if (index === 0) {
            // First perspective: starts visible, only exits
            gsap.set(allChars, { x: 0, opacity: 1 });
            tl.to(allChars, {
              x: 80,
              opacity: 0,
              duration: 1,
              stagger: -0.02,
              ease: 'power2.in',
            });
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

        return () => {
          triggers.forEach((t) => t.kill());
        };
      },
    );
  }, [containerRef]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {scenePerspectives.map((perspective, index) => (
        <div
          key={index}
          ref={setTextRef(index)}
          className={`absolute ${getPositionClasses(perspective.position)}`}
        >
          {!perspective.hideText && (
            <>
              <h2>
                <SplitChars
                  text={perspective.title}
                  className="font-d text-[4vw] max-md:text-2xl font-bold leading-[1.1] mb-2 tracking-tight text-white drop-shadow-2xl"
                />
              </h2>
              <p>
                <SplitChars
                  text={perspective.subtitle}
                  className="font-b text-[1.25vw] max-md:text-base leading-[1.4] text-white/70 font-light drop-shadow-lg"
                />
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
