export default defineEventHandler(async () => {
  const project = await installSample();
  return project;
});
