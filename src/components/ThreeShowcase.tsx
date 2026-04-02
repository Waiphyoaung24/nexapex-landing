"use client";

import { patchThreeWarnings } from "@/lib/patch-three-clock";
patchThreeWarnings();
import * as THREE from "three";
import { Suspense, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { SpaceStationModel } from "./SpaceStation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useSmoother } from "./SmoothScroll";
import { checkThreeShowcasePause } from "@/lib/scroll-pause";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

const scrollState = { progress: 0 };

/* ── Annotation hotspot on the 3D model ── */
function Annotation({ position, label, detail, active }: {
  position: [number, number, number];
  label: string;
  detail: string;
  active: boolean;
}) {
  return (
    <Html position={position} center distanceFactor={15} style={{ pointerEvents: "none" }}>
      <div className={`transition-all duration-500 ${active ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
        <div className="relative flex items-center gap-3">
          {/* Pulse dot */}
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-[#94fcff] shadow-[0_0_12px_rgba(148,252,255,0.6)]" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#94fcff] animate-ping opacity-40" />
          </div>
          {/* Label card */}
          <div className="bg-[#0e1418]/90 backdrop-blur-sm border border-[#94fcff]/20 rounded-lg px-3 py-2 whitespace-nowrap">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#94fcff]">{label}</p>
            <p className="text-[9px] text-white/50 mt-0.5">{detail}</p>
          </div>
        </div>
      </div>
    </Html>
  );
}

/* ── Scroll-locked camera — no user rotation, purely scroll-driven with smooth lerp ── */
const VIEWS = [
  { pos: [3, 1.5, 3],   target: [0, 0.5, 0],  fov: 42 },  // 0%:   tight, immersive
  { pos: [5, 2, 5],     target: [0, 0.5, 0],  fov: 48 },  // 25%:  pulling back
  { pos: [-6, 4, 5],    target: [0, 0, -1],   fov: 52 },  // 50%:  side angle, further
  { pos: [0, 10, 0.1],  target: [0, 0, 0],    fov: 55 },  // 75%:  bird's eye
  { pos: [16, 8, 16],   target: [0, 0, 0],    fov: 62 },  // 100%: dramatic wide pullout
];

function CameraController() {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(3, 1.5, 3));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const p = scrollState.progress;

    // Determine which two keyframes we're between
    const segment = Math.min(p * (VIEWS.length - 1), VIEWS.length - 1.001);
    const i = Math.floor(segment);
    const f = segment - i;
    const from = VIEWS[i];
    const to = VIEWS[Math.min(i + 1, VIEWS.length - 1)];

    // Smoothstep interpolation
    const ease = f * f * (3 - 2 * f);

    // Compute target position + subtle organic float
    const fx = Math.sin(t * 0.3) * 0.15;
    const fy = Math.cos(t * 0.2) * 0.08;
    targetPos.current.set(
      from.pos[0] + (to.pos[0] - from.pos[0]) * ease + fx,
      from.pos[1] + (to.pos[1] - from.pos[1]) * ease + fy,
      from.pos[2] + (to.pos[2] - from.pos[2]) * ease,
    );
    targetLookAt.current.set(
      from.target[0] + (to.target[0] - from.target[0]) * ease,
      from.target[1] + (to.target[1] - from.target[1]) * ease,
      from.target[2] + (to.target[2] - from.target[2]) * ease,
    );

    // Frame-rate-independent smooth lerp (higher = snappier, ~4 feels cinematic)
    const lerpFactor = 1 - Math.exp(-4 * delta);

    camera.position.lerp(targetPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);

    // Smooth FOV transition
    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = from.fov + (to.fov - from.fov) * ease;
    cam.fov += (targetFov - cam.fov) * lerpFactor;
    cam.updateProjectionMatrix();
  });

  return null;
}

/* ── Loading fallback ── */
function LoadingFallback() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d; });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#94fcff" wireframe transparent opacity={0.4} />
    </mesh>
  );
}

/* ── Scene ── */
function Scene() {
  const p = scrollState.progress;
  // Show annotations at different scroll phases
  const phase = Math.floor(p * 4);

  return (
    <>
      <ambientLight intensity={3} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#f0f1ef" castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#94fcff" />
      <pointLight position={[5, 2, 5]} intensity={0.4} color="#c63518" />

      <Suspense fallback={<LoadingFallback />}>
        <SpaceStationModel />

        {/* Annotation hotspots on the model */}
        <Annotation position={[2, 2, 0]} label="Vision Engine" detail="Real-time detection pipeline" active={phase >= 1} />
        <Annotation position={[-3, 1, 2]} label="Language Core" detail="Multilingual AI assistant" active={phase >= 2} />
        <Annotation position={[0, 4, -2]} label="Doc Processor" detail="OCR + extraction pipeline" active={phase >= 3} />
      </Suspense>

      <Environment preset="night" />
      <fog attach="fog" args={[0x0e1418, 8, 40]} />
      <CameraController />
    </>
  );
}

/* ── Brand content panels — appear at different scroll phases ── */
const brandPanels = [
  {
    title: "Where AI Meets\nBusiness",
    subtitle: "NEX APEX",
    body: "We build AI that works in the real world \u2014 not just in research papers. From computer vision to document processing, our solutions ship fast and deliver measurable results.",
  },
  {
    title: "Eyes That\nNever Blink",
    subtitle: "COMPUTER VISION",
    body: "Object detection, defect inspection, inventory counting \u2014 our vision systems run on any camera, any device. Trained on your products, deployed where you need them.",
  },
  {
    title: "Your Business,\nIts Language",
    subtitle: "AI ASSISTANTS",
    body: "Custom-trained AI assistants that know your industry, speak your customers\u2019 language \u2014 English, Burmese, or Thai \u2014 and handle enquiries 24/7 without breaking a sweat.",
  },
  {
    title: "Paper to Data\nin Seconds",
    subtitle: "DOCUMENT INTELLIGENCE",
    body: "Upload an invoice, scan a receipt, photograph a contract. Our extraction pipeline pulls structured data from any document and feeds it straight into your workflow.",
  },
];

export function ThreeShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fadeOverlayRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState(0);
  const smoother = useSmoother();

  const onScrollProgress = useCallback((p: number) => {
    scrollState.progress = p;
    setActivePanel(Math.min(Math.floor(p * 4), 3));
    // Check if we should pause at panel entry points
    if (smoother) {
      checkThreeShowcasePause(smoother, p);
    }
  }, [smoother]);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: "top top",
        end: "+=2500",
        scrub: 1.5,
        onUpdate: (self) => onScrollProgress(self.progress),
      },
    });

    // Cinematic reveal: horizontal split-open from center
    const canvasWrap = canvasWrapRef.current;
    if (canvasWrap) {
      gsap.set(canvasWrap, { clipPath: "inset(0% 50%)" });
      tl.to(canvasWrap, {
        clipPath: "inset(0% 0%)",
        duration: 0.12,
        ease: "power3.inOut",
      }, 0);
    }

    // Section header — visible before 3D, fades out as canvas reveals
    const headerEl = sectionHeaderRef.current;
    if (headerEl) {
      tl.to(headerEl, {
        autoAlpha: 0, scale: 0.95, duration: 0.1, ease: "power2.in",
      }, 0.02);
    }

    // Animate each brand panel in sequence
    panelRefs.current.forEach((panel, i) => {
      if (!panel) return;
      const subtitleEl = panel.querySelector(".panel-subtitle");
      const titleEl = panel.querySelector(".panel-title");
      const bodyEl = panel.querySelector(".panel-body");
      const startAt = i * 0.25;

      // Enter
      if (subtitleEl) {
        tl.from(subtitleEl, {
          y: 20, autoAlpha: 0, duration: 0.2, ease: "power2.out",
        }, startAt);
      }
      if (titleEl) {
        const split = SplitText.create(titleEl, { type: "lines, words" });
        tl.from(split.words, {
          y: 60, autoAlpha: 0, stagger: 0.02, duration: 0.3, ease: "power4.out",
        }, startAt);
      }
      if (bodyEl) {
        tl.from(bodyEl, {
          y: 30, autoAlpha: 0, duration: 0.25, ease: "power2.out",
        }, startAt + 0.05);
      }

      // Exit (except last panel)
      if (i < brandPanels.length - 1) {
        tl.to(panel, {
          autoAlpha: 0, y: -40, duration: 0.15,
        }, startAt + 0.2);
      }
    });

    // Final fade-out — starts at 0.90 and fills to end (no dead scroll after)
    if (fadeOverlayRef.current) {
      tl.to(fadeOverlayRef.current, { autoAlpha: 1, duration: 0.10, ease: "power2.in" }, 0.90);
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative min-h-screen h-screen w-full overflow-hidden bg-[#0e1418]">
      {/* Full-bleed 3D Canvas */}
      <div ref={canvasWrapRef} className="absolute inset-0">
        <Canvas
          camera={{ position: [3, 1.5, 3], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        >
          <color attach="background" args={[0x0e1418]} />
          <Scene />
        </Canvas>
      </div>

      {/* Top / bottom gradient fades */}
      <div className="absolute top-0 left-0 right-0 h-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #0e1418, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, #0e1418, transparent)" }} />

      {/* Centered section header — visible before 3D reveal, fades out on scroll */}
      <div
        ref={sectionHeaderRef}
        className="absolute inset-0 z-[25] flex flex-col items-center justify-center pointer-events-none"
      >
        <p className="text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-4">
          Explore
        </p>
        <h2
          className="font-normal uppercase tracking-[3px] text-white font-[family-name:var(--font-display)] text-center leading-[1.1]"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          What We Build
        </h2>
        <div className="mt-6 h-px w-16 bg-[#94fcff]/30" />
      </div>

      {/* Brand content panels — stacked, revealed by scroll */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {brandPanels.map((panel, i) => (
          <div
            key={i}
            ref={(el) => { panelRefs.current[i] = el; }}
            className="absolute bottom-16 left-5 md:left-[60px] max-w-[420px]"
          >
            <p className="panel-subtitle text-[11px] font-medium uppercase tracking-[3px] text-[#94fcff]/50 mb-2 font-mono">
              {panel.subtitle}
            </p>
            <h2 className="panel-title text-3xl md:text-[56px] font-normal uppercase tracking-[1px] text-white font-[family-name:var(--font-display)] leading-[0.9] mb-4 whitespace-pre-line">
              {panel.title}
            </h2>
            <p className="panel-body text-[13px] leading-relaxed text-white/60 max-w-[340px]">
              {panel.body}
            </p>
          </div>
        ))}
      </div>

      {/* Active phase indicator — right side */}
      <div className="absolute right-5 md:right-[60px] top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="flex flex-col gap-2">
          {brandPanels.map((_, i) => (
            <div
              key={i}
              className="transition-all duration-500"
              style={{
                width: activePanel === i ? 24 : 8,
                height: 3,
                borderRadius: 2,
                backgroundColor: activePanel === i ? "#94fcff" : "rgba(148,252,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Fade-out overlay */}
      <div ref={fadeOverlayRef} className="absolute inset-0 z-30 bg-[#0e1418] pointer-events-none"
        style={{ visibility: "hidden", opacity: 0 }} />

    </section>
  );
}
