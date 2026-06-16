<script setup lang="ts">
const { connectors, error, refresh, isInitialLoad, pending } = useConnectors();

const connectedCount = computed(
  () => connectors.value?.filter(connector => connector.status.state === "connected").length ?? 0,
);

const totalCount = computed(() => connectors.value?.length ?? 0);
</script>

<template>
  <UDashboardPanel
    id="integrations"
    class="min-h-0"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <Navbar>
        <template #title>
          <h1 class="text-sm font-medium text-highlighted">
            Settings
          </h1>
        </template>
      </Navbar>
    </template>

    <template #body>
      <UContainer class="max-w-3xl py-8 sm:py-10">
        <header class="mb-6 space-y-1">
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
            Settings
          </h1>
          <p class="text-sm text-muted">
            Manage your identity, memory, and integrations.
          </p>
        </header>

        <SettingsNav class="mb-8" />

        <div class="space-y-8">
          <section class="space-y-3">
            <div class="space-y-0.5">
              <h2 class="text-sm font-medium text-highlighted">
                Channels
              </h2>
              <p class="text-xs text-muted">
                Link messaging platforms to your Adam account.
              </p>
            </div>

            <IntegrationsSlackLinkCard />
          </section>

          <section class="space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-0.5">
                <h2 class="text-sm font-medium text-highlighted">
                  Services
                </h2>
                <p class="text-xs text-muted">
                  OAuth tools available in chat and Slack once linked.
                </p>
                <p
                  v-if="!isInitialLoad && !error"
                  class="text-[11px] text-dimmed"
                >
                  {{ connectedCount }} of {{ totalCount }} connected
                </p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-refresh-cw"
                :loading="pending"
                aria-label="Refresh services"
                @click="refresh()"
              />
            </div>

            <div
              v-if="isInitialLoad"
              class="space-y-2"
            >
              <USkeleton
                v-for="index in 2"
                :key="index"
                class="h-14 rounded-lg"
              />
            </div>

            <UAlert
              v-else-if="error"
              color="error"
              variant="subtle"
              title="Failed to load services"
              :description="error.message"
            />

            <div
              v-else
              class="space-y-2"
            >
              <IntegrationsConnectorCard
                v-for="connector in connectors"
                :key="connector.id"
                :connector="connector"
                @refresh="refresh()"
              />
            </div>
          </section>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
