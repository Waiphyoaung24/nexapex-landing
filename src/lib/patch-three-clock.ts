/**
 * Suppresses known Three.js deprecation/shader warnings from R3F internals.
 * - THREE.Clock: deprecated in r183+ but R3F still uses it
 * - PCFSoftShadowMap: deprecated shadow map type
 * - WebGLProgram gradient warnings: benign shader compilation warnings on Windows/DirectX
 */
export function patchThreeWarnings() {
  if (typeof window === "undefined") return;

  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string") {
      const msg = args[0];
      if (
        msg.includes("THREE.Clock") ||
        msg.includes("PCFSoftShadowMap") ||
        msg.includes("gradient instruction used in a loop") ||
        msg.includes("Program Info Log")
      ) return;
    }
    origWarn(...args);
  };
}
