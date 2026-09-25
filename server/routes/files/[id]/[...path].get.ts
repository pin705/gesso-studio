import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TYPES: Record<string, string> = { '.png': 'image/png', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };

/** Project files (assets and exports) for the studio, confined to the project folder. */
export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const root = path.resolve(project.path);
  const file = path.resolve(root, decodeURIComponent(getRouterParam(event, 'path') ?? ''));
  if (!file.startsWith(root + path.sep) || path.basename(file).startsWith('.')) throw createError({ statusCode: 404 });
  const body = await readFile(file).catch(() => null);
  if (!body) throw createError({ statusCode: 404 });
  if (file.endsWith('.svg')) return sendSvg(event, body.toString('utf8'));
  if (file.endsWith('.html')) return sendHtml(event, body.toString('utf8'));
  setResponseHeaders(event, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' });
  if (getQuery(event).download !== undefined) setResponseHeader(event, 'content-disposition', `attachment; filename="${path.basename(file)}"`);
  return body;
});
