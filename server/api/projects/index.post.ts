export default defineEventHandler(async (event) => {
  const { path, name } = await readBody<{ path?: string; name?: string }>(event);
  if (!path?.trim()) throw createError({ statusCode: 400, message: 'Folder path is required.' });
  return touchProject(await addProject(path.trim(), name));
});
