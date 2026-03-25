import { useRef, useEffect } from 'react';
import CapabilitiesScene, { PERSPECTIVES } from './CapabilitiesScene';

export default function CapabilitiesCanvas() {
  const cameraRef = useRef({ ...PERSPECTIVES[0].camera });
  const targetRef = useRef({ ...PERSPECTIVES[0].target });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      const ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const trigger = '#capabilities-scroll';
      const triggers: any[] = [];

      // Master timeline: camera orbits through 3 perspectives
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });

      PERSPECTIVES.forEach((p, i) => {
        const start = i / PERSPECTIVES.length;
        const end = (i + 1) / PERSPECTIVES.length;
        const duration = end - start;

        tl.to(cameraRef.current, {
          x: p.camera.x,
          y: p.camera.y,
          z: p.camera.z,
          duration,
          ease: 'none',
        }, start);

        tl.to(targetRef.current, {
          x: p.target.x,
          y: p.target.y,
          z: p.target.z,
          duration,
          ease: 'none',
        }, start);
      });

      triggers.push(tl.scrollTrigger);

      // Fade in the canvas container when capabilities section starts
      const fadeInST = ScrollTrigger.create({
        trigger,
        start: 'top 80%',
        end: 'top 20%',
        scrub: 1,
        onUpdate: (self) => {
          if (containerRef.current) {
            containerRef.current.style.opacity = String(self.progress);
          }
        },
      });
      triggers.push(fadeInST);

      // Fade out the canvas container before it hits the next section
      const fadeOutST = ScrollTrigger.create({
        trigger,
        start: 'bottom 80%',
        end: 'bottom 20%',
        scrub: 1,
        onUpdate: (self) => {
          if (containerRef.current) {
            containerRef.current.style.opacity = String(1 - self.progress);
          }
        },
      });
      triggers.push(fadeOutST);

      cleanup = () => {
        triggers.forEach((t) => t?.kill?.());
        tl.kill();
      };
    }

    setup();
    return () => cleanup?.();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0,
      }}
    >
      <CapabilitiesScene cameraRef={cameraRef} targetRef={targetRef} />
    </div>
  );
}
