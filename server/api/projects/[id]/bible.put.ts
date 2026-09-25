export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const { markdown } = await readBody<{ markdown?: string }>(event);
  if (typeof markdown !== 'string') throw createError({ statusCode: 400, message: 'markdown is required.' });
  await writeBible(project, markdown, 'user');
  return { ok: true };
});
