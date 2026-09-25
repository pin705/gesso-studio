export default defineEventHandler((event) => {
  deleteFeedback(projectParam(event), Number(getRouterParam(event, 'fid')));
  return { ok: true };
});
