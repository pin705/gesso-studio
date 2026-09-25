import type { AssetControlState, AssetDefinition, RenderOptions, TemplateId } from '../types/scene';
import { DEFAULT_CONTROLS, buildAsset } from '../assets';
import { renderSceneSVG } from '../renderer/svg';

export interface ExportOptions {
  scale?: number;
  transparent?: boolean;
  time?: number;
  format?: 'svg' | 'png' | 'webp' | 'json' | 'sprite' | 'pixijs';
  controls?: AssetControlState;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function serializeAsset(asset: AssetDefinition, controls?: AssetControlState): string {
  return JSON.stringify({
    schemaVersion: 1,
    generator: 'game-art-studio',
    generatorVersion: '0.1.0',
    asset,
    parameters: controls ?? asset.parameters ?? {}
  }, null, 2);
}

export function exportJSON(asset: AssetDefinition, controls?: AssetControlState): void {
  download(new Blob([serializeAsset(asset, controls)], { type: 'application/json' }), `${safeFilename(asset.name)}.json`);
}

export function exportSVG(asset: AssetDefinition, options: ExportOptions = {}): void {
  const svg = renderSceneSVG(asset, {
    time: options.time,
    transparent: options.transparent,
    forExport: true,
    title: asset.name
  });
  download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${safeFilename(asset.name)}.svg`);
}

function rasterBlob(asset: AssetDefinition, format: 'png' | 'webp', options: ExportOptions = {}): Promise<Blob> {
  const scale = options.scale ?? 2;
  const svg = renderSceneSVG(asset, { time: options.time, transparent: options.transparent, forExport: true, title: asset.name });
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(asset.width * scale));
      canvas.height = Math.max(1, Math.round(asset.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Could not encode raster export'));
      }, format === 'png' ? 'image/png' : 'image/webp', format === 'webp' ? 0.92 : undefined);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not rasterize SVG'));
    };
    image.src = url;
  });
}

export async function exportPNG(asset: AssetDefinition, options: ExportOptions = {}): Promise<void> {
  const blob = await rasterBlob(asset, 'png', options);
  download(blob, `${safeFilename(asset.name)}.png`);
}

export async function exportWebP(asset: AssetDefinition, options: ExportOptions = {}): Promise<void> {
  const blob = await rasterBlob(asset, 'webp', options);
  download(blob, `${safeFilename(asset.name)}.webp`);
}

export async function exportSpriteSheet(templateId: TemplateId, controls: AssetControlState, options: ExportOptions = {}): Promise<void> {
  const frames = 6;
  const frameWidth = 720;
  const frameHeight = 480;
  const columns = 3;
  const rows = 2;
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * columns * (options.scale ? Math.min(2, options.scale) : 1);
  canvas.height = frameHeight * rows * (options.scale ? Math.min(2, options.scale) : 1);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  const scale = options.scale ? Math.min(2, options.scale) : 1;
  for (let index = 0; index < frames; index += 1) {
    const time = (index / frames) * 2.4;
    const frame = buildAsset(templateId, controls, time);
    const svg = renderSceneSVG(frame, { time, transparent: options.transparent, forExport: true, title: frame.name });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, (index % columns) * frameWidth * scale, Math.floor(index / columns) * frameHeight * scale, frameWidth * scale, frameHeight * scale);
        URL.revokeObjectURL(url);
        resolve();
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not render sprite frame'));
      };
      image.src = url;
    });
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode sprite sheet');
  download(blob, `${safeFilename(TEMPLATE_BY_ID_NAME(templateId))}-sprite-sheet.png`);
}

function TEMPLATE_BY_ID_NAME(id: TemplateId): string {
  return id.replace(/-/g, ' ');
}

export function exportPixiDefinition(asset: AssetDefinition, controls?: AssetControlState): void {
  const definition = {
    type: 'pixi-asset',
    name: asset.id,
    version: 1,
    source: 'game-art-studio/scene-definition',
    width: asset.width,
    height: asset.height,
    seed: asset.seed,
    parameters: controls ?? asset.parameters,
    nodeTypes: [...new Set(asset.nodes.map((node) => node.type))],
    runtime: {
      module: 'src/renderer/pixi.ts',
      factory: 'createPixiAsset(asset)',
      methods: ['play()', 'pause()', 'setTime(seconds)']
    }
  };
  download(new Blob([JSON.stringify(definition, null, 2)], { type: 'application/json' }), `${safeFilename(asset.name)}.pixi.json`);
}

export async function exportAsset(
  input: AssetDefinition | TemplateId,
  options: ExportOptions = {}
): Promise<void> {
  const controls = options.controls ?? DEFAULT_CONTROLS;
  const asset = typeof input === 'string' ? buildAsset(input, { ...controls, templateId: input }, options.time ?? 0) : input;
  switch (options.format ?? 'svg') {
    case 'svg': exportSVG(asset, options); break;
    case 'png': await exportPNG(asset, options); break;
    case 'webp': await exportWebP(asset, options); break;
    case 'json': exportJSON(asset, controls); break;
    case 'sprite': await exportSpriteSheet(asset.id as TemplateId, controls, options); break;
    case 'pixijs': exportPixiDefinition(asset, controls); break;
  }
}

export async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}
