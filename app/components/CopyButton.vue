<script setup lang="ts">
import { Check, Copy } from '@lucide/vue';

const props = defineProps<{ value: string; label?: string }>();
const copied = ref(false);
async function copy() {
  await navigator.clipboard.writeText(props.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <Button variant="outline" size="sm" @click="copy">
    <Check v-if="copied" class="size-4 text-success" /><Copy v-else class="size-4" />
    {{ copied ? 'Copied' : (label ?? 'Copy') }}
  </Button>
</template>
