import type { EveMessage } from "eve/vue";
import type { ThreadRecord } from "#shared/types/thread";
import type { AgentInputResponse } from "~/components/AgentInputRequest.vue";
import { recordAuthorizationEvent } from "~/composables/chat/useAuthorizationChallenges";
import { persistThreadSession, resumeOptionsFromThread } from "~/composables/chat/thread-session";
import { recordStreamEvent } from "~/composables/chat/stream-log";
import { clearTurnFailure, recordTurnFailure, turnFailure } from "~/composables/chat/turn-errors";

/** The four statuses the Nuxt UI chat components understand. */
export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

function lastUserMessageText(messages: readonly EveMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    const text = message.parts
      .filter(part => part.type === "text")
      .map(part => part.text)
      .join("\n")
      .trim();

    if (text) return text;
  }
}

/**
 * Binds one durable eve session to one thread, for the lifetime of the page.
 *
 * `useEveAgent` attaches to the calling component's scope, so this must run in
 * setup and the agent must not outlive it — the thread's stored session id is
 * what carries the conversation across visits.
 */
export function useChatSession(thread: ThreadRecord) {
  const chatId = thread.id;
  const initial = resumeOptionsFromThread(thread);

  const agent = useEveAgent({
    ...initial,
    onSessionChange: (session) => {
      // eve mints the session on the first message; bind it once.
      if (session && session.sessionId !== thread.sessionId) {
        void persistThreadSession(chatId, session.sessionId);
      }
    },
    onEvent: (event) => {
      if (event.type === "interaction.opened" || event.type === "interaction.settled") {
        recordAuthorizationEvent(event);
      }

      if (
        (event.type === "turn.settled" && event.data.outcome === "failed")
        || (event.type === "session.ended" && event.data.outcome === "failed")
      ) {
        recordTurnFailure(chatId, event);
      }

      if (import.meta.dev) recordStreamEvent(event.type);
    },
  });

  // Text held while a send waits for a replay to finish. eve only projects a
  // user message once the turn is handed over, so it is shown here instead —
  // in the transcript, where a sent message belongs.
  const queued = ref<string>();

  const messages = computed(() => {
    const sent = [...agent.messages.value];
    if (!queued.value) return sent;

    return [...sent, {
      id: `pending:${chatId}`,
      role: "user",
      parts: [{ type: "text", text: queued.value }],
    } as EveMessage];
  });

  const status = computed<ChatStatus>(() => {
    if (queued.value !== undefined) return "submitted";
    // Replaying a stored session is not an in-flight turn.
    if (agent.status.value === "resuming" || agent.status.value === "idle") return "ready";
    if (agent.error.value) return "error";

    // Eve reports a busy session for both a just-submitted delivery and a
    // streaming model response. Derive the UI distinction from its transcript.
    const last = agent.messages.value.at(-1);
    return last?.role === "user" ? "submitted" : "streaming";
  });

  const error = computed(() => {
    if (agent.error.value) return agent.error.value;
    const failure = turnFailure(chatId);
    return failure ? new Error(failure) : undefined;
  });

  const isBusy = computed(() => status.value === "submitted" || status.value === "streaming");

  /** eve rejects sends while a session replays; wait rather than drop them. */
  async function whenSendable(text?: string) {
    if (agent.status.value !== "resuming") return;

    queued.value = text ?? "";
    try {
      await new Promise<void>((resolve) => {
        const stop = watch(agent.status, (value) => {
          if (value === "resuming") return;
          stop();
          resolve();
        });
      });
    }
    finally {
      queued.value = undefined;
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    clearTurnFailure(chatId);
    await whenSendable(trimmed);
    await agent.send(trimmed);
  }

  async function respond(responses: AgentInputResponse[]) {
    clearTurnFailure(chatId);
    await whenSendable();
    await agent.respond(responses);
  }

  async function retry() {
    if (isBusy.value) return;

    const text = lastUserMessageText(agent.messages.value);
    if (!text) return;

    clearTurnFailure(chatId);
    await whenSendable(text);
    await agent.send(text);
  }

  return {
    messages,
    status,
    error,
    isBusy,
    send,
    respond,
    retry,
    cancel: agent.cancel,
  };
}
