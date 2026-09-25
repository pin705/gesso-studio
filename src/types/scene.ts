export type NodeType =
  | 'group'
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'ellipse'
  | 'path'
  | 'line'
  | 'polygon'
  | 'star'
  | 'arc'
  | 'text'
  | 'particle';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'color-dodge'
  | 'color-burn';

export interface Point {
  x: number;
  y: number;
}

export interface LinearGradient {
  kind: 'linear';
  stops: Array<{ offset: number; color: string; opacity?: number }>;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  units?: 'objectBoundingBox' | 'userSpaceOnUse';
}

export interface RadialGradient {
  kind: 'radial';
  stops: Array<{ offset: number; color: string; opacity?: number }>;
  cx?: number;
  cy?: number;
  r?: number;
  fx?: number;
  fy?: number;
  units?: 'objectBoundingBox' | 'userSpaceOnUse';
}

export type Paint = string | LinearGradient | RadialGradient;

export type EffectName =
  | 'paper'
  | 'ink'
  | 'rough'
  | 'glow'
  | 'soft-glow'
  | 'shadow'
  | 'soft-shadow'
  | 'mist'
  | 'blur'
  | 'inner-bevel'
  | 'gold-shine'
  | 'noise';

export interface SceneNode {
  id: string;
  type: NodeType;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  fill?: Paint;
  stroke?: Paint;
  strokeWidth?: number;
  strokeOpacity?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  dash?: string;
  dashOffset?: number;
  pathLength?: number;
  pathProgress?: number;
  blendMode?: BlendMode;
  mask?: string;
  clipPath?: string;
  effects?: readonly EffectName[];
  d?: string;
  points?: Point[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fontStyle?: string;
  letterSpacing?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  baseline?: string;
  seed?: number;
  material?: string;
  roughness?: number;
  distortion?: number;
  noise?: number;
  textureScale?: number;
  innerGlow?: number;
  children?: SceneNode[];
  particle?: {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    rotation?: number;
    kind?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface AssetDefinition {
  type: 'game-asset';
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  description: string;
  nodes: SceneNode[];
  parameters?: Record<string, unknown>;
  tags?: string[];
  seed: number;
  version: 1;
}

export interface RenderOptions {
  time?: number;
  selectedId?: string | null;
  showSelection?: boolean;
  forExport?: boolean;
  transparent?: boolean;
  title?: string;
}

export type TemplateId =
  | 'jade-button'
  | 'gold-button'
  | 'cultivation-panel'
  | 'skill-icon'
  | 'item-icon'
  | 'legendary-badge'
  | 'sword-slash'
  | 'magic-circle'
  | 'ink-smoke'
  | 'progress-bar'
  | 'moon-sword';

export interface AssetControlState {
  templateId: TemplateId;
  material: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  element: 'fire' | 'ice' | 'lightning' | 'spirit' | 'wind';
  label: string;
  seed: number;
  roughness: number;
  glow: number;
  opacity: number;
  intensity: number;
  particleCount: number;
  speed: number;
}

export const RARITY_COLORS: Record<AssetControlState['rarity'], string> = {
  common: '#9ca7a1',
  rare: '#5fa7d8',
  epic: '#bd79e8',
  legendary: '#e7ae4c'
};
