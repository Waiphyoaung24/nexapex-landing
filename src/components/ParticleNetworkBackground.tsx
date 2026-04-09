"use client";

/*
 * R3F inner-loop component — mutating ref/uniform/camera state every frame is
 * how this library works. The React 19 react-hooks/purity, immutability, and
 * refs rules fire on these idiomatic patterns. Disabling them for this file
 * is the pragmatic call; wrapping each useFrame mutation in abstractions
 * would obscure the code without changing behavior.
 */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/refs */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARTICLE_VERT, PARTICLE_FRAG } from "@/lib/particle-shaders";
import { particleScrollState } from "@/lib/scroll-state";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const SPREAD = 8;
const CONNECT_DISTANCE = 1.8;
const LINE_COLOR = 0x94fcff;

/** Device-tiered particle count. */
function getParticleCount(): number {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 30;
  const w = window.innerWidth;
  if (w >= 1024) return 90;
  if (w >= 640) return 45;
  return 20;
}

/** Camera keyframes keyed to whole-page scroll progress. */
const VIEWS = [
  { pos: new THREE.Vector3(0,  0.00, 5.0), rotY: 0.00 }, // 0.00
  { pos: new THREE.Vector3(0, -0.30, 6.5), rotY: 0.00 }, // 0.33
  { pos: new THREE.Vector3(0, -0.45, 7.0), rotY: 0.15 }, // 0.66
  { pos: new THREE.Vector3(0, -0.60, 7.0), rotY: 0.00 }, // 1.00
] as const;

function ParticleNetwork({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Build geometries/materials once per `count` change.
  const { geometry, material, lineGeometry, lineMaterial } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phase = new Float32Array(count);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 0.4;
      sizes[i] = 0.6 + Math.random() * 0.8;
      phase[i] = Math.random() * Math.PI * 2;
      vel[i * 3]     = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    velocitiesRef.current = vel;

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase",   new THREE.BufferAttribute(phase, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize:       { value: 0.6 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const maxLines = count * 3;
    const lineVerts = new Float32Array(maxLines * 2 * 3);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lineVerts, 3));
    lg.setDrawRange(0, 0);

    const lm = new THREE.LineBasicMaterial({
      color: LINE_COLOR,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: g, material: m, lineGeometry: lg, lineMaterial: lm };
  }, [count]);

  // Free GPU resources on unmount / count change.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [geometry, material, lineGeometry, lineMaterial]);

  useFrame((_, delta) => {
    if (count === 0) return;
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const vel = velocitiesRef.current;
    if (!vel) return;

    material.uniforms.uTime.value += delta;

    if (!reducedMotion) {
      const h = SPREAD / 2;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3]     += vel[i3];
        pos[i3 + 1] += vel[i3 + 1];
        pos[i3 + 2] += vel[i3 + 2];

        if (pos[i3]     >  h)       pos[i3]     = -h;
        if (pos[i3]     < -h)       pos[i3]     =  h;
        if (pos[i3 + 1] >  h * 0.6) pos[i3 + 1] = -h * 0.6;
        if (pos[i3 + 1] < -h * 0.6) pos[i3 + 1] =  h * 0.6;
        if (pos[i3 + 2] >  h * 0.4) pos[i3 + 2] = -h * 0.4;
        if (pos[i3 + 2] < -h * 0.4) pos[i3 + 2] =  h * 0.4;
      }
      posAttr.needsUpdate = true;
    }

    const lineAttr = lineGeometry.getAttribute("position") as THREE.BufferAttribute;
    const linePos = lineAttr.array as Float32Array;
    const maxSegments = Math.floor(linePos.length / 6);
    let segIndex = 0;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pos[i * 3]     - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECT_DISTANCE && segIndex < maxSegments) {
          const base = segIndex * 6;
          linePos[base]     = pos[i * 3];
          linePos[base + 1] = pos[i * 3 + 1];
          linePos[base + 2] = pos[i * 3 + 2];
          linePos[base + 3] = pos[j * 3];
          linePos[base + 4] = pos[j * 3 + 1];
          linePos[base + 5] = pos[j * 3 + 2];
          segIndex++;
        }
      }
    }
    lineGeometry.setDrawRange(0, segIndex * 2);
    lineAttr.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={material} />
      <lineSegments ref={linesRef} geometry={lineGeometry} material={lineMaterial} />
    </>
  );
}

function ScrollCameraRig() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3().copy(VIEWS[0].pos));
  const targetRotY = useRef<number>(VIEWS[0].rotY);

  useFrame((_, delta) => {
    const p = particleScrollState.progress;

    const pK = 1 - Math.exp(-6 * delta);
    particleScrollState.smoothedProgress +=
      (p - particleScrollState.smoothedProgress) * pK;
    const sp = particleScrollState.smoothedProgress;

    const segCount = VIEWS.length - 1;
    const seg = Math.min(sp * segCount, segCount - 0.001);
    const i = Math.floor(seg);
    const f = seg - i;
    const ease = f * f * (3 - 2 * f);

    const from = VIEWS[i];
    const to = VIEWS[Math.min(i + 1, VIEWS.length - 1)];

    targetPos.current.set(
      from.pos.x + (to.pos.x - from.pos.x) * ease,
      from.pos.y + (to.pos.y - from.pos.y) * ease,
      from.pos.z + (to.pos.z - from.pos.z) * ease,
    );
    targetRotY.current = from.rotY + (to.rotY - from.rotY) * ease;

    const camK = 1 - Math.exp(-4 * delta);
    camera.position.lerp(targetPos.current, camK);
    camera.rotation.y += (targetRotY.current - camera.rotation.y) * camK;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function ParticleNetworkBackground() {
  const countRef = useRef(getParticleCount());

  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        particleScrollState.progress = self.progress;
      },
    });
    return () => {
      st.kill();
      particleScrollState.progress = 0;
      particleScrollState.smoothedProgress = 0;
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ touchAction: "none" }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 100 }}
      >
        <ParticleNetwork count={countRef.current} />
        <ScrollCameraRig />
      </Canvas>
    </div>
  );
}
