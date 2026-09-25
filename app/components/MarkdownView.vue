<script setup lang="ts">
import MarkdownIt from 'markdown-it';

const props = defineProps<{ source: string }>();
// html: false escapes raw HTML, so an agent-written art bible cannot inject script into the studio.
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const html = computed(() => markdown.render(props.source ?? ''));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- rendered with html disabled -->
  <div class="prose-gesso" v-html="html" />
</template>
