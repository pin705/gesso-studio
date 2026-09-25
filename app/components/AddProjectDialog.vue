<script setup lang="ts">
import { toast } from 'vue-sonner';

const open = defineModel<boolean>('open', { default: false });
const folder = ref('');
const name = ref('');
const busy = ref(false);
const { refresh } = useProjects();

async function submit() {
  busy.value = true;
  try {
    const project = await $fetch<{ id: string; name: string }>('/api/projects', { method: 'POST', body: { path: folder.value, name: name.value } });
    await refresh();
    open.value = false;
    folder.value = name.value = '';
    toast.success(`Opened ${project.name}`);
    await navigateTo(`/p/${project.id}`);
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add a project</DialogTitle>
        <DialogDescription>Point Gesso at the art folder of your game. It is created if it does not exist; your files always stay in that folder.</DialogDescription>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="submit">
        <div class="grid gap-2">
          <Label for="project-path">Folder</Label>
          <Input id="project-path" v-model="folder" placeholder="~/games/star-farm/art" autocomplete="off" required />
        </div>
        <div class="grid gap-2">
          <Label for="project-name">Name <span class="text-muted-foreground">(optional)</span></Label>
          <Input id="project-name" v-model="name" placeholder="Star Farm" autocomplete="off" />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="busy || !folder.trim()">{{ busy ? 'Opening…' : 'Add project' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
