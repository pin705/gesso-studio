import type { AssetControlState, SceneNode } from '../types/scene';
import { createBrushStroke, polygonPoints, seededRandom, starPoints, wavyLine } from '../primitives/path';
import { createParticleNodes } from '../primitives/particles';
import { addCloud, addCorner, addDust, addInkSplash, artboardBackground, glowLine, linear, materialFill, radial, rarityAccent, slashPath, textNode, tinyLabel } from './common';

interface ButtonOptions {
  material: string;
  title: string;
  subtitle: string;
  seed: number;
  rarity: AssetControlState['rarity'];
  roughness: number;
  glow: number;
}

function buildButtonScene(options: ButtonOptions): SceneNode[] {
  const accent = rarityAccent(options.rarity);
  const nodes = artboardBackground(options.seed, options.material === 'gold' ? '#1b1713' : '#0a1719');
  const material = options.material;
  const body = materialFill(material);
  const shadow = materialFill(material, 'edge');
  const highlight = materialFill(material, 'highlight');
  const innerGlow = materialFill(material, 'innerGlow');
  const metal = material === 'gold'
    ? '#e5b65b'
    : options.rarity === 'legendary'
      ? '#e7ae4c'
      : options.rarity === 'epic'
        ? '#bd79e8'
        : options.rarity === 'rare'
          ? '#5fa7d8'
          : '#9ca7a1';
  const shellX = 119;
  const shellY = 145;
  const shellW = 482;
  const shellH = 174;
  const borderPoints = [
    { x: 12, y: 3 },
    { x: shellW * 0.32, y: 1 },
    { x: shellW * 0.7, y: 3 },
    { x: shellW - 12, y: 2 },
    { x: shellW - 3, y: shellH * 0.35 },
    { x: shellW - 4, y: shellH - 5 },
    { x: shellW * 0.68, y: shellH - 2 },
    { x: shellW * 0.32, y: shellH - 3 },
    { x: 3, y: shellH - 4 }
  ];
  const roughBorder = createBrushStroke(borderPoints, 5.4, options.seed + 13, options.roughness);
  const innerBorder = createBrushStroke(
    borderPoints.map((point) => ({ x: point.x + 7, y: point.y + 7 })),
    1.25,
    options.seed + 17,
    options.roughness * 0.7
  );

  nodes.push({
    id: 'button-shadow',
    type: 'ellipse',
    x: 360,
    y: 339,
    width: 520,
    height: 31,
    fill: '#00070b',
    opacity: 0.68,
    effects: ['soft-shadow', 'blur']
  });
  nodes.push({
    id: 'button-halo',
    type: 'ellipse',
    x: 360,
    y: 224,
    width: 530,
    height: 194,
    fill: radial([[0, material === 'gold' ? '#f2b951' : '#4de0b0', 0.18], [0.55, material === 'gold' ? '#bd702b' : '#176e69', 0.06], [1, '#061013', 0]], 0.5, 0.5, 0.5),
    opacity: 0.28 + options.glow * 0.14,
    effects: ['soft-glow', 'blur']
  });
  nodes.push({
    id: 'jade-button-shell',
    type: 'group',
    name: 'Jade button shell',
    x: shellX,
    y: shellY,
    children: [
      {
        id: 'button-ink-body',
        type: 'rounded-rect',
        name: 'Carved ink body',
        x: 0,
        y: 0,
        width: shellW,
        height: shellH,
        radius: 25,
        fill: shadow,
        stroke: '#071317',
        strokeWidth: 8,
        effects: ['shadow', 'rough']
      },
      {
        id: 'button-jade-body',
        type: 'rounded-rect',
        name: 'Jade surface',
        x: 7,
        y: 7,
        width: shellW - 14,
        height: shellH - 14,
        radius: 20,
        fill: body,
        stroke: '#091c20',
        strokeWidth: 2.5,
        effects: ['inner-bevel']
      },
      {
        id: 'button-inner-light',
        type: 'rounded-rect',
        x: 16,
        y: 15,
        width: shellW - 32,
        height: shellH - 37,
        radius: 16,
        fill: 'none',
        stroke: highlight,
        strokeWidth: 2,
        strokeOpacity: 0.52 + options.glow * 0.2,
        effects: ['soft-glow']
      },
      {
        id: 'button-inner-shadow',
        type: 'rounded-rect',
        x: 22,
        y: 23,
        width: shellW - 44,
        height: shellH - 51,
        radius: 13,
        fill: 'none',
        stroke: innerGlow,
        strokeWidth: 5,
        strokeOpacity: 0.18,
        effects: ['blur']
      },
      {
        id: 'button-ink-edge',
        type: 'path',
        d: roughBorder,
        fill: 'none',
        stroke: '#071317',
        strokeWidth: 2.4,
        strokeOpacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
        effects: ['ink', 'rough']
      },
      {
        id: 'button-gold-edge',
        type: 'path',
        d: innerBorder,
        fill: 'none',
        stroke: metal,
        strokeWidth: 1.25,
        strokeOpacity: 0.75,
        lineCap: 'round',
        effects: ['gold-shine', 'glow']
      },
      {
        id: 'button-center-rune',
        type: 'group',
        x: 0,
        y: 0,
        children: [
          { id: 'rune-diamond', type: 'polygon', x: 0, y: 0, points: polygonPoints({ x: 241, y: 86 }, 27, 4, 0), fill: 'none', stroke: metal, strokeWidth: 1.1, opacity: 0.72, effects: ['glow'] },
          { id: 'rune-ring', type: 'circle', x: 241, y: 86, radius: 17, fill: 'none', stroke: '#b9f5d3', strokeWidth: 0.8, opacity: 0.35, dash: '1 5' },
          { id: 'rune-spark', type: 'polygon', x: 0, y: 0, points: starPoints({ x: 241, y: 86 }, 10, 3, 4, -Math.PI / 2), fill: '#d9bd70', opacity: 0.7, effects: ['glow'] }
        ]
      },
      {
        id: 'button-label-glow',
        type: 'text',
        x: 241,
        y: 103,
        text: options.title,
        textAnchor: 'middle',
        fontSize: 29,
        fontFamily: 'Noto Serif SC, Songti SC, serif',
        fontWeight: 700,
        letterSpacing: 8,
        fill: '#c4f4d1',
        opacity: 0.25 + options.glow * 0.14,
        effects: ['soft-glow']
      },
      {
        id: 'button-label',
        type: 'text',
        x: 241,
        y: 101,
        text: options.title,
        textAnchor: 'middle',
        fontSize: 29,
        fontFamily: 'Noto Serif SC, Songti SC, serif',
        fontWeight: 700,
        letterSpacing: 8,
        fill: '#f4e5ba',
        stroke: '#102f2d',
        strokeWidth: 0.7,
        effects: ['shadow']
      },
      {
        id: 'button-subtitle',
        type: 'text',
        x: 241,
        y: 124,
        text: options.subtitle,
        textAnchor: 'middle',
        fontSize: 7.5,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontWeight: 700,
        letterSpacing: 3.1,
        fill: accent.pale,
        opacity: 0.72
      },
      {
        id: 'button-side-mark-left',
        type: 'path',
        d: 'M 37 75 C 25 86 25 101 37 112',
        fill: 'none',
        stroke: metal,
        strokeWidth: 1.1,
        opacity: 0.66,
        lineCap: 'round'
      },
      {
        id: 'button-side-mark-right',
        type: 'path',
        d: `M ${shellW - 37} 75 C ${shellW - 25} 86 ${shellW - 25} 101 ${shellW - 37} 112`,
        fill: 'none',
        stroke: metal,
        strokeWidth: 1.1,
        opacity: 0.66,
        lineCap: 'round'
      }
    ]
  });
  addCorner(nodes, 'button-corner-tl', 77, 113, 25, 0, metal);
  addCorner(nodes, 'button-corner-tr', 643, 113, 25, 90, metal);
  addCorner(nodes, 'button-corner-bl', 77, 342, 25, -90, metal);
  addCorner(nodes, 'button-corner-br', 643, 342, 25, 180, metal);
  addInkSplash(nodes, 'button-ink-splash', 360, 324, 188, 0.68, options.seed + 55, '#071318');
  addCloud(nodes, 'button-mist', 360, 365, 205, options.seed + 61, 0.58);
  addDust(nodes, options.seed + 71, 30, options.material === 'gold' ? '#e9c776' : '#a5d9c2');
  nodes.push(...createParticleNodes('spirit', {
    count: Math.floor(12 + options.glow * 18),
    origin: { x: 360, y: 232 },
    radius: 188,
    seed: options.seed + 80,
    color: material === 'gold' ? '#ffd77a' : '#6ceac1',
    accent: '#f7ffe0',
    size: 1.5,
    lifetime: 3.8,
    turbulence: 0.8
  }, 0));
  nodes.push(tinyLabel('button-index', 'CULTIVATION UI  /  01', 42, 47, '#85afa3'));
  nodes.push(tinyLabel('button-status', 'READY  ·  SEED ' + options.seed, 678, 47, '#a4b5a8', 'end'));
  nodes.push(textNode('button-caption', '一念 · 破境', 42, 91, { fill: '#d9caa1', fontSize: 12, letterSpacing: 3, opacity: 0.74 }));
  nodes.push(textNode('button-caption-en', 'BREAK THE SEAL', 42, 108, { fill: '#7b9a91', fontSize: 8, fontFamily: 'ui-monospace, monospace', letterSpacing: 2.4, opacity: 0.8 }));
  nodes.push({
    id: 'button-side-vertical',
    type: 'text',
    x: 679,
    y: 240,
    text: '灵  ·  玉  ·  境',
    fontSize: 9,
    fontFamily: 'Noto Serif SC, Songti SC, serif',
    letterSpacing: 4,
    fill: '#759b91',
    opacity: 0.6,
    rotation: 90
  });
  return nodes;
}

export function buildJadeButton(controls: AssetControlState, time = 0): SceneNode[] {
  return buildButtonScene({
    material: controls.material === 'gold' ? 'gold' : controls.material,
    title: controls.label || '突破',
    subtitle: controls.rarity === 'legendary' ? 'LEGENDARY ASCENSION' : 'ENTER THE UNKNOWN',
    seed: controls.seed,
    rarity: controls.rarity,
    roughness: controls.roughness,
    glow: controls.glow
  });
}

export function buildGoldButton(controls: AssetControlState): SceneNode[] {
  return buildButtonScene({
    material: 'gold',
    title: controls.label || '问道',
    subtitle: 'GOLDEN PATH  ·  PREMIUM',
    seed: controls.seed + 300,
    rarity: controls.rarity,
    roughness: controls.roughness * 0.8,
    glow: Math.max(0.25, controls.glow)
  });
}
