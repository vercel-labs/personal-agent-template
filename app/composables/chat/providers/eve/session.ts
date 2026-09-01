import type { EveMessageData, UseEveAgentStatus } from "eve/vue";
import type { MaybeRefOrGetter } from "vue";
import { computed, ref, toValue, watch } from "vue";
import type { AgentInputResponse } from "~/components/AgentInputRequest.vue";
import type { ChatSession, ChatSessionOptions, ChatStatus } from "~/composables/chat/types";
import { toUIMessages } from "./adapter";
import { getOrCreateEveAgent } from "./init";
import { clearTurnFailure, turnFailure } from "./turn-errors";

/**
 * The Nuxt UI chat components accept the four AI SDK statuses only. Replaying a
 * stored session is not an in-flight turn, so it must not read as busy — that
 * shows a "Thinking…" indicator over an already-finished conversation.
 */
function toChatStatus(status: UseEveAgentStatus): ChatStatus {
  return status === "resuming" ? "ready" : status;
}

function lastUserMessageText(data: EveMessageData) {
  for (let index = data.messages.length - 1; index >= 0; index -= 1) {
    const message = data.messages[index];
    if (message?.role !== "user") continue;

    const text = message.parts
      .filter(part => part.type === "text")
      .map(part => part.text)
      .join("\n")
      .trim();

    if (text) return text;
  }
}

export function createEveChatSession(
  chatId: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<ChatSessionOptions | undefined>,
): ChatSession {
  const id = computed(() => toValue(chatId));
  const resolvedOptions = computed(() => toValue(options));
  const agent = computed(() => getOrCreateEveAgent(id.value, resolvedOptions.value));

  const messages = computed(() => toUIMessages(agent.value.data.value.messages));

  // A send issued while the session is still replaying waits its turn. Report
  // it as in flight so the prompt shows the turn was accepted instead of going
  // silent for as long as the replay takes.
  const queuedSend = ref(false);
  const queuedText = ref<string>();

  const status = computed(() => {
    if (queuedSend.value) return "submitted";
    return toChatStatus(agent.value.status.value);
  });
  const error = computed(() => {
    const transport = agent.value.error.value;
    if (transport) return transport;

    const failure = turnFailure(id.value);
    return failure ? new Error(failure) : undefined;
  });

  const isBusy = computed(
    () => status.value === "submitted" || status.value === "streaming",
  );

  /**
   * Replaying a stored session rejects sends until it settles. Wait it out
   * rather than dropping the message: the prompt stays usable and the turn
   * goes as soon as the replay finishes.
   */
  async function whenSendable(text?: string) {
    if (agent.value.status.value !== "resuming") {
      return;
    }

    queuedSend.value = true;
    queuedText.value = text;
    try {
      await new Promise<void>((resolve) => {
        const stop = watch(agent.value.status, (value) => {
          if (value === "resuming") return;
          stop();
          resolve();
        });
      });
    }
    finally {
      queuedSend.value = false;
      queuedText.value = undefined;
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    clearTurnFailure(id.value);
    await whenSendable(trimmed);
    await agent.value.send(trimmed);
  }

  async function sendInputResponses(responses: AgentInputResponse[]) {
    clearTurnFailure(id.value);
    await whenSendable();
    await agent.value.respond(responses);
  }

  async function cancel() {
    await agent.value.cancel();
  }

  function reset() {
    agent.value.reset();
  }

  async function retry() {
    if (isBusy.value) return;

    const text = lastUserMessageText(agent.value.data.value);
    if (!text) return;

    clearTurnFailure(id.value);
    await whenSendable();
    await agent.value.send(text);
  }

  return {
    messages,
    pendingMessage: computed(() => queuedText.value),
    status,
    error,
    isBusy,
    sendMessage,
    sendInputResponses,
    cancel,
    reset,
    retry,
  };
}
