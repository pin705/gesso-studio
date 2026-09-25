<script setup lang="ts">
withDefaults(defineProps<{ src: string; alt?: string; padded?: boolean }>(), { alt: '', padded: true });
</script>

<template>
  <div class="checker grid place-items-center overflow-hidden" :class="padded && 'p-3'">
    <img :src="src" :alt="alt" loading="lazy" draggable="false" class="max-h-full max-w-full object-contain" />
  </div>
</template>
