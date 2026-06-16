<script setup lang="ts">
import { startNewChat } from "~/composables/chat/navigation";
import { authClient } from "~/lib/auth-client";

const session = authClient.useSession();

async function signOut() {
  await authClient.signOut();
  await navigateTo("/login");
}
</script>

<template>
  <UDashboardNavbar
    class="pointer-events-none absolute inset-x-0 top-0 z-10 border-b-0 backdrop-blur sm:px-4 lg:backdrop-blur-none"
    :ui="{ left: 'pointer-events-auto min-w-0', right: 'pointer-events-auto' }"
  >
    <template #left>
      <slot name="title" />
    </template>

    <template #right>
      <slot />

      <UDropdownMenu
        v-if="session.data"
        :items="[[
          {
            label: session.data.user.name || session.data.user.email,
            type: 'label',
          },
          {
            label: 'Settings',
            icon: 'i-lucide-settings',
            to: '/settings/profile',
          },
          {
            label: 'Integrations',
            icon: 'i-lucide-plug',
            to: '/settings/integrations',
          },
          {
            label: 'Sign out',
            icon: 'i-lucide-log-out',
            onSelect: signOut,
          },
        ]]"
      >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-user"
          aria-label="Account menu"
        />
      </UDropdownMenu>

      <UColorModeButton />

      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-circle-plus"
        class="lg:hidden"
        aria-label="New chat"
        @click="startNewChat()"
      />
    </template>
  </UDashboardNavbar>
</template>
