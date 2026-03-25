import { useRef, useEffect, useState, useCallback } from 'react';
import CapabilitiesScene, { PERSPECTIVES } from './CapabilitiesScene';

export default function CapabilitiesCanvas() {
  const cameraRef = useRef({ ...PERSPECTIVES[0].camera });
  const targetRef = useRef({ ...PERSPECTIVES[0].target });
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelReady, setModelReady] = useState(false);

  const handleModelReady = useCallback(() => setModelReady(true), []);

  // Init GSAP only after model has loaded
  useEffect(() => {
    if (!modelReady) return;

    let cleanup: (() => void) | undefined;

    async function setup() {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      const ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const trigger = '#capabilities-scroll';
      const triggers: any[] = [];

      // Master timeline: camera orbits through perspectives
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          invalidateOnRefresh: true,
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

      // Fade-in: when capabilities section enters viewport
      const fadeInST = ScrollTrigger.create({
        trigger,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.5,
        onUpdate: (self) => {
          if (containerRef.current) {
            containerRef.current.style.opacity = String(self.progress);
          }
        },
      });
      triggers.push(fadeInST);

      // Fade-out: as bottom of section leaves viewport
      const fadeOutST = ScrollTrigger.create({
        trigger,
        start: 'bottom bottom',
        end: 'bottom 60%',
        scrub: 0.5,
        onUpdate: (self) => {
          if (containerRef.current) {
            containerRef.current.style.opacity = String(1 - self.progress);
          }
        },
      });
      triggers.push(fadeOutST);

      // Recalculate positions now that model + scene are ready
      ScrollTrigger.refresh();

      cleanup = () => {
        triggers.forEach((t) => t?.kill?.());
        tl.kill();
      };
    }

    setup();
    return () => cleanup?.();
  }, [modelReady]);

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
      <CapabilitiesScene
        cameraRef={cameraRef}
        targetRef={targetRef}
        onModelReady={handleModelReady}
      />
    </div>
  );
}
