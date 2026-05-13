import { Vector3 } from "three";

// NexApex brand palette — values must mirror src/styles/globals.css --color-nex-*
export const config = {
  scene: {
    backgroundColor: "#0e1418",
  },

  pointsBackground: {
    color1: "#94fcff", // nex-cyan
    color2: "#c63518", // nex-red
    color3: "#dfe4dc", // nex-sage
    depthWrite: false,
    depthTest: true,
  },

  pointsMesh: {
    colors: ["#94fcff", "#c63518", "#dfe4dc"] as [string, string, string],
    dotColor: "#94fcff",
    dotColorShadow: "#1a2630", // nex-teal
    dotSize: 22,
    dotMinSize: 0.1,
    dotsNum: 14000,
    useRandColor: false,
    useGradColor: true,
    gradDirX: false,
    gradDirY: false,
    sunX: 3.6,
    sunY: 6.4,
    sunZ: 10,
    gradX: 1,
    gradY: 0,
    gradZ: 80,
    useMouse: false,
    useShadowRandom: false,
    blending: "Additive" as const,
    animate: true,
    depthWrite: false,
    depthTest: true,
    rotationSpeed: 0.002,
  },

  meshAnimationParams: {
    cow: {
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
    },
    brain: {
      position: new Vector3(0, 0.048, 2.846),
      rotation: new Vector3(0, 0, 0),
    },
    earth: {
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
    },
  } as Record<string, { position: Vector3; rotation: Vector3 }>,
};

export type MorphName = "cow" | "brain" | "earth";

// Sequence the particles cycle through as the user scrolls the hero range.
export const MORPH_SEQUENCE: MorphName[] = ["cow", "brain", "earth"];

// Labels overlaid on the canvas, one per morph segment.
export const MORPH_TITLES: Record<MorphName, { title: string; tagline: string }> = {
  cow: { title: "Curiosity", tagline: "Where every breakthrough begins" },
  brain: { title: "Intelligence", tagline: "Models that learn your domain" },
  earth: { title: "Scale", tagline: "Built for global production loads" },
};
