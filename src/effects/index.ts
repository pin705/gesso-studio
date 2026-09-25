import type { SceneNode } from '../types/scene';
import {
  inkBorderPath,
  inkCloudNodes,
  inkSplashNodes,
  inkStrokeNode,
  type InkOptions
} from '../primitives/ink';
import { createParticleNodes, type ParticleOptions, type ParticlePreset } from '../primitives/particles';
import { createBrushStroke, createEnergyArc, createInkStroke, createSlash } from '../primitives/path';

export { createBrushStroke, createEnergyArc, createInkStroke, createSlash };

export function createGlowStroke(id: string, d: string, color = '#71e5d0', width = 3, opacity = 0.8, seed = 1): SceneNode[] {
  return [
    { id: `${id}-glow`, type: 'path', d, fill: 'none', stroke: color, strokeWidth: width * 3.5, strokeOpacity: opacity * 0.16, lineCap: 'round', effects: ['soft-glow'], seed },
    { id: `${id}-core`, type: 'path', d, fill: 'none', stroke: color, strokeWidth: width, strokeOpacity: opacity, lineCap: 'round', effects: ['glow'], seed }
  ];
}

/** High-level, stable effect API for editor tools and future code generation. */
export function inkStroke(id: string, points: Array<{ x: number; y: number }>, width: number, options: InkOptions = {}): SceneNode {
  return inkStrokeNode(id, points, width, options);
}

export function inkSplash(id: string, x: number, y: number, radius: number, amount: number, options: InkOptions = {}): SceneNode[] {
  return inkSplashNodes(id, x, y, radius, amount, options);
}

export function inkCloud(id: string, x: number, y: number, scale: number, density: number, options: InkOptions = {}): SceneNode[] {
  return inkCloudNodes(id, x, y, scale, density, options);
}

export function inkBorder(x: number, y: number, width: number, height: number, options: InkOptions = {}): string {
  return inkBorderPath(x, y, width, height, options);
}

export function particles(preset: ParticlePreset, options: ParticleOptions = {}): SceneNode[] {
  return createParticleNodes(preset, options);
}

export const EFFECT_REGISTRY = [
  'ink-stroke', 'ink-splash', 'ink-cloud', 'ink-border', 'roughen', 'glow',
  'paper-grain', 'inner-bevel', 'mist', 'particle-field', 'path-progress'
] as const;
