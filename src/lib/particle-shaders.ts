/**
 * GLSL shaders for the particle network background.
 * Ported verbatim from dbctech-site/src/shaders/particles.{vert,frag}.glsl,
 * with the fragment color tuned to NexApex's accent (#94fcff) instead of
 * the dbctech teal (#0D9488).
 */

export const PARTICLE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute float aSize;
  attribute float aPhase;

  varying float vDistance;
  varying float vPhase;

  void main() {
    vec3 pos = position;

    // Organic drift from per-particle phase
    pos.x += sin(uTime * 0.4 + aPhase * 2.1) * 0.08;
    pos.y += cos(uTime * 0.35 + aPhase * 1.7) * 0.08;
    pos.z += sin(uTime * 0.3 + aPhase * 2.5) * 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDistance = -mvPosition.z;
    vPhase = aPhase;

    gl_PointSize = uSize * aSize * uPixelRatio * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const PARTICLE_FRAG = /* glsl */ `
  uniform float uTime;

  varying float vDistance;
  varying float vPhase;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core  = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow  = 1.0 - smoothstep(0.1, 0.5, dist);
    float alpha = core * 0.8 + glow * 0.15;

    float pulse = 0.9 + 0.1 * sin(uTime * 0.8 + vPhase * 6.28);
    alpha *= pulse;

    alpha *= clamp(1.0 - vDistance * 0.06, 0.1, 1.0);

    // NexApex accent #94fcff = rgb(148, 252, 255) → (0.580, 0.988, 1.0)
    float lum  = 0.75 + 0.25 * sin(vPhase * 6.28);
    vec3 accent = vec3(0.580, 0.988, 1.0) * lum;
    vec3 deep   = vec3(0.102, 0.431, 0.741);
    vec3 color  = mix(accent, deep, vPhase * 0.3);

    gl_FragColor = vec4(color, alpha * 0.7);
  }
`;
