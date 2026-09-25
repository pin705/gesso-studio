// Gesso can write files and run a browser, so only local pages and local agents may talk to it.
// Checking Host blocks DNS rebinding; checking Origin blocks other websites posting to localhost.
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export default defineEventHandler((event) => {
  const extra = (process.env.GESSO_ALLOWED_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  const host = getRequestHeader(event, 'host') ?? '';
  if (!LOCAL_HOST.test(host) && !extra.includes(host)) throw createError({ statusCode: 403, message: 'Gesso only accepts local connections.' });
  const origin = getRequestHeader(event, 'origin');
  // Sandboxed asset previews have an opaque ("null") origin; they may only read the public kit.
  if (origin === 'null' && event.method === 'GET' && event.path.startsWith('/kit/')) return;
  if (origin && !LOCAL_ORIGIN.test(origin) && !extra.some((allowed) => origin.endsWith(`//${allowed}`))) {
    throw createError({ statusCode: 403, message: 'Cross-origin requests are not allowed.' });
  }
});
