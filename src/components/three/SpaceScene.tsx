import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import SpaceModel from './SpaceModel';
import SpaceCamera from './SpaceCamera';
import SpaceStars from './SpaceStars';

interface SpaceSceneProps {
  scrollProgress: number;
}

/** Dynamic fog density — thicker between models, lighter near them */
function getFogDensity(progress: number): number {
  const modelPositions = [0.08, 0.42, 0.77];
  const minDist = Math.min(...modelPositions.map((p) => Math.abs(progress - p)));
  return 0.005 + minDist * 0.02;
}

// Native sizes: space_1=14x22x17, space_2=0.2x0.2x0.2, products=273x1154x1060
const MODELS = [
  {
    url: '/models/space_1.glb',
    position: [0, -3, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 0.2,  // 22.4 * 0.2 ≈ 4.5 units — camera has room to frame it
  },
  {
    url: '/models/space_2.glb',
    position: [0, -3, -60] as [number, number, number],
    rotation: [0, Math.PI * 1.4, 0] as [number, number, number],
    scale: 30,  // 0.2 * 30 ≈ 6 units
  },
  {
    url: '/models/products_space.glb',
    position: [0, -3, -120] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    scale: 0.012,  // 1154 * 0.012 ≈ 14 units — large presence
  },
];

export default function SpaceScene({ scrollProgress }: SpaceSceneProps) {
  const fogColor = useMemo(() => new THREE.Color('#0e1418'), []);
  const fogRef = useRef<THREE.FogExp2>(null);
  const currentDensity = useRef(0.005);

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

      <fogExp2 ref={fogRef} attach="fog" args={[fogColor, 0.005]} />

      <SpaceStars />

      <Environment preset="night" />
      <ambientLight intensity={1} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow />
      <directionalLight position={[-5, 5, -10]} intensity={1.2} />
      <pointLight position={[0, 5, 5]} color="#94fcff" intensity={3} distance={50} />
      <pointLight position={[0, 5, -55]} color="#94fcff" intensity={3} distance={50} />
      <pointLight position={[0, 5, -115]} color="#94fcff" intensity={3} distance={50} />

      {MODELS.map((m) => (
        <SpaceModel
          key={m.url}
          url={m.url}
          position={m.position}
          rotation={m.rotation}
          scale={m.scale}
        />
      ))}
    </>
  );
}
