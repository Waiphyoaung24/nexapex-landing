"use client";

import { useRef, Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { Physics, useSphere } from "@react-three/cannon";
import { EffectComposer, N8AO, SMAA, Bloom } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

/* ── 3D Ball Clump ── */
const rfs = THREE.MathUtils.randFloatSpread;
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const baubleMaterial = new THREE.MeshStandardMaterial({
  color: "#0e1418",
  roughness: 0.15,
  metalness: 0.8,
  envMapIntensity: 1.2,
});

function Clump({
  mat = new THREE.Matrix4(),
  vec = new THREE.Vector3(),
}: {
  mat?: THREE.Matrix4;
  vec?: THREE.Vector3;
}) {
  const texture = useTexture("/images/Flat_white.png");
  const [ref, api] = useSphere(() => ({
    args: [1],
    mass: 1,
    angularDamping: 0.1,
    linearDamping: 0.65,
    position: [rfs(20), rfs(20), rfs(20)] as [number, number, number],
  }));

  useFrame(() => {
    const mesh = ref.current as THREE.InstancedMesh | null;
    if (!mesh) return;
    for (let i = 0; i < 40; i++) {
      mesh.getMatrixAt(i, mat);
      api.at(i).applyForce(
        vec.setFromMatrixPosition(mat).normalize().multiplyScalar(-40).toArray() as [number, number, number],
        [0, 0, 0]
      );
    }
  });

  return (
    <instancedMesh
      ref={ref as React.RefObject<THREE.InstancedMesh | null>}
      args={[sphereGeometry, baubleMaterial, 40]}
      material-map={texture}
    />
  );
}

function Pointer() {
  const viewport = useThree((state) => state.viewport);
  const [, api] = useSphere(() => ({
    type: "Kinematic" as const,
    args: [3],
    position: [0, 0, 0] as [number, number, number],
  }));
  useFrame((state) =>
    api.position.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
      0
    )
  );
  return null;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} />
      <Physics gravity={[0, 2, 0]} iterations={10}>
        <Pointer />
        <Clump />
      </Physics>
      <Environment preset="city" />
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <N8AO halfRes color="black" aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
        <Bloom mipmapBlur levels={7} intensity={0.8} />
        <SMAA />
      </EffectComposer>
    </>
  );
}

/* ── CTA Section ── */
export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const tagline = section.querySelector(".cta-tagline");
    if (tagline) {
      gsap.from(tagline, {
        y: 20, autoAlpha: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 60%", toggleActions: "play none none reverse" },
      });
    }

    const heading = section.querySelector(".cta-heading");
    if (heading) {
      const split = SplitText.create(heading, { type: "words" });
      gsap.from(split.words, {
        y: 80,
        autoAlpha: 0,
        rotateX: -60,
        stagger: 0.08,
        duration: 1.0,
        ease: "power4.out",
        scrollTrigger: { trigger: section, start: "top 55%", toggleActions: "play none none reverse" },
      });
    }

    const cta = section.querySelector(".cta-button");
    if (cta) {
      gsap.from(cta, {
        y: 30, autoAlpha: 0, duration: 0.6, delay: 0.4, ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 55%", toggleActions: "play none none reverse" },
      });
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0e1418] text-white"
    >
      {/* 3D Canvas — transparent so section bg-[#c63518] shows through */}
      <div className="absolute inset-0 z-0">
        <Canvas
          gl={{ antialias: false, alpha: true }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 40 }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      {/* Content overlay — pointer-events-none so mouse passes through to Canvas */}
      <div className="relative z-10 pointer-events-none flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:py-32 md:px-[60px] lg:py-48">
        {/* Tagline */}
        <p className="cta-tagline text-[10px] sm:text-[11px] font-mono uppercase tracking-[3px] sm:tracking-[4px] text-white/70 mb-4 sm:mb-6">
          Ready to see AI in action?
        </p>

        {/* Main heading */}
        <h2
          className="cta-heading font-[family-name:var(--font-display)] uppercase text-center leading-[0.95] tracking-[-0.01em] text-white"
          style={{ fontSize: "clamp(1.8rem, 7vw, 7rem)" }}
        >
          Let&apos;s build<br />something real.
        </h2>

        {/* Primary CTA */}
        <a
          href="mailto:nexuslab.dev.mm@gmail.com"
          className={cn(
            "cta-button mt-8 sm:mt-12 z-10 group pointer-events-auto",
            "flex items-center gap-2 sm:gap-3",
            "rounded-full bg-white px-6 py-3 sm:px-8 sm:py-4",
            "font-mono text-[11px] sm:text-[12px] font-medium uppercase tracking-[1px] text-[#0e1418]",
            "cursor-pointer transition-all duration-300",
            "hover:bg-white/95 hover:shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:scale-[1.03]",
            "active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Book a Consultation
          <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </section>
  );
}
