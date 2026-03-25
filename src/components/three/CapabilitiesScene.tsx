import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Preload } from '@react-three/drei';
import * as THREE from 'three';

// Camera perspectives — adapted from Codrops Demo 2 scene-data.ts
// 3 perspectives for 3 capabilities, orbiting the cyberpunk skyscraper
const PERSPECTIVES = [
  { camera: { x: 0, y: 2, z: 10 }, target: { x: 0, y: 5, z: 0 } },       // Front — looking up
  { camera: { x: -10, y: 15, z: 0 }, target: { x: 0, y: 15, z: 0 } },     // Left side — mid height
  { camera: { x: 5, y: 25, z: 10 }, target: { x: 0, y: 20, z: 0 } },      // Right elevated — near top
];

// Cyberpunk skyscraper model — same as Codrops Demo 2
function CyberpunkBuilding() {
  const { scene } = useGLTF('/models/cyberpunk_skyscraper.glb');

  useEffect(() => {
    if (scene) {
      scene.scale.set(3, 3, 3);
      scene.position.set(0, 0, 0);
    }
  }, [scene]);

  return <primitive object={scene} />;
}

// Animated camera driven by GSAP refs
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
      near={1}
      far={1000}
      position={[PERSPECTIVES[0].camera.x, PERSPECTIVES[0].camera.y, PERSPECTIVES[0].camera.z]}
    />
  );
}

// Scene setup — matches Codrops Demo 2 lighting + fog
function SceneContent({
  cameraRef,
  targetRef,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
}) {
  const { scene } = useThree();

  useEffect(() => {
    const fogColor = new THREE.Color('#0e1418');
    scene.fog = new THREE.Fog(fogColor, 12, 28);
    scene.background = new THREE.Color('#0e1418');
  }, [scene]);

  return (
    <>
      <AnimatedCamera cameraRef={cameraRef} targetRef={targetRef} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.6} />
      <pointLight position={[0, 50, 20]} intensity={0.8} color="#00ffff" />
      <CyberpunkBuilding />
    </>
  );
}

// Exported canvas
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
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ background: '#0e1418' }}
    >
      <SceneContent cameraRef={cameraRef} targetRef={targetRef} />
      <Preload all />
    </Canvas>
  );
}

export { PERSPECTIVES };

useGLTF.preload('/models/cyberpunk_skyscraper.glb');
