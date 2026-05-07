/**
 * Suppresses known Three.js deprecation/shader warnings from R3F internals.
 * - THREE.Clock: deprecated in r183+ but R3F v9 still constructs it for useFrame
 * - PCFSoftShadowMap: deprecated shadow map type
 * - WebGLProgram gradient warnings: benign shader compilation warnings on Windows/DirectX
 *
 * Self-executes on import so it runs before any 3D component instantiates.
 * Importing this file once from a layout is enough; subsequent imports no-op.
 */
declare global {
  interface Window {
    __nexapexThreeWarningsPatched?: boolean;
  }
}

function applyPatch() {
  if (typeof window === "undefined") return;
  if (window.__nexapexThreeWarningsPatched) return;
  window.__nexapexThreeWarningsPatched = true;

  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string") {
      const msg = args[0];
      if (
        msg.includes("THREE.Clock") ||
        msg.includes("PCFSoftShadowMap") ||
        msg.includes("gradient instruction used in a loop") ||
        msg.includes("Program Info Log")
      )
        return;
    }
    origWarn(...args);
  };
}

applyPatch();

export function patchThreeWarnings() {
  applyPatch();
}
