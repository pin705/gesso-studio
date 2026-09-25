export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const key = keyParam(event);
  requireAsset(project, key);
  await deleteAsset(project, key);
  return { ok: true };
});
