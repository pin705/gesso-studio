<script setup lang="ts">
import { Activity, BookOpen, Download, FolderOpen, GraduationCap, Image, LayoutGrid, Plug, Search } from '@lucide/vue';
import { useEventListener } from '@vueuse/core';
import type { AssetSummary } from '~/utils/types';

const open = ref(false);
const { current, projects } = useProjects();
const assets = ref<AssetSummary[]>([]);

watch(open, async (value) => {
  if (value && current.value) assets.value = await $fetch<AssetSummary[]>(`/api/projects/${current.value.id}/assets`);
});

useEventListener('keydown', (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    open.value = !open.value;
  }
});

function go(to: string) {
  open.value = false;
  void navigateTo(to);
}
</script>

<template>
  <Button variant="outline" size="sm" class="h-8 w-40 justify-start gap-2 text-muted-foreground sm:w-56" @click="open = true">
    <Search class="size-4" /><span class="flex-1 text-left">Search…</span><Kbd>⌘K</Kbd>
  </Button>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Jump to an asset, page or project…" />
    <CommandList>
      <CommandEmpty>Nothing found.</CommandEmpty>
      <CommandGroup v-if="current && assets.length" :heading="`Assets in ${current.name}`">
        <CommandItem v-for="asset in assets" :key="asset.key" :value="`asset ${asset.key} ${asset.type}`" @select="go(`/p/${current.id}/a/${asset.key}`)">
          <Image class="size-4" /><span class="font-mono text-xs">{{ asset.key }}</span><span class="ml-auto text-xs text-muted-foreground">{{ asset.type }}</span>
        </CommandItem>
      </CommandGroup>
      <CommandGroup v-if="current" heading="Project">
        <CommandItem value="library" @select="go(`/p/${current.id}`)"><LayoutGrid class="size-4" /> Library</CommandItem>
        <CommandItem value="art bible" @select="go(`/p/${current.id}/bible`)"><BookOpen class="size-4" /> Art bible</CommandItem>
        <CommandItem value="exports" @select="go(`/p/${current.id}/exports`)"><Download class="size-4" /> Exports</CommandItem>
        <CommandItem value="activity" @select="go(`/p/${current.id}/activity`)"><Activity class="size-4" /> Activity</CommandItem>
      </CommandGroup>
      <CommandGroup heading="Studio">
        <CommandItem v-for="project in projects" :key="project.id" :value="`project ${project.name}`" @select="go(`/p/${project.id}`)"><FolderOpen class="size-4" /> {{ project.name }}</CommandItem>
        <CommandItem value="knowledge base guides" @select="go('/guides')"><GraduationCap class="size-4" /> Knowledge base</CommandItem>
        <CommandItem value="connect ai mcp" @select="go('/connect')"><Plug class="size-4" /> Connect AI</CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
