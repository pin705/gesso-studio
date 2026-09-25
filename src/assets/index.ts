import type { AssetControlState, AssetDefinition, TemplateId } from '../types/scene';
import { buildGoldButton, buildJadeButton } from './buttons';
import { buildCultivationPanel } from './panel';
import { buildItemIcon, buildLegendaryBadge, buildMagicCircle, buildProgressBar, buildSkillIcon } from './icons';
import { buildInkSmoke, buildMoonSword, buildSwordSlash } from './vfx';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  shortName: string;
  category: 'assets' | 'vfx' | 'templates';
  description: string;
  accent: string;
  glyph: string;
}

export const TEMPLATE_META: TemplateMeta[] = [
  { id: 'jade-button', name: 'Jade breakthrough button', shortName: 'Jade button', category: 'assets', description: 'Carved jade · ink edge · inner bevel', accent: '#5ee0b2', glyph: ' jade ' },
  { id: 'cultivation-panel', name: 'Cultivation status panel', shortName: 'Cultivation panel', category: 'assets', description: 'Parchment · ink frame · stat hierarchy', accent: '#d0ae68', glyph: 'panel' },
  { id: 'skill-icon', name: 'Elemental skill icon', shortName: 'Skill icon', category: 'assets', description: 'Elemental sigil · rarity frame', accent: '#79d8ef', glyph: 'skill' },
  { id: 'item-icon', name: 'Moon spirit blade', shortName: 'Item icon', category: 'assets', description: 'Relic · blade · jade material', accent: '#75d6ac', glyph: 'item' },
  { id: 'legendary-badge', name: 'Legendary fate badge', shortName: 'Legendary badge', category: 'assets', description: 'Gold medallion · rank insignia', accent: '#e5ae4f', glyph: 'badge' },
  { id: 'sword-slash', name: 'Sword slash VFX', shortName: 'Sword slash', category: 'vfx', description: 'Layered ink · particles · path progress', accent: '#f08261', glyph: 'slash' },
  { id: 'magic-circle', name: 'Elemental magic circle', shortName: 'Magic circle', category: 'vfx', description: 'Formation · glyph · orbiting motes', accent: '#ae91f3', glyph: 'circle' },
  { id: 'ink-smoke', name: 'Ink smoke diffusion', shortName: 'Ink smoke', category: 'vfx', description: 'Turbulence · opacity · water bleed', accent: '#8eb7ad', glyph: 'smoke' },
  { id: 'progress-bar', name: 'Spirit root progress', shortName: 'Progress bar', category: 'templates', description: 'HUD component · inner glow · state', accent: '#b6d989', glyph: 'progress' },
  { id: 'gold-button', name: 'Golden premium button', shortName: 'Gold button', category: 'templates', description: 'Premium metal · gold highlight', accent: '#e7b45b', glyph: 'gold' },
  { id: 'moon-sword', name: 'Moon sword variation', shortName: 'Moon sword', category: 'templates', description: 'One recipe · six generated variants', accent: '#74dbb5', glyph: 'sword' }
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATE_META.map((template) => [template.id, template])) as Record<TemplateId, TemplateMeta>;

export const DEFAULT_CONTROLS: AssetControlState = {
  templateId: 'jade-button',
  material: 'jade',
  rarity: 'epic',
  element: 'spirit',
  label: '突破',
  seed: 4817,
  roughness: 0.42,
  glow: 0.58,
  opacity: 1,
  intensity: 0.62,
  particleCount: 42,
  speed: 1
};

function applyOpacity(nodes: import('../types/scene').SceneNode[], factor: number): import('../types/scene').SceneNode[] {
  if (factor >= 0.999) return nodes;
  return nodes.map((node) => ({
    ...node,
    opacity: (node.opacity ?? 1) * factor,
    children: node.children ? applyOpacity(node.children, factor) : node.children
  }));
}

export function buildAsset(templateId: TemplateId, controls: AssetControlState, time = 0): AssetDefinition {
  const template = TEMPLATE_BY_ID[templateId];
  let nodes;
  switch (templateId) {
    case 'jade-button':
      nodes = buildJadeButton(controls, time);
      break;
    case 'gold-button':
      nodes = buildGoldButton(controls);
      break;
    case 'cultivation-panel':
      nodes = buildCultivationPanel(controls);
      break;
    case 'skill-icon':
      nodes = buildSkillIcon(controls, time);
      break;
    case 'item-icon':
      nodes = buildItemIcon(controls, time);
      break;
    case 'legendary-badge':
      nodes = buildLegendaryBadge(controls, time);
      break;
    case 'sword-slash':
      nodes = buildSwordSlash(controls, time);
      break;
    case 'magic-circle':
      nodes = buildMagicCircle(controls, time);
      break;
    case 'ink-smoke':
      nodes = buildInkSmoke(controls, time);
      break;
    case 'progress-bar':
      nodes = buildProgressBar(controls);
      break;
    case 'moon-sword':
      nodes = buildMoonSword(controls, time);
      break;
    default:
      nodes = buildJadeButton(controls, time);
  }
  nodes = applyOpacity(nodes, controls.opacity);
  return {
    type: 'game-asset',
    id: templateId,
    name: template?.name ?? 'Untitled game asset',
    category: template?.category ?? 'templates',
    width: 720,
    height: 480,
    description: template?.description ?? '',
    nodes,
    parameters: {
      material: controls.material,
      rarity: controls.rarity,
      element: controls.element,
      label: controls.label,
      roughness: controls.roughness,
      glow: controls.glow,
      opacity: controls.opacity,
      intensity: controls.intensity,
      particleCount: controls.particleCount,
      speed: controls.speed
    },
    tags: [templateId, controls.material, controls.rarity, 'procedural', 'deterministic'],
    seed: controls.seed,
    version: 1
  };
}

export function buildTemplateFromControls(controls: AssetControlState, time = 0): AssetDefinition {
  return buildAsset(controls.templateId, controls, time);
}

export function templateGroups(): Record<TemplateMeta['category'], TemplateMeta[]> {
  return {
    assets: TEMPLATE_META.filter((template) => template.category === 'assets'),
    vfx: TEMPLATE_META.filter((template) => template.category === 'vfx'),
    templates: TEMPLATE_META.filter((template) => template.category === 'templates')
  };
}
