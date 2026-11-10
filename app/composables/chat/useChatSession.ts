import type { EveMessage } from "eve/vue";
import type { Answer } from "eve/events";
import type { UIMessage } from "ai";
import type { ThreadRecord } from "#shared/types/thread";
import { clearAuthorizationChallenges, recordAuthorizationEvent } from "~/composables/chat/useAuthorizationChallenges";
import { persistThreadSession, resumeOptionsFromThread } from "~/composables/chat/thread-session";
import { recordStreamEvent } from "~/composables/chat/stream-log";
import { clearTurnFailure, isFailureEvent, recordTurnFailure, turnFailure } from "~/composables/chat/turn-errors";
import { toUIMessages } from "~/utils/chat/eve";

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
 * The bound session can no longer take messages: it ended (idle timeout, a
 * failure, an explicit end) or was built by an eve release this deployment
 * cannot continue. Retrying the same session can never succeed.
 *
 * Matched on eve's stable error codes rather than its error classes: importing
 * `eve/client` at runtime pulls in modules whose internal `#shared/*` imports
 * collide with Nuxt's own `#shared` alias and break the client build.
 */
function isSessionGone(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "session_stranded" || code === "session_expired" || code === "session_not_active";
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

  // `onSessionChange` fires on every cursor advance, and `thread` is a
  // snapshot that never learns the id, so track what has been bound here.
  let boundSessionId = thread.sessionId;

  // Sign-in cards are shared module state; drop what another thread left
  // behind. This thread's own replay rebuilds whatever is still pending.
  clearAuthorizationChallenges();

  const agent = useEveAgent({
    ...initial,
    onSessionChange: (session) => {
      // eve mints the session on the first message; bind it once.
      if (session && session.sessionId !== boundSessionId) {
        const previous = boundSessionId;
        boundSessionId = session.sessionId;
        persistThreadSession(chatId, session.sessionId).catch(() => {
          // Let the next cursor advance try again rather than lose the binding.
          if (boundSessionId === session.sessionId) boundSessionId = previous;
        });
      }
    },
    // Fires for replayed events too, so state derived here rebuilds on reload.
    onEvent: (event) => {
      recordAuthorizationEvent(event);

      // A later turn supersedes an earlier failure, live or replayed.
      if (event.type === "turn.started") clearTurnFailure(chatId);
      if (isFailureEvent(event)) recordTurnFailure(chatId, event);

      if (import.meta.dev) {
        // Only a completed part always names its kind (text, reasoning, …).
        recordStreamEvent(event.type === "content.completed" ? `${event.type}:${event.data.kind}` : event.type);
      }
    },
  });

  // Text held while a send waits for a replay to finish. eve only projects a
  // user message once the turn is handed over, so it is shown here instead —
  // in the transcript, where a sent message belongs.
  const queued = ref<string>();

  const messages = computed(() => {
    const sent = toUIMessages(agent.messages.value);
    if (!queued.value) return sent;

    return [...sent, {
      id: `pending:${chatId}`,
      role: "user",
      parts: [{ type: "text", text: queued.value }],
    } as UIMessage];
  });

  const status = computed<ChatStatus>(() => {
    if (queued.value !== undefined) return "submitted";
    // Replaying a stored session is not an in-flight turn.
    if (agent.status.value === "resuming") return "ready";

    // A dropped stream leaves eve "busy" on the last view it saw. Surface the
    // error instead of streaming forever, so the prompt offers a retry.
    if (agent.error.value && !turnFailure(chatId) && agent.status.value === "busy") return "error";

    if (agent.status.value === "busy") {
      const last = agent.messages.value.at(-1);
      const replying = last?.role === "assistant"
        && last.metadata?.status === "streaming"
        && last.parts.length > 0;
      return replying ? "streaming" : "submitted";
    }

    // A failure leaves eve idle; surface it so the prompt offers a retry.
    // A turn paused on a person (approval, question, sign-in) is idle too.
    return error.value ? "error" : "ready";
  });

  const error = computed(() => {
    // Both are set for a failed turn; the recorded one says what failed.
    const failure = turnFailure(chatId);
    return failure ? new Error(failure) : agent.error.value;
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

  /**
   * Sends to the thread's session, or to a fresh one when that session is
   * gone. `onSessionChange` then rebinds the thread to the new session.
   */
  async function deliver(text: string) {
    try {
      await agent.send(text);
    }
    catch (error) {
      if (!isSessionGone(error)) throw error;
      agent.newSession();
      await agent.send(text);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    clearTurnFailure(chatId);
    await whenSendable(trimmed);
    await deliver(trimmed);
  }

  async function respond(answers: readonly Answer[]) {
    clearTurnFailure(chatId);
    await whenSendable();
    await agent.respond(answers);
  }

  async function retry() {
    if (isBusy.value) return;

    // The turn is still running server-side; only the stream was lost.
    if (agent.status.value === "busy" && !turnFailure(chatId)) {
      await agent.resume();
      return;
    }

    const text = lastUserMessageText(agent.messages.value);
    if (!text) return;

    clearTurnFailure(chatId);
    await whenSendable(text);
    await deliver(text);
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
