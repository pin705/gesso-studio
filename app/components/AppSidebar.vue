<script setup lang="ts">
import { Activity, BookOpen, Check, ChevronsUpDown, Download, FolderOpen, GraduationCap, LayoutGrid, Moon, Plug, Plus, Sun } from '@lucide/vue';

const { projects, current } = useProjects();
const route = useRoute();
const colorMode = useColorMode();
const version = useRuntimeConfig().public.version;
const addOpen = ref(false);

const projectLinks = computed(() => {
  if (!current.value) return [];
  const base = `/p/${current.value.id}`;
  return [
    { to: base, label: 'Library', icon: LayoutGrid, badge: current.value.assets || undefined, exact: true },
    { to: `${base}/bible`, label: 'Art bible', icon: BookOpen },
    { to: `${base}/exports`, label: 'Exports', icon: Download },
    { to: `${base}/activity`, label: 'Activity', icon: Activity }
  ];
});
const studioLinks = [
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/guides', label: 'Knowledge base', icon: GraduationCap },
  { to: '/connect', label: 'Connect AI', icon: Plug }
];
const isActive = (to: string, exact?: boolean) => (exact ? route.path === to || route.path.startsWith(`${to}/a/`) : route.path.startsWith(to));
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
                <span class="grid size-8 shrink-0 place-items-center"><GessoMark class="!size-8" /></span>
                <div class="grid flex-1 text-left leading-tight">
                  <span class="truncate text-sm font-semibold">{{ current?.name ?? 'Gesso' }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ current ? `${current.assets} assets` : 'No project open' }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4 opacity-60" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-64" align="start" side="bottom">
              <DropdownMenuLabel class="text-xs text-muted-foreground">Projects</DropdownMenuLabel>
              <DropdownMenuItem v-for="project in projects" :key="project.id" @select="navigateTo(`/p/${project.id}`)">
                <span class="truncate">{{ project.name }}</span>
                <Check v-if="project.id === current?.id" class="ml-auto size-4" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @select="addOpen = true"><Plus class="size-4" /> Add project…</DropdownMenuItem>
              <DropdownMenuItem @select="navigateTo('/projects')"><FolderOpen class="size-4" /> All projects</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-if="projectLinks.length">
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="link in projectLinks" :key="link.to">
            <SidebarMenuButton as-child :is-active="isActive(link.to, link.exact)" :tooltip="link.label">
              <NuxtLink :to="link.to"><component :is="link.icon" /><span>{{ link.label }}</span></NuxtLink>
            </SidebarMenuButton>
            <SidebarMenuBadge v-if="link.badge">{{ link.badge }}</SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Studio</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="link in studioLinks" :key="link.to">
            <SidebarMenuButton as-child :is-active="isActive(link.to)" :tooltip="link.label">
              <NuxtLink :to="link.to"><component :is="link.icon" /><span>{{ link.label }}</span></NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton :tooltip="colorMode.value === 'dark' ? 'Light theme' : 'Dark theme'" @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">
            <Sun v-if="colorMode.value === 'dark'" /><Moon v-else />
            <span>{{ colorMode.value === 'dark' ? 'Light theme' : 'Dark theme' }}</span>
            <span class="ml-auto text-xs text-muted-foreground">v{{ version }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
    <AddProjectDialog v-model:open="addOpen" />
  </Sidebar>
</template>
