"use client";

import { useEffect, useRef } from "react";

/**
 * Radial-swirl WebGL line field. 3 generative phases auto-cycle every 1.5s.
 * Line count, DPR, and FPS scale to device class — heavy desktop, light mobile.
 */

const VERT = `
  attribute vec3 vertexPosition;
  uniform mat4 modelViewMatrix;
  uniform mat4 perspectiveMatrix;
  void main(void) {
    gl_Position = perspectiveMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
  }
`;

const FRAG = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  uniform vec4 uColor;
  void main(void) {
    gl_FragColor = uColor;
  }
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function lineBudget(): number {
  if (typeof window === "undefined") return 8000;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = w < 768 || (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches);
  if (isMobile) return cores >= 6 ? 9000 : 5500;
  if (w < 1280) return 18000;
  return cores >= 8 ? 32000 : 22000;
}

export function ParticleNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    // ── Compile + link
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, "vertexPosition");
    gl.enableVertexAttribArray(aPos);

    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // ── State
    let numLines = lineBudget();
    let cw = window.innerWidth;
    let ch = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap for perf

    let vertices = new Float32Array(numLines * 6);
    let thetaArr = new Float32Array(numLines);
    let velThetaArr = new Float32Array(numLines);
    let velRadArr = new Float32Array(numLines);
    let logoTargetXArr = new Float32Array(numLines);
    let logoTargetYArr = new Float32Array(numLines);
    // Sampled logo silhouette in normalized [-1..1] space (square crop)
    let logoPoints: Float32Array | null = null;

    const assignLogoTargets = (count: number) => {
      // Map each particle to a sampled logo pixel; spread out if not loaded yet.
      const ratio = cw / ch;
      if (!logoPoints || logoPoints.length === 0) {
        for (let i = 0; i < count; i++) {
          logoTargetXArr[i] = (Math.random() * 2 - 1) * ratio * 0.6;
          logoTargetYArr[i] = (Math.random() * 2 - 1) * 0.6;
        }
        return;
      }
      // Logo target scale: 70vh tall on desktop, smaller on mobile
      const isMobile = cw < 768;
      const scale = isMobile ? 0.55 : 0.7;
      const pts = logoPoints.length / 2;
      for (let i = 0; i < count; i++) {
        const idx = (i % pts) * 2;
        // Add slight per-particle jitter so the silhouette has a bit of softness.
        const jx = (Math.random() - 0.5) * 0.008;
        const jy = (Math.random() - 0.5) * 0.008;
        logoTargetXArr[i] = logoPoints[idx] * scale + jx;
        logoTargetYArr[i] = logoPoints[idx + 1] * scale + jy;
      }
    };

    const seed = (count: number) => {
      vertices = new Float32Array(count * 6);
      thetaArr = new Float32Array(count);
      velThetaArr = new Float32Array(count);
      velRadArr = new Float32Array(count);
      logoTargetXArr = new Float32Array(count);
      logoTargetYArr = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const rad = 0.1 + 0.2 * Math.random();
        const theta = Math.random() * Math.PI * 2;
        const x = rad * Math.cos(theta);
        const y = rad * Math.sin(theta);
        const bp = i * 6;
        vertices[bp] = x;     vertices[bp + 1] = y;     vertices[bp + 2] = 1.83;
        vertices[bp + 3] = x; vertices[bp + 4] = y;     vertices[bp + 5] = 1.83;
        thetaArr[i] = theta;
        velThetaArr[i] = (Math.random() * Math.PI * 2) / 30;
        velRadArr[i] = rad;
      }
      assignLogoTargets(count);
    };
    seed(numLines);

    // ── Sample logo silhouette to a pool of normalized [-1..1] points
    const sampleLogo = (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const SAMPLE = 220; // analysis canvas size — bigger = more silhouette detail
        const oc = document.createElement("canvas");
        oc.width = SAMPLE;
        oc.height = SAMPLE;
        const octx = oc.getContext("2d");
        if (!octx) return;
        // contain-fit the logo
        const ar = img.width / img.height;
        let dw = SAMPLE, dh = SAMPLE;
        if (ar > 1) dh = SAMPLE / ar;
        else dw = SAMPLE * ar;
        const dx = (SAMPLE - dw) / 2;
        const dy = (SAMPLE - dh) / 2;
        octx.clearRect(0, 0, SAMPLE, SAMPLE);
        octx.drawImage(img, dx, dy, dw, dh);
        const data = octx.getImageData(0, 0, SAMPLE, SAMPLE).data;
        const pts: number[] = [];
        const step = 2; // sample every Nth pixel
        for (let y = 0; y < SAMPLE; y += step) {
          for (let x = 0; x < SAMPLE; x += step) {
            const a = data[(y * SAMPLE + x) * 4 + 3];
            if (a > 80) {
              const nx = (x / SAMPLE) * 2 - 1;
              const ny = -((y / SAMPLE) * 2 - 1); // flip Y
              pts.push(nx, ny);
            }
          }
        }
        if (pts.length === 0) return;
        logoPoints = new Float32Array(pts);
        assignLogoTargets(numLines);
      };
      img.src = src;
    };
    sampleLogo("/images/Flat_white.png");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    // ── Matrices
    const setMatrices = () => {
      const fov = 30;
      const aspect = cw / ch;
      const near = 1;
      const far = 10000;
      const top = near * Math.tan((fov * Math.PI) / 360);
      const right = top * aspect;
      const a = 0; // (right + left) / (right - left) = 0 for symmetric
      const b = 0;
      const c = (far + near) / (far - near);
      const d = (2 * far * near) / (far - near);
      const x = near / right;
      const y = near / top;
      // NB: matches the original "swap" — perspectiveMatrix uniform is set with the perspective values
      const persp = new Float32Array([x, 0, a, 0, 0, y, b, 0, 0, 0, c, d, 0, 0, -1, 0]);
      const ident = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      const uModel = gl.getUniformLocation(program, "modelViewMatrix");
      const uPersp = gl.getUniformLocation(program, "perspectiveMatrix");
      gl.uniformMatrix4fv(uModel, false, persp);
      gl.uniformMatrix4fv(uPersp, false, ident);
    };

    // Brand cyan tinted, low alpha — additive blending builds glow density.
    const uColor = gl.getUniformLocation(program, "uColor");
    gl.uniform4f(uColor, 0.18, 0.32, 0.42, 1.0);

    const resize = () => {
      cw = window.innerWidth;
      ch = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
      setMatrices();

      // Re-budget on width-class changes (e.g. orientation flip)
      const next = lineBudget();
      if (next !== numLines) {
        numLines = next;
        seed(numLines);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      }
    };
    resize();

    let drawType = 0; // start in logo-settle phase
    let cn = 0;

    const draw0 = () => {
      const n = numLines;
      for (let i = 0; i < n; i++) {
        const bp = i * 6;
        vertices[bp] = vertices[bp + 3];
        vertices[bp + 1] = vertices[bp + 4];
        const tx = logoTargetXArr[i];
        const ty = logoTargetYArr[i];
        let px = vertices[bp + 3];
        let py = vertices[bp + 4];
        // Slightly slower lerp so silhouette has time to resolve.
        px += (tx - px) * (Math.random() * 0.03 + 0.05);
        py += (ty - py) * (Math.random() * 0.03 + 0.05);
        vertices[bp + 3] = px;
        vertices[bp + 4] = py;
      }
    };
    const draw1 = () => {
      const n = numLines;
      for (let i = 0; i < n; i++) {
        const bp = i * 6;
        vertices[bp] = vertices[bp + 3];
        vertices[bp + 1] = vertices[bp + 4];
        const rad = velRadArr[i];
        const t = thetaArr[i] + velThetaArr[i];
        thetaArr[i] = t;
        const tx = rad * Math.cos(t);
        const ty = rad * Math.sin(t);
        let px = vertices[bp + 3];
        let py = vertices[bp + 4];
        px += (tx - px) * (Math.random() * 0.1 + 0.1);
        py += (ty - py) * (Math.random() * 0.1 + 0.1);
        vertices[bp + 3] = px;
        vertices[bp + 4] = py;
      }
    };
    const draw2 = () => {
      cn += 0.1;
      const n = numLines;
      for (let i = 0; i < n; i++) {
        const bp = i * 6;
        vertices[bp] = vertices[bp + 3];
        vertices[bp + 1] = vertices[bp + 4];
        const rad = velRadArr[i];
        const t = thetaArr[i] + velThetaArr[i];
        thetaArr[i] = t;
        vertices[bp + 3] = vertices[bp + 3] + rad * Math.cos(t) * 0.1;
        vertices[bp + 4] = vertices[bp + 4] + rad * Math.sin(t) * 0.1;
      }
    };

    const stepDraw = () => {
      if (drawType === 0) draw0();
      else if (drawType === 1) draw1();
      else draw2();
    };

    let rafId = 0;
    let cycleId: number | undefined;
    let visible = true;

    const render = () => {
      if (!visible) {
        rafId = requestAnimationFrame(render);
        return;
      }
      stepDraw();
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.LINES, 0, numLines * 2);
      rafId = requestAnimationFrame(render);
    };

    if (!reduceMotion) {
      render();
      // Phase durations: logo settles longer than the kinetic phases.
      const PHASE_MS = [3000, 1800, 1800];
      const tick = () => {
        drawType = (drawType + 1) % 3;
        cycleId = window.setTimeout(tick, PHASE_MS[drawType]);
      };
      cycleId = window.setTimeout(tick, PHASE_MS[drawType]);
    } else {
      // Single static frame for reduced-motion
      stepDraw();
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.LINES, 0, numLines * 2);
    }

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };

    // Debounced resize for orientation/window
    let resizeTimeout: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 120);
    };

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      if (cycleId !== undefined) window.clearTimeout(cycleId);
      window.clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
