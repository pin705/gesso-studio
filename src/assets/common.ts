import type { AssetControlState, Paint, Point, SceneNode } from '../types/scene';
import { MATERIALS } from '../primitives/materials';
import { createBrushStroke, createSlash, polygonPoints, seededRandom, smoothPath, starPoints, wavyLine } from '../primitives/path';
import { createParticleNodes } from '../primitives/particles';
import { inkCloudNodes, inkSplashNodes, ornamentalCorner } from '../primitives/ink';

export const VIEW_WIDTH = 720;
export const VIEW_HEIGHT = 480;

export function linear(stops: Array<[number, string, number?]>, x1 = 0, y1 = 0, x2 = 0, y2 = 1): Paint {
  return { kind: 'linear', x1, y1, x2, y2, stops: stops.map(([offset, color, opacity]) => ({ offset, color, opacity })) };
}

export function radial(stops: Array<[number, string, number?]>, cx = 0.5, cy = 0.5, r = 0.7): Paint {
  return { kind: 'radial', cx, cy, r, stops: stops.map(([offset, color, opacity]) => ({ offset, color, opacity })) };
}

export function materialFill(materialId: string, variant: 'base' | 'edge' | 'highlight' | 'innerGlow' | 'glow' | 'accent' = 'base'): Paint {
  const material = MATERIALS[materialId] ?? MATERIALS.jade;
  const colors = {
    base: material.baseColor,
    edge: material.edgeColor,
    highlight: material.highlight,
    innerGlow: material.innerGlow,
    glow: material.glow,
    accent: material.accent
  } as const;
  const color = colors[variant];
  if (variant === 'base') return linear([[0, material.highlight, 0.76], [0.18, color, 0.98], [0.54, material.baseColor, 1], [1, material.edgeColor, 1]], 0.12, 0, 0.82, 1);
  if (variant === 'innerGlow') return radial([[0, material.innerGlow, 0.7], [0.52, material.innerGlow, 0.18], [1, material.innerGlow, 0]], 0.5, 0.42, 0.7);
  if (variant === 'highlight') return linear([[0, '#ffffff', 0.3], [0.34, material.highlight, 0.7], [1, material.highlight, 0]], 0.06, 0, 0.82, 0.78);
  if (variant === 'glow') return radial([[0, material.glow, 0.38], [1, material.glow, 0]], 0.5, 0.5, 0.5);
  return color;
}

export function rarityAccent(rarity: AssetControlState['rarity']): { main: string; pale: string; dark: string } {
  if (rarity === 'common') return { main: '#9ca7a1', pale: '#e0e8df', dark: '#263a38' };
  if (rarity === 'rare') return { main: '#5fa7d8', pale: '#bdeeff', dark: '#163c64' };
  if (rarity === 'epic') return { main: '#bd79e8', pale: '#f0caff', dark: '#3d1d61' };
  return { main: '#e7ae4c', pale: '#fff0b4', dark: '#593510' };
}

export function textNode(
  id: string,
  text: string,
  x: number,
  y: number,
  options: Partial<SceneNode> = {}
): SceneNode {
  return {
    id,
    type: 'text',
    text,
    x,
    y,
    fill: '#e9e0c8',
    fontSize: 14,
    fontFamily: 'Noto Serif SC, Songti SC, Georgia, serif',
    fontWeight: 500,
    letterSpacing: 1.4,
    ...options
  };
}

export function tinyLabel(id: string, text: string, x: number, y: number, color = '#829b98', align: 'start' | 'middle' | 'end' = 'start'): SceneNode {
  return textNode(id, text, x, y, {
    fill: color,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2.2,
    textAnchor: align,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    opacity: 0.85
  });
}

export function artboardBackground(seed: number, tint = '#0b1518'): SceneNode[] {
  return [
    {
      id: 'background-base',
      type: 'rect',
      x: 0,
      y: 0,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      fill: linear([[0, '#1a292b', 1], [0.46, tint, 1], [1, '#080d12', 1]], 0, 0, 1, 1)
    },
    {
      id: 'background-vignette',
      type: 'rect',
      x: 0,
      y: 0,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      fill: radial([[0, '#284b49', 0.28], [0.5, '#112022', 0.04], [1, '#020508', 0.74]], 0.48, 0.44, 0.75),
      effects: ['mist']
    },
    {
      id: 'background-paper',
      type: 'rect',
      x: 0,
      y: 0,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      fill: '#bca77a',
      opacity: 0.075,
      effects: ['paper', 'noise']
    },
    {
      id: 'background-rain',
      type: 'path',
      d: wavyLine(30, 405, 680, 375, 12, 32, seed + 3),
      fill: 'none',
      stroke: '#b8d2c0',
      strokeWidth: 1,
      opacity: 0.13,
      effects: ['mist']
    },
    {
      id: 'background-rain-2',
      type: 'path',
      d: wavyLine(70, 430, 660, 300, 18, 30, seed + 11),
      fill: 'none',
      stroke: '#d2b777',
      strokeWidth: 0.7,
      opacity: 0.12,
      effects: ['mist']
    }
  ];
}

export function addDust(nodes: SceneNode[], seed: number, amount = 22, color = '#e7c888'): void {
  nodes.push(...createParticleNodes('dust', {
    count: amount,
    origin: { x: 360, y: 250 },
    radius: 330,
    seed,
    color,
    accent: '#f4e8c2',
    size: 1.25,
    sizeVariation: 0.7,
    lifetime: 6,
    gravity: -2,
    spread: Math.PI * 2,
    turbulence: 0.8
  }, 0));
}

export function addStarField(nodes: SceneNode[], seed: number, count = 16, color = '#9fe9d6'): void {
  const random = seededRandom(seed);
  for (let index = 0; index < count; index += 1) {
    const x = 40 + random() * 640;
    const y = 40 + random() * 400;
    const size = 0.6 + random() * 1.6;
    nodes.push({
      id: `star-${index}`,
      type: 'circle',
      x,
      y,
      radius: size,
      fill: color,
      opacity: 0.18 + random() * 0.42,
      effects: ['glow']
    });
  }
}

export function addCloud(nodes: SceneNode[], id: string, x: number, y: number, scale: number, seed: number, density = 0.9): void {
  nodes.push(...inkCloudNodes(id, x, y, scale, density, { seed, color: '#9ab5ad', turbulence: 1.3 }));
}

export function addInkSplash(nodes: SceneNode[], id: string, x: number, y: number, radius: number, amount: number, seed: number, color = '#0c151a'): void {
  nodes.push(...inkSplashNodes(id, x, y, radius, amount, { seed, color, roughness: 0.85 }));
}

export function addCorner(nodes: SceneNode[], id: string, x: number, y: number, size: number, rotation: number, color: Paint): void {
  nodes.push(ornamentalCorner(id, x, y, size, rotation, color));
}

export function slashPath(start: Point, end: Point, bend: number, seed: number): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const controlA = { x: start.x + dx * 0.24, y: start.y + dy * 0.24 - bend };
  const controlB = { x: start.x + dx * 0.72, y: start.y + dy * 0.72 - bend * 0.72 };
  return createSlash(start, controlA, controlB, end, seed);
}

export function glowLine(id: string, d: string, color: string, width: number, opacity: number, seed: number): SceneNode[] {
  return [
    {
      id: `${id}-blur`,
      type: 'path',
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: width * 4.2,
      strokeOpacity: opacity * 0.16,
      lineCap: 'round',
      lineJoin: 'round',
      effects: ['soft-glow'],
      seed
    },
    {
      id: `${id}-core`,
      type: 'path',
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: width,
      strokeOpacity: opacity,
      lineCap: 'round',
      lineJoin: 'round',
      effects: ['glow'],
      seed
    }
  ];
}

export function bladeShape(x: number, y: number, length: number, width: number, curve: number, seed: number): SceneNode[] {
  const tip = { x: x + length, y: y - curve };
  const upper = smoothPath([
    { x, y },
    { x: x + length * 0.26, y: y - width * 0.3 - curve * 0.08 },
    { x: x + length * 0.63, y: y - width * 0.45 - curve * 0.42 },
    tip
  ]);
  const lower = smoothPath([
    tip,
    { x: x + length * 0.62, y: y + width * 0.42 - curve * 0.36 },
    { x: x + length * 0.28, y: y + width * 0.34 - curve * 0.1 },
    { x, y }
  ]);
  return [
    {
      id: `blade-${seed}`,
      type: 'path',
      d: `${upper} ${lower.replace(/^M[^C]*/, '')} Z`,
      fill: linear([[0, '#f5f4df', 0.95], [0.36, '#9eafb0', 0.9], [0.54, '#304d55', 1], [1, '#101b25', 1]], 0, 0, 1, 0.4),
      stroke: '#0a151a',
      strokeWidth: 3,
      effects: ['rough', 'shadow']
    },
    {
      id: `blade-highlight-${seed}`,
      type: 'path',
      d: `M ${x + 14} ${y - 2} C ${x + length * 0.32} ${y - width * 0.3}, ${x + length * 0.68} ${y - width * 0.4}, ${x + length - 18} ${y - curve - 4}`,
      fill: 'none',
      stroke: '#f9e9b5',
      strokeWidth: 2,
      opacity: 0.72,
      lineCap: 'round',
      effects: ['glow']
    }
  ];
}

export function starMedallion(x: number, y: number, radius: number, color: Paint, seed: number): SceneNode[] {
  const outer = polygonPoints({ x, y }, radius, 8, Math.PI / 8);
  const inner = polygonPoints({ x, y }, radius * 0.78, 8, Math.PI / 8);
  return [
    { id: `medallion-outer-${seed}`, type: 'polygon', x: 0, y: 0, points: outer, fill: 'none', stroke: color, strokeWidth: 3, effects: ['glow'] },
    { id: `medallion-inner-${seed}`, type: 'polygon', x: 0, y: 0, points: inner, fill: 'none', stroke: color, strokeWidth: 1, opacity: 0.66, dash: '2 7' },
    { id: `medallion-star-${seed}`, type: 'polygon', x: 0, y: 0, points: starPoints({ x, y }, radius * 0.42, radius * 0.17, 8), fill: color, opacity: 0.18, effects: ['glow'] }
  ];
}
