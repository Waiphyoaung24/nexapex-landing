import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Preload } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
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

// Hero zoom-out: Lusion-style — station as cinematic backdrop, gentle pull-back on scroll
const HERO_START = { camera: { x: 0, y: -2, z: 24 }, target: { x: 0, y: -3, z: -1 } };
const HERO_END   = { camera: { x: 0, y: 6, z: 34 }, target: { x: 0, y: -4, z: -1 } };

// Camera waypoints — starts far, zooms into station, then orbits through details
const PERSPECTIVES = [
  { camera: { x: 0, y: 4, z: 22 }, target: { x: 0, y: -3, z: -1 } },
  { camera: { x: 2, y: 2, z: 10 }, target: { x: 0, y: -1, z: -2 } },
  { camera: { x: 5, y: 0, z: 6 }, target: { x: -1, y: -2, z: -2 } },
  { camera: { x: -5, y: -3, z: 7 }, target: { x: 1, y: -4, z: -1 } },
  { camera: { x: 3, y: -7, z: 5 }, target: { x: 0, y: -5, z: -2 } },
  { camera: { x: -2, y: -12, z: 8 }, target: { x: 0, y: -6, z: -1 } },
];

const MODEL_PATH = '/models/space_1.glb';
const DRACO_CDN = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

// ─── Starfield ───────────────────────────────────────────────────────────────
const STAR_COUNT = 2500;

function Starfield() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      // Spread stars in a large sphere around the scene
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 160;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.3 + Math.random() * 1.2;
    }
    return [pos, sz];
  }, []);

  const starMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('#d4eef0') },
    },
    vertexShader: `
      attribute float size;
      uniform float time;
      varying float vAlpha;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
        // Twinkle based on position hash + time
        float twinkle = sin(time * 1.5 + position.x * 12.9898 + position.y * 78.233) * 0.5 + 0.5;
        vAlpha = 0.3 + twinkle * 0.7;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, d);
        gl_FragColor = vec4(color, glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  useFrame((_, delta) => {
    starMaterial.uniforms.time.value += delta;
  });

  return (
    <points ref={pointsRef} material={starMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
}

// ─── Floating Debris / Dust Particles ────────────────────────────────────────
const DUST_COUNT = 120;

function FloatingDust() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 40 - 5,
        scale: 0.02 + Math.random() * 0.06,
        speed: 0.1 + Math.random() * 0.3,
        rotSpeed: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    particleData.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.5,
        p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.3,
        p.z + Math.sin(t * p.speed * 0.5) * 0.4,
      );
      dummy.rotation.set(t * p.rotSpeed, t * p.rotSpeed * 0.7, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DUST_COUNT]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#3a5565"
        emissive="#5ac8cb"
        emissiveIntensity={0.15}
        roughness={0.8}
        metalness={0.3}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// ─── Nebula Glow — large background sphere with gradient shader ──────────────
function NebulaBackground() {
  const nebulaMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color('#0a1628') },
      colorB: { value: new THREE.Color('#0e2a35') },
      colorC: { value: new THREE.Color('#1a0a2e') },
      glowColor: { value: new THREE.Color('#5ac8cb') },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform vec3 glowColor;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      // Simplex-style noise approximation
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        v += noise(p * 1.0) * 0.5;
        v += noise(p * 2.0) * 0.25;
        v += noise(p * 4.0) * 0.125;
        return v;
      }

      void main() {
        vec2 uv = vUv;
        float n = fbm(uv * 3.0 + time * 0.02);
        float n2 = fbm(uv * 5.0 - time * 0.015 + 10.0);

        // Blend nebula colors based on noise
        vec3 col = mix(colorA, colorB, n);
        col = mix(col, colorC, n2 * 0.5);

        // Cyan glow hotspot — top center area
        float glowStrength = smoothstep(0.7, 0.3, length(uv - vec2(0.5, 0.7)));
        col += glowColor * glowStrength * 0.08 * (0.8 + sin(time * 0.5) * 0.2);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    nebulaMaterial.uniforms.time.value += delta;
  });

  return (
    <mesh material={nebulaMaterial}>
      <sphereGeometry args={[180, 32, 32]} />
    </mesh>
  );
}

// ─── Spacestation model ──────────────────────────────────────────────────────
function SpaceshipModel({ onReady }: { onReady?: () => void }) {
  const { scene } = useGLTF(MODEL_PATH, DRACO_CDN);
  const { gl, camera } = useThree();
  const [signaled, setSignaled] = useState(false);
  const timeRef = useRef({ value: 0 });

  useEffect(() => {
    if (!scene || signaled) return;

    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat.isMeshStandardMaterial) return;

      if (child.name.includes('emit_low')) {
        mat.emissive = BRAND.cyan.clone();
        mat.emissiveIntensity = 2.5;
        mat.toneMapped = false;
        return;
      }

      mat.emissive = BRAND.cyanDim.clone();
      mat.emissiveIntensity = 0.25;
      mat.metalness = Math.min(mat.metalness + 0.15, 1.0);
      mat.roughness = Math.max(mat.roughness - 0.1, 0.0);
      mat.envMapIntensity = 1.5;
    });

    gl.compileAsync(scene, camera).then(() => {
      setSignaled(true);
      onReady?.();
    });
  }, [scene, signaled, onReady, gl, camera]);

  useFrame((_, delta) => {
    timeRef.current.value += delta;
  });

  return <primitive object={scene} />;
}

// ─── Animated Camera ─────────────────────────────────────────────────────────
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
      position={[HERO_START.camera.x, HERO_START.camera.y, HERO_START.camera.z]}
    />
  );
}

// ─── Scene Content ───────────────────────────────────────────────────────────
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
    scene.fog = new THREE.FogExp2('#080c12', 0.012);
    scene.background = null; // Nebula sphere handles background
  }, [scene]);

  return (
    <>
      <AnimatedCamera cameraRef={cameraRef} targetRef={targetRef} />

      {/* Environment layers */}
      <NebulaBackground />
      <Starfield />
      <FloatingDust />

      {/* Ambient base — slightly lower for more dramatic contrast */}
      <ambientLight intensity={0.35} color="#8aa0b0" />

      {/* Key light — bright, slightly warm white */}
      <directionalLight position={[15, 20, 15]} intensity={2.5} color="#e8f4ff" />

      {/* Fill light — cyan brand, softer */}
      <directionalLight position={[-12, 8, -15]} intensity={0.8} color="#5ac8cb" />

      {/* Back rim light — strong cyan separation */}
      <directionalLight position={[0, -10, -12]} intensity={1.2} color="#94fcff" />

      {/* Top volumetric-style light — dramatic beam from above */}
      <spotLight
        position={[0, 30, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={3.0}
        color="#c8e8ff"
        distance={80}
        decay={1.5}
      />

      {/* Cyan accent — brand primary glow */}
      <pointLight position={[0, 10, 12]} intensity={2.5} color="#5ac8cb" distance={50} decay={1.5} />
      <pointLight position={[-6, -5, 8]} intensity={1.5} color="#94fcff" distance={40} decay={1.5} />
      <pointLight position={[6, 0, 6]} intensity={1.0} color="#94fcff" distance={35} decay={1.5} />

      {/* Red accent — brand contrast, warm kick */}
      <pointLight position={[8, -12, -8]} intensity={0.8} color="#c63518" distance={35} decay={1.5} />

      <SpaceshipModel onReady={onModelReady} />

      {/* Cinematic post-processing stack */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0006)}
          radialModulation
          modulationOffset={0.2}
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.15}
        />
      </EffectComposer>
    </>
  );
}

// ─── Exported Canvas ─────────────────────────────────────────────────────────
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
        toneMappingExposure: 1.6,
      }}
      dpr={[1, 1.5]}
      style={{ background: '#080c12' }}
    >
      <SceneContent cameraRef={cameraRef} targetRef={targetRef} onModelReady={onModelReady} />
      <Preload all />
    </Canvas>
  );
}

export { PERSPECTIVES, HERO_START, HERO_END };

useGLTF.preload(MODEL_PATH, DRACO_CDN);
