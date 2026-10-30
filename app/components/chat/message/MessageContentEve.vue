<script setup lang="ts">
import type { EveInteractionPart, EveMessage, EveToolPart } from "eve/vue";
import type { AgentInputResponse } from "~/components/AgentInputRequest.vue";
import type { ChatStatus } from "~/composables/chat/useChatSession";
import { hasVisibleParts, getToolDisplayName, getToolNamespace, normalizeEveParts } from "~/utils/chat/eve";

const props = defineProps<{
  message: EveMessage;
  status: ChatStatus;
  isLast?: boolean;
  canRespond?: boolean;
}>();

const emit = defineEmits<{
  inputResponses: [responses: AgentInputResponse[]];
}>();

const rawParts = computed(() => props.message.parts);
const displayParts = computed(() => normalizeEveParts(rawParts.value));

const isBusy = computed(
  () => props.status === "submitted" || props.status === "streaming",
);

const showThinking = computed(
  () =>
    props.message.role === "assistant"
    && props.isLast
    && isBusy.value
    && !hasVisibleParts(rawParts.value),
);
</script>

<template>
  <ChatActivityIndicator v-if="showThinking" />

  <template
    v-for="(part, index) in displayParts"
    :key="`${message.id}-part-${index}`"
  >
    <UChatReasoning
      v-if="part.type === 'reasoning'"
      :text="part.text"
      :streaming="part.state === 'streaming'"
      chevron="leading"
    >
      <ChatComark
        :value="part.text"
        :streaming="part.state === 'streaming'"
      />
    </UChatReasoning>

    <template v-else-if="part.type === 'tool'">
      <ChatToolWeather
        v-if="part.name === 'weather'"
        :part="part as EveToolPart"
      />

      <UChatTool
        v-else-if="part.name !== 'ask_question'"
        :text="getToolDisplayName(part as EveToolPart)"
        :suffix="getToolNamespace(part as EveToolPart)"
        :streaming="part.state === 'streaming' || part.state === 'running'"
        chevron="leading"
        :default-open="part.state === 'approval'"
      >
        <AgentInputRequest
          v-if="part.interaction"
          :can-respond="canRespond ?? true"
          :interaction="part.interaction"
          @input-responses="emit('inputResponses', $event)"
        />

        <pre
          v-if="part.input"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs"
        >{{ JSON.stringify(part.input, null, 2) }}</pre>

        <pre
          v-if="part.output || part.error"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs"
          :class="part.error ? 'text-error' : ''"
        >{{ part.error?.message ?? JSON.stringify(part.output, null, 2) }}</pre>
      </UChatTool>

      <AgentInputRequest
        v-else-if="part.interaction"
        compact
        :can-respond="canRespond ?? true"
        :interaction="part.interaction"
        is-ask-question
        @input-responses="emit('inputResponses', $event)"
      />
    </template>

    <!--
      Eve v27 represents interactions without a calling tool as their own
      message parts. This includes agent questions, budget continuations, and
      sign-ins, so rendering them here keeps a paused turn actionable.
    -->
    <template v-else-if="part.type === 'interaction'">
      <AgentSignInRequest
        v-if="part.request.kind === 'sign-in'"
        :part="part as EveInteractionPart"
      />

      <AgentInputRequest
        v-else
        :can-respond="canRespond ?? true"
        :interaction="part as EveInteractionPart"
        @input-responses="emit('inputResponses', $event)"
      />
    </template>

    <template v-else-if="part.type === 'text'">
      <div
        v-if="message.role === 'assistant'"
        class="relative"
      >
        <ChatComark
          :key="part.state === 'streaming' ? `${message.id}-text-${part.text.length}` : `${message.id}-text-${index}`"
          :value="part.text"
          :streaming="part.state === 'streaming'"
        />
        <span
          v-if="part.state === 'streaming' && isLast"
          class="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-px animate-pulse rounded-full bg-highlighted"
          aria-hidden="true"
        />
      </div>
      <p
        v-else
        class="whitespace-pre-wrap"
      >
        {{ part.text }}
      </p>
    </template>
  </template>
</template>
