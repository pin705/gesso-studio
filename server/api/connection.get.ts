/** What the studio needs to show connection instructions and whether an agent has been active. */
export default defineEventHandler((event) => {
  const last = useDb().prepare("SELECT created_at FROM activity WHERE actor = 'ai' ORDER BY id DESC LIMIT 1").get() as { created_at: number } | undefined;
  return {
    mcpUrl: `${getRequestURL(event).origin}/mcp`,
    bridge: process.env.GESSO_BIN ?? null,
    lastAgentActivity: last?.created_at ?? null,
    dataDir: dataDir()
  };
});
