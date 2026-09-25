import { Container, Graphics, Text } from 'pixi.js';
import type { AssetDefinition, Paint, SceneNode } from '../types/scene';

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex(rgb: Rgb): number {
  return (Math.round(rgb.r) << 16) | (Math.round(rgb.g) << 8) | Math.round(rgb.b);
}

function paintColor(paint: Paint | undefined, fallback = '#ffffff'): number {
  if (!paint) return rgbToHex(hexToRgb(fallback));
  if (typeof paint === 'string') return rgbToHex(hexToRgb(paint));
  const color = paint.kind === 'linear'
    ? (paint.stops.find((stop) => stop.offset >= 0.32) ?? paint.stops[Math.floor(paint.stops.length / 2)] ?? paint.stops[0])?.color
    : (paint.stops[0]?.color ?? fallback);
  return rgbToHex(hexToRgb(color ?? fallback));
}

function paintAlpha(paint: Paint | undefined, fallback: number): number {
  if (paint && typeof paint !== 'string') return fallback * (paint.stops[0]?.opacity ?? 1);
  return fallback;
}

function pathToGraphics(graphics: Graphics, d: string): void {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  let index = 0;
  let command = '';
  let currentX = 0;
  let currentY = 0;
  const read = (): number => Number(tokens[index++]);
  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) command = tokens[index++];
    switch (command.toLowerCase()) {
      case 'm': {
        currentX = read();
        currentY = read();
        graphics.moveTo(currentX, currentY);
        command = 'l';
        break;
      }
      case 'l': {
        const x = read();
        const y = read();
        graphics.lineTo(x, y);
        currentX = x;
        currentY = y;
        break;
      }
      case 'c': {
        const x1 = read();
        const y1 = read();
        const x2 = read();
        const y2 = read();
        const x = read();
        const y = read();
        graphics.bezierCurveTo(x1, y1, x2, y2, x, y);
        currentX = x;
        currentY = y;
        break;
      }
      case 'q': {
        const x1 = read();
        const y1 = read();
        const x = read();
        const y = read();
        graphics.quadraticCurveTo(x1, y1, x, y);
        currentX = x;
        currentY = y;
        break;
      }
      case 'a': {
        read(); read(); read(); read(); read();
        const x = read();
        const y = read();
        graphics.lineTo(x, y);
        currentX = x;
        currentY = y;
        break;
      }
      case 'z':
        graphics.closePath();
        break;
      default:
        index += 1;
    }
  }
}

function addPaint(graphics: Graphics, node: SceneNode, glow = false): void {
  const fill = node.fill;
  const stroke = node.stroke;
  if (fill && typeof fill !== 'string') {
    graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
  } else if (fill) {
    graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
  }
  if (stroke) {
    graphics.stroke({ color: paintColor(stroke), width: (node.strokeWidth ?? 1) * (glow ? 2.2 : 1), alpha: (node.strokeOpacity ?? 1) * (glow ? 0.18 : 1), cap: node.lineCap, join: node.lineJoin });
  }
}

function nodeToContainer(node: SceneNode): Container {
  const container = new Container();
  container.label = node.name ?? node.id;
  if (node.type === 'group') {
    (node.children ?? []).forEach((child) => container.addChild(nodeToContainer(child)));
    return container;
  }
  if (node.type === 'text') {
    const text = new Text({
      text: node.text ?? '',
      style: {
        fontFamily: node.fontFamily ?? 'serif',
        fontSize: node.fontSize ?? 16,
        fontWeight: (node.fontWeight as never) ?? 500,
        fill: paintColor(node.fill, '#ffffff'),
        letterSpacing: node.letterSpacing ?? 0,
        align: 'center'
      }
    });
    text.anchor.set(node.textAnchor === 'middle' ? 0.5 : 0, 0);
    text.position.set(node.x ?? 0, node.y ?? 0);
    text.alpha = node.opacity ?? 1;
    text.rotation = ((node.rotation ?? 0) * Math.PI) / 180;
    container.addChild(text);
    return container;
  }
  if (node.type === 'particle') {
    const particle = node.particle;
    const graphics = new Graphics();
    if (particle) {
      graphics.circle(0, 0, Math.max(0.5, particle.size));
      graphics.fill({ color: paintColor(particle.color, '#ffffff'), alpha: particle.opacity });
      graphics.circle(-particle.size * 0.25, -particle.size * 0.25, Math.max(0.3, particle.size * 0.35));
      graphics.fill({ color: 0xffffff, alpha: Math.min(0.8, particle.opacity * 0.7) });
      container.position.set(particle.x, particle.y);
      container.rotation = particle.rotation ?? 0;
    }
    container.addChild(graphics);
    return container;
  }
  const graphics = new Graphics();
  const fill = node.fill;
  const stroke = node.stroke;
  if (node.type === 'rect' || node.type === 'rounded-rect') {
    if (node.type === 'rounded-rect') graphics.roundRect(node.x ?? 0, node.y ?? 0, node.width ?? 0, node.height ?? 0, node.radius ?? 8);
    else graphics.rect(node.x ?? 0, node.y ?? 0, node.width ?? 0, node.height ?? 0);
    if (fill) graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
    if (stroke) graphics.stroke({ color: paintColor(stroke), width: node.strokeWidth ?? 1, alpha: node.strokeOpacity ?? 1 });
  } else if (node.type === 'circle') {
    graphics.circle(node.x ?? 0, node.y ?? 0, node.radius ?? node.width ?? 1);
    if (fill) graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
    if (stroke) graphics.stroke({ color: paintColor(stroke), width: node.strokeWidth ?? 1, alpha: node.strokeOpacity ?? 1 });
  } else if (node.type === 'ellipse') {
    graphics.ellipse(node.x ?? 0, node.y ?? 0, (node.width ?? 2) / 2, (node.height ?? 2) / 2);
    if (fill) graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
    if (stroke) graphics.stroke({ color: paintColor(stroke), width: node.strokeWidth ?? 1, alpha: node.strokeOpacity ?? 1 });
  } else if (node.type === 'line') {
    graphics.moveTo(node.x ?? 0, node.y ?? 0).lineTo(node.x2 ?? (node.x ?? 0) + (node.width ?? 0), node.y2 ?? (node.y ?? 0) + (node.height ?? 0));
    if (stroke) graphics.stroke({ color: paintColor(stroke), width: node.strokeWidth ?? 1, alpha: node.strokeOpacity ?? 1 });
  } else if (node.type === 'polygon' || node.type === 'star') {
    const points = node.points ?? [];
    if (points.length) {
      graphics.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
      graphics.closePath();
    }
    if (fill) graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
    if (stroke) graphics.stroke({ color: paintColor(stroke), width: node.strokeWidth ?? 1, alpha: node.strokeOpacity ?? 1 });
  } else if (node.type === 'path' || node.type === 'arc') {
    pathToGraphics(graphics, node.d ?? '');
    if (fill) graphics.fill({ color: paintColor(fill), alpha: paintAlpha(fill, node.opacity ?? 1) });
    if (stroke) graphics.stroke({ color: paintColor(stroke), width: node.strokeWidth ?? 1, alpha: node.strokeOpacity ?? 1 });
  }
  if (node.type === 'path' || node.type === 'line' || node.type === 'arc') {
    container.position.set(node.x ?? 0, node.y ?? 0);
    container.rotation = ((node.rotation ?? 0) * Math.PI) / 180;
  }
  if (node.effects?.includes('glow') || node.effects?.includes('soft-glow')) {
    const glowGraphics = new Graphics();
    if (fill) glowGraphics.fill({ color: paintColor(fill), alpha: 0.1 });
    if (stroke) glowGraphics.stroke({ color: paintColor(stroke), width: (node.strokeWidth ?? 2) * 3.5, alpha: 0.16 });
    glowGraphics.position.set(node.x ?? 0, node.y ?? 0);
    container.addChildAt(glowGraphics, 0);
  }
  container.alpha = node.opacity ?? 1;
  container.addChild(graphics);
  return container;
}

export class ProceduralPixiAsset extends Container {
  private asset: AssetDefinition;
  private time = 0;
  private duration = 2.8;
  private frame = 0;
  private playing = false;

  constructor(asset: AssetDefinition, options: { duration?: number } = {}) {
    super();
    this.asset = asset;
    this.duration = options.duration ?? 2.8;
    this.renderAt(0);
  }

  renderAt(seconds: number): void {
    this.time = ((seconds % this.duration) + this.duration) % this.duration;
    this.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.asset.nodes.forEach((node) => this.addChild(nodeToContainer(node)));
  }

  setTime(seconds: number): void {
    this.renderAt(seconds);
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    const started = performance.now();
    const initial = this.time;
    const tick = (now: number) => {
      if (!this.playing) return;
      const elapsed = (now - started) / 1000;
      this.renderAt(initial + elapsed);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.frame);
  }

  getProgress(): number {
    return this.time / this.duration;
  }

  override destroy(options?: boolean | { children?: boolean; texture?: boolean; textureSource?: boolean }): void {
    this.pause();
    super.destroy(options);
  }
}

export function createPixiAsset(asset: AssetDefinition, options: { duration?: number } = {}): ProceduralPixiAsset {
  return new ProceduralPixiAsset(asset, options);
}
