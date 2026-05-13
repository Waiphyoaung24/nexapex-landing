import {
  Clock,
  PerspectiveCamera,
  Scene as ThreeScene,
  WebGLRenderer,
} from "three";

export class Scene {
  scene: ThreeScene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  updatables: Record<string, (timeStamp: number, elapsed: number) => void> = {};

  private clock = new Clock();
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;

    this.scene = new ThreeScene();
    // Transparent clear — body bg shows through, masking can vignette edges.
    this.scene.background = null;

    this.camera = new PerspectiveCamera(50, 1, 0.1, 100);
    // Closer camera = larger particle silhouette in viewport.
    this.camera.position.set(0, 0, 3.4);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setAnimationLoop((timeStamp) => {
      const elapsed = this.clock.getElapsedTime();
      for (const update of Object.values(this.updatables)) {
        update(timeStamp, elapsed);
      }
      this.renderer.render(this.scene, this.camera);
    });

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  resize() {
    const width = this.container.offsetWidth || window.innerWidth;
    const height = this.container.offsetHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }
}
