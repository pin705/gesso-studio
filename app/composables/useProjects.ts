import type { ProjectSummary } from '~/utils/types';

/** Shared project list; refreshed live. */
export function useProjects() {
  const projects = useState<ProjectSummary[]>('projects', () => []);
  const loaded = useState('projects-loaded', () => false);
  const refresh = async () => {
    projects.value = await $fetch<ProjectSummary[]>('/api/projects');
    loaded.value = true;
  };
  if (!loaded.value) void refresh();
  useLive((event) => {
    if (event.type === 'project' || event.type === 'asset' || event.type === 'feedback') void refresh();
  });
  const route = useRoute();
  const current = computed(() => projects.value.find((project) => project.id === route.params.id) ?? projects.value.find((project) => project.active));
  return { projects, loaded, current, refresh };
}
