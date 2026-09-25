import type { H3Event } from 'h3';

export const projectParam = (event: H3Event) => requireProject(getRouterParam(event, 'id') ?? '');
export const keyParam = (event: H3Event) => assertKey(decodeURIComponent(getRouterParam(event, 'key') ?? ''));

const HTML_CSP = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'"
].join('; ');

/**
 * HTML assets run in a sandboxed iframe (opaque origin) and may only load local files and the kit.
 * The player script lets the studio pause and scrub their animations.
 */
export function sendHtml(event: H3Event, html: string) {
  setResponseHeaders(event, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': HTML_CSP, 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' });
  const player = '<script src="/kit/player.js"></script>';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (tag) => `${tag}${player}`) : `${player}${html}`;
}

/** SVG may come from anywhere; never let it run script in the studio origin. */
export function sendSvg(event: H3Event, svg: string) {
  setResponseHeaders(event, {
    'content-type': 'image/svg+xml',
    'content-security-policy': "script-src 'none'",
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store'
  });
  return svg;
}
