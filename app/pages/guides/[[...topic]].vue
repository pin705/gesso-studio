<script setup lang="ts">
const route = useRoute();
const topic = computed(() => [route.params.topic ?? []].flat().join('/'));
const { data: index } = await useFetch<{ index: string; topics: string[] }>('/api/guides');
const { data: page } = await useFetch<{ markdown: string }>(() => (topic.value ? `/api/guides/${topic.value}` : '/api/guides'), { transform: (value: any) => ({ markdown: value.markdown ?? value.index }) });
const groups = computed(() => {
  const result: Record<string, string[]> = {};
  for (const item of index.value?.topics ?? []) (result[item.includes('/') ? item.split('/')[0]! : 'essentials'] ??= []).push(item);
  return result;
});
const label = (item: string) => item.split('/').at(-1)!.replace(/-/g, ' ');
useHead({ title: () => `${topic.value ? label(topic.value) : 'Knowledge base'} · Gesso` });
</script>

<template>
  <PageHeader :crumbs="[{ label: 'Knowledge base', to: '/guides' }, ...(topic ? [{ label: label(topic) }] : [])]" />
  <div class="flex min-h-0 flex-1">
    <nav class="hidden w-60 shrink-0 overflow-auto border-r p-4 md:block">
      <NuxtLink to="/guides" class="mb-3 block rounded-md px-2 py-1 text-sm font-medium" :class="!topic && 'bg-accent'">Overview</NuxtLink>
      <div v-for="(items, group) in groups" :key="group" class="mb-4">
        <div class="mb-1 px-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{{ group.replace('-', ' ') }}</div>
        <NuxtLink v-for="item in items" :key="item" :to="`/guides/${item}`" class="block rounded-md px-2 py-1 text-sm capitalize hover:bg-accent" :class="topic === item && 'bg-accent font-medium'">{{ label(item) }}</NuxtLink>
      </div>
    </nav>
    <article class="min-w-0 flex-1 overflow-auto p-6 lg:p-10">
      <p class="mb-6 max-w-3xl rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">These are the rules your AI reads before it draws. Improve them in <span class="font-mono">knowledge/</span> and every future asset gets better.</p>
      <MarkdownView class="max-w-3xl" :source="page?.markdown ?? ''" />
    </article>
  </div>
</template>
