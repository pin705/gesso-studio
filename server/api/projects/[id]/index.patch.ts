export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const { name } = await readBody<{ name?: string }>(event);
  if (name) renameProject(project, name);
  return { ok: true };
});
