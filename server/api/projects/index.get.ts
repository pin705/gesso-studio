export default defineEventHandler(() => {
  const active = activeProject();
  return listProjects().map((project) => {
    const counts = useDb().prepare(`SELECT COUNT(*) AS assets,
        SUM(status = 'approved') AS approved,
        (SELECT COUNT(*) FROM feedback f JOIN assets a2 ON a2.id = f.asset_id WHERE a2.project_id = ? AND f.status = 'open') AS feedback
      FROM assets WHERE project_id = ? AND deleted_at IS NULL`).get(project.id, project.id) as { assets: number; approved: number | null; feedback: number };
    const cover = useDb().prepare("SELECT key FROM assets WHERE project_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 4").all(project.id) as { key: string }[];
    return { ...project, active: project.id === active?.id, missing: !projectHasFolder(project), assets: counts.assets, approved: counts.approved ?? 0, feedback: counts.feedback, cover: cover.map((row) => row.key) };
  });
});
