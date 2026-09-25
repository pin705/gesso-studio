<script setup lang="ts">
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from '@lucide/vue';
import type { AssetDetail } from '~/utils/types';

const props = defineProps<{ asset: AssetDetail; busy?: boolean }>();
defineEmits<{ rerun: [] }>();
const latest = computed(() => props.asset.revisions[0]);
const lint = computed(() => latest.value?.lint ?? props.asset.revisions.find((revision) => revision.lint)?.lint ?? null);
const critique = computed(() => props.asset.revisions.find((revision) => revision.critique)?.critique ?? null);
const scores = computed(() => Object.entries(critique.value?.scores ?? {}));
</script>

<template>
  <div class="grid gap-5">
    <section>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-medium">Automated checks</h3>
        <Button variant="ghost" size="sm" class="h-7 text-xs" :disabled="busy" @click="$emit('rerun')"><RefreshCw class="size-3.5" :class="busy && 'animate-spin'" /> Re-run</Button>
      </div>
      <p v-if="!lint" class="text-sm text-muted-foreground">Not reviewed yet (edited on disk). Re-run to lint this revision.</p>
      <div v-else class="grid gap-2">
        <div v-if="!lint.errors.length && !lint.warnings.length" class="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"><CheckCircle2 class="size-4" /> Lint clean</div>
        <div v-for="error in lint.errors" :key="error" class="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs"><AlertCircle class="mt-0.5 size-3.5 shrink-0 text-destructive" />{{ error }}</div>
        <div v-for="warning in lint.warnings" :key="warning" class="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs"><AlertTriangle class="mt-0.5 size-3.5 shrink-0 text-warning" />{{ warning }}</div>
        <p v-if="lint.meta?.bounds" class="text-xs text-muted-foreground">Margins {{ lint.meta.bounds.top }} / {{ lint.meta.bounds.right }} / {{ lint.meta.bounds.bottom }} / {{ lint.meta.bounds.left }} px · fills {{ Math.round(lint.meta.bounds.fill * 100) }}% · {{ lint.meta.elements }} elements</p>
      </div>
    </section>

    <section>
      <h3 class="mb-2 text-sm font-medium">AI self-critique</h3>
      <p v-if="!critique" class="text-sm text-muted-foreground">The agent has not submitted rubric scores for this asset yet.</p>
      <div v-else class="grid gap-2.5">
        <div v-for="[name, score] in scores" :key="name" class="grid grid-cols-[7rem_1fr_1.5rem] items-center gap-2 text-xs">
          <span class="capitalize text-muted-foreground">{{ name.replace(/[_-]/g, ' ') }}</span>
          <div class="h-1.5 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full" :class="score >= 4 ? 'bg-success' : score >= 3 ? 'bg-warning' : 'bg-destructive'" :style="{ width: `${Math.min(100, (score / 5) * 100)}%` }" />
          </div>
          <span class="text-right tabular-nums">{{ score }}</span>
        </div>
        <p v-if="critique.notes" class="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">{{ critique.notes }}</p>
      </div>
    </section>
  </div>
</template>
