import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Preload } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Brand colors
const BRAND = {
  cyan: new THREE.Color('#94fcff'),
  cyanDim: new THREE.Color('#5ac8cb'),
  red: new THREE.Color('#c63518'),
  bg: new THREE.Color('#0e1418'),
  space: new THREE.Color('#08080f'),
  teal: new THREE.Color('#1a2630'),
};

// Camera waypoints — starts far, zooms into station, then orbits through details
// Bounding box at scale 1: center (-0.18, -3.42, -1.61), size (14.53, 22.45, 17.5)
const PERSPECTIVES = [
  { camera: { x: 0, y: 4, z: 22 }, target: { x: 0, y: -3, z: -1 } },          // 1. Far wide — full station visible
  { camera: { x: 2, y: 2, z: 10 }, target: { x: 0, y: -1, z: -2 } },          // 2. Zoom in — approaching station
  { camera: { x: 5, y: 0, z: 6 }, target: { x: -1, y: -2, z: -2 } },          // 3. Close right — detail, cyan lights
  { camera: { x: -5, y: -3, z: 7 }, target: { x: 1, y: -4, z: -1 } },         // 4. Cross left — mid section
  { camera: { x: 3, y: -7, z: 5 }, target: { x: 0, y: -5, z: -2 } },          // 5. Right low — lower detail
  { camera: { x: -2, y: -12, z: 8 }, target: { x: 0, y: -6, z: -1 } },        // 6. Base — looking up at station
];

const MODEL_PATH = '/models/space_1.glb';

// Custom shader for animated brand-colored edge glow on station hull
const brandGlowVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const brandGlowFragmentShader = `
  uniform float time;
  uniform vec3 colorCyan;
  uniform vec3 colorCyanDim;
  uniform vec3 colorRed;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    // Fresnel-based edge glow — brighter at glancing angles
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);

    // Time-based color pulse between cyan and cyan-dim
    float pulse = sin(time * 0.8) * 0.5 + 0.5;
    vec3 glowColor = mix(colorCyanDim, colorCyan, pulse);

    // Position-based variation — red accent at extremities
    float yFactor = smoothstep(-15.0, 8.0, vPosition.y);
    glowColor = mix(glowColor, colorRed, (1.0 - yFactor) * 0.15);

    // Subtle scan line effect
    float scanLine = sin(vPosition.y * 8.0 + time * 2.0) * 0.5 + 0.5;
    scanLine = smoothstep(0.4, 0.6, scanLine) * 0.12;

    float alpha = fresnel * 0.35 + scanLine;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// Spacestation model with brand-colored material enhancement
function SpaceshipModel({ onReady }: { onReady?: () => void }) {
  const { scene } = useGLTF(MODEL_PATH);
  const [signaled, setSignaled] = useState(false);
  const timeRef = useRef({ value: 0 });

  // Create brand glow overlay material
  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: timeRef.current,
      colorCyan: { value: BRAND.cyan },
      colorCyanDim: { value: BRAND.cyanDim },
      colorRed: { value: BRAND.red },
    },
    vertexShader: brandGlowVertexShader,
    fragmentShader: brandGlowFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
  }), []);

  useEffect(() => {
    if (scene) {
      scene.scale.set(1, 1, 1);
      scene.position.set(0, 0, 0);

      // Enhance existing materials with brand colors
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;

        const mat = child.material as THREE.MeshStandardMaterial;
        if (!mat.isMeshStandardMaterial) return;

        // Emissive parts (emit_low*) — bright cyan glow
        if (child.name.includes('emit_low')) {
          mat.emissive = BRAND.cyan.clone();
          mat.emissiveIntensity = 2.5;
          mat.toneMapped = false;
          return;
        }

        // Station hull — visible cyan emissive + enhanced metalness
        mat.emissive = BRAND.cyanDim.clone();
        mat.emissiveIntensity = 0.25;
        mat.metalness = Math.min(mat.metalness + 0.15, 1.0);
        mat.roughness = Math.max(mat.roughness - 0.1, 0.0);
        mat.envMapIntensity = 1.5;
      });

      if (!signaled) {
        setSignaled(true);
        onReady?.();
      }
    }
  }, [scene, signaled, onReady]);

  // Animate shader time uniform
  useFrame((_, delta) => {
    timeRef.current.value += delta;
  });

  return <primitive object={scene} />;
}

// Animated camera driven by GSAP refs
function AnimatedCamera({
  cameraRef: cameraAnimRef,
  targetRef: targetAnimRef,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const { set } = useThree();
  const lookAtVec = useRef(new THREE.Vector3());

  useEffect(() => {
    if (camRef.current) set({ camera: camRef.current });
  }, [set]);

  useFrame(() => {
    if (!camRef.current) return;
    camRef.current.position.set(
      cameraAnimRef.current.x,
      cameraAnimRef.current.y,
      cameraAnimRef.current.z
    );
    lookAtVec.current.set(
      targetAnimRef.current.x,
      targetAnimRef.current.y,
      targetAnimRef.current.z
    );
    camRef.current.lookAt(lookAtVec.current);
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={45}
      near={0.1}
      far={500}
      position={[PERSPECTIVES[0].camera.x, PERSPECTIVES[0].camera.y, PERSPECTIVES[0].camera.z]}
    />
  );
}

// Scene setup — deep space with brand-colored lighting
function SceneContent({
  cameraRef,
  targetRef,
  onModelReady,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  onModelReady?: () => void;
}) {
  const { scene } = useThree();

  useEffect(() => {
    const fogColor = new THREE.Color('#0e1820');
    scene.fog = new THREE.Fog(fogColor, 15, 50);
    scene.background = fogColor;
  }, [scene]);

  return (
    <>
      <AnimatedCamera cameraRef={cameraRef} targetRef={targetRef} />

      {/* Ambient base — lifted so geometry is always visible */}
      <ambientLight intensity={0.6} color="#c8d8e4" />

      {/* Key light — bright, cool white */}
      <directionalLight position={[15, 20, 15]} intensity={2.0} color="#e8f4ff" />

      {/* Fill light — softer, from opposite side */}
      <directionalLight position={[-12, 8, -15]} intensity={1.0} color="#5ac8cb" />

      {/* Back rim light — separates station from background */}
      <directionalLight position={[0, -10, -12]} intensity={0.8} color="#94fcff" />

      {/* Cyan accent — brand primary glow, strong */}
      <pointLight position={[0, 10, 12]} intensity={2.0} color="#5ac8cb" distance={50} decay={1.5} />
      <pointLight position={[-6, -5, 8]} intensity={1.5} color="#94fcff" distance={40} decay={1.5} />
      <pointLight position={[6, 0, 6]} intensity={1.0} color="#94fcff" distance={35} decay={1.5} />

      {/* Red accent — brand contrast, warm kick from below */}
      <pointLight position={[8, -12, -8]} intensity={0.8} color="#c63518" distance={35} decay={1.5} />

      <SpaceshipModel onReady={onModelReady} />

      {/* Bloom — cinematic glow on emissive parts */}
      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// Exported canvas
export default function CapabilitiesScene({
  cameraRef,
  targetRef,
  onModelReady,
}: {
  cameraRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  targetRef: React.MutableRefObject<{ x: number; y: number; z: number }>;
  onModelReady?: () => void;
}) {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.8,
      }}
      dpr={[1, 1.5]}
      style={{ background: '#0e1820' }}
    >
      <SceneContent cameraRef={cameraRef} targetRef={targetRef} onModelReady={onModelReady} />
      <Preload all />
    </Canvas>
  );
}

export { PERSPECTIVES };

useGLTF.preload(MODEL_PATH);
