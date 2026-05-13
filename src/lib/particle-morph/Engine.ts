import { AssetsLoader } from "./AssetsLoader";
import { Particles } from "./Particles";
import { Scene } from "./Scene";
import { MORPH_SEQUENCE, type MorphName } from "./Config";

export class ParticleMorphEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private scene!: Scene;
  private particles!: Particles;
  private assets: AssetsLoader;

  ready = false;
  onReady?: () => void;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;
    this.scene = new Scene(this.container, this.canvas);

    this.assets = new AssetsLoader();
    this.assets.addEventListener("onAssetsLoad", () => this.onAssetsReady());
  }

  private onAssetsReady() {
    this.particles = new Particles(this.scene, this.assets);
    this.particles.build();
    this.particles.setMorphs(MORPH_SEQUENCE[0], MORPH_SEQUENCE[1] ?? MORPH_SEQUENCE[0]);
    this.ready = true;
    this.onReady?.();
  }

  /**
   * Drive the morph state from scroll.
   *  - `globalProgress` in [0, 1] across the whole hero range.
   *  - Internally split into MORPH_SEQUENCE.length - 1 segments.
   */
  setScrollProgress(globalProgress: number) {
    if (!this.ready) return;
    const segments = MORPH_SEQUENCE.length - 1;
    if (segments <= 0) return;
    const clamped = Math.max(0, Math.min(1, globalProgress));
    const scaled = clamped * segments;
    const idx = Math.min(segments - 1, Math.floor(scaled));
    const local = scaled - idx;
    const from = MORPH_SEQUENCE[idx];
    const to = MORPH_SEQUENCE[idx + 1];
    this.particles.setMorphs(from, to);
    this.particles.setMorphProgress(local);
  }

  /**
   * Returns which morph segment the user is currently in (for syncing text overlays).
   */
  segmentFor(globalProgress: number): { from: MorphName; to: MorphName; local: number; idx: number } {
    const segments = Math.max(1, MORPH_SEQUENCE.length - 1);
    const clamped = Math.max(0, Math.min(1, globalProgress));
    const scaled = clamped * segments;
    const idx = Math.min(segments - 1, Math.floor(scaled));
    return {
      idx,
      local: scaled - idx,
      from: MORPH_SEQUENCE[idx],
      to: MORPH_SEQUENCE[idx + 1],
    };
  }

  setOpacity(o: number) {
    if (this.ready) this.particles.setOpacity(o);
  }

  destroy() {
    this.scene.destroy();
  }
}
