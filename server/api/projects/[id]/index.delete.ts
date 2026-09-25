export default defineEventHandler((event) => {
  removeProject(projectParam(event));
  return { ok: true };
});
