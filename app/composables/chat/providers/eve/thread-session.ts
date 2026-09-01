import type { ThreadRecord } from "#shared/types/thread";
import type { ChatSessionOptions } from "~/composables/chat/types";
import { refreshThreadList } from "~/composables/chat/navigation";

/**
 * Rehydrate a thread from eve rather than from the app database.
 *
 * A stored session id plus `resume` replays the durable stream from its start,
 * so the app never mirrors the transcript. Threads with no session id have not
 * been sent a message yet and open fresh.
 */
export function resumeOptionsFromThread(thread: ThreadRecord): ChatSessionOptions {
  if (!thread.sessionId) {
    return {};
  }

  return {
    initialSession: { sessionId: thread.sessionId, streamIndex: 0 },
    resume: true,
  };
}

/**
 * Bind a thread to the session eve created for it. eve mints the session on
 * the first message, so this writes once per thread rather than once per turn.
 */
export async function persistThreadSession(threadId: string, sessionId: string) {
  await $fetch(`/api/threads/${threadId}`, {
    method: "PATCH",
    body: { sessionId },
  });

  void refreshThreadList();
}
