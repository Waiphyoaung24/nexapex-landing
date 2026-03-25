import { Stars } from '@react-three/drei';

export default function SpaceStars() {
  return (
    <Stars
      radius={100}
      depth={80}
      count={4000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
  );
}
