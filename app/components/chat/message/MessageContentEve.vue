<script setup lang="ts">
import {
  getToolName,
  isDynamicToolUIPart,
  isFileUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
} from "ai";
import type { FileUIPart, UIMessage } from "ai";
import { isPartStreaming, isToolStreaming } from "@nuxt/ui/utils/ai";
import type { AgentInputResponse } from "~/components/AgentInputRequest.vue";
import type { ChatStatus } from "~/composables/chat/useChatSession";
import { getMergedParts } from "~/utils/chat/ai";
import {
  getInteraction,
  getToolDisplayName,
  getToolNamespace,
  hasVisibleParts,
  isEveUiToolPart,
  normalizeEveParts,
  shouldShowToolInput,
} from "~/utils/chat/eve";
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

/** Only web URLs are linked or loaded; eve omits the URL for inline uploads. */
function fileHref(part: FileUIPart): string | undefined {
  return /^https?:\/\//i.test(part.url) ? part.url : undefined;
}

function isImageFile(part: FileUIPart): boolean {
  return part.mediaType.startsWith("image/") && fileHref(part) !== undefined;
}

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
        :text="isToolStreaming(part) ? 'Searching the web...' : part.state === 'output-error' ? 'Web search failed' : 'Searched the web'"
        :suffix="getSearchQuery(part)"
        :streaming="isToolStreaming(part)"
        chevron="leading"
      >
        <pre
          v-if="part.state === 'output-error'"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs text-error"
        >{{ part.errorText }}</pre>
        <ChatToolSources
          v-else
          :sources="getSources(part)"
        />
      </UChatTool>
      <UChatTool
        v-else-if="getToolName(part) !== 'ask_question' || !isEveUiToolPart(part) || !part.eve.interaction"
        :text="isEveUiToolPart(part) ? getToolDisplayName(part) : getToolName(part)"
        :suffix="isEveUiToolPart(part) ? getToolNamespace(part) : undefined"
        :streaming="isToolStreaming(part)"
        chevron="leading"
        :default-open="part.state === 'approval-requested' || part.state === 'approval-responded'"
      >
        <AgentInputRequest
          v-if="isEveUiToolPart(part) && part.eve.interaction"
          :can-respond="canRespond ?? true"
          :interaction="part.eve.interaction"
          @input-responses="emit('inputResponses', $event)"
        />

        <pre
          v-if="part.input && (!isEveUiToolPart(part) || shouldShowToolInput(part))"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs"
        >{{ JSON.stringify(part.input, null, 2) }}</pre>

        <pre
          v-if="part.output || part.errorText"
          class="overflow-x-auto rounded-md bg-muted p-2 text-xs"
          :class="part.errorText ? 'text-error' : ''"
        >{{ part.errorText ?? JSON.stringify(part.output, null, 2) }}</pre>
      </UChatTool>

      <AgentInputRequest
        v-else-if="isEveUiToolPart(part) && part.eve.interaction"
        compact
        :can-respond="canRespond ?? true"
        :interaction="part.eve.interaction"
        @input-responses="emit('inputResponses', $event)"
      />
    </template>

    <!-- A question or budget prompt not tied to a tool call. Sign-ins are
         shown as cards above the prompt instead. -->
    <AgentInputRequest
      v-else-if="getInteraction(part) && getInteraction(part)!.request.kind !== 'sign-in'"
      compact
      :can-respond="canRespond ?? true"
      :interaction="getInteraction(part)!"
      @input-responses="emit('inputResponses', $event)"
    />

    <!-- An attachment: a preview for a linked image, otherwise its name. -->
    <template v-else-if="isFileUIPart(part)">
      <a
        v-if="isImageFile(part)"
        :href="fileHref(part)"
        target="_blank"
        rel="noopener noreferrer"
        class="my-1 block w-fit"
      >
        <img
          :src="fileHref(part)"
          :alt="part.filename ?? 'Attached image'"
          class="max-h-64 max-w-full rounded-lg border border-default object-contain"
          loading="lazy"
        >
      </a>
      <component
        :is="fileHref(part) ? 'a' : 'span'"
        v-else
        :href="fileHref(part)"
        :target="fileHref(part) ? '_blank' : undefined"
        :rel="fileHref(part) ? 'noopener noreferrer' : undefined"
        class="my-1 inline-flex max-w-full items-center gap-2 rounded-md border border-default bg-elevated/40 px-2.5 py-1.5 text-sm text-muted"
        :class="fileHref(part) ? 'transition-colors hover:text-default' : ''"
      >
        <UIcon
          name="i-lucide-paperclip"
          class="size-4 shrink-0"
        />
        <span class="truncate">{{ part.filename ?? part.mediaType }}</span>
      </component>
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
