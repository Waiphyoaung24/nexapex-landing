// Inlined GLSL — Next.js/Turbopack cannot import .glsl directly.

export const meshVertexShader = /* glsl */ `
attribute vec3 color;
attribute vec3 randomness;
attribute vec3 morphTarget;
attribute vec3 morphNormal;

varying vec2 v_Uv;
varying vec3 v_Normal;
varying vec3 v_vertToLight;
varying vec3 v_vertToGradient;
varying vec3 vPosition;
varying vec3 vColor;
varying vec3 vMorphTarget;

uniform vec3 sunPosition;
uniform vec3 u_gradPosition;
uniform float u_size;
uniform float u_minSize;
uniform vec3 u_mousePos;
uniform bool u_useMouse;
uniform float u_time;
uniform float u_amplitude;

void main() {
  float time = u_time * 4.0;
  vColor = color;
  vPosition = position;

  vec3 transformed = vec3(position);
  vec3 norm = normal;
  vMorphTarget = morphTarget;

  transformed += (morphTarget - transformed) * u_amplitude;
  norm += (morphNormal - norm) * u_amplitude;

  if (u_useMouse) {
    vec3 seg = position - u_mousePos;
    vec3 dir = normalize(seg);
    float dist = length(seg);
    if (dist < 2.0) {
      float force = clamp(0.1 / (dist * dist), 0.0, 1.0);
      transformed += dir * (force / 4.0);
    }
  }

  transformed.x += sin(time * randomness.x) * 0.02;
  transformed.y += cos(time * randomness.y) * 0.02;
  transformed.z += cos(time * randomness.z) * 0.02;

  vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
  vec4 viewSunPos = viewMatrix * vec4(sunPosition, 1.0);
  vec4 viewGradPos = viewMatrix * vec4(u_gradPosition, 1.0);

  v_Uv = uv;
  v_Normal = normalMatrix * norm;
  v_vertToLight = normalize(viewSunPos.xyz - viewPosition.xyz);
  v_vertToGradient = normalize(viewGradPos.xyz - viewPosition.xyz);

  float kd = max(u_minSize, dot(v_vertToLight, v_Normal));
  gl_PointSize = (u_size / -viewPosition.z) * kd;
  gl_Position = projectionMatrix * viewPosition;
}
`;

export const meshFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 u_color;
uniform vec3 u_colorShadow;
uniform vec3 u_colorGrad1;
uniform vec3 u_colorGrad2;
uniform vec3 u_colorGrad3;
uniform sampler2D u_texture;
uniform bool u_useRandColor;
uniform bool u_useGradColor;
uniform float u_amplitude;
uniform float u_opacity;

varying vec3 v_Normal;
varying vec3 v_vertToLight;
varying vec3 v_vertToGradient;
varying vec3 vPosition;
varying vec3 vColor;
varying vec3 vMorphTarget;

void main() {
  float kd = max(0.0, dot(v_vertToLight, v_Normal));
  vec4 tx = texture2D(u_texture, gl_PointCoord);

  vec3 color = vec3(0.0);
  vec3 transformed = vec3(vPosition);
  transformed += (vMorphTarget - transformed) * u_amplitude;

  if (u_useRandColor) {
    color = vColor;
  } else if (u_useGradColor) {
    float gradientDirection = dot(v_vertToGradient, transformed);
    vec3 mixA = mix(u_colorGrad1, u_colorGrad2, gradientDirection + 0.75);
    vec3 mixB = mix(u_colorGrad2, u_colorGrad3, gradientDirection - 0.25);
    color = mix(mixA, mixB, step(0.5, gradientDirection));
  } else {
    color = mix(u_colorShadow, u_color, kd);
  }

  gl_FragColor = tx * vec4(color, u_opacity);
}
`;

export const bgVertexShader = /* glsl */ `
attribute vec3 aRandom;

varying vec3 vPosition;
varying vec3 vRandom;

uniform float uTime;
uniform float uScale;
uniform float uSize;

void main() {
  vPosition = position;
  vRandom = aRandom;

  float size = uSize;
  float speed = 2.8;
  float time = uTime * (speed * aRandom.x);

  size += sin(time * (aRandom.x * aRandom.z)) * 0.01;
  size *= uScale + (sin(size * speed + time) * (1.0 - uScale));

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (8.0 / -mvPosition.z) * uSize;
}
`;

export const bgFragmentShader = /* glsl */ `
varying vec3 vPosition;
varying vec3 vRandom;

uniform sampler2D uTexture;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uOpacity;
uniform float uScale;
uniform float uTime;

void main() {
  float speed = 2.8;
  float time = uTime * (speed * vRandom.x);

  vec3 transformed = vec3(vPosition);
  float gradientDirection = transformed.x * 0.05 + 0.3;

  vec3 mixA = mix(uColor1, uColor2, gradientDirection);
  vec3 mixB = mix(uColor2, uColor3, gradientDirection);
  vec3 color = mix(mixA, mixB, step(0.2, gradientDirection));

  float opacity = uOpacity;
  opacity += sin(time * (vRandom.x * vRandom.z)) * 0.1;
  opacity *= uScale + (sin(opacity * speed + time) * (1.0 - uScale));

  vec4 txt = texture2D(uTexture, gl_PointCoord);
  gl_FragColor = txt * vec4(color, opacity);
}
`;
