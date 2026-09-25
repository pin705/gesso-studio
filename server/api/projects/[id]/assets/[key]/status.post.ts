export default defineEventHandler(async (event) => {
  const { status } = await readBody<{ status: AssetStatus }>(event);
  setStatus(projectParam(event), keyParam(event), status);
  return { ok: true };
});
