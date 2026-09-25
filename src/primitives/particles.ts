import type { SceneNode } from '../types/scene';
import { seededRandom } from './path';

export type ParticlePreset = 'spark' | 'dust' | 'ink' | 'fire' | 'spirit' | 'magic' | 'leaf' | 'snow';

export interface ParticleOptions {
  count?: number;
  lifetime?: number;
  speed?: number;
  spread?: number;
  size?: number;
  sizeVariation?: number;
  gravity?: number;
  drag?: number;
  turbulence?: number;
  color?: string;
  accent?: string;
  seed?: number;
  origin?: { x: number; y: number };
  radius?: number;
  angle?: number;
  rotation?: number;
  emissionRate?: number;
}

const PRESETS: Record<ParticlePreset, { color: string; accent: string; gravity: number; size: number; speed: number; spread: number; turbulence: number }> = {
  spark: { color: '#ffd77a', accent: '#fff6c9', gravity: -18, size: 2.2, speed: 48, spread: Math.PI * 0.8, turbulence: 0.4 },
  dust: { color: '#cdbb8b', accent: '#f6e6bd', gravity: 7, size: 2.8, speed: 25, spread: Math.PI * 1.5, turbulence: 0.7 },
  ink: { color: '#111a23', accent: '#526673', gravity: 22, size: 3.6, speed: 36, spread: Math.PI * 1.8, turbulence: 0.5 },
  fire: { color: '#ff743d', accent: '#ffd26e', gravity: -35, size: 4.5, speed: 58, spread: Math.PI * 0.9, turbulence: 0.8 },
  spirit: { color: '#80f2dc', accent: '#e0fff2', gravity: -8, size: 3.2, speed: 35, spread: Math.PI * 1.3, turbulence: 0.9 },
  magic: { color: '#c197ff', accent: '#ffe5a1', gravity: -4, size: 2.5, speed: 42, spread: Math.PI * 1.7, turbulence: 0.65 },
  leaf: { color: '#9aac5d', accent: '#e0cf83', gravity: 14, size: 4.2, speed: 30, spread: Math.PI * 1.2, turbulence: 1.3 },
  snow: { color: '#e5f7ff', accent: '#ffffff', gravity: 18, size: 2.6, speed: 26, spread: Math.PI * 1.8, turbulence: 0.8 }
};

export function particleColor(preset: ParticlePreset, color?: string, accent?: string): { color: string; accent: string } {
  const values = PRESETS[preset] ?? PRESETS.spark;
  return { color: color ?? values.color, accent: accent ?? values.accent };
}

export function createParticleNodes(
  preset: ParticlePreset,
  options: ParticleOptions = {},
  time = 0
): SceneNode[] {
  const count = Math.max(0, Math.floor(options.count ?? 24));
  const random = seededRandom(options.seed ?? 17);
  const defaults = PRESETS[preset] ?? PRESETS.spark;
  const origin = options.origin ?? { x: 360, y: 240 };
  const radius = options.radius ?? 100;
  const baseAngle = options.angle ?? -Math.PI / 2;
  const spread = options.spread ?? defaults.spread;
  const speed = options.speed ?? defaults.speed;
  const lifetime = options.lifetime ?? 1.8;
  const gravity = options.gravity ?? defaults.gravity;
  const drag = options.drag ?? 0.3;
  const size = options.size ?? defaults.size;
  const sizeVariation = options.sizeVariation ?? 0.65;
  const turbulence = options.turbulence ?? defaults.turbulence;
  const colors = particleColor(preset, options.color, options.accent);
  const nodes: SceneNode[] = [];

  for (let index = 0; index < count; index += 1) {
    const phase = random();
    const angle = baseAngle + (random() - 0.5) * spread;
    const velocity = speed * (0.45 + random() * 0.8);
    const radial = radius * (0.3 + random() * 0.75);
    const age = ((time / lifetime) + phase) % 1;
    const distance = velocity * age * (1 - drag * age * 0.36);
    const turbulenceOffset = Math.sin(age * Math.PI * 2 + phase * 9) * turbulence * 10 * age;
    const x = origin.x + Math.cos(angle) * distance + Math.cos(angle + Math.PI / 2) * turbulenceOffset;
    const y = origin.y + Math.sin(angle) * distance + gravity * age * age * 0.22 + Math.sin(phase * 12) * turbulence * 4;
    const fade = Math.sin(Math.min(1, age) * Math.PI) ** 0.8;
    const particleSize = Math.max(0.35, size * (1 - sizeVariation / 2 + random() * sizeVariation));
    nodes.push({
      id: `${preset}-${index}-${Math.round(phase * 1000)}`,
      type: 'particle',
      name: `${preset} particle`,
      x,
      y,
      opacity: fade,
      rotation: (options.rotation ?? 0) + age * (random() - 0.5) * 4,
      fill: random() > 0.68 ? colors.accent : colors.color,
      effects: preset === 'fire' || preset === 'spirit' || preset === 'magic' ? ['glow'] : [],
      particle: {
        x,
        y,
        size: particleSize,
        color: random() > 0.68 ? colors.accent : colors.color,
        opacity: fade,
        kind: preset
      },
      metadata: { radial, phase, velocity, age }
    });
  }
  return nodes;
}

export function particlePresetList(): Array<{ id: ParticlePreset; label: string; color: string }> {
  return (Object.keys(PRESETS) as ParticlePreset[]).map((id) => ({
    id,
    label: id[0].toUpperCase() + id.slice(1),
    color: PRESETS[id].color
  }));
}
