<script setup lang="ts">
import { Eye, Pencil, Save } from '@lucide/vue';
import { toast } from 'vue-sonner';

const route = useRoute();
const id = computed(() => String(route.params.id));
const { current } = useProjects();
const { data, refresh } = await useFetch<{ artBible: string; path: string }>(() => `/api/projects/${id.value}`);
useLive((event) => event.project === id.value && event.type === 'bible' && !editing.value && refresh());
useHead({ title: () => `Art bible · ${current.value?.name ?? 'Gesso'}` });

const editing = ref(false);
const draft = ref('');
const saving = ref(false);
const palette = computed(() => [...new Set(data.value?.artBible.match(/#[0-9a-f]{6}\b/gi) ?? [])]);

const copyColor = (color: string) => navigator.clipboard.writeText(color).then(() => toast.success(`Copied ${color}`));

function edit() {
  draft.value = data.value?.artBible ?? '';
  editing.value = true;
}
async function save() {
  saving.value = true;
  try {
    await $fetch(`/api/projects/${id.value}/bible`, { method: 'PUT', body: { markdown: draft.value } });
    editing.value = false;
    await refresh();
    toast.success('Art bible saved. New assets will follow it.');
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PageHeader :crumbs="[{ label: current?.name ?? 'Project', to: `/p/${id}` }, { label: 'Art bible' }]">
    <template v-if="editing">
      <Button variant="ghost" size="sm" @click="editing = false"><Eye class="size-4" /> Cancel</Button>
      <Button size="sm" :disabled="saving" @click="save"><Save class="size-4" /> Save</Button>
    </template>
    <Button v-else variant="outline" size="sm" @click="edit"><Pencil class="size-4" /> Edit</Button>
  </PageHeader>

  <div class="mx-auto w-full max-w-4xl p-6">
    <div v-if="palette.length" class="mb-6">
      <div class="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">Palette enforced by lint</div>
      <div class="flex flex-wrap gap-1.5">
        <Tooltip v-for="color in palette" :key="color">
          <TooltipTrigger as-child><button class="size-8 rounded-md shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]" :style="{ background: color }" @click="copyColor(color)" /></TooltipTrigger>
          <TooltipContent class="font-mono">{{ color }}</TooltipContent>
        </Tooltip>
      </div>
    </div>
    <Textarea v-if="editing" v-model="draft" class="min-h-[70vh] font-mono text-xs leading-6" spellcheck="false" />
    <MarkdownView v-else-if="data?.artBible" :source="data.artBible" />
    <div v-else class="rounded-xl border border-dashed p-10 text-center">
      <h2 class="text-lg font-semibold">No art bible yet</h2>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">The art bible is this game's visual contract: palette ramps, light, materials, shapes and UI rules. Ask your AI to propose one from a style pack, or write it yourself.</p>
      <div class="mt-5 flex justify-center gap-2">
        <Button @click="edit">Write it myself</Button>
        <Button variant="outline" as-child><NuxtLink to="/guides/art-bible">Read the template</NuxtLink></Button>
      </div>
    </div>
  </div>
</template>
