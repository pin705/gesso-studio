<script setup lang="ts">
const { projects, loaded } = useProjects();
watchEffect(() => {
  if (!loaded.value) return;
  const target = projects.value.find((project) => project.active) ?? projects.value[0];
  void navigateTo(target ? `/p/${target.id}` : '/projects', { replace: true });
});
</script>

<template>
  <div class="grid flex-1 place-items-center text-sm text-muted-foreground">Opening Gesso…</div>
</template>
