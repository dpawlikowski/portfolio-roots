// The crossing: Styx's smoke dissolves into Wkrenta's neon ink, driven by scroll (uP).
// Raw WebGL2, one full-screen triangle, DPR ≤ 1.5, renders only while the passage is on screen.
import gsap from 'gsap';
import { state } from './state';

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uP; uniform float uT;
out vec4 o;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * n(p); p = p * 2.03 + 11.7; a *= .5; } return v; }
void main(){
  vec2 q = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float t = uT * .05;
  vec3 ink = vec3(.055, .047, .043);
  vec3 night = vec3(.075, .024, .122);
  vec3 pink = vec3(1., .18, .576);
  vec3 violet = vec3(.482, .173, .961);
  // Styx: slow rising smoke
  float sm = fbm(q * 2.1 + vec2(0., -t * 2.4) + fbm(q * 1.2 + t));
  vec3 cold = mix(ink, vec3(.6, .58, .56), smoothstep(.5, 1., sm) * .32);
  // Wkrenta: ink blooms from the centre as uP grows
  float d = length(q - vec2(.02, -.04));
  float field = fbm(q * 2.8 + vec2(t * 1.6, t)) * .55 + (1. - d) * .62;
  float thr = 1.18 - uP * 1.3;
  float m = smoothstep(thr, thr + .05, field);
  float rim = smoothstep(thr - .035, thr, field) - m;
  float glow = .5 * (1. - smoothstep(.78, 1., uP) * .75);
  vec3 hue = mix(violet, pink, smoothstep(.35, .85, fbm(q * 1.5 - t)));
  vec3 warm = mix(night, hue, glow * smoothstep(0., .7, field - thr));
  vec3 col = mix(cold, warm, m) + pink * rim * 1.2;
  col += (h(gl_FragCoord.xy + floor(uT * 24.)) - .5) * .035; // film grain
  o = vec4(col, 1.);
}`;

export function initShader() {
  const section = document.querySelector<HTMLElement>('.passage');
  const stage = section?.querySelector<HTMLElement>('.passage__stage');
  if (!section || !stage || state.lowQuality) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return; // CSS fallback stays

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uP = gl.getUniformLocation(prog, 'uP');
  const uT = gl.getUniformLocation(prog, 'uT');

  stage.prepend(canvas);
  section.classList.add('has-gl');

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (window.innerWidth < 768 ? 0.75 : 1);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(stage);
  const t0 = performance.now();
  const frame = () => {
    if (!visible) return;
    gl.uniform1f(uP, state.passage);
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  gsap.ticker.add(frame);

  const destroy = () => {
    gsap.ticker.remove(frame);
    io.disconnect();
    window.removeEventListener('resize', resize);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
    section.classList.remove('has-gl');
  };
  window.addEventListener('quality:low', destroy, { once: true });
}
