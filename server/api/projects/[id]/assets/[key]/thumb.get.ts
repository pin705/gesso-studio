import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Server-rendered thumbnails: correct for HTML/kit assets, mockups (nested images) and animations (a middle frame).
// Cached on disk by content hash, so each revision renders once.
export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const row = requireAsset(project, keyParam(event));
  const cache = path.join(dataDir(), 'thumbs', `${row.hash}.png`);
  let png = await readFile(cache).catch(() => null);
  if (!png) {
    const shot = await captureAsset(assetPath(project, row.key), { id: row.key, fit: 320, times: [row.duration * 0.3] });
    if (shot.report.fatal || !shot.frames[0]) throw createError({ statusCode: 422, message: shot.report.fatal ?? 'Could not render' });
    png = shot.frames[0];
    await mkdir(path.dirname(cache), { recursive: true });
    await writeFile(cache, png);
  }
  setResponseHeaders(event, { 'content-type': 'image/png', 'cache-control': 'private, max-age=31536000, immutable' });
  return png;
});
