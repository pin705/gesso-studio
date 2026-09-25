<script setup lang="ts">
import { Bot, Check, MapPin, RotateCcw, Trash2 } from '@lucide/vue';
import { toast } from 'vue-sonner';
import type { AssetDetail, Feedback } from '~/utils/types';

const props = defineProps<{ project: string; asset: AssetDetail; pending: { x: number; y: number } | null }>();
const emit = defineEmits<{ changed: []; clearPin: []; requestPin: [] }>();
const body = ref('');
const busy = ref(false);
const ordered = computed(() => [...props.asset.feedback].sort((a, b) => (a.status === b.status ? b.created_at - a.created_at : a.status === 'open' ? -1 : 1)));
const pinned = computed(() => props.asset.feedback.filter((item) => item.x !== null && item.y !== null));
const pinNumber = (item: Feedback) => pinned.value.findIndex((pin) => pin.id === item.id) + 1;
const ago = timeAgo;

async function submit() {
  if (!body.value.trim()) return;
  busy.value = true;
  try {
    await $fetch(`/api/projects/${props.project}/assets/${props.asset.key}/feedback`, { method: 'POST', body: { body: body.value, ...(props.pending ?? {}) } });
    body.value = '';
    emit('clearPin');
    emit('changed');
    toast.success('Feedback sent to your AI');
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    busy.value = false;
  }
}
async function update(item: Feedback, status: 'open' | 'resolved') {
  await $fetch(`/api/projects/${props.project}/feedback/${item.id}`, { method: 'PATCH', body: { status } });
  emit('changed');
}
async function remove(item: Feedback) {
  await $fetch(`/api/projects/${props.project}/feedback/${item.id}`, { method: 'DELETE' });
  emit('changed');
}
</script>

<template>
  <div class="grid gap-4">
    <form class="grid gap-2" @submit.prevent="submit">
      <Textarea v-model="body" placeholder="What should the AI change? e.g. “The gold rim is too thin at 64px”" class="min-h-20 text-sm" @keydown.meta.enter="submit" @keydown.ctrl.enter="submit" />
      <div class="flex items-center gap-2">
        <Button v-if="pending" type="button" variant="secondary" size="sm" class="h-7 text-xs" @click="emit('clearPin')"><MapPin class="size-3.5 text-warning" /> Pinned · remove</Button>
        <Button v-else type="button" variant="ghost" size="sm" class="h-7 text-xs" @click="emit('requestPin')"><MapPin class="size-3.5" /> Pin on canvas</Button>
        <Button type="submit" size="sm" class="ml-auto h-7" :disabled="busy || !body.trim()">Send</Button>
      </div>
      <p class="text-[11px] text-muted-foreground">Your agent reads open feedback with <span class="font-mono">get_feedback</span> and replies when it is fixed.</p>
    </form>

    <p v-if="!ordered.length" class="text-sm text-muted-foreground">No feedback yet.</p>
    <div v-for="item in ordered" :key="item.id" class="grid gap-2 rounded-lg border p-3" :class="item.status === 'resolved' && 'opacity-70'">
      <div class="flex items-start gap-2">
        <span v-if="pinNumber(item)" class="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold" :class="item.status === 'open' ? 'bg-warning text-black' : 'bg-muted'">{{ pinNumber(item) }}</span>
        <p class="flex-1 text-sm whitespace-pre-wrap">{{ item.body }}</p>
      </div>
      <div v-if="item.reply" class="flex gap-2 rounded-md bg-muted/50 p-2 text-xs"><Bot class="mt-0.5 size-3.5 shrink-0 text-brand" />{{ item.reply }}</div>
      <div class="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span>rev {{ item.revision }} · {{ ago(item.created_at) }}</span>
        <Badge v-if="item.status === 'resolved'" variant="secondary" class="ml-1 text-[10px]">Resolved</Badge>
        <div class="ml-auto flex">
          <Button v-if="item.status === 'open'" variant="ghost" size="icon" class="size-7" title="Mark resolved" @click="update(item, 'resolved')"><Check class="size-3.5" /></Button>
          <Button v-else variant="ghost" size="icon" class="size-7" title="Reopen" @click="update(item, 'open')"><RotateCcw class="size-3.5" /></Button>
          <Button variant="ghost" size="icon" class="size-7" title="Delete" @click="remove(item)"><Trash2 class="size-3.5" /></Button>
        </div>
      </div>
    </div>
  </div>
</template>
