<script setup lang="ts">
import { Download, FileJson, Image, Loader2, Package } from '@lucide/vue';
import { toast } from 'vue-sonner';
import type { AssetSummary } from '~/utils/types';

const route = useRoute();
const id = computed(() => String(route.params.id));
const { current } = useProjects();
const { data: assets } = await useFetch<AssetSummary[]>(() => `/api/projects/${id.value}/assets`, { default: () => [] });
const { data: exported, refresh } = await useFetch<{ dir: string; files: string[]; manifest: any }>(() => `/api/projects/${id.value}/exports`);
useLive((event) => event.project === id.value && event.type === 'export' && refresh());
useHead({ title: () => `Exports · ${current.value?.name ?? 'Gesso'}` });

const selected = ref<string[]>([]);
const onlyApproved = ref(false);
const scales = ref<string[]>(['1', '2']);
const running = ref(false);
const pickable = computed(() => assets.value.filter((asset) => !onlyApproved.value || asset.status === 'approved'));
const toggle = (key: string) => (selected.value = selected.value.includes(key) ? selected.value.filter((item) => item !== key) : [...selected.value, key]);

async function run() {
  running.value = true;
  try {
    const keys = selected.value.length ? selected.value : pickable.value.map((asset) => asset.key);
    const result = await $fetch<{ written: string[] }>(`/api/projects/${id.value}/exports`, { method: 'POST', body: { keys, scales: scales.value.map(Number) } });
    toast.success(`Exported ${result.written.length} file set(s)`);
    await refresh();
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    running.value = false;
  }
}
const fileUrl = (name: string, download = false) => `/files/${id.value}/exports/${encodeURIComponent(name)}${download ? '?download' : ''}`;
</script>

<template>
  <PageHeader :crumbs="[{ label: current?.name ?? 'Project', to: `/p/${id}` }, { label: 'Exports' }]" />
  <div class="mx-auto grid w-full max-w-6xl gap-6 p-6 lg:grid-cols-[360px_1fr]">
    <Card class="h-fit">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base"><Package class="size-4" /> Export for your engine</CardTitle>
        <CardDescription>Transparent PNGs per scale, sprite sheets with TexturePacker-style JSON for animations, and a manifest with 9-slice insets.</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid gap-2">
          <Label>Scales</Label>
          <ToggleGroup v-model="scales" type="multiple" variant="outline" size="sm" class="justify-start">
            <ToggleGroupItem v-for="scale in ['1', '2', '3', '4']" :key="scale" :value="scale" class="px-3">@{{ scale }}x</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div class="flex items-center justify-between">
          <Label for="approved-only">Approved assets only</Label>
          <Switch id="approved-only" v-model="onlyApproved" />
        </div>
        <div class="grid gap-2">
          <Label>Assets <span class="font-normal text-muted-foreground">({{ selected.length || `all ${pickable.length}` }})</span></Label>
          <ScrollArea class="h-64 rounded-md border">
            <div class="grid gap-0.5 p-1">
              <button v-for="asset in pickable" :key="asset.key" class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent" :class="selected.includes(asset.key) && 'bg-accent'" @click="toggle(asset.key)">
                <AssetThumb :src="assetUrl(id, asset.key, asset.updated_at)" class="size-7 shrink-0 rounded" :padded="false" />
                <span class="flex-1 truncate font-mono">{{ asset.key }}</span>
                <StatusBadge :status="asset.status" />
              </button>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter>
        <Button class="w-full" :disabled="running || !scales.length || !pickable.length" @click="run">
          <Loader2 v-if="running" class="size-4 animate-spin" /><Download v-else class="size-4" />
          {{ running ? 'Rendering…' : 'Export' }}
        </Button>
      </CardFooter>
    </Card>

    <div class="min-w-0">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 class="font-semibold">Output</h2>
        <span class="truncate font-mono text-xs text-muted-foreground">{{ exported?.dir }}</span>
      </div>
      <p v-if="!exported?.files.length" class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing exported yet.</p>
      <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="name in exported.files" :key="name" class="overflow-hidden rounded-lg border bg-card">
          <AssetThumb v-if="name.endsWith('.png')" :src="fileUrl(name)" class="aspect-video" />
          <div v-else class="grid aspect-video place-items-center bg-muted/30"><FileJson class="size-8 text-muted-foreground" /></div>
          <div class="flex items-center gap-2 border-t px-3 py-2">
            <Image v-if="name.endsWith('.png')" class="size-3.5 shrink-0 text-muted-foreground" /><FileJson v-else class="size-3.5 shrink-0 text-muted-foreground" />
            <span class="flex-1 truncate font-mono text-xs">{{ name }}</span>
            <Button variant="ghost" size="icon" class="size-7" as-child><a :href="fileUrl(name, true)" :aria-label="`Download ${name}`"><Download class="size-3.5" /></a></Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
