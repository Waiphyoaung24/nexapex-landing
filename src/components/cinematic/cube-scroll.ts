import * as THREE from 'three';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(Flip, ScrollTrigger);

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let mesh: THREE.Mesh;
let canvasEl: HTMLCanvasElement;
let animCtx: gsap.Context | null = null;

function makeGradientTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;

  const grd = g.createLinearGradient(0, 0, 230, 384);
  grd.addColorStop(0, '#b9afbb'); // mauve
  grd.addColorStop(1, '#94fcff'); // cyan
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);

  // Subtle grain for texture depth
  for (let i = 0; i < 4000; i++) {
    const x = Math.floor(Math.random() * 256);
    const y = Math.floor(Math.random() * 256);
    const a = 0.02 + Math.random() * 0.08;
    g.fillStyle = `rgba(0,0,0,${a})`;
    g.fillRect(x, y, 3, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function render(): void {
  if (!renderer) return;
  // Slow idle rotation for visual life
  mesh.rotation.x += 0.002;
  mesh.rotation.y += 0.003;
  renderer.render(scene, camera);
}

function onResize(): void {
  if (!renderer || !canvasEl) return;
  const r = canvasEl.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(1);
  renderer.setSize(
    Math.max(1, r.width * dpr),
    Math.max(1, r.height * dpr),
    false,
  );
  camera.aspect = (r.width || 1) / (r.height || 1);
  camera.updateProjectionMatrix();
}

function buildTimeline(): void {
  animCtx?.revert();
  animCtx = gsap.context(() => {
    const s2 = Flip.getState('.cube-second .cube-marker');
    const s3 = Flip.getState('.cube-third .cube-marker');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#cube-main',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      },
    });

    // Hop to second marker + rotate
    tl.add(Flip.fit(canvasEl, s2, { duration: 1, ease: 'none' }), 0)
      .to(
        mesh.rotation,
        { x: `+=${Math.PI}`, y: `+=${Math.PI}`, duration: 1, ease: 'none' },
        '<',
      )
      .addLabel('mid', '+=0.5')
      // Hop to third marker + rotate
      .add(Flip.fit(canvasEl, s3, { duration: 1, ease: 'none' }), 'mid')
      .to(
        mesh.rotation,
        { x: `+=${Math.PI}`, y: `+=${Math.PI}`, duration: 1, ease: 'none' },
        '<',
      );
  });
}

export function initCubeScroll(): void {
  const start = document.querySelector<HTMLElement>('.cube-container.cube-initial');
  if (!start) return;

  canvasEl = document.createElement('canvas');
  canvasEl.className = 'cube-box';
  start.appendChild(canvasEl);

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3);

  const mat = new THREE.MeshBasicMaterial({ map: makeGradientTexture() });
  mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
  scene.add(mesh);

  gsap.ticker.add(render);
  onResize();
  buildTimeline();

  window.addEventListener('resize', () => {
    onResize();
    buildTimeline();
  });
}
