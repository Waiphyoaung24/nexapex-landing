import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { PerspectiveCamera as PerspectiveCameraType } from 'three';

interface AnimatedCameraProps {
  cameraAnimRef: React.RefObject<{ x: number; y: number; z: number }>;
  targetAnimRef: React.RefObject<{ x: number; y: number; z: number }>;
}

export default function AnimatedCamera({
  cameraAnimRef,
  targetAnimRef,
}: AnimatedCameraProps) {
  const cameraRef = useRef<PerspectiveCameraType>(null!);

  useFrame(() => {
    if (!cameraRef.current || !cameraAnimRef.current || !targetAnimRef.current) return;

    cameraRef.current.position.set(
      cameraAnimRef.current.x,
      cameraAnimRef.current.y,
      cameraAnimRef.current.z,
    );

    cameraRef.current.lookAt(
      targetAnimRef.current.x,
      targetAnimRef.current.y,
      targetAnimRef.current.z,
    );
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={45}
      near={0.1}
      far={50}
      position={[0, 0, 12]}
    />
  );
}
