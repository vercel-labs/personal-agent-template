<script setup lang="ts">
import type { EveInteractionPart } from "eve/vue";

const props = defineProps<{
  part: EveInteractionPart;
}>();

const signIn = computed(() => props.part.request.signIn);
const name = computed(() => signIn.value?.displayName ?? signIn.value?.name ?? "the service");
const isSettled = computed(() => props.part.status === "settled");
const isConnected = computed(() => props.part.outcome === "accepted");

const statusLabel = computed(() => {
  if (!isSettled.value) return "Authorization required";
  if (isConnected.value) return "Connected";
  if (props.part.outcome === "declined") return "Declined";
  if (props.part.outcome === "expired") return "Timed out";
  return "Authorization failed";
});

const description = computed(() => {
  if (isConnected.value) return `${name.value} is connected.`;
  if (isSettled.value) return props.part.reason ?? `${name.value} authorization did not complete.`;
  return props.part.request.prompt || signIn.value?.instructions;
});

function openAuthorization() {
  if (!signIn.value?.url) return;
  window.open(signIn.value.url, "_blank", "noopener,noreferrer");
}
</script>

<template>
  <div class="rounded-lg border border-default/70 bg-elevated/30">
    <div class="flex flex-col gap-2.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-3.5 sm:py-3">
      <div class="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md border border-default/60 bg-default/50">
          <UIcon
            :name="isConnected ? 'i-lucide-check-circle' : 'i-lucide-key-round'"
            class="size-4 text-toned"
          />
        </div>

        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p class="text-sm font-medium text-highlighted">
              Connect {{ name }}
            </p>
            <span class="text-[11px] text-dimmed">{{ statusLabel }}</span>
          </div>

          <p class="text-xs text-muted">
            {{ description }}
          </p>

          <p
            v-if="!isSettled && signIn?.instructions && signIn.instructions !== description"
            class="text-xs text-muted"
          >
            {{ signIn.instructions }}
          </p>

          <div
            v-if="!isSettled && signIn?.userCode"
            class="flex items-center gap-2"
          >
            <span class="text-[11px] text-dimmed">Code</span>
            <code class="rounded border border-default/70 bg-default/60 px-2 py-0.5 font-mono text-xs tracking-wider text-toned">{{ signIn.userCode }}</code>
          </div>
        </div>
      </div>

      <UButton
        v-if="!isSettled && signIn?.url"
        color="neutral"
        variant="soft"
        size="xs"
        class="shrink-0 self-end sm:self-center"
        trailing-icon="i-lucide-arrow-up-right"
        @click="openAuthorization"
      >
        Sign in with {{ name }}
      </UButton>
    </div>
  </div>
</template>
