<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import 'vue-sonner/style.css';

const { connected } = useLive();
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex h-svh min-h-0 flex-col overflow-hidden">
      <header class="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-1 !h-4" />
        <div id="page-header" class="flex min-w-0 flex-1 items-center gap-2" />
        <CommandPalette />
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
              <span class="size-2 rounded-full" :class="connected ? 'bg-success shadow-[0_0_8px] shadow-success' : 'bg-destructive'" />
              <span class="hidden sm:inline">{{ connected ? 'Live' : 'Offline' }}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{{ connected ? 'Changes from your AI appear instantly' : 'Reconnecting to the Gesso server…' }}</TooltipContent>
        </Tooltip>
      </header>
      <main class="flex min-h-0 flex-1 flex-col overflow-auto">
        <slot />
      </main>
    </SidebarInset>
    <Toaster rich-colors close-button position="bottom-right" />
  </SidebarProvider>
</template>
