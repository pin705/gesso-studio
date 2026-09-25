// Gesso Kit runtime for scripted assets (Pixi, three, canvas).
//
//   import { defineAsset, pixiStage } from '/kit/gesso.mjs';
//   defineAsset({
//     async setup() { return pixiStage(); },          // build the scene once
//     render(t, stage) { ... stage.app.render(); }     // draw the frame at t seconds, deterministically
//   });
//
// Gesso calls render(t) for every review and export frame. In the studio the asset plays on its own.
const root = document.documentElement;
export const size = { width: Number(root.dataset.width), height: Number(root.dataset.height) };
export const duration = Number(root.dataset.duration) || 1;

export function defineAsset({ setup, render }) {
  let stage;
  const ready = (async () => {
    stage = await setup?.();
  })();
  let controlled = Boolean(window.__gessoRenderer); // the Gesso renderer drives time itself
  let origin = performance.now();
  const api = {
    ready,
    duration,
    async render(t) {
      await ready;
      await render?.(t, stage);
    }
  };
  window.gesso = api;
  addEventListener('message', (event) => {
    const message = event.data?.gesso;
    if (message === 'seek') {
      controlled = true;
      api.render(event.data.t);
    } else if (message === 'play') {
      controlled = false;
      origin = performance.now() - (event.data.t ?? 0) * 1000;
    }
  });
  const tick = (now) => {
    if (!controlled) api.render(((now - origin) / 1000) % duration);
    requestAnimationFrame(tick);
  };
  ready.then(() => {
    api.render(0);
    requestAnimationFrame(tick);
  });
  return api;
}

/** A transparent Pixi application sized to the asset, rendering only when asked. */
export async function pixiStage(options = {}) {
  const PIXI = await import('/kit/lib/pixi.mjs');
  const app = new PIXI.Application();
  await app.init({ width: size.width, height: size.height, backgroundAlpha: 0, antialias: true, preserveDrawingBuffer: true, resolution: devicePixelRatio, autoDensity: true, autoStart: false, ...options });
  app.ticker.stop();
  document.body.appendChild(app.canvas);
  return { PIXI, app };
}

/** Product-photo lighting: dark surroundings with a few softboxes, so facets and metals alternate dark and bright. */
function studioEnvironment(THREE) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040404);
  const softbox = (w, h, position, intensity, color) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
  };
  softbox(5, 3.5, [-4, 4.5, 4], 5, 0xfff1dd); // key: top-left, warm
  softbox(2.5, 7, [5, 0.5, -1.5], 2.2, 0xcfe0ff); // rim: right, cool
  softbox(9, 1.6, [0, -5, 2.5], 0.7, 0xffe6cc); // floor bounce
  softbox(1.2, 1.2, [1.5, 3, 5], 8, 0xffffff); // small glint
  softbox(12, 8, [0, 0.5, 9], 1.3, 0xfff4e8); // broad frontal fill so flat metal faces are not black
  return scene;
}

/** A transparent three.js renderer. environment: 'studio' (dark, softboxes; gems and metal) or 'room' (soft, bright). */
export async function threeStage({ fov = 30, distance = 6, environment = 'studio', exposure = 1 } = {}) {
  const THREE = await import('/kit/lib/three.mjs');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(size.width, size.height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  renderer.toneMappingExposure = exposure;
  scene.environment = pmrem.fromScene(environment === 'room' ? new THREE.RoomEnvironment() : studioEnvironment(THREE), 0.02).texture;
  const camera = new THREE.PerspectiveCamera(fov, size.width / size.height, 0.1, 100);
  camera.position.set(0, 0, distance);
  // key light from the top-left, cool rim from behind-right
  const key = new THREE.DirectionalLight(0xfff1dd, 2.4);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0x9fc7ff, 1.6);
  rim.position.set(4, 1, -4);
  scene.add(key, rim);
  return { THREE, renderer, scene, camera, render: () => renderer.render(scene, camera) };
}

/** Seeded PRNG (mulberry32) so particles and scatter are identical in every frame and export. */
export function random(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export const ease = {
  outCubic: (x) => 1 - (1 - x) ** 3,
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
  clamp: (x) => Math.min(1, Math.max(0, x)),
  /** 0→1 over [start, end] of a normalized time t. */
  window: (t, start, end) => Math.min(1, Math.max(0, (t - start) / (end - start)))
};

/** Soft radial glow texture (white core fading to transparent) for particles, flashes and light pools. */
export function glowTexture(PIXI, size = 128, falloff = [[0, 1], [0.25, 0.85], [0.6, 0.25], [1, 0]]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [stop, alpha] of falloff) gradient.addColorStop(stop, `rgba(255,255,255,${alpha})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return PIXI.Texture.from(canvas);
}

/** Elongated spark: bright head, fading tail (point it along the velocity with rotation). */
export function streakTexture(PIXI, length = 128, width = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = length;
  canvas.height = width;
  const context = canvas.getContext('2d');
  const along = context.createLinearGradient(0, 0, length, 0);
  along.addColorStop(0, 'rgba(255,255,255,0)');
  along.addColorStop(0.75, 'rgba(255,255,255,.8)');
  along.addColorStop(1, 'rgba(255,255,255,1)');
  context.fillStyle = along;
  context.beginPath();
  context.ellipse(length / 2, width / 2, length / 2, width / 2, 0, 0, Math.PI * 2);
  context.fill();
  return PIXI.Texture.from(canvas);
}
