import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Preload, Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- Camera perspectives for 3 capabilities ---
// Camera perspectives for auto-scaled model (~30 units)
const PERSPECTIVES = [
  { camera: { x: 0, y: 8, z: 45 }, target: { x: 0, y: 5, z: 0 } },      // Front view
  { camera: { x: -35, y: 15, z: 25 }, target: { x: 0, y: 8, z: 0 } },    // Left orbit
  { camera: { x: 25, y: 20, z: -15 }, target: { x: 0, y: 10, z: 0 } },   // Right rear
];

// --- Model component — auto-scales to target size ---
function SpaceModel() {
  const { scene } = useGLTF('/models/products_space.glb');

  useEffect(() => {
    if (!scene) return;

    // Compute bounding box and auto-scale to ~30 units tall
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 30;
    const s = targetSize / maxDim;

    scene.scale.set(s, s, s);
    // Center the model at origin
    scene.position.set(-center.x * s, -center.y * s, -center.z * s);

    // Model auto-scaled to ~30 units tall
  }, [scene]);

  return <primitive object={scene} />;
}

// --- Animated camera driven by refs ---
function AnimatedCamera({
  cameraRef: cameraAnimRef,
  targetRef: targetAnimRef,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const { set } = useThree();
  const lookAtVec = useRef(new THREE.Vector3());

  useEffect(() => {
    if (camRef.current) set({ camera: camRef.current });
  }, [set]);

  useFrame(() => {
    if (!camRef.current) return;
    camRef.current.position.set(
      cameraAnimRef.current.x,
      cameraAnimRef.current.y,
      cameraAnimRef.current.z
    );
    lookAtVec.current.set(
      targetAnimRef.current.x,
      targetAnimRef.current.y,
      targetAnimRef.current.z
    );
    camRef.current.lookAt(lookAtVec.current);
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={45}
      near={0.1}
      far={1000}
      position={[PERSPECTIVES[0].camera.x, PERSPECTIVES[0].camera.y, PERSPECTIVES[0].camera.z]}
    />
  );
}

// --- Scene setup ---
function SceneContent({
  cameraRef,
  targetRef,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
}) {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog(0x0e1418, 50, 150);
    scene.background = null;
  }, [scene]);

  return (
    <>
      <AnimatedCamera cameraRef={cameraRef} targetRef={targetRef} />
      <Environment preset="night" />
      <ambientLight intensity={1.2} />
      <directionalLight position={[30, 60, 30]} intensity={3} castShadow />
      <directionalLight position={[-30, 30, -30]} intensity={1.5} />
      <pointLight position={[0, 30, 40]} color="#94fcff" intensity={4} distance={120} />
      <pointLight position={[-20, 20, -20]} color="#5ac8cb" intensity={3} distance={100} />
      <pointLight position={[20, 10, 20]} color="#ffffff" intensity={2} distance={80} />
      <SpaceModel />
    </>
  );
}

// --- Exported canvas component ---
export default function CapabilitiesScene({
  cameraRef,
  targetRef,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
}) {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <SceneContent cameraRef={cameraRef} targetRef={targetRef} />
      <Preload all />
    </Canvas>
  );
}

export { PERSPECTIVES };

useGLTF.preload('/models/products_space.glb');
