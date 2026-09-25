export default defineEventHandler(async (event) => {
  const body = await readBody<{ status?: 'open' | 'resolved'; reply?: string }>(event);
  updateFeedback(projectParam(event), Number(getRouterParam(event, 'fid')), body, 'user');
  return { ok: true };
});
