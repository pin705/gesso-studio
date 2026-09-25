<script setup lang="ts">
import { Bot, FileEdit, GitCompare, HardDrive, History, User } from '@lucide/vue';
import type { AssetDetail, Revision } from '~/utils/types';

const props = defineProps<{ project: string; asset: AssetDetail; comparing: number | null }>();
defineEmits<{ compare: [number]; restore: [number] }>();
const icons = { ai: Bot, disk: HardDrive, restore: History, user: User } as const;
const labels = { ai: 'AI', disk: 'Edited on disk', restore: 'Restored', user: 'You' } as const;
const latest = computed(() => props.asset.revisions[0]?.number);
const ago = timeAgo;
const issues = (revision: Revision) => (revision.lint ? revision.lint.errors.length + revision.lint.warnings.length : null);
</script>

<template>
  <div class="grid gap-2">
    <div v-for="revision in asset.revisions" :key="revision.number" class="flex gap-3 rounded-lg border p-2" :class="comparing === revision.number && 'border-brand'">
      <AssetThumb :src="revisionUrl(project, asset.key, revision.number)" class="size-16 shrink-0 rounded-md" :padded="false" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 text-xs">
          <span class="font-medium">r{{ revision.number }}</span>
          <component :is="icons[revision.source] ?? FileEdit" class="size-3.5 text-muted-foreground" />
          <span class="text-muted-foreground">{{ labels[revision.source] }} · {{ ago(revision.created_at) }}</span>
        </div>
        <p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{{ revision.note || '—' }}</p>
        <div class="mt-1.5 flex items-center gap-1">
          <Badge v-if="issues(revision) !== null" variant="secondary" class="text-[10px]">{{ issues(revision) ? `${issues(revision)} lint issue${issues(revision) === 1 ? '' : 's'}` : 'lint clean' }}</Badge>
          <template v-if="revision.number !== latest">
            <Button variant="ghost" size="sm" class="ml-auto h-6 px-2 text-[11px]" @click="$emit('compare', revision.number)"><GitCompare class="size-3" /> Compare</Button>
            <Button variant="ghost" size="sm" class="h-6 px-2 text-[11px]" @click="$emit('restore', revision.number)"><History class="size-3" /> Restore</Button>
          </template>
          <Badge v-else class="ml-auto text-[10px]">Current</Badge>
        </div>
      </div>
    </div>
  </div>
</template>
