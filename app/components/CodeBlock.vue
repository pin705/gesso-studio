<script setup lang="ts">
defineProps<{ code: string; title?: string }>();
</script>

<template>
  <div class="overflow-hidden rounded-lg border bg-muted/40">
    <div class="flex items-center justify-between gap-2 border-b px-3 py-1.5">
      <span class="text-xs text-muted-foreground">{{ title }}</span>
      <CopyButton :value="code" class="h-7" />
    </div>
    <pre class="overflow-x-auto p-3 font-mono text-xs leading-6 whitespace-pre-wrap break-all">{{ code }}</pre>
  </div>
</template>
