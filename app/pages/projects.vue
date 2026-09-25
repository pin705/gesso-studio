<script setup lang="ts">
import { AlertTriangle, FolderOpen, MessageSquare, MoreHorizontal, Plus, Sparkles } from '@lucide/vue';
import { toast } from 'vue-sonner';
import type { ProjectSummary } from '~/utils/types';

useHead({ title: 'Projects · Gesso' });
const { projects, loaded, refresh } = useProjects();
const addOpen = ref(false);
const installing = ref(false);
const renaming = ref<ProjectSummary | null>(null);
const newName = ref('');

async function installSample() {
  installing.value = true;
  try {
    const project = await $fetch<{ id: string }>('/api/samples', { method: 'POST' });
    await refresh();
    await navigateTo(`/p/${project.id}`);
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    installing.value = false;
  }
}

async function remove(project: ProjectSummary) {
  if (!confirm(`Remove "${project.name}" from Gesso? Files in ${project.path} are kept.`)) return;
  await $fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
  await refresh();
  toast.success(`Removed ${project.name}`);
}

async function rename() {
  if (!renaming.value) return;
  await $fetch(`/api/projects/${renaming.value.id}`, { method: 'PATCH', body: { name: newName.value } });
  renaming.value = null;
  await refresh();
}
</script>

<template>
  <PageHeader :crumbs="[{ label: 'Projects' }]">
    <Button size="sm" @click="addOpen = true"><Plus class="size-4" /> Add project</Button>
  </PageHeader>

  <div class="mx-auto w-full max-w-6xl p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">Projects</h1>
      <p class="text-sm text-muted-foreground">Each project is an art folder with its own art bible. Your AI can also open projects itself.</p>
    </div>

    <div v-if="loaded && !projects.length" class="grid place-items-center rounded-xl border border-dashed p-12 text-center">
      <GessoMark class="mb-4 size-12" />
      <h2 class="text-lg font-semibold">Welcome to Gesso</h2>
      <p class="mt-1 max-w-md text-sm text-muted-foreground">Add your game's art folder, or explore the showcase to see what your AI can make with the knowledge base.</p>
      <div class="mt-6 flex gap-2">
        <Button @click="addOpen = true"><Plus class="size-4" /> Add project</Button>
        <Button variant="outline" :disabled="installing" @click="installSample"><Sparkles class="size-4" /> {{ installing ? 'Installing…' : 'Open the showcase' }}</Button>
      </div>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="project in projects" :key="project.id" class="group gap-0 overflow-hidden py-0 transition hover:border-foreground/20">
        <NuxtLink :to="`/p/${project.id}`" class="grid aspect-[16/9] grid-cols-2 grid-rows-2 gap-px bg-border">
          <AssetThumb v-for="key in project.cover" :key="key" :src="thumbUrl(project.id, key, project.opened_at)" class="h-full" />
          <div v-for="index in Math.max(0, 4 - project.cover.length)" :key="`empty-${index}`" class="checker opacity-60" />
        </NuxtLink>
        <CardContent class="flex items-start gap-3 p-4">
          <div class="min-w-0 flex-1">
            <NuxtLink :to="`/p/${project.id}`" class="flex items-center gap-2 font-medium hover:underline">
              <span class="truncate">{{ project.name }}</span>
              <Badge v-if="project.active" variant="secondary" class="text-[10px]">Active</Badge>
            </NuxtLink>
            <p class="truncate font-mono text-xs text-muted-foreground" :title="project.path">{{ project.path }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{{ project.assets }} assets</span>
              <span>{{ project.approved }} approved</span>
              <span v-if="project.feedback" class="flex items-center gap-1 text-warning"><MessageSquare class="size-3" /> {{ project.feedback }} open</span>
              <span v-if="project.missing" class="flex items-center gap-1 text-destructive"><AlertTriangle class="size-3" /> folder missing</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child><Button variant="ghost" size="icon" class="size-8" aria-label="Project actions"><MoreHorizontal class="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="navigateTo(`/p/${project.id}`)"><FolderOpen class="size-4" /> Open</DropdownMenuItem>
              <DropdownMenuItem @select="renaming = project; newName = project.name">Rename…</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive" @select="remove(project)">Remove from Gesso</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
      <button class="grid min-h-48 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground" @click="addOpen = true">
        <span class="flex flex-col items-center gap-2"><Plus class="size-5" /> Add project</span>
      </button>
    </div>
  </div>

  <AddProjectDialog v-model:open="addOpen" />
  <Dialog :open="!!renaming" @update:open="(value) => !value && (renaming = null)">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader><DialogTitle>Rename project</DialogTitle></DialogHeader>
      <form class="grid gap-4" @submit.prevent="rename">
        <Input v-model="newName" autofocus />
        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
