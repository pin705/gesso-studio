export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const key = keyParam(event);
  requireAsset(project, key);
  const result = await rereview(project, key);
  return result.report;
});
