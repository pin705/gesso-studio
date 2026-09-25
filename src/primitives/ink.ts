import type { Paint, Point, SceneNode } from '../types/scene';
import { createBrushStroke, createEnergyArc, createInkStroke, polygonPoints, seededRandom, smoothPath, starPoints, wavyLine } from './path';
import { createParticleNodes } from './particles';

export interface InkOptions {
  seed?: number;
  roughness?: number;
  bleed?: number;
  opacity?: number;
  color?: string;
  accent?: string;
}

export function inkStrokeNode(
  id: string,
  points: Point[],
  width: number,
  options: InkOptions = {}
): SceneNode {
  const seed = options.seed ?? 7;
  return {
    id,
    type: 'path',
    name: 'Ink stroke',
    d: createInkStroke(points, width, seed, options.roughness ?? 0.76),
    fill: options.color ?? '#121a21',
    opacity: options.opacity ?? 0.92,
    effects: ['ink', 'rough'],
    seed,
    roughness: options.roughness ?? 0.76,
    material: 'ink'
  };
}

export function inkSplashNodes(
  id: string,
  x: number,
  y: number,
  radius: number,
  amount: number,
  options: InkOptions = {}
): SceneNode[] {
  const random = seededRandom(options.seed ?? 91);
  const nodes: SceneNode[] = [];
  const count = Math.max(3, Math.floor(amount * 11));
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = radius * (0.12 + random() * 0.85);
    const size = radius * (0.025 + random() * 0.12) * (0.55 + amount * 0.45);
    nodes.push({
      id: `${id}-drop-${index}`,
      type: 'ellipse',
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      width: size,
      height: size * (0.65 + random() * 0.6),
      rotation: angle,
      fill: options.color ?? '#111820',
      opacity: (options.opacity ?? 0.86) * (0.28 + random() * 0.58),
      effects: ['ink', 'rough'],
      seed: options.seed ?? 91,
      material: 'ink'
    });
  }
  const fleckCount = Math.max(4, Math.floor(amount * 16));
  for (let index = 0; index < fleckCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = radius * (0.65 + random() * 0.62);
    const size = 0.8 + random() * 2.1;
    nodes.push({
      id: `${id}-fleck-${index}`,
      type: 'circle',
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance * 0.72,
      radius: size,
      fill: options.color ?? '#111820',
      opacity: (options.opacity ?? 0.8) * (0.2 + random() * 0.5),
      effects: ['ink'],
      seed: options.seed ?? 91,
      material: 'ink'
    });
  }
  return nodes;
}

export function inkCloudNodes(
  id: string,
  x: number,
  y: number,
  scale: number,
  density: number,
  options: InkOptions & { turbulence?: number } = {}
): SceneNode[] {
  const random = seededRandom(options.seed ?? 44);
  const nodes: SceneNode[] = [];
  const count = Math.max(4, Math.floor(density * 13));
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = scale * (random() * 0.72);
    const width = scale * (0.2 + random() * 0.48);
    const height = scale * (0.12 + random() * 0.3);
    nodes.push({
      id: `${id}-cloud-${index}`,
      type: 'ellipse',
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance * 0.54,
      width,
      height,
      rotation: random() * 40 - 20,
      fill: {
        kind: 'radial',
        stops: [
          { offset: 0, color: options.color ?? '#68777c', opacity: 0.22 },
          { offset: 0.7, color: options.color ?? '#68777c', opacity: 0.08 },
          { offset: 1, color: options.color ?? '#68777c', opacity: 0 }
        ]
      },
      opacity: options.opacity ?? 0.8,
      effects: ['mist', 'blur'],
      seed: options.seed ?? 44,
      material: 'ink'
    });
  }
  nodes.push(...createParticleNodes('dust', {
    count: Math.floor(density * 17),
    origin: { x, y },
    radius: scale * 1.3,
    seed: (options.seed ?? 44) + 5,
    color: options.color ?? '#c7b88d',
    accent: options.accent ?? '#f0dfad',
    size: 1.8,
    turbulence: options.turbulence ?? 1.2,
    lifetime: 3.6
  }, 0));
  return nodes;
}

export function inkBorderPath(
  x: number,
  y: number,
  width: number,
  height: number,
  options: InkOptions = {}
): string {
  const inset = (options.bleed ?? 1.6) * 1.4;
  const points: Point[] = [
    { x: x + inset + (options.seed ?? 1) % 3, y: y + inset },
    { x: x + width * 0.33, y: y + inset * 0.7 },
    { x: x + width * 0.66, y: y + inset * 1.3 },
    { x: x + width - inset, y: y + inset },
    { x: x + width - inset * 0.8, y: y + height * 0.35 },
    { x: x + width - inset, y: y + height - inset },
    { x: x + width * 0.68, y: y + height - inset * 0.75 },
    { x: x + width * 0.34, y: y + height - inset * 1.2 },
    { x: x + inset, y: y + height - inset }
  ];
  return createBrushStroke(points, options.roughness ? 1.5 + options.roughness : 2.2, options.seed ?? 8, options.roughness ?? 0.8);
}

export function ornamentalCorner(
  id: string,
  x: number,
  y: number,
  size: number,
  rotation = 0,
  color: Paint = '#c7a65a'
): SceneNode {
  return {
    id,
    type: 'group',
    x,
    y,
    rotation,
    children: [
      {
        id: `${id}-a`,
        type: 'path',
        d: `M 0 ${size} C ${size * 0.08} ${size * 0.48}, ${size * 0.26} ${size * 0.1}, ${size} 0`,
        fill: 'none',
        stroke: color,
        strokeWidth: 2.2,
        lineCap: 'round',
        effects: ['gold-shine']
      },
      {
        id: `${id}-b`,
        type: 'path',
        d: `M ${size * 0.18} ${size * 0.78} C ${size * 0.4} ${size * 0.7}, ${size * 0.7} ${size * 0.4}, ${size * 0.78} ${size * 0.18}`,
        fill: 'none',
        stroke: color,
        strokeWidth: 1,
        opacity: 0.72,
        lineCap: 'round'
      },
      {
        id: `${id}-dot`,
        type: 'circle',
        x: size * 0.15,
        y: size * 0.15,
        radius: 2.5,
        fill: color,
        effects: ['glow']
      }
    ]
  };
}

export function magicCircleNodes(
  id: string,
  x: number,
  y: number,
  radius: number,
  seed = 1,
  color: Paint = '#b898ef'
): SceneNode[] {
  const random = seededRandom(seed);
  const nodes: SceneNode[] = [
    {
      id: `${id}-outer`,
      type: 'circle',
      x,
      y,
      radius,
      fill: 'none',
      stroke: color,
      strokeWidth: 1.3,
      opacity: 0.68,
      dash: '2 10',
      effects: ['glow', 'rough']
    },
    {
      id: `${id}-inner`,
      type: 'circle',
      x,
      y,
      radius: radius * 0.76,
      fill: 'none',
      stroke: color,
      strokeWidth: 0.8,
      opacity: 0.55,
      dash: '1 8'
    }
  ];
  const glyphs: SceneNode[] = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    const point = { x: x + Math.cos(angle) * radius * 0.87, y: y + Math.sin(angle) * radius * 0.87 };
    return {
      id: `${id}-glyph-${index}`,
      type: 'path',
      d: `M ${point.x - 3} ${point.y} L ${point.x + 3} ${point.y} M ${point.x} ${point.y - 3} L ${point.x} ${point.y + 3}`,
      stroke: color,
      strokeWidth: 1,
      opacity: 0.56 + random() * 0.3,
      lineCap: 'round' as const
    };
  });
  nodes.push(...glyphs);
  nodes.push({
    id: `${id}-star`,
    type: 'polygon',
    x,
    y,
    points: starPoints({ x, y }, radius * 0.43, radius * 0.17, 8, -Math.PI / 2),
    fill: 'none',
    stroke: color,
    strokeWidth: 1,
    opacity: 0.65,
    effects: ['glow']
  });
  nodes.push({
    id: `${id}-constellation`,
    type: 'path',
    d: createEnergyArc({ x, y }, radius * 0.55, 0.3, 4.9, seed + 3, 30),
    fill: 'none',
    stroke: color,
    strokeWidth: 0.9,
    opacity: 0.48,
    effects: ['glow']
  });
  return nodes;
}

export function createInkTexturePath(
  x: number,
  y: number,
  width: number,
  height: number,
  seed = 2
): string {
  return wavyLine(x, y, x + width, y + height, Math.max(3, height * 0.08), 20, seed);
}
