/* ==========================================================================
   HERO 3D: Matrix rain in real depth
   ~9.5k glyph quads drawn in one instanced call, animated entirely on the GPU,
   with bloom, a cursor "x-ray" lens, click shockwaves, mouse parallax,
   a scroll fly-through and a light CRT pass (chromatic aberration, scanlines, vignette).
   Loaded on demand by index.html on desktop; the 2D canvas rain is the fallback.
   ========================================================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789Z:=*+<>';
const GRID = 8;          // glyph atlas is GRID x GRID
const COLUMNS = 170;
const ROWS = 56;
const CAMERA_Z = 18;
const FOV = 55;

/* Glyph atlas: white glyphs, mirrored like in the film, with padding against mipmap bleed */
function glyphAtlas() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * GRID;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.font = `bold ${size * 0.72}px monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < GRID * GRID; i++) {
    g.save();
    g.translate((i % GRID) * size + size / 2, Math.floor(i / GRID) * size + size / 2);
    g.scale(-1, 1);
    g.fillText(GLYPHS[i % GLYPHS.length], 0, 0);
    g.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/* One quad per glyph; each column gets a depth, a speed and a phase */
function rainGeometry() {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));

  const n = COLUMNS * ROWS;
  const column = new Float32Array(n * 4);   // x, z, speed (rows/s), phase (0-1)
  const cell = new Float32Array(n * 3);     // row, column top y, cell size
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  for (let c = 0; c < COLUMNS; c++) {
    const z = -2 - Math.random() * 48;
    const depth = CAMERA_Z - z;
    const halfH = depth * tanHalf;
    const x = (Math.random() * 2 - 1) * halfH * 2.1;      // covers up to ~2:1 screens
    const size = 0.6 + depth * 0.012;                       // far columns slightly bigger, so they reach the floor
    const top = halfH + Math.random() * 6;
    const speed = 7 + Math.random() * 10;
    const phase = Math.random();
    for (let r = 0; r < ROWS; r++) {
      const i = c * ROWS + r;
      column.set([x, z, speed, phase], i * 4);
      cell.set([r, top, size], i * 3);
    }
  }
  geo.setAttribute('aColumn', new THREE.InstancedBufferAttribute(column, 4));
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 3));
  geo.instanceCount = n;
  return geo;
}

const rainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uMouse;
  uniform vec3 uRipple;      // xy = ndc center, z = start time
  attribute vec4 aColumn;
  attribute vec3 aCell;
  varying vec2 vUv;
  varying float vGlyph;
  varying float vBright;
  varying float vHead;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    // the head runs down the column, then a gap before the next drop
    float span = ${ROWS}.0 * 1.7;
    float head = mod(uTime * aColumn.z + aColumn.w * span, span);
    float behind = head - aCell.x;
    float trail = clamp(1.0 - behind / (${ROWS}.0 * 0.5), 0.0, 1.0) * step(0.0, behind);
    vHead = step(0.0, behind) * step(behind, 1.0);

    vec4 mv = modelViewMatrix * vec4(aColumn.x, aCell.y - aCell.x * aCell.z, aColumn.y, 1.0);
    mv.xy += position.xy * aCell.z * 0.92;             // camera-facing quad
    gl_Position = projectionMatrix * mv;

    vec2 ndc = gl_Position.xy / gl_Position.w;
    vec2 aspect = vec2(uAspect, 1.0);

    // cursor lens: reveals the dormant glyphs around the pointer
    float lens = 1.0 - smoothstep(0.0, 0.3, length((ndc - uMouse) * aspect));

    // click shockwave: a ring that expands and fades
    float age = uTime - uRipple.z;
    float dist = length((ndc - uRipple.xy) * aspect);
    float ring = exp(-pow((dist - age * 1.6) * 7.0, 2.0)) * exp(-age * 1.2);

    float side = mix(0.3, 1.0, smoothstep(-0.7, 0.25, ndc.x));   // calmer behind the copy
    float fog = 1.0 - smoothstep(16.0, 66.0, -mv.z);

    vBright = (trail * trail * side + lens * 0.6 + ring * 1.2) * fog;

    float rate = 1.5 + hash(aCell.x * 7.13 + aColumn.w * 113.0) * 5.0 + vHead * 12.0;
    vGlyph = floor(hash(aCell.x * 13.7 + aColumn.w * 917.3 + floor(uTime * rate)) * ${GRID * GRID}.0);
    vUv = uv;
  }
`;

const rainFragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uColor;
  uniform vec3 uHead;
  uniform float uFade;
  varying vec2 vUv;
  varying float vGlyph;
  varying float vBright;
  varying float vHead;

  void main() {
    float g = ${GRID}.0;
    vec2 cell = vec2(mod(vGlyph, g), g - 1.0 - floor(vGlyph / g));
    float a = texture2D(uAtlas, (cell + vUv) / g).a;
    float alpha = a * vBright * uFade;
    if (alpha < 0.004) discard;
    vec3 col = mix(uColor, uHead * 1.5, vHead);         // heads overdriven so the bloom catches them
    gl_FragColor = vec4(col, alpha);
  }
`;

/* CRT pass: chromatic aberration toward the edges, faint scanlines, vignette */
const CrtShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      float shift = 0.012 * r2;
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + c * shift).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - c * shift).b
      );
      col *= 0.95 + 0.05 * sin(vUv.y * 1100.0);
      col *= 1.0 - r2 * 0.8;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function start(canvas, hero) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  // pure black: a near-black sRGB clear gets lifted to gray by the composer's linear->sRGB output
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAMERA_Z);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(9, 9) },          // off-screen until the pointer moves
      uRipple: { value: new THREE.Vector3(0, 0, -100) },
      uAtlas: { value: glyphAtlas() },
      uColor: { value: new THREE.Color('#26d970') },
      uHead: { value: new THREE.Color('#a8ffc8') },
      uFade: { value: 1 },
    },
    vertexShader: rainVertex,
    fragmentShader: rainFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.Mesh(rainGeometry(), material);
  rain.frustumCulled = false;
  scene.add(rain);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.35, 0.32);
  composer.addPass(bloom);
  composer.addPass(new ShaderPass(CrtShader));
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    material.uniforms.uAspect.value = w / h;
  }
  resize();
  window.addEventListener('resize', resize);

  // pointer in canvas NDC
  const mouse = new THREE.Vector2(9, 9);
  const target = new THREE.Vector2(9, 9);
  const toNdc = (e, out) => {
    const r = canvas.getBoundingClientRect();
    return out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  window.addEventListener('pointermove', (e) => toNdc(e, target), { passive: true });
  hero.addEventListener('pointerleave', () => target.set(9, 9));
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    const p = toNdc(e, new THREE.Vector2());
    material.uniforms.uRipple.value.set(p.x, p.y, material.uniforms.uTime.value);
  });

  let visible = true;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  let firstFrame = true;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!visible || document.hidden) return;
    const u = material.uniforms;
    u.uTime.value += dt;

    // the lens trails the pointer a little (snaps when it enters or leaves); the camera drifts with it
    if (mouse.x > 5 || target.x > 5) mouse.copy(target);
    else mouse.lerp(target, 0.12);
    u.uMouse.value.copy(mouse);
    const off = mouse.x > 5;
    const px = off ? 0 : THREE.MathUtils.clamp(mouse.x, -1, 1);
    const py = off ? 0 : THREE.MathUtils.clamp(mouse.y, -1, 1);
    camera.position.x += (px * 2.2 - camera.position.x) * 0.04;
    camera.position.y += (py * 1.2 - camera.position.y) * 0.04;

    // scrolling flies the camera into the rain while it fades out
    const p = Math.min(window.scrollY / hero.offsetHeight, 1);
    camera.position.z = CAMERA_Z - p * 14;
    u.uFade.value = 1 - p * 0.7;
    camera.lookAt(camera.position.x * 0.3, camera.position.y * 0.3, camera.position.z - 30);

    composer.render();
    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-3d');
    }
  });
}
