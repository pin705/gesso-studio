<script setup lang="ts">
import { Bot, HardDrive, User } from '@lucide/vue';
import type { Activity } from '~/utils/types';

const route = useRoute();
const id = computed(() => String(route.params.id));
const { current } = useProjects();
const { data: items, refresh } = await useFetch<Activity[]>(() => `/api/projects/${id.value}/activity`, { default: () => [] });
useLive((event) => event.project === id.value && event.type === 'activity' && refresh());
useHead({ title: () => `Activity · ${current.value?.name ?? 'Gesso'}` });
const icons = { ai: Bot, user: User, system: HardDrive } as const;
const who = { ai: 'AI', user: 'You', system: 'Disk' } as const;
</script>

<template>
  <PageHeader :crumbs="[{ label: current?.name ?? 'Project', to: `/p/${id}` }, { label: 'Activity' }]" />
  <div class="mx-auto w-full max-w-3xl p-6">
    <h1 class="mb-1 text-2xl font-semibold tracking-tight">Activity</h1>
    <p class="mb-6 text-sm text-muted-foreground">Everything your AI and you did in this project, live.</p>
    <p v-if="!items.length" class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No activity yet.</p>
    <ol class="relative grid gap-1 border-l pl-6">
      <li v-for="item in items" :key="item.id" class="relative py-2">
        <span class="absolute top-2.5 -left-[35px] grid size-6 place-items-center rounded-full border bg-background" :class="item.actor === 'ai' && 'border-brand/50 text-brand'">
          <component :is="icons[item.actor]" class="size-3.5" />
        </span>
        <div class="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span class="font-medium">{{ who[item.actor] }}</span>
          <NuxtLink v-if="item.asset" :to="`/p/${id}/a/${item.asset}`" class="hover:underline">{{ item.message }}</NuxtLink>
          <span v-else>{{ item.message }}</span>
          <span class="ml-auto text-xs text-muted-foreground">{{ timeAgo(item.created_at) }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>
