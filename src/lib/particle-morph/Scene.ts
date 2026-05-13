import {
  Clock,
  Color,
  PerspectiveCamera,
  Scene as ThreeScene,
  WebGLRenderer,
} from "three";
import { config } from "./Config";

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
    this.scene.background = new Color(config.scene.backgroundColor);

    this.camera = new PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
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
