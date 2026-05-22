/**
 * Particle-Morph Asset Registry — single source of truth.
 *
 * HOW TO ADD A NEW MORPH SHAPE:
 *  1. Drop your `myShape.glb` into `/public/models/`.
 *  2. Add an entry below with `name: 'myShape'`.
 *  3. (Optional) Add a `case 'myShape':` in `resolveObj` to override mesh
 *     resolution or apply per-model scale/rotation. If you don't, the
 *     fallback traverses the scene graph and picks the first Mesh found.
 *  4. Add `'myShape'` to MORPH_SEQUENCE in Config.ts (and a label entry to
 *     MORPH_TITLES).
 *  5. Restart dev — that's it. No code changes elsewhere.
 *
 * Draco-compressed glbs are supported automatically via the decoder configured
 * in AssetsLoader.ts.
 */

import { Mesh } from "three";
import type { BufferGeometry, Object3D } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export type AssetSpec =
  | { kind: "model"; name: string; url: string }
  | { kind: "texture"; name: string; url: string };

export const ASSETS: AssetSpec[] = [
  { kind: "model", name: "nex-logo", url: "/models/nex_logo_solid_web.glb" },
  { kind: "model", name: "brain", url: "/models/brain.glb" },
  { kind: "model", name: "earth", url: "/models/earth.glb" },
  { kind: "texture", name: "disk", url: "/models/particle-disk.png" },
];

function autoNormalize(mesh: Mesh, targetSize = 2): Mesh {
  mesh.geometry.center();
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox!;
  const maxDim = Math.max(
    bb.max.x - bb.min.x,
    bb.max.y - bb.min.y,
    bb.max.z - bb.min.z,
  );
  if (maxDim > 0) {
    const s = targetSize / maxDim;
    mesh.geometry.scale(s, s, s);
  }
  return mesh;
}

function firstMesh(root: Object3D): Mesh | null {
  let found: Mesh | null = null;
  root.traverse((o) => {
    if (!found && (o as Mesh).isMesh) found = o as Mesh;
  });
  return found;
}

/**
 * Merge every Mesh in a scene graph into one geometry. Needed for models
 * authored as multiple parts (e.g. the NexApex logo: left wing, right wing,
 * accent) so the surface sampler scatters particles across the whole shape
 * instead of just the first part. Each part's world transform is baked in,
 * and attributes are trimmed to position + normal so the merge is clean.
 */
function mergedMesh(root: Object3D): Mesh {
  root.updateMatrixWorld(true);
  const parts: BufferGeometry[] = [];
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh || !m.geometry) return;
    let g = m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== "position" && attr !== "normal") g.deleteAttribute(attr);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    parts.push(g);
  });
  if (parts.length === 0) {
    throw new Error("[particle-morph] no meshes to merge");
  }
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error("[particle-morph] geometry merge failed");
  return new Mesh(merged);
}

export function resolveObj(name: string, gltf: GLTF): Mesh {
  switch (name) {
    case "nex-logo": {
      // Logo ships as three parts — merge them so particles cover the
      // full mark, then normalize to a consistent morph size.
      return autoNormalize(mergedMesh(gltf.scene), 2.2);
    }
    case "brain": {
      const mesh =
        (gltf.scene.getObjectByName("Brain_Model") as Mesh | undefined) ??
        firstMesh(gltf.scene);
      if (!mesh) throw new Error("[particle-morph] brain mesh not found");
      return mesh;
    }
    case "earth": {
      const mesh =
        (gltf.scene.getObjectByName(
          "uploads_files_220341_Earth_Longi_Alti002_1",
        ) as Mesh | undefined) ?? firstMesh(gltf.scene);
      if (!mesh) throw new Error("[particle-morph] earth mesh not found");
      return mesh;
    }
    default: {
      const mesh = firstMesh(gltf.scene);
      if (!mesh) throw new Error(`[particle-morph] no mesh in glb '${name}'`);
      return autoNormalize(mesh);
    }
  }
}
