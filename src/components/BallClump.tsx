"use client";

import { useRef, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { Physics, useSphere } from "@react-three/cannon";
import {
  EffectComposer,
  N8AO,
  SMAA,
  Bloom,
} from "@react-three/postprocessing";
import { patchThreeWarnings } from "@/lib/patch-three-clock";

// Suppress R3F-internal deprecation warnings (THREE.Clock, etc.) on pages
// that render BallClump without ThreeShowcase.
patchThreeWarnings();

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
      api
        .at(i)
        .applyForce(
          vec
            .setFromMatrixPosition(mat)
            .normalize()
            .multiplyScalar(-40)
            .toArray() as [number, number, number],
          [0, 0, 0]
        );
    }
  });

  return (
    <instancedMesh
      ref={ref as React.RefObject<THREE.InstancedMesh | null>}
      castShadow
      receiveShadow
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
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    )
  );

  return null;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight
        intensity={1}
        angle={0.2}
        penumbra={1}
        position={[30, 30, 30]}
        castShadow
      />
      <Physics gravity={[0, 2, 0]} iterations={10}>
        <Pointer />
        <Clump />
      </Physics>
      <Environment preset="city" />
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <N8AO
          halfRes
          color="black"
          aoRadius={2}
          intensity={1}
          aoSamples={6}
          denoiseSamples={4}
        />
        <Bloom mipmapBlur levels={7} intensity={0.8} />
        <SMAA />
      </EffectComposer>
    </>
  );
}

export function BallClumpSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden"
    >
      <Canvas
        shadows="variance"
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 40 }}
        style={{ position: "absolute", inset: 0, background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
