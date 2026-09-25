import { readFile } from 'node:fs/promises';
import path from 'node:path';

// The Gesso Kit: materials CSS, runtime helpers, self-hosted fonts, icon silhouettes and browser builds of
// Pixi, three and rough. Served at /kit to the studio and to the renderer.
const TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png'
};

interface IconSet {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
}
const sets = new Map<string, IconSet>();

async function iconSet(name: string): Promise<IconSet | null> {
  if (!['game-icons', 'lucide'].includes(name)) return null;
  if (!sets.has(name)) {
    const raw = process.env.GESSO_KIT_DIR
      ? await readFile(path.join(path.resolve(process.env.GESSO_KIT_DIR), 'icons', `${name}.json`), 'utf8')
      : await useStorage('assets:kit').getItem(`icons:${name}.json`);
    sets.set(name, (typeof raw === 'string' ? JSON.parse(raw) : raw) as IconSet);
  }
  return sets.get(name)!;
}

export async function iconSvg(set: string, name: string): Promise<string | null> {
  const icons = await iconSet(set);
  const icon = icons?.icons[name];
  if (!icons || !icon) return null;
  const width = icon.width ?? icons.width ?? 24;
  const height = icon.height ?? icons.height ?? 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${icon.body}</svg>`;
}

/** Icon names matching every word of the query, best matches first. */
export async function searchIcons(query: string, set = 'game-icons', limit = 40): Promise<string[]> {
  const icons = await iconSet(set);
  if (!icons) throw createError({ statusCode: 400, message: 'Icon sets: game-icons (4000+ game silhouettes, CC BY 3.0), lucide (UI glyphs, ISC).' });
  const words = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  return Object.keys(icons.icons)
    .filter((name) => words.every((word) => name.includes(word)))
    .sort((a, b) => a.length - b.length)
    .slice(0, limit);
}

/** A kit file by its path under /kit, or null. */
export async function kitFile(file: string): Promise<{ body: Buffer | string; type: string } | null> {
  const clean = file.replace(/^\/+/, '');
  if (clean.includes('..')) return null;
  const icon = clean.match(/^icons\/([a-z-]+)\/([a-z0-9-]+)\.svg$/);
  if (icon) {
    const svg = await iconSvg(icon[1]!, icon[2]!);
    return svg ? { body: svg, type: TYPES['.svg']! } : null;
  }
  // GESSO_KIT_DIR serves the kit straight from a checkout, so kit edits show up without a rebuild.
  const raw = process.env.GESSO_KIT_DIR
    ? await readFile(path.join(path.resolve(process.env.GESSO_KIT_DIR), clean)).catch(() => null)
    : await useStorage('assets:kit').getItemRaw(clean.replaceAll('/', ':'));
  if (raw === null || raw === undefined) return null;
  const ext = clean.slice(clean.lastIndexOf('.'));
  return { body: typeof raw === 'string' ? raw : Buffer.from(raw as Uint8Array), type: TYPES[ext] ?? 'application/octet-stream' };
}
