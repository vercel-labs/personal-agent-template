import type { ThreadRecord } from "#shared/types/thread";
import type { ChatSessionOptions } from "~/composables/chat/types";
import { refreshThreadList } from "~/composables/chat/navigation";

/** Replay a thread's durable session from its start. */
export function resumeOptionsFromThread(thread: ThreadRecord): ChatSessionOptions {
  if (!thread.sessionId) {
    return {};
  }

  return {
    initialSession: { sessionId: thread.sessionId, streamIndex: 0 },
    resume: true,
  };
}

/** Bind a thread to the session eve minted for it. */
export async function persistThreadSession(threadId: string, sessionId: string) {
  await $fetch(`/api/threads/${threadId}`, {
    method: "PATCH",
    body: { sessionId },
  });

  void refreshThreadList();
}
