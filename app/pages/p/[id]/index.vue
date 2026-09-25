<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { Download, Layers, MessageSquare, Plug, Search } from '@lucide/vue';
import type { AssetStatus, AssetSummary } from '~/utils/types';

const route = useRoute();
const id = computed(() => String(route.params.id));
const { current } = useProjects();
const { data: assets, refresh, status: loading } = await useFetch<AssetSummary[]>(() => `/api/projects/${id.value}/assets`, { default: () => [] });
useLive((event) => event.project === id.value && ['asset', 'feedback'].includes(event.type) && refresh());
useHead({ title: () => `${current.value?.name ?? 'Library'} · Gesso` });
onMounted(() => $fetch(`/api/projects/${id.value}/open`, { method: 'POST' }).catch(() => undefined));

const search = ref('');
const status = ref<'all' | AssetStatus>('all');
const type = ref('all');
const sort = useLocalStorage<'updated' | 'name' | 'type'>('gesso-library-sort', 'updated');
const size = useLocalStorage('gesso-library-size', [180]);

// Variants ("btn-play.pressed") are grouped under their master so the grid shows one card per design.
const groups = computed(() => {
  const byMaster = new Map<string, AssetSummary[]>();
  for (const asset of assets.value) {
    const list = byMaster.get(masterKey(asset.key)) ?? [];
    list.push(asset);
    byMaster.set(masterKey(asset.key), list);
  }
  return [...byMaster.values()].map((list) => {
    const sorted = [...list].sort((a, b) => a.key.length - b.key.length || a.key.localeCompare(b.key));
    return { master: sorted[0]!, variants: sorted.slice(1), updated: Math.max(...list.map((item) => item.updated_at)), feedback: list.reduce((sum, item) => sum + item.open_feedback, 0) };
  });
});
const counts = computed(() => {
  const result: Record<string, number> = { all: assets.value.length };
  for (const asset of assets.value) result[asset.status] = (result[asset.status] ?? 0) + 1;
  return result;
});
const types = computed(() => [...new Set(assets.value.map((asset) => asset.type))].sort());
const visible = computed(() => {
  const query = search.value.trim().toLowerCase();
  return groups.value
    .filter((group) => status.value === 'all' || [group.master, ...group.variants].some((asset) => asset.status === status.value))
    .filter((group) => type.value === 'all' || group.master.type === type.value)
    .filter((group) => !query || [group.master, ...group.variants].some((asset) => `${asset.key} ${asset.type} ${asset.style}`.toLowerCase().includes(query)))
    .sort((a, b) => (sort.value === 'updated' ? b.updated - a.updated : sort.value === 'type' ? a.master.type.localeCompare(b.master.type) || a.master.key.localeCompare(b.master.key) : a.master.key.localeCompare(b.master.key)));
});
const filters: { value: 'all' | AssetStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'review', label: 'Needs review' },
  { value: 'changes', label: 'Changes requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'draft', label: 'Draft' }
];
</script>

<template>
  <PageHeader :crumbs="[{ label: current?.name ?? 'Project', to: `/p/${id}` }, { label: 'Library' }]">
    <Button variant="outline" size="sm" as-child><NuxtLink :to="`/p/${id}/exports`"><Download class="size-4" /> Export</NuxtLink></Button>
  </PageHeader>

  <div class="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
    <Tabs v-model="status">
      <TabsList>
        <TabsTrigger v-for="filter in filters" :key="filter.value" :value="filter.value" class="gap-1.5">
          {{ filter.label }}<span class="text-xs text-muted-foreground tabular-nums">{{ counts[filter.value] ?? 0 }}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
    <div class="relative ml-auto">
      <Search class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="search" placeholder="Filter assets" class="h-8 w-48 pl-8" />
    </div>
    <Select v-model="type">
      <SelectTrigger size="sm" class="w-32"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All types</SelectItem>
        <SelectItem v-for="item in types" :key="item" :value="item" class="capitalize">{{ item }}</SelectItem>
      </SelectContent>
    </Select>
    <Select v-model="sort">
      <SelectTrigger size="sm" class="w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="updated">Recently updated</SelectItem>
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="type">Type</SelectItem>
      </SelectContent>
    </Select>
    <Slider v-model="size" :min="120" :max="320" :step="10" class="w-24" aria-label="Thumbnail size" />
  </div>

  <div class="flex-1 p-4">
    <div v-if="loading !== 'pending' && !assets.length" class="mx-auto mt-10 grid max-w-xl place-items-center rounded-xl border border-dashed p-10 text-center">
      <Plug class="mb-3 size-8 text-muted-foreground" />
      <h2 class="text-lg font-semibold">No art yet</h2>
      <p class="mt-1 text-sm text-muted-foreground">Connect your AI agent to this project and ask it for an art bible and a first asset. New work appears here the moment it is saved.</p>
      <Button class="mt-5" as-child><NuxtLink to="/connect">Connect AI</NuxtLink></Button>
    </div>
    <p v-else-if="!visible.length && assets.length" class="mt-10 text-center text-sm text-muted-foreground">No assets match these filters.</p>
    <div class="grid gap-3" :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${size[0]}px, 1fr))` }">
      <NuxtLink v-for="group in visible" :key="group.master.key" :to="`/p/${id}/a/${group.master.key}`" class="group overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-lg">
        <div class="relative aspect-square">
          <AssetThumb :src="assetUrl(id, group.master.key, group.master.updated_at)" class="size-full" />
          <div class="absolute top-2 left-2 flex gap-1">
            <Badge v-if="group.variants.length" variant="secondary" class="gap-1 bg-background/80 backdrop-blur"><Layers class="size-3" />{{ group.variants.length + 1 }}</Badge>
            <Badge v-if="group.feedback" class="gap-1 bg-warning text-black"><MessageSquare class="size-3" />{{ group.feedback }}</Badge>
          </div>
        </div>
        <div class="grid gap-1.5 border-t p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate font-mono text-xs font-medium">{{ group.master.key }}</span>
            <span class="shrink-0 text-[11px] text-muted-foreground">r{{ group.master.revision }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-[11px] text-muted-foreground capitalize">{{ group.master.type }} · {{ group.master.width }}×{{ group.master.height }}</span>
            <StatusBadge :status="group.master.status" />
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
