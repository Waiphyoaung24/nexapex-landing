import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { config, type MorphName } from "./Config";
import { threeBlendingMode } from "./utils";
import {
  bgFragmentShader,
  bgVertexShader,
  meshFragmentShader,
  meshVertexShader,
} from "./shaders";
import type { AssetsLoader } from "./AssetsLoader";
import type { Scene } from "./Scene";

type Morph = { target: Float32BufferAttribute; normal: Float32BufferAttribute };

export class Particles {
  morphs: Record<string, Morph> = {};
  pointsGroup = new Group();
  points!: Points;
  backgroundPoints!: Points;

  private scene: Scene;
  private assets: AssetsLoader;

  constructor(scene: Scene, assets: AssetsLoader) {
    this.scene = scene;
    this.assets = assets;
  }

  build() {
    this.initPointsBackground();
    this.initPointsMesh();
    this.scene.updatables.particles = (_t, elapsed) => this.onUpdate(elapsed);
  }

  private initPointsBackground() {
    const material = new ShaderMaterial({
      uniforms: {
        uColor1: { value: new Color(config.pointsBackground.color1) },
        uColor2: { value: new Color(config.pointsBackground.color2) },
        uColor3: { value: new Color(config.pointsBackground.color3) },
        uOpacity: { value: 0.45 },
        uTime: { value: 0 },
        uScale: { value: 0.6 },
        uSize: { value: 20 },
        uTexture: { value: this.assets.textures.disk },
      },
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      depthTest: config.pointsBackground.depthTest,
      depthWrite: config.pointsBackground.depthWrite,
      transparent: true,
      blending: threeBlendingMode("Additive"),
    });

    const geometry = new BufferGeometry();
    const position: number[] = [];
    const random: number[] = [];

    for (let i = 0; i < 700; i++) {
      position.push(
        40 * Math.random() - 20,
        40 * Math.random() - 20,
        40 * Math.random() - 20,
      );
      random.push(
        2 * Math.random() - 1,
        2 * Math.random() - 1,
        2 * Math.random() - 1,
      );
    }

    geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
    geometry.setAttribute("aRandom", new Float32BufferAttribute(random, 3));

    this.backgroundPoints = new Points(geometry, material);
    this.backgroundPoints.position.z = -10;
    this.scene.scene.add(this.backgroundPoints);
  }

  private initPointsMesh() {
    const cfg = config.pointsMesh;

    const material = new ShaderMaterial({
      uniforms: {
        u_amplitude: { value: 0 },
        u_time: { value: 0 },
        u_color: { value: new Color(cfg.dotColor) },
        u_colorGrad1: { value: new Color(cfg.colors[0]) },
        u_colorGrad2: { value: new Color(cfg.colors[1]) },
        u_colorGrad3: { value: new Color(cfg.colors[2]) },
        u_colorShadow: { value: new Color(cfg.dotColorShadow) },
        u_useRandColor: { value: cfg.useRandColor },
        u_useGradColor: { value: cfg.useGradColor },
        u_opacity: { value: 0 }, // start invisible — entry animation fades in
        sunPosition: { value: new Vector3(cfg.sunX, cfg.sunY, cfg.sunZ) },
        u_gradPosition: { value: new Vector3(cfg.gradX, cfg.gradY, cfg.gradZ) },
        u_texture: { value: this.assets.textures.disk },
        u_size: { value: cfg.dotSize },
        u_minSize: { value: cfg.dotMinSize },
        u_mousePos: { value: new Vector3() },
        u_useMouse: { value: cfg.useMouse },
      },
      vertexShader: meshVertexShader,
      fragmentShader: meshFragmentShader,
      depthTest: cfg.depthTest,
      depthWrite: cfg.depthWrite,
      transparent: true,
      blending: threeBlendingMode(cfg.blending),
    });

    // Sample every loaded model uniformly so morph buffers line up.
    const samplers: Record<string, MeshSurfaceSampler> = {};
    for (const [name, mesh] of Object.entries(this.assets.models)) {
      samplers[name] = new MeshSurfaceSampler(mesh)
        .setWeightAttribute(null)
        .build();
    }

    const dotsNum = cfg.dotsNum;
    const randomness: number[] = [];
    for (let i = 0; i < dotsNum; i++) {
      randomness.push(
        2 * Math.random() - 1,
        2 * Math.random() - 1,
        2 * Math.random() - 1,
      );
    }

    const _pos = new Vector3();
    const _norm = new Vector3();

    for (const [name, sampler] of Object.entries(samplers)) {
      const target: number[] = [];
      const normal: number[] = [];
      for (let i = 0; i < dotsNum; i++) {
        sampler.sample(_pos, _norm);
        target.push(_pos.x, _pos.y, _pos.z);
        normal.push(_norm.x, _norm.y, _norm.z);
      }
      this.morphs[name] = {
        target: new Float32BufferAttribute(target, 3),
        normal: new Float32BufferAttribute(normal, 3),
      };
    }

    const firstName = Object.keys(this.morphs)[0];
    const secondName = Object.keys(this.morphs)[1] ?? firstName;

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", this.morphs[firstName].target);
    geometry.setAttribute("normal", this.morphs[firstName].normal);
    geometry.setAttribute(
      "randomness",
      new Float32BufferAttribute(randomness, 3),
    );
    geometry.setAttribute("morphTarget", this.morphs[secondName].target);
    geometry.setAttribute("morphNormal", this.morphs[secondName].normal);

    this.points = new Points(geometry, material);
    this.pointsGroup.add(this.points);
    this.scene.scene.add(this.pointsGroup);
  }

  setMorphs(fromName: MorphName | string, toName: MorphName | string) {
    if (!this.morphs[fromName] || !this.morphs[toName]) return;
    this.points.geometry.setAttribute("position", this.morphs[fromName].target);
    this.points.geometry.setAttribute("normal", this.morphs[fromName].normal);
    this.points.geometry.setAttribute("morphTarget", this.morphs[toName].target);
    this.points.geometry.setAttribute("morphNormal", this.morphs[toName].normal);
  }

  setMorphProgress(t: number) {
    const u = this.points.material as ShaderMaterial;
    u.uniforms.u_amplitude.value = t;
  }

  setOpacity(o: number) {
    (this.points.material as ShaderMaterial).uniforms.u_opacity.value = o;
  }

  private onUpdate(elapsed: number) {
    (this.backgroundPoints.material as ShaderMaterial).uniforms.uTime.value =
      elapsed;
    (this.points.material as ShaderMaterial).uniforms.u_time.value = elapsed;
    if (config.pointsMesh.animate) {
      this.points.rotation.y += config.pointsMesh.rotationSpeed;
      this.backgroundPoints.rotation.y += 0.00025;
    }
  }
}
