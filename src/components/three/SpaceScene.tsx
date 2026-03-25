import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SpaceModel from './SpaceModel';
import SpaceCamera from './SpaceCamera';
import SpaceStars from './SpaceStars';

interface SpaceSceneProps {
  scrollProgress: number;
}

/** Map scroll progress to model opacity — each model visible in its segment */
function getModelOpacity(progress: number, center: number, range = 0.2): number {
  const dist = Math.abs(progress - center);
  if (dist > range) return 0;
  return 1 - dist / range;
}

/** Dynamic fog density — thicker between models, lighter near them */
function getFogDensity(progress: number): number {
  const modelPositions = [0.08, 0.42, 0.77];
  const minDist = Math.min(...modelPositions.map((p) => Math.abs(progress - p)));
  return 0.015 + minDist * 0.06;
}

const MODELS = [
  {
    url: '/models/space_1.glb',
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 0.1,
    scrollCenter: 0.08,
  },
  {
    url: '/models/space_2.glb',
    position: [0, 0, -60] as [number, number, number],
    rotation: [0, Math.PI * 1.4, 0] as [number, number, number],
    scale: 0.0005,
    scrollCenter: 0.42,
  },
  {
    url: '/models/products_space.glb',
    position: [0, 0, -120] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    scale: 0.5,
    scrollCenter: 0.77,
  },
];

export default function SpaceScene({ scrollProgress }: SpaceSceneProps) {
  const fogColor = useMemo(() => new THREE.Color('#0e1418'), []);
  const fogRef = useRef<THREE.FogExp2>(null);
  const currentDensity = useRef(0.015);

  // Smooth fog interpolation
  useFrame(() => {
    const target = getFogDensity(scrollProgress);
    currentDensity.current += (target - currentDensity.current) * 0.03;
    if (fogRef.current) {
      fogRef.current.density = currentDensity.current;
    }
  });

  return (
    <>
      <SpaceCamera progress={scrollProgress} />

      <fogExp2 ref={fogRef} attach="fog" args={[fogColor, 0.015]} />

      <SpaceStars />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -10]} intensity={0.4} />
      <pointLight position={[0, 2, 0]} color="#94fcff" intensity={0.6} distance={30} />
      <pointLight position={[0, 2, -60]} color="#94fcff" intensity={0.6} distance={30} />
      <pointLight position={[0, 2, -120]} color="#94fcff" intensity={0.6} distance={30} />

      {MODELS.map((m) => (
        <SpaceModel
          key={m.url}
          url={m.url}
          position={m.position}
          rotation={m.rotation}
          scale={m.scale}
          opacity={getModelOpacity(scrollProgress, m.scrollCenter)}
        />
      ))}
    </>
  );
}
