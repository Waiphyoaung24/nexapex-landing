import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrbitalSwirlProps {
  arcCount: number;
  radius: number;
  scrollVelocityRef: React.RefObject<{ value: number }>;
}

/** Points per arc — determines smoothness of the curved ring segment */
const POINTS_PER_ARC = 28;
/** Angular span of each arc in radians (~25 degrees) */
const ARC_SPAN = 0.44;
/** Height spread of the orbital rings */
const HEIGHT = 6;

/** Vertex shader — orbital points with scroll-driven rotation */
const vertexShader = /*glsl*/`
  attribute float aSize;
  attribute float aArcProgress;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uOpacity;

  void main() {
    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);
    gl_Position = projectionMatrix * mvPosition;

    // Fade at arc edges for smooth trail appearance
    float edgeFade = smoothstep(0.0, 0.15, aArcProgress) * smoothstep(1.0, 0.85, aArcProgress);

    // Distance-based fade
    float dist = length(mvPosition.xyz);
    float distFade = smoothstep(25.0, 6.0, dist);

    vAlpha = edgeFade * distFade * uOpacity;
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
    glow = pow(glow, 1.8);

    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

interface ArcData {
  baseAngle: number;
  baseY: number;
  speed: number;
  currentAngleOffset: number;
}

/**
 * Orbital swirl rings — circular point-sprite arcs orbiting the center.
 * Driven by scroll velocity like Demo 2's particle lines,
 * but rendered as soft circular glow points for visual cohesion with the nebula.
 */
export default function OrbitalSwirl({
  arcCount,
  radius,
  scrollVelocityRef,
}: OrbitalSwirlProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const arcDataRef = useRef<ArcData[]>([]);
  const smoothedVelocity = useRef(0);
  const smoothedOpacity = useRef(0);

  const { geometry, material } = useMemo(() => {
    const totalPoints = arcCount * POINTS_PER_ARC;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);
    const arcProgress = new Float32Array(totalPoints);
    const arcData: ArcData[] = [];

    // Cyan-weighted brand colors for the swirl
    const swirlColors = [
      new THREE.Color('#94fcff'),  // cyan
      new THREE.Color('#94fcff'),  // cyan (heavy weight)
      new THREE.Color('#5ac8cb'),  // cyan-dim
      new THREE.Color('#5ac8cb'),  // cyan-dim
      new THREE.Color('#b9afbb'),  // mauve
      new THREE.Color('#dfe4dc'),  // sage
    ];

    for (let i = 0; i < arcCount; i++) {
      const startAngle = (i / arcCount) * Math.PI * 2;
      const isTopHalf = i < arcCount / 2;
      const baseY = isTopHalf
        ? HEIGHT * 0.05 + Math.random() * HEIGHT * 0.45
        : -(HEIGHT * 0.05 + Math.random() * HEIGHT * 0.45);

      // Pick a color for this entire arc
      const arcColor = swirlColors[Math.floor(Math.random() * swirlColors.length)];

      arcData.push({
        baseAngle: startAngle,
        baseY,
        speed: 0.3 + Math.random() * 0.5,
        currentAngleOffset: 0,
      });

      // Generate initial arc points
      for (let j = 0; j < POINTS_PER_ARC; j++) {
        const t = j / (POINTS_PER_ARC - 1);
        const angle = startAngle + ARC_SPAN * t;
        const idx = (i * POINTS_PER_ARC + j);

        positions[idx * 3] = Math.cos(angle) * radius;
        positions[idx * 3 + 1] = baseY;
        positions[idx * 3 + 2] = Math.sin(angle) * radius;

        colors[idx * 3] = arcColor.r;
        colors[idx * 3 + 1] = arcColor.g;
        colors[idx * 3 + 2] = arcColor.b;

        // Larger in the middle of the arc, smaller at edges
        sizes[idx] = 0.08 + 0.16 * Math.sin(t * Math.PI);

        arcProgress[idx] = t;
      }
    }

    arcDataRef.current = arcData;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aArcProgress', new THREE.BufferAttribute(arcProgress, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uOpacity: { value: 0 },
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, [arcCount, radius]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !materialRef.current) return;

    const velocity = scrollVelocityRef.current
      ? scrollVelocityRef.current.value
      : 0;

    // Smooth velocity with momentum/inertia — slow, scroll-matched
    smoothedVelocity.current =
      smoothedVelocity.current * 0.95 + velocity * 0.05;

    const absVelocity = Math.abs(smoothedVelocity.current);

    // Opacity driven by scroll speed — visible only when scrolling
    const targetOpacity = Math.min(absVelocity * 2.5, 0.85);
    smoothedOpacity.current +=
      (targetOpacity - smoothedOpacity.current) * Math.min(delta * 3, 1);
    materialRef.current.uniforms.uOpacity.value = smoothedOpacity.current;

    // Skip geometry update if invisible
    if (smoothedOpacity.current < 0.01) return;

    // Update arc positions — rotate based on scroll velocity
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;

    arcDataRef.current.forEach((arc, i) => {
      arc.currentAngleOffset += smoothedVelocity.current * arc.speed * 0.4;

      for (let j = 0; j < POINTS_PER_ARC; j++) {
        const t = j / (POINTS_PER_ARC - 1);
        const angle = arc.baseAngle + arc.currentAngleOffset + ARC_SPAN * t;
        const idx = (i * POINTS_PER_ARC + j) * 3;

        positions[idx] = Math.cos(angle) * radius;
        positions[idx + 1] = arc.baseY;
        positions[idx + 2] = Math.sin(angle) * radius;
      }
    });

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive
        ref={materialRef}
        object={material}
        attach="material"
      />
    </points>
  );
}
