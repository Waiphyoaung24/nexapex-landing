import { useRef, useEffect, useState, useCallback } from 'react';
import CapabilitiesScene, { PERSPECTIVES, HERO_START, HERO_END } from './CapabilitiesScene';

export default function CapabilitiesCanvas() {
  // Camera starts at the hero close-up position (not capabilities perspective 0)
  const cameraRef = useRef({ ...HERO_START.camera });
  const targetRef = useRef({ ...HERO_START.target });
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelReady, setModelReady] = useState(false);

  const handleModelReady = useCallback(() => {
    setModelReady(true);
    window.dispatchEvent(new CustomEvent('nexapex:model-ready'));
  }, []);

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

      const triggers: any[] = [];

      // Canvas reveal — after loader overlay exits
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        delay: 1.6,
      });

      // ── Hero phase: zoom-out + fade as user scrolls through hero ──
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Camera pulls back from close to far wide
      heroTl.fromTo(cameraRef.current,
        { x: HERO_START.camera.x, y: HERO_START.camera.y, z: HERO_START.camera.z },
        { x: HERO_END.camera.x, y: HERO_END.camera.y, z: HERO_END.camera.z, ease: 'power2.inOut' },
        0,
      );
      heroTl.fromTo(targetRef.current,
        { x: HERO_START.target.x, y: HERO_START.target.y, z: HERO_START.target.z },
        { x: HERO_END.target.x, y: HERO_END.target.y, z: HERO_END.target.z, ease: 'power2.inOut' },
        0,
      );

      triggers.push(heroTl.scrollTrigger);

      // Hero fade-out: opacity 1 → 0 in the last 30% of hero scroll
      // Keeps 3D visible longer as a backdrop (Lusion-style)
      const heroFadeST = ScrollTrigger.create({
        trigger: '#hero',
        start: '70% top',
        end: 'bottom top',
        scrub: 0.5,
        onUpdate: (self) => {
          if (containerRef.current) {
            containerRef.current.style.opacity = String(1 - self.progress);
          }
        },
      });
      triggers.push(heroFadeST);

      // ── Capabilities phase: existing orbit behavior ──
      const trigger = '#capabilities-scroll';

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
      // Also snap camera to PERSPECTIVES[0] so the orbit starts cleanly
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
        onEnter: () => {
          // Reset camera to capabilities start position
          Object.assign(cameraRef.current, PERSPECTIVES[0].camera);
          Object.assign(targetRef.current, PERSPECTIVES[0].target);
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
