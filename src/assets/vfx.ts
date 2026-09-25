import type { AssetControlState, AssetDefinition, SceneNode } from '../types/scene';
import { createBrushStroke, createEnergyArc, createSlash, polygonPoints, seededRandom, smoothPath, starPoints, wavyLine } from '../primitives/path';
import { createParticleNodes } from '../primitives/particles';
import { addCloud, addDust, addInkSplash, artboardBackground, bladeShape, glowLine, linear, materialFill, radial, rarityAccent, slashPath, starMedallion, textNode, tinyLabel } from './common';
import { evaluateEasing } from '../timeline';

export function buildSwordSlash(controls: AssetControlState, time = 0): SceneNode[] {
  const progress = evaluateEasing('ease-out', Math.min(1, Math.max(0, time / 1.55)));
  const fade = Math.sin(Math.min(1, progress) * Math.PI) ** 0.42;
  const nodes = artboardBackground(controls.seed + 1100, '#100e14');
  const accent = controls.element === 'fire' ? '#ff7848' : controls.element === 'ice' ? '#78e4f1' : controls.element === 'lightning' ? '#c5a0ff' : '#5fe4bc';
  const accentLight = controls.element === 'fire' ? '#ffe19a' : controls.element === 'ice' ? '#e4ffff' : '#fff0b1';
  const main = slashPath({ x: 94, y: 352 }, { x: 632, y: 114 }, 178, controls.seed + 1110);
  const secondary = slashPath({ x: 120, y: 370 }, { x: 610, y: 150 }, 150, controls.seed + 1111);
  const echo = slashPath({ x: 77, y: 326 }, { x: 651, y: 96 }, 197, controls.seed + 1112);
  nodes.push({
    id: 'slash-vignette',
    type: 'ellipse',
    x: 360,
    y: 232,
    width: 640,
    height: 270,
    fill: radial([[0, accent, 0.12], [0.55, '#4d1d3c', 0.08], [1, '#020407', 0]], 0.5, 0.5, 0.5),
    effects: ['soft-glow', 'blur']
  });
  nodes.push(...glowLine('slash-echo', echo, accent, 10, 0.22 * fade, controls.seed + 1113));
  nodes.push(...glowLine('slash-secondary', secondary, accentLight, 4.5, 0.38 * fade, controls.seed + 1114));
  nodes.push({
    id: 'slash-main-blur',
    type: 'path',
    d: main,
    fill: 'none',
    stroke: accent,
    strokeWidth: 22,
    strokeOpacity: 0.28 * fade,
    lineCap: 'round',
    lineJoin: 'round',
    pathLength: 1,
    pathProgress: progress,
    effects: ['soft-glow', 'blur']
  });
  nodes.push({
    id: 'slash-main-core',
    type: 'path',
    d: main,
    fill: 'none',
    stroke: '#fff7d4',
    strokeWidth: 3.3,
    strokeOpacity: 0.94 * fade,
    lineCap: 'round',
    lineJoin: 'round',
    pathLength: 1,
    pathProgress: progress,
    effects: ['glow']
  });
  nodes.push({
    id: 'slash-edge-ink',
    type: 'path',
    d: createBrushStroke([
      { x: 98, y: 357 }, { x: 198, y: 296 }, { x: 302, y: 232 }, { x: 414, y: 196 }, { x: 628, y: 119 }
    ], 8, controls.seed + 1120, controls.roughness),
    fill: 'none',
    stroke: '#0a1117',
    strokeWidth: 3,
    strokeOpacity: 0.72 * fade,
    lineCap: 'round',
    effects: ['ink', 'rough']
  });
  nodes.push({
    id: 'slash-sword',
    type: 'group',
    name: 'Slash origin',
    x: 136,
    y: 315,
    rotation: -35,
    children: [
      ...bladeShape(0, 0, 196, 17, 30, controls.seed + 1121),
      { id: 'slash-hilt', type: 'rounded-rect', x: -7, y: 18, width: 14, height: 52, radius: 5, fill: '#171922', stroke: '#b38346', strokeWidth: 2 },
      { id: 'slash-gem', type: 'circle', x: 0, y: 17, radius: 6, fill: accent, effects: ['glow'] }
    ]
  });
  nodes.push(...createParticleNodes('spark', {
    count: Math.floor(28 + controls.particleCount * 1.4),
    origin: { x: 366, y: 238 },
    radius: 260,
    seed: controls.seed + 1130,
    color: accentLight,
    accent: '#ffffff',
    size: 2.6,
    sizeVariation: 0.9,
    lifetime: 1.25,
    speed: 120,
    spread: Math.PI * 1.25,
    gravity: 36,
    turbulence: 1.1
  }, time));
  nodes.push(...createParticleNodes('ink', {
    count: Math.floor(12 + controls.particleCount * 0.5),
    origin: { x: 376, y: 238 },
    radius: 220,
    seed: controls.seed + 1131,
    color: '#10151c',
    accent: '#65717a',
    size: 3.5,
    lifetime: 1.7,
    speed: 72,
    spread: Math.PI * 1.7,
    gravity: 72,
    turbulence: 0.8
  }, time));
  addInkSplash(nodes, 'slash-splash', 465, 165, 118, 0.54, controls.seed + 1140, '#0b1117');
  addCloud(nodes, 'slash-mist', 390, 340, 180, controls.seed + 1141, 0.6);
  addDust(nodes, controls.seed + 1142, 30, accentLight);
  nodes.push(tinyLabel('slash-top', 'VFX LIBRARY  /  07', 32, 28, '#d38d83'));
  nodes.push(tinyLabel('slash-frame', 'FRAME  ' + String(Math.round(time * 60)).padStart(3, '0'), 688, 28, accentLight, 'end'));
  nodes.push(textNode('slash-title', '斩  ·  断  ·  念', 360, 414, { fill: '#ffe7d1', fontSize: 17, textAnchor: 'middle', letterSpacing: 5, fontWeight: 700 }));
  nodes.push(textNode('slash-subtitle', 'SWORD SLASH  /  FADING STROKE', 360, 435, { fill: '#a7797e', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.1 }));
  return nodes;
}

export function buildInkSmoke(controls: AssetControlState, time = 0): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 1200, '#0a1217');
  const random = seededRandom(controls.seed + 1201);
  const accent = controls.element === 'fire' ? '#d88152' : controls.element === 'ice' ? '#86b6c6' : '#7fc4ad';
  nodes.push({
    id: 'ink-smoke-halo',
    type: 'ellipse',
    x: 360,
    y: 235,
    width: 500,
    height: 260,
    fill: radial([[0, accent, 0.14], [0.6, '#273b3e', 0.1], [1, '#030608', 0]], 0.5, 0.5, 0.5),
    effects: ['blur', 'soft-glow']
  });
  const paths: SceneNode[] = [];
  for (let index = 0; index < 8; index += 1) {
    const offset = (random() - 0.5) * 42;
    const y = 155 + index * 30 + offset;
    paths.push({
      id: `ink-ribbon-${index}`,
      type: 'path',
      d: createEnergyArc({ x: 350 + offset, y: 250 }, 130 + index * 9, -2.9, -0.25, controls.seed + 1210 + index, 28),
      fill: 'none',
      stroke: index % 2 === 0 ? '#101b22' : '#58747a',
      strokeWidth: 20 - index * 1.2,
      strokeOpacity: 0.18 + index * 0.025,
      lineCap: 'round',
      effects: ['mist', 'blur', 'rough']
    });
  }
  nodes.push(...paths);
  addCloud(nodes, 'ink-cloud-main', 350, 245, 175 + controls.intensity * 30, controls.seed + 1220, 1.15 + controls.intensity * 0.2);
  addCloud(nodes, 'ink-cloud-left', 225, 265, 95, controls.seed + 1221, 0.66);
  addCloud(nodes, 'ink-cloud-right', 490, 210, 110, controls.seed + 1222, 0.74);
  nodes.push(...createParticleNodes('dust', {
    count: Math.floor(30 + controls.particleCount * 1.1),
    origin: { x: 360, y: 240 },
    radius: 245,
    seed: controls.seed + 1230,
    color: '#b3c2b5',
    accent: '#e6d3a2',
    size: 2.8,
    lifetime: 4.8,
    speed: 22,
    gravity: 3,
    spread: Math.PI * 2,
    turbulence: 1.5
  }, time));
  addInkSplash(nodes, 'ink-smoke-splash', 360, 290, 150, 0.7, controls.seed + 1240, '#0a1218');
  nodes.push({
    id: 'ink-smoke-glyph',
    type: 'text',
    x: 360,
    y: 258,
    text: '墨',
    textAnchor: 'middle',
    fontSize: 70,
    fontFamily: 'Noto Serif SC, Songti SC, serif',
    fontWeight: 700,
    fill: '#bed0c6',
    opacity: 0.18 + controls.intensity * 0.12,
    effects: ['rough', 'blur']
  });
  nodes.push(tinyLabel('ink-top', 'ATMOSPHERE KIT  /  09', 32, 28, '#88a39b'));
  nodes.push(tinyLabel('ink-state', 'DENSITY  ' + Math.round(controls.intensity * 100) + '%', 688, 28, accent, 'end'));
  nodes.push(textNode('ink-title', '墨  ·  烟  ·  水', 360, 409, { fill: '#c9ddd0', fontSize: 17, textAnchor: 'middle', letterSpacing: 5, fontWeight: 700 }));
  nodes.push(textNode('ink-subtitle', 'INK DIFFUSION  /  TURBULENCE ON', 360, 430, { fill: '#718b85', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.1 }));
  return nodes;
}

export function buildMoonSword(controls: AssetControlState, time = 0): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 1300, '#0b1218');
  const accent = rarityAccent(controls.rarity);
  const frame: SceneNode = {
    id: 'moon-sword-frame',
    type: 'group' as const,
    name: 'Moon sword variation',
    x: 360,
    y: 230,
    children: [
      { id: 'moon-sword-halo', type: 'circle' as const, x: 0, y: 0, radius: 163, fill: radial([[0, '#4abf9c', 0.17], [1, '#4abf9c', 0]], 0.5, 0.5, 0.5), effects: ['soft-glow', 'blur'] as const },
      { id: 'moon-sword-ring', type: 'circle' as const, x: 0, y: 0, radius: 135, fill: 'none', stroke: accent.main, strokeWidth: 2, dash: '3 12', effects: ['glow'] as const },
      ...bladeShape(-116, -24, 250, 29, controls.intensity * 42, controls.seed + 1301),
      { id: 'moon-sword-guard', type: 'path' as const, d: 'M -46 8 C -17 -8 18 -8 48 8 C 28 32 15 39 0 39 C -16 39 -31 30 -46 8 Z', fill: materialFill('gold'), stroke: '#1d160f', strokeWidth: 3, effects: ['glow', 'rough'] },
      { id: 'moon-sword-grip', type: 'rounded-rect' as const, x: -12, y: 36, width: 24, height: 68, radius: 8, fill: '#1a1720', stroke: '#ad8246', strokeWidth: 2 },
      { id: 'moon-sword-pommel', type: 'polygon' as const, x: 0, y: 0, points: polygonPoints({ x: 0, y: 116 }, 19, 6, -Math.PI / 2), fill: '#d0a45b', stroke: '#24170f', strokeWidth: 2, effects: ['glow'] },
      { id: 'moon-sword-gem', type: 'circle' as const, x: 0, y: 20, radius: 9, fill: radial([[0, '#e4fff0', 1], [0.35, '#57d4ac', 1], [1, '#0b5a5e', 1]], 0.3, 0.3, 0.7), stroke: '#e4bd68', strokeWidth: 1.5, effects: ['glow'] },
      { id: 'moon-sword-rune', type: 'polygon' as const, x: 0, y: 0, points: starPoints({ x: 57, y: -50 }, 18, 7, 4), fill: 'none', stroke: '#e1bb68', strokeWidth: 1, opacity: 0.8, effects: ['glow'] }
    ]
  };
  nodes.push(frame);
  nodes.push(...createParticleNodes('spirit', { count: Math.floor(22 + controls.particleCount * 0.5), origin: { x: 360, y: 230 }, radius: 172, seed: controls.seed + 1310, color: '#6fe3ba', accent: '#e2fff1', size: 1.7, lifetime: 3.6, gravity: -5, turbulence: 1.2 }, time));
  addCloud(nodes, 'moon-sword-mist', 360, 350, 185, controls.seed + 1320, 0.46);
  addInkSplash(nodes, 'moon-sword-ink', 360, 330, 140, 0.34, controls.seed + 1321, '#0b1217');
  nodes.push(tinyLabel('moon-top', 'VARIATION MATRIX  /  MOON FAMILY', 32, 28, '#9bc5b4'));
  nodes.push(tinyLabel('moon-seed', 'SEED ' + controls.seed, 688, 28, accent.main, 'end'));
  nodes.push(textNode('moon-title', '月 魄', 360, 409, { fill: '#d3f5e0', fontSize: 18, textAnchor: 'middle', letterSpacing: 6, fontWeight: 700 }));
  nodes.push(textNode('moon-subtitle', 'MOON BLADE  ·  ' + controls.rarity.toUpperCase(), 360, 430, { fill: '#75968a', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.2 }));
  return nodes;
}

export interface SwordVariant {
  id: string;
  blade: 'moon' | 'straight' | 'curved';
  guard: 'jade' | 'gold' | 'iron';
  ornament: 'dragon' | 'cloud' | 'lotus';
  rarity: AssetControlState['rarity'];
}

export const SWORD_VARIANTS: SwordVariant[] = [
  { id: 'moon-jade-dragon', blade: 'moon', guard: 'jade', ornament: 'dragon', rarity: 'legendary' },
  { id: 'moon-gold-cloud', blade: 'moon', guard: 'gold', ornament: 'cloud', rarity: 'epic' },
  { id: 'straight-iron-lotus', blade: 'straight', guard: 'iron', ornament: 'lotus', rarity: 'rare' },
  { id: 'curved-jade-cloud', blade: 'curved', guard: 'jade', ornament: 'cloud', rarity: 'rare' },
  { id: 'curved-gold-dragon', blade: 'curved', guard: 'gold', ornament: 'dragon', rarity: 'epic' },
  { id: 'straight-gold-lotus', blade: 'straight', guard: 'gold', ornament: 'lotus', rarity: 'legendary' }
];

export function buildSwordVariant(variant: SwordVariant, baseControls: AssetControlState, time = 0): AssetDefinition {
  const controls: AssetControlState = {
    ...baseControls,
    material: variant.guard,
    rarity: variant.rarity,
    intensity: variant.blade === 'curved' ? 0.9 : variant.blade === 'straight' ? 0.18 : 0.52,
    label: '月魄'
  };
  const nodes = buildMoonSword(controls, time);
  const color = variant.ornament === 'dragon' ? '#efbb61' : variant.ornament === 'lotus' ? '#d894b4' : '#8de1c1';
  nodes.push({
    id: `variant-ornament-${variant.id}`,
    type: 'text',
    x: 360,
    y: 95,
    text: variant.ornament === 'dragon' ? '龙' : variant.ornament === 'lotus' ? '莲' : '云',
    textAnchor: 'middle',
    fontSize: 17,
    fontFamily: 'Noto Serif SC, Songti SC, serif',
    fill: color,
    opacity: 0.78,
    effects: ['glow']
  });
  return {
    type: 'game-asset',
    id: variant.id,
    name: `${variant.blade} ${variant.guard} sword`,
    category: 'templates',
    width: 720,
    height: 480,
    description: `${variant.ornament} ornament · ${variant.rarity} rarity`,
    nodes,
    parameters: { ...controls, variation: variant },
    tags: ['sword', variant.blade, variant.guard, variant.ornament, variant.rarity],
    seed: controls.seed,
    version: 1
  };
}
