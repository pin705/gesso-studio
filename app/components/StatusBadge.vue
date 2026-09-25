<script setup lang="ts">
import type { AssetStatus } from '~/utils/types';

defineProps<{ status: AssetStatus }>();
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="STATUS_META[status].tone">
    <span class="size-1.5 rounded-full bg-current" />{{ STATUS_META[status].label }}
  </span>
</template>
