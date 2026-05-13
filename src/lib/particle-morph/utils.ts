import {
  AdditiveBlending,
  MultiplyBlending,
  NoBlending,
  NormalBlending,
  SubtractiveBlending,
  type Blending,
} from "three";

export function threeBlendingMode(mode: string): Blending {
  switch (mode) {
    case "None": return NoBlending;
    case "Normal": return NormalBlending;
    case "Additive": return AdditiveBlending;
    case "Subtractive": return SubtractiveBlending;
    case "Multiple": return MultiplyBlending;
    default: return AdditiveBlending;
  }
}
