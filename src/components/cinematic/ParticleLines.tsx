import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleLinesProps {
  count: number;
  radius: number;
  scrollVelocityRef: React.RefObject<{ value: number }>;
}

interface ParticleData {
  baseAngle: number;
  angleSpan: number;
  baseY: number;
  speed: number;
  currentAngleOffset: number;
  targetOpacity: number;
  currentOpacity: number;
}

const SEGMENTS = 32;
const ANGLE_SPAN = 0.6;

export default function ParticleLines({
  count,
  radius,
  scrollVelocityRef,
}: ParticleLinesProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const linesRef = useRef<THREE.Line[]>([]);
  const dataRef = useRef<ParticleData[]>([]);

  const particles = useMemo(() => {
    const items: { geometry: THREE.BufferGeometry; material: THREE.LineBasicMaterial; data: ParticleData }[] = [];

    for (let i = 0; i < count; i++) {
      const startAngle = (i / count) * Math.PI * 2;
      const isTopHalf = i < count / 2;
      const height = 8;
      const baseY = isTopHalf
        ? height * 0.1 + Math.random() * height * 0.4
        : -(height * 0.1 + Math.random() * height * 0.4);

      const positions = new Float32Array((SEGMENTS + 1) * 3);
      for (let j = 0; j <= SEGMENTS; j++) {
        const t = j / SEGMENTS;
        const angle = startAngle + ANGLE_SPAN * t;
        positions[j * 3] = Math.cos(angle) * radius;
        positions[j * 3 + 1] = baseY;
        positions[j * 3 + 2] = Math.sin(angle) * radius;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color('#94fcff'),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const data: ParticleData = {
        baseAngle: startAngle,
        angleSpan: ANGLE_SPAN,
        baseY,
        speed: 0.5 + Math.random() * 1.0,
        currentAngleOffset: 0,
        targetOpacity: 0,
        currentOpacity: 0,
      };

      items.push({ geometry, material, data });
    }

    dataRef.current = items.map((item) => item.data);
    return items;
  }, [count, radius]);

  // Imperatively create THREE.Line objects and add to group
  useEffect(() => {
    if (!groupRef.current) return;

    // Clear previous lines
    linesRef.current.forEach((line) => {
      groupRef.current.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    linesRef.current = [];

    // Create new lines
    particles.forEach((particle) => {
      const line = new THREE.Line(particle.geometry, particle.material);
      groupRef.current.add(line);
      linesRef.current.push(line);
    });

    return () => {
      linesRef.current.forEach((line) => {
        if (groupRef.current) groupRef.current.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      linesRef.current = [];
    };
  }, [particles]);

  useFrame((_, delta) => {
    if (!scrollVelocityRef.current) return;

    const velocity = Math.abs(scrollVelocityRef.current.value);

    particles.forEach((particle, i) => {
      const data = dataRef.current[i];
      const line = linesRef.current[i];
      if (!data || !line) return;

      // Update opacity based on scroll velocity
      data.targetOpacity = Math.min(velocity * 3, 0.85);
      data.currentOpacity += (data.targetOpacity - data.currentOpacity) * Math.min(delta * 4, 1);
      particle.material.opacity = data.currentOpacity;

      // Shift arc position based on velocity
      data.currentAngleOffset += velocity * data.speed * delta * 1.5;

      // Update geometry positions
      const posAttr = particle.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let j = 0; j <= SEGMENTS; j++) {
        const t = j / SEGMENTS;
        const angle = data.baseAngle + data.currentAngleOffset + data.angleSpan * t;
        positions[j * 3] = Math.cos(angle) * radius;
        positions[j * 3 + 1] = data.baseY;
        positions[j * 3 + 2] = Math.sin(angle) * radius;
      }

      posAttr.needsUpdate = true;
    });
  });

  return <group ref={groupRef} />;
}
