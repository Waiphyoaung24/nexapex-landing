import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AmbientParticlesProps {
  count: number;
  radius: number;
  scrollVelocityRef: React.RefObject<{ value: number }>;
}

/** Vertex shader — circular soft point sprites with size variation */
const vertexShader = /*glsl*/`
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uScrollVelocity;

  void main() {
    vColor = color;

    // Gentle floating motion
    vec3 pos = position;
    float t = uTime * aSpeed + aPhase;
    pos.x += sin(t * 0.7) * 0.3;
    pos.y += cos(t * 0.5) * 0.4 + sin(t * 0.3) * 0.2;
    pos.z += sin(t * 0.6 + 1.5) * 0.3;

    // Scroll-driven drift — particles scatter when scrolling
    pos.y += uScrollVelocity * aSpeed * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (350.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 60.0);
    gl_Position = projectionMatrix * mvPosition;

    // Distance-based fade
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(30.0, 5.0, dist);

    // Pulse opacity slightly over time
    vAlpha *= 0.4 + 0.3 * sin(t * 1.2);

    // Boost visibility during scroll
    vAlpha += abs(uScrollVelocity) * 0.5;
    vAlpha = clamp(vAlpha, 0.0, 0.85);
  }
`;

const fragmentShader = /*glsl*/`
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Soft circular glow
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 2.0);

    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

/** Brand-palette ambient particles that float around the scene */
export default function AmbientParticles({
  count,
  radius,
  scrollVelocityRef,
}: AmbientParticlesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    // Brand colors for particles — weighted toward cyan/dim tones
    const palette = [
      new THREE.Color('#253a49'),  // surface3
      new THREE.Color('#45596d'),  // slate
      new THREE.Color('#5ac8cb'),  // cyan-dim
      new THREE.Color('#94fcff'),  // cyan
      new THREE.Color('#94fcff'),  // cyan (weighted)
      new THREE.Color('#5ac8cb'),  // cyan-dim (weighted)
      new THREE.Color('#b9afbb'),  // mauve
    ];

    for (let i = 0; i < count; i++) {
      // Distribute in a spherical shell with denser center
      const r = radius * (0.3 + Math.pow(Math.random(), 0.6) * 0.7);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten Y
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Pick from brand palette
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.1 + Math.random() * 0.25;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.2 + Math.random() * 0.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScrollVelocity: { value: 0 },
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, [count, radius]);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    const velocity = scrollVelocityRef.current
      ? scrollVelocityRef.current.value
      : 0;
    // Smooth the scroll velocity
    const current = materialRef.current.uniforms.uScrollVelocity.value;
    materialRef.current.uniforms.uScrollVelocity.value +=
      (velocity - current) * 0.1;
  });

  return (
    <points geometry={geometry}>
      <primitive
        ref={materialRef}
        object={material}
        attach="material"
      />
    </points>
  );
}
