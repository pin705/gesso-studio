export default defineNitroPlugin(async (nitro) => {
  for (const project of listProjects()) {
    await syncProject(project).catch(() => undefined);
    lintInBackground(project, unlintedKeys(project));
    watchProject(project);
  }
  nitro.hooks.hook('close', async () => {
    for (const project of listProjects()) unwatchProject(project);
    await closeBrowser();
  });
});
