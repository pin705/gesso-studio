import type { AssetControlState, SceneNode } from '../types/scene';
import { createBrushStroke, seededRandom, smoothPath, starPoints, wavyLine } from '../primitives/path';
import { addCloud, addCorner, addDust, addInkSplash, artboardBackground, linear, materialFill, radial, rarityAccent, textNode, tinyLabel } from './common';
import { ornamentalCorner } from '../primitives/ink';

export function buildCultivationPanel(controls: AssetControlState): SceneNode[] {
  const nodes = artboardBackground(controls.seed + 410, '#17130e');
  const accent = rarityAccent(controls.rarity);
  const x = 76;
  const y = 48;
  const width = 568;
  const height = 384;
  const paper = linear([[0, '#e6d3a4', 0.98], [0.12, '#bda572', 0.96], [0.5, '#8b714c', 0.98], [1, '#4a3928', 1]], 0, 0, 1, 1);
  const paperHighlight = linear([[0, '#fff1c7', 0.5], [0.2, '#d6bb83', 0.12], [0.78, '#5a422a', 0.1], [1, '#1f2422', 0.7]], 0, 0, 1, 1);
  nodes.push({
    id: 'panel-shadow',
    type: 'rounded-rect',
    x: x + 4,
    y: y + 12,
    width,
    height,
    radius: 16,
    fill: '#05090c',
    opacity: 0.75,
    effects: ['soft-shadow', 'blur']
  });
  nodes.push({
    id: 'cultivation-panel',
    type: 'group',
    name: 'Cultivation status panel',
    x,
    y,
    children: [
      {
        id: 'panel-body',
        type: 'rounded-rect',
        name: 'Parchment surface',
        x: 0,
        y: 0,
        width,
        height,
        radius: 15,
        fill: paper,
        stroke: '#181713',
        strokeWidth: 5,
        effects: ['paper', 'rough', 'shadow']
      },
      {
        id: 'panel-inner-paper',
        type: 'rounded-rect',
        x: 10,
        y: 10,
        width: width - 20,
        height: height - 20,
        radius: 10,
        fill: paperHighlight,
        stroke: '#d3b779',
        strokeWidth: 1,
        strokeOpacity: 0.55,
        effects: ['paper', 'noise']
      },
      {
        id: 'panel-ink-frame',
        type: 'path',
        d: createBrushStroke([
          { x: 16, y: 17 }, { x: width * 0.3, y: 15 }, { x: width * 0.7, y: 17 }, { x: width - 16, y: 15 },
          { x: width - 14, y: height * 0.33 }, { x: width - 16, y: height * 0.68 }, { x: width - 15, y: height - 16 },
          { x: width * 0.68, y: height - 14 }, { x: width * 0.32, y: height - 16 }, { x: 15, y: height - 15 },
          { x: 17, y: height * 0.65 }, { x: 15, y: height * 0.34 }
        ], 2.4, controls.seed + 412, 0.86),
        fill: 'none',
        stroke: '#1b1c1a',
        strokeWidth: 2.1,
        opacity: 0.82,
        lineCap: 'round',
        lineJoin: 'round',
        effects: ['ink', 'rough']
      },
      {
        id: 'panel-header-rule',
        type: 'line',
        x: 38,
        y: 80,
        x2: width - 38,
        y2: 80,
        stroke: '#30261c',
        strokeWidth: 1,
        opacity: 0.68
      },
      {
        id: 'panel-header-rule-gold',
        type: 'line',
        x: 40,
        y: 83,
        x2: width - 40,
        y2: 83,
        stroke: accent.main,
        strokeWidth: 0.8,
        opacity: 0.6
      },
      {
        id: 'panel-title-mark',
        type: 'polygon',
        x: 0,
        y: 0,
        points: starPoints({ x: 52, y: 48 }, 17, 6, 4, 0),
        fill: '#213c35',
        stroke: '#1b2823',
        strokeWidth: 1.2,
        effects: ['glow']
      },
      {
        id: 'panel-title',
        type: 'text',
        x: 78,
        y: 46,
        text: '修 仙 者',
        fontSize: 19,
        fontFamily: 'Noto Serif SC, Songti SC, serif',
        fontWeight: 700,
        letterSpacing: 5,
        fill: '#1a201e',
        opacity: 0.9
      },
      {
        id: 'panel-title-en',
        type: 'text',
        x: 79,
        y: 63,
        text: 'CULTIVATION PROFILE  /  JADE SECT',
        fontSize: 7,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: 1.5,
        fill: '#634b31',
        opacity: 0.86
      },
      {
        id: 'panel-level-orb',
        type: 'circle',
        x: width - 65,
        y: 47,
        radius: 22,
        fill: radial([[0, '#f8e0a0', 0.95], [0.28, '#bca060', 0.75], [1, '#473522', 0.12]], 0.38, 0.34, 0.68),
        stroke: '#30251b',
        strokeWidth: 1.5,
        effects: ['shadow']
      },
      {
        id: 'panel-level-text',
        type: 'text',
        x: width - 65,
        y: 51,
        text: 'LV',
        fontSize: 7,
        textAnchor: 'middle',
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: 1.5,
        fill: '#332619'
      },
      {
        id: 'panel-level-number',
        type: 'text',
        x: width - 65,
        y: 64,
        text: '07',
        fontSize: 13,
        textAnchor: 'middle',
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 800,
        fill: '#231c17'
      },
      {
        id: 'panel-body-text',
        type: 'text',
        x: 42,
        y: 119,
        text: '心 静  ·  气 沉  ·  灵 台 澄 明',
        fontSize: 11,
        fontFamily: 'Noto Serif SC, Songti SC, serif',
        letterSpacing: 2.4,
        fill: '#32271c',
        opacity: 0.82
      },
      {
        id: 'panel-body-sub',
        type: 'text',
        x: 43,
        y: 138,
        text: 'The quiet heart is the first familiar.',
        fontSize: 8,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        letterSpacing: 0.4,
        fill: '#755b3d',
        opacity: 0.78
      },
      {
        id: 'panel-seal',
        type: 'group',
        x: 41,
        y: 165,
        children: [
          { id: 'seal-box', type: 'rect', x: 0, y: 0, width: 112, height: 112, fill: 'none', stroke: '#9a4a35', strokeWidth: 2, opacity: 0.72 },
          { id: 'seal-glyph-a', type: 'path', d: 'M 17 18 L 92 92 M 92 18 L 17 92', stroke: '#9a4a35', strokeWidth: 3, opacity: 0.55, lineCap: 'round', effects: ['rough'] },
          { id: 'seal-glyph-b', type: 'path', d: 'M 31 31 C 68 31 82 46 82 59 C 82 77 67 88 47 88 M 48 45 C 63 45 70 51 70 61 C 70 72 61 78 48 78', fill: 'none', stroke: '#9a4a35', strokeWidth: 2.4, opacity: 0.72, lineCap: 'round' },
          { id: 'seal-dot', type: 'circle', x: 55, y: 59, radius: 5, fill: '#9a4a35', opacity: 0.6 }
        ]
      },
      {
        id: 'panel-stat-label-1',
        type: 'text',
        x: 190,
        y: 178,
        text: 'QI  RESONANCE',
        fontSize: 7,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: 1.7,
        fill: '#705537',
        opacity: 0.84
      },
      {
        id: 'panel-stat-value-1',
        type: 'text',
        x: 190,
        y: 204,
        text: '84.7',
        fontSize: 23,
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        letterSpacing: 1,
        fill: '#1e2925'
      },
      {
        id: 'panel-stat-bar-1',
        type: 'rounded-rect',
        x: 278,
        y: 191,
        width: 178,
        height: 8,
        radius: 4,
        fill: '#3d3124',
        opacity: 0.72
      },
      {
        id: 'panel-stat-fill-1',
        type: 'rounded-rect',
        x: 278,
        y: 191,
        width: 148,
        height: 8,
        radius: 4,
        fill: linear([[0, '#4b9c76', 1], [1, '#b3c27b', 1]], 0, 0, 1, 0),
        effects: ['soft-glow']
      },
      {
        id: 'panel-stat-label-2',
        type: 'text',
        x: 190,
        y: 235,
        text: 'SPIRIT  ROOT',
        fontSize: 7,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: 1.7,
        fill: '#705537',
        opacity: 0.84
      },
      {
        id: 'panel-stat-value-2',
        type: 'text',
        x: 190,
        y: 261,
        text: 'JADE  /  Ⅱ',
        fontSize: 13,
        fontFamily: 'Noto Serif SC, Songti SC, serif',
        fontWeight: 700,
        letterSpacing: 2,
        fill: '#263a32'
      },
      {
        id: 'panel-stat-bar-2',
        type: 'rounded-rect',
        x: 278,
        y: 248,
        width: 178,
        height: 8,
        radius: 4,
        fill: '#3d3124',
        opacity: 0.72
      },
      {
        id: 'panel-stat-fill-2',
        type: 'rounded-rect',
        x: 278,
        y: 248,
        width: 112,
        height: 8,
        radius: 4,
        fill: linear([[0, '#b88648', 1], [1, '#e0bd6a', 1]], 0, 0, 1, 0),
        effects: ['soft-glow']
      },
      {
        id: 'panel-bottom-rule',
        type: 'line',
        x: 40,
        y: 304,
        x2: width - 40,
        y2: 304,
        stroke: '#493825',
        strokeWidth: 1,
        opacity: 0.62
      },
      {
        id: 'panel-bottom-copy',
        type: 'text',
        x: 42,
        y: 332,
        text: 'NEXT  TRIAL',
        fontSize: 7,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: 1.8,
        fill: '#6d4f34',
        opacity: 0.88
      },
      {
        id: 'panel-bottom-value',
        type: 'text',
        x: 42,
        y: 354,
        text: '雾隐山 · 第九重',
        fontSize: 12,
        fontFamily: 'Noto Serif SC, Songti SC, serif',
        letterSpacing: 1.8,
        fill: '#2a332c',
        opacity: 0.9
      },
      {
        id: 'panel-bottom-mark',
        type: 'polygon',
        x: 0,
        y: 0,
        points: starPoints({ x: width - 70, y: height - 61 }, 18, 7, 6),
        fill: 'none',
        stroke: accent.main,
        strokeWidth: 1.4,
        opacity: 0.8,
        effects: ['glow']
      }
    ]
  });
  addCorner(nodes, 'panel-corner-tl', 53, 33, 22, 0, '#34261c');
  addCorner(nodes, 'panel-corner-tr', 667, 33, 22, 90, '#34261c');
  addCorner(nodes, 'panel-corner-bl', 53, 447, 22, -90, '#34261c');
  addCorner(nodes, 'panel-corner-br', 667, 447, 22, 180, '#34261c');
  addInkSplash(nodes, 'panel-ink-fleck', 548, 402, 96, 0.34, controls.seed + 430, '#1a1712');
  addCloud(nodes, 'panel-mist', 410, 418, 152, controls.seed + 438, 0.44);
  addDust(nodes, controls.seed + 440, 18, '#e2c887');
  nodes.push(tinyLabel('panel-index', 'CULTIVATION SYSTEM  /  03', 30, 25, '#c5ab73'));
  nodes.push(tinyLabel('panel-version', 'LIVE SCENE  ·  v0.1', 690, 25, '#c5ab73', 'end'));
  return nodes;
}
