import type { AssetControlState, Paint, SceneNode } from '../types/scene';
import { createBrushStroke, polygonPoints, seededRandom, smoothPath, starPoints, wavyLine } from '../primitives/path';
import { createParticleNodes } from '../primitives/particles';
import { addCloud, addCorner, addDust, addInkSplash, artboardBackground, bladeShape, glowLine, linear, materialFill, radial, rarityAccent, starMedallion, textNode, tinyLabel } from './common';
import { magicCircleNodes } from '../primitives/ink';

function elementPalette(element: AssetControlState['element']): { main: string; light: string; dark: string; symbol: string } {
  if (element === 'fire') return { main: '#e9653b', light: '#ffd274', dark: '#611e27', symbol: '火' };
  if (element === 'ice') return { main: '#62cfe0', light: '#d8ffff', dark: '#163a59', symbol: '氷' };
  if (element === 'lightning') return { main: '#b58bff', light: '#fff0a0', dark: '#33235c', symbol: '雷' };
  if (element === 'wind') return { main: '#9ccfbb', light: '#e5fff1', dark: '#234c4b', symbol: '风' };
  return { main: '#5ed9bb', light: '#d7fff0', dark: '#174c55', symbol: '灵' };
}

export function buildSkillIcon(controls: AssetControlState, time = 0): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 600, '#0c111a');
  const colors = elementPalette(controls.element);
  const accent = rarityAccent(controls.rarity);
  const center = { x: 360, y: 235 };
  const frameRadius = controls.rarity === 'legendary' ? 132 : 126;
  const frame: SceneNode = {
    id: 'skill-icon-frame',
    type: 'group' as const,
    name: 'Skill icon frame',
    x: center.x,
    y: center.y,
    children: [
      { id: 'skill-aura', type: 'circle' as const, x: 0, y: 0, radius: frameRadius + 28, fill: radial([[0, colors.main, 0.2], [0.6, colors.main, 0.07], [1, colors.main, 0]], 0.5, 0.5, 0.5), effects: ['soft-glow', 'blur'] as const },
      { id: 'skill-shadow', type: 'circle' as const, x: 0, y: 0, radius: frameRadius + 9, fill: '#050811', opacity: 0.88, effects: ['shadow'] as const },
      { id: 'skill-outer-ring', type: 'circle' as const, x: 0, y: 0, radius: frameRadius, fill: 'none', stroke: accent.main, strokeWidth: controls.rarity === 'legendary' ? 6 : 4, effects: ['glow', 'rough'] as const },
      { id: 'skill-outer-inner', type: 'circle' as const, x: 0, y: 0, radius: frameRadius - 12, fill: 'none', stroke: colors.light, strokeWidth: 1, opacity: 0.55, dash: '2 9' },
      { id: 'skill-inner-ring', type: 'circle' as const, x: 0, y: 0, radius: frameRadius - 28, fill: radial([[0, colors.dark, 0.95], [0.7, '#0a1720', 0.98], [1, '#020509', 1]], 0.44, 0.38, 0.7), stroke: colors.main, strokeWidth: 2, effects: ['rough'] as const },
      { id: 'skill-core-glow', type: 'circle' as const, x: 0, y: 0, radius: 78, fill: radial([[0, colors.light, 0.4 + controls.glow * 0.2], [0.45, colors.main, 0.18], [1, colors.main, 0]], 0.5, 0.5, 0.5), effects: ['glow', 'blur'] as const },
      { id: 'skill-sigil', type: 'polygon' as const, x: 0, y: 0, points: starPoints({ x: 0, y: 0 }, 68, 27, 8, -Math.PI / 2), fill: 'none', stroke: colors.main, strokeWidth: 2, opacity: 0.74, effects: ['glow'] as const },
      { id: 'skill-sigil-inner', type: 'polygon' as const, x: 0, y: 0, points: starPoints({ x: 0, y: 0 }, 46, 19, 8, -Math.PI / 2), fill: colors.main, opacity: 0.12, stroke: colors.light, strokeWidth: 0.8, effects: ['glow'] as const },
      { id: 'skill-glyph', type: 'text' as const, x: 0, y: 20, text: colors.symbol, textAnchor: 'middle', fontSize: 68, fontFamily: 'Noto Serif SC, Songti SC, serif', fontWeight: 700, fill: colors.light, stroke: colors.dark, strokeWidth: 2, effects: ['glow', 'rough'] as const },
      { id: 'skill-glyph-shadow', type: 'text' as const, x: 0, y: 23, text: colors.symbol, textAnchor: 'middle', fontSize: 68, fontFamily: 'Noto Serif SC, Songti SC, serif', fontWeight: 700, fill: colors.main, opacity: 0.26, effects: ['soft-glow'] as const },
      ...Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        const px = Math.cos(angle) * (frameRadius + 17);
        const py = Math.sin(angle) * (frameRadius + 17);
        return { id: `skill-rune-${index}`, type: 'circle' as const, x: px, y: py, radius: 2.6, fill: colors.light, opacity: 0.74, effects: ['glow'] as const };
      })
    ]
  };
  nodes.push(frame);
  nodes.push(...magicCircleNodes('skill-magic', center.x, center.y, 161, controls.seed + 33, colors.main));
  nodes.push(...createParticleNodes('spirit', {
    count: Math.floor(16 + controls.particleCount * 0.45),
    origin: center,
    radius: 175,
    seed: controls.seed + 602,
    color: colors.main,
    accent: colors.light,
    size: 1.8,
    lifetime: 2.8,
    turbulence: 1.2,
    gravity: -7
  }, time));
  nodes.push(...createParticleNodes('spark', {
    count: Math.floor(8 + controls.glow * 15),
    origin: center,
    radius: 135,
    seed: controls.seed + 604,
    color: colors.light,
    accent: '#ffffff',
    size: 1.35,
    lifetime: 1.8,
    spread: Math.PI * 2,
    gravity: 4
  }, time));
  addCloud(nodes, 'skill-mist', 360, 362, 170, controls.seed + 609, 0.42);
  addDust(nodes, controls.seed + 611, 25, colors.light);
  nodes.push(tinyLabel('skill-top', 'ELEMENTAL ARTIFACT  /  04', 32, 28, '#9b9bb8'));
  nodes.push(tinyLabel('skill-rarity', controls.rarity.toUpperCase(), 688, 28, accent.main, 'end'));
  nodes.push(textNode('skill-title', '灵 识', 360, 409, { fill: '#e6e3ff', fontSize: 18, textAnchor: 'middle', letterSpacing: 6, fontWeight: 700 }));
  nodes.push(textNode('skill-subtitle', 'SPIRIT SENSE  /  RANK 04', 360, 429, { fill: '#777b9c', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.2 }));
  addCorner(nodes, 'skill-corner-tl', 53, 52, 18, 0, colors.main);
  addCorner(nodes, 'skill-corner-br', 667, 418, 18, 180, colors.main);
  return nodes;
}

export function buildItemIcon(controls: AssetControlState, time = 0): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 700, '#0d1417');
  const accent = rarityAccent(controls.rarity);
  const frame: SceneNode = {
    id: 'item-icon-frame',
    type: 'group' as const,
    name: 'Moon spirit blade',
    x: 360,
    y: 235,
    children: [
      { id: 'item-icon-halo', type: 'circle' as const, x: 0, y: 0, radius: 136, fill: radial([[0, '#4dc9a1', 0.18], [1, '#4dc9a1', 0]], 0.5, 0.5, 0.5), effects: ['soft-glow', 'blur'] as const },
      { id: 'item-icon-disc', type: 'circle' as const, x: 0, y: 0, radius: 115, fill: radial([[0, '#284c4b', 0.95], [0.72, '#112a30', 0.96], [1, '#071016', 1]], 0.42, 0.36, 0.72), stroke: accent.main, strokeWidth: 3, effects: ['shadow', 'rough'] as const },
      { id: 'item-icon-inner-disc', type: 'circle' as const, x: 0, y: 0, radius: 93, fill: 'none', stroke: '#8ce5c2', strokeWidth: 0.9, opacity: 0.45, dash: '1 8' },
      { id: 'item-icon-cross', type: 'path' as const, d: 'M -63 0 C -28 -8 28 -8 63 0 M 0 -63 C -8 -28 -8 28 0 63', fill: 'none', stroke: '#b99559', strokeWidth: 1, opacity: 0.4 },
      ...bladeShape(-12, 2, 166, 23, 38, controls.seed + 701),
      { id: 'item-guard', type: 'path' as const, d: 'M -43 13 C -18 2 18 2 43 13 C 28 29 16 35 0 35 C -16 35 -28 29 -43 13 Z', fill: linear([[0, '#f0ca73', 1], [0.45, '#93632c', 1], [1, '#2d1b16', 1]], 0, 0, 0, 1), stroke: '#201310', strokeWidth: 2, effects: ['glow', 'rough'] },
      { id: 'item-grip', type: 'rounded-rect' as const, x: -10, y: 32, width: 20, height: 49, radius: 7, fill: '#101c25', stroke: '#a8864e', strokeWidth: 2 },
      { id: 'item-pommel', type: 'polygon' as const, x: 0, y: 0, points: polygonPoints({ x: 0, y: 89 }, 16, 6, -Math.PI / 2), fill: '#c59b58', stroke: '#241610', strokeWidth: 2, effects: ['glow'] },
      { id: 'item-jade-gem', type: 'circle' as const, x: 0, y: 16, radius: 7, fill: radial([[0, '#dcffe8', 1], [0.4, '#4fd5a8', 0.95], [1, '#0e5e5f', 1]], 0.35, 0.3, 0.7), stroke: '#d9b765', strokeWidth: 1.5, effects: ['glow'] }
    ]
  };
  nodes.push(frame);
  nodes.push(...createParticleNodes('spirit', { count: Math.floor(20 + controls.particleCount * 0.35), origin: { x: 360, y: 235 }, radius: 150, seed: controls.seed + 710, color: '#73e7bd', accent: '#e1ffeb', size: 1.5, lifetime: 3.6, gravity: -4 }, time));
  addInkSplash(nodes, 'item-ink', 360, 322, 110, 0.44, controls.seed + 720, '#0a1218');
  addCloud(nodes, 'item-mist', 360, 354, 135, controls.seed + 721, 0.38);
  nodes.push(tinyLabel('item-top', 'RELIC LIBRARY  /  05', 32, 28, '#90aaa1'));
  nodes.push(tinyLabel('item-rarity', controls.rarity.toUpperCase(), 688, 28, accent.main, 'end'));
  nodes.push(textNode('item-title', '月 魄 剑', 360, 409, { fill: '#d7f5df', fontSize: 17, textAnchor: 'middle', letterSpacing: 5, fontWeight: 700 }));
  nodes.push(textNode('item-subtitle', 'MOON SOUL  ·  UNBOUND', 360, 429, { fill: '#718f88', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.1 }));
  return nodes;
}

export function buildLegendaryBadge(controls: AssetControlState, time = 0): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 800, '#18120b');
  const accent = rarityAccent(controls.rarity);
  const center = { x: 360, y: 235 };
  const color: Paint = linear([[0, '#fff2b2', 1], [0.25, '#e2ad48', 1], [0.6, '#754019', 1], [1, '#28160f', 1]], 0, 0, 1, 1);
  nodes.push({
    id: 'badge-shadow',
    type: 'ellipse',
    x: center.x,
    y: center.y + 18,
    width: 390,
    height: 48,
    fill: '#05070a',
    opacity: 0.72,
    effects: ['soft-shadow', 'blur']
  });
  nodes.push({
    id: 'legendary-badge',
    type: 'group',
    name: 'Legendary badge',
    x: center.x,
    y: center.y,
    children: [
      { id: 'badge-aura', type: 'circle', x: 0, y: 0, radius: 168, fill: radial([[0, '#e6a943', 0.22], [0.55, '#a35520', 0.08], [1, '#a35520', 0]], 0.5, 0.5, 0.5), effects: ['soft-glow', 'blur'] },
      { id: 'badge-outer', type: 'polygon', x: 0, y: 0, points: polygonPoints({ x: 0, y: 0 }, 133, 8, Math.PI / 8), fill: '#2a1710', stroke: '#100b09', strokeWidth: 9, effects: ['shadow', 'rough'] },
      { id: 'badge-gold', type: 'polygon', x: 0, y: 0, points: polygonPoints({ x: 0, y: 0 }, 124, 8, Math.PI / 8), fill: color, stroke: '#ffe8a0', strokeWidth: 2, effects: ['gold-shine', 'glow'] },
      { id: 'badge-inner', type: 'polygon', x: 0, y: 0, points: polygonPoints({ x: 0, y: 0 }, 101, 8, Math.PI / 8), fill: '#1d201b', stroke: '#6e421e', strokeWidth: 3 },
      { id: 'badge-inner-glow', type: 'circle', x: 0, y: 0, radius: 83, fill: radial([[0, '#daa13c', 0.28], [0.6, '#6e421e', 0.08], [1, '#6e421e', 0]], 0.5, 0.44, 0.58), effects: ['glow'] },
      { id: 'badge-crown', type: 'polygon', x: 0, y: 0, points: starPoints({ x: 0, y: -24 }, 47, 21, 5, -Math.PI / 2), fill: '#ffe4a0', stroke: '#70431e', strokeWidth: 1.5, effects: ['glow'] },
      { id: 'badge-glyph', type: 'text', x: 0, y: 34, text: '天', textAnchor: 'middle', fontSize: 55, fontFamily: 'Noto Serif SC, Songti SC, serif', fontWeight: 700, fill: '#f7d98a', stroke: '#5d351c', strokeWidth: 2 },
      { id: 'badge-rule', type: 'line', x: -48, y: 55, x2: 48, y2: 55, stroke: '#e7b856', strokeWidth: 1, opacity: 0.75 },
      { id: 'badge-label', type: 'text', x: 0, y: 78, text: '天 命', textAnchor: 'middle', fontSize: 12, fontFamily: 'Noto Serif SC, Songti SC, serif', letterSpacing: 4, fill: '#e7bb68', opacity: 0.9 }
    ]
  });
  nodes.push(...starMedallion(center.x, center.y, 157, accent.main, controls.seed + 803));
  nodes.push(...createParticleNodes('spark', { count: 26, origin: center, radius: 164, seed: controls.seed + 808, color: '#f4c768', accent: '#fff1b7', size: 1.9, lifetime: 2.6, gravity: -3 }, time));
  addCloud(nodes, 'badge-mist', 360, 363, 180, controls.seed + 810, 0.36);
  nodes.push(tinyLabel('badge-top', 'RELIC INDEX  /  06', 32, 28, '#b59a66'));
  nodes.push(tinyLabel('badge-rarity', 'LEGENDARY', 688, 28, accent.main, 'end'));
  nodes.push(textNode('badge-title', '天命遗珍', 360, 409, { fill: '#f6dda2', fontSize: 17, textAnchor: 'middle', letterSpacing: 5, fontWeight: 700 }));
  nodes.push(textNode('badge-subtitle', 'A RARE SHARD OF FATE', 360, 429, { fill: '#9a805b', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.2 }));
  return nodes;
}

export function buildMagicCircle(controls: AssetControlState, time = 0): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 900, '#0c101c');
  const colors = elementPalette(controls.element);
  nodes.push(...magicCircleNodes('magic-circle', 360, 230, controls.rarity === 'legendary' ? 178 : 164, controls.seed + 901, colors.main));
  nodes.push({
    id: 'magic-circle-core',
    type: 'circle',
    x: 360,
    y: 230,
    radius: 78,
    fill: radial([[0, colors.light, 0.4], [0.3, colors.main, 0.2], [1, colors.main, 0]], 0.5, 0.5, 0.5),
    effects: ['glow', 'blur']
  });
  nodes.push({
    id: 'magic-circle-rune',
    type: 'text',
    x: 360,
    y: 253,
    text: controls.element === 'fire' ? '炎' : controls.element === 'ice' ? '霜' : controls.element === 'lightning' ? '雷' : controls.element === 'wind' ? '风' : '道',
    fontSize: 60,
    textAnchor: 'middle',
    fontFamily: 'Noto Serif SC, Songti SC, serif',
    fontWeight: 700,
    fill: colors.light,
    opacity: 0.82 + controls.glow * 0.1,
    effects: ['glow', 'rough']
  });
  nodes.push(...createParticleNodes('magic', { count: Math.floor(22 + controls.particleCount * 0.5), origin: { x: 360, y: 230 }, radius: 215, seed: controls.seed + 904, color: colors.main, accent: colors.light, size: 1.8, lifetime: 3.2, gravity: 0, turbulence: 1.2 }, time));
  addCloud(nodes, 'magic-mist', 360, 348, 190, controls.seed + 906, 0.68);
  addDust(nodes, controls.seed + 907, 20, colors.light);
  nodes.push(tinyLabel('magic-top', 'FORMATION LAYER  /  08', 32, 28, '#9693bd'));
  nodes.push(tinyLabel('magic-rarity', controls.rarity.toUpperCase(), 688, 28, colors.main, 'end'));
  nodes.push(textNode('magic-title', '万象归元', 360, 409, { fill: '#dedbff', fontSize: 17, textAnchor: 'middle', letterSpacing: 5, fontWeight: 700 }));
  nodes.push(textNode('magic-subtitle', 'ANCIENT ARRAY  /  ACTIVE', 360, 429, { fill: '#77789e', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.2 }));
  return nodes;
}

export function buildProgressBar(controls: AssetControlState): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 1000, '#0c1617');
  const accent = rarityAccent(controls.rarity);
  const x = 111;
  const y = 190;
  const width = 498;
  const height = 86;
  nodes.push({
    id: 'progress-shadow',
    type: 'rounded-rect',
    x: x + 2,
    y: y + 10,
    width,
    height,
    radius: 14,
    fill: '#020507',
    opacity: 0.7,
    effects: ['soft-shadow']
  });
  nodes.push({
    id: 'progress-bar',
    type: 'group',
    name: 'Cultivation progress bar',
    x,
    y,
    children: [
      { id: 'progress-track', type: 'rounded-rect', x: 0, y: 0, width, height, radius: 15, fill: '#101b20', stroke: '#070c10', strokeWidth: 6, effects: ['rough', 'shadow'] },
      { id: 'progress-inner', type: 'rounded-rect', x: 10, y: 10, width: width - 20, height: height - 20, radius: 9, fill: '#1a2b2c', stroke: '#759b8e', strokeWidth: 1, strokeOpacity: 0.38 },
      { id: 'progress-fill', type: 'rounded-rect', x: 14, y: 14, width: 322, height: height - 28, radius: 7, fill: linear([[0, '#2c876f', 1], [0.48, '#73c58d', 1], [1, '#d2d889', 1]], 0, 0, 1, 0), effects: ['inner-bevel', 'soft-glow'] },
      { id: 'progress-shine', type: 'rounded-rect', x: 23, y: 18, width: 260, height: 9, radius: 4, fill: '#d5f5c1', opacity: 0.27, effects: ['blur'] },
      { id: 'progress-glint', type: 'polygon', x: 0, y: 0, points: starPoints({ x: 337, y: 43 }, 14, 5, 4), fill: '#e9f7b9', opacity: 0.74, effects: ['glow'] },
      { id: 'progress-text', type: 'text', x: 28, y: 49, text: 'SPIRIT ROOT', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: 1.8, fill: '#d4edce', opacity: 0.78 },
      { id: 'progress-value', type: 'text', x: width - 28, y: 49, text: '72 / 100', textAnchor: 'end', fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: 1.3, fill: accent.pale, opacity: 0.86 }
    ]
  });
  addCorner(nodes, 'progress-corner-tl', 73, 151, 18, 0, '#ba9b5c');
  addCorner(nodes, 'progress-corner-br', 646, 314, 18, 180, '#ba9b5c');
  addCloud(nodes, 'progress-mist', 360, 326, 186, controls.seed + 1002, 0.34);
  addDust(nodes, controls.seed + 1004, 20, '#cfe3a1');
  nodes.push(tinyLabel('progress-top', 'HUD COMPONENT  /  10', 32, 28, '#91aaa0'));
  nodes.push(tinyLabel('progress-state', 'LIVE  ·  72%', 688, 28, accent.main, 'end'));
  nodes.push(textNode('progress-title', '灵 根', 360, 157, { fill: '#d9efc9', fontSize: 17, textAnchor: 'middle', letterSpacing: 5, fontWeight: 700 }));
  nodes.push(textNode('progress-subtitle', 'SPIRIT ROOT  /  STABLE', 360, 346, { fill: '#72948d', fontSize: 7, textAnchor: 'middle', fontFamily: 'ui-monospace, monospace', letterSpacing: 2.1 }));
  return nodes;
}
