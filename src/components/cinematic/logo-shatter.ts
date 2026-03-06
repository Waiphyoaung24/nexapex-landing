import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';
import gsap from 'gsap';

// ── Shaders ──

const shatterVertexShader = /*glsl*/ `
  uniform float uProgress;
  uniform float uExplosionStrength;
  uniform float uRotationStrength;

  attribute vec3 aCentroid;
  attribute vec3 aRandomness;
  varying vec2 vUv;

  mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
      0.0,                                 0.0,                                 0.0,                                 1.0
    );
  }

  void main() {
    vUv = uv;

    float rawExplosion = 1.0 - uProgress;
    float threshold = 0.001;
    float explosionFactor = max(0.0, rawExplosion - threshold) * (1.0 / (1.0 - threshold));
    float easeFactor = pow(explosionFactor, 3.0);

    // Rotation per shard
    float rotationAngle = easeFactor * uRotationStrength * aRandomness.x * (aRandomness.y > 0.5 ? 1.0 : -1.0);
    mat4 rotMat = rotationMatrix(normalize(aRandomness + vec3(0.1)), rotationAngle);

    // Rotate around centroid
    vec3 localPosition = position - aCentroid;
    vec3 rotatedLocalPosition = (rotMat * vec4(localPosition, 1.0)).xyz;

    // Explosion direction — radial from center with z-scatter
    vec3 explosionDirection = normalize(aCentroid);
    if (length(aCentroid.xy) < 0.01) explosionDirection = vec3(0.0, 0.0, 1.0);
    explosionDirection.z += (aRandomness.z - 0.5) * 3.0;
    explosionDirection = normalize(explosionDirection);

    float distanceMetric = length(aCentroid.xy);
    vec3 explosionOffset = explosionDirection * uExplosionStrength * easeFactor * (0.2 + distanceMetric + aRandomness.x);
    vec3 targetCentroid = aCentroid + explosionOffset;

    vec3 finalPosition = targetCentroid + rotatedLocalPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
  }
`;

const shatterFragmentShader = /*glsl*/ `
  uniform sampler2D uTexture;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    // ── Phase 1: Scattered shards get a cyan glow driven by texture alpha ──
    float scatterGlow = (1.0 - uProgress) * 0.5;
    vec3 scatterCyan = vec3(0.58, 0.99, 1.0) * scatterGlow * texColor.a;

    // ── Phase 2: As assembly completes (0.7→1.0), build up neon glow ──
    float assemblePhase = smoothstep(0.7, 1.0, uProgress);

    float alpha = texColor.a;
    float pulse = sin(uTime * 0.5) * 0.06 + 0.94;

    vec3 cyanCore = vec3(0.58, 0.99, 1.0);   // #94fcff
    vec3 cyanDim  = vec3(0.35, 0.78, 0.80);  // #5ac8cb

    // Tint the logo outline toward cyan as it assembles
    float cyanTint = assemblePhase * 0.35;
    vec3 tintedLogo = mix(texColor.rgb, cyanCore, cyanTint) * (1.0 + assemblePhase * 0.3);

    // Glow driven by texture alpha only — no rectangular boundary artifacts
    float glowStrength = assemblePhase * 0.6 * pulse * alpha;
    vec3 atmosphereGlow = mix(cyanCore, cyanDim, 0.3) * glowStrength;

    // Soft bloom halo
    float bloomStrength = assemblePhase * 0.4 * pulse;
    vec3 bloomColor = cyanCore * bloomStrength * alpha;

    vec3 finalColor = tintedLogo + scatterCyan + atmosphereGlow + bloomColor;
    float finalAlpha = texColor.a + scatterGlow * alpha * 0.3 + bloomStrength * alpha * 0.15;
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

// ── Types ──

export interface LogoShatterOptions {
  canvas: HTMLCanvasElement;
  logoUrl: string;
  width: number;
  height: number;
  onComplete?: () => void;
  duration?: number;
  baseSplinters?: number;
  tinySplinters?: number;
  splinterGrouping?: number;
  explosionStrength?: number;
  rotationStrength?: number;
}

export interface LogoShatterInstance {
  play: () => void;
  dispose: () => void;
}

// ── Build Voronoi Shard Geometry ──

function buildShardGeometry(
  texture: THREE.Texture,
  baseSplinters: number,
  tinySplinters: number,
  splinterGrouping: number,
): THREE.BufferGeometry {
  const img = texture.image as HTMLImageElement | undefined;
  let imgW = img?.width || 512;
  let imgH = img?.height || 512;

  const imgAspect = imgW / imgH;
  const halfH = 1.0;
  const halfW = halfH * imgAspect;

  // Generate random seed points
  const points: [number, number][] = [];

  for (let i = 0; i < baseSplinters; i++) {
    points.push([
      THREE.MathUtils.randFloat(-halfW, halfW),
      THREE.MathUtils.randFloat(-halfH, halfH),
    ]);
  }

  // Impact cluster points for tiny splinters
  const numImpacts = Math.max(3, Math.floor(baseSplinters / 10));
  const impactPoints: [number, number][] = [];
  for (let k = 0; k < numImpacts; k++) {
    impactPoints.push([
      THREE.MathUtils.randFloat(-halfW * 0.8, halfW * 0.8),
      THREE.MathUtils.randFloat(-halfH * 0.8, halfH * 0.8),
    ]);
  }

  for (let i = 0; i < tinySplinters; i++) {
    const impact = impactPoints[Math.floor(Math.random() * impactPoints.length)];
    const spread = (1.0 - splinterGrouping) * 0.8 + 0.05;
    const offsetX = Math.pow(Math.random(), 3) * spread * (Math.random() > 0.5 ? 1 : -1);
    const offsetY = Math.pow(Math.random(), 3) * spread * (Math.random() > 0.5 ? 1 : -1);

    points.push([
      THREE.MathUtils.clamp(impact[0] + offsetX, -halfW, halfW),
      THREE.MathUtils.clamp(impact[1] + offsetY, -halfH, halfH),
    ]);
  }

  // Voronoi tessellation
  const bounds: [number, number, number, number] = [
    -halfW * 1.01, -halfH * 1.01, halfW * 1.01, halfH * 1.01,
  ];
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi(bounds);

  const vertices: number[] = [];
  const uvs: number[] = [];
  const centroids: number[] = [];
  const randomness: number[] = [];

  const totalCells = baseSplinters + tinySplinters;
  for (let i = 0; i < totalCells; i++) {
    const polygon = voronoi.cellPolygon(i);
    if (!polygon) continue;

    // Compute centroid
    let cx = 0, cy = 0;
    const polyPoints = polygon.length - 1; // last point is duplicate of first
    for (let j = 0; j < polyPoints; j++) {
      cx += polygon[j][0];
      cy += polygon[j][1];
    }
    cx /= polyPoints;
    cy /= polyPoints;
    const cz = 0.0;

    const randX = Math.random();
    const randY = Math.random();
    const randZ = Math.random();

    // Fan triangulation of polygon
    for (let j = 1; j < polyPoints - 1; j++) {
      vertices.push(polygon[0][0], polygon[0][1], cz);
      vertices.push(polygon[j][0], polygon[j][1], cz);
      vertices.push(polygon[j + 1][0], polygon[j + 1][1], cz);

      // UV mapping: normalize to [0,1]
      uvs.push(
        (polygon[0][0] + halfW) / (2 * halfW),
        (polygon[0][1] + halfH) / (2 * halfH),
      );
      uvs.push(
        (polygon[j][0] + halfW) / (2 * halfW),
        (polygon[j][1] + halfH) / (2 * halfH),
      );
      uvs.push(
        (polygon[j + 1][0] + halfW) / (2 * halfW),
        (polygon[j + 1][1] + halfH) / (2 * halfH),
      );

      for (let k = 0; k < 3; k++) {
        centroids.push(cx, cy, cz);
        randomness.push(randX, randY, randZ);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aCentroid', new THREE.Float32BufferAttribute(centroids, 3));
  geometry.setAttribute('aRandomness', new THREE.Float32BufferAttribute(randomness, 3));
  geometry.computeVertexNormals();

  return geometry;
}

// ── Main Factory ──

export function createLogoShatter(options: LogoShatterOptions): Promise<LogoShatterInstance> {
  const {
    canvas,
    logoUrl,
    width,
    height,
    onComplete,
    duration = 3.5,
    baseSplinters = 35,
    tinySplinters = 1200,
    splinterGrouping = 0.55,
    explosionStrength = 4.5,
    rotationStrength = 18.0,
  } = options;

  return new Promise((resolve, reject) => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // transparent background
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    // Load logo texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      logoUrl,
      (texture) => {
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Build shard geometry
        const geometry = buildShardGeometry(texture, baseSplinters, tinySplinters, splinterGrouping);

        const progressState = { value: 0.0 };

        const clock = new THREE.Clock();

        const material = new THREE.ShaderMaterial({
          vertexShader: shatterVertexShader,
          fragmentShader: shatterFragmentShader,
          uniforms: {
            uTexture: { value: texture },
            uProgress: { value: 0.0 },
            uTime: { value: 0.0 },
            uExplosionStrength: { value: explosionStrength },
            uRotationStrength: { value: rotationStrength },
          },
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let animationId = 0;
        let disposed = false;

        function animate() {
          if (disposed) return;
          animationId = requestAnimationFrame(animate);
          material.uniforms.uProgress.value = progressState.value;
          material.uniforms.uTime.value = clock.getElapsedTime();
          renderer.render(scene, camera);
        }

        function play() {
          gsap.killTweensOf(progressState);
          progressState.value = 0.0;
          material.uniforms.uProgress.value = 0.0;

          animate();

          gsap.to(progressState, {
            value: 1.0,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
              material.uniforms.uProgress.value = progressState.value;
            },
            onComplete: () => {
              onComplete?.();
            },
          });
        }

        function dispose() {
          disposed = true;
          cancelAnimationFrame(animationId);
          gsap.killTweensOf(progressState);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          renderer.dispose();
        }

        resolve({ play, dispose });
      },
      undefined,
      (err) => {
        console.error('LogoShatter: Failed to load logo texture', err);
        reject(err);
      },
    );
  });
}
