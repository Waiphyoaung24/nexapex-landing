import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import NexApexScene from './NexApexScene';
import TextOverlays from './TextOverlays';
import ProgressBar from './ProgressBar';
import Loader from './Loader';
import { scenePerspectives } from './scene-data';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/** Detect device tier for performance scaling */
function getDeviceTier(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function hasWebGL2(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Mobile static fallback — no WebGL, typography-driven hero */
function MobileFallback() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return;

    const triggers: ScrollTrigger[] = [];

    // Fade out the hero heading on scroll
    if (heroRef.current) {
      const st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: '5% top',
        end: '20% top',
        scrub: 0.5,
        onUpdate: (self) => {
          if (!heroRef.current) return;
          const opacity = 1 - self.progress;
          const y = self.progress * -30;
          heroRef.current.style.opacity = String(opacity);
          heroRef.current.style.transform = `translateY(${y}px)`;
        },
      });
      triggers.push(st);
    }

    // Scroll-triggered secondary messages
    const texts = containerRef.current.querySelectorAll('.mobile-text');
    texts.forEach((el, i) => {
      const st = ScrollTrigger.create({
        trigger: containerRef.current!,
        start: `${20 + i * 25}% top`,
        end: `${40 + i * 25}% top`,
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          let opacity = 0;
          if (progress < 0.3) opacity = progress / 0.3;
          else if (progress < 0.7) opacity = 1;
          else opacity = 1 - (progress - 0.7) / 0.3;
          (el as HTMLElement).style.opacity = String(opacity);
        },
      });
      triggers.push(st);
    });

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <div ref={containerRef} style={{ height: '250vh' }} className="relative">
      <div className="sticky top-0 h-screen h-dvh flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(26,38,48,0.6), #0e1418 70%)' }}
      >
        {/* Hero content — visible immediately */}
        <div ref={heroRef} className="flex flex-col items-center text-center px-6">
          <div className="relative w-16 h-16 mb-8"
            style={{ filter: 'drop-shadow(0 0 30px rgba(148,252,255,0.08))' }}
          >
            <img src="/full_color_logo.png" alt="NexApex" className="w-full h-full object-contain" />
          </div>
          <p className="font-m text-[11px] font-normal tracking-[0.45em] text-dim mb-5">NEXAPEX</p>
          <h1 className="font-d font-bold leading-[1.1] tracking-[0.02em] text-gradient-hero"
            style={{ fontSize: 'clamp(32px, 10vw, 52px)' }}
          >
            THE APEX OF<br />INTELLIGENCE
          </h1>
        </div>

        {/* Scroll-triggered secondary messages */}
        {['INTELLIGENCE \u00B7 INTEGRATION \u00B7 OPTIMIZATION', 'SCALABLE AI FOR REAL-WORLD OPERATIONS', 'REACH THE PEAK'].map(
          (text, i) => (
            <p
              key={i}
              className="mobile-text absolute font-d font-bold text-xl tracking-tight text-white text-center px-8 opacity-0"
              style={{ top: '58%' }}
            >
              {text}
            </p>
          ),
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="w-px h-10 bg-gradient-to-b from-cyan/40 to-transparent animate-pulse-line" />
          <span className="font-m text-[9px] tracking-[0.3em] uppercase text-dim/50">Scroll</span>
        </div>
      </div>
    </div>
  );
}

/** Reduced motion fallback — static hero */
function ReducedMotionFallback() {
  return (
    <div className="relative h-screen flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(26,38,48,0.6), #0e1418 70%)' }}
    >
      <div className="w-32 h-32 mb-8"
        style={{ filter: 'drop-shadow(0 0 50px rgba(148,252,255,0.1))' }}
      >
        <img src="/full_color_logo.png" alt="NexApex" className="w-full h-full object-contain" />
      </div>
      <p className="font-m text-[11px] tracking-[0.45em] uppercase text-dim mb-6">NEXAPEX</p>
      <h1 className="font-d font-bold text-gradient-hero text-center px-6 leading-[1.05]"
        style={{ fontSize: 'clamp(32px, 5.8vw, 84px)', letterSpacing: '0.02em' }}
      >
        THE APEX OF<br />INTELLIGENCE
      </h1>
    </div>
  );
}

/** Main cinematic hero — full 3D experience */
export default function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const gradientBridgeRef = useRef<HTMLDivElement>(null);
  const scrollArrowRef = useRef<HTMLDivElement>(null);
  const cameraAnimRef = useRef({ x: 0, y: 0, z: 12 });
  const targetAnimRef = useRef({ x: 0, y: 0, z: 0 });
  const scrollVelocityRef = useRef({ value: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastProgressRef = useRef(0);

  const [isLoading, setIsLoading] = useState(true);
  const [deviceTier] = useState(getDeviceTier);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [webgl2] = useState(hasWebGL2);

  // Dismiss SSR loading screen — React's own Loader takes over seamlessly
  useEffect(() => {
    const el = document.getElementById('ssr-loader');
    if (el) el.remove();
  }, []);

  // Loading sequence
  useEffect(() => {
    if (deviceTier === 'mobile' || reducedMotion || !webgl2) return;

    const timer = setTimeout(() => {
      document.fonts.ready.then(() => {
        setIsLoading(false);
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [deviceTier, reducedMotion, webgl2]);

  // Master GSAP timeline + camera animation
  useEffect(() => {
    if (deviceTier === 'mobile' || reducedMotion || !webgl2) return;
    if (!containerRef.current || !canvasWrapperRef.current) return;

    // Wait for loading to finish
    if (isLoading) return;

    const canvasWrapper = canvasWrapperRef.current;

    // Master camera timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // Compute scroll velocity for particle lines
          const velocity = self.progress - lastProgressRef.current;
          scrollVelocityRef.current.value = velocity * 60; // Normalize to ~per-frame
          lastProgressRef.current = self.progress;
        },
      },
    });

    // Add camera position and target tweens for each perspective
    scenePerspectives.forEach((perspective) => {
      const startProgress = perspective.scrollProgress.start / 100;
      const endProgress = perspective.scrollProgress.end / 100;
      const duration = endProgress - startProgress;

      tl.to(
        cameraAnimRef.current,
        {
          x: perspective.camera.x,
          y: perspective.camera.y,
          z: perspective.camera.z,
          duration,
          ease: 'none',
        },
        startProgress,
      );

      tl.to(
        targetAnimRef.current,
        {
          x: perspective.target.x,
          y: perspective.target.y,
          z: perspective.target.z,
          duration,
          ease: 'none',
        },
        startProgress,
      );
    });

    // Transition zone: fade out canvas + fade in gradient bridge (88-100%)
    gsap.to(canvasWrapper, {
      opacity: 0,
      scrollTrigger: {
        trigger: containerRef.current,
        start: '88% top',
        end: '98% top',
        scrub: true,
        onLeave: () => {
          canvasWrapper.style.display = 'none';
        },
        onEnterBack: () => {
          canvasWrapper.style.display = '';
          gsap.set(canvasWrapper, { opacity: 1 });
        },
      },
    });

    // Fade in gradient bridge during transition
    if (gradientBridgeRef.current) {
      gsap.to(gradientBridgeRef.current, {
        opacity: 1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: '85% top',
          end: '95% top',
          scrub: true,
        },
      });
    }

    // Fade out scroll arrow early
    if (scrollArrowRef.current) {
      gsap.to(scrollArrowRef.current, {
        opacity: 0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: '5% top',
          end: '15% top',
          scrub: true,
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isLoading, deviceTier, reducedMotion, webgl2]);

  // Reduced motion: static hero
  if (reducedMotion) {
    return <ReducedMotionFallback />;
  }

  // Mobile or no WebGL2: fallback
  if (deviceTier === 'mobile' || !webgl2) {
    return <MobileFallback />;
  }

  const particleCount = deviceTier === 'tablet' ? 400 : 800;
  const dpr: [number, number] = deviceTier === 'tablet' ? [1, 1.5] : [1, 2];

  // Mouse tracking for interactive parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    mouseRef.current.x = x;
    mouseRef.current.y = y;
  };

  return (
    <>
      <Loader isLoading={isLoading} />

      {/* 3D Canvas — fixed full viewport */}
      <div
        ref={canvasWrapperRef}
        className="fixed inset-0 w-full h-screen max-md:h-dvh z-0"
        onMouseMove={handleMouseMove}
      >
        <Canvas
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={dpr}
          style={{ background: '#0e1418' }}
        >
          <Suspense fallback={null}>
            <NexApexScene
              cameraAnimRef={cameraAnimRef}
              targetAnimRef={targetAnimRef}
              scrollVelocityRef={scrollVelocityRef}
              mouseRef={mouseRef}
              particleCount={particleCount}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Scroll arrow indicator */}
      <div ref={scrollArrowRef} className="fixed left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="flex flex-col items-center gap-4">
          <svg width="24" height="32" viewBox="0 0 24 32">
            <path
              d="M 12 4 L 12 24 M 12 24 L 8 20 M 12 24 L 16 20"
              stroke="currentColor"
              strokeWidth="0.5"
              fill="none"
              className="text-white/60"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
            />
          </svg>
          <div
            className="w-1 h-1 rounded-full bg-white/40"
            style={{ boxShadow: '0 0 6px rgba(255,255,255,0.4)' }}
          />
        </div>
      </div>

      {/* Text overlays */}
      <TextOverlays containerRef={containerRef} />

      {/* Progress bar */}
      <ProgressBar containerRef={containerRef} />

      {/* Gradient bridge — fades in during transition zone */}
      <div
        ref={gradientBridgeRef}
        className="fixed bottom-0 left-0 right-0 h-[40vh] z-[5] pointer-events-none opacity-0"
        style={{
          background: 'linear-gradient(to bottom, transparent, #0e1418 70%)',
        }}
      />

      {/* Scroll trigger container — 700vh tall invisible div */}
      <div
        ref={containerRef}
        className="relative z-20"
        style={{ height: '700vh' }}
      />
    </>
  );
}
