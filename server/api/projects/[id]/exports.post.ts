export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const { keys = [], scales = [1, 2] } = await readBody<{ keys?: string[]; scales?: number[] }>(event);
  const result = await exportAssets(project, keys, scales.map(Number));
  logActivity(project, 'user', 'export', `Exported ${result.written.length} file set(s)`);
  return result;
});
