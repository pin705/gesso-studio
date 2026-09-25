import type { AssetControlState, AssetDefinition, SceneNode } from '../types/scene';
import { DEFAULT_CONTROLS, buildAsset } from './index';
import { createParticleNodes, type ParticleOptions, type ParticlePreset } from '../primitives/particles';
import { MATERIALS } from '../primitives/materials';

export type ComponentOptions = Partial<Omit<AssetControlState, 'templateId'>> & { templateId?: AssetControlState['templateId'] };

function controls(templateId: AssetControlState['templateId'], options: ComponentOptions = {}): AssetControlState {
  const { templateId: _ignored, ...rest } = options;
  return { ...DEFAULT_CONTROLS, ...rest, templateId };
}

/** Public component API used by the editor and future code-generation tools. */
export function GameButton(options: ComponentOptions = {}): AssetDefinition {
  const templateId = options.material === 'gold' ? 'gold-button' : 'jade-button';
  return buildAsset(templateId, controls(templateId, options));
}

export function Panel(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('cultivation-panel', controls('cultivation-panel', options));
}

export function SkillIcon(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('skill-icon', controls('skill-icon', options));
}

export const Badge = LegendaryBadge;

export function Frame(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('magic-circle', controls('magic-circle', options));
}

export function Divider(options: ComponentOptions = {}): AssetDefinition {
  const state = controls('progress-bar', options);
  const material = MATERIALS[state.material] ?? MATERIALS.jade;
  const nodes: SceneNode[] = [
    { id: 'divider-line', type: 'line', x: 34, y: 60, x2: 686, y2: 60, stroke: material.accent, strokeWidth: 2, strokeOpacity: 0.8, effects: ['glow'] },
    { id: 'divider-center', type: 'polygon', x: 0, y: 0, points: [{ x: 352, y: 51 }, { x: 360, y: 60 }, { x: 368, y: 51 }, { x: 360, y: 69 }], fill: material.highlight, effects: ['glow'] },
    { id: 'divider-rule', type: 'line', x: 34, y: 66, x2: 686, y2: 66, stroke: material.edgeColor, strokeWidth: 1, opacity: 0.65 }
  ];
  return { type: 'game-asset', id: 'divider', name: 'Ornamental divider', category: 'templates', width: 720, height: 120, description: 'Reusable ornamental rule', nodes, seed: state.seed, version: 1 };
}

export function Title(options: ComponentOptions = {}): AssetDefinition {
  const state = controls('jade-button', options);
  return {
    type: 'game-asset', id: 'title', name: 'Section title', category: 'templates', width: 720, height: 160,
    description: 'Reusable title lockup', seed: state.seed, version: 1,
    nodes: [
      { id: 'title-rule', type: 'line', x: 120, y: 92, x2: 600, y2: 92, stroke: MATERIALS[state.material]?.accent ?? '#c9a45b', strokeWidth: 1, opacity: 0.7 },
      { id: 'title-text', type: 'text', x: 360, y: 82, text: state.label, textAnchor: 'middle', fontSize: 30, fontFamily: 'Noto Serif SC, Songti SC, serif', fontWeight: 700, letterSpacing: 7, fill: '#eadfc2', effects: ['glow'] }
    ]
  };
}

export function ItemIcon(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('item-icon', controls('item-icon', options));
}

export function LegendaryBadge(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('legendary-badge', controls('legendary-badge', options));
}

export function Sword(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('moon-sword', controls('moon-sword', options));
}

export function Slash(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('sword-slash', controls('sword-slash', options));
}

export function MagicCircle(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('magic-circle', controls('magic-circle', options));
}

export function InkCloud(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('ink-smoke', controls('ink-smoke', options));
}

export function ProgressBar(options: ComponentOptions = {}): AssetDefinition {
  return buildAsset('progress-bar', controls('progress-bar', options));
}

export function ParticleField(preset: ParticlePreset, options: ParticleOptions = {}) {
  return createParticleNodes(preset, { seed: 1, ...options });
}

export const ParticleEffect = ParticleField;

export const COMPONENT_REGISTRY = [
  'GameButton', 'Panel', 'Badge', 'Frame', 'SkillIcon', 'ItemIcon', 'ProgressBar',
  'Divider', 'Title', 'Sword', 'Slash', 'ParticleEffect', 'InkCloud'
] as const;
