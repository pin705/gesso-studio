import type { H3Event } from 'h3';

export const projectParam = (event: H3Event) => requireProject(getRouterParam(event, 'id') ?? '');
export const keyParam = (event: H3Event) => assertKey(decodeURIComponent(getRouterParam(event, 'key') ?? ''));

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
