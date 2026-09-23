<script setup lang="ts">
import { startNewChat } from "~/composables/chat/navigation";
import { useThreadList } from "~/composables/chat/useThreads";

const sidebarOpen = ref(false);
const searchOpen = ref(false);

const { threads, pending, refresh } = useThreadList();

const searchGroups = computed(() => [
  {
    id: "actions",
    label: "Workspace",
    items: [
      {
        label: "New project",
        to: "/",
        icon: "i-lucide-square-pen",
        kbds: ["meta", "o"],
        onSelect: () => startNewChat(),
      },
      {
        label: "Search",
        icon: "i-lucide-search",
        kbds: ["meta", "k"],
        onSelect: () => {
          searchOpen.value = true;
        },
      },
    ],
  },
  ...(threads.value.length
    ? [{
        id: "threads",
        label: "Recent projects",
        items: threads.value.map(thread => ({
          label: thread.title,
          to: `/chat/${thread.id}`,
          icon: "i-lucide-message-square",
        })),
      }]
    : []),
]);

defineShortcuts({
  meta_o: () => startNewChat(),
  meta_k: () => {
    searchOpen.value = true;
  },
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="sidebarOpen"
      :min-size="15"
      collapsible
      resizable
      :menu="{ inset: true }"
      class="border-r-0 bg-default/80 py-4 backdrop-blur-xl dark:bg-default/40"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/"
          class="flex min-w-0 items-center gap-2.5"
          :class="collapsed ? 'mx-auto' : 'px-2.5'"
        >
          <span class="flex h-7 w-7 items-center justify-center rounded-lg border border-default bg-elevated shadow-sm">
            <AppLogo class="h-3.5 w-auto text-highlighted" />
          </span>
          <span v-if="!collapsed" class="truncate text-sm font-semibold tracking-tight text-highlighted">
            WebSandBox
          </span>
        </NuxtLink>

        <UDashboardSidebarCollapse v-if="!collapsed" class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <div class="mb-3 px-2.5 pt-2">
          <UButton
            label="New project"
            icon="i-lucide-square-pen"
            color="primary"
            variant="solid"
            block
            class="justify-start rounded-lg"
            @click="startNewChat()"
          />
        </div>

        <UNavigationMenu
          :items="[
            {
              label: 'Explore',
              icon: 'i-lucide-compass',
              to: '/',
            },
            {
              label: 'Search',
              icon: 'i-lucide-search',
              kbds: ['meta', 'k'],
              onSelect: () => {
                searchOpen = true;
              },
            },
            {
              label: 'GitHub',
              icon: 'i-lucide-github',
            },
          ]"
          :collapsed="collapsed"
          orientation="vertical"
        >
          <template #item-trailing="{ item }">
            <div
              v-if="item.kbds?.length"
              class="flex items-center gap-px opacity-0 transition-opacity group-hover:opacity-100"
            >
              <UKbd v-for="kbd in item.kbds" :key="kbd" :value="kbd" size="sm" variant="soft" class="bg-accented/50" />
            </div>
          </template>
        </UNavigationMenu>

        <div v-if="!collapsed" class="mt-6 px-2.5">
          <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Projects</p>
        </div>

        <ChatThreadList
          v-if="!collapsed"
          class="mt-1 min-h-0 flex-1"
          :threads="threads"
          :pending="pending"
          @refresh="refresh()"
        />
      </template>

      <template #footer>
        <div v-if="!sidebarOpen" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      v-model:open="searchOpen"
      placeholder="Search projects and actions..."
      :groups="searchGroups"
    />

    <div class="m-2 flex min-w-0 flex-1 overflow-hidden rounded-2xl border border-default bg-default shadow-sm lg:ml-0">
      <slot />
    </div>
  </UDashboardGroup>
</template>
