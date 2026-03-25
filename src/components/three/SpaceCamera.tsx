import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpaceCameraProps {
  /** 0–1 scroll progress */
  progress: number;
}

// Camera keyframes along the flight path
// Each keyframe: { at: scrollProgress, pos: [x,y,z], lookAt: [x,y,z] }
const KEYFRAMES = [
  { at: 0.0, pos: [0, 2, 12], lookAt: [0, 1, 0] },
  { at: 0.15, pos: [0, 2, 6], lookAt: [0, 1, 0] },
  { at: 0.25, pos: [0, 3, -10], lookAt: [0, 2, -20] },
  { at: 0.35, pos: [-2, 2, -50], lookAt: [0, 1, -60] },
  { at: 0.50, pos: [-2, 2, -54], lookAt: [0, 1, -60] },
  { at: 0.60, pos: [0, 3, -75], lookAt: [0, 2, -90] },
  { at: 0.70, pos: [2, 2, -110], lookAt: [0, 1, -120] },
  { at: 0.85, pos: [2, 2, -114], lookAt: [0, 1, -120] },
  { at: 1.0, pos: [0, 3, -125], lookAt: [0, 2, -130] },
] as const;

function lerpKeyframes(progress: number) {
  const kf = KEYFRAMES;
  if (progress <= kf[0].at) return { pos: [...kf[0].pos], lookAt: [...kf[0].lookAt] };
  if (progress >= kf[kf.length - 1].at)
    return { pos: [...kf[kf.length - 1].pos], lookAt: [...kf[kf.length - 1].lookAt] };

  for (let i = 0; i < kf.length - 1; i++) {
    if (progress >= kf[i].at && progress <= kf[i + 1].at) {
      const t = (progress - kf[i].at) / (kf[i + 1].at - kf[i].at);
      // Smooth step for nicer interpolation
      const s = t * t * (3 - 2 * t);
      return {
        pos: kf[i].pos.map((v, j) => v + (kf[i + 1].pos[j] - v) * s),
        lookAt: kf[i].lookAt.map((v, j) => v + (kf[i + 1].lookAt[j] - v) * s),
      };
    }
  }
  return { pos: [...kf[0].pos], lookAt: [...kf[0].lookAt] };
}

export default function SpaceCamera({ progress }: SpaceCameraProps) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const { pos, lookAt } = lerpKeyframes(progress);
    camera.position.lerp(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.08);
    lookAtTarget.current.lerp(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]), 0.08);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}
