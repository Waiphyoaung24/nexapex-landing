import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import SpaceScene from './SpaceScene';

/** Reports real loading progress to the HTML loader via custom event */
function ProgressReporter() {
  const { progress } = useProgress();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('space-load-progress', { detail: { progress } })
    );
  }, [progress]);

  return null;
}

export default function SpaceCanvas() {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    let st: any;

    async function setup() {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      const ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      st = ScrollTrigger.create({
        trigger: '#space-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        onUpdate: (self) => {
          setProgress(self.progress);
        },
      });
    }

    setup();

    return () => {
      if (st) st.kill();
    };
  }, []);

  const dpr: [number, number] = reducedMotion || isMobile ? [1, 1] : [1, 1.5];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 40, near: 0.1, far: 200 }}
        dpr={dpr}
        style={{ background: '#0e1418' }}
      >
        <SpaceScene scrollProgress={progress} />
        <ProgressReporter />
        <Preload all />
      </Canvas>
    </div>
  );
}
