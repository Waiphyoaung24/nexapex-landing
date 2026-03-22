/**
 * SpaceStation3D.tsx
 * Scroll-driven 3D spacestation scene using vanilla Three.js in a React component.
 * Loads public/models/spacestation_brand.glb, scrubs its 3 embedded AnimationClips
 * across the hero scroll range via GSAP ScrollTrigger.
 *
 * Desktop only -- returns null on mobile (<768px) or when WebGL2 is unavailable.
 * Renders behind all content at z-index 0 via position:fixed.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Background color -- matches existing --color-bg */
const BG_COLOR = '#0e1418';

/** Fog -- same hue as background, fades distant geometry */
const FOG_COLOR = '#0e1418';
const FOG_NEAR = 15;
const FOG_FAR = 50;

/** Lighting -- orbital sunrise mood */
const SUN_COLOR = '#FDB813';
const SUN_INTENSITY = 2;

const HEMI_SKY = '#1a2630';
const HEMI_GROUND = '#2a1a0a';
const HEMI_INTENSITY = 0.4;

const AMBIENT_COLOR = '#94fcff';
const AMBIENT_INTENSITY = 0.15;

/** Camera */
const CAM_FOV = 45;
const CAM_NEAR = 0.1;
const CAM_FAR = 100;
const CAM_INITIAL = new THREE.Vector3(-9, 2, -13);

/** Auto-rotate speed (radians per frame at 60fps) */
const AUTO_ROTATE_SPEED = 0.001;

/** Subtle camera drift amplitude */
const DRIFT_AMP_X = 0.15;
const DRIFT_AMP_Y = 0.08;
const DRIFT_SPEED = 0.3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpaceStation3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Store mutable refs for Three.js objects so React never re-renders them
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    mixer: THREE.AnimationMixer | null;
    actions: THREE.AnimationAction[];
    model: THREE.Group | null;
    clock: THREE.Clock;
    rafId: number;
    scrollTriggers: ScrollTrigger[];
    disposed: boolean;
    clipDurations: number[];
    clipTargetTimes: number[];
    clipCurrentTimes: number[];
  }>({
    renderer: null,
    scene: null,
    camera: null,
    mixer: null,
    actions: [],
    model: null,
    clock: new THREE.Clock(),
    rafId: 0,
    scrollTriggers: [],
    disposed: false,
    clipDurations: [],
    clipTargetTimes: [],
    clipCurrentTimes: [],
  });

  useEffect(() => {
    // ---- Guard: desktop only, WebGL2 only ----
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) return;

    let hasWebGL2 = false;
    try {
      const testCanvas = document.createElement('canvas');
      hasWebGL2 = !!testCanvas.getContext('webgl2');
    } catch {
      /* no webgl2 */
    }
    if (!hasWebGL2) return;

    // ---- Guard: reduced motion ----
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    const s = stateRef.current;
    s.disposed = false;

    // ----------------------------------------------------------------
    // Renderer
    // ----------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    s.renderer = renderer;

    // ----------------------------------------------------------------
    // Scene
    // ----------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLOR);
    scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
    s.scene = scene;

    // ----------------------------------------------------------------
    // Camera
    // ----------------------------------------------------------------
    const camera = new THREE.PerspectiveCamera(
      CAM_FOV,
      window.innerWidth / window.innerHeight,
      CAM_NEAR,
      CAM_FAR,
    );
    camera.position.copy(CAM_INITIAL);
    camera.lookAt(0, 0, 0);
    s.camera = camera;

    // ----------------------------------------------------------------
    // Lighting -- "orbital sunrise"
    // ----------------------------------------------------------------

    // Primary sun -- warm gold directional from upper right
    const sunLight = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
    sunLight.position.set(8, 6, -4);
    scene.add(sunLight);

    // Hemisphere -- cool sky / warm ground
    const hemiLight = new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, HEMI_INTENSITY);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // Ambient -- brand cyan fill
    const ambientLight = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
    scene.add(ambientLight);

    // ----------------------------------------------------------------
    // GLB Model + Animations
    // ----------------------------------------------------------------
    const loader = new GLTFLoader();
    loader.load(
      '/models/spacestation_brand.glb',
      (gltf) => {
        if (s.disposed) return;

        const model = gltf.scene;
        scene.add(model);
        s.model = model;

        // AnimationMixer
        const mixer = new THREE.AnimationMixer(model);
        s.mixer = mixer;

        const clips = gltf.animations;
        const actions: THREE.AnimationAction[] = [];
        const durations: number[] = [];
        const targetTimes: number[] = [];
        const currentTimes: number[] = [];

        clips.forEach((clip) => {
          const action = mixer.clipAction(clip);
          action.paused = true;
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
          action.play(); // play but paused -- allows setting .time manually
          actions.push(action);
          durations.push(clip.duration);
          targetTimes.push(0);
          currentTimes.push(0);
        });

        s.actions = actions;
        s.clipDurations = durations;
        s.clipTargetTimes = targetTimes;
        s.clipCurrentTimes = currentTimes;

        // ---- GSAP ScrollTrigger: scrub each clip across ~33% of hero ----
        setupScrollScrub(s);

        // Dismiss loader once model is ready
        const loaderEl = document.getElementById('cinematic-loader');
        if (loaderEl) {
          loaderEl.style.opacity = '0';
          setTimeout(() => loaderEl.remove(), 600);
        }
      },
      undefined,
      (err) => {
        console.warn('SpaceStation3D: GLB load error', err);
      },
    );

    // ----------------------------------------------------------------
    // Animation loop
    // ----------------------------------------------------------------
    const clock = s.clock;
    clock.start();

    function animate() {
      if (s.disposed) return;
      s.rafId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth-lerp clip times toward target (set by ScrollTrigger)
      if (s.mixer && s.actions.length > 0) {
        for (let i = 0; i < s.actions.length; i++) {
          s.clipCurrentTimes[i] = THREE.MathUtils.lerp(
            s.clipCurrentTimes[i],
            s.clipTargetTimes[i],
            Math.min(delta * 8, 1),
          );
          s.actions[i].time = s.clipCurrentTimes[i];
        }
        // Update mixer with 0 delta since we control .time directly
        s.mixer.update(0);
      }

      // Gentle auto-rotate model
      if (s.model) {
        s.model.rotation.y += AUTO_ROTATE_SPEED;
      }

      // Subtle camera drift (sine-based)
      if (s.camera) {
        s.camera.position.x = CAM_INITIAL.x + Math.sin(elapsed * DRIFT_SPEED) * DRIFT_AMP_X;
        s.camera.position.y = CAM_INITIAL.y + Math.cos(elapsed * DRIFT_SPEED * 0.7) * DRIFT_AMP_Y;
        s.camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    }

    animate();

    // ----------------------------------------------------------------
    // Resize handler
    // ----------------------------------------------------------------
    function onResize() {
      if (s.disposed) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', onResize);

    // ----------------------------------------------------------------
    // Cleanup on unmount
    // ----------------------------------------------------------------
    return () => {
      s.disposed = true;
      cancelAnimationFrame(s.rafId);
      window.removeEventListener('resize', onResize);

      // Kill GSAP ScrollTrigger instances
      s.scrollTriggers.forEach((st) => st.kill());
      s.scrollTriggers = [];

      // Stop mixer
      if (s.mixer) {
        s.mixer.stopAllAction();
      }

      // Dispose scene graph
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            // Dispose all texture maps on the material
            const mat = obj.material as THREE.MeshStandardMaterial;
            const mapKeys = [
              'map', 'normalMap', 'roughnessMap', 'metalnessMap',
              'aoMap', 'emissiveMap', 'displacementMap', 'alphaMap', 'envMap',
            ] as const;
            mapKeys.forEach((key) => {
              const tex = (mat as any)[key];
              if (tex && tex.dispose) tex.dispose();
            });
            obj.material.dispose();
          }
        }
      });

      // Dispose environment / background textures
      if (scene.environment) {
        scene.environment.dispose();
      }

      // Dispose renderer
      renderer.dispose();

      // Remove canvas from DOM
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Scroll-scrub setup
// ---------------------------------------------------------------------------

/**
 * Creates GSAP ScrollTrigger instances that scrub each AnimationClip's .time
 * across its designated third of the hero scroll range.
 *
 * The hero section is #scroll-container with height: 700vh.
 * Clip 0: 0% -- 33%
 * Clip 1: 33% -- 66%
 * Clip 2: 66% -- 100%
 *
 * Between scroll stops the model gently auto-rotates (handled in the animate loop).
 */
function setupScrollScrub(s: {
  actions: THREE.AnimationAction[];
  clipDurations: number[];
  clipTargetTimes: number[];
  scrollTriggers: ScrollTrigger[];
}) {
  const scrollContainer = document.getElementById('scroll-container');
  if (!scrollContainer) return;

  const numClips = s.actions.length;
  if (numClips === 0) return;

  // Divide the scroll range evenly among available clips
  const segmentSize = 100 / numClips;

  for (let i = 0; i < numClips; i++) {
    const startPct = Math.round(segmentSize * i);
    const endPct = Math.round(segmentSize * (i + 1));
    const clipDuration = s.clipDurations[i];

    const st = ScrollTrigger.create({
      trigger: scrollContainer,
      start: `${startPct}% top`,
      end: `${endPct}% top`,
      scrub: 0.5,
      onUpdate: (self) => {
        // Map scroll progress [0,1] to clip time [0, clipDuration]
        s.clipTargetTimes[i] = self.progress * clipDuration;
      },
    });

    s.scrollTriggers.push(st);
  }

  // Fade out the 3D canvas as we leave the hero section
  const canvasWrapper = document.querySelector<HTMLElement>('[data-spacestation-wrapper]');
  if (canvasWrapper) {
    const fadeOutST = ScrollTrigger.create({
      trigger: scrollContainer,
      start: '88% top',
      end: '98% top',
      scrub: true,
      onUpdate: (self) => {
        canvasWrapper.style.opacity = String(1 - self.progress);
      },
      onLeave: () => {
        canvasWrapper.style.display = 'none';
      },
      onEnterBack: () => {
        canvasWrapper.style.display = '';
        canvasWrapper.style.opacity = '1';
      },
    });
    s.scrollTriggers.push(fadeOutST);
  }
}
