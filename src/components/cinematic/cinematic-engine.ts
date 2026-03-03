import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scenePerspectives } from './scene-data';

gsap.registerPlugin(ScrollTrigger);

// ── Brand Color Stops ──
const BRAND_STOPS = [
  { pos: 0.0, color: new THREE.Color('#0e1418') },
  { pos: 0.10, color: new THREE.Color('#162029') },
  { pos: 0.20, color: new THREE.Color('#1a2630') },
  { pos: 0.30, color: new THREE.Color('#1d2d39') },
  { pos: 0.40, color: new THREE.Color('#253a49') },
  { pos: 0.50, color: new THREE.Color('#45596d') },
  { pos: 0.65, color: new THREE.Color('#5ac8cb') },
  { pos: 0.80, color: new THREE.Color('#94fcff') },
  { pos: 0.90, color: new THREE.Color('#b9afbb') },
  { pos: 1.0, color: new THREE.Color('#dfe4dc') },
];

function remapToBrand(luminance: number): THREE.Color {
  const adjusted = Math.pow(luminance, 2.2);
  for (let i = 0; i < BRAND_STOPS.length - 1; i++) {
    if (adjusted <= BRAND_STOPS[i + 1].pos) {
      const t = (adjusted - BRAND_STOPS[i].pos) / (BRAND_STOPS[i + 1].pos - BRAND_STOPS[i].pos);
      return BRAND_STOPS[i].color.clone().lerp(BRAND_STOPS[i + 1].color, Math.max(0, Math.min(1, t)));
    }
  }
  return BRAND_STOPS[BRAND_STOPS.length - 1].color.clone();
}

// ── Shaders ──

const nebulaVertexShader = /*glsl*/`
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (400.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.5, 80.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(28.0, 8.0, dist);
  }
`;

const nebulaFragmentShader = /*glsl*/`
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.5);
    gl_FragColor = vec4(vColor, glow * uOpacity * vAlpha);
  }
`;

const swirlVertexShader = /*glsl*/`
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
    float edgeFade = smoothstep(0.0, 0.15, aArcProgress) * smoothstep(1.0, 0.85, aArcProgress);
    float dist = length(mvPosition.xyz);
    float distFade = smoothstep(25.0, 6.0, dist);
    vAlpha = edgeFade * distFade * uOpacity;
  }
`;

const swirlFragmentShader = /*glsl*/`
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.8);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

const ambientVertexShader = /*glsl*/`
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uScrollVelocity;
  void main() {
    vColor = color;
    vec3 pos = position;
    float t = uTime * aSpeed + aPhase;
    pos.x += sin(t * 0.7) * 0.3;
    pos.y += cos(t * 0.5) * 0.4 + sin(t * 0.3) * 0.2;
    pos.z += sin(t * 0.6 + 1.5) * 0.3;
    pos.y += uScrollVelocity * aSpeed * 2.0;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (350.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 60.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(30.0, 5.0, dist);
    vAlpha *= 0.4 + 0.3 * sin(t * 1.2);
    vAlpha += abs(uScrollVelocity) * 0.5;
    vAlpha = clamp(vAlpha, 0.0, 0.85);
  }
`;

const ambientFragmentShader = /*glsl*/`
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 2.0);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

// ── Orbital Swirl Constants ──
const POINTS_PER_ARC = 28;
const ARC_SPAN = 0.44;
const SWIRL_HEIGHT = 6;

interface ArcData {
  baseAngle: number;
  baseY: number;
  speed: number;
  currentAngleOffset: number;
}

// ── Engine ──

export interface CinematicEngineOptions {
  canvas: HTMLCanvasElement;
  scrollContainer: HTMLElement;
  particleCount: number;
  dpr: [number, number];
  onLoaded: () => void;
}

export class CinematicEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private animationId = 0;
  private disposed = false;

  // Animation refs (GSAP tweens these)
  public cameraAnim = { x: 0, y: 0, z: 12 };
  public targetAnim = { x: 0, y: 0, z: 0 };
  public scrollVelocity = { value: 0 };
  private lastProgress = 0;
  private mouse = { x: 0, y: 0 };
  private currentRotation = { x: 0, y: 0 };

  // Scene objects
  private interactiveGroup = new THREE.Group();
  private slowRotatorGroup = new THREE.Group();

  // Orbital swirl
  private swirlGeometry!: THREE.BufferGeometry;
  private swirlMaterial!: THREE.ShaderMaterial;
  private arcData: ArcData[] = [];
  private swirlSmoothedVelocity = 0;
  private swirlSmoothedOpacity = 0;

  // Ambient particles
  private ambientMaterial!: THREE.ShaderMaterial;

  // GSAP timeline
  private scrollTriggers: ScrollTrigger[] = [];

  constructor(private options: CinematicEngineOptions) {
    const { canvas, dpr } = options;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr[1]));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor('#0e1418');

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#0e1418', 0.045);
    this.scene.background = new THREE.Color('#0e1418');

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(0, 0, 12);

    // Scene hierarchy
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    this.interactiveGroup.add(this.slowRotatorGroup);
    this.scene.add(this.interactiveGroup);

    // Build scene contents
    this.createAmbientParticles(options.particleCount, 12);
    this.createOrbitalSwirl(16, 5.5);
    this.loadModel();

    // Resize handler
    window.addEventListener('resize', this.onResize);
  }

  // ── Model Loading ──

  private loadModel() {
    const loader = new GLTFLoader();
    loader.load('/models/need_some_space.glb', (gltf) => {
      let geometry: THREE.BufferGeometry | null = null;
      gltf.scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry && !geometry) {
          geometry = mesh.geometry.clone();
        }
      });

      if (!geometry) {
        this.options.onLoaded();
        return;
      }

      // Center
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox!.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      // Remap colors to brand palette
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
          newColors[i * 3] = brand.r;
          newColors[i * 3 + 1] = brand.g;
          newColors[i * 3 + 2] = brand.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
      }

      // Per-vertex size
      const sizes = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        sizes[i] = 0.12 + Math.random() * 0.35;
      }
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geometry.setIndex(null);

      const material = new THREE.ShaderMaterial({
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        uniforms: { uOpacity: { value: 0.7 } },
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      points.scale.setScalar(4.0);
      this.slowRotatorGroup.add(points);

      this.options.onLoaded();
    });
  }

  // ── Ambient Particles ──

  private createAmbientParticles(count: number, radius: number) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const particleSizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    const palette = [
      new THREE.Color('#253a49'),
      new THREE.Color('#45596d'),
      new THREE.Color('#5ac8cb'),
      new THREE.Color('#94fcff'),
      new THREE.Color('#94fcff'),
      new THREE.Color('#5ac8cb'),
      new THREE.Color('#b9afbb'),
    ];

    for (let i = 0; i < count; i++) {
      const r = radius * (0.3 + Math.pow(Math.random(), 0.6) * 0.7);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      particleSizes[i] = 0.1 + Math.random() * 0.25;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.2 + Math.random() * 0.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(particleSizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    this.ambientMaterial = new THREE.ShaderMaterial({
      vertexShader: ambientVertexShader,
      fragmentShader: ambientFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScrollVelocity: { value: 0 },
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, this.ambientMaterial);
    this.interactiveGroup.add(points);
  }

  // ── Orbital Swirl ──

  private createOrbitalSwirl(arcCount: number, radius: number) {
    const totalPoints = arcCount * POINTS_PER_ARC;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);
    const arcProgress = new Float32Array(totalPoints);

    const swirlColors = [
      new THREE.Color('#94fcff'),
      new THREE.Color('#94fcff'),
      new THREE.Color('#5ac8cb'),
      new THREE.Color('#5ac8cb'),
      new THREE.Color('#b9afbb'),
      new THREE.Color('#dfe4dc'),
    ];

    for (let i = 0; i < arcCount; i++) {
      const startAngle = (i / arcCount) * Math.PI * 2;
      const isTopHalf = i < arcCount / 2;
      const baseY = isTopHalf
        ? SWIRL_HEIGHT * 0.05 + Math.random() * SWIRL_HEIGHT * 0.45
        : -(SWIRL_HEIGHT * 0.05 + Math.random() * SWIRL_HEIGHT * 0.45);

      const arcColor = swirlColors[Math.floor(Math.random() * swirlColors.length)];

      this.arcData.push({
        baseAngle: startAngle,
        baseY,
        speed: 0.3 + Math.random() * 0.5,
        currentAngleOffset: 0,
      });

      for (let j = 0; j < POINTS_PER_ARC; j++) {
        const t = j / (POINTS_PER_ARC - 1);
        const angle = startAngle + ARC_SPAN * t;
        const idx = i * POINTS_PER_ARC + j;
        positions[idx * 3] = Math.cos(angle) * radius;
        positions[idx * 3 + 1] = baseY;
        positions[idx * 3 + 2] = Math.sin(angle) * radius;
        colors[idx * 3] = arcColor.r;
        colors[idx * 3 + 1] = arcColor.g;
        colors[idx * 3 + 2] = arcColor.b;
        sizes[idx] = 0.08 + 0.16 * Math.sin(t * Math.PI);
        arcProgress[idx] = t;
      }
    }

    this.swirlGeometry = new THREE.BufferGeometry();
    this.swirlGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.swirlGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.swirlGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.swirlGeometry.setAttribute('aArcProgress', new THREE.BufferAttribute(arcProgress, 1));

    this.swirlMaterial = new THREE.ShaderMaterial({
      vertexShader: swirlVertexShader,
      fragmentShader: swirlFragmentShader,
      uniforms: { uOpacity: { value: 0 } },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(this.swirlGeometry, this.swirlMaterial);
    this.interactiveGroup.add(points);
  }

  // ── GSAP Scroll Timeline ──

  setupScrollTimeline(canvasWrapper: HTMLElement, gradientBridge: HTMLElement | null, scrollArrow: HTMLElement | null) {
    const { scrollContainer } = this.options;

    // Master camera timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const velocity = self.progress - this.lastProgress;
          this.scrollVelocity.value = velocity * 60;
          this.lastProgress = self.progress;
        },
      },
    });

    scenePerspectives.forEach((perspective) => {
      const startP = perspective.scrollProgress.start / 100;
      const endP = perspective.scrollProgress.end / 100;
      const duration = endP - startP;

      tl.to(this.cameraAnim, {
        x: perspective.camera.x,
        y: perspective.camera.y,
        z: perspective.camera.z,
        duration,
        ease: 'none',
      }, startP);

      tl.to(this.targetAnim, {
        x: perspective.target.x,
        y: perspective.target.y,
        z: perspective.target.z,
        duration,
        ease: 'none',
      }, startP);
    });

    // Fade out canvas during transition
    const fadeOutST = ScrollTrigger.create({
      trigger: scrollContainer,
      start: '88% top',
      end: '98% top',
      scrub: true,
      onUpdate: (self) => {
        canvasWrapper.style.opacity = String(1 - self.progress);
      },
      onLeave: () => { canvasWrapper.style.display = 'none'; },
      onEnterBack: () => {
        canvasWrapper.style.display = '';
        canvasWrapper.style.opacity = '1';
      },
    });
    this.scrollTriggers.push(fadeOutST);

    // Gradient bridge
    if (gradientBridge) {
      gsap.to(gradientBridge, {
        opacity: 1,
        scrollTrigger: {
          trigger: scrollContainer,
          start: '85% top',
          end: '95% top',
          scrub: true,
        },
      });
    }

    // Scroll arrow
    if (scrollArrow) {
      gsap.to(scrollArrow, {
        opacity: 0,
        scrollTrigger: {
          trigger: scrollContainer,
          start: '5% top',
          end: '15% top',
          scrub: true,
        },
      });
    }
  }

  // ── Mouse ──

  onMouseMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  // ── Render Loop ──

  start() {
    const animate = () => {
      if (this.disposed) return;
      this.animationId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Camera
      this.camera.position.set(this.cameraAnim.x, this.cameraAnim.y, this.cameraAnim.z);
      this.camera.lookAt(this.targetAnim.x, this.targetAnim.y, this.targetAnim.z);

      // Mouse parallax
      const targetX = this.mouse.y * 0.08;
      const targetY = this.mouse.x * 0.12;
      const lerp = Math.min(delta * 1.5, 1);
      this.currentRotation.x += (targetX - this.currentRotation.x) * lerp;
      this.currentRotation.y += (targetY - this.currentRotation.y) * lerp;
      this.interactiveGroup.rotation.x = this.currentRotation.x;
      this.interactiveGroup.rotation.y = this.currentRotation.y;

      // Slow rotator
      this.slowRotatorGroup.rotation.y = elapsed * 0.015;

      // Ambient particles
      if (this.ambientMaterial) {
        this.ambientMaterial.uniforms.uTime.value = elapsed;
        const vel = this.scrollVelocity.value;
        const cur = this.ambientMaterial.uniforms.uScrollVelocity.value;
        this.ambientMaterial.uniforms.uScrollVelocity.value += (vel - cur) * 0.1;
      }

      // Orbital swirl
      if (this.swirlMaterial && this.swirlGeometry) {
        const velocity = this.scrollVelocity.value;
        this.swirlSmoothedVelocity = this.swirlSmoothedVelocity * 0.95 + velocity * 0.05;
        const absVel = Math.abs(this.swirlSmoothedVelocity);
        const targetOpacity = Math.min(absVel * 2.5, 0.85);
        this.swirlSmoothedOpacity += (targetOpacity - this.swirlSmoothedOpacity) * Math.min(delta * 3, 1);
        this.swirlMaterial.uniforms.uOpacity.value = this.swirlSmoothedOpacity;

        if (this.swirlSmoothedOpacity >= 0.01) {
          const posAttr = this.swirlGeometry.getAttribute('position') as THREE.BufferAttribute;
          const positions = posAttr.array as Float32Array;
          const radius = 5.5;

          this.arcData.forEach((arc, i) => {
            arc.currentAngleOffset += this.swirlSmoothedVelocity * arc.speed * 0.4;
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
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  // ── Resize ──

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // ── Cleanup ──

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);

    this.scrollTriggers.forEach((st) => st.kill());
    ScrollTrigger.getAll().forEach((st) => st.kill());

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        if (obj.material instanceof THREE.Material) obj.material.dispose();
      }
    });

    this.renderer.dispose();
  }
}
