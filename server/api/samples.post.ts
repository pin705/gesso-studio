export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string } | null>(event).catch(() => null);
  return installSample(body?.name);
});
