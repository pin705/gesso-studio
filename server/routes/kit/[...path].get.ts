// Kit files are public, read-only and licensed for redistribution, so any origin may load them
// (sandboxed asset previews run with an opaque origin and import modules from here).
export default defineEventHandler(async (event) => {
  const file = await kitFile(getRouterParam(event, 'path') ?? '');
  if (!file) throw createError({ statusCode: 404 });
  setResponseHeaders(event, { 'content-type': file.type, 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
  return file.body;
});
