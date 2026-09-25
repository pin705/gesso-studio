import type { Paint } from '../types/scene';

export interface MaterialDefinition {
  id: string;
  label: string;
  baseColor: string;
  edgeColor: string;
  highlight: string;
  innerGlow: string;
  roughness: number;
  textureAmount: number;
  glow: string;
  accent: string;
}

export const MATERIALS: Record<string, MaterialDefinition> = {
  jade: {
    id: 'jade',
    label: 'Jade',
    baseColor: '#1d776c',
    edgeColor: '#092c32',
    highlight: '#b9f0cf',
    innerGlow: '#5ad9ac',
    roughness: 0.34,
    textureAmount: 0.45,
    glow: '#55e1b4',
    accent: '#d5b86a'
  },
  gold: {
    id: 'gold',
    label: 'Gold',
    baseColor: '#9c6725',
    edgeColor: '#38210f',
    highlight: '#ffe6a0',
    innerGlow: '#e7a942',
    roughness: 0.27,
    textureAmount: 0.32,
    glow: '#f1b84e',
    accent: '#fff0b0'
  },
  iron: {
    id: 'iron',
    label: 'Iron',
    baseColor: '#43515b',
    edgeColor: '#10171d',
    highlight: '#c2d0d4',
    innerGlow: '#6e8792',
    roughness: 0.55,
    textureAmount: 0.5,
    glow: '#7a9eaa',
    accent: '#b98a50'
  },
  paper: {
    id: 'paper',
    label: 'Paper',
    baseColor: '#c5aa78',
    edgeColor: '#5a412b',
    highlight: '#f4e2b3',
    innerGlow: '#d7b77a',
    roughness: 0.82,
    textureAmount: 0.9,
    glow: '#e4c17b',
    accent: '#8d5834'
  },
  ink: {
    id: 'ink',
    label: 'Ink',
    baseColor: '#151a22',
    edgeColor: '#05070a',
    highlight: '#87939b',
    innerGlow: '#4a5b67',
    roughness: 0.72,
    textureAmount: 0.8,
    glow: '#6c8490',
    accent: '#b88c55'
  },
  fire: {
    id: 'fire',
    label: 'Fire',
    baseColor: '#a9382a',
    edgeColor: '#3c0c1a',
    highlight: '#ffd27a',
    innerGlow: '#ff6a32',
    roughness: 0.48,
    textureAmount: 0.5,
    glow: '#ff713d',
    accent: '#ffbd52'
  },
  ice: {
    id: 'ice',
    label: 'Ice',
    baseColor: '#397b9b',
    edgeColor: '#102d4a',
    highlight: '#d5fbff',
    innerGlow: '#77e2ff',
    roughness: 0.22,
    textureAmount: 0.35,
    glow: '#67dfff',
    accent: '#b7f6ff'
  },
  lightning: {
    id: 'lightning',
    label: 'Lightning',
    baseColor: '#6854a8',
    edgeColor: '#20153f',
    highlight: '#fff0a3',
    innerGlow: '#d9c6ff',
    roughness: 0.3,
    textureAmount: 0.4,
    glow: '#ae8bff',
    accent: '#ffe58b'
  },
  spirit: {
    id: 'spirit',
    label: 'Spirit Energy',
    baseColor: '#3c8b93',
    edgeColor: '#10363d',
    highlight: '#dcffff',
    innerGlow: '#72e8dc',
    roughness: 0.18,
    textureAmount: 0.28,
    glow: '#7bf4e3',
    accent: '#d0fff0'
  }
};

export function materialPaint(materialId: string, variant: 'base' | 'edge' | 'highlight' | 'innerGlow' | 'glow' | 'accent' = 'base'): Paint {
  const material = MATERIALS[materialId] ?? MATERIALS.jade;
  const colors = {
    base: material.baseColor,
    edge: material.edgeColor,
    highlight: material.highlight,
    innerGlow: material.innerGlow,
    glow: material.glow,
    accent: material.accent
  } as const;
  return colors[variant];
}

export function materialLabel(materialId: string): string {
  return (MATERIALS[materialId] ?? MATERIALS.jade).label;
}
