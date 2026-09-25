<script setup lang="ts">
defineProps<{ crumbs: { label: string; to?: string }[] }>();
</script>

<template>
  <Teleport defer to="#page-header">
    <Breadcrumb class="min-w-0">
      <BreadcrumbList class="flex-nowrap">
        <template v-for="(crumb, index) in crumbs" :key="index">
          <BreadcrumbSeparator v-if="index" />
          <BreadcrumbItem class="min-w-0">
            <BreadcrumbLink v-if="crumb.to && index < crumbs.length - 1" as-child><NuxtLink :to="crumb.to" class="truncate">{{ crumb.label }}</NuxtLink></BreadcrumbLink>
            <BreadcrumbPage v-else class="truncate">{{ crumb.label }}</BreadcrumbPage>
          </BreadcrumbItem>
        </template>
      </BreadcrumbList>
    </Breadcrumb>
    <div class="ml-auto flex items-center gap-2"><slot /></div>
  </Teleport>
</template>
