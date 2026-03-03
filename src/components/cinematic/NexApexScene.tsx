import { useGLTF } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import AnimatedCamera from './AnimatedCamera';
import AmbientParticles from './AmbientParticles';
import OrbitalSwirl from './OrbitalSwirl';

interface NexApexSceneProps {
  cameraAnimRef: React.RefObject<{ x: number; y: number; z: number }>;
  targetAnimRef: React.RefObject<{ x: number; y: number; z: number }>;
  scrollVelocityRef: React.RefObject<{ value: number }>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  particleCount?: number;
}

/**
 * Brand color gradient stops for vertex color remapping.
 * Expanded palette with better dark-to-cyan distribution
 * to avoid the blown-out white center.
 */
const BRAND_STOPS = [
  { pos: 0.0, color: new THREE.Color('#0e1418') },   // --bg
  { pos: 0.10, color: new THREE.Color('#162029') },   // --surface
  { pos: 0.20, color: new THREE.Color('#1a2630') },   // --teal
  { pos: 0.30, color: new THREE.Color('#1d2d39') },   // --surface2
  { pos: 0.40, color: new THREE.Color('#253a49') },   // --surface3
  { pos: 0.50, color: new THREE.Color('#45596d') },   // --slate
  { pos: 0.65, color: new THREE.Color('#5ac8cb') },   // --cyan-dim
  { pos: 0.80, color: new THREE.Color('#94fcff') },   // --cyan
  { pos: 0.90, color: new THREE.Color('#b9afbb') },   // --mauve
  { pos: 1.0, color: new THREE.Color('#dfe4dc') },    // --sage
];

function remapToBrand(luminance: number): THREE.Color {
  const adjusted = Math.pow(luminance, 2.2);

  for (let i = 0; i < BRAND_STOPS.length - 1; i++) {
    if (adjusted <= BRAND_STOPS[i + 1].pos) {
      const t =
        (adjusted - BRAND_STOPS[i].pos) /
        (BRAND_STOPS[i + 1].pos - BRAND_STOPS[i].pos);
      return BRAND_STOPS[i].color
        .clone()
        .lerp(BRAND_STOPS[i + 1].color, Math.max(0, Math.min(1, t)));
    }
  }
  return BRAND_STOPS[BRAND_STOPS.length - 1].color.clone();
}

/** Custom circular point sprite shader — soft glow, no square artifacts */
const nebulaVertexShader = /*glsl*/`
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Size attenuation — closer points appear larger
    gl_PointSize = aSize * (400.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.5, 80.0);
    gl_Position = projectionMatrix * mvPosition;
    // Distance-based fade for depth
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(28.0, 8.0, dist);
  }
`;

const nebulaFragmentShader = /*glsl*/`
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uOpacity;

  void main() {
    // Circular point with soft glow edge
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Soft radial falloff — bright center, faded edge
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor, glow * uOpacity * vAlpha);
  }
`;

/** Point cloud nebula model with brand-remapped vertex colors + circular shader */
function SpaceModel() {
  const { scene } = useGLTF('/models/need_some_space.glb');

  const pointCloud = useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry && !geometry) {
        geometry = mesh.geometry.clone();
      }
    });

    if (!geometry) return null;

    // Center the geometry
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox!.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    // Remap original vertex colors to brand palette via luminance
    const colorAttr = geometry.getAttribute('color');
    const count = colorAttr ? colorAttr.count : geometry.getAttribute('position').count;

    if (colorAttr) {
      const newColors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = colorAttr.getX(i);
        const g = colorAttr.getY(i);
        const b = colorAttr.getZ(i);
        const luminance = r * 0.299 + g * 0.587 + b * 0.114;
        const brand = remapToBrand(luminance);
        const idx = i * 3;
        newColors[idx] = brand.r;
        newColors[idx + 1] = brand.g;
        newColors[idx + 2] = brand.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
    }

    // Per-vertex random size variation for organic feel
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = 0.12 + Math.random() * 0.35;
    }
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // Strip index buffer
    geometry.setIndex(null);

    // Custom circular point sprite shader
    const material = new THREE.ShaderMaterial({
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      uniforms: {
        uOpacity: { value: 0.7 },
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }, [scene]);

  if (!pointCloud) return null;
  return <primitive object={pointCloud} scale={4.0} />;
}

useGLTF.preload('/models/need_some_space.glb');

/** Interactive scene group with mouse-driven parallax */
function InteractiveGroup({
  mouseRef,
  children,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!groupRef.current || !mouseRef.current) return;

    // Smooth parallax rotation driven by mouse position
    const targetX = mouseRef.current.y * 0.08;
    const targetY = mouseRef.current.x * 0.12;
    const lerp = Math.min(delta * 1.5, 1);

    currentRotation.current.x += (targetX - currentRotation.current.x) * lerp;
    currentRotation.current.y += (targetY - currentRotation.current.y) * lerp;

    groupRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.rotation.y = currentRotation.current.y;
  });

  return <group ref={groupRef}>{children}</group>;
}

/** Slow ambient rotation for life when idle */
function SlowRotator({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.015;
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function NexApexScene({
  cameraAnimRef,
  targetAnimRef,
  scrollVelocityRef,
  mouseRef,
  particleCount = 800,
}: NexApexSceneProps) {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0e1418', 0.045);
    scene.background = new THREE.Color('#0e1418');

    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene]);

  return (
    <>
      <AnimatedCamera
        cameraAnimRef={cameraAnimRef}
        targetAnimRef={targetAnimRef}
      />

      {/* Minimal ambient — let point colors speak */}
      <ambientLight intensity={0.08} />

      {/* Interactive parallax wrapper */}
      <InteractiveGroup mouseRef={mouseRef}>
        {/* Slow ambient rotation for life */}
        <SlowRotator>
          {/* Particle cloud nebula */}
          <SpaceModel />
        </SlowRotator>

        {/* Cohesive ambient floating particles */}
        <AmbientParticles
          count={particleCount}
          radius={12}
          scrollVelocityRef={scrollVelocityRef}
        />

        {/* Orbital swirl rings — circular arcs driven by scroll */}
        <OrbitalSwirl
          arcCount={16}
          radius={5.5}
          scrollVelocityRef={scrollVelocityRef}
        />
      </InteractiveGroup>
    </>
  );
}
