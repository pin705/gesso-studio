import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Server-rendered PNGs of an asset: correct for HTML/kit assets, mockups (nested files) and animations (a middle frame).
//   ?rev=<n>     an older revision        ?scale=<0.25..4>  exact scale (downloads, 9-slice test)   default: fit 320px
// Cached on disk by content + options, so each revision renders once.
export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const row = requireAsset(project, keyParam(event));
  const query = getQuery(event);
  const rev = query.rev ? Number(query.rev) : 0;
  const scale = query.scale ? Math.min(4, Math.max(0.25, Number(query.scale) || 1)) : 0;
  const content = rev ? revisionSvg(project, row.key, rev) : null;
  // the kit renders the asset too, so its version is part of the key; a live kit (GESSO_KIT_DIR) is never cached
  const live = Boolean(process.env.GESSO_KIT_DIR);
  const digest = createHash('sha1').update(`${content ? createHash('sha1').update(content).digest('hex') : row.hash}|${scale}|${useRuntimeConfig().public.version}`).digest('hex');
  const cache = path.join(dataDir(), 'thumbs', `${digest}.png`);
  let png: Buffer | null = live ? null : await readFile(cache).catch(() => null);
  if (!png) {
    let file = assetPath(project, row.key);
    if (content) {
      // render old revisions next to the assets so relative references still resolve
      file = path.join(dirs(project).assets, `.rev-${row.key}-${rev}.${detectFormat(content)}`);
      await writeFile(file, content);
    }
    try {
      const shot = await captureAsset(file, { id: row.key, ...(scale ? { scale } : { fit: 320 }), times: [row.duration * 0.3] });
      if (shot.report.fatal || !shot.frames[0]) throw createError({ statusCode: 422, message: shot.report.fatal ?? 'Could not render' });
      png = shot.frames[0] as Buffer;
    } finally {
      if (content) await rm(file, { force: true });
    }
    if (!live) {
      await mkdir(path.dirname(cache), { recursive: true });
      await writeFile(cache, png!);
    }
  }
  setResponseHeaders(event, { 'content-type': 'image/png', 'cache-control': live ? 'no-store' : 'private, max-age=31536000, immutable' });
  if (query.download !== undefined) setResponseHeader(event, 'content-disposition', `attachment; filename="${row.key}${scale && scale !== 1 ? `@${scale}x` : ''}.png"`);
  return png;
});
