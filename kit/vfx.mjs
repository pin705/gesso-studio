// Gesso Kit: ready-made Pixi VFX recipes. Each returns a { setup, render } pair for defineAsset:
//
//   import { defineAsset } from '/kit/gesso.mjs';
//   import { slash } from '/kit/vfx.mjs';
//   defineAsset(slash({ core: 0xffffff, color: 0x5fb8ff, edge: 0x1b3d9a }));
//
// All motion is a pure function of t, so previews, review frames and sprite sheets match exactly.
// Loops (flame, aura) are seamless: frame 0 equals the frame after the last.
import { duration, ease, glowTexture, pixiStage, random, size, streakTexture } from '/kit/gesso.mjs';

const TAU = Math.PI * 2;
const mix = (a, b, k) => {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
};
/** Colour along a gradient of [stop, colour] pairs. */
const ramp = (stops, k) => {
  for (let index = 1; index < stops.length; index += 1) {
    const [s0, c0] = stops[index - 1];
    const [s1, c1] = stops[index];
    if (k <= s1) return mix(c0, c1, (k - s0) / (s1 - s0 || 1));
  }
  return stops.at(-1)[1];
};

async function stage({ bloom = true } = {}) {
  const { PIXI, app } = await pixiStage();
  const world = new PIXI.Container();
  if (bloom) world.filters = [new PIXI.AdvancedBloomFilter({ threshold: 0.5, bloomScale: 0.9, brightness: 1, blur: 5, quality: 6 })];
  app.stage.addChild(world);
  return { PIXI, app, world, glow: glowTexture(PIXI), streak: streakTexture(PIXI), centre: { x: size.width / 2, y: size.height / 2 } };
}

function sprite(PIXI, texture, parent, { tint = 0xffffff, anchor = [0.5, 0.5], blend = 'add' } = {}) {
  const item = new PIXI.Sprite(texture);
  item.anchor.set(...anchor);
  item.tint = tint;
  item.blendMode = blend;
  parent.addChild(item);
  return item;
}

/** Crescent sword slash: the head sweeps along an arc, the tail erases after it, sparks fly off the edge. */
export function slash({ core = 0xffffff, color = 0x5fb8ff, edge = 0x1b3d9a, radius = 0.36, sweep = 2.4, start = -2.6, thickness = 0.1, sparks = 26, seed = 7 } = {}) {
  return {
    async setup() {
      const s = await stage();
      const rng = random(seed);
      const g = new s.PIXI.Graphics();
      g.blendMode = 'add';
      s.world.addChild(g);
      const bits = Array.from({ length: sparks }, () => ({
        sprite: sprite(s.PIXI, s.streak, s.world, { tint: rng() < 0.5 ? core : color, anchor: [1, 0.5] }),
        at: rng(), speed: 0.12 + rng() * 0.22, life: 0.25 + rng() * 0.35, scale: 0.12 + rng() * 0.22
      }));
      return { ...s, g, bits };
    },
    render(time, { app, g, bits, centre: middle }) {
      const t = time / duration;
      const r = Math.min(size.width, size.height) * radius;
      // centre the swept arc (not the circle) on the canvas
      const mid = start + sweep / 2;
      const centre = { x: middle.x - Math.cos(mid) * r * 0.45, y: middle.y - Math.sin(mid) * r * 0.45 };
      const head = ease.outCubic(ease.window(t, 0.02, 0.32));
      const tail = ease.inOutSine(ease.window(t, 0.3, 0.92));
      g.clear();
      if (head > tail) {
        // one filled band per layer: edge (wide, dark), colour, white-hot core (thin)
        for (const [width, tint, alpha] of [[1, edge, 0.55], [0.62, color, 0.9], [0.22, core, 1]]) {
          const steps = 48;
          const outer = [];
          const inner = [];
          for (let index = 0; index <= steps; index += 1) {
            const k = tail + (head - tail) * (index / steps);
            const angle = start + sweep * k;
            // tapered: thickest just behind the head, needle-thin at both ends
            const local = (k - tail) / (head - tail || 1);
            const taper = Math.sin(Math.PI * Math.pow(local, 0.7));
            const w = r * thickness * width * taper;
            outer.push(centre.x + Math.cos(angle) * (r + w), centre.y + Math.sin(angle) * (r + w));
            inner.push(centre.x + Math.cos(angle) * (r - w * 0.35), centre.y + Math.sin(angle) * (r - w * 0.35));
          }
          const points = [...outer];
          for (let index = inner.length - 2; index >= 0; index -= 2) points.push(inner[index], inner[index + 1]);
          g.poly(points).fill({ color: tint, alpha: alpha * (1 - ease.window(t, 0.6, 1)) });
        }
      }
      for (const bit of bits) {
        const born = 0.04 + bit.at * 0.3;
        const local = ease.window(t, born, born + bit.life);
        const angle = start + sweep * bit.at;
        const distance = r + ease.outCubic(local) * r * bit.speed * 2.4;
        bit.sprite.position.set(centre.x + Math.cos(angle) * distance, centre.y + Math.sin(angle) * distance);
        bit.sprite.rotation = angle + Math.PI * 0.12;
        bit.sprite.scale.set(bit.scale * (1 - local), bit.scale * 0.7);
        bit.sprite.alpha = local > 0 && local < 1 ? 1 - local : 0;
      }
      app.render();
    }
  };
}

/** Radial magic burst: flash, halo, expanding ring, rotating rune, streak sparks. */
export function burst({ core = 0xffffff, color = 0xa894f0, edge = 0x6a52c4, sparks = 70, runes = true, seed = 42 } = {}) {
  return {
    async setup() {
      const s = await stage();
      const rng = random(seed);
      const halo = sprite(s.PIXI, s.glow, s.world, { tint: edge });
      const flash = sprite(s.PIXI, s.glow, s.world, { tint: core });
      const ring = new s.PIXI.Graphics();
      const rune = new s.PIXI.Graphics();
      for (const item of [ring, rune]) {
        item.blendMode = 'add';
        item.position.set(s.centre.x, s.centre.y);
        s.world.addChild(item);
      }
      const bits = Array.from({ length: sparks }, () => ({
        sprite: sprite(s.PIXI, s.streak, s.world, { tint: rng() < 0.3 ? core : rng() < 0.6 ? color : edge, anchor: [1, 0.5] }),
        angle: rng() * TAU, speed: 0.2 + rng() * 0.28, start: rng() * 0.12, life: 0.45 + rng() * 0.4, curl: (rng() - 0.5) * 1.6, scale: 0.18 + rng() * 0.3
      }));
      for (const item of [halo, flash]) item.position.set(s.centre.x, s.centre.y);
      return { ...s, halo, flash, ring, rune, bits };
    },
    render(time, { app, halo, flash, ring, rune, bits, centre }) {
      const t = time / duration;
      const unit = Math.min(size.width, size.height);
      const pop = ease.outBack(ease.window(t, 0.05, 0.22));
      flash.scale.set((0.3 + pop * 1.1) * unit / 384);
      flash.alpha = t > 0.05 ? 1 - ease.window(t, 0.25, 0.7) : 0;
      halo.scale.set((0.5 + pop * 1.7) * unit / 384);
      halo.alpha = t > 0.04 ? 0.9 * (1 - ease.window(t, 0.15, 0.9)) : 0;
      const radius = unit * (0.08 + ease.outCubic(ease.window(t, 0.12, 0.8)) * 0.31);
      const ringAlpha = t > 0.12 ? 1 - ease.window(t, 0.2, 0.85) : 0;
      ring.clear().circle(0, 0, radius).stroke({ width: unit * (0.026 * (1 - t) + 0.005), color, alpha: ringAlpha }).circle(0, 0, radius * 0.92).stroke({ width: 2, color: core, alpha: ringAlpha * 0.8 });
      rune.clear();
      if (runes) {
        rune.rotation = t * 1.2;
        const alpha = ease.window(t, 0, 0.12) * (1 - ease.window(t, 0.35, 0.75));
        const r = unit * 0.18;
        for (let index = 0; index < 6; index += 1) {
          const a = (index / 6) * TAU;
          rune.moveTo(Math.cos(a) * r, Math.sin(a) * r).lineTo(Math.cos(a + 2.1) * r, Math.sin(a + 2.1) * r);
        }
        rune.stroke({ width: 3, color: core, alpha }).circle(0, 0, r).stroke({ width: 2, color: edge, alpha });
      }
      for (const bit of bits) {
        const local = ease.window(t, bit.start + 0.12, bit.start + 0.12 + bit.life);
        const travel = ease.outCubic(local);
        const angle = bit.angle + bit.curl * travel;
        bit.sprite.position.set(centre.x + Math.cos(angle) * unit * bit.speed * travel, centre.y + Math.sin(angle) * unit * bit.speed * travel);
        bit.sprite.rotation = angle + bit.curl * 0.5;
        bit.sprite.scale.set(bit.scale * (1.2 - local), bit.scale * 0.9);
        bit.sprite.alpha = local > 0 && local < 1 ? 1 - local : 0;
      }
      app.render();
    }
  };
}

/** Seamless looping flame: particles rise and cool from white-hot to smoke. */
export function flame({ stops = [[0, 0xfff4c8], [0.18, 0xffc23a], [0.45, 0xff6a1a], [0.72, 0xb3201a], [1, 0x2a1410]], count = 70, width = 0.2, height = 0.66, seed = 3 } = {}) {
  return {
    async setup() {
      const s = await stage({ bloom: false });
      const rng = random(seed);
      const base = sprite(s.PIXI, s.glow, s.world, { tint: stops[2][1] });
      base.position.set(s.centre.x, size.height * 0.8);
      base.scale.set(size.width / 128 * 0.5, size.width / 128 * 0.22);
      base.alpha = 0.45;
      const bits = Array.from({ length: count }, () => ({
        sprite: sprite(s.PIXI, s.glow, s.world), phase: rng(), x: (rng() - 0.5) * 2, wobble: rng() * TAU, scale: 0.4 + rng() * 0.6
      }));
      return { ...s, bits };
    },
    render(time, { app, bits, centre }) {
      const t = time / duration;
      for (const bit of bits) {
        const life = (t + bit.phase) % 1; // loops exactly every `duration`
        const rise = ease.outCubic(life);
        // tongues narrow toward the tip and sway; particles shrink and cool as they rise
        const x = centre.x + bit.x * size.width * width * (1 - life) ** 1.4 + Math.sin(bit.wobble + life * TAU) * size.width * 0.035 * life;
        bit.sprite.position.set(x, size.height * 0.84 - rise * size.height * height);
        const s = bit.scale * (size.width / 128) * 0.34 * (1 - life * 0.75);
        bit.sprite.scale.set(s, s * 1.5);
        bit.sprite.tint = ramp(stops, life);
        bit.sprite.blendMode = life > 0.75 ? 'normal' : 'add';
        bit.sprite.alpha = Math.sin(Math.PI * Math.min(1, life * 1.3)) * (life > 0.75 ? 0.35 : 0.5);
      }
      app.render();
    }
  };
}

/** Seamless looping aura (buff, heal, shield): pulsing ring and rising motes. */
export function aura({ core = 0xffffff, color = 0x6cf0a0, edge = 0x1f8a52, motes = 40, seed = 11 } = {}) {
  return {
    async setup() {
      const s = await stage();
      const rng = random(seed);
      const pool = sprite(s.PIXI, s.glow, s.world, { tint: edge });
      pool.position.set(s.centre.x, size.height * 0.72);
      const ring = new s.PIXI.Graphics();
      ring.blendMode = 'add';
      s.world.addChild(ring);
      const bits = Array.from({ length: motes }, () => ({ sprite: sprite(s.PIXI, s.glow, s.world, { tint: rng() < 0.4 ? core : color }), phase: rng(), angle: rng() * TAU, radius: 0.12 + rng() * 0.22, scale: 0.06 + rng() * 0.08 }));
      return { ...s, pool, ring, bits };
    },
    render(time, { app, pool, ring, bits, centre }) {
      const t = time / duration;
      const beat = 0.5 + 0.5 * Math.sin(t * TAU); // one pulse per loop
      pool.scale.set((size.width / 128) * (0.8 + beat * 0.1), (size.width / 128) * 0.26);
      pool.alpha = 0.55 + beat * 0.25;
      ring.clear();
      const y = size.height * 0.72;
      for (let index = 0; index < 2; index += 1) {
        const k = (t + index / 2) % 1;
        ring.ellipse(centre.x, y, size.width * (0.18 + k * 0.2), size.height * (0.05 + k * 0.06)).stroke({ width: 3, color, alpha: (1 - k) * 0.9 });
      }
      for (const bit of bits) {
        const life = (t + bit.phase) % 1;
        const angle = bit.angle + life * 1.5;
        bit.sprite.position.set(centre.x + Math.cos(angle) * size.width * bit.radius, y - life * size.height * 0.5 + Math.sin(angle) * size.height * 0.04);
        bit.sprite.scale.set(bit.scale * (size.width / 128) * (1 - life * 0.5));
        bit.sprite.alpha = Math.sin(Math.PI * life);
      }
      app.render();
    }
  };
}

/** Short impact: star flash, shock ring and fast streaks. */
export function hit({ core = 0xffffff, color = 0xffc23a, edge = 0xff5a1a, streaks = 18, seed = 5 } = {}) {
  return {
    async setup() {
      const s = await stage();
      const rng = random(seed);
      const flash = sprite(s.PIXI, s.glow, s.world, { tint: core });
      const star = new s.PIXI.Graphics();
      star.blendMode = 'add';
      star.position.set(s.centre.x, s.centre.y);
      const shock = new s.PIXI.Graphics();
      shock.blendMode = 'add';
      shock.position.set(s.centre.x, s.centre.y);
      s.world.addChild(shock, star);
      flash.position.set(s.centre.x, s.centre.y);
      const bits = Array.from({ length: streaks }, () => ({ sprite: sprite(s.PIXI, s.streak, s.world, { tint: rng() < 0.5 ? core : color, anchor: [1, 0.5] }), angle: rng() * TAU, speed: 0.25 + rng() * 0.2, scale: 0.2 + rng() * 0.25 }));
      return { ...s, flash, star, shock, bits };
    },
    render(time, { app, flash, star, shock, bits, centre }) {
      const t = time / duration;
      const unit = Math.min(size.width, size.height);
      const pop = ease.window(t, 0, 0.18);
      const fade = 1 - ease.window(t, 0.18, 0.92);
      flash.scale.set((0.4 + ease.outBack(pop) * 0.9) * unit / 256);
      flash.alpha = fade;
      star.clear();
      const arm = unit * (0.1 + ease.outCubic(pop) * 0.3) * fade;
      star.poly([0, -arm, arm * 0.12, -arm * 0.12, arm, 0, arm * 0.12, arm * 0.12, 0, arm, -arm * 0.12, arm * 0.12, -arm, 0, -arm * 0.12, -arm * 0.12]).fill({ color: core, alpha: fade });
      star.rotation = 0.35;
      const k = ease.outCubic(ease.window(t, 0.05, 0.95));
      shock.clear().circle(0, 0, unit * (0.06 + k * 0.36)).stroke({ width: unit * 0.03 * (1 - k), color: edge, alpha: 1 - k });
      for (const bit of bits) {
        const local = ease.window(t, 0.03, 0.85);
        const d = unit * bit.speed * ease.outCubic(local);
        bit.sprite.position.set(centre.x + Math.cos(bit.angle) * d, centre.y + Math.sin(bit.angle) * d);
        bit.sprite.rotation = bit.angle;
        bit.sprite.scale.set(bit.scale * (1.3 - local), bit.scale * 0.8);
        bit.sprite.alpha = local < 1 ? 1 - local : 0;
      }
      app.render();
    }
  };
}
