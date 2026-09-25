<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core';
import { Bot, CircleCheck, CircleDashed } from '@lucide/vue';

useHead({ title: 'Connect AI · Gesso' });
const { data } = await useFetch<{ mcpUrl: string; lastAgentActivity: number | null; dataDir: string }>('/api/connection');
const { current } = useProjects();
const lastSeen = useTimeAgo(computed(() => data.value?.lastAgentActivity ?? 0));

const project = computed(() => current.value?.path ?? '/path/to/my-game/art');
const url = computed(() => `${data.value?.mcpUrl ?? 'http://127.0.0.1:4477/mcp'}?project=${encodeURIComponent(project.value)}`);
const clients = computed(() => [
  { id: 'claude', name: 'Claude Code', note: 'HTTP transport', code: `claude mcp add --transport http gesso "${url.value}"` },
  { id: 'codex', name: 'Codex', note: '~/.codex/config.toml', code: `[mcp_servers.gesso]\nurl = "${url.value}"` },
  { id: 'cursor', name: 'Cursor · VS Code · Windsurf', note: 'mcp.json', code: JSON.stringify({ mcpServers: { gesso: { url: url.value } } }, null, 2) },
  { id: 'stdio', name: 'Claude Desktop & stdio-only clients', note: 'claude_desktop_config.json: the bridge starts Gesso when needed', code: JSON.stringify({ mcpServers: { gesso: { command: 'npx', args: ['-y', 'gesso-studio', 'mcp', '--project', project.value] } } }, null, 2) }
]);
const prompts = [
  'Read the Gesso project, propose an art bible for my cozy farming game, and wait for my OK.',
  'Make the main-menu button set (normal, pressed, disabled) following the art bible.',
  'Check the open feedback in Gesso and fix everything that was requested.',
  'Create 6 item icons for potions and gems, then view them side by side for consistency.'
];
</script>

<template>
  <PageHeader :crumbs="[{ label: 'Connect AI' }]" />
  <div class="mx-auto grid w-full max-w-5xl gap-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Connect your AI</h1>
        <p class="max-w-2xl text-sm text-muted-foreground">Gesso speaks MCP. Your agent creates and revises the art; you review it here. Commands below target <span class="font-mono text-foreground">{{ project }}</span>.</p>
      </div>
      <div class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
        <CircleCheck v-if="data?.lastAgentActivity" class="size-4 text-success" /><CircleDashed v-else class="size-4 text-muted-foreground" />
        {{ data?.lastAgentActivity ? `Agent active ${lastSeen}` : 'No agent activity yet' }}
      </div>
    </div>

    <Tabs default-value="claude">
      <TabsList class="flex-wrap">
        <TabsTrigger v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }}</TabsTrigger>
      </TabsList>
      <TabsContent v-for="client in clients" :key="client.id" :value="client.id" class="mt-4">
        <CodeBlock :code="client.code" :title="client.note" />
      </TabsContent>
    </Tabs>

    <Card>
      <CardHeader><CardTitle class="flex items-center gap-2 text-base"><Bot class="size-4" /> Then ask</CardTitle></CardHeader>
      <CardContent class="grid gap-2">
        <div v-for="prompt in prompts" :key="prompt" class="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span>“{{ prompt }}”</span><CopyButton :value="prompt" class="h-7 shrink-0" />
        </div>
      </CardContent>
    </Card>

    <p class="text-xs text-muted-foreground">Gesso only accepts connections from this computer. Data lives in <span class="font-mono">{{ data?.dataDir }}</span>; your art stays in each project folder.</p>
  </div>
</template>
