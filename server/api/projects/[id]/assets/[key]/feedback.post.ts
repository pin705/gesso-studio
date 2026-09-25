export default defineEventHandler(async (event) => {
  const body = await readBody<{ body: string; x?: number; y?: number }>(event);
  addFeedback(projectParam(event), keyParam(event), body);
  return { ok: true };
});
