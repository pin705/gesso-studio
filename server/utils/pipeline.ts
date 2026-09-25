import { readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const evenTimes = (duration: number, count: number) => Array.from({ length: count }, (_, index) => (duration * index) / count);

export interface Lint {
  meta: Record<string, any>;
  errors: string[];
  warnings: string[];
}

/** Render and lint an SVG file; returns the review sheet the agent looks at. */
export async function reviewFile(file: string, key: string, artBible: string) {
  const probe = await captureAsset(file, { id: key, times: [] });
  if (probe.report.fatal) return { fatal: probe.report.fatal as string };
  const report = probe.report as Lint;
  const { meta } = report;
  const times = meta.animated && meta.duration ? evenTimes(meta.duration, 8) : [];
  const shot = await captureAsset(file, { id: key, fit: 440, times: [meta.duration * 0.25, ...times] });
  const [main, ...frames] = shot.frames;
  const sheet: Buffer = await reviewSheet({ id: key, meta, main: main!, scale: shot.scale, frames, times });
  // Measure what is actually visible, at 1x, across every sampled frame.
  const union = { left: Infinity, top: Infinity, right: Infinity, bottom: Infinity };
  for (const frame of [main!, ...frames]) {
    const box = await alphaBounds(frame);
    if (!box) continue;
    for (const side of ['left', 'top', 'right', 'bottom'] as const) union[side] = Math.min(union[side], box[side] / shot.scale);
  }
  if (Number.isFinite(union.left)) {
    const width = meta.width - union.left - union.right;
    const height = meta.height - union.top - union.bottom;
    meta.bounds = { ...Object.fromEntries(Object.entries(union).map(([side, value]) => [side, Math.round(value)])), fill: Math.round(((width * height) / (meta.width * meta.height)) * 100) / 100 };
    if (meta.type === 'icon' || meta.type === 'vfx') {
      if (Math.min(union.left, union.top, union.right, union.bottom) < 2) report.warnings.push('Visible pixels touch the canvas edge: outlines, glows or shadows are clipped. Leave at least 4px of padding.');
      if (meta.type === 'icon' && meta.bounds.fill < 0.4) report.warnings.push(`Content covers only ${Math.round(meta.bounds.fill * 100)}% of the canvas; an icon should fill about 80-90% of its box.`);
    }
  }
  const off: string[] = offPalette(await readFile(file, 'utf8'), artBible);
  if (off.length) report.warnings.push(`Colors not in the STYLE.md palette: ${off.slice(0, 8).join(', ')}${off.length > 8 ? ` (+${off.length - 8} more)` : ''}. Use the art bible ramps.`);
  return { report, sheet };
}

export function lintSummary(key: string, { meta, errors, warnings }: Lint): string {
  const lines = [`${key}: ${meta.type || 'untyped'} ${meta.width}x${meta.height}, ${meta.elements} elements${meta.animated ? `, animated ${meta.duration || '?'}s` : ''}${meta.nineSlice ? `, 9-slice ${meta.nineSlice.join(' ')}` : ''}.`];
  if (meta.bounds) lines.push(`Content margins (px) top ${meta.bounds.top}, right ${meta.bounds.right}, bottom ${meta.bounds.bottom}, left ${meta.bounds.left}; fills ${Math.round(meta.bounds.fill * 100)}% of the canvas.`);
  lines.push(...errors.map((error) => `ERROR: ${error}`), ...warnings.map((warning) => `WARN: ${warning}`));
  if (!errors.length && !warnings.length) lines.push('Lint clean.');
  return lines.join('\n');
}

/** Validate, review and store an SVG. Parse errors are rejected; lint problems are recorded, not blocking. */
export async function saveReviewed(project: Project, key: string, svg: string, input: { source: 'ai' | 'user' | 'restore'; note?: string; critique?: unknown }) {
  if (typeof svg !== 'string' || !svg.includes('<svg')) throw createError({ statusCode: 400, message: 'svg must be a complete SVG document.' });
  const { assets } = dirs(project);
  await mkdir(assets, { recursive: true });
  const draft = path.join(assets, `.${key}.draft.svg`);
  await writeFile(draft, svg);
  try {
    const result = await reviewFile(draft, key, await readBible(project));
    if ('fatal' in result) throw createError({ statusCode: 422, message: `Not saved: the SVG does not parse.\n${result.fatal}` });
    const revision = await writeAsset(project, key, svg, { ...input, lint: result.report });
    return { ...result, revision };
  } finally {
    await rm(draft, { force: true });
  }
}

let backlog: Promise<unknown> = Promise.resolve();

/** Lint files that arrived without a review (copied in, or edited on disk by an agent), one at a time. */
export function lintInBackground(project: Project, keys: string[]): void {
  for (const key of keys) backlog = backlog.then(() => (getAssetRow(project, key) ? rereview(project, key) : null)).catch(() => undefined);
}

/** Re-run lint on the current file (e.g. after a hand edit) and attach it to the latest revision. */
export async function rereview(project: Project, key: string) {
  const file = path.join(dirs(project).assets, `${key}.svg`);
  const result = await reviewFile(file, key, await readBible(project));
  if ('fatal' in result) throw createError({ statusCode: 422, message: result.fatal });
  await writeAsset(project, key, await readFile(file, 'utf8'), { source: 'user', lint: result.report });
  return result;
}

export async function exportAssets(project: Project, keys: string[], scales: number[]) {
  if (!scales.length || scales.some((scale) => !(scale >= 0.25 && scale <= 4))) throw createError({ statusCode: 400, message: 'scales must be numbers between 0.25 and 4.' });
  const { assets, exports } = dirs(project);
  // Mockups show the kit in context; they are not shipped to the engine.
  const list = keys.length ? keys.map(assertKey) : listAssets(project).filter((asset) => asset.type !== 'mockup').map((asset) => asset.key);
  await mkdir(exports, { recursive: true });
  const manifestFile = path.join(exports, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8').catch(() => '{"assets":{}}'));
  const written: string[] = [];
  for (const key of list) {
    const file = path.join(assets, `${key}.svg`);
    const { report } = await captureAsset(file, { id: key, times: [] });
    if (report.fatal) throw createError({ statusCode: 422, message: `${key}: ${report.fatal}` });
    const { meta } = report;
    const frameCount = meta.animated && meta.duration ? meta.frames || 12 : 0;
    const entry: Record<string, any> = { type: meta.type, width: meta.width, height: meta.height, nineSlice: meta.nineSlice, files: {} };
    if (frameCount) Object.assign(entry, { duration: meta.duration, frames: frameCount, fps: Math.round((frameCount / meta.duration) * 100) / 100 });
    for (const scale of scales) {
      const name = `${key}${scale === 1 ? '' : `@${scale}x`}`;
      const shot = await captureAsset(file, { id: key, scale, times: frameCount ? evenTimes(meta.duration, frameCount) : [0] });
      if (!frameCount) {
        await writeFile(path.join(exports, `${name}.png`), shot.frames[0]!);
        entry.files[scale] = `${name}.png`;
      } else {
        const [w, h] = [Math.ceil(meta.width * scale), Math.ceil(meta.height * scale)];
        const sheet = await spriteSheet(shot.frames, w, h);
        const frameNames = shot.frames.map((_: unknown, index: number) => `${key}_${index}`);
        const atlas = {
          frames: Object.fromEntries(frameNames.map((frameName: string, index: number) => [frameName, {
            frame: { x: (index % sheet.columns) * w, y: Math.floor(index / sheet.columns) * h, w, h },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w, h },
            sourceSize: { w, h },
            duration: Math.round((meta.duration / frameCount) * 1000)
          }])),
          animations: { [key]: frameNames },
          meta: { app: 'gesso', image: `${name}.png`, format: 'RGBA8888', size: { w: sheet.columns * w, h: sheet.rows * h }, scale: String(scale) }
        };
        await writeFile(path.join(exports, `${name}.png`), sheet.image);
        await writeFile(path.join(exports, `${name}.json`), JSON.stringify(atlas, null, 2));
        entry.files[scale] = { image: `${name}.png`, atlas: `${name}.json` };
      }
      written.push(name);
    }
    manifest.assets[key] = entry;
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  emit({ type: 'export', project: project.id });
  return { dir: exports, written };
}
