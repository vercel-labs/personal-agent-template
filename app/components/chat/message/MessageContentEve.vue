<script setup lang="ts">
import {
  getToolName,
  isDynamicToolUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
} from "ai";
import type { UIMessage } from "ai";
import type { EveDynamicToolPart } from "eve/vue";
import { isPartStreaming, isToolStreaming } from "@nuxt/ui/utils/ai";
import type { AgentInputResponse } from "~/components/AgentInputRequest.vue";
import type { ChatStatus } from "~/composables/chat/types";
import { getMergedParts } from "~/utils/chat/ai";
import { hasVisibleParts, getToolDisplayName, getToolNamespace, normalizeEveParts, shouldShowToolInput } from "~/utils/chat/eve";
import type { WeatherUIToolInvocation } from "~~/shared/utils/tools/weather";

const props = defineProps<{
  message: UIMessage;
  status: ChatStatus;
  isLast?: boolean;
  canRespond?: boolean;
}>();

const emit = defineEmits<{
  inputResponses: [responses: AgentInputResponse[]];
}>();

const rawParts = computed(() => props.message.parts);
const displayParts = computed(() => getMergedParts(normalizeEveParts(rawParts.value)));

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
      v-if="isReasoningUIPart(part)"
      :text="part.text"
      :streaming="isPartStreaming(part)"
      chevron="leading"
    >
      <ChatComark
        :value="part.text"
        :streaming="isPartStreaming(part)"
      />
    </UChatReasoning>

    <template v-else-if="isToolUIPart(part) || isDynamicToolUIPart(part)">
      <ChatToolWeather
        v-if="getToolName(part) === 'weather'"
        :invocation="{ ...(part as WeatherUIToolInvocation) }"
        :streaming="isToolStreaming(part)"
      />
      <UChatTool
        v-else-if="getToolName(part) === 'web_search' || getToolName(part) === 'google_search'"
        :text="isToolStreaming(part) ? 'Searching the web...' : 'Searched the web'"
        :suffix="getSearchQuery(part)"
        :streaming="isToolStreaming(part)"
        chevron="leading"
      >
        <ChatToolSources :sources="getSources(part)" />
      </UChatTool>
      <UChatTool
        v-else-if="getToolName(part) !== 'ask_question'"
        :text="isDynamicToolUIPart(part) ? getToolDisplayName(part as EveDynamicToolPart) : getToolName(part)"
        :suffix="isDynamicToolUIPart(part) ? getToolNamespace(part as EveDynamicToolPart) : undefined"
        :streaming="isToolStreaming(part)"
        chevron="leading"
        :default-open="part.state === 'approval-requested' || part.state === 'approval-responded'"
      >
        <AgentInputRequest
          v-if="isDynamicToolUIPart(part)"
          :can-respond="canRespond ?? true"
          :part="part as EveDynamicToolPart"
          @input-responses="emit('inputResponses', $event)"
        />

        <pre
          v-if="part.input && (!isDynamicToolUIPart(part) || shouldShowToolInput(part as EveDynamicToolPart))"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs"
        >{{ JSON.stringify(part.input, null, 2) }}</pre>

        <pre
          v-if="part.output || part.errorText"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs"
          :class="part.errorText ? 'text-error' : ''"
        >{{ part.errorText ?? JSON.stringify(part.output, null, 2) }}</pre>
      </UChatTool>

      <AgentInputRequest
        v-else-if="isDynamicToolUIPart(part)"
        compact
        :can-respond="canRespond ?? true"
        :part="part as EveDynamicToolPart"
        @input-responses="emit('inputResponses', $event)"
      />
    </template>

    <template v-else-if="isTextUIPart(part)">
      <div
        v-if="message.role === 'assistant'"
        class="relative"
      >
        <ChatComark
          :key="isPartStreaming(part) ? `${message.id}-text-${part.text.length}` : `${message.id}-text-${index}`"
          :value="part.text"
          :streaming="isPartStreaming(part)"
        />
        <span
          v-if="isPartStreaming(part) && isLast"
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
