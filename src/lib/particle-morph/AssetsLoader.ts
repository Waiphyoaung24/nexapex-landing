import { EventDispatcher, TextureLoader, type Mesh, type Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ASSETS, resolveObj } from "./assets";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const textureLoader = new TextureLoader();

type Events = { onAssetsLoad: object };

export class AssetsLoader extends EventDispatcher<Events> {
  models: Record<string, Mesh> = {};
  textures: Record<string, Texture> = {};
  private loadedCount = 0;
  private total = ASSETS.length;

  constructor() {
    super();
    for (const asset of ASSETS) {
      if (asset.kind === "model") {
        gltfLoader.load(asset.url, (gltf) => {
          this.models[asset.name] = resolveObj(asset.name, gltf);
          this.tick();
        });
      } else {
        textureLoader.load(asset.url, (tex) => {
          this.textures[asset.name] = tex;
          this.tick();
        });
      }
    }
  }

  private tick() {
    this.loadedCount++;
    if (this.loadedCount === this.total) {
      this.dispatchEvent({ type: "onAssetsLoad" });
    }
  }
}
