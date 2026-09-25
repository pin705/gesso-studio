<script setup lang="ts">
withDefaults(defineProps<{ src: string; alt?: string; padded?: boolean; live?: boolean }>(), { alt: '', padded: true, live: false });
</script>

<template>
  <div class="checker grid place-items-center overflow-hidden" :class="padded && 'p-3'">
    <!-- mockups reference other files, which <img> refuses to load -->
    <object v-if="live" :data="src" type="image/svg+xml" class="pointer-events-none size-full [color-scheme:normal]" />
    <img v-else :src="src" :alt="alt" loading="lazy" draggable="false" class="max-h-full max-w-full object-contain" />
  </div>
</template>
