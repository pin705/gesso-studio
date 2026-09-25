import type { AssetControlState, AssetDefinition, TemplateId } from '../types/scene';
import { DEFAULT_CONTROLS, buildAsset } from '../assets';

/**
 * A constrained, model-facing description of an asset request.
 * This is deliberately smaller than AssetDefinition: an AI can propose
 * intent, while the studio remains responsible for generating valid nodes.
 */
export interface AssetIntent {
  asset: TemplateId;
  material?: AssetControlState['material'];
  rarity?: AssetControlState['rarity'];
  element?: AssetControlState['element'];
  label?: string;
  seed?: number;
  roughness?: number;
  glow?: number;
  intensity?: number;
  particleCount?: number;
  effects?: string[];
}

const templates: TemplateId[] = [
  'jade-button', 'gold-button', 'cultivation-panel', 'skill-icon', 'item-icon',
  'legendary-badge', 'sword-slash', 'magic-circle', 'ink-smoke', 'progress-bar', 'moon-sword'
];
const materials = ['jade', 'gold', 'iron', 'paper', 'ink', 'fire', 'ice', 'lightning', 'spirit'];
const rarities: AssetControlState['rarity'][] = ['common', 'rare', 'epic', 'legendary'];
const elements: AssetControlState['element'][] = ['fire', 'ice', 'lightning', 'spirit', 'wind'];

function pick<T>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeAssetIntent(input: Partial<AssetIntent>): AssetIntent {
  return {
    asset: pick(input.asset, templates, 'jade-button'),
    material: pick(input.material, materials, DEFAULT_CONTROLS.material),
    rarity: pick(input.rarity, rarities, DEFAULT_CONTROLS.rarity),
    element: pick(input.element, elements, DEFAULT_CONTROLS.element),
    label: typeof input.label === 'string' ? input.label.slice(0, 24) : DEFAULT_CONTROLS.label,
    seed: Number.isFinite(input.seed) ? Math.max(1, Math.floor(input.seed as number)) : DEFAULT_CONTROLS.seed,
    roughness: Number.isFinite(input.roughness) ? Math.min(1, Math.max(0, input.roughness as number)) : DEFAULT_CONTROLS.roughness,
    glow: Number.isFinite(input.glow) ? Math.min(1, Math.max(0, input.glow as number)) : DEFAULT_CONTROLS.glow,
    intensity: Number.isFinite(input.intensity) ? Math.min(1, Math.max(0, input.intensity as number)) : DEFAULT_CONTROLS.intensity,
    particleCount: Number.isFinite(input.particleCount) ? Math.min(120, Math.max(8, Math.floor(input.particleCount as number))) : DEFAULT_CONTROLS.particleCount,
    effects: Array.isArray(input.effects) ? input.effects.filter((effect): effect is string => typeof effect === 'string').slice(0, 12) : []
  };
}

export function intentToControls(intent: Partial<AssetIntent>, base: AssetControlState = DEFAULT_CONTROLS): AssetControlState {
  const normalized = normalizeAssetIntent({ ...base, ...intent, asset: intent.asset ?? base.templateId });
  return {
    ...base,
    templateId: normalized.asset,
    material: normalized.material ?? base.material,
    rarity: normalized.rarity ?? base.rarity,
    element: normalized.element ?? base.element,
    label: normalized.label ?? base.label,
    seed: normalized.seed ?? base.seed,
    roughness: normalized.roughness ?? base.roughness,
    glow: normalized.glow ?? base.glow,
    intensity: normalized.intensity ?? base.intensity,
    particleCount: normalized.particleCount ?? base.particleCount
  };
}

/** Future LLM/tool boundary: validate intent, then reuse the normal generator. */
export function assetFromIntent(intent: Partial<AssetIntent>, time = 0): AssetDefinition {
  const controls = intentToControls(intent);
  return buildAsset(controls.templateId, controls, time);
}
