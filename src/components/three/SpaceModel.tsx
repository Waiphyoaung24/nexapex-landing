import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** 0 = invisible, 1 = fully visible — driven by scroll */
  opacity?: number;
}

export default function SpaceModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
}: SpaceModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  // Play all embedded animations
  useEffect(() => {
    if (animations.length === 0) return;
    const actions = animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
      return action;
    });
    return () => actions.forEach((a) => a.stop());
  }, [animations, mixer]);

  // Tick the animation mixer
  useFrame((_, delta) => {
    mixer.update(delta);
  });

  // Drive opacity on all mesh materials
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = opacity;
      }
    });
  }, [opacity, scene]);

  const scaleArr: [number, number, number] = Array.isArray(scale)
    ? scale
    : [scale, scale, scale];

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scaleArr}>
      <primitive object={scene} />
    </group>
  );
}
