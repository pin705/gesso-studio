<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import { Check, ChevronLeft, ChevronRight, Download, FileCode, MessageSquareWarning, MoreHorizontal, RefreshCw, Trash2 } from '@lucide/vue';
import { toast } from 'vue-sonner';
import type { AssetDetail, AssetStatus, AssetSummary } from '~/utils/types';

const route = useRoute();
const id = computed(() => String(route.params.id));
const key = computed(() => String(route.params.key));
const { current } = useProjects();

const { data: asset, refresh, error } = await useFetch<AssetDetail>(() => `/api/projects/${id.value}/assets/${encodeURIComponent(key.value)}`);
const { data: all, refresh: refreshAll } = await useFetch<AssetSummary[]>(() => `/api/projects/${id.value}/assets`, { default: () => [] });
useLive((event) => {
  if (event.project !== id.value) return;
  if (event.type === 'asset' || event.type === 'feedback') {
    void refreshAll();
    if (!event.asset || event.asset === key.value) void refresh();
  }
});
useHead({ title: () => `${key.value} · Gesso` });

const tab = ref('review');
const annotate = ref(false);
const pending = ref<{ x: number; y: number } | null>(null);
const comparing = ref<number | null>(null);
const busy = ref(false);
watch(key, () => {
  comparing.value = null;
  pending.value = null;
});

const version = computed(() => asset.value?.updated_at ?? 0);
const src = computed(() => assetUrl(id.value, key.value, version.value, asset.value?.format));
const still = computed(() => (asset.value?.format === 'html' ? thumbUrl(id.value, key.value, version.value, { scale: 1 }) : src.value));
const masters = computed(() => all.value.filter((item) => !item.key.includes('.')));
const position = computed(() => masters.value.findIndex((item) => item.key === masterKey(key.value)));
const neighbour = (offset: number) => masters.value[(position.value + offset + masters.value.length) % masters.value.length];
const openCount = computed(() => asset.value?.feedback.filter((item) => item.status === 'open').length ?? 0);

function go(offset: number) {
  const next = neighbour(offset);
  if (next) void navigateTo(`/p/${id.value}/a/${next.key}`);
}
const typing = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName ?? '').toUpperCase());
onKeyStroke('ArrowRight', () => !typing() && go(1));
onKeyStroke('ArrowLeft', () => !typing() && go(-1));

async function setStatus(status: AssetStatus) {
  await $fetch(`/api/projects/${id.value}/assets/${key.value}/status`, { method: 'POST', body: { status } });
  await refresh();
  toast.success(status === 'approved' ? 'Approved' : `Marked ${STATUS_META[status].label.toLowerCase()}`);
}
function requestChanges() {
  tab.value = 'feedback';
  void setStatus('changes');
}
function onPin(x: number, y: number) {
  pending.value = { x, y };
  tab.value = 'feedback';
}
async function restore(number: number) {
  try {
    const { revision } = await $fetch<{ revision: number }>(`/api/projects/${id.value}/assets/${key.value}/restore`, { method: 'POST', body: { revision: number } });
    comparing.value = null;
    await refresh();
    toast.success(`Restored r${number} as r${revision}`);
  } catch (cause) {
    toast.error(errorMessage(cause));
  }
}
async function rerun() {
  busy.value = true;
  try {
    await $fetch(`/api/projects/${id.value}/assets/${key.value}/review`, { method: 'POST' });
    await refresh();
  } catch (cause) {
    toast.error(errorMessage(cause));
  } finally {
    busy.value = false;
  }
}
async function remove() {
  if (!confirm(`Delete ${key.value}? The SVG file is removed from the project folder.`)) return;
  await $fetch(`/api/projects/${id.value}/assets/${key.value}`, { method: 'DELETE' });
  await navigateTo(`/p/${id.value}`);
}
async function downloadPng(factor: number) {
  if (!asset.value) return;
  if (asset.value.format === 'html') {
    window.location.href = `${thumbUrl(id.value, key.value, version.value, { scale: factor })}&download`;
    return;
  }
  const image = new Image();
  image.src = src.value;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(asset.value.width * factor);
  canvas.height = Math.ceil(asset.value.height * factor);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${key.value}${factor === 1 ? '' : `@${factor}x`}.png`;
  link.click();
}
</script>

<template>
  <PageHeader :crumbs="[{ label: current?.name ?? 'Project', to: `/p/${id}` }, { label: 'Library', to: `/p/${id}` }, { label: key }]">
    <template v-if="asset">
      <StatusBadge :status="asset.status" class="hidden md:inline-flex" />
      <div class="flex">
        <Button variant="ghost" size="icon" class="size-8" title="Previous (←)" @click="go(-1)"><ChevronLeft class="size-4" /></Button>
        <Button variant="ghost" size="icon" class="size-8" title="Next (→)" @click="go(1)"><ChevronRight class="size-4" /></Button>
      </div>
      <Button variant="outline" size="sm" @click="requestChanges"><MessageSquareWarning class="size-4" /> Request changes</Button>
      <Button size="sm" :disabled="asset.status === 'approved'" @click="setStatus('approved')"><Check class="size-4" /> Approve</Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child><Button variant="ghost" size="icon" class="size-8" aria-label="More"><MoreHorizontal class="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem as-child><a :href="`${src}`" :download="`${key}.${asset.format}`"><FileCode class="size-4" /> Download source (.{{ asset.format }})</a></DropdownMenuItem>
          <DropdownMenuItem @select="downloadPng(1)"><Download class="size-4" /> Download PNG</DropdownMenuItem>
          <DropdownMenuItem @select="downloadPng(2)"><Download class="size-4" /> Download PNG @2x</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="rerun"><RefreshCw class="size-4" /> Re-run review</DropdownMenuItem>
          <DropdownMenuItem @select="setStatus('draft')">Move back to draft</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive" @select="remove"><Trash2 class="size-4" /> Delete asset</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </PageHeader>

  <div v-if="error" class="grid flex-1 place-items-center text-sm text-muted-foreground">
    <div class="text-center">
      <p>This asset no longer exists.</p>
      <Button variant="link" as-child><NuxtLink :to="`/p/${id}`">Back to the library</NuxtLink></Button>
    </div>
  </div>

  <div v-else-if="asset" class="flex min-h-0 flex-1 flex-col lg:flex-row">
    <section class="flex min-h-[60vh] min-w-0 flex-1 flex-col">
      <div v-if="asset.variants.length > 1" class="flex items-center gap-1 overflow-x-auto border-b px-3 py-1.5">
        <span class="mr-2 text-xs text-muted-foreground">States</span>
        <NuxtLink
          v-for="variant in asset.variants"
          :key="variant.key"
          :to="`/p/${id}/a/${variant.key}`"
          class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs"
          :class="variant.key === key ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/60'"
        >
          <span class="size-1.5 rounded-full" :class="STATUS_META[variant.status].dot" />
          {{ variant.key.includes('.') ? variant.key.split('.').slice(1).join('.') : 'normal' }}
        </NuxtLink>
      </div>
      <AssetViewer
        v-model:annotate="annotate"
        :src="src"
        :image-src="still"
        :format="asset.format"
        :width="asset.width"
        :height="asset.height"
        :duration="asset.duration"
        :frames="asset.frames"
        :nine-slice="asset.nineSlice"
        :pins="asset.feedback"
        :compare-src="comparing ? (asset.format === 'html' ? thumbUrl(id, key, comparing, { rev: comparing, scale: 1 }) : revisionUrl(id, key, comparing)) : null"
        :compare-label="`r${comparing}`"
        @pin="onPin"
        @close-compare="comparing = null"
      />
    </section>

    <aside class="flex min-h-0 w-full shrink-0 flex-col border-t lg:w-[380px] lg:border-t-0 lg:border-l">
      <Tabs v-model="tab" class="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList class="m-3 mb-0 grid grid-cols-4">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="feedback" class="gap-1">Feedback<span v-if="openCount" class="rounded-full bg-warning px-1.5 text-[10px] text-black">{{ openCount }}</span></TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <ScrollArea class="min-h-0 flex-1">
          <div class="p-4">
            <TabsContent value="review"><AssetReview :asset="asset" :busy="busy" @rerun="rerun" /></TabsContent>
            <TabsContent value="feedback">
              <AssetFeedback :project="id" :asset="asset" :pending="pending" @changed="refresh" @clear-pin="pending = null" @request-pin="annotate = true" />
            </TabsContent>
            <TabsContent value="history">
              <AssetHistory :project="id" :asset="asset" :comparing="comparing" @compare="(number) => (comparing = number)" @restore="restore" />
            </TabsContent>
            <TabsContent value="details">
              <dl class="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt class="text-muted-foreground">Id</dt><dd class="flex items-center gap-1 font-mono text-xs">{{ asset.key }}<CopyButton :value="asset.key" label="" class="ml-auto h-6 px-1.5" /></dd>
                <dt class="text-muted-foreground">Type</dt><dd class="capitalize">{{ asset.type }}</dd>
                <dt v-if="asset.style" class="text-muted-foreground">Style</dt><dd v-if="asset.style">{{ asset.style }}</dd>
                <dt class="text-muted-foreground">Size</dt><dd>{{ asset.width }} × {{ asset.height }} px</dd>
                <template v-if="asset.nineSlice"><dt class="text-muted-foreground">9-slice</dt><dd class="font-mono text-xs">{{ asset.nineSlice.join(' · ') }}</dd></template>
                <template v-if="asset.duration"><dt class="text-muted-foreground">Animation</dt><dd>{{ asset.duration }}s · {{ asset.frames || 12 }} frames</dd></template>
                <dt class="text-muted-foreground">Revisions</dt><dd>{{ asset.revisions.length }}</dd>
                <dt class="text-muted-foreground">File</dt><dd class="font-mono text-xs break-all text-muted-foreground">assets/{{ asset.key }}.svg</dd>
              </dl>
              <Separator class="my-4" />
              <p class="text-xs leading-5 text-muted-foreground">Shortcuts: <Kbd>G</Kbd> values · <Kbd>F</Kbd> fit · <Kbd>1</Kbd> actual size · <Kbd>Space</Kbd> play · <Kbd>,</Kbd> <Kbd>.</Kbd> frame · <Kbd>←</Kbd> <Kbd>→</Kbd> asset · scroll to zoom, drag to pan.</p>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  </div>
</template>
