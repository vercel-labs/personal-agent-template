<script setup lang="ts">
import type { Interaction } from "eve/vue";
import type { Answer } from "eve/events";

export type AgentInputResponse = Answer;

const props = defineProps<{
  canRespond: boolean;
  /** An approval or question, attached to a tool call or standing alone. */
  interaction: Interaction;
  compact?: boolean;
}>();

const emit = defineEmits<{
  inputResponses: [responses: AgentInputResponse[]];
}>();

const inputRequest = computed(() => props.interaction.request);
// Present once an answer is submitted, before eve settles the interaction.
const inputResponse = computed(() => props.interaction.answer);

/** How an interaction closed when nobody answered it. */
const closedLabel = computed(() => {
  if (props.interaction.status !== "settled" || inputResponse.value) {
    return undefined;
  }

  switch (props.interaction.outcome) {
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    default:
      return "No longer needed";
  }
});

const showOptions = computed(() => (inputRequest.value.options?.length ?? 0) > 0);

const showFreeform = computed(() => {
  const request = inputRequest.value;
  if (inputResponse.value || closedLabel.value) {
    return false;
  }
  return request.allowFreeform === true
    || request.display === "text"
    || !showOptions.value;
});

const freeformText = ref("");

const canSubmitFreeform = computed(
  () => props.canRespond && freeformText.value.trim().length > 0,
);

const selectedOption = computed(() => {
  const request = inputRequest.value;
  const response = inputResponse.value;
  if (!request.options || !response?.optionId) {
    return undefined;
  }
  return request.options.find(option => option.id === response.optionId);
});

const responseLabel = computed(
  () => selectedOption.value?.label ?? inputResponse.value?.text ?? inputResponse.value?.optionId,
);

function respond(optionId: string) {
  emit("inputResponses", [{ interactionId: props.interaction.interactionId, optionId }]);
}

function respondText() {
  const text = freeformText.value.trim();
  if (!text) {
    return;
  }
  emit("inputResponses", [{ interactionId: props.interaction.interactionId, text }]);
}

function onFreeformKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (canSubmitFreeform.value) {
      respondText();
    }
  }
}
</script>

<template>
  <div
    :class="compact
      ? 'mt-2 max-w-lg space-y-2'
      : 'space-y-3 rounded-lg border border-default/60 bg-elevated/40 p-3'"
  >
    <p class="text-sm text-muted">
      {{ inputRequest.prompt }}
    </p>

    <p
      v-if="inputResponse"
      class="text-sm text-muted"
    >
      <span class="text-dimmed">Answered</span>
      <span class="mx-1.5 text-dimmed">·</span>
      <span class="text-highlighted">{{ responseLabel }}</span>
    </p>

    <p
      v-else-if="closedLabel"
      class="text-sm text-dimmed"
    >
      {{ closedLabel }}
    </p>

    <template v-else>
      <div
        v-if="showOptions"
        class="flex flex-wrap gap-1.5"
      >
        <UButton
          v-for="option in inputRequest.options"
          :key="option.id"
          :color="option.style === 'danger' ? 'error' : 'neutral'"
          :variant="compact ? 'soft' : 'solid'"
          :disabled="!canRespond"
          size="xs"
          @click="respond(option.id)"
        >
          {{ option.label }}
        </UButton>
      </div>

      <form
        v-if="showFreeform"
        :class="compact ? 'flex items-center gap-2' : 'space-y-2'"
        @submit.prevent="respondText"
      >
        <UInput
          v-if="compact"
          v-model="freeformText"
          class="min-w-0 flex-1"
          size="sm"
          :disabled="!canRespond"
          placeholder="Your answer"
          @keydown="onFreeformKeydown"
        />
        <UTextarea
          v-else
          v-model="freeformText"
          :rows="showOptions ? 2 : 3"
          autoresize
          class="w-full"
          :disabled="!canRespond"
          placeholder="Type your answer"
          @keydown="onFreeformKeydown"
        />
        <UButton
          type="submit"
          size="sm"
          :icon="compact ? 'i-lucide-arrow-up' : undefined"
          :disabled="!canSubmitFreeform"
          :class="compact ? 'shrink-0' : undefined"
        >
          <span v-if="!compact">Submit</span>
        </UButton>
      </form>
    </template>
  </div>
</template>
