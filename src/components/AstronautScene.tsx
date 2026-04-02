"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Mouse tracking hook (normalized -1..1)                            */
/* ------------------------------------------------------------------ */

interface MouseState {
  x: number;
  y: number;
}

function useMousePosition(): React.RefObject<MouseState> {
  const mouse = useRef<MouseState>({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return mouse;
}

/* ------------------------------------------------------------------ */
/*  GLB Model placeholder — drop your .glb into public/models/       */
/*  then uncomment the ModelContainer body below.                     */
/* ------------------------------------------------------------------ */

// To load a GLB model later:
// 1. Place your .glb file in public/models/
// 2. Uncomment the useGLTF + useAnimations imports in the header
// 3. Uncomment the model loading code inside ModelContainer
// 4. Update MODEL_PATH to match your file name

// const MODEL_PATH = "/models/your-model.glb";

const MOUSE_TILT_LIMIT = 0.08;
const LERP_FACTOR = 0.02;

function ModelContainer({ mouse }: { mouse: React.RefObject<MouseState> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    /* Subtle mouse-follow tilt (lerped for smooth feel) */
    const targetRotX = -mouse.current.y * MOUSE_TILT_LIMIT;
    const targetRotZ = mouse.current.x * MOUSE_TILT_LIMIT * 0.5;

    group.rotation.x = THREE.MathUtils.lerp(
      group.rotation.x,
      targetRotX,
      LERP_FACTOR,
    );
    group.rotation.z = THREE.MathUtils.lerp(
      group.rotation.z,
      targetRotZ,
      LERP_FACTOR,
    );
  });

  return (
    <group ref={groupRef} scale={1.8} position={[0, 0.2, 0]} dispose={null}>
      {/* ---------------------------------------------------------- */}
      {/*  GLB MODEL GOES HERE                                       */}
      {/*  Example:                                                  */}
      {/*    const gltf = useGLTF(MODEL_PATH);                       */}
      {/*    <primitive object={gltf.scene} />                       */}
      {/* ---------------------------------------------------------- */}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Cinematic lighting rig                                            */
/* ------------------------------------------------------------------ */

function Lighting() {
  return (
    <>
      {/* Low ambient — dark moody feel */}
      <ambientLight intensity={0.15} color="#8090b0" />

      {/* Key light — upper-right rim highlight */}
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.8}
        color="#c0ccee"
        castShadow={false}
      />

      {/* Cool fill — lower-left */}
      <directionalLight
        position={[-5, -2, 3]}
        intensity={0.4}
        color="#6070a0"
      />

      {/* Back light — rim edge separation */}
      <directionalLight
        position={[0, 2, -6]}
        intensity={0.8}
        color="#a0b0d0"
      />

      {/* Subtle center glow */}
      <pointLight
        position={[0, 0, 3]}
        intensity={0.5}
        color="#90a8cc"
        distance={12}
        decay={2}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene contents (inside Canvas)                                     */
/* ------------------------------------------------------------------ */

function SceneContents({ mouse }: { mouse: React.RefObject<MouseState> }) {
  return (
    <>
      <Lighting />
      <Environment preset="night" />

      <Suspense fallback={null}>
        <ModelContainer mouse={mouse} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        enableDamping
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */

export function AstronautScene() {
  const mouse = useMousePosition();

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        <SceneContents mouse={mouse} />
      </Canvas>
    </div>
  );
}
